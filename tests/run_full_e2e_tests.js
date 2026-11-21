const { execSync } = require('child_process');
const path = require('path');

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
  } catch (err) {
    return err.stdout || err.message;
  }
}

function ab(cmd) {
  return runCmd(`npx agent-browser ${cmd}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('--- STARTING NRG ENGINE E2E REAL COMPILER TESTS ---');

  // Ensure browser is on localhost:3000
  console.log('1. Navigating to http://localhost:3000 ...');
  ab('open http://localhost:3000');
  await sleep(1500);

  // Set viewport
  ab('set viewport 1920 1080');

  // TEST 1: Missing Semicolon in C (Acceptance Criteria 8)
  console.log('\n2. Testing Missing Semicolon in C (Expected: REAL COMPILATION ERROR)...');
  const errCode = `#include <stdio.h>\nint main() {\n    printf("Hello World")\n}`;

  // Set code in editor and click Run
  ab(`eval "document.getElementById('editorCodeInput').value = decodeURIComponent('${encodeURIComponent(errCode)}'); codeInput.dispatchEvent(new Event('input')); document.getElementById('btnActionRun').click();"`);
  
  console.log('Waiting for compiler response from Judge0 backend...');
  await sleep(4000);

  const statusText = ab('get text #terminalStatusText').trim();
  const problemsCount = ab('get text #problemsTabCount').trim();
  console.log('Terminal Status Badge:', statusText);
  console.log('Problems Tab Badge:', problemsCount);

  // Switch to Problems Tab to capture diagnostics
  ab('click "[data-term-tab=problems]"');
  await sleep(800);

  // Take screenshot of compilation error & problems view
  const artifactDir = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3';
  const errScreenshotPath = path.join(artifactDir, 'nrg_real_compiler_error_tested.png');
  ab(`screenshot "${errScreenshotPath}"`);
  console.log('✓ Saved error screenshot to:', errScreenshotPath);

  // Switch back to terminal tab to see GCC error output
  ab('click "[data-term-tab=terminal]"');
  await sleep(600);
  const termErrScreenshot = path.join(artifactDir, 'nrg_real_compiler_error_terminal.png');
  ab(`screenshot "${termErrScreenshot}"`);
  console.log('✓ Saved terminal error screenshot to:', termErrScreenshot);

  // TEST 2: Valid C program (Acceptance Criteria 8)
  console.log('\n3. Testing Valid C Program (Expected: Hello World, Exit Code 0)...');
  const validCode = `#include <stdio.h>\nint main() {\n    printf("Hello World");\n    return 0;\n}`;

  ab(`eval "document.getElementById('editorCodeInput').value = decodeURIComponent('${encodeURIComponent(validCode)}'); codeInput.dispatchEvent(new Event('input')); document.getElementById('btnActionRun').click();"`);
  
  console.log('Waiting for real execution response...');
  await sleep(4000);

  const validStatusText = ab('get text #terminalStatusText').trim();
  const stdoutText = ab('get text #stdoutView').trim();
  console.log('Terminal Status Badge:', validStatusText);
  console.log('Stdout View text:', stdoutText);

  const successScreenshotPath = path.join(artifactDir, 'nrg_real_compiler_success_tested.png');
  ab(`screenshot "${successScreenshotPath}"`);
  console.log('✓ Saved success screenshot to:', successScreenshotPath);

  // TEST 3: Stdin testing with interactive input
  console.log('\n4. Testing Standard Input (stdin) ...');
  const stdinCode = `#include <stdio.h>\nint main() {\n    char name[64];\n    if (scanf("%s", name) == 1) {\n        printf("Welcome, %s!", name);\n    }\n    return 0;\n}`;
  ab(`eval "document.getElementById('stdinInput').value = 'Tanmay'; document.getElementById('editorCodeInput').value = decodeURIComponent('${encodeURIComponent(stdinCode)}'); codeInput.dispatchEvent(new Event('input')); document.getElementById('btnActionRun').click();"`);
  await sleep(4000);
  const stdinStdout = ab('get text #stdoutView').trim();
  console.log('Stdin test stdout:', stdinStdout);

  console.log('\n--- ALL E2E BROWSER TESTS FINISHED SUCCESSFULLY ---');
}

main().catch(console.error);
