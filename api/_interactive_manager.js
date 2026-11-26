/**
 * NRG ENGINE — REAL-TIME INTERACTIVE EXECUTION MANAGER
 * Provides persistent subprocess management for live interactive stdin/stdout
 * Supports: C (GCC), C++ (G++), Python 3 (-u unbuffered), JavaScript (Node.js)
 */

const { spawn, exec, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  INACTIVITY_TIMEOUT_MS,
  injectInteractiveUnbuffer,
  buildCompileArgs
} = require('./_cpp_compat');
const { resolvePythonExecutable, hasLocalCommand } = require('./_local_runner');
const { detectGraphics, prepareExecutionCode } = require('./_graphics_bridge');

// Active sessions map: sessionId -> SessionState
const activeSessions = new Map();

// Temp directory for code and executables
const TEMP_DIR = path.join(os.tmpdir(), 'nrg_interactive');
if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create interactive temp dir:', e);
  }
}

/**
 * Clean up session files and process
 */
function cleanupSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  if (session.timeoutTimer) {
    clearTimeout(session.timeoutTimer);
  }
  if (session.inactivityTimer) {
    clearTimeout(session.inactivityTimer);
  }

  // Close any connected WebSocket clients
  if (session.wsClients) {
    session.wsClients.forEach(ws => {
      try { ws.close(); } catch (e) {}
    });
  }

  // Terminate process if still running
  if (session.child && !session.child.killed && session.child.exitCode === null) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${session.child.pid} /T /F`, () => {});
      } else {
        session.child.kill('SIGKILL');
      }
    } catch (e) {}
  }

  // Delete temp files after a short delay to allow file handles to release
  setTimeout(() => {
    if (session.files && Array.isArray(session.files)) {
      session.files.forEach(f => {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch (e) {}
      });
    }
  }, 300);

  activeSessions.delete(sessionId);
}

/**
 * Broadcast event to all SSE subscribers of a session
 */
function broadcast(sessionId, eventObj) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  // Append to history buffer so new connections get past output
  session.history.push(eventObj);

  // SSE subscribers
  const payload = `data: ${JSON.stringify(eventObj)}\n\n`;
  session.subscribers.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {}
  });

  // WebSocket subscribers
  if (session.wsClients) {
    const wsPayload = JSON.stringify(eventObj);
    session.wsClients.forEach(ws => {
      try {
        if (ws.readyState === 1 /* OPEN */) {
          ws.send(wsPayload);
        }
      } catch (e) {}
    });
  }
}

/**
 * Start a new interactive execution session
 */
async function startSession({ language, source_code, code }) {
  const rawSource = typeof source_code === 'string' ? source_code : code;
  const lang = (language || 'c').toLowerCase().trim();

  if (typeof rawSource !== 'string' || !rawSource.length && rawSource !== '') {
    return {
      success: false,
      error: 'Missing or invalid source_code parameter.'
    };
  }
  if (rawSource.length > 262144) {
    return {
      success: false,
      status: { id: 14, description: 'Payload Too Large' },
      error: 'Source code exceeds maximum permitted payload limit (256 KB).'
    };
  }

  const sessionId = 'nrg_sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  const session = {
    id: sessionId,
    language: lang,
    child: null,
    files: [],
    history: [],
    subscribers: new Set(),
    wsClients: new Set(),
    startedAt: Date.now(),
    waitingForInput: false,
    timeoutTimer: null,
    inactivityTimer: null
  };

  activeSessions.set(sessionId, session);

  // Set max overall execution timeout: 30s
  session.timeoutTimer = setTimeout(() => {
    broadcast(sessionId, {
      type: 'stderr',
      data: '\n[NRG Engine] Execution timed out after 30 seconds maximum execution limit.\n'
    });
    broadcast(sessionId, {
      type: 'exit',
      code: 124,
      status: 'Time Limit Exceeded'
    });
    cleanupSession(sessionId);
  }, MAX_EXECUTION_TIMEOUT_MS);

  // Reset inactivity timer (waiting for input)
  function touchInactivity() {
    if (session.inactivityTimer) clearTimeout(session.inactivityTimer);
    session.inactivityTimer = setTimeout(() => {
      broadcast(sessionId, {
        type: 'stderr',
        data: '\n[NRG Engine] Terminated due to 30s input inactivity.\n'
      });
      broadcast(sessionId, {
        type: 'exit',
        code: 125,
        status: 'Inactivity Timeout'
      });
      cleanupSession(sessionId);
    }, INACTIVITY_TIMEOUT_MS);
  }
  touchInactivity();

  // Handle language preparation and spawning
  try {
    if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const ext = isCpp ? '.cpp' : '.c';
      const compiler = isCpp ? 'g++' : 'gcc';
      if (!hasLocalCommand(compiler)) {
        cleanupSession(sessionId);
        return {
          success: false,
          error: `Compiler '${compiler}' is not available on this host.`
        };
      }
      const filename = isCpp ? 'main.cpp' : 'main.c';
      const srcPath = path.join(TEMP_DIR, `${sessionId}${ext}`);
      const exeExt = process.platform === 'win32' ? '.exe' : '';
      const exePath = path.join(TEMP_DIR, `${sessionId}${exeExt}`);
      session.files.push(srcPath, exePath);

      // Apply portable <conio.h> compat + unbuffered stdio hook preserving line numbers
      const finalCode = injectInteractiveUnbuffer(rawSource, isCpp, filename);
      fs.writeFileSync(srcPath, finalCode, 'utf8');

      // Compile synchronously with strict 10s compilation timeout & -lm / -std=c++17
      try {
        execFileSync(compiler, buildCompileArgs(isCpp, srcPath, exePath, '-O0'), {
          encoding: 'utf8',
          cwd: TEMP_DIR,
          timeout: COMPILE_TIMEOUT_MS,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (compileErr) {
        const isTimedOut = compileErr.killed || compileErr.code === 'ETIMEDOUT';
        const rawErr = (compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed').toString();
        const compileOut = isTimedOut
          ? `Compilation timed out (10s limit exceeded).\n${rawErr}`
          : rawErr;
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

      // Spawn compiled executable
      const child = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: TEMP_DIR
      });
      session.child = child;

    } else if (lang === 'python') {
      const pyExe = resolvePythonExecutable();
      if (!pyExe) {
        cleanupSession(sessionId);
        return {
          success: false,
          error: 'Python 3 interpreter was not found on this host.'
        };
      }
      const srcPath = path.join(TEMP_DIR, `${sessionId}.py`);
      session.files.push(srcPath);
      const gfx = detectGraphics('python', rawSource);
      const preparedPy = gfx.isGraphics ? prepareExecutionCode('python', rawSource).code : rawSource;
      fs.writeFileSync(srcPath, preparedPy, 'utf8');

      // Spawn python with -u (unbuffered) and headless Matplotlib backend
      const child = spawn(pyExe, ['-u', srcPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: TEMP_DIR,
        env: {
          ...process.env,
          MPLBACKEND: 'Agg',
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1'
        }
      });
      session.child = child;

    } else if (lang === 'javascript') {
      const srcPath = path.join(TEMP_DIR, `${sessionId}.js`);
      session.files.push(srcPath);
      fs.writeFileSync(srcPath, rawSource, 'utf8');

      const child = spawn('node', [srcPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: TEMP_DIR
      });
      session.child = child;

    } else {
      cleanupSession(sessionId);
      return {
        success: false,
        error: `Interactive execution currently supports C, C++, Python, and JavaScript on this host.`
      };
    }

    // Attach stream handlers to child process
    const child = session.child;

    child.stdout.on('data', (chunk) => {
      touchInactivity();
      const text = chunk.toString();
      broadcast(sessionId, {
        type: 'stdout',
        data: text
      });
    });

    child.stderr.on('data', (chunk) => {
      touchInactivity();
      const text = chunk.toString();
      broadcast(sessionId, {
        type: 'stderr',
        data: text
      });
    });

    child.on('error', (err) => {
      broadcast(sessionId, {
        type: 'stderr',
        data: `\n[Process Error]: ${err.message}\n`
      });
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

    return {
      success: true,
      sessionId
    };

  } catch (err) {
    cleanupSession(sessionId);
    return {
      success: false,
      error: `Failed to launch interactive process: ${err.message}`
    };
  }
}

/**
 * Subscribe an HTTP response stream (SSE) to a session
 */
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

  // Send initial session handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Flush any history already generated
  session.history.forEach(item => {
    res.write(`data: ${JSON.stringify(item)}\n\n`);
  });

  session.subscribers.add(res);

  res.on('close', () => {
    if (session) {
      session.subscribers.delete(res);
    }
  });
}

/**
 * Write input into the running child process stdin
 */
function sendInput(sessionId, input) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.child || session.child.exitCode !== null) {
    console.log('[MANAGER SEND INPUT FAILED: Session not active]', sessionId);
    return {
      success: false,
      error: 'Execution session is not active or has already terminated.'
    };
  }

  try {
    const inputStr = typeof input === 'string' ? input : String(input ?? '');
    const formattedInput = inputStr.endsWith('\n') ? inputStr : (inputStr + '\n');
    console.log('[MANAGER SENDING INPUT TO CHILD]:', sessionId, JSON.stringify(formattedInput));
    session.child.stdin.write(formattedInput);
    
    // Echo input back into stream for consistent terminal timeline
    broadcast(sessionId, {
      type: 'stdin_echo',
      data: formattedInput
    });

    return { success: true };
  } catch (err) {
    console.error('[MANAGER SEND INPUT ERROR]:', err);
    return {
      success: false,
      error: `Failed to write to stdin: ${err.message}`
    };
  }
}

/**
 * Immediately stop and terminate an interactive session
 */
function stopSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: true, message: 'Session already terminated' };
  }

  broadcast(sessionId, {
    type: 'stderr',
    data: '\n[NRG Engine] Process terminated by user.\n'
  });
  broadcast(sessionId, {
    type: 'exit',
    code: 143,
    status: 'Terminated'
  });

  cleanupSession(sessionId);
  return { success: true };
}

/**
 * Attach WebSocket Server to existing HTTP server for real-time terminal connection
 */
function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsed = new URL(request.url, 'http://localhost');
    if (parsed.pathname === '/api/interactive/ws' || parsed.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, Object.fromEntries(parsed.searchParams));
      });
    }
  });

  wss.on('connection', (ws, request, query) => {
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
            if (session) {
              session.wsClients.add(ws);
            }
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
          if (sId) {
            sendInput(sId, msg.data !== undefined ? msg.data : '');
          }
        } else if (msg.type === 'stop') {
          const sId = msg.sessionId || currentSessionId;
          if (sId) {
            stopSession(sId);
          }
        }
      } catch (err) {
        console.error('[WS MESSAGE ERROR]:', err);
        try {
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
        } catch(e) {}
      }
    });

    ws.on('close', () => {
      if (currentSessionId && activeSessions.has(currentSessionId)) {
        const session = activeSessions.get(currentSessionId);
        session.wsClients.delete(ws);
      }
    });
  });

  return wss;
}

module.exports = {
  startSession,
  subscribeStream,
  sendInput,
  stopSession,
  attachWebSocketServer,
  activeSessions
};
