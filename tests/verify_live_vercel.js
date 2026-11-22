const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verifyLive() {
  console.log('Verifying live deployment at https://nrg-engine.vercel.app...');

  // 1. Check health API
  const healthRes = await fetch('https://nrg-engine.vercel.app/api/health').then(r => r.json());
  console.log('Live health check:', healthRes.status, healthRes.service);

  // 2. Launch headless Chrome to verify frontend and capture screenshot
  const cdpPort = 9245;
  const userDataDir = path.join(require('os').tmpdir(), 'nrg_live_cdp_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'https://nrg-engine.vercel.app'
  ]);

  await wait(3000);

  const pagesRes = await fetch(`http://localhost:${cdpPort}/json/list`).then(r => r.json());
  const page = pagesRes.find(p => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));
  console.log('CDP connection established to live page!');

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

  await sendCdp('Runtime.enable');
  await sendCdp('Page.enable');
  await wait(2000);

  // Take screenshot
  const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  const outPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\live_vercel_production_interactive.png';
  fs.writeFileSync(outPath, buf);
  console.log(`Saved screenshot to ${outPath} (${buf.length} bytes)`);

  ws.close();
  chrome.kill();
  console.log('✅ Live Vercel verification complete!');
  process.exit(0);
}

verifyLive().catch(e => {
  console.error('Live verification failed:', e);
  process.exit(1);
});
