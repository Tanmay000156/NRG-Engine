const { spawn } = require('child_process');
const path = require('path');

async function testClick() {
  const PORT = 3019;
  const CDP_PORT = 9239;

  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });
  await new Promise(r => setTimeout(r, 1500));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    `http://localhost:${PORT}`
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
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

    const res1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('userProfileBtn');
        const menu = document.getElementById('profileDropdownMenu');
        console.log('Before click:', menu.className, menu.style.top, menu.style.left);
        btn.click();
        console.log('After click:', menu.className, menu.style.top, menu.style.left);
        return {
          classes: menu.className,
          top: menu.style.top,
          left: menu.style.left,
          rect: menu.getBoundingClientRect()
        };
      })()`,
      returnByValue: true
    });
    console.log('Click test result:', res1.result.value);

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
testClick().catch(console.error);
