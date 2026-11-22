const { executeCode } = require('../api/_compiler');

async function testCMath() {
  console.log('Testing C GCC compilation with math functions (sin, cos, sqrt, pow, atan2)...');

  const code = `
#include <stdio.h>
#include <math.h>

int main() {
    double s = sin(1.5707963);
    double c = cos(0.0);
    double sq = sqrt(16.0);
    double p = pow(2.0, 8.0);
    double a = atan2(1.0, 1.0);
    printf("sin: %.4f, cos: %.4f, sqrt: %.4f, pow: %.4f, atan2: %.4f\\n", s, c, sq, p, a);
    return 0;
}
`;

  const res = await executeCode({
    language: 'c',
    source_code: code,
    stdin: ''
  });

  console.log('Success:', res.data.success);
  console.log('Status:', res.data.status);
  console.log('Stdout:', res.data.stdout);
  console.log('Stderr:', res.data.stderr);
  console.log('Compile output:', res.data.compile_output);
}

testCMath();
