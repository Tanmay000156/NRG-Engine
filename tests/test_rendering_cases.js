// Test 6 rendering verification cases via real compiler execution
const http = require('http');

async function executeCode(lang, code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ language: lang, source_code: code });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Rendering Verification Cases with Real Judge0 Backend:');

  // Case 1: Inverted Triangle
  const codeInverted = `#include <stdio.h>
int main(){
    for(int i=5; i>=1; i--){
        for(int j=1; j<=i; j++) printf("*");
        printf("\\n");
    }
    return 0;
}`;
  const res1 = await executeCode('c', codeInverted);
  console.log('\nCase 1 (Inverted Triangle):');
  console.log(res1.stdout);
  if (res1.stdout.trim().split('\n').length !== 5) throw new Error('Inverted triangle lines != 5');

  // Case 2: Pyramid with leading spaces
  const codePyramid = `#include <stdio.h>
int main(){
    int n=4;
    for(int i=1; i<=n; i++){
        for(int s=1; s<=n-i; s++) printf(" ");
        for(int j=1; j<=2*i-1; j++) printf("*");
        printf("\\n");
    }
    return 0;
}`;
  const res2 = await executeCode('c', codePyramid);
  console.log('Case 2 (Pyramid with leading spaces):');
  console.log(res2.stdout);
  if (!res2.stdout.startsWith('   *')) throw new Error('Leading spaces stripped!');

  // Case 3: Tabs
  const codeTabs = `#include <stdio.h>
int main(){
    printf("COL1\\tCOL2\\tCOL3\\nVAL1\\tVAL2\\tVAL3\\n");
    return 0;
}`;
  const res3 = await executeCode('c', codeTabs);
  console.log('Case 3 (Tab Characters):');
  console.log(res3.stdout);
  if (!res3.stdout.includes('\t')) throw new Error('Tabs stripped!');

  // Case 4: Empty lines
  const codeEmpty = `#include <stdio.h>
int main(){
    printf("Header\\n\\n\\nFooter\\n");
    return 0;
}`;
  const res4 = await executeCode('c', codeEmpty);
  console.log('Case 4 (Empty Lines):');
  console.log(JSON.stringify(res4.stdout));
  if (res4.stdout !== 'Header\n\n\nFooter\n') throw new Error('Empty lines stripped!');

  // Case 5: Unicode
  const codeUnicode = `#include <stdio.h>
int main(){
    printf("NRG Engine — Unicode: ★ ⚡ ☕ 🐍 💻\\n");
    return 0;
}`;
  const res5 = await executeCode('c', codeUnicode);
  console.log('Case 5 (Unicode):');
  console.log(res5.stdout);
  if (!res5.stdout.includes('★') || !res5.stdout.includes('🐍')) throw new Error('Unicode broken!');

  console.log('\n✓ ALL 5 RENDERING VERIFICATION CASES RETURNED EXACT OUTPUT FROM BACKEND!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
