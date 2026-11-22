const { spawn } = require('child_process');
const path = require('path');

async function testGraphicsLive() {
  const PORT = 3031;
  const CDP_PORT = 9251;

  const server = spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT } });
  await new Promise(r => setTimeout(r, 1500));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'http://localhost:' + PORT
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch('http://127.0.0.1:' + CDP_PORT + '/json');
    const targets = await targetsRes.json();
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const cmdId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === cmdId) {
            ws.removeEventListener('message', handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    // Go to Editor view and activate Graphics tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        navigateToSection('editor');
        const tabBtn = document.getElementById('tabBtnGraphics');
        if (tabBtn) tabBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Dark Mode Graphics Elements
    const darkInspection = await send('Runtime.evaluate', {
      expression: `(() => {
        const panel = document.getElementById('termViewGraphics');
        const bar = document.querySelector('.graphics-header-bar');
        const viewport = document.getElementById('graphicsViewport');
        const placeholder = document.getElementById('graphicsPlaceholder');
        const card = document.querySelector('.graphics-placeholder-card');
        const preset = document.querySelector('.btn-graphics-preset');
        const tool = document.querySelector('.btn-graphics-tool');
        const select = document.querySelector('.graphics-select-dropdown');

        const gcs = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color, border: s.borderColor };
        };

        return {
          theme: document.body.className,
          panel: gcs(panel),
          bar: gcs(bar),
          viewport: gcs(viewport),
          placeholder: gcs(placeholder),
          card: gcs(card),
          preset: gcs(preset),
          tool: gcs(tool),
          select: gcs(select)
        };
      })()`,
      returnByValue: true
    });
    console.log('DARK GRAPHICS INSPECTION:', darkInspection.result.value);

    // Take screenshot of Graphics in Dark mode
    const fs = require('fs');
    const ssDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\debug_graphics_dark.png', Buffer.from(ssDark.data, 'base64'));
    console.log('Saved debug_graphics_dark.png');

    // Toggle to Light mode
    await send('Runtime.evaluate', { expression: `toggleAppTheme()` });
    await new Promise(r => setTimeout(r, 500));

    const lightInspection = await send('Runtime.evaluate', {
      expression: `(() => {
        const panel = document.getElementById('termViewGraphics');
        const bar = document.querySelector('.graphics-header-bar');
        const viewport = document.getElementById('graphicsViewport');
        const card = document.querySelector('.graphics-placeholder-card');
        const preset = document.querySelector('.btn-graphics-preset');

        const gcs = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color, border: s.borderColor };
        };

        return {
          theme: document.body.className,
          panel: gcs(panel),
          bar: gcs(bar),
          viewport: gcs(viewport),
          card: gcs(card),
          preset: gcs(preset)
        };
      })()`,
      returnByValue: true
    });
    console.log('LIGHT GRAPHICS INSPECTION:', lightInspection.result.value);

    const ssLight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\debug_graphics_light.png', Buffer.from(ssLight.data, 'base64'));
    console.log('Saved debug_graphics_light.png');

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
testGraphicsLive();
