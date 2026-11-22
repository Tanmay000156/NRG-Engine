const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cFile = path.join(__dirname, 'test_loop.c');
const exeFile = path.join(__dirname, 'test_loop.exe');

const cCode = `
#include <stdio.h>

__attribute__((constructor)) void __nrg_disable_buffering() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
}

int main() {
    int choice;
    do {
        printf("\\n1. Say Hi\\n2. Exit\\nEnter choice: ");
        if (scanf("%d", &choice) != 1) break;
        if (choice == 1) printf("Hello from NRG Engine!\\n");
    } while (choice != 2);
    printf("Goodbye!\\n");
    return 0;
}
`;

fs.writeFileSync(cFile, cCode, 'utf8');
execSync(`gcc -O0 -o "${exeFile}" "${cFile}"`);

const child = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
let output = '';
let iter = 0;

child.stdout.on('data', (d) => {
  const str = d.toString();
  output += str;
  if (str.includes('Enter choice:')) {
    iter++;
    if (iter === 1) {
      setTimeout(() => child.stdin.write('1\n'), 100);
    } else if (iter === 2) {
      setTimeout(() => child.stdin.write('1\n'), 100);
    } else if (iter === 3) {
      setTimeout(() => child.stdin.write('2\n'), 100);
    }
  }
});

child.on('close', (code) => {
  try { fs.unlinkSync(cFile); } catch (e) {}
  try { fs.unlinkSync(exeFile); } catch (e) {}

  if (output.includes('Goodbye!') && output.split('Hello from NRG Engine!').length === 3 && code === 0) {
    console.log('✅ TEST PASSED: Repeated input inside loop verified!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Loop test failed. Output:\n' + output);
    process.exit(1);
  }
});
