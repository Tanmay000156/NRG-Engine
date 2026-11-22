const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cFile = path.join(__dirname, 'test_edge.c');
const exeFile = path.join(__dirname, 'test_edge.exe');

const cCode = `
#include <stdio.h>

__attribute__((constructor)) static void __nrg_unbuffer() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

int main() {
    char name[64];
    float f;
    int n;

    printf("Enter string: ");
    scanf("%63s", name);

    printf("Enter float: ");
    scanf("%f", &f);

    printf("Enter negative int: ");
    scanf("%d", &n);

    printf("RESULT: str=%s float=%.2f int=%d\\n", name, f, n);
    return 0;
}
`;

fs.writeFileSync(cFile, cCode, 'utf8');
execSync(`gcc -O0 -o "${exeFile}" "${cFile}"`);

const child = spawn(exeFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
let out = '';
let step = 0;

child.stdout.on('data', (d) => {
  out += d.toString();
  if (step === 0 && out.includes('Enter string:')) {
    step = 1;
    setTimeout(() => child.stdin.write('TanmayVerma\n'), 20);
  }
  if (step === 1 && out.includes('Enter float:')) {
    step = 2;
    setTimeout(() => child.stdin.write('3.14159\n'), 20);
  }
  if (step === 2 && out.includes('Enter negative int:')) {
    step = 3;
    setTimeout(() => child.stdin.write('-42\n'), 20);
  }
});

child.on('close', (code) => {
  try { fs.unlinkSync(cFile); } catch (e) {}
  try { fs.unlinkSync(exeFile); } catch (e) {}

  console.log('Edge cases output:', out);
  if (out.includes('RESULT: str=TanmayVerma float=3.14 int=-42') && code === 0) {
    console.log('✅ TEST PASSED: Strings, floats, and negative integers verified!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Edge cases output mismatch');
    process.exit(1);
  }
});
