async function testBackend() {
  console.log('1. Testing /api/health...');
  const hRes = await fetch('http://localhost:3000/api/health');
  console.log('Health:', await hRes.json());

  console.log('\n2. Testing INVALID C Program (missing semicolon)...');
  const errCode = `#include <stdio.h>
int main() {
    printf("Hello World")
}`;
  const eRes = await fetch('http://localhost:3000/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'c', source_code: errCode })
  });
  const eData = await eRes.json();
  console.log('Success flag:', eData.success);
  console.log('Compilation success:', eData.compilation_success);
  console.log('Status description:', eData.status.description);
  console.log('Compile output:', eData.compile_output);
  console.log('Problems detected:', eData.problems);

  console.log('\n3. Testing VALID C Program (Hello World)...');
  const validCode = `#include <stdio.h>
int main() {
    printf("Hello World");
    return 0;
}`;
  const vRes = await fetch('http://localhost:3000/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'c', source_code: validCode })
  });
  const vData = await vRes.json();
  console.log('Success flag:', vData.success);
  console.log('Stdout:', vData.stdout);
  console.log('Exit code:', vData.exit_code);
  console.log('Time:', vData.time);
  console.log('Memory:', vData.memory);
}

testBackend();
