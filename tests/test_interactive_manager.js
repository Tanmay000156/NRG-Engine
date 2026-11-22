const manager = require('../api/_interactive_manager');

async function runTests() {
  console.log('--- TEST 1: C Interactive Session & SSE Stream ---');
  
  const cCode = `
#include <stdio.h>
int main() {
    int num;
    printf("Enter number: ");
    if (scanf("%d", &num) == 1) {
        printf("You entered: %d\\n", num);
    } else {
        printf("Failed to read\\n");
    }
    return 0;
}
  `;

  const startRes = await manager.startSession({ language: 'c', source_code: cCode });
  if (!startRes.success) {
    console.error('Failed to start session:', startRes);
    process.exit(1);
  }
  const sessionId = startRes.sessionId;
  console.log('Session started:', sessionId);

  let fullOutput = '';
  let exitReceived = false;

  // Mock HTTP response for SSE
  const mockRes = {
    writeHead: (code, headers) => {
      console.log('SSE writeHead:', code);
    },
    write: (data) => {
      const match = data.match(/data: (.*)\n\n/);
      if (match) {
        try {
          const event = JSON.parse(match[1]);
          // console.log('[EVENT]:', event.type, event.data || event.code);
          if (event.type === 'stdout') {
            fullOutput += event.data;
            if (event.data.includes('Enter number:')) {
              console.log('Prompt detected! Sending input "99"...');
              setTimeout(() => {
                const inRes = manager.sendInput(sessionId, '99');
                console.log('sendInput result:', inRes);
              }, 100);
            }
          } else if (event.type === 'exit') {
            exitReceived = true;
            console.log('Exit event received! Code:', event.code, 'Duration:', event.duration);
          }
        } catch (e) {}
      }
    },
    end: () => {},
    on: () => {}
  };

  manager.subscribeStream(sessionId, mockRes);

  // Wait for completion
  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (exitReceived) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });

  console.log('Full Output from Session:', fullOutput);
  if (!fullOutput.includes('You entered: 99')) {
    console.error('❌ Test 1 failed: Expected "You entered: 99"');
    process.exit(1);
  }
  console.log('✅ Test 1 Passed!');

  console.log('\n--- TEST 2: Python Interactive Session ---');
  const pyCode = `
val = input("Enter secret: ")
print("Secret was:", val)
  `;

  const pyStart = await manager.startSession({ language: 'python', source_code: pyCode });
  if (!pyStart.success) {
    console.error('Failed to start python session:', pyStart);
    process.exit(1);
  }
  const pyId = pyStart.sessionId;

  let pyOutput = '';
  let pyExit = false;

  const mockPyRes = {
    writeHead: () => {},
    write: (data) => {
      const match = data.match(/data: (.*)\n\n/);
      if (match) {
        try {
          const event = JSON.parse(match[1]);
          if (event.type === 'stdout') {
            pyOutput += event.data;
            if (event.data.includes('Enter secret:')) {
              console.log('Python prompt detected! Sending "NRG_ROCKETS"...');
              setTimeout(() => {
                manager.sendInput(pyId, 'NRG_ROCKETS');
              }, 100);
            }
          } else if (event.type === 'exit') {
            pyExit = true;
          }
        } catch (e) {}
      }
    },
    end: () => {},
    on: () => {}
  };

  manager.subscribeStream(pyId, mockPyRes);

  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (pyExit) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });

  console.log('Python Full Output:', pyOutput);
  if (!pyOutput.includes('Secret was: NRG_ROCKETS')) {
    console.error('❌ Test 2 failed!');
    process.exit(1);
  }
  console.log('✅ Test 2 Passed!');

  console.log('\n--- TEST 3: Compilation Error Handling ---');
  const badCode = `int main() { undefined_function(); }`;
  const badRes = await manager.startSession({ language: 'c', source_code: badCode });
  if (badRes.success || !badRes.compile_output) {
    console.error('❌ Test 3 failed: Expected compile error');
    process.exit(1);
  }
  console.log('Compile Error captured correctly:', badRes.compile_output.slice(0, 100));
  console.log('✅ Test 3 Passed!');

  console.log('\n--- TEST 4: Stop / Terminate Session ---');
  const infiniteCode = `
#include <stdio.h>
int main() {
    printf("Starting infinite wait...\\n");
    int x;
    scanf("%d", &x);
    while(1) {}
    return 0;
}
  `;
  const infStart = await manager.startSession({ language: 'c', source_code: infiniteCode });
  const infId = infStart.sessionId;
  await new Promise(r => setTimeout(r, 300));
  const stopRes = manager.stopSession(infId);
  console.log('Stop session result:', stopRes);
  if (!stopRes.success) {
    console.error('❌ Test 4 failed!');
    process.exit(1);
  }
  console.log('✅ Test 4 Passed!');

  console.log('\n🎉 ALL INTERACTIVE MANAGER UNIT TESTS PASSED!');
  process.exit(0);
}

runTests().catch(e => {
  console.error('Test run failed:', e);
  process.exit(1);
});
