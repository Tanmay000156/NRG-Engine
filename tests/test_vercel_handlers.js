/**
 * Test Suite: Vercel Serverless Handlers Verification
 * Tests api/health.js, api/languages.js, and api/execute.js using mock Vercel req/res objects.
 */

const healthHandler = require('../api/health');
const languagesHandler = require('../api/languages');
const executeHandler = require('../api/execute');
const { EventEmitter } = require('events');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, val) {
      this.headers[key] = val;
    },
    writeHead(status, headers = {}) {
      this.statusCode = status;
      Object.assign(this.headers, headers);
    },
    end(content) {
      this.body = content;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.setHeader('Content-Type', 'application/json');
      this.body = JSON.stringify(data);
    }
  };
  return res;
}

function createMockReq(method, body = null) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = { 'content-type': 'application/json' };
  req.body = body;
  return req;
}

async function runTests() {
  console.log('========================================================');
  console.log('⚡ TESTING NRG ENGINE VERCEL SERVERLESS HANDLERS');
  console.log('========================================================\n');

  // Test 1: Health Handler
  console.log('1. Testing GET /api/health...');
  const healthRes = createMockRes();
  await healthHandler(createMockReq('GET'), healthRes);
  const healthData = JSON.parse(healthRes.body);
  if (healthRes.statusCode === 200 && healthData.status === 'online') {
    console.log('   ✅ Health endpoint OK: Status 200, Backend: ' + healthData.backend);
  } else {
    console.error('   ❌ Health endpoint failed:', healthRes.body);
    process.exit(1);
  }

  // Test 2: Languages Handler
  console.log('\n2. Testing GET /api/languages...');
  const langRes = createMockRes();
  await languagesHandler(createMockReq('GET'), langRes);
  const langData = JSON.parse(langRes.body);
  const langCount = Object.keys(langData).length;
  if (langRes.statusCode === 200 && langCount >= 10) {
    console.log(`   ✅ Languages endpoint OK: Status 200, ${langCount} languages registered`);
  } else {
    console.error('   ❌ Languages endpoint failed:', langRes.body);
    process.exit(1);
  }

  // Test 3: Execute Handler with C Star Triangle
  console.log('\n3. Testing POST /api/execute (C Star Triangle)...');
  const cCode = `#include <stdio.h>
int main() {
    int i, j;
    for (i = 1; i <= 5; i++) {
        for (j = 1; j <= i; j++) {
            printf("*");
        }
        printf("\\n");
    }
    return 0;
}`;

  const execRes = createMockRes();
  const execReq = createMockReq('POST', {
    language: 'c',
    source_code: cCode,
    stdin: ''
  });

  await executeHandler(execReq, execRes);
  const execData = JSON.parse(execRes.body);

  if (execRes.statusCode === 200 && execData.success === true) {
    console.log('   ✅ Real Execution Success!');
    console.log('   Compiler:', execData.compiler);
    console.log('   Exit code:', execData.exit_code);
    console.log('   Execution time:', execData.time, 's');
    console.log('   Actual stdout:');
    console.log('----------------------------------------------------');
    console.log(execData.stdout.trimEnd());
    console.log('----------------------------------------------------');
    if (execData.stdout.includes('*\n**\n***\n****\n*****')) {
      console.log('   ✅ Star triangle pattern verified with correct newlines!');
    }
  } else {
    console.error('   ❌ Execution failed:', execData);
    process.exit(1);
  }

  // Test 4: Execute Handler with Python
  console.log('\n4. Testing POST /api/execute (Python)...');
  const pyRes = createMockRes();
  const pyReq = createMockReq('POST', {
    language: 'python',
    source_code: 'print("Vercel Serverless Python Execution Successful!")',
    stdin: ''
  });

  await executeHandler(pyReq, pyRes);
  const pyData = JSON.parse(pyRes.body);

  if (pyRes.statusCode === 200 && pyData.success === true && pyData.stdout.includes('Successful')) {
    console.log('   ✅ Python execution verified:', pyData.stdout.trim());
  } else {
    console.error('   ❌ Python execution failed:', pyData);
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('🎉 ALL VERCEL SERVERLESS HANDLER TESTS PASSED!');
  console.log('========================================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
