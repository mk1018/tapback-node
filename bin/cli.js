#!/usr/bin/env node

const { createServer, getLocalIP } = require('../src/server');
const { createProxyServer } = require('../src/proxy');
const { installHooks } = require('../src/claudeStatus');
const config = require('../src/config');

// Load saved config
const cfg = config.load();

// CLI args override config
let port = Number(process.env.PORT) || 9876;
const proxyPorts = { ...cfg.proxyPorts };

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--proxy' && process.argv[i + 1]) {
    const [target, external] = process.argv[++i].split(':').map(Number);
    if (target && external) proxyPorts[String(target)] = external;
  } else if (arg === '--no-pin') {
    cfg.pinEnabled = false;
  } else if (/^\d+$/.test(arg)) {
    port = Number(arg);
  }
}

// Install Claude Code hooks
try {
  installHooks(port);
  console.log('[Tapback] Claude Code hooks installed');
} catch (e) {
  console.warn('[Tapback] Failed to install hooks:', e.message);
}

const macIP = getLocalIP();
const firstExternalPort = Object.values(proxyPorts)[0];

const { pin, settingsPin } = createServer({
  port,
  pinEnabled: cfg.pinEnabled,
  quickButtons: cfg.quickButtons,
  appURL: firstExternalPort ? `http://${macIP}:${firstExternalPort}/` : null,
});

// Start proxy servers
for (const [target, external] of Object.entries(proxyPorts)) {
  createProxyServer(Number(target), Number(external), macIP, proxyPorts);
}

console.log('');
console.log('  Tapback is running!');
console.log(`  URL:          http://${macIP}:${port}/`);
console.log(`  Settings:     http://${macIP}:${port}/settings`);
console.log(`  PIN:          ${pin} ${cfg.pinEnabled ? '' : '(disabled)'}`);
console.log(`  Settings PIN: ${settingsPin}`);
console.log('');

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
