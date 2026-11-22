const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testRunGraphicsLive() {
  const PORT = 3032;
  const CDP_PORT = 9252;

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

    // Go to Editor, click Graphics tab, click preset Matplotlib
    await send('Runtime.evaluate', {
      expression: `(() => {
        navigateToSection('editor');
        document.getElementById('tabBtnGraphics').click();
        document.getElementById('presetMatplotlib').click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Now click Run Code
    await send('Runtime.evaluate', {
      expression: `(() => {
        executeRealCode();
      })()`
    });

    // Wait for execution
    await new Promise(r => setTimeout(r, 5000));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.getElementById('graphicsImg');
        const canvas = document.getElementById('graphicsCanvas');
        const placeholder = document.getElementById('graphicsPlaceholder');
        return {
          imgSrc: img ? img.src.slice(0, 50) : null,
          imgVisible: img ? !img.parentElement.classList.contains('hidden') : false,
          placeholderHidden: placeholder ? placeholder.classList.contains('hidden') : false,
          canvasBg: window.getComputedStyle(canvas).backgroundColor,
          viewportBg: window.getComputedStyle(document.getElementById('graphicsViewport')).backgroundColor
        };
      })()`,
      returnByValue: true
    });
    console.log('Execution result check:', res.result.value);

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\debug_graphics_executed.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved debug_graphics_executed.png');

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
testRunGraphicsLive();
