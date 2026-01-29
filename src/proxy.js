const http = require('http');
const httpProxy = require('http-proxy');

function isTextContent(ct) {
  const l = ct.toLowerCase();
  return (
    l.includes('text/') ||
    l.includes('application/javascript') ||
    l.includes('application/json') ||
    l.includes('application/xml') ||
    l.includes('application/xhtml') ||
    l.includes('+json') ||
    l.includes('+xml')
  );
}

function rewriteLocalhost(text, macIP, allProxyPorts) {
  let result = text;
  for (const [targetPort, externalPort] of Object.entries(allProxyPorts)) {
    const replacements = [
      [`http://localhost:${targetPort}`, `http://${macIP}:${externalPort}`],
      [`https://localhost:${targetPort}`, `https://${macIP}:${externalPort}`],
      [`http://127.0.0.1:${targetPort}`, `http://${macIP}:${externalPort}`],
      [`https://127.0.0.1:${targetPort}`, `https://${macIP}:${externalPort}`],
      [`//localhost:${targetPort}`, `//${macIP}:${externalPort}`],
      [`//127.0.0.1:${targetPort}`, `//${macIP}:${externalPort}`],
      [`'localhost:${targetPort}`, `'${macIP}:${externalPort}`],
      [`"localhost:${targetPort}`, `"${macIP}:${externalPort}`],
      [`'127.0.0.1:${targetPort}`, `'${macIP}:${externalPort}`],
      [`"127.0.0.1:${targetPort}`, `"${macIP}:${externalPort}`],
      [`\`localhost:${targetPort}`, `\`${macIP}:${externalPort}`],
      [`\`127.0.0.1:${targetPort}`, `\`${macIP}:${externalPort}`],
    ];
    for (const [from, to] of replacements) {
      result = result.split(from).join(to);
    }
  }
  return result;
}

function createProxyServer(targetPort, externalPort, macIP, allProxyPorts) {
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${targetPort}`,
    selfHandleResponse: true,
  });

  proxy.on('proxyRes', (proxyRes, req, res) => {
    const ct = proxyRes.headers['content-type'] || '';
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      let body = Buffer.concat(chunks);
      if (isTextContent(ct)) {
        let text = body.toString('utf8');
        text = rewriteLocalhost(text, macIP, allProxyPorts);
        body = Buffer.from(text, 'utf8');
      }
      // Copy headers, skip problematic ones
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        const lk = key.toLowerCase();
        if (!['transfer-encoding', 'connection', 'keep-alive', 'content-encoding'].includes(lk)) {
          res.setHeader(key, value);
        }
      }
      res.setHeader('content-length', body.length);
      res.writeHead(proxyRes.statusCode);
      res.end(body);
    });
  });

  proxy.on('error', (err, req, res) => {
    const errorHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proxy Error</title>
<style>body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
.e{color:#f85149;font-size:1.2rem;margin-bottom:1rem}.m{color:#8b949e;font-size:0.9rem}</style></head>
<body><div><div class="e">localhost:${targetPort} に接続できません</div><div class="m">${err.message}</div></div></body></html>`;
    res.writeHead(502, { 'Content-Type': 'text/html' });
    res.end(errorHTML);
  });

  const server = http.createServer((req, res) => {
    // Rewrite headers for localhost target
    req.headers.host = `localhost:${targetPort}`;
    req.headers.origin = `http://localhost:${targetPort}`;
    req.headers.referer = `http://localhost:${targetPort}/`;
    req.headers['x-forwarded-host'] = macIP;
    req.headers['x-forwarded-proto'] = 'http';
    proxy.web(req, res);
  });

  server.listen(externalPort, '0.0.0.0', () => {
    console.log(`[Tapback] Proxy: port ${externalPort} -> localhost:${targetPort}`);
  });

  return server;
}

module.exports = { createProxyServer };
