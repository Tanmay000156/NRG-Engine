const fs = require('fs');
const serverPath = 'C:/Users/tanma/Desktop/NRG-Engine-main/server.js';
const content = `/**
 * NRG ENGINE 2.0 — COMPILER BACKEND SERVER (LOCAL DEV & PROD)
 * Multi-Language Execution Service powered by Judge0 CE Sandbox
 * Hardened with Rate Limiting, CORS Validation & React Dist Serving
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { LANGUAGE_REGISTRY, executeCode } = require('./api/_compiler');
const { getClientIp, checkRateLimit, applySecurityHeaders } = require('./api/_security');

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

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Health Endpoint
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'NRG Engine 2.0 Compiler Backend',
      backend: 'Judge0 CE',
      version: '2.0.0',
      supported_languages: Object.keys(LANGUAGE_REGISTRY),
      features: ['real_compiler', 'terminal_ansi', 'multiline_formatting', 'python_turtle_graphics', 'universal_graphics_engine', 'rate_limiting', 'sandboxed_execution']
    }));
    return;
  }

  // 2. Git Branch Endpoint
  if (req.method === 'GET' && pathname === '/api/git-branch') {
    const { execSync } = require('child_process');
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { timeout: 1000, cwd: __dirname }).toString().trim();
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

  // 3. Execution Endpoint (POST /api/execute)
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
          error: \`Compiler Service Error: \${err.message}\`,
          backend_error: true
        }));
      }
    });
    return;
  }

  // 4. Static File Server (Prefers dist/ for React build, falls back to root)
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\\.\\.[\\/\\\\])+/, '');
  
  // Check dist first if it exists
  const distPath = path.join(__dirname, 'dist', safePath);
  const rootPath = path.join(__dirname, safePath);
  
  let targetFile = null;
  if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    targetFile = distPath;
  } else if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
    targetFile = rootPath;
  } else if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    // SPA fallback
    targetFile = path.join(__dirname, 'dist', 'index.html');
  }

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(\`404 Not Found: \${reqPath}\`);
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetFile).pipe(res);
});

server.listen(PORT, () => {
  console.log(\`====================================================\`);
  console.log(\`⚡ NRG ENGINE 2.0 — COMPILER BACKEND SERVER ONLINE\`);
  console.log(\`📡 URL: http://localhost:\${PORT}\`);
  console.log(\`🔧 Execution Endpoint: http://localhost:\${PORT}/api/execute\`);
  console.log(\`🛡 Security: Hardened Sandbox + Rate Limiting Active\`);
  console.log(\`====================================================\`);
});
`;

fs.writeFileSync(serverPath, content, 'utf8');
console.log('server.js updated with security & dist serving');
