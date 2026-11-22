const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('=== STARTING COMPLETE BROWSER + WORKER END-TO-END VERIFICATION ===');

  const mainPort = 3065;
  const workerPort = 3066;

  // 1. Launch Persistent Worker
  console.log(`Starting standalone worker on port ${workerPort}...`);
  const workerProc = spawn('node', ['worker/worker.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(workerPort) },
    stdio: 'inherit'
  });

  // 2. Launch Main Web Server
  console.log(`Starting main web server on port ${mainPort}...`);
  const serverProc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(mainPort) },
    stdio: 'inherit'
  });

  await wait(2000);

  // 3. Launch Chrome
  const cdpPort = 9250;
  const userDataDir = path.join(require('os').tmpdir(), 'nrg_worker_cdp_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log(`Launching Chrome on CDP port ${cdpPort}...`);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    `http://localhost:${mainPort}`
  ]);

  await wait(2500);

  const pagesRes = await fetch(`http://localhost:${cdpPort}/json/list`).then(r => r.json());
  const page = pagesRes.find(p => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));
  console.log('CDP connection established to Chrome!');

  let msgId = 1;
  const callbacks = new Map();
  ws.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result, msg.error);
      callbacks.delete(msg.id);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' ');
      console.log(`[BROWSER]:`, args);
    }
  });

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, (res, err) => {
        if (err) reject(err);
        else resolve(res);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expr) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('CDP Eval Error:\n', expr, '\n', res.exceptionDetails);
    }
    return res.result ? res.result.value : null;
  }

  async function captureScreenshot(outName) {
    const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join('C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3', outName);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${outPath} (${buf.length} bytes)`);
    return outPath;
  }

  async function setEditorCode(code) {
    return evalJs(`{
      const edEl = document.getElementById('editorCodeInput');
      edEl.value = ${JSON.stringify(code)};
      edEl.dispatchEvent(new Event('input', { bubbles: true }));
    }`);
  }

  async function submitTerminalStdin(val) {
    return evalJs(`{
      const inpEl = document.getElementById('termPromptInput');
      inpEl.value = ${JSON.stringify(val)};
      inpEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }`);
  }

  await sendCdp('Runtime.enable');
  await sendCdp('Page.enable');
  await wait(1200);

  // Navigate to editor
  await evalJs("navigateToSection('editor')");
  await wait(800);

  // Configure worker URL in localStorage to point to our standalone worker
  console.log(`Configuring worker URL to ws://localhost:${workerPort}/ws...`);
  await evalJs(`{
    localStorage.setItem('nrg_worker_url', 'ws://localhost:${workerPort}/ws');
    checkWorkerHealth();
  }`);

  await wait(1500);

  // Check worker badge status
  const badgeText = await evalJs("document.getElementById('workerStatusText')?.innerText");
  const badgeClass = await evalJs("document.getElementById('workerStatusBadge')?.className");
  console.log(`Worker Badge Status: "${badgeText}", class: "${badgeClass}"`);

  if (!badgeText || !badgeText.includes('Online')) {
    console.error('Expected Worker Online badge, got:', badgeText);
    process.exit(1);
  }

  await captureScreenshot('worker_badge_online_verified.png');
  console.log('✔ Verified: Worker Status Badge displays "Worker Online"!');

  // Open worker modal to capture screenshot
  console.log('Testing Worker Configuration Modal...');
  await evalJs("openWorkerConfigModal()");
  await wait(600);
  await captureScreenshot('worker_modal_config_verified.png');
  await evalJs("closeWorkerConfigModal()");
  await wait(400);

  // Test Interactive C execution on standalone worker
  console.log('\n========================================');
  console.log('Testing Interactive C on Standalone Worker');
  console.log('========================================');

  await evalJs("switchLanguage('c')");
  const cCode = `
#include <stdio.h>
int main() {
    int a, b;
    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);
    printf("Sum = %d\\n", a + b);
    return 0;
}
`;
  await setEditorCode(cCode);
  await wait(300);

  console.log('Clicking Run Code...');
  await evalJs("document.getElementById('btnActionRun').click()");

  let promptFound = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter two numbers:')) {
      promptFound = true;
      console.log('Prompt detected in terminal: "Enter two numbers:"');
      break;
    }
  }

  if (!promptFound) {
    console.error('Failed to see prompt!');
    process.exit(1);
  }

  console.log('Submitting live stdin: "25 75"...');
  await submitTerminalStdin('25 75');

  let sumFound = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Sum = 100')) {
      sumFound = true;
      console.log('SUCCESS: Terminal output verified "Sum = 100"');
      break;
    }
  }

  if (!sumFound) {
    console.error('Failed to verify Sum = 100!');
    process.exit(1);
  }

  await captureScreenshot('worker_interactive_c_verified.png');
  console.log('✔ Verified: C interactive execution on worker passed!');

  // Test Digital Calculator on Standalone Worker
  console.log('\n========================================');
  console.log('Testing Digital Calculator on Standalone Worker');
  console.log('========================================');

  const calcCode = `
#include <stdio.h>
int main() {
    int choice;
    double a, b;
    printf("--- DIGITAL CALCULATOR ---\\n");
    printf("1. Multiply (*)\\n");
    printf("2. Exit\\n");
    printf("Choice: ");
    scanf("%d", &choice);
    if (choice == 1) {
        printf("Enter numbers: ");
        scanf("%lf %lf", &a, &b);
        printf("Result: %.2lf\\n", a * b);
    }
    printf("Done\\n");
    return 0;
}
`;
  await evalJs("document.getElementById('btnTerminalClear').click()");
  await setEditorCode(calcCode);
  await wait(300);

  await evalJs("document.getElementById('btnActionRun').click()");

  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Choice:')) break;
  }

  console.log('Submitting choice 1 (Multiply)...');
  await submitTerminalStdin('1');

  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter numbers:')) break;
  }

  console.log('Submitting numbers: 12.5 4.0...');
  await submitTerminalStdin('12.5 4.0');

  let calcOk = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Result: 50.00')) {
      calcOk = true;
      console.log('SUCCESS: Calculator result verified: "Result: 50.00"');
      break;
    }
  }

  if (!calcOk) {
    console.error('Failed to verify calculator result!');
    process.exit(1);
  }

  await captureScreenshot('worker_calculator_live_verified.png');
  console.log('✔ Verified: Calculator interactive execution on worker passed!');

  // Clean up
  try { ws.close(); } catch(e) {}
  try { chrome.kill(); } catch(e) {}
  try { workerProc.kill(); } catch(e) {}
  try { serverProc.kill(); } catch(e) {}

  console.log('\n🎉 ALL WORKER + BROWSER INTEGRATION TESTS PASSED 100%!');
  process.exit(0);
}

run().catch(err => {
  console.error('Browser + Worker test failed:', err);
  process.exit(1);
});
