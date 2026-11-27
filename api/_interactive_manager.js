/**
 * NRG ENGINE — REAL-TIME INTERACTIVE EXECUTION MANAGER & COLLAB ROOM HUB
 * Manages isolated persistent subprocesses (C, C++, Python 3, Node.js) with stripped env,
 * session directory cleanup, concurrency limits, 10s compile / 30s execution timeouts,
 * plus live WebSocket collaboration rooms (/api/collab/ws).
 */

const { spawn, exec, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const { EXECUTION_LIMITS } = require('./_config');
const { buildSandboxedEnv, checkStaticResourceHazards } = require('./_security');
const {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  INACTIVITY_TIMEOUT_MS,
  injectInteractiveUnbuffer,
  buildCompileArgs
} = require('./_cpp_compat');
const { resolvePythonExecutable, hasLocalCommand } = require('./_local_runner');
const { detectGraphics, prepareExecutionCode } = require('./_graphics_bridge');

const activeSessions = new Map();
const collabRooms = new Map(); // roomId -> Set<{ ws, user }>
const TEMP_BASE = path.join(os.tmpdir(), 'nrg_interactive');

if (!fs.existsSync(TEMP_BASE)) {
  try { fs.mkdirSync(TEMP_BASE, { recursive: true, mode: 0o700 }); } catch (_) {}
}

function cleanupSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
  if (session.inactivityTimer) clearTimeout(session.inactivityTimer);

  if (session.wsClients) {
    session.wsClients.forEach(ws => {
      try { ws.close(); } catch (_) {}
    });
  }

  if (session.child && !session.child.killed && session.child.exitCode === null) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${session.child.pid} /T /F`, () => {});
      } else {
        try { process.kill(-session.child.pid, 'SIGKILL'); } catch (_) { session.child.kill('SIGKILL'); }
      }
    } catch (_) {}
  }

  setTimeout(() => {
    if (session.sessionDir && fs.existsSync(session.sessionDir)) {
      try { fs.rmSync(session.sessionDir, { recursive: true, force: true }); } catch (_) {}
    }
  }, 300);

  activeSessions.delete(sessionId);
}

function broadcast(sessionId, eventObj) {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  session.history.push(eventObj);

  const payload = `data: ${JSON.stringify(eventObj)}\n\n`;
  session.subscribers.forEach(res => {
    try { res.write(payload); } catch (_) {}
  });

  if (session.wsClients) {
    const wsPayload = JSON.stringify(eventObj);
    session.wsClients.forEach(ws => {
      try {
        if (ws.readyState === 1) ws.send(wsPayload);
      } catch (_) {}
    });
  }
}

async function startSession({ language, source_code, code }) {
  const rawSource = typeof source_code === 'string' ? source_code : code;
  const lang = (language || 'c').toLowerCase().trim();

  if (typeof rawSource !== 'string') {
    return { success: false, error: 'Missing or invalid source_code parameter.' };
  }
  if (rawSource.length > EXECUTION_LIMITS.MAX_SOURCE_BYTES) {
    return {
      success: false,
      status: { id: 14, description: 'Payload Too Large' },
      error: 'Source code exceeds maximum permitted payload limit (256 KB).'
    };
  }
  if (activeSessions.size >= EXECUTION_LIMITS.MAX_CONCURRENT_SESSIONS) {
    return {
      success: false,
      status: { id: 14, description: 'Worker Busy' },
      error: 'Maximum concurrent execution capacity reached. Try again shortly.'
    };
  }

  const hazard = checkStaticResourceHazards(lang, rawSource);
  if (!hazard.safe) {
    return { success: false, error: hazard.reason };
  }

  const sessionId = 'nrg_sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const sessionDir = path.join(TEMP_BASE, sessionId);
  try {
    fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(path.join(sessionDir, '.mplconfig'), { recursive: true });
  } catch (err) {
    return { success: false, error: 'Failed to prepare isolated sandbox directory: ' + err.message };
  }

  const session = {
    id: sessionId,
    language: lang,
    sessionDir,
    child: null,
    history: [],
    subscribers: new Set(),
    wsClients: new Set(),
    startedAt: Date.now(),
    timeoutTimer: null,
    inactivityTimer: null
  };

  activeSessions.set(sessionId, session);

  session.timeoutTimer = setTimeout(() => {
    broadcast(sessionId, {
      type: 'stderr',
      data: '\n[NRG Engine] Execution timed out after 30 seconds maximum execution limit.\n'
    });
    broadcast(sessionId, { type: 'exit', code: 124, status: 'Time Limit Exceeded' });
    cleanupSession(sessionId);
  }, MAX_EXECUTION_TIMEOUT_MS);

  function touchInactivity() {
    if (session.inactivityTimer) clearTimeout(session.inactivityTimer);
    session.inactivityTimer = setTimeout(() => {
      broadcast(sessionId, {
        type: 'stderr',
        data: '\n[NRG Engine] Terminated due to 30s input inactivity.\n'
      });
      broadcast(sessionId, { type: 'exit', code: 125, status: 'Inactivity Timeout' });
      cleanupSession(sessionId);
    }, INACTIVITY_TIMEOUT_MS);
  }
  touchInactivity();

  const sandboxEnv = buildSandboxedEnv(sessionDir);

  try {
    if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const ext = isCpp ? '.cpp' : '.c';
      const compiler = isCpp ? 'g++' : 'gcc';
      if (!hasLocalCommand(compiler)) {
        cleanupSession(sessionId);
        return { success: false, error: `Compiler '${compiler}' is not available on this host.` };
      }
      const filename = isCpp ? 'main.cpp' : 'main.c';
      const srcPath = path.join(sessionDir, filename);
      const exePath = path.join(sessionDir, process.platform === 'win32' ? 'app.exe' : 'app');
      const finalCode = injectInteractiveUnbuffer(rawSource, isCpp, filename);
      fs.writeFileSync(srcPath, finalCode, 'utf8');

      try {
        execFileSync(compiler, buildCompileArgs(isCpp, srcPath, exePath, '-O0'), {
          encoding: 'utf8',
          cwd: sessionDir,
          env: sandboxEnv,
          timeout: COMPILE_TIMEOUT_MS,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (compileErr) {
        const isTimedOut = compileErr.killed || compileErr.code === 'ETIMEDOUT';
        const rawErr = (compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed').toString();
        const compileOut = isTimedOut ? `Compilation timed out (10s limit exceeded).\n${rawErr}` : rawErr;
        let problems = [];
        try {
          const { parseDiagnostics } = require('./_compiler');
          problems = parseDiagnostics(compileOut, '', lang);
        } catch (_) {}
        cleanupSession(sessionId);
        return {
          success: false,
          sessionId,
          status: { id: 6, description: 'Compilation Error' },
          compile_output: compileOut,
          problems
        };
      }

      session.child = spawn(exePath, [], {
        cwd: sessionDir,
        env: sandboxEnv,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else if (lang === 'python') {
      const pyExe = resolvePythonExecutable();
      if (!pyExe) {
        cleanupSession(sessionId);
        return { success: false, error: 'Python 3 interpreter was not found on this host.' };
      }
      const srcPath = path.join(sessionDir, 'main.py');
      const gfx = detectGraphics('python', rawSource);
      const preparedPy = gfx.isGraphics ? prepareExecutionCode('python', rawSource).code : rawSource;
      fs.writeFileSync(srcPath, preparedPy, 'utf8');

      session.child = spawn(pyExe, ['-u', srcPath], {
        cwd: sessionDir,
        env: sandboxEnv,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else if (lang === 'javascript') {
      const srcPath = path.join(sessionDir, 'script.js');
      fs.writeFileSync(srcPath, rawSource, 'utf8');

      session.child = spawn('node', ['--max-old-space-size=128', srcPath], {
        cwd: sessionDir,
        env: sandboxEnv,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else {
      cleanupSession(sessionId);
      return {
        success: false,
        error: 'Interactive execution supports C, C++, Python, and JavaScript on persistent hosts.'
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
      const durationMs = Date.now() - session.startedAt;
      broadcast(sessionId, {
        type: 'exit',
        code: code !== null ? code : (signal ? 1 : 0),
        signal: signal || null,
        duration: (durationMs / 1000).toFixed(3)
      });
      cleanupSession(sessionId);
    });

    return { success: true, sessionId };
  } catch (err) {
    cleanupSession(sessionId);
    return { success: false, error: `Failed to launch interactive process: ${err.message}` };
  }
}

function subscribeStream(sessionId, res) {
  const session = activeSessions.get(sessionId);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  if (!session) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Session not found or already finished' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'exit', code: 1 })}\n\n`);
    res.end();
    return;
  }
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);
  session.history.forEach(item => res.write(`data: ${JSON.stringify(item)}\n\n`));
  session.subscribers.add(res);
  res.on('close', () => session?.subscribers.delete(res));
}

function sendInput(sessionId, input) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.child || session.child.exitCode !== null) {
    return { success: false, error: 'Execution session is not active or has already terminated.' };
  }
  try {
    const inputStr = typeof input === 'string' ? input : String(input ?? '');
    const formattedInput = inputStr.endsWith('\n') ? inputStr : (inputStr + '\n');
    session.child.stdin.write(formattedInput);
    broadcast(sessionId, { type: 'stdin_echo', data: formattedInput });
    return { success: true };
  } catch (err) {
    return { success: false, error: `Failed to write to stdin: ${err.message}` };
  }
}

function stopSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return { success: true, message: 'Session already terminated' };
  broadcast(sessionId, { type: 'stderr', data: '\n[NRG Engine] Process terminated by user.\n' });
  broadcast(sessionId, { type: 'exit', code: 143, status: 'Terminated' });
  cleanupSession(sessionId);
  return { success: true };
}

function broadcastRoom(roomId, msgObj, senderWs = null) {
  const peers = collabRooms.get(roomId);
  if (!peers) return;
  const payload = JSON.stringify(msgObj);
  peers.forEach(entry => {
    if (entry.ws !== senderWs && entry.ws.readyState === 1) {
      try { entry.ws.send(payload); } catch (_) {}
    }
  });
}

function sendRoomRoster(roomId) {
  const peers = collabRooms.get(roomId);
  if (!peers) return;
  const users = Array.from(peers).map(p => p.user);
  const msg = JSON.stringify({ type: 'roster', roomId, users });
  peers.forEach(entry => {
    if (entry.ws.readyState === 1) {
      try { entry.ws.send(msg); } catch (_) {}
    }
  });
}

function attachWebSocketServer(server) {
  const execWss = new WebSocketServer({ noServer: true });
  const collabWss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsed = new URL(request.url, 'http://localhost');
    if (parsed.pathname === '/api/interactive/ws' || parsed.pathname === '/ws') {
      execWss.handleUpgrade(request, socket, head, (ws) => {
        execWss.emit('connection', ws, request, Object.fromEntries(parsed.searchParams));
      });
    } else if (parsed.pathname === '/api/collab/ws') {
      collabWss.handleUpgrade(request, socket, head, (ws) => {
        collabWss.emit('connection', ws, request, Object.fromEntries(parsed.searchParams));
      });
    } else {
      socket.destroy();
    }
  });

  execWss.on('connection', (ws, _request, query) => {
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
            ws.send(JSON.stringify({
              type: 'error',
              status: res.status,
              compile_output: res.compile_output,
              problems: res.problems || [],
              error: res.error || 'Execution start failed'
            }));
            ws.send(JSON.stringify({ type: 'exit', code: 1 }));
          }
        } else if (msg.type === 'stdin') {
          const sId = msg.sessionId || currentSessionId;
          if (sId) sendInput(sId, msg.data !== undefined ? msg.data : '');
        } else if (msg.type === 'stop') {
          const sId = msg.sessionId || currentSessionId;
          if (sId) stopSession(sId);
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

  // Real Multi-Client WebSocket Collaboration Rooms
  collabWss.on('connection', (ws, _request, query) => {
    const roomId = String(query?.room || 'NRG-STUDIO').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'NRG-STUDIO';
    const entry = {
      ws,
      user: {
        id: 'peer_' + Math.random().toString(36).slice(2, 8),
        name: String(query?.name || 'Developer').slice(0, 40),
        role: String(query?.role || 'Collaborator').slice(0, 32),
        line: 1
      }
    };
    if (!collabRooms.has(roomId)) collabRooms.set(roomId, new Set());
    collabRooms.get(roomId).add(entry);
    ws.send(JSON.stringify({ type: 'joined', roomId, selfId: entry.user.id }));
    sendRoomRoster(roomId);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'presence') {
          if (msg.name) entry.user.name = String(msg.name).slice(0, 40);
          if (msg.role) entry.user.role = String(msg.role).slice(0, 32);
          if (msg.line) entry.user.line = parseInt(msg.line, 10) || 1;
          sendRoomRoster(roomId);
        } else if (msg.type === 'chat' && msg.text) {
          broadcastRoom(roomId, {
            type: 'chat',
            from: entry.user.name,
            role: entry.user.role,
            text: String(msg.text).slice(0, 1000),
            timestamp: Date.now()
          }, ws);
        } else if (msg.type === 'code_sync' && typeof msg.code === 'string') {
          broadcastRoom(roomId, {
            type: 'code_sync',
            from: entry.user.name,
            lang: String(msg.lang || 'c'),
            fileName: String(msg.fileName || 'main.c'),
            code: msg.code.slice(0, 262144),
            timestamp: Date.now()
          }, ws);
        }
      } catch (_) {}
    });

    ws.on('close', () => {
      const peers = collabRooms.get(roomId);
      if (peers) {
        peers.delete(entry);
        if (peers.size === 0) collabRooms.delete(roomId);
        else sendRoomRoster(roomId);
      }
    });
  });

  return execWss;
}

module.exports = {
  startSession,
  subscribeStream,
  sendInput,
  stopSession,
  attachWebSocketServer,
  activeSessions,
  collabRooms
};
