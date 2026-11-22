const { spawn } = require('child_process');
const path = require('path');

async function testThemeColors() {
  const PORT = 3027;
  const CDP_PORT = 9247;

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

    const darkCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('userProfileBtn').click();
        const menu = document.getElementById('profileDropdownMenu');
        const name = document.querySelector('.profile-dropdown-name');
        return {
          themeDarkClass: document.body.classList.contains('theme-dark'),
          menuOpen: menu.classList.contains('open'),
          menuBg: window.getComputedStyle(menu).backgroundColor,
          menuColor: window.getComputedStyle(name).color
        };
      })()`,
      returnByValue: true
    });
    console.log('Dark mode check:', darkCheck.result.value);

    // Toggle theme to light mode
    const lightCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        toggleAppTheme();
        const menu = document.getElementById('profileDropdownMenu');
        const name = document.querySelector('.profile-dropdown-name');
        return {
          themeDarkClass: document.body.classList.contains('theme-dark'),
          themeLightClass: document.body.classList.contains('theme-light'),
          menuOpen: menu.classList.contains('open'),
          menuBg: window.getComputedStyle(menu).backgroundColor,
          menuColor: window.getComputedStyle(name).color
        };
      })()`,
      returnByValue: true
    });
    console.log('Light mode check:', lightCheck.result.value);

    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}
testThemeColors().catch(console.error);
