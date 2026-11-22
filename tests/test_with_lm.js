const { b64encode, JUDGE0_API_URL } = require('../api/_compiler');

async function testWithLm() {
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
  console.log('Testing Judge0 C WITH compiler_options: "-lm"...');
  const payload = {
    language_id: 103, // C (GCC 14.1.0)
    source_code: b64encode(code),
    stdin: b64encode(''),
    compiler_options: '-lm'
  };

  const response = await fetch(`${JUDGE0_API_URL || 'https://ce.judge0.com'}/submissions?base64_encoded=true&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const res = await response.json();
  const out = Buffer.from(res.stdout || '', 'base64').toString();
  const compile = Buffer.from(res.compile_output || '', 'base64').toString();
  console.log('Status:', res.status);
  console.log('Out:', out);
  console.log('Compile:', compile);
}

testWithLm();
