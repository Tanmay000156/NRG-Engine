const code = `#include <stdio.h>
int main(){
    int i,j;
    for(i=1;i<=5;i++){
        for(j=1;j<=i;j++){
            printf("*");
        }
        printf("\\n");
    }
    return 0;
}`;

async function test() {
  const res = await fetch('http://localhost:3000/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'c', source_code: code })
  });
  const data = await res.json();
  console.log('Backend response status:', data.status);
  console.log('Exact stdout returned:\n---START---\n' + data.stdout + '---END---');
}

test();
