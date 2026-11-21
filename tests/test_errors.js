function b64encode(str) { return Buffer.from(str, 'utf-8').toString('base64'); }
function b64decode(b64) { if (!b64) return ''; return Buffer.from(b64, 'base64').toString('utf-8'); }

async function testErrors() {
  console.log('Testing Runtime Error (Python ZeroDivisionError)...');
  const r1 = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: 100, // Python
      source_code: b64encode('print(10 / 0)')
    })
  });
  const d1 = await r1.json();
  console.log('R1 Status:', d1.status);
  console.log('R1 Stderr:', b64decode(d1.stderr));

  console.log('Testing Infinite Loop (C while(1))...');
  const r2 = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: 103, // C
      source_code: b64encode('int main() { while(1); return 0; }'),
      cpu_time_limit: 2
    })
  });
  const d2 = await r2.json();
  console.log('R2 Status:', d2.status);
  console.log('R2 Message:', b64decode(d2.message));
}

testErrors();
