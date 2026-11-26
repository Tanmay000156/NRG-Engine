/**
 * NRG ENGINE — COMPILER BACKEND SERVER (LOCAL DEV & PROD)
 * Multi-Language Execution Service powered by Judge0 CE Sandbox & Local Runtimes
 * Hardened with Rate Limiting, CORS Validation & Unified Glassmorphic UI Serving
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { LANGUAGE_REGISTRY, executeCode } = require('./api/_compiler');
const { DEFAULT_SETTINGS, ACCOUNT_ROLES, FONT_FAMILY_OPTIONS, PREDICTOR_LIMITS } = require('./api/_config');
const { predictCode } = require('./api/_predictor');
const { getClientIp, checkRateLimit, applySecurityHeaders } = require('./api/_security');
const interactiveManager = require('./api/_interactive_manager');

const PORT = process.env.PORT || 3000;

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  const reqOrigin = req.headers['origin'] || req.headers['host'] || '';
  applySecurityHeaders(res, reqOrigin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  // 1. Health Endpoint
  if (req.method === 'GET' && (pathname === '/api/health' || pathname === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'NRG Engine Compiler Backend',
      backend: 'Judge0 CE',
      version: '1.0.0',
      supported_languages: Object.keys(LANGUAGE_REGISTRY),
      features: ['real_compiler', 'terminal_ansi', 'multiline_formatting', 'ai_autocomplete', 'python_turtle_graphics', 'universal_graphics_engine', 'rate_limiting', 'sandboxed_execution']
    }));
    return;
  }

  // 2. Git Branch Endpoint
  if (req.method === 'GET' && pathname === '/api/git-branch') {
    const { execSync } = require('child_process');
    try {
      if (!fs.existsSync(path.join(__dirname, '.git'))) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ available: false, branch: 'main' }));
        return;
      }
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        timeout: 1000,
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString().trim();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: true, branch }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: false }));
    }
    return;
  }

  // 2.5 Languages Endpoint
  if (req.method === 'GET' && pathname === '/api/languages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(LANGUAGE_REGISTRY));
    return;
  }

  // 2.6 Centralized Configuration Endpoint
  if (req.method === 'GET' && pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      defaults: DEFAULT_SETTINGS,
      accountRoles: ACCOUNT_ROLES,
      fontFamilies: FONT_FAMILY_OPTIONS,
      predictorLimits: PREDICTOR_LIMITS
    }));
    return;
  }

  // 2.7 Context-Aware AI Code Prediction Endpoint
  if (req.method === 'POST' && pathname === '/api/predict') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 128 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, suggestion: '', error: 'Context payload exceeds limit.' }));
        req.destroy();
      }
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await predictCode({
          language: payload.language,
          prefix: payload.prefix,
          suffix: payload.suffix,
          tabSize: payload.tabSize,
          trigger: payload.trigger,
          aiConfig: payload.aiConfig
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, suggestion: '', source: 'error', error: err.message }));
      }
    });
    return;
  }

  // 3. Execution Endpoint (POST /api/execute - Batch Judge0)
  if (req.method === 'POST' && pathname === '/api/execute') {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        status: { id: 14, description: 'Rate Limit Exceeded' },
        error: rateLimit.error
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 512 * 1024) { // 512 KB max
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large. Limit is 512 KB.' }));
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

  // 3.1 Live Interactive Execution Endpoints
  // Start Session (POST /api/interactive/start)
  if (req.method === 'POST' && pathname === '/api/interactive/start') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 512 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Payload exceeds limit' }));
        req.destroy();
      }
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const sessionRes = await interactiveManager.startSession(payload);
        res.writeHead(sessionRes.success ? 200 : (sessionRes.status?.id === 6 ? 400 : 500), { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sessionRes));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Subscribe to Live Output Stream (GET /api/interactive/stream)
  if (req.method === 'GET' && pathname === '/api/interactive/stream') {
    const sessionId = parsedUrl.searchParams.get('sessionId');
    interactiveManager.subscribeStream(sessionId, res);
    return;
  }

  // Send Input to Running Process (POST /api/interactive/input)
  if (req.method === 'POST' && pathname === '/api/interactive/input') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const inRes = interactiveManager.sendInput(payload.sessionId, payload.input !== undefined ? payload.input : '');
        res.writeHead(inRes.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(inRes));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Terminate Running Process (POST /api/interactive/stop)
  if (req.method === 'POST' && pathname === '/api/interactive/stop') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const stopRes = interactiveManager.stopSession(payload.sessionId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stopRes));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. Static File Server (Root first for live editing, fallback to dist)
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  
  const rootPath = path.join(__dirname, safePath);
  const distPath = path.join(__dirname, 'dist', safePath);
  
  let targetFile = null;
  if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
    targetFile = rootPath;
  } else if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    targetFile = distPath;
  } else if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    targetFile = path.join(__dirname, 'index.html');
  }

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found: ${reqPath}`);
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetFile).pipe(res);
});

// Attach Persistent Interactive WebSocket Server
interactiveManager.attachWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ NRG ENGINE 2.0 — COMPILER BACKEND SERVER ONLINE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔧 Execution Endpoint: http://localhost:${PORT}/api/execute`);
  console.log(`⚡ Interactive WebSocket: ws://localhost:${PORT}/api/interactive/ws`);
  console.log(`🛡 Security: Hardened Sandbox + Rate Limiting Active`);
  console.log(`====================================================`);
});
