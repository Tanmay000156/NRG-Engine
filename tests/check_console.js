// Check page console errors
const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--window-size=1600,1050',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://localhost:9223/json/list');
      const list = await res.json();
      if (list && list[0]?.webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    ws.send(JSON.stringify({ id: id++, method, params }));
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown') {
      console.log('CONSOLE/EXCEPTION:', JSON.stringify(msg, null, 2));
    }
  };

  send('Page.enable');
  send('Runtime.enable');

  await sleep(3000);
  ws.close();
  chrome.kill();
}

run();
