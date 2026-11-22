/**
 * NRG ENGINE 2.0 — DEDICATED PERSISTENT EXECUTION WORKER
 * Independent microservice for live interactive STDIN/STDOUT terminal sessions.
 * Supports: C (GCC unbuffered), C++ (G++ unbuffered), Python 3 (-u unbuffered), Node.js
 */

const http = require('http');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT, 10) || 3001;
const AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN || null;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
const BASE_SESSIONS_DIR = path.join(os.tmpdir(), 'nrg_worker_sessions');

// Ensure base temp directory exists
try {
  if (!fs.existsSync(BASE_SESSIONS_DIR)) {
    fs.mkdirSync(BASE_SESSIONS_DIR, { recursive: true });
  }
} catch (e) {
  console.error('[WORKER] Failed to create sessions dir:', e.message);
}

// Active Sessions map: sessionId -> Session
const activeSessions = new Map();

/**
 * Clean up a session and remove its isolated directory
 */
function cleanupSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
  if (session.inactivityTimer) clearTimeout(session.inactivityTimer);

  // Terminate process if still active
  if (session.child && !session.child.killed && session.child.exitCode === null) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${session.child.pid} /T /F`, () => {});
      } else {
        session.child.kill('SIGKILL');
      }
    } catch (e) {}
  }

  // Close any connected WebSocket clients
  if (session.wsClients) {
    session.wsClients.forEach(ws => {
      try { ws.close(); } catch (e) {}
    });
  }

  // Close SSE subscribers
  if (session.subscribers) {
    session.subscribers.forEach(res => {
      try { res.end(); } catch (e) {}
    });
  }

  // Delete session directory and all its files
  setTimeout(() => {
    if (session.sessionDir && fs.existsSync(session.sessionDir)) {
      try {
        fs.rmSync(session.sessionDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }, 400);

  activeSessions.delete(sessionId);
  console.log(`[WORKER] Session ${sessionId} cleaned up. Active sessions: ${activeSessions.size}`);
}

/**
 * Broadcast event to all WebSocket and SSE listeners of a session
 */
function broadcast(sessionId, eventObj) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  session.history.push(eventObj);

  // Send to WebSockets
  if (session.wsClients && session.wsClients.size > 0) {
    const wsPayload = JSON.stringify(eventObj);
    session.wsClients.forEach(ws => {
      try {
        if (ws.readyState === 1 /* OPEN */) {
          ws.send(wsPayload);
        }
      } catch (e) {}
    });
  }

  // Send to SSE subscribers
  if (session.subscribers && session.subscribers.size > 0) {
    const ssePayload = `data: ${JSON.stringify(eventObj)}\n\n`;
    session.subscribers.forEach(res => {
      try { res.write(ssePayload); } catch (e) {}
    });
  }
}

/**
 * Start a new persistent execution session
 */
async function startSession({ language, source_code }) {
  const sessionId = 'nrg_sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const lang = (language || 'c').toLowerCase();
  const sessionDir = path.join(BASE_SESSIONS_DIR, sessionId);

  try {
    fs.mkdirSync(sessionDir, { recursive: true });
  } catch (err) {
    return { success: false, error: 'Could not create session directory: ' + err.message };
  }

  const session = {
    id: sessionId,
    language: lang,
    sessionDir,
    child: null,
    history: [],
    wsClients: new Set(),
    subscribers: new Set(),
    startedAt: Date.now(),
    timeoutTimer: null,
    inactivityTimer: null
  };

  activeSessions.set(sessionId, session);
  console.log(`[WORKER] Starting session ${sessionId} (${lang}). Total active: ${activeSessions.size}`);

  // Overall execution timeout (max 120 seconds)
  session.timeoutTimer = setTimeout(() => {
    broadcast(sessionId, {
      type: 'stderr',
      data: '\n[NRG Worker] Execution time limit exceeded (120s).\n'
    });
    broadcast(sessionId, {
      type: 'exit',
      code: 124,
      status: 'Time Limit Exceeded'
    });
    cleanupSession(sessionId);
  }, 120000);

  // Inactivity timeout (waiting for user stdin for 60s)
  function touchInactivity() {
    if (session.inactivityTimer) clearTimeout(session.inactivityTimer);
    session.inactivityTimer = setTimeout(() => {
      broadcast(sessionId, {
        type: 'stderr',
        data: '\n[NRG Worker] Input timeout (60s inactivity).\n'
      });
      broadcast(sessionId, {
        type: 'exit',
        code: 125,
        status: 'Inactivity Timeout'
      });
      cleanupSession(sessionId);
    }, 60000);
  }
  touchInactivity();

  try {
    if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const ext = isCpp ? '.cpp' : '.c';
      const compiler = isCpp ? 'g++' : 'gcc';
      const srcFile = path.join(sessionDir, `main${ext}`);
      const exeFile = path.join(sessionDir, process.platform === 'win32' ? 'app.exe' : 'app');

      // Unbuffered constructor to eliminate output buffering for prompts (e.g. printf("Enter number: "))
      let finalSource = source_code;
      if (!source_code.includes('__nrg_unbuffer')) {
        const hook = isCpp
          ? `#include <iostream>\n#include <cstdio>\nstruct __NRG_Init { __NRG_Init() { std::setvbuf(stdout, NULL, _IONBF, 0); std::setvbuf(stderr, NULL, _IONBF, 0); std::ios_base::sync_with_stdio(false); } } __nrg_init;\n`
          : `#include <stdio.h>\n__attribute__((constructor)) static void __nrg_unbuffer() { setvbuf(stdout, NULL, _IONBF, 0); setvbuf(stderr, NULL, _IONBF, 0); }\n`;
        finalSource = hook + source_code;
      }

      fs.writeFileSync(srcFile, finalSource, 'utf8');

      // Compile source
      try {
        execSync(`${compiler} -O0 -o "${exeFile}" "${srcFile}"`, {
          encoding: 'utf8',
          timeout: 15000,
          cwd: sessionDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (compileErr) {
        const compileOut = (compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed').toString();
        cleanupSession(sessionId);
        return {
          success: false,
          sessionId,
          status: { id: 6, description: 'Compilation Error' },
          compile_output: compileOut
        };
      }

      // Spawn persistent executable
      session.child = spawn(exeFile, [], {
        cwd: sessionDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

    } else if (lang === 'python') {
      const srcFile = path.join(sessionDir, 'main.py');
      fs.writeFileSync(srcFile, source_code, 'utf8');

      // Python -u guarantees unbuffered stdin/stdout/stderr
      session.child = spawn('python', ['-u', srcFile], {
        cwd: sessionDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

    } else if (lang === 'javascript') {
      const srcFile = path.join(sessionDir, 'main.js');
      fs.writeFileSync(srcFile, source_code, 'utf8');

      session.child = spawn('node', [srcFile], {
        cwd: sessionDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

    } else {
      cleanupSession(sessionId);
      return {
        success: false,
        error: `Language '${lang}' is not supported for persistent interactive execution. Supported: C, C++, Python, JavaScript.`
      };
    }

    const child = session.child;

    child.stdout.on('data', (chunk) => {
      touchInactivity();
      broadcast(sessionId, {
        type: 'stdout',
        data: chunk.toString()
      });
    });

    child.stderr.on('data', (chunk) => {
      touchInactivity();
      broadcast(sessionId, {
        type: 'stderr',
        data: chunk.toString()
      });
    });

    child.on('error', (err) => {
      broadcast(sessionId, {
        type: 'stderr',
        data: `\n[Process Error]: ${err.message}\n`
      });
    });

    child.on('close', (code, signal) => {
      const durationSec = ((Date.now() - session.startedAt) / 1000).toFixed(3);
      broadcast(sessionId, {
        type: 'exit',
        code: code !== null ? code : (signal ? 1 : 0),
        signal: signal || null,
        duration: durationSec
      });
      cleanupSession(sessionId);
    });

    return {
      success: true,
      sessionId
    };

  } catch (err) {
    cleanupSession(sessionId);
    return {
      success: false,
      error: `Failed to launch execution process: ${err.message}`
    };
  }
}

/**
 * Send user stdin string into running subprocess
 */
function sendInput(sessionId, input) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.child || session.child.exitCode !== null) {
    return { success: false, error: 'Session is not active or has already terminated.' };
  }

  try {
    const formatted = input.endsWith('\n') ? input : (input + '\n');
    session.child.stdin.write(formatted);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Stop and terminate a running session immediately
 */
function stopSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: true, message: 'Session already terminated' };
  }

  broadcast(sessionId, {
    type: 'stderr',
    data: '\n[NRG Worker] Execution terminated by user.\n'
  });
  broadcast(sessionId, {
    type: 'exit',
    code: 143,
    status: 'Terminated by User'
  });

  cleanupSession(sessionId);
  return { success: true };
}

// ============================================================================
// HTTP SERVER & WEBSOCKET DISPATCHER
// ============================================================================

const server = http.createServer((req, res) => {
  // CORS Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS === '*' ? origin : ALLOWED_ORIGINS);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Optional Authentication Check
  if (AUTH_TOKEN) {
    const headerAuth = req.headers['authorization'];
    const queryToken = parsed.query.token;
    const provided = (headerAuth && headerAuth.replace(/^Bearer\s+/i, '')) || queryToken;
    if (provided !== AUTH_TOKEN && pathname !== '/health' && pathname !== '/') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid worker auth token' }));
      return;
    }
  }

  // 1. Healthcheck Endpoint
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'nrg-interactive-worker',
      version: '2.0.0',
      active_sessions: activeSessions.size,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. Worker Status Endpoint
  if (pathname === '/status' || pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      active_sessions: activeSessions.size,
      memory: process.memoryUsage(),
      system: {
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        free_mem_mb: Math.round(os.freemem() / (1024 * 1024))
      }
    }));
    return;
  }

  // 3. Greeting / Root
  if (pathname === '/' || pathname === '') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'NRG Engine 2.0 Persistent Execution Worker',
      status: 'online',
      websocket_endpoints: ['/ws', '/api/interactive/ws'],
      healthcheck: '/health',
      docs: 'https://github.com/Tanmay000156/NRG-Engine'
    }));
    return;
  }

  // 4. HTTP Session Endpoints (Dual Mode Support)
  if (req.method === 'POST' && (pathname === '/api/interactive/start' || pathname === '/start')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await startSession(payload);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/interactive/input' || pathname === '/input')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = sendInput(payload.sessionId, payload.input || '');
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/interactive/stop' || pathname === '/stop')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = stopSession(payload.sessionId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const parsed = url.parse(request.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/ws' || pathname === '/api/interactive/ws') {
    // Check optional token
    if (AUTH_TOKEN) {
      const queryToken = parsed.query.token;
      if (queryToken !== AUTH_TOKEN) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, parsed.query);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, request, query) => {
  let currentSessionId = query?.sessionId || null;

  // Immediately attach to existing session if requested
  if (currentSessionId && activeSessions.has(currentSessionId)) {
    const session = activeSessions.get(currentSessionId);
    session.wsClients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', sessionId: currentSessionId }));
    session.history.forEach(item => ws.send(JSON.stringify(item)));
  }

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'start') {
        const res = await startSession({
          language: msg.language,
          source_code: msg.source_code
        });

        if (res.success) {
          currentSessionId = res.sessionId;
          const session = activeSessions.get(currentSessionId);
          if (session) {
            session.wsClients.add(ws);
          }
          ws.send(JSON.stringify({ type: 'started', sessionId: currentSessionId }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            status: res.status,
            compile_output: res.compile_output,
            error: res.error || 'Execution start failed'
          }));
          ws.send(JSON.stringify({ type: 'exit', code: 1 }));
        }

      } else if (msg.type === 'stdin') {
        const sId = msg.sessionId || currentSessionId;
        if (sId) {
          sendInput(sId, msg.data !== undefined ? msg.data : '');
        }

      } else if (msg.type === 'stop') {
        const sId = msg.sessionId || currentSessionId;
        if (sId) {
          stopSession(sId);
        }

      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (err) {
      console.error('[WORKER WS ERROR]:', err);
      try {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      } catch (e) {}
    }
  });

  ws.on('close', () => {
    if (currentSessionId && activeSessions.has(currentSessionId)) {
      const session = activeSessions.get(currentSessionId);
      session.wsClients.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ NRG ENGINE 2.0 — PERSISTENT EXECUTION WORKER ONLINE`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`⚡ WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`🛡 Session Isolation: ${BASE_SESSIONS_DIR}`);
  console.log(`====================================================`);
});

module.exports = { server, startSession, sendInput, stopSession, cleanupSession, activeSessions };
