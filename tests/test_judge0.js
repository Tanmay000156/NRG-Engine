const errorSnippet = `#include <stdio.h>
int main() {
    printf("Hello World")
}
`;

function b64encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function b64decode(b64) {
  if (!b64) return null;
  return Buffer.from(b64, 'base64').toString('utf-8');
}

async function testErrorB64() {
  const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: 50,
      source_code: b64encode(errorSnippet)
    })
  });
  console.log('Status HTTP:', res.status);
  const data = await res.json();
  console.log('Raw data status:', data.status);
  console.log('Decoded compile_output:\n', b64decode(data.compile_output));
  console.log('Decoded stderr:\n', b64decode(data.stderr));
  console.log('Decoded stdout:\n', b64decode(data.stdout));
}

testErrorB64();
