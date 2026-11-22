const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CDP_PORT = 9263;
const ARTIFACT_DIR = 'C:/Users/tanma/.gemini/antigravity-cli/brain/c01c1d9c-ad02-407b-b604-cfdd966075d3';

async function captureLiveVercel() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'https://nrg-engine.vercel.app'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function cdpSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const curId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await cdpSend('Runtime.enable');
  await cdpSend('Page.enable');
  await cdpSend('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 2000));

  // Navigate to Home section
  await cdpSend('Runtime.evaluate', {
    expression: "if (typeof navigateToSection === 'function') navigateToSection('home');"
  });
  await new Promise(r => setTimeout(r, 1000));

  const res = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const artifactPath = path.join(ARTIFACT_DIR, 'vercel_live_production_overhaul.png');
  fs.writeFileSync(artifactPath, buf);
  console.log('Saved live production screenshot to:', artifactPath, 'Size:', buf.length);

  ws.close();
  chrome.kill();
}

captureLiveVercel().catch(console.error);
