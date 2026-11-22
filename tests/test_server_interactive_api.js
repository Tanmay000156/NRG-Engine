const http = require('http');

// Start server on 3088
process.env.PORT = '3088';
require('../server.js');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.status, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.status, text: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  await wait(500); // Allow server to bind
  console.log('Testing Live Interactive API Endpoints on http://localhost:3088...');

  const cCode = `
#include <stdio.h>
int main() {
    int x;
    printf("Type a number: ");
    if (scanf("%d", &x) == 1) {
        printf("Interactive result: %d\\n", x * 2);
    }
    return 0;
}
  `;

  // 1. Start Session
  const startRes = await postJson('http://localhost:3088/api/interactive/start', {
    language: 'c',
    source_code: cCode
  });

  console.log('1. Start Session Response:', startRes.data);
  if (!startRes.data.success || !startRes.data.sessionId) {
    console.error('Failed to start session');
    process.exit(1);
  }

  const sessionId = startRes.data.sessionId;

  // 2. Connect Stream
  let streamOutput = '';
  let exited = false;
  let inputSent = false;

  const streamReq = http.request(`http://localhost:3088/api/interactive/stream?sessionId=${sessionId}`, res => {
    res.on('data', chunk => {
      const text = chunk.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'stdout') {
              streamOutput += event.data;
              console.log('[STREAM STDOUT]:', event.data);
              if (streamOutput.includes('Type a number:') && !inputSent) {
                inputSent = true;
                console.log('Prompt detected! Sending input "21"...');
                postJson('http://localhost:3088/api/interactive/input', {
                  sessionId,
                  input: '21'
                }).then(inRes => console.log('Input submission result:', inRes.data));
              }
            } else if (event.type === 'exit') {
              console.log('[STREAM EXIT]:', event);
              exited = true;
            }
          } catch(e) {}
        }
      }
    });
  });
  streamReq.end();

  // Wait for completion
  const startTime = Date.now();
  while (!exited && (Date.now() - startTime < 8000)) {
    await wait(100);
  }

  console.log('Full Stream Output:\n' + streamOutput);
  if (streamOutput.includes('Interactive result: 42')) {
    console.log('🎉 SERVER INTERACTIVE API TEST PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Server interactive API test failed: Did not receive expected output');
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Test crashed:', e);
  process.exit(1);
});
