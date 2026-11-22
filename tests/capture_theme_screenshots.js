const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const mainPort = 3072;
  const cdpPort = 9262;

  const serverProc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(mainPort) },
    stdio: 'ignore'
  });

  await wait(1800);

  const userDataDir = path.join(require('os').tmpdir(), 'nrg_theme_cdp_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    `http://localhost:${mainPort}`
  ]);

  await wait(2200);

  const pagesRes = await fetch(`http://localhost:${cdpPort}/json/list`).then(r => r.json());
  const page = pagesRes.find(p => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));

  let msgId = 1;
  const callbacks = new Map();
  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result, msg.error);
      callbacks.delete(msg.id);
    }
  });

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, (res, err) => {
        if (err) reject(err);
        else resolve(res);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expr) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function captureScreenshot(outName) {
    const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join('C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3', outName);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${outName}`);
  }

  await sendCdp('Runtime.enable');
  await sendCdp('Page.enable');
  await wait(1000);

  await evalJs("navigateToSection('editor')");
  await wait(500);

  // 1. Glass Light screenshot
  await evalJs("window.ThemeManager.setTheme('glass-light')");
  await wait(600);
  await captureScreenshot('clean_terminal_glass_light.png');

  // 2. Crystal Obsidian screenshot
  await evalJs("window.ThemeManager.setTheme('crystal-obsidian')");
  await wait(600);
  await captureScreenshot('clean_terminal_crystal_obsidian.png');

  // 3. Graphics tab in Crystal Obsidian
  await evalJs("switchTerminalTab('graphics')");
  await wait(600);
  await captureScreenshot('clean_graphics_crystal_obsidian.png');

  try { chrome.kill(); } catch(e) {}
  try { serverProc.kill(); } catch(e) {}
  console.log('✔ Theme screenshots captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
