const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const cFile = path.join(testDir, 'test_interactive.c');
const exeFile = path.join(testDir, 'test_interactive.exe');

const cCode = `
#include <stdio.h>

__attribute__((constructor)) void __nrg_disable_buffering() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
}

int main() {
    int a, b;
    printf("Enter first number: ");
    if (scanf("%d", &a) != 1) {
        printf("Error reading a\\n");
        return 1;
    }
    printf("Enter second number: ");
    if (scanf("%d", &b) != 1) {
        printf("Error reading b\\n");
        return 1;
    }
    printf("Sum = %d\\n", a + b);
    return 0;
}
`;

fs.writeFileSync(cFile, cCode, 'utf8');

try {
  console.log('Compiling test_interactive.c with gcc...');
  execSync(`gcc -O0 -o "${exeFile}" "${cFile}"`, { stdio: 'inherit' });
  console.log('Compilation succeeded!');
} catch (e) {
  console.error('Compilation failed:', e.message);
  process.exit(1);
}

console.log('Spawning process with piped stdio...');
const child = spawn(exeFile, [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let outputHistory = '';
let step = 0;

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  outputHistory += text;
  process.stdout.write(`[STDOUT RECV]: ${JSON.stringify(text)}\n`);

  if (step === 0 && text.includes('Enter first number:')) {
    step = 1;
    console.log('--> Received prompt 1! Waiting 200ms then typing 10...');
    setTimeout(() => {
      console.log('--> Writing "10\\n" to child stdin');
      child.stdin.write('10\n');
    }, 200);
  } else if (step === 1 && text.includes('Enter second number:')) {
    step = 2;
    console.log('--> Received prompt 2! Waiting 200ms then typing 20...');
    setTimeout(() => {
      console.log('--> Writing "20\\n" to child stdin');
      child.stdin.write('20\n');
    }, 200);
  }
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(`[STDERR RECV]: ${chunk.toString()}\n`);
});

child.on('close', (code) => {
  console.log(`Child exited with code ${code}`);
  console.log('Full Output Received:\n' + outputHistory);
  
  // Cleanup
  try { fs.unlinkSync(cFile); } catch (e) {}
  try { fs.unlinkSync(exeFile); } catch (e) {}

  if (outputHistory.includes('Sum = 30') && code === 0) {
    console.log('✅ TEST PASSED: Real-time interactive STDIN verified!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Output did not contain Sum = 30');
    process.exit(1);
  }
});
