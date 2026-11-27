/**
 * NRG ENGINE — DEDICATED PERSISTENT EXECUTION WORKER
 * Independent microservice for live interactive STDIN/STDOUT terminal sessions.
 * Enforces stripped sandboxed environment variables, per-session temp directory isolation,
 * fork-bomb prechecks, 10s compile timeout, and 30s execution limits.
 */

const http = require('http');
const { spawn, exec, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

let cppCompat = null;
try { cppCompat = require('../api/_cpp_compat'); } catch (_) {}
let localRunner = null;
try { localRunner = require('../api/_local_runner'); } catch (_) {}
let secMod = null;
try { secMod = require('../api/_security'); } catch (_) {}

const COMPILE_TIMEOUT_MS = cppCompat ? cppCompat.COMPILE_TIMEOUT_MS : 10000;
const MAX_EXECUTION_TIMEOUT_MS = cppCompat ? cppCompat.MAX_EXECUTION_TIMEOUT_MS : 30000;
const INACTIVITY_TIMEOUT_MS = cppCompat ? cppCompat.INACTIVITY_TIMEOUT_MS : 30000;
const MAX_SESSIONS = 25;

function buildSafeWorkerEnv(sessionDir) {
  if (secMod && typeof secMod.buildSandboxedEnv === 'function') {
    return secMod.buildSandboxedEnv(sessionDir);
  }
  const env = {
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    HOME: sessionDir,
    TMPDIR: sessionDir,
    TEMP: sessionDir,
    TMP: sessionDir,
    MPLCONFIGDIR: path.join(sessionDir, '.mplconfig'),
    MPLBACKEND: 'Agg',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUNBUFFERED: '1',
    NODE_NO_WARNINGS: '1',
    LANG: 'C.UTF-8'
  };
  if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  return env;
}

function resolvePythonBin() {
  if (localRunner && typeof localRunner.resolvePythonExecutable === 'function') {
    const p = localRunner.resolvePythonExecutable();
    if (p) return p;
  }
  const candidates = process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
  for (const cmd of candidates) {
    try {
      const v = execFileSync(cmd, ['--version'], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'pipe'] });
      if (/Python\s+3\./i.test(v)) return cmd;
    } catch (_) {}
  }
  return 'python';
}

const PORT = parseInt(process.env.PORT, 10) || 3001;
const AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN || null;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
const BASE_SESSIONS_DIR = path.join(os.tmpdir(), 'nrg_worker_sessions');

try {
  if (!fs.existsSync(BASE_SESSIONS_DIR)) {
    fs.mkdirSync(BASE_SESSIONS_DIR, { recursive: true, mode: 0o700 });
  }
} catch (e) {
  console.error('[WORKER] Failed to create sessions dir:', e.message);
}

const activeSessions = new Map();

function cleanupSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
  if (session.inactivityTimer) clearTimeout(session.inactivityTimer);

  if (session.child && !session.child.killed && session.child.exitCode === null) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${session.child.pid} /T /F`, () => {});
      } else {
        try { process.kill(-session.child.pid, 'SIGKILL'); } catch (_) { session.child.kill('SIGKILL'); }
      }
    } catch (_) {}
  }

  if (session.wsClients) {
    session.wsClients.forEach(ws => { try { ws.close(); } catch (_) {} });
  }
  if (session.subscribers) {
    session.subscribers.forEach(res => { try { res.end(); } catch (_) {} });
  }

  setTimeout(() => {
    if (session.sessionDir && fs.existsSync(session.sessionDir)) {
      try { fs.rmSync(session.sessionDir, { recursive: true, force: true }); } catch (_) {}
    }
  }, 400);

  activeSessions.delete(sessionId);
}

function broadcast(sessionId, eventObj) {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  session.history.push(eventObj);

  if (session.wsClients && session.wsClients.size > 0) {
    const wsPayload = JSON.stringify(eventObj);
    session.wsClients.forEach(ws => {
      try { if (ws.readyState === 1) ws.send(wsPayload); } catch (_) {}
    });
  }
  if (session.subscribers && session.subscribers.size > 0) {
    const ssePayload = `data: ${JSON.stringify(eventObj)}\n\n`;
    session.subscribers.forEach(res => {
      try { res.write(ssePayload); } catch (_) {}
    });
  }
}

async function startSession({ language, source_code, code }) {
  const rawSource = typeof source_code === 'string' ? source_code : code;
  if (typeof rawSource !== 'string') {
    return { success: false, error: 'Missing or invalid source_code payload.' };
  }
  if (rawSource.length > 262144) {
    return { success: false, status: { id: 14, description: 'Payload Too Large' }, error: 'Source code exceeds 256 KB limit.' };
  }
  if (activeSessions.size >= MAX_SESSIONS) {
    return { success: false, status: { id: 14, description: 'Worker Busy' }, error: 'Worker concurrency limit reached. Retry shortly.' };
  }

  const lang = (language || 'c').toLowerCase().trim();
  if (secMod && typeof secMod.checkStaticResourceHazards === 'function') {
    const h = secMod.checkStaticResourceHazards(lang, rawSource);
    if (!h.safe) return { success: false, error: h.reason };
  }

  const sessionId = 'nrg_sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const sessionDir = path.join(BASE_SESSIONS_DIR, sessionId);

  try {
    fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(path.join(sessionDir, '.mplconfig'), { recursive: true });
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

  session.timeoutTimer = setTimeout(() => {
    broadcast(sessionId, { type: 'stderr', data: '\n[NRG Worker] Execution time limit exceeded (30s).\n' });
    broadcast(sessionId, { type: 'exit', code: 124, status: 'Time Limit Exceeded' });
    cleanupSession(sessionId);
  }, MAX_EXECUTION_TIMEOUT_MS);

  function touchInactivity() {
    if (session.inactivityTimer) clearTimeout(session.inactivityTimer);
    session.inactivityTimer = setTimeout(() => {
      broadcast(sessionId, { type: 'stderr', data: '\n[NRG Worker] Input timeout (30s inactivity).\n' });
      broadcast(sessionId, { type: 'exit', code: 125, status: 'Inactivity Timeout' });
      cleanupSession(sessionId);
    }, INACTIVITY_TIMEOUT_MS);
  }
  touchInactivity();

  const sandboxEnv = buildSafeWorkerEnv(sessionDir);

  try {
    if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const ext = isCpp ? '.cpp' : '.c';
      const compiler = isCpp ? 'g++' : 'gcc';
      const filename = `main${ext}`;
      const srcFile = path.join(sessionDir, filename);
      const exeFile = path.join(sessionDir, process.platform === 'win32' ? 'app.exe' : 'app');

      let finalSource = rawSource;
      if (cppCompat && typeof cppCompat.injectInteractiveUnbuffer === 'function') {
        finalSource = cppCompat.injectInteractiveUnbuffer(rawSource, isCpp, filename);
      } else if (!rawSource.includes('__nrg_unbuffer')) {
        const hook = isCpp
          ? `#include <iostream>\n#include <cstdio>\nstruct __NRG_Init { __NRG_Init() { std::setvbuf(stdout, NULL, _IONBF, 0); std::setvbuf(stderr, NULL, _IONBF, 0); std::ios_base::sync_with_stdio(false); } } __nrg_init;\n#line 1 "${filename}"\n`
          : `#include <stdio.h>\n__attribute__((constructor)) static void __nrg_unbuffer() { setvbuf(stdout, NULL, _IONBF, 0); setvbuf(stderr, NULL, _IONBF, 0); }\n#line 1 "${filename}"\n`;
        finalSource = hook + rawSource;
      }

      fs.writeFileSync(srcFile, finalSource, 'utf8');
      const compileArgs = cppCompat && typeof cppCompat.buildCompileArgs === 'function'
        ? cppCompat.buildCompileArgs(isCpp, srcFile, exeFile, '-O0')
        : (isCpp ? ['-O0', '-std=c++17', srcFile, '-o', exeFile, '-lm'] : ['-O0', srcFile, '-o', exeFile, '-lm']);

      try {
        execFileSync(compiler, compileArgs, {
          encoding: 'utf8',
          timeout: COMPILE_TIMEOUT_MS,
          cwd: sessionDir,
          env: sandboxEnv,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (compileErr) {
        const isTimedOut = compileErr.killed || compileErr.code === 'ETIMEDOUT';
        const rawErr = (compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed').toString();
        const compileOut = isTimedOut ? `Compilation timed out (10s limit exceeded).\n${rawErr}` : rawErr;
        cleanupSession(sessionId);
        return {
          success: false,
          sessionId,
          status: { id: 6, description: 'Compilation Error' },
          compile_output: compileOut
        };
      }

      session.child = spawn(exeFile, [], {
        cwd: sessionDir,
        env: sandboxEnv,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else if (lang === 'python') {
      const srcFile = path.join(sessionDir, 'main.py');
      fs.writeFileSync(srcFile, rawSource, 'utf8');

      session.child = spawn(resolvePythonBin(), ['-u', srcFile], {
        cwd: sessionDir,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: sandboxEnv
      });
    } else if (lang === 'javascript') {
      const srcFile = path.join(sessionDir, 'main.js');
      fs.writeFileSync(srcFile, rawSource, 'utf8');

      session.child = spawn('node', ['--max-old-space-size=128', srcFile], {
        cwd: sessionDir,
        env: sandboxEnv,
        detached: process.platform !== 'win32',
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
      broadcast(sessionId, { type: 'stdout', data: chunk.toString() });
    });
    child.stderr.on('data', (chunk) => {
      touchInactivity();
      broadcast(sessionId, { type: 'stderr', data: chunk.toString() });
    });
    child.on('error', (err) => {
      broadcast(sessionId, { type: 'stderr', data: `\n[Process Error]: ${err.message}\n` });
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

    return { success: true, sessionId };
  } catch (err) {
    cleanupSession(sessionId);
    return { success: false, error: `Failed to launch execution process: ${err.message}` };
  }
}

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

function stopSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return { success: true, message: 'Session already terminated' };
  broadcast(sessionId, { type: 'stderr', data: '\n[NRG Worker] Execution terminated by user.\n' });
  broadcast(sessionId, { type: 'exit', code: 143, status: 'Terminated by User' });
  cleanupSession(sessionId);
  return { success: true };
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS === '*' ? origin : ALLOWED_ORIGINS);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = new URL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  if (AUTH_TOKEN) {
    const headerAuth = req.headers['authorization'];
    const queryToken = parsed.searchParams.get('token');
    const provided = (headerAuth && headerAuth.replace(/^Bearer\s+/i, '')) || queryToken;
    if (provided !== AUTH_TOKEN && pathname !== '/health' && pathname !== '/') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid worker auth token' }));
      return;
    }
  }

  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'nrg-interactive-worker',
      version: '1.0.0',
      active_sessions: activeSessions.size,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

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

  if (pathname === '/' || pathname === '') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'NRG Engine Persistent Execution Worker',
      studio: 'NRG CoreX Studios',
      status: 'online',
      websocket_endpoints: ['/ws', '/api/interactive/ws'],
      healthcheck: '/health',
      docs: 'https://github.com/Tanmay000156/NRG-Engine'
    }));
    return;
  }

  const readJson = () => new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 512 * 1024) {
        try { req.destroy(); } catch (_) {}
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });

  if (req.method === 'POST' && (pathname === '/api/interactive/start' || pathname === '/start')) {
    readJson().then(async payload => {
      const result = await startSession(payload);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/interactive/input' || pathname === '/input')) {
    readJson().then(payload => {
      const result = sendInput(payload.sessionId, payload.input || '');
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/interactive/stop' || pathname === '/stop')) {
    readJson().then(payload => {
      const result = stopSession(payload.sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  const parsed = new URL(request.url, 'http://localhost');
  if (parsed.pathname === '/ws' || parsed.pathname === '/api/interactive/ws') {
    if (AUTH_TOKEN && parsed.searchParams.get('token') !== AUTH_TOKEN) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, Object.fromEntries(parsed.searchParams));
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, _request, query) => {
  let currentSessionId = query?.sessionId || null;
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
          source_code: msg.source_code !== undefined ? msg.source_code : msg.code
        });
        if (res.success) {
          currentSessionId = res.sessionId;
          const session = activeSessions.get(currentSessionId);
          if (session) session.wsClients.add(ws);
          ws.send(JSON.stringify({ type: 'started', sessionId: currentSessionId }));
        } else {
          ws.send(JSON.stringify({ type: 'error', status: res.status, compile_output: res.compile_output, error: res.error || 'Execution start failed' }));
          ws.send(JSON.stringify({ type: 'exit', code: 1 }));
        }
      } else if (msg.type === 'stdin') {
        const sId = msg.sessionId || currentSessionId;
        if (sId) sendInput(sId, msg.data !== undefined ? msg.data : '');
      } else if (msg.type === 'stop') {
        const sId = msg.sessionId || currentSessionId;
        if (sId) stopSession(sId);
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (err) {
      try { ws.send(JSON.stringify({ type: 'error', message: err.message })); } catch (_) {}
    }
  });

  ws.on('close', () => {
    if (currentSessionId && activeSessions.has(currentSessionId)) {
      activeSessions.get(currentSessionId).wsClients.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`⚡ NRG Engine Persistent Execution Worker online on port ${PORT} (NRG CoreX Studios)`);
});

module.exports = { server, startSession, sendInput, stopSession, cleanupSession, activeSessions };
