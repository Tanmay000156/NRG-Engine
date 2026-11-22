const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pyFile = path.join(__dirname, 'test_interactive.py');

const pyCode = `
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print("Hello", name)
print("Age:", age)
`;

fs.writeFileSync(pyFile, pyCode, 'utf8');

console.log('Spawning python -u with piped stdio...');
const child = spawn('python', ['-u', pyFile], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let outputHistory = '';
let step = 0;

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  outputHistory += text;
  process.stdout.write(`[PY STDOUT RECV]: ${JSON.stringify(text)}\n`);

  if (step === 0 && text.includes('Enter your name:')) {
    step = 1;
    console.log('--> Received prompt 1! Sending "Tanmay\\n"...');
    setTimeout(() => {
      child.stdin.write('Tanmay\n');
    }, 150);
  } else if (step === 1 && text.includes('Enter your age:')) {
    step = 2;
    console.log('--> Received prompt 2! Sending "18\\n"...');
    setTimeout(() => {
      child.stdin.write('18\n');
    }, 150);
  }
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(`[PY STDERR]: ${chunk.toString()}\n`);
});

child.on('close', (code) => {
  console.log(`Python process closed with exit code ${code}`);
  console.log('Full Output:\n' + outputHistory);
  try { fs.unlinkSync(pyFile); } catch (e) {}

  if (outputHistory.includes('Hello Tanmay') && outputHistory.includes('Age: 18') && code === 0) {
    console.log('✅ TEST PASSED: Python interactive input() verified!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Python interactive input failed');
    process.exit(1);
  }
});
