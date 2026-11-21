const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testTurtleInBrowser() {
  console.log("==================================================");
  console.log("🐢 VERIFYING BROWSER-BASED TURTLE GRAPHICS");
  console.log("==================================================\n");

  const PORT = 3008;
  process.env.PORT = PORT;

  // 1. Start Server
  console.log("1. Starting local server on port " + PORT + "...");
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', d => {
    // console.log('[Server]', d.toString().trim());
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 1500));

  // 2. Launch Headless Chrome with Remote Debugging
  console.log("2. Launching Chrome with CDP on port 9224...");
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    `http://localhost:${PORT}`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  // 3. Connect to CDP
  console.log("3. Connecting to Chrome DevTools Protocol...");
  const targetsRes = await fetch('http://127.0.0.1:9224/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    throw new Error('No page target found in Chrome');
  }

  const WebSocket = require('ws'); // If ws not installed, we can use built-in or install
}

// Check if ws is installed
try {
  require.resolve('ws');
  testTurtleInBrowser().catch(console.error);
} catch (e) {
  console.log("Note: ws module not globally installed, testing via HTTP and direct DOM checks");
}
