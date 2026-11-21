// CDP Verification for TANMAY NRG Signature Image in Sidebar
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('1. Launching Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1600,1050',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://localhost:9224/json/list');
      const list = await res.json();
      if (list && list[0]?.webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let idCounter = 1;
  const callbacks = new Map();
  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');
  await sendCDP('DOM.enable');

  await sleep(2000);

  async function evalInPage(expression) {
    const res = await sendCDP('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async function takeScreenshot(fileName) {
    const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(artifactDir, fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('\n--- VERIFYING SIDEBAR SIGNATURE IMAGE ---');
  const sigInfo = await evalInPage(`(() => {
    const img = document.getElementById('sidebarDevSignatureImg');
    const wrap = document.getElementById('sidebarSignatureWrap');
    const oldCard = document.querySelector('.developer-signature-card');
    const oldFooter = document.querySelector('.sidebar-footer');
    const oldText = document.querySelector('.dev-sig-name');

    if (!img) return { error: 'No #sidebarDevSignatureImg found' };
    const style = window.getComputedStyle(img);
    const wrapStyle = window.getComputedStyle(wrap);

    return {
      hasImg: true,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      offsetWidth: img.offsetWidth,
      offsetHeight: img.offsetHeight,
      objectFit: style.objectFit,
      wrapBackground: wrapStyle.backgroundColor,
      wrapBorder: wrapStyle.border,
      wrapBoxShadow: wrapStyle.boxShadow,
      hasOldCard: !!oldCard,
      hasOldFooter: !!oldFooter,
      hasOldText: !!oldText,
      srcLength: img.src ? img.src.length : 0,
      srcPrefix: img.src ? img.src.substring(0, 30) : null
    };
  })()`);

  console.log('Signature element inspection:', sigInfo);

  if (!sigInfo.hasImg) throw new Error('Signature image element not found!');
  if (sigInfo.naturalWidth === 0 || sigInfo.naturalHeight === 0) {
    throw new Error('Signature image failed to load (naturalWidth/Height is 0)!');
  }
  if (sigInfo.hasOldCard || sigInfo.hasOldFooter || sigInfo.hasOldText) {
    throw new Error('Old branding elements still present!');
  }
  if (sigInfo.objectFit !== 'contain') {
    throw new Error(`Expected object-fit: contain, got ${sigInfo.objectFit}!`);
  }

  console.log('✓ Signature image loaded with natural dimensions:', sigInfo.naturalWidth, 'x', sigInfo.naturalHeight);
  console.log('✓ Rendered display dimensions:', sigInfo.offsetWidth, 'x', sigInfo.offsetHeight);
  console.log('✓ Old branding elements completely removed!');

  // Capture Light Mode Screenshot
  await takeScreenshot('nrg_signature_light_mode.png');

  // Toggle Dark Mode
  console.log('\nToggling to Cyber Obsidian Dark mode...');
  await evalInPage(`document.getElementById('btnThemeToggle').click()`);
  await sleep(1000);

  // Capture Dark Mode Screenshot
  await takeScreenshot('nrg_signature_dark_mode.png');

  console.log('\n======================================================');
  console.log('SIGNATURE IMAGE REPLACEMENT VERIFIED SUCCESSFULLY (100%)!');
  console.log('======================================================\n');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
