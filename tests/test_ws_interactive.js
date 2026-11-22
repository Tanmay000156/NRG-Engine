const http = require('http');
const WebSocket = require('ws');
const server = http.createServer();
const mgr = require('../api/_interactive_manager');

mgr.attachWebSocketServer(server);

server.listen(0, () => {
  const port = server.address().port;
  console.log('Testing interactive bidirectional WebSocket on port', port);
  const ws = new WebSocket(`ws://localhost:${port}/api/interactive/ws`);

  const cCode = `
#include <stdio.h>
int main() {
    int a, b;
    printf("Enter first: ");
    scanf("%d", &a);
    printf("Enter second: ");
    scanf("%d", &b);
    printf("Sum = %d\\n", a + b);
    return 0;
}
`;

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'start',
      language: 'c',
      source_code: cCode
    }));
  });

  let fullOutput = '';
  let sent10 = false;
  let sent20 = false;

  ws.on('message', (d) => {
    const msg = JSON.parse(d.toString());
    if (msg.type === 'stdout') {
      fullOutput += msg.data;
      process.stdout.write(msg.data);

      if (fullOutput.includes('Enter first:') && !sent10) {
        sent10 = true;
        console.log('\n[TEST SENDING]: 10');
        ws.send(JSON.stringify({ type: 'stdin', data: '10' }));
      } else if (fullOutput.includes('Enter second:') && !sent20) {
        sent20 = true;
        console.log('\n[TEST SENDING]: 20');
        ws.send(JSON.stringify({ type: 'stdin', data: '20' }));
      }
    }

    if (msg.type === 'exit') {
      console.log('\nProcess exited with code:', msg.code);
      if (fullOutput.includes('Sum = 30') && msg.code === 0) {
        console.log('✅ BIDIRECTIONAL WEBSOCKET INTERACTION PASSED!');
        ws.close();
        server.close();
        process.exit(0);
      } else {
        console.error('❌ FAILED to find Sum = 30 in output:', fullOutput);
        process.exit(1);
      }
    }
  });
});
