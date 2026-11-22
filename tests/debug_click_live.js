const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3039;
const CDP_PORT = 9259;

async function debugClick() {
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });
  await new Promise(r => setTimeout(r, 1500));

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    `http://localhost:${PORT}`
  ]);
  await new Promise(r => setTimeout(r, 2000));

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

  // Listen for console logs and exceptions
  ws.addEventListener('message', evt => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER LOG:', msg.params.args.map(a => a.value));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails);
    }
  });

  await cdpSend('Runtime.enable');
  await cdpSend('Page.enable');

  await new Promise(r => setTimeout(r, 1500));

  const result = await cdpSend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('userProfileBtn');
      console.log('btn found:', !!btn);
      btn.click();
      const menu = document.getElementById('profileDropdownMenu');
      console.log('menu open after btn.click():', menu?.classList.contains('open'));

      const pmenuTheme = document.getElementById('pmenuTheme');
      console.log('pmenuTheme found:', !!pmenuTheme);
      
      const modalThemes = document.getElementById('modalThemes');
      console.log('modalThemes found:', !!modalThemes);
      console.log('modalThemes class before pmenuTheme.click():', modalThemes?.className);

      pmenuTheme.click();
      console.log('modalThemes class after pmenuTheme.click():', modalThemes?.className);

      return {
        menuOpen: menu?.classList.contains('open'),
        modalThemesClass: modalThemes?.className
      };
    })()`,
    returnByValue: true
  });

  console.log('Evaluation result:', result);

  ws.close();
  chrome.kill();
  server.kill();
}

debugClick().catch(console.error);
