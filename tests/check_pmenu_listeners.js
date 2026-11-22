const { spawn } = require('child_process');
const path = require('path');

const PORT = 3040;
const CDP_PORT = 9260;

async function checkListeners() {
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

  await cdpSend('Runtime.enable');
  await cdpSend('DOMDebugger.enable');

  // Evaluate script to get objectId of pmenuTheme
  const evalRes = await cdpSend('Runtime.evaluate', {
    expression: "document.getElementById('pmenuTheme')"
  });
  const objectId = evalRes.result.objectId;

  const listenersRes = await cdpSend('DOMDebugger.getEventListeners', {
    objectId
  });

  console.log('Listeners on pmenuTheme:');
  for (const l of listenersRes.listeners) {
    console.log('Type:', l.type, 'Script:', l.scriptId, 'Line:', l.lineNumber, 'Column:', l.columnNumber);
  }

  // Also check if any error was thrown when running the listener function manually
  const testCall = await cdpSend('Runtime.evaluate', {
    expression: `(() => {
      try {
        const pmenu = document.getElementById('pmenuTheme');
        // Let's inspect its onclick or addEventListener
        const modal = document.getElementById('modalThemes');
        modal.classList.add('open');
        return { success: true, openNow: modal.classList.contains('open') };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('Manual testCall result:', testCall.result.value);

  ws.close();
  chrome.kill();
  server.kill();
}

checkListeners().catch(console.error);
