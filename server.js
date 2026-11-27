/**
 * NRG ENGINE — UNIFIED HTTP & WEBSOCKET SERVER (LOCAL & RENDER PRODUCTION)
 * Routes API traffic through shared modular handlers under ./api/* with strict
 * rate limiting, signed session cookies, sandboxed execution, and safe static serving.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load local .env / .env.local if present without overwriting existing environment variables
function loadLocalEnvFiles() {
  for (const envName of ['.env', '.env.local']) {
    const envPath = path.join(__dirname, envName);
    if (!fs.existsSync(envPath)) continue;
    try {
      const raw = fs.readFileSync(envPath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    } catch (_) {}
  }
}
loadLocalEnvFiles();

const healthHandler = require('./api/health');
const languagesHandler = require('./api/languages');
const configHandler = require('./api/config');
const predictHandler = require('./api/predict');
const executeHandler = require('./api/execute');
const aiAssistHandler = require('./api/ai-assist');
const diagnosticsHandler = require('./api/diagnostics');
const authHandler = require('./api/auth');
const projectsHandler = require('./api/projects');
const gitBranchHandler = require('./api/git-branch');

const { BRAND_IDENTITY } = require('./api/_config');
const { applySecurityHeaders, parseBody, checkRateLimit, getClientIp } = require('./api/_security');
const interactiveManager = require('./api/_interactive_manager');

const PORT = process.env.PORT || 3000;

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

const server = http.createServer(async (req, res) => {
  const reqOrigin = req.headers['origin'] || '';
  applySecurityHeaders(res, reqOrigin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  // API Routing (single source of truth shared with Vercel serverless handlers)
  if (pathname === '/api/health' || pathname === '/health') return healthHandler(req, res);
  if (pathname === '/api/languages') return languagesHandler(req, res);
  if (pathname === '/api/config') return configHandler(req, res);
  if (pathname === '/api/git-branch') return gitBranchHandler(req, res);
  if (pathname === '/api/predict') return predictHandler(req, res);
  if (pathname === '/api/execute') return executeHandler(req, res);
  if (
    pathname === '/api/ai/assist' ||
    pathname === '/api/ai-assist' ||
    pathname === '/api/ai/chat' ||
    pathname === '/api/ai/status' ||
    pathname === '/api/ai/test'
  ) {
    return aiAssistHandler(req, res);
  }
  if (pathname === '/api/diagnostics') return diagnosticsHandler(req, res);
  if (pathname === '/api/auth' || pathname === '/api/auth/session') return authHandler(req, res);
  if (pathname === '/api/projects') return projectsHandler(req, res);

  // Interactive Execution Endpoints (Mode B Persistent WebSocket / SSE)
  if (req.method === 'POST' && pathname === '/api/interactive/start') {
    const limit = checkRateLimit(getClientIp(req), 'interactive');
    if (!limit.allowed) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: limit.error }));
      return;
    }
    try {
      const payload = await parseBody(req, 512 * 1024);
      const sessionRes = await interactiveManager.startSession(payload);
      res.writeHead(sessionRes.success ? 200 : (sessionRes.status?.id === 6 ? 400 : 500), { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sessionRes));
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/interactive/stream') {
    interactiveManager.subscribeStream(parsedUrl.searchParams.get('sessionId'), res);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/interactive/input') {
    try {
      const payload = await parseBody(req, 64 * 1024);
      const inRes = interactiveManager.sendInput(payload.sessionId, payload.input !== undefined ? payload.input : '');
      res.writeHead(inRes.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(inRes));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/interactive/stop') {
    try {
      const payload = await parseBody(req, 16 * 1024);
      const stopRes = interactiveManager.stopSession(payload.sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stopRes));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Unknown /api/* route should return JSON 404 rather than leaking index.html
  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: `API route not found: ${pathname}` }));
    return;
  }

  // Static Asset Serving with Strict Public Allowlist & Sensitive Path Protection
  let reqPath = pathname === '/' || pathname === '' ? '/index.html' : pathname;
  let decodedPath = reqPath;
  try {
    decodedPath = decodeURIComponent(reqPath);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }
  const normalized = path.posix.normalize(decodedPath).replace(/^\/+/, '');
  const lowerNorm = normalized.toLowerCase();

  // Explicitly deny traversal, hidden dotfiles, backend source, configs & test suites
  const blockedPrefixes = ['.git', '.nrg_data', '.env', '.agents', '.playwright', 'node_modules', 'api/', 'worker/', 'tests/', '.vercel'];
  const blockedRootFiles = new Set([
    'server.js', 'package.json', 'package-lock.json', 'requirements.txt',
    'vite.config.js', 'render.yaml', 'vercel.json', 'dockerfile',
    'docker-compose.yml', 'skills-lock.json', 'start_nrg_engine.bat'
  ]);
  if (
    normalized.includes('..') ||
    lowerNorm.startsWith('.') ||
    blockedRootFiles.has(lowerNorm) ||
    blockedPrefixes.some(p => lowerNorm === p.replace(/\/$/, '') || lowerNorm.startsWith(p))
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const publicDir = path.resolve(__dirname, 'public') + path.sep;
  const distDir = path.resolve(__dirname, 'dist') + path.sep;
  const assetsDir = path.resolve(__dirname, 'assets') + path.sep;

  const publicCandidate = path.resolve(__dirname, 'public', normalized);
  const distCandidate = path.resolve(__dirname, 'dist', normalized);
  const assetsCandidate = path.resolve(__dirname, normalized);

  let targetFile = null;
  if (lowerNorm === 'index.html' && fs.existsSync(path.join(__dirname, 'index.html'))) {
    targetFile = path.join(__dirname, 'index.html');
  } else if (lowerNorm.startsWith('assets/') && assetsCandidate.startsWith(assetsDir) && fs.existsSync(assetsCandidate) && fs.statSync(assetsCandidate).isFile()) {
    targetFile = assetsCandidate;
  } else if (publicCandidate.startsWith(publicDir) && fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
    targetFile = publicCandidate;
  } else if (distCandidate.startsWith(distDir) && fs.existsSync(distCandidate) && fs.statSync(distCandidate).isFile()) {
    targetFile = distCandidate;
  } else if (!normalized.includes('.') && fs.existsSync(path.join(__dirname, 'index.html'))) {
    targetFile = path.join(__dirname, 'index.html');
  }

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found: ${reqPath}`);
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  applySecurityHeaders(res, reqOrigin, { isHtml: ext === '.html' });
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetFile).pipe(res);
});

interactiveManager.attachWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ ${BRAND_IDENTITY.productName} — ${BRAND_IDENTITY.studioName}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔧 Execution: /api/execute | AI: /api/predict & /api/ai/assist`);
  console.log(`🛡 Security: Isolated Env + Signed Sessions + Rate Limiting`);
  console.log(`====================================================`);
});

module.exports = server;
