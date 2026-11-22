const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const cdpPort = 9265;
  const userDataDir = path.join(require('os').tmpdir(), 'nrg_render_live_cdp_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log(`Launching Chrome to inspect https://nrg-engine.onrender.com...`);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'https://nrg-engine.onrender.com'
  ]);

  await wait(3500);

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
    console.log(`Saved screenshot: ${outName} (${buf.length} bytes)`);
    return outPath;
  }

  await sendCdp('Runtime.enable');
  await sendCdp('Page.enable');
  await wait(2000);

  // Navigate to editor
  await evalJs("navigateToSection('editor')");
  await wait(1000);

  const badgeExists = await evalJs("document.getElementById('workerStatusBadge') !== null");
  const badgeText = await evalJs("document.getElementById('terminalStatusBadge')?.innerText");
  console.log('Live Render - workerStatusBadge exists:', badgeExists);
  console.log('Live Render - terminalStatusBadge text:', badgeText);

  await captureScreenshot('live_render_production_verified.png');

  try { chrome.kill(); } catch(e) {}
  console.log('Live Render verification complete!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
