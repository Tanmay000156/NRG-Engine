const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testWorker() {
  console.log('=== STARTING COMPREHENSIVE STANDALONE WORKER VERIFICATION ===');
  const workerPort = 3001;

  // 1. Launch standalone worker
  console.log(`Starting standalone worker process on port ${workerPort}...`);
  const workerProcess = spawn('node', ['worker/worker.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(workerPort) },
    stdio: 'inherit'
  });

  await wait(1500);

  // 2. Test HTTP /health endpoint
  console.log('\n--- 1. Testing Worker HTTP /health ---');
  const healthRes = await fetch(`http://localhost:${workerPort}/health`).then(r => r.json());
  console.log('Health response:', healthRes);
  if (healthRes.status !== 'ok' || healthRes.service !== 'nrg-interactive-worker') {
    throw new Error('Worker health check failed');
  }
  console.log('✔ Health endpoint test passed!');

  // 3. Test HTTP /status endpoint
  console.log('\n--- 2. Testing Worker HTTP /status ---');
  const statusRes = await fetch(`http://localhost:${workerPort}/status`).then(r => r.json());
  console.log('Status response:', statusRes.status, 'Free Mem MB:', statusRes.system?.free_mem_mb);
  if (statusRes.status !== 'online') {
    throw new Error('Worker status check failed');
  }
  console.log('✔ Status endpoint test passed!');

  // 4. Test WebSocket /ws connection and C scanf execution
  console.log('\n--- 3. Testing WebSocket /ws connection with C scanf ---');
  const ws = new WebSocket(`ws://localhost:${workerPort}/ws`);

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  console.log('✔ WebSocket handshake established to ws://localhost:3001/ws');

  const cCode = `
#include <stdio.h>
int main() {
    int a, b;
    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);
    printf("Sum = %d\\n", a + b);
    return 0;
}
`;

  let fullOutput = '';
  let inputSent = false;
  let test3Passed = false;

  await new Promise((resolve, reject) => {
    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'stdout') {
        fullOutput += msg.data;
        process.stdout.write(msg.data);

        if (fullOutput.includes('Enter two numbers:') && !inputSent) {
          inputSent = true;
          console.log('\n[TEST SENDING STDIN]: 10 20');
          ws.send(JSON.stringify({ type: 'stdin', data: '10 20' }));
        }
      }

      if (msg.type === 'exit') {
        console.log('\nProcess exited with code:', msg.code, 'duration:', msg.duration);
        if (fullOutput.includes('Sum = 30') && msg.code === 0) {
          test3Passed = true;
          console.log('✔ C interactive execution on standalone worker passed!');
          resolve();
        } else {
          reject(new Error('C execution output mismatch: ' + fullOutput));
        }
      }
    });

    ws.send(JSON.stringify({
      type: 'start',
      language: 'c',
      source_code: cCode
    }));
  });

  ws.close();

  // 5. Test Python interactive on worker
  console.log('\n--- 4. Testing Python interactive on worker ---');
  const wsPy = new WebSocket(`ws://localhost:${workerPort}/ws`);
  await new Promise(r => wsPy.on('open', r));

  const pyCode = `
name = input("Enter your name: ")
print("Hello", name)
`;

  let pyOutput = '';
  let pyInputSent = false;

  await new Promise((resolve, reject) => {
    wsPy.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'stdout') {
        pyOutput += msg.data;
        process.stdout.write(msg.data);

        if (pyOutput.includes('Enter your name:') && !pyInputSent) {
          pyInputSent = true;
          console.log('\n[TEST SENDING PYTHON STDIN]: Tanmay');
          wsPy.send(JSON.stringify({ type: 'stdin', data: 'Tanmay' }));
        }
      }

      if (msg.type === 'exit') {
        console.log('\nPython exited with code:', msg.code);
        if (pyOutput.includes('Hello Tanmay') && msg.code === 0) {
          console.log('✔ Python interactive execution on standalone worker passed!');
          resolve();
        } else {
          reject(new Error('Python output mismatch: ' + pyOutput));
        }
      }
    });

    wsPy.send(JSON.stringify({
      type: 'start',
      language: 'python',
      source_code: pyCode
    }));
  });

  wsPy.close();

  // Clean up worker
  workerProcess.kill();
  console.log('\n🎉 ALL STANDALONE WORKER TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

testWorker().catch(err => {
  console.error('Standalone worker test failed:', err);
  process.exit(1);
});
