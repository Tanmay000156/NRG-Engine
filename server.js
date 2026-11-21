/**
 * NRG ENGINE — COMPILER BACKEND SERVER (LOCAL DEV)
 * Multi-Language Execution Service powered by Judge0 CE Sandbox
 * Compatible with Vercel Serverless Architecture & Python Turtle Graphics
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { LANGUAGE_REGISTRY, executeCode } = require('./api/_compiler');

const PORT = process.env.PORT || 3000;

// Set standard CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Health Endpoint
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'NRG Engine Compiler Backend',
      backend: 'Judge0 CE',
      version: '1.0.0',
      supported_languages: Object.keys(LANGUAGE_REGISTRY),
      features: ['real_compiler', 'terminal_ansi', 'multiline_formatting', 'python_turtle_graphics']
    }));
    return;
  }

  // 2. Languages Endpoint
  if (req.method === 'GET' && pathname === '/api/languages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(LANGUAGE_REGISTRY));
    return;
  }

  // 3. Execution Endpoint (POST /api/execute)
  if (req.method === 'POST' && pathname === '/api/execute') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB max
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await executeCode(payload);
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.data));
      } catch (err) {
        console.error('Execution handler error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Compiler Service Error: ${err.message}`,
          backend_error: true
        }));
      }
    });
    return;
  }

  // 4. Static File Server (Serving NRG Engine UI)
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ NRG ENGINE — COMPILER BACKEND SERVER ONLINE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔧 Execution Endpoint: http://localhost:${PORT}/api/execute`);
  console.log(`🛡 Mode: Real Multi-Language Compiler + Python Turtle Graphics`);
  console.log(`====================================================`);
});
