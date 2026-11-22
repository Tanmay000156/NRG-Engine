const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cFile = path.join(__dirname, 'test_multi.c');
const exeFile = path.join(__dirname, 'test_multi.exe');

const cCode = `
#include <stdio.h>

__attribute__((constructor)) static void __nrg_unbuffer() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

int main() {
    int a, b;
    printf("Enter two numbers: ");
    if (scanf("%d %d", &a, &b) == 2) {
        printf("Received: a=%d, b=%d, Sum=%d\\n", a, b, a + b);
    } else {
        printf("Scanf failed\\n");
    }
    return 0;
}
`;

fs.writeFileSync(cFile, cCode, 'utf8');
execSync(`gcc -O0 -o "${exeFile}" "${cFile}"`);

// Case 1: Separate inputs (10<Enter>, then 20<Enter>)
const child1 = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
let out1 = '';
child1.stdout.on('data', (d) => {
  out1 += d.toString();
  if (out1.includes('Enter two numbers:') && !out1.includes('Received:')) {
    setTimeout(() => {
      child1.stdin.write('10\n');
      setTimeout(() => {
        child1.stdin.write('20\n');
      }, 100);
    }, 100);
  }
});

child1.on('close', (code1) => {
  console.log('Case 1 Output:', out1);
  if (!out1.includes('Sum=30')) {
    console.error('Case 1 failed!');
    process.exit(1);
  }

  // Case 2: Space-separated input on single line ("15 25\n")
  const child2 = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out2 = '';
  child2.stdout.on('data', (d) => {
    out2 += d.toString();
    if (out2.includes('Enter two numbers:') && !out2.includes('Received:')) {
      setTimeout(() => {
        child2.stdin.write('15 25\n');
      }, 100);
    }
  });

  child2.on('close', (code2) => {
    try { fs.unlinkSync(cFile); } catch (e) {}
    try { fs.unlinkSync(exeFile); } catch (e) {}

    console.log('Case 2 Output:', out2);
    if (out2.includes('Sum=40')) {
      console.log('✅ TEST PASSED: Both separate newlines and space-separated multi-variable inputs work perfectly!');
      process.exit(0);
    } else {
      console.error('Case 2 failed!');
      process.exit(1);
    }
  });
});
