const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const os = require('os');
const tmux = require('./tmux');
const html = require('./html');
const { ClaudeStatusStore } = require('./claudeStatus');
const config = require('./config');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const en0 = interfaces.en0;
  if (en0) {
    for (const info of en0) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  // Fallback: first non-internal IPv4
  for (const iface of Object.values(interfaces)) {
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return '127.0.0.1';
}

function escapeJson(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function createServer({ port = 9876, pinEnabled = true, quickButtons = [], appURL = null } = {}) {
  const pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const settingsPin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const authToken = crypto.randomUUID();
  const settingsAuthToken = crypto.randomUUID();
  const macIP = getLocalIP();
  const statusStore = new ClaudeStatusStore();
  const wsClients = new Set();

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth middleware for main page
  function requireAuth(req, res, next) {
    if (!pinEnabled) return next();
    if (req.cookies.tapback_auth === authToken) return next();
    return res.redirect('/auth');
  }

  // Auth middleware for settings (always required, separate PIN)
  function requireSettingsAuth(req, res, next) {
    if (req.cookies.tapback_settings_auth === settingsAuthToken) return next();
    return res.redirect('/settings/auth');
  }

  app.get('/', requireAuth, (req, res) => {
    res.type('html').send(html.mainPage(appURL, quickButtons));
  });

  app.get('/auth', (req, res) => {
    if (!pinEnabled) return res.redirect('/');
    if (req.cookies.tapback_auth === authToken) return res.redirect('/');
    res.type('html').send(html.pinPage(null, '/auth'));
  });

  app.post('/auth', (req, res) => {
    if (!pinEnabled) return res.redirect('/');
    if (req.body.pin === pin) {
      res.cookie('tapback_auth', authToken, { maxAge: 86400000, httpOnly: true });
      return res.redirect('/');
    }
    res.status(401).type('html').send(html.pinPage('Invalid PIN', '/auth'));
  });

  app.get('/settings/auth', (req, res) => {
    if (req.cookies.tapback_settings_auth === settingsAuthToken) return res.redirect('/settings');
    res.type('html').send(html.pinPage(null, '/settings/auth'));
  });

  app.post('/settings/auth', (req, res) => {
    if (req.body.pin === settingsPin) {
      res.cookie('tapback_settings_auth', settingsAuthToken, { maxAge: 86400000, httpOnly: true });
      return res.redirect('/settings');
    }
    res.status(401).type('html').send(html.pinPage('Invalid PIN', '/settings/auth'));
  });

  app.get('/api/sessions', async (req, res) => {
    const sessions = await tmux.listSessions();
    res.json(sessions.map((name) => ({ name })));
  });

  app.post('/api/claude-status', (req, res) => {
    const { session_id, status, project_dir, model } = req.body;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });

    const statusObj = {
      session_id,
      status,
      project_dir,
      model,
      timestamp: new Date().toISOString(),
    };
    statusStore.update(statusObj);

    // Broadcast to all WebSocket clients
    const msg = JSON.stringify({ t: 'status', d: statusObj });
    for (const ws of wsClients) {
      if (ws.readyState === 1) ws.send(msg);
    }

    res.json({ ok: true });
  });

  app.get('/api/claude-status', (req, res) => {
    res.json(statusStore.getAll());
  });

  // Settings page and API (separate PIN auth)
  app.get('/settings', requireSettingsAuth, (req, res) => {
    res.type('html').send(html.settingsPage(config.load()));
  });

  app.get('/api/settings', requireSettingsAuth, (req, res) => {
    res.json(config.load());
  });

  app.put('/api/settings', requireSettingsAuth, (req, res) => {
    const cfg = config.load();
    const body = req.body;

    if (typeof body.pinEnabled === 'boolean') {
      cfg.pinEnabled = body.pinEnabled;
    }
    if (body.addProxy) {
      cfg.proxyPorts[String(body.addProxy.target)] = body.addProxy.external;
    }
    if (typeof body.delProxy === 'number') {
      delete cfg.proxyPorts[String(body.delProxy)];
    }
    if (body.addButton && body.addButton.label && body.addButton.command) {
      cfg.quickButtons.push({ label: body.addButton.label, command: body.addButton.command });
    }
    if (
      typeof body.delButton === 'number' &&
      body.delButton >= 0 &&
      body.delButton < cfg.quickButtons.length
    ) {
      cfg.quickButtons.splice(body.delButton, 1);
    }

    config.save(cfg);
    res.json({ ok: true });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws) => {
    wsClients.add(ws);

    // Send initial output for all tmux sessions
    const sessions = await tmux.listSessions();
    for (const name of sessions) {
      const [output, cpath] = await Promise.all([tmux.capture(name), tmux.getCurrentPath(name)]);
      ws.send(JSON.stringify({ t: 'o', id: name, c: output, path: cpath || '' }));
    }

    // Send initial Claude statuses
    for (const s of statusStore.getAll()) {
      ws.send(JSON.stringify({ t: 'status', d: s }));
    }

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.t === 'i' && msg.id) {
          await tmux.sendKeys(msg.id, msg.c || '');
        }
      } catch {}
    });

    ws.on('close', () => wsClients.delete(ws));
  });

  // Periodic tmux output broadcast
  setInterval(async () => {
    if (wsClients.size === 0) return;
    const sessions = await tmux.listSessions();
    for (const name of sessions) {
      const [output, cpath] = await Promise.all([tmux.capture(name), tmux.getCurrentPath(name)]);
      const msg = JSON.stringify({ t: 'o', id: name, c: output, path: cpath || '' });
      for (const ws of wsClients) {
        if (ws.readyState === 1) ws.send(msg);
      }
    }
  }, 1000);

  server.listen(port, '0.0.0.0');

  return { server, pin, settingsPin, macIP, port };
}

module.exports = { createServer, getLocalIP };
