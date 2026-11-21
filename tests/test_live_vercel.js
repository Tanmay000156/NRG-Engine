const { execSync } = require('child_process');
const fs = require('fs');

async function testLiveDeployment() {
  console.log('Testing live Vercel deployment: https://nrg-engine.vercel.app\n');
  
  // 1. Health Test
  console.log('--- 1. Testing GET /api/health ---');
  const healthRes = execSync('vercel curl https://nrg-engine.vercel.app/api/health', { encoding: 'utf-8' });
  const healthJson = healthRes.split('\n').filter(l => l.trim().startsWith('{')).pop();
  console.log('Health Response:', healthJson);

  // 2. Languages Test
  console.log('\n--- 2. Testing GET /api/languages ---');
  const langRes = execSync('vercel curl https://nrg-engine.vercel.app/api/languages', { encoding: 'utf-8' });
  const langJson = langRes.split('\n').filter(l => l.trim().startsWith('{')).pop();
  const languages = JSON.parse(langJson);
  console.log('Registered languages count:', Object.keys(languages).length);
  console.log('Languages:', Object.keys(languages).join(', '));

  // 3. Execution Test: C Star Triangle
  console.log('\n--- 3. Testing POST /api/execute (C Program) ---');
  const cCode = '#include <stdio.h>\\nint main() { for (int i = 1; i <= 5; i++) { for (int j = 1; j <= i; j++) printf(\\"*\\"); printf(\\"\\\\n\\"); } return 0; }';
  fs.writeFileSync('payload.tmp.json', JSON.stringify({
    language: 'c',
    source_code: '#include <stdio.h>\nint main() { for (int i = 1; i <= 5; i++) { for (int j = 1; j <= i; j++) printf("*"); printf("\\n"); } return 0; }',
    stdin: ''
  }));

  const execRes = execSync('vercel curl https://nrg-engine.vercel.app/api/execute -X POST -H "Content-Type: application/json" -d @payload.tmp.json', { encoding: 'utf-8' });
  try { fs.unlinkSync('payload.tmp.json'); } catch (e) {}

  const execJson = execRes.split('\n').filter(l => l.trim().startsWith('{')).pop();
  const execData = JSON.parse(execJson);
  console.log('Success:', execData.success);
  console.log('Compiler:', execData.compiler);
  console.log('Exit Code:', execData.exit_code);
  console.log('Time:', execData.time, 's');
  console.log('Stdout:');
  console.log(execData.stdout.trimEnd());
}

testLiveDeployment().catch(console.error);
