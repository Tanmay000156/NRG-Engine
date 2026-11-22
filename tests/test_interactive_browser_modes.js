const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('=== STARTING 5-SUITE ACCEPTANCE VERIFICATION FOR NRG ENGINE ===');
  const port = 3060;
  process.env.PORT = String(port);

  // 1. Launch Server
  console.log(`Starting backend server on port ${port}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit'
  });

  await wait(1800);

  // 2. Launch Chrome
  const cdpPort = 9240;
  const userDataDir = path.join(require('os').tmpdir(), 'nrg_cdp_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log(`Launching Chrome on CDP port ${cdpPort}...`);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    `http://localhost:${port}`
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

  async function setBatchStdin(stdinVal) {
    return evalJs(`{
      const inp = document.getElementById('stdinInput');
      if (inp) {
        inp.value = ${JSON.stringify(stdinVal)};
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
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

  // ==========================================================================
  // TEST 1: BASIC C INPUT (MODE B: INTERACTIVE)
  // ==========================================================================
  console.log('\n========================================');
  console.log('TEST 1: Basic C Input (Interactive Mode B)');
  console.log('========================================');

  await evalJs("switchLanguage('c')");
  await setBatchStdin(''); // Empty Input tab -> MODE B

  const test1Code = `
#include <stdio.h>
int main() {
    int a, b;
    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);
    printf("Sum = %d\\n", a + b);
    return 0;
}
`;

  await setEditorCode(test1Code);
  await wait(300);
  console.log('Running Test 1 code (Input tab empty)...');
  await evalJs("document.getElementById('btnActionRun').click()");

  let test1Prompt = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter two numbers:')) {
      test1Prompt = true;
      console.log('Prompt detected: "Enter two numbers:"');
      break;
    }
  }

  if (!test1Prompt) {
    console.error('Failed to see Test 1 prompt!');
    process.exit(1);
  }

  console.log('Submitting live terminal stdin: "10 20"...');
  await submitTerminalStdin('10 20');

  let test1Done = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Sum = 30')) {
      test1Done = true;
      console.log('SUCCESS: Terminal output verified "Sum = 30"');
      break;
    }
  }

  if (!test1Done) {
    console.error('Failed to verify Test 1 output!');
    process.exit(1);
  }

  await captureScreenshot('test1_c_basic_interactive.png');
  console.log('✅ TEST 1 PASSED: Basic C input interactive verified!');

  // ==========================================================================
  // TEST 2: MULTIPLE SCANF REQUESTS (MODE B: INTERACTIVE)
  // ==========================================================================
  console.log('\n========================================');
  console.log('TEST 2: Multiple scanf Requests (Interactive Mode B)');
  console.log('========================================');

  await evalJs("document.getElementById('btnTerminalClear').click()");
  await setBatchStdin(''); // Empty Input tab -> MODE B

  const test2Code = `
#include <stdio.h>
int main() {
    int a, b;
    printf("First number: ");
    scanf("%d", &a);
    printf("Second number: ");
    scanf("%d", &b);
    printf("Product = %d\\n", a * b);
    return 0;
}
`;

  await setEditorCode(test2Code);
  await wait(300);
  console.log('Running Test 2 code...');
  await evalJs("document.getElementById('btnActionRun').click()");

  let test2P1 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('First number:')) {
      test2P1 = true;
      console.log('Prompt 1 detected: "First number:"');
      break;
    }
  }

  if (!test2P1) {
    console.error('Failed to see Test 2 prompt 1!');
    process.exit(1);
  }

  console.log('Submitting live stdin: "10"...');
  await submitTerminalStdin('10');

  let test2P2 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Second number:')) {
      test2P2 = true;
      console.log('Prompt 2 detected: "Second number:"');
      break;
    }
  }

  if (!test2P2) {
    console.error('Failed to see Test 2 prompt 2!');
    process.exit(1);
  }

  console.log('Submitting live stdin: "20"...');
  await submitTerminalStdin('20');

  let test2Done = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Product = 200')) {
      test2Done = true;
      console.log('SUCCESS: Terminal output verified "Product = 200"');
      break;
    }
  }

  if (!test2Done) {
    console.error('Failed to verify Test 2 output!');
    process.exit(1);
  }

  await captureScreenshot('test2_c_multi_scanf.png');
  console.log('✅ TEST 2 PASSED: Multiple scanf interactive verified!');

  // ==========================================================================
  // TEST 3: MENU-DRIVEN DIGITAL CALCULATOR (MODE B: INTERACTIVE)
  // ==========================================================================
  console.log('\n========================================');
  console.log('TEST 3: Menu-Driven Digital Calculator (Interactive Mode B)');
  console.log('========================================');

  await evalJs("document.getElementById('btnTerminalClear').click()");
  await setBatchStdin('');

  const calcCode = `
#include <stdio.h>

int main() {
    int choice;
    double num1, num2, result;

    do {
        printf("\\n========================================\\n");
        printf("          DIGITAL CALCULATOR            \\n");
        printf("========================================\\n");
        printf("1. Addition (+)\\n");
        printf("2. Subtraction (-)\\n");
        printf("3. Multiplication (*)\\n");
        printf("4. Division (/)\\n");
        printf("5. Modulus (%%)\\n");
        printf("6. Exit\\n");
        printf("----------------------------------------\\n");
        printf("Enter your choice (1-6): ");
        if (scanf("%d", &choice) != 1) break;

        if (choice >= 1 && choice <= 5) {
            printf("Enter first number: ");
            scanf("%lf", &num1);
            printf("Enter second number: ");
            scanf("%lf", &num2);

            switch (choice) {
                case 1:
                    result = num1 + num2;
                    printf("Result: %.2lf + %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 2:
                    result = num1 - num2;
                    printf("Result: %.2lf - %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 3:
                    result = num1 * num2;
                    printf("Result: %.2lf * %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 4:
                    if (num2 != 0) {
                        result = num1 / num2;
                        printf("Result: %.2lf / %.2lf = %.2lf\\n", num1, num2, result);
                    } else {
                        printf("Error: Division by zero!\\n");
                    }
                    break;
                case 5:
                    printf("Result: %d %% %d = %d\\n", (int)num1, (int)num2, (int)num1 % (int)num2);
                    break;
            }
        } else if (choice == 6) {
            printf("Exiting Calculator. Thank you!\\n");
        } else {
            printf("Invalid choice! Please select 1-6.\\n");
        }
    } while (choice != 6);

    return 0;
}
`;

  await setEditorCode(calcCode);
  await wait(300);
  console.log('Running Digital Calculator...');
  await evalJs("document.getElementById('btnActionRun').click()");

  // Step 1: Wait for menu and choice prompt
  let calcP1 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter your choice (1-6):')) {
      calcP1 = true;
      console.log('Calculator Menu detected! Prompting choice.');
      break;
    }
  }

  if (!calcP1) {
    console.error('Failed to see Calculator menu!');
    process.exit(1);
  }

  console.log('Submitting choice 1 (Addition)...');
  await submitTerminalStdin('1');

  // Step 2: Wait for first number prompt
  let calcP2 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter first number:')) {
      calcP2 = true;
      console.log('Prompt detected: "Enter first number:"');
      break;
    }
  }

  if (!calcP2) {
    console.error('Failed to see first number prompt!');
    process.exit(1);
  }

  console.log('Submitting first number: 15...');
  await submitTerminalStdin('15');

  // Step 3: Wait for second number prompt
  let calcP3 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter second number:')) {
      calcP3 = true;
      console.log('Prompt detected: "Enter second number:"');
      break;
    }
  }

  if (!calcP3) {
    console.error('Failed to see second number prompt!');
    process.exit(1);
  }

  console.log('Submitting second number: 35...');
  await submitTerminalStdin('35');

  // Step 4: Wait for result and loop back to menu
  let calcP4 = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Result: 15.00 + 35.00 = 50.00') && text.lastIndexOf('Enter your choice (1-6):') > text.indexOf('Result: 15.00 + 35.00 = 50.00')) {
      calcP4 = true;
      console.log('Calculation verified (50.00)! Menu looped back.');
      break;
    }
  }

  if (!calcP4) {
    console.error('Failed to loop back after calculation!');
    process.exit(1);
  }

  console.log('Submitting choice 6 (Exit)...');
  await submitTerminalStdin('6');

  let calcDone = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Exiting Calculator. Thank you!')) {
      calcDone = true;
      console.log('SUCCESS: Calculator cleanly exited with greeting!');
      break;
    }
  }

  if (!calcDone) {
    console.error('Failed to verify Calculator exit!');
    process.exit(1);
  }

  await captureScreenshot('test3_digital_calculator_loop.png');
  console.log('✅ TEST 3 PASSED: Menu-driven Calculator interactive loop verified!');

  // ==========================================================================
  // TEST 4: PYTHON INPUT() (MODE B: INTERACTIVE)
  // ==========================================================================
  console.log('\n========================================');
  console.log('TEST 4: Python input() (Interactive Mode B)');
  console.log('========================================');

  await evalJs("document.getElementById('btnTerminalClear').click()");
  await evalJs("switchLanguage('python')");
  await setBatchStdin('');

  const pyCode = `
name = input("Enter your name: ")
print("Welcome", name)
`;

  await setEditorCode(pyCode);
  await wait(300);
  console.log('Running Python interactive code...');
  await evalJs("document.getElementById('btnActionRun').click()");

  let pyPrompt = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Enter your name:')) {
      pyPrompt = true;
      console.log('Python prompt detected: "Enter your name:"');
      break;
    }
  }

  if (!pyPrompt) {
    console.error('Failed to see Python prompt!');
    process.exit(1);
  }

  console.log('Submitting live stdin: "Tanmay"...');
  await submitTerminalStdin('Tanmay');

  let pyDone = false;
  for (let i = 0; i < 30; i++) {
    await wait(200);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Welcome Tanmay')) {
      pyDone = true;
      console.log('SUCCESS: Python output verified "Welcome Tanmay"');
      break;
    }
  }

  if (!pyDone) {
    console.error('Failed to verify Python output!');
    process.exit(1);
  }

  await captureScreenshot('test4_python_interactive.png');
  console.log('✅ TEST 4 PASSED: Python interactive input() verified!');

  // ==========================================================================
  // TEST 5: EXISTING BATCH MODE (MODE A: BATCH INPUT VIA JUDGE0)
  // ==========================================================================
  console.log('\n========================================');
  console.log('TEST 5: Batch Mode via Judge0 (Mode A with Input Tab Stdin)');
  console.log('========================================');

  await evalJs("document.getElementById('btnTerminalClear').click()");
  await evalJs("switchLanguage('c')");

  // Provide batch stdin in Input tab: "10 20"
  await setBatchStdin('10 20');
  await setEditorCode(test1Code);
  await wait(300);

  console.log('Running code with "10 20" in Input tab -> MODE A (Batch Execution)...');
  await evalJs("document.getElementById('btnActionRun').click()");

  let batchDone = false;
  for (let i = 0; i < 40; i++) {
    await wait(300);
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    if (text && text.includes('Mode A: Batch Input') && text.includes('Sum = 30')) {
      batchDone = true;
      console.log('SUCCESS: Batch Mode A verified with Judge0 pipeline & "Sum = 30"');
      break;
    }
  }

  if (!batchDone) {
    const text = await evalJs("document.getElementById('termLogStream').innerText");
    console.error('Failed to verify Batch Mode A! Output:\n', text);
    process.exit(1);
  }

  await captureScreenshot('test5_batch_mode_verified.png');
  console.log('✅ TEST 5 PASSED: Existing Batch Mode (Judge0) 100% verified!');

  console.log('\n🎉 ALL 5 MANDATORY ACCEPTANCE TESTS PASSED WITH 100% ACCURACY!');

  try { ws.close(); } catch(e) {}
  try { chrome.kill(); } catch(e) {}
  try { server.kill(); } catch(e) {}

  process.exit(0);
}

run().catch(err => {
  console.error('Acceptance suite failed:', err);
  process.exit(1);
});
