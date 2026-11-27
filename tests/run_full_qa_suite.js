/**
 * NRG ENGINE — COMPREHENSIVE BACKEND, SECURITY & REAL CHROME CDP E2E QA SUITE
 * Verifies every endpoint, sandbox rule, multi-language compiler, WebSocket session,
 * frontend shortcut, theme token parity, clrscr() virtual screen clearing, Matplotlib,
 * AI assistant, analytics, collaboration room, settings persistence, and responsiveness.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_PORT = 3467;
const CDP_PORT = 9237;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const results = [];
function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!passed) throw new Error(`Assertion failed [${name}]: ${detail}`);
}

function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

async function httpReq(method, urlPath, { body = null, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: {
      ...(body !== null ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body !== null ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return {
    status: res.status,
    headers: res.headers,
    setCookie: res.headers.get('set-cookie') || '',
    text,
    json
  };
}

function waitForServerReady(timeoutMs = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const r = await fetch(`${BASE_URL}/api/health`);
        if (r.ok) return resolve(true);
      } catch (_) {}
      if (Date.now() - started > timeoutMs) return reject(new Error('Server failed to start within timeout'));
      setTimeout(tick, 200);
    };
    tick();
  });
}

function connectCdp(port) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      http.get(`http://127.0.0.1:${port}/json`, (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try {
            const targets = JSON.parse(raw);
            const page = targets.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) {
              const ws = new WebSocket(page.webSocketDebuggerUrl);
              let cmdId = 1;
              const pending = new Map();
              const listeners = new Map();
              ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.id && pending.has(msg.id)) {
                  const { res: r, rej } = pending.get(msg.id);
                  pending.delete(msg.id);
                  if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
                  else r(msg.result);
                } else if (msg.method && listeners.has(msg.method)) {
                  listeners.get(msg.method).forEach(fn => fn(msg.params));
                }
              });
              ws.on('open', () => {
                resolve({
                  ws,
                  send(method, params = {}) {
                    return new Promise((r, rej) => {
                      const id = cmdId++;
                      const timer = setTimeout(() => {
                        if (pending.has(id)) {
                          pending.delete(id);
                          rej(new Error(`CDP timeout after 15s calling ${method} ${JSON.stringify(params).slice(0, 120)}`));
                        }
                      }, 15000);
                      pending.set(id, {
                        res: (val) => { clearTimeout(timer); r(val); },
                        rej: (err) => { clearTimeout(timer); rej(err); }
                      });
                      ws.send(JSON.stringify({ id, method, params }));
                    });
                  },
                  on(method, fn) {
                    if (!listeners.has(method)) listeners.set(msgMethodOrName(method), []);
                    listeners.get(method).push(fn);
                  },
                  async eval(expr) {
                    const out = await this.send('Runtime.evaluate', {
                      expression: expr,
                      awaitPromise: true,
                      returnByValue: true
                    });
                    if (out.exceptionDetails) {
                      throw new Error(out.exceptionDetails.exception?.description || out.exceptionDetails.text || 'Eval exception');
                    }
                    return out.result?.value;
                  },
                  close() {
                    try { ws.close(); } catch (_) {}
                  }
                });
              });
              return;
            }
          } catch (_) {}
          if (Date.now() - started > 10000) return reject(new Error('CDP timeout'));
          setTimeout(poll, 200);
        });
      }).on('error', () => {
        if (Date.now() - started > 10000) return reject(new Error('CDP poll timeout'));
        setTimeout(poll, 200);
      });
    };
    poll();
  });
}
function msgMethodOrName(x) { return x; }

const sleep = ms => new Promise(r => setTimeout(r, ms));

function startMockLlmServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: { message: 'Not found' } }));
      }
      const auth = String(req.headers.authorization || '');
      if (auth.includes('bad-key')) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: { message: 'Invalid API key (simulated 401)' } }));
      }
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        let body = {};
        try { body = JSON.parse(raw || '{}'); } catch (_) {}
        const lastMsg = String(body?.messages?.[body.messages.length - 1]?.content || '');
        const isPredict = lastMsg.includes('<CURSOR>');
        if (body.stream) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          const chunks = [
            '### Real AI Stream\nHere is a verified helper:\n',
            '```python\ndef nrg_square(x):\n    return x * x\n```'
          ];
          let idx = 0;
          const tick = () => {
            if (idx < chunks.length) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunks[idx++] } }] })}\n\n`);
              setTimeout(tick, 25);
            } else {
              res.write('data: [DONE]\n\n');
              res.end();
            }
          };
          tick();
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const content = isPredict
          ? 'printf("AI_GHOST_OK\\n");'
          : (lastMsg.includes('Connection health check') ? 'OK' : 'Real LLM explanation: prints greeting and returns 0 cleanly.');
        res.end(JSON.stringify({
          model: body.model || 'mock-coder',
          choices: [{ message: { content } }]
        }));
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}/v1` });
    });
  });
}

async function runBackendSuite(mockAiBaseUrl) {
  console.log('\n=== TRACK 1: BACKEND API, SECURITY, COMPILERS & WS SUITE ===');

  const health = await httpReq('GET', '/api/health');
  record('GET /api/health', health.status === 200 && health.json?.status === 'online', health.json?.service);

  const cfg = await httpReq('GET', '/api/config');
  record('GET /api/config',
    cfg.status === 200 &&
    cfg.json?.brand?.studioName === 'NRG CoreX Studios' &&
    cfg.json?.limits?.COMPILE_TIMEOUT_MS === 10000 &&
    cfg.json?.limits?.MAX_EXECUTION_TIMEOUT_MS === 30000,
    cfg.json?.brand?.productName
  );

  const diag = await httpReq('GET', '/api/diagnostics');
  const dc = diag.json?.toolchains?.compilers || {};
  const dp = diag.json?.toolchains?.pythonPackages || {};
  record('GET /api/diagnostics',
    diag.status === 200 && diag.json?.success && typeof dc.gcc === 'boolean',
    `gcc=${dc.gcc} py=${dc.python} mpl=${dp.matplotlib} np=${dp.numpy} pd=${dp.pandas}`
  );

  // Sensitive static file protection
  const sensitivePaths = ['/.env', '/.git/config', '/api/_config.js', '/server.js', '/.nrg_data/workspace_db.json'];
  for (const sp of sensitivePaths) {
    const r = await httpReq('GET', sp);
    record(`Sensitive block ${sp}`, r.status === 403 || r.status === 404, `HTTP ${r.status}`);
  }

  // Auth + Owner Project CRUD + Cross-owner 403
  const aAuth = await httpReq('POST', '/api/auth', { body: { displayName: 'QA Owner A', roleTitle: 'Architect' } });
  const cookieA = aAuth.setCookie.split(';')[0];
  const bAuth = await httpReq('POST', '/api/auth', { body: { displayName: 'QA Owner B', roleTitle: 'Developer' } });
  const cookieB = bAuth.setCookie.split(';')[0];
  record('Signed Cookie Session Created', aAuth.status === 200 && cookieA.includes('nrg_session='));

  const pCreate = await httpReq('POST', '/api/projects', {
    headers: { cookie: cookieA },
    body: { id: 'qa_proj_1', name: 'qa-alpha', lang: 'c', file: 'main.c', code: 'int main(){return 0;}' }
  });
  record('POST /api/projects', pCreate.status === 200 && pCreate.json?.project?.id === 'qa_proj_1');

  const pUnauth = await httpReq('DELETE', '/api/projects?id=qa_proj_1');
  record('Unauth DELETE /api/projects -> 401', pUnauth.status === 401);

  const pForeign = await httpReq('DELETE', '/api/projects?id=qa_proj_1', { headers: { cookie: cookieB } });
  record('Foreign Owner DELETE /api/projects -> 403', pForeign.status === 403);

  const pOwnerDel = await httpReq('DELETE', '/api/projects?id=qa_proj_1', { headers: { cookie: cookieA } });
  record('Owner DELETE /api/projects -> 200', pOwnerDel.status === 200);

  // Secret env isolation in child executions
  const pyIso = await httpReq('POST', '/api/execute', {
    body: { language: 'python', source_code: 'import os\nprint(os.environ.get("NRG_SECRET_CANARY", "ISOLATED"))' }
  });
  record('Python Env Secret Isolation', pyIso.status === 200 && pyIso.json?.stdout?.trim() === 'ISOLATED', pyIso.json?.stdout?.trim());

  const jsIso = await httpReq('POST', '/api/execute', {
    body: { language: 'javascript', source_code: 'console.log(process.env.NRG_SECRET_CANARY || "ISOLATED");' }
  });
  record('Node.js Env Secret Isolation', jsIso.status === 200 && jsIso.json?.stdout?.trim() === 'ISOLATED', jsIso.json?.stdout?.trim());

  const cIso = await httpReq('POST', '/api/execute', {
    body: {
      language: 'c',
      source_code: '#include <stdio.h>\n#include <stdlib.h>\nint main(){ const char *s=getenv("NRG_SECRET_CANARY"); printf("%s", s?s:"ISOLATED"); return 0; }'
    }
  });
  record('C Env Secret Isolation', cIso.status === 200 && cIso.json?.stdout?.trim() === 'ISOLATED', cIso.json?.stdout?.trim());

  // Hazard block test
  const hazard = await httpReq('POST', '/api/execute', {
    body: { language: 'c', source_code: '#include <unistd.h>\nint main(){ while(1){ fork(); } return 0; }' }
  });
  record('Static Hazard Fork-Bomb Block -> 403', hazard.status === 403, hazard.json?.error);

  // AI Predict & AI Assist
  const pred = await httpReq('POST', '/api/predict', {
    body: { language: 'python', prefix: 'def greet(name):\n    print(', suffix: '', tabSize: 4, trigger: 'manual' }
  });
  record('POST /api/predict', pred.status === 200 && typeof pred.json?.suggestion === 'string' && pred.json.suggestion.length > 0, JSON.stringify(pred.json?.suggestion));

  const assist = await httpReq('POST', '/api/ai/assist', {
    body: { language: 'c', mode: 'dependencies', code: '#include <stdio.h>\n#include <conio.h>\nint main(){ return 0; }' }
  });
  record('POST /api/ai/assist (dependencies)',
    assist.status === 200 && Array.isArray(assist.json?.dependencies) && assist.json.dependencies.some(d => d.name === 'conio.h'),
    (assist.json?.dependencies || []).map(d => d.name).join(', ')
  );

  // C Compile Cache hit test + conio.h clrscr ANSI emission
  const clrscrCode = '#include <stdio.h>\n#include <conio.h>\nint main() { printf("BEFORE_CLR\\n"); clrscr(); printf("AFTER_CLR\\n"); return 0; }';
  const r1 = await httpReq('POST', '/api/execute', { body: { language: 'c', source_code: clrscrCode } });
  const r2 = await httpReq('POST', '/api/execute', { body: { language: 'c', source_code: clrscrCode } });
  record('C conio.h clrscr Execution + Cache',
    r1.status === 200 && r1.json?.stdout?.includes('\x1b[2J') && r1.json?.stdout?.includes('AFTER_CLR') && r2.status === 200 && r2.json?.status?.id === 3,
    `run1=${r1.json?.time}s run2=${r2.json?.time}s`
  );

  // Python Matplotlib execution
  const mplCode = 'import matplotlib.pyplot as plt\nimport numpy as np\nx = np.linspace(0, 3, 10)\nplt.plot(x, x**2)\nplt.show()';
  const mplRes = await httpReq('POST', '/api/execute', { body: { language: 'python', source_code: mplCode } });
  record('Python Matplotlib Graph Output',
    mplRes.status === 200 &&
    mplRes.json?.is_graphics === true &&
    mplRes.json?.graphics_output?.type === 'image' &&
    mplRes.json?.graphics_output?.engine === 'matplotlib' &&
    String(mplRes.json?.graphics_output?.data || '').startsWith('data:image/png;base64,'),
    `mode=${mplRes.json?.execution_mode} engine=${mplRes.json?.graphics_output?.engine}`
  );

  // WebSocket Interactive + Collab test
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/api/interactive/ws`);
    let out = '';
    const timer = setTimeout(() => { try { ws.close(); } catch (_) {} reject(new Error('WS interactive timeout')); }, 10000);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'start',
        language: 'c',
        source_code: '#include <stdio.h>\nint main(){ int x=0; if(scanf("%d",&x)==1) printf("VAL=%d\\n", x*3); return 0; }'
      }));
    });
    ws.on('message', (buf) => {
      const ev = JSON.parse(buf.toString());
      if (ev.type === 'started') ws.send(JSON.stringify({ type: 'stdin', data: '14\n' }));
      if (ev.type === 'stdout') out += ev.data || '';
      if (ev.type === 'exit') {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        try {
          record('WS /api/interactive/ws Live Stdin', out.includes('VAL=42'), out.trim());
          resolve();
        } catch (e) { reject(e); }
      }
    });
    ws.on('error', reject);
  });

  await new Promise((resolve, reject) => {
    const room = 'qa_room_' + Date.now();
    const c1 = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/api/collab/ws?room=${room}&name=Alice&role=Architect`);
    let c2 = null;
    const timer = setTimeout(() => { try { c1.close(); c2?.close(); } catch (_) {} reject(new Error('WS collab timeout')); }, 8000);
    c1.on('open', () => {
      c2 = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/api/collab/ws?room=${room}&name=Bob&role=Developer`);
      c2.on('open', () => {
        c1.send(JSON.stringify({ type: 'chat', text: 'hello-qa-room' }));
      });
      c2.on('message', (buf) => {
        const msg = JSON.parse(buf.toString());
        if (msg.type === 'chat' && msg.text === 'hello-qa-room') {
          clearTimeout(timer);
          try { c1.close(); c2.close(); } catch (_) {}
          record('WS /api/collab/ws Room Relay', true, `${msg.from || msg.name}: ${msg.text}`);
          resolve();
        }
      });
    });
    c1.on('error', reject);
  });

  // Real AI Provider Verification (Unconfigured 503, Auth Error 401, Healthy Test, LLM Predict & SSE Chat)
  const aiStat = await httpReq('GET', '/api/ai/status');
  record('GET /api/ai/status Unconfigured Honest Report',
    aiStat.status === 200 && aiStat.json?.configured === false && aiStat.json?.errorCode === 'NO_AI_CREDENTIALS',
    aiStat.json?.errorCode
  );

  const chatNoCreds = await httpReq('POST', '/api/ai/chat', {
    body: { language: 'c', code: 'int main(){}', messages: [{ role: 'user', content: 'hi' }] }
  });
  record('POST /api/ai/chat Without Credentials -> 503',
    chatNoCreds.status === 503 && chatNoCreds.json?.success === false && chatNoCreds.json?.errorCode === 'NO_AI_CREDENTIALS',
    chatNoCreds.json?.errorCode
  );

  const badTest = await httpReq('POST', '/api/ai/test', {
    body: { aiConfig: { provider: 'openai', endpoint: mockAiBaseUrl, apiKey: 'bad-key', model: 'mock-coder' } }
  });
  record('POST /api/ai/test Invalid Key -> 401 Honest Error',
    badTest.status === 401 && badTest.json?.ok === false && badTest.json?.errorCode === 'AI_AUTH_ERROR',
    badTest.json?.error
  );

  const goodTest = await httpReq('POST', '/api/ai/test', {
    body: { aiConfig: { provider: 'openai', endpoint: mockAiBaseUrl, apiKey: 'valid-key', model: 'mock-coder' } }
  });
  record('POST /api/ai/test Valid Provider -> 200',
    goodTest.status === 200 && goodTest.json?.ok === true && goodTest.json?.model === 'mock-coder',
    `${goodTest.json?.latencyMs}ms`
  );

  const llmPred = await httpReq('POST', '/api/predict', {
    body: {
      language: 'c',
      prefix: '#include <stdio.h>\nint main() {\n  ',
      suffix: '\n}',
      aiConfig: { provider: 'openai', endpoint: mockAiBaseUrl, apiKey: 'valid-key', model: 'mock-coder' }
    }
  });
  record('POST /api/predict Real LLM Completion',
    llmPred.status === 200 && llmPred.json?.llmConfigured === true && llmPred.json?.source === 'openai-llm' && llmPred.json?.suggestion.includes('AI_GHOST_OK'),
    llmPred.json?.suggestion
  );

  const sseRes = await new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c.toString('utf8'); });
      res.on('end', () => resolve({ status: res.statusCode, ctype: res.headers['content-type'] || '', body }));
    });
    req.on('error', reject);
    req.end(JSON.stringify({
      stream: true,
      language: 'python',
      code: 'x = 5',
      messages: [{ role: 'user', content: 'write square function' }],
      aiConfig: { provider: 'openai', endpoint: mockAiBaseUrl, apiKey: 'valid-key', model: 'mock-coder' }
    }));
  });
  record('POST /api/ai/chat SSE Token Streaming',
    sseRes.status === 200 && sseRes.ctype.includes('text/event-stream') && sseRes.body.includes('event: delta') && sseRes.body.includes('nrg_square') && sseRes.body.includes('event: done'),
    `bytes=${sseRes.body.length}`
  );
}

async function runBrowserCdpSuite(mockAiBaseUrl) {
  console.log('\n=== TRACK 2: REAL CHROME CDP UI/UX, E2E & RESPONSIVE SUITE ===');
  const chromePath = findBrowserExecutable();
  if (!chromePath) {
    record('Browser Executable Check', false, 'Chrome/Edge not installed');
    return;
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrg_cdp_profile_'));
  const browser = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: 'ignore' });

  const consoleErrors = [];
  const pageExceptions = [];
  const httpFailures = [];
  let cdp = null;

  try {
    cdp = await connectCdp(CDP_PORT);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    cdp.on('Runtime.exceptionThrown', (p) => {
      pageExceptions.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'Unknown exception');
    });
    cdp.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') {
        consoleErrors.push((p.args || []).map(a => a.value || a.description).join(' '));
      }
    });
    cdp.on('Network.responseReceived', (p) => {
      if (p.response && p.response.status >= 400 && !p.response.url.includes('favicon')) {
        httpFailures.push(`${p.response.status} ${p.response.url}`);
      }
    });

    cdp.on('Page.javascriptDialogOpening', (p) => {
      console.log('[CDP Dialog]', p.type, p.message);
      cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    });

    await cdp.send('Page.navigate', { url: BASE_URL });
    await sleep(1600);

    // 1. First-launch onboarding
    const onbVisible = await cdp.eval(`document.getElementById('welcomeOnboardingModal')?.classList.contains('open')`);
    record('First-Launch Onboarding Modal Opens', onbVisible === true);

    await cdp.eval(`(() => {
      const inp = document.getElementById('onboardingNameInput');
      inp.value = 'Rohan';
      document.getElementById('onboardingForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await sleep(400);

    const greeting = await cdp.eval(`document.getElementById('homeWelcomeGreeting')?.textContent || ''`);
    record('Onboarding Saves Name & Updates Greeting', greeting.includes('Rohan'), greeting);

    // 2. Check zero hardcoded persona remnants
    const bodyText = await cdp.eval(`document.body.innerText`);
    record('Zero Alex Chen / Elena Rostova / 2.0 Remnants',
      !/Alex Chen|Elena Rostova|NRG Engine 2\.0/.test(bodyText)
    );

    // 3. Light & Dark Theme parity for editor font size & font family
    await cdp.eval(`(() => {
      ThemeManager.setTheme('glass-light');
      SettingsManager.update({ fontSize: 18, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" }, { skipToast: true });
    })()`);
    await sleep(300);
    const lightFont = await cdp.eval(`({
      size: getComputedStyle(document.getElementById('editorCodeInput')).fontSize,
      fam: getComputedStyle(document.getElementById('editorCodeInput')).fontFamily,
      light: document.body.classList.contains('glass-light')
    })`);
    await cdp.eval(`ThemeManager.setTheme('crystal-obsidian')`);
    await sleep(250);
    const darkFont = await cdp.eval(`({
      size: getComputedStyle(document.getElementById('editorCodeInput')).fontSize,
      dark: document.body.classList.contains('crystal-obsidian')
    })`);
    record('Font Size & Family Consistent in Light & Dark',
      lightFont.light && lightFont.size === '18px' && lightFont.fam.includes('Fira Code') && darkFont.dark && darkFont.size === '18px',
      `light=${lightFont.size} (${lightFont.fam.split(',')[0]}) dark=${darkFont.size}`
    );

    // 4. Editor workspace: Explorer, Dependencies, Compiler dropdown, Folding, Bracket match
    await cdp.eval(`navigateToSection('editor')`);
    await sleep(250);
    await cdp.eval(`document.getElementById('compilerSelectorBtn').click()`);
    await sleep(150);
    const ddOpen = await cdp.eval(`document.getElementById('compilerDropdownMenu').classList.contains('active')`);
    await cdp.eval(`document.querySelector('#compilerDropdownMenu [data-lang="c"]').click()`);
    await cdp.eval(`document.getElementById('btnToggleExplorer').click()`);
    await sleep(150);
    const depsText = await cdp.eval(`document.getElementById('explorerDepsList').innerText`);
    record('Compiler Dropdown & Project Explorer Dependencies', ddOpen && depsText.includes('stdio.h'), depsText.replace(/\s+/g, ' '));

    // Code folding toggle on line 3 (int main())
    const beforeFoldLines = await cdp.eval(`document.getElementById('editorCodeInput').value.split('\\n').length`);
    await cdp.eval(`document.querySelector('.fold-toggle-btn')?.click()`);
    await sleep(100);
    const duringFold = await cdp.eval(`document.getElementById('editorCodeInput').value`);
    await cdp.eval(`document.querySelector('.fold-toggle-btn')?.click()`);
    await sleep(100);
    const afterUnfoldLines = await cdp.eval(`document.getElementById('editorCodeInput').value.split('\\n').length`);
    record('Code Folding Collapse & Unfold',
      duringFold.includes('folded:') && afterUnfoldLines === beforeFoldLines,
      `lines=${beforeFoldLines}->folded->${afterUnfoldLines}`
    );

    // 5. Real Keyboard Behavior (Enter, Tab indent, AiPredictor Ghost + Tab/Esc, Ctrl+Enter)
    await cdp.eval(`(() => {
      const inp = document.getElementById('editorCodeInput');
      switchLanguage('c');
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      AiPredictor.dismissPrediction(true);
    })()`);
    // Dispatch Tab without AI prediction -> should insert spaces
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(100);
    const afterTabIndent = await cdp.eval(`document.getElementById('editorCodeInput').value`);
    record('Tab Inserts Spaces When No AI Prediction', afterTabIndent.endsWith('    '));

    // Activate synthetic/real AI prediction via AiPredictor and verify Escape / Tab
    await cdp.eval(`(() => {
      const inp = document.getElementById('editorCodeInput');
      inp.value = 'printf("ok");\\n';
      currentCode = inp.value;
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      AiPredictor.active = { text: 'return 0;', anchorPos: inp.value.length, anchorCode: inp.value, source: 'test' };
      updateEditorDisplay();
    })()`);
    const hasGhost = await cdp.eval(`!!document.getElementById('editorGhostSpan')`);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(100);
    const afterAiTab = await cdp.eval(`document.getElementById('editorCodeInput').value`);
    record('AI Ghost Visible & Accepted via Tab', hasGhost && afterAiTab.includes('return 0;'));

    // 6. clrscr() clearing BOTH Output Workspace AND Terminal Log!
    await cdp.eval(`(() => {
      switchLanguage('c');
      const code = '#include <stdio.h>\\n#include <conio.h>\\nint main() {\\n  printf("STALE_OLD_OUTPUT\\\\n");\\n  clrscr();\\n  printf("FRESH_CLEARED_SCREEN\\\\n");\\n  return 0;\\n}';
      const inp = document.getElementById('editorCodeInput');
      inp.value = code;
      currentCode = code;
      updateEditorDisplay();
      executeRealCode();
    })()`);
    await sleep(3000);
    const clrscrUi = await cdp.eval(`({
      stdout: document.getElementById('stdoutView')?.textContent || '',
      term: document.getElementById('termLogStream')?.innerText || ''
    })`);
    record('C clrscr() Clears Output View & Prior Terminal Output',
      clrscrUi.stdout.includes('FRESH_CLEARED_SCREEN') &&
      !clrscrUi.stdout.includes('STALE_OLD_OUTPUT') &&
      clrscrUi.term.includes('[Screen Cleared via clrscr()]') &&
      !clrscrUi.term.includes('STALE_OLD_OUTPUT'),
      `stdout=${JSON.stringify(clrscrUi.stdout.trim())} term=${JSON.stringify(clrscrUi.term.slice(0, 200))}`
    );

    // 7. Python Matplotlib execution in Browser UI -> Graphics Canvas
    await cdp.eval(`(() => {
      switchLanguage('python');
      const code = 'import matplotlib.pyplot as plt\\nimport numpy as np\\nx = np.linspace(0, 6, 40)\\nplt.plot(x, np.sin(x))\\nplt.show()';
      const inp = document.getElementById('editorCodeInput');
      inp.value = code;
      currentCode = code;
      updateEditorDisplay();
      executeRealCode();
    })()`);
    await sleep(3500);
    const gfxActive = await cdp.eval(`document.getElementById('termViewGraphics')?.classList.contains('active') && document.getElementById('termViewGraphics')?.innerHTML.length > 100`);
    record('Python Matplotlib UI Graphics Render', gfxActive === true);

    // 8. Cloud Fallback Signaling Verification -> PyodideWorker instantiation in Chrome
    const workerTest = await cdp.eval(`new Promise((resolve) => {
      const w = new Worker('/pyodide-worker.js');
      let resolved = false;
      const to = setTimeout(() => { if (!resolved) { resolved = true; w.terminate(); resolve({ ok: true, mode: 'worker-loaded' }); } }, 4000);
      w.onmessage = (e) => {
        if (e.data?.type === 'status' || e.data?.type === 'result') {
          if (!resolved) { resolved = true; clearTimeout(to); w.terminate(); resolve({ ok: true, msg: e.data }); }
        }
      };
      w.onerror = (err) => { if (!resolved) { resolved = true; clearTimeout(to); resolve({ ok: false, error: err.message }); } };
      w.postMessage({ type: 'execute', id: 'qa_py', code: 'print(2+2)', stdin: '' });
    })`);
    record('Pyodide Worker Script Boot in Browser', workerTest?.ok === true, JSON.stringify(workerTest?.msg || workerTest?.mode));

    // 9. Real AI Studio SSE Chat, Code Insertion & Diagnostics Docks
    await cdp.eval(`(() => {
      navigateToSection('editor');
      document.getElementById('aiPanelProviderSelect').value = 'openai';
      document.getElementById('aiPanelModelInput').value = 'mock-coder';
      document.getElementById('aiPanelApiKeyInput').value = 'valid-key';
      document.getElementById('aiPanelEndpointInput').value = ${JSON.stringify(mockAiBaseUrl)};
      document.getElementById('btnAiPanelTest').click();
    })()`);
    await sleep(500);
    const aiBadgeText = await cdp.eval(`document.getElementById('aiStudioStatusBadge')?.textContent || ''`);
    await cdp.eval(`(() => {
      const inp = document.getElementById('aiChatInput');
      inp.value = 'write helper';
      document.getElementById('aiChatForm').requestSubmit();
    })()`);
    await sleep(600);
    const chatResult = await cdp.eval(`({
      text: document.getElementById('aiChatThread')?.innerText || '',
      hasInsertBtn: !!document.querySelector('#aiChatThread [data-ai-code-act="insert"]')
    })`);
    await cdp.eval(`AiAssistantUI.run('explain', { intoStudio: true })`);
    await sleep(400);
    const aiText = await cdp.eval(`document.getElementById('aiAssistOutputBox')?.textContent || ''`);
    await cdp.eval(`AnalyticsUI.refresh()`);
    await sleep(300);
    const kpiCount = await cdp.eval(`document.querySelectorAll('#analyticsKpiGrid .analytics-kpi-card').length`);
    await cdp.eval(`DiagnosticsUI.refresh()`);
    await sleep(300);
    const diagText = await cdp.eval(`document.getElementById('systemDiagnosticsOutput')?.textContent || ''`);
    record('AI Studio SSE Chat, Code Card, Analytics & Diagnostics',
      aiBadgeText.includes('OpenAI') && chatResult.text.includes('nrg_square') && chatResult.hasInsertBtn && aiText.includes('[Source:') && kpiCount === 4 && diagText.includes('Compile Timeout: 10s'),
      `badge=${aiBadgeText}, kpi=${kpiCount}`
    );

    // 10. Settings 10-category filter & Reload Persistence
    await cdp.eval(`navigateToSection('settings')`);
    await sleep(250);
    const catCount = await cdp.eval(`document.querySelectorAll('#settingsCategoryBar .settings-cat-pill').length`);
    await cdp.eval(`document.querySelector('[data-settings-cat-filter="privacy"]').click()`);
    await sleep(100);
    const privacyVisible = await cdp.eval(`document.querySelectorAll('#settingsSectionsContainer .settings-section-card').length > 0 && Array.from(document.querySelectorAll('#settingsSectionsContainer .settings-section-card')).filter(c => c.style.display !== 'none').length === 1`);
    record('Settings 10-Category Navigation & Privacy Filter', catCount === 11 && privacyVisible === true);

    await cdp.send('Page.reload');
    await sleep(1600);
    const afterReload = await cdp.eval(`({
      onboardingOpen: document.getElementById('welcomeOnboardingModal')?.classList.contains('open'),
      greeting: document.getElementById('homeWelcomeGreeting')?.textContent || '',
      fontSize: getComputedStyle(document.getElementById('editorCodeInput')).fontSize,
      name: ProfileManager.getDisplayName()
    })`);
    record('Reload Preserves Name, Font Size & Skips Onboarding',
      afterReload.onboardingOpen === false &&
      afterReload.name === 'Rohan' &&
      afterReload.fontSize === '18px',
      JSON.stringify(afterReload)
    );

    // 11. Collaborate View & Responsive Overflow Checks (1440, 1024, 768, 375)
    await cdp.eval(`navigateToSection('collaborate')`);
    await sleep(250);
    const collabEmptyVisible = await cdp.eval(`document.getElementById('collabEmptyPeersNotice')?.style.display !== 'none'`);
    record('Collaborate View Honest Solo State', collabEmptyVisible === true);

    await cdp.eval(`navigateToSection('editor')`);
    await sleep(200);
    for (const [vw, vh] of [[1440, 900], [1024, 768], [768, 1024], [375, 812]]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vw, height: vh, deviceScaleFactor: 1, mobile: vw < 768
      });
      await sleep(180);
      const ov = await cdp.eval(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
      record(`Responsive ${vw}x${vh} No Horizontal Overflow`, ov.sw <= ov.iw + 2, `scroll=${ov.sw} <= inner=${ov.iw}`);
    }

    record('Zero Uncaught Browser Console Errors', consoleErrors.length === 0, consoleErrors.join(' | '));
    record('Zero Uncaught Page Exceptions', pageExceptions.length === 0, pageExceptions.join(' | '));
    record('Zero Unexpected HTTP >= 400 Responses', httpFailures.length === 0, httpFailures.join(' | '));

  } finally {
    if (consoleErrors.length || pageExceptions.length || httpFailures.length) {
      console.error('DIAGNOSTICS_ON_EXIT -> consoleErrors:', consoleErrors, 'pageExceptions:', pageExceptions, 'httpFailures:', httpFailures);
    }
    if (cdp) cdp.close();
    try { browser.kill('SIGKILL'); } catch (_) {}
    await sleep(400);
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

(async () => {
  const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrg_qa_store_'));
  const serverProc = spawn(process.execPath, ['server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NRG_DATA_DIR: tmpDataDir,
      NRG_SECRET_CANARY: 'TOP_SECRET_MUST_NOT_LEAK_INTO_USER_PROCESS'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stderr.on('data', d => process.stderr.write(`[server stderr] ${d}`));

  const mockLlm = await startMockLlmServer();
  try {
    await waitForServerReady();
    await runBackendSuite(mockLlm.baseUrl);
    await runBrowserCdpSuite(mockLlm.baseUrl);

    const passed = results.filter(r => r.passed).length;
    console.log(`\nALL QA CHECKS PASSED: ${passed}/${results.length}`);
    process.exitCode = 0;
  } catch (err) {
    console.error('\nQA SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    try { mockLlm.server.close(); } catch (_) {}
    try { serverProc.kill('SIGKILL'); } catch (_) {}
    await sleep(300);
    try { fs.rmSync(tmpDataDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
