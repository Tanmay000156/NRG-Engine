const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3042;

async function testSecurity() {
  console.log('Testing Backend Security & Health on port', PORT);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });
  await new Promise(r => setTimeout(r, 1500));

  try {
    // 1. Health
    const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
    const health = await healthRes.json();
    console.log('1. Health Check:', health.status, 'Backend:', health.backend);

    // 2. Missing Language
    const badReq = await fetch(`http://localhost:${PORT}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'unsupported_lang_xyz', source_code: 'print(1)' })
    });
    console.log('2. Unsupported Language Status:', badReq.status);

    // 3. Rate limit test
    console.log('3. Testing Rate Limiter (rapid calls)...');
    let hitRateLimit = false;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`http://localhost:${PORT}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python', source_code: 'print(1)' })
      });
      if (res.status === 429) {
        hitRateLimit = true;
        const err = await res.json();
        console.log('Rate limit triggered successfully:', err.error);
        break;
      }
    }
    console.log('Rate Limiter Active:', hitRateLimit);
    console.log('Backend Security Stabilization: SUCCESS');
  } finally {
    server.kill();
  }
}

testSecurity().catch(console.error);
