const { spawn } = require('child_process');
const path = require('path');

async function testConsole() {
  const PORT = 3020;
  const CDP_PORT = 9240;

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

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
    });

    await send('Runtime.enable');

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('userProfileBtn');
        const menu = document.getElementById('profileDropdownMenu');
        console.log('btn exists:', !!btn, 'menu exists:', !!menu);
        return { btn: !!btn, menu: !!menu };
      })()`,
      returnByValue: true
    });
    console.log('Exists check:', res.result.value);

    // Check if event listener was attached
    const checkListeners = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          positionProfileDropdown();
          return { top: document.getElementById('profileDropdownMenu').style.top };
        } catch(e) {
          return { error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log('positionProfileDropdown call direct:', checkListeners.result.value);

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
testConsole().catch(console.error);
