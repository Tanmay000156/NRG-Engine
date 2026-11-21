function b64encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}
function b64decode(b64) {
  if (!b64) return '';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

async function testStdin() {
  const code = `#include <stdio.h>
int main() {
    char name[100];
    if (scanf("%s", name) == 1) {
        printf("Greeting: Hello, %s!\\n", name);
    }
    return 0;
}`;

  const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: 103, // C (GCC 14.1.0)
      source_code: b64encode(code),
      stdin: b64encode('Tanmay')
    })
  });
  const data = await res.json();
  console.log('Status:', data.status);
  console.log('Stdout:', b64decode(data.stdout));
}

testStdin();
