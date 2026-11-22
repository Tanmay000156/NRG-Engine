const { submitToJudge0 } = require('../api/_compiler');

async function testDynamicMath() {
  const code = `
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(int argc, char** argv) {
    volatile double x = 1.2345;
    double s = sin(x);
    double c = cos(x);
    printf("sin(%.2f)=%.4f, cos(%.2f)=%.4f\\n", x, s, x, c);
    return 0;
}
`;
  console.log('Testing Judge0 C without compiler_options...');
  try {
    const res = await submitToJudge0(103, code, '');
    const out = Buffer.from(res.stdout || '', 'base64').toString();
    const err = Buffer.from(res.stderr || '', 'base64').toString();
    const compile = Buffer.from(res.compile_output || '', 'base64').toString();
    console.log('Status:', res.status);
    console.log('Out:', out);
    console.log('Compile:', compile);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testDynamicMath();
