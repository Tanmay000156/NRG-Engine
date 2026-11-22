const { spawn } = require('child_process');
const path = require('path');

async function debugCss() {
  const PORT = 3028;
  const CDP_PORT = 9248;

  const server = spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT } });
  await new Promise(r => setTimeout(r, 1500));

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--disable-gpu',
    '--no-sandbox',
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

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const menu = document.getElementById('profileDropdownMenu');
        const style = window.getComputedStyle(menu);
        return {
          id: menu.id,
          className: menu.className,
          parent: menu.parentElement ? menu.parentElement.id : 'null',
          bg: style.background,
          bgColor: style.backgroundColor,
          dropdownBgVar: style.getPropertyValue('--dropdown-bg'),
          bodyClasses: document.body.className
        };
      })()`,
      returnByValue: true
    });
    console.log('Menu inspection:', res.result.value);
    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
debugCss();
