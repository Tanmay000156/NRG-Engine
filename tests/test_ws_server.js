const http = require('http');
const WebSocket = require('ws');
const server = http.createServer();
const mgr = require('../api/_interactive_manager');

mgr.attachWebSocketServer(server);

server.listen(0, () => {
  const port = server.address().port;
  console.log('Test server listening on port', port);
  const ws = new WebSocket(`ws://localhost:${port}/api/interactive/ws`);

  ws.on('open', () => {
    console.log('WebSocket connected successfully!');
    ws.send(JSON.stringify({
      type: 'start',
      language: 'c',
      source_code: '#include <stdio.h>\nint main() { printf("WS HELLO\\n"); return 0; }'
    }));
  });

  let receivedOutput = false;

  ws.on('message', (d) => {
    const msg = JSON.parse(d.toString());
    console.log('WS Message:', msg.type, msg.data || msg.sessionId || '');
    if (msg.type === 'stdout' && msg.data.includes('WS HELLO')) {
      receivedOutput = true;
    }
    if (msg.type === 'exit') {
      if (receivedOutput && msg.code === 0) {
        console.log('✅ WEBSOCKET TEST PASSED!');
        ws.close();
        server.close();
        process.exit(0);
      } else {
        console.error('❌ WEBSOCKET TEST FAILED!');
        process.exit(1);
      }
    }
  });
});
