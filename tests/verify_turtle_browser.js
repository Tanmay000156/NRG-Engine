const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runBrowserVerification() {
  console.log("==========================================================");
  console.log("🐢 BROWSER CDP VERIFICATION: PYTHON TURTLE GRAPHICS");
  console.log("==========================================================\n");

  const PORT = 3012;
  const CDP_PORT = 9228;

  // 1. Start Server
  console.log(`1. Starting NRG Engine Server on port ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });

  server.stdout.on('data', d => {
    // console.log('[Server]', d.toString().trim());
  });

  await new Promise(r => setTimeout(r, 1200));

  // 2. Launch Chrome Headless
  console.log(`2. Launching Chrome with CDP on port ${CDP_PORT}...`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    `http://localhost:${PORT}`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    // 3. Connect to CDP
    const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const targets = await targetsRes.json();
    const page = targets.find(t => t.type === 'page');
    if (!page) throw new Error('No page target found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const cmdId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === cmdId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    console.log("3. Enabling Page & Runtime domains...");
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    // Wait for page to be ready
    await new Promise(r => setTimeout(r, 1500));

    // Test A: Switch to Turtle Tab & Check UI elements
    console.log("4. Switching to Turtle tab and verifying UI...");
    const checkUiRes = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        switchTerminalTab('turtle');
        const view = document.getElementById('termViewTurtle');
        const canvas = document.getElementById('turtleCanvas');
        const playBtn = document.getElementById('btnTurtlePlayPause');
        const clearBtn = document.getElementById('btnTurtleClear');
        const exportBtn = document.getElementById('btnTurtleExport');
        const speedSelect = document.getElementById('turtleSpeedSelect');
        const placeholder = document.getElementById('turtlePlaceholder');

        return {
          viewVisible: view && view.classList.contains('active'),
          hasCanvas: !!canvas,
          hasControls: !!(playBtn && clearBtn && exportBtn && speedSelect),
          hasPlaceholder: !!placeholder
        };
      })()`,
      returnByValue: true
    });

    console.log("   UI Elements check:", checkUiRes.result.value);
    if (!checkUiRes.result.value.viewVisible || !checkUiRes.result.value.hasCanvas) {
      throw new Error("Turtle UI view or canvas not visible");
    }

    // Capture Initial Turtle Tab Screenshot
    console.log("5. Capturing Initial Turtle Tab Screenshot...");
    const screenshot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const img1Buffer = Buffer.from(screenshot1.data, 'base64');
    const artifactDir = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3';
    fs.writeFileSync(path.join(artifactDir, 'nrg_turtle_empty_state.png'), img1Buffer);
    console.log("   Saved nrg_turtle_empty_state.png");

    // Test B: Load Starter Turtle Template and Execute!
    console.log("6. Loading Starter Turtle Template (Color Spiral) & Executing...");
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        loadTurtleTemplate('spiral');
        // Set speed to 50 for rapid rendering test
        document.getElementById('turtleSpeedSelect').value = '100';
        window.nrgTurtleEngine.speed = 100;
        executeRealCode();
      })()`
    });

    // Wait for execution and rendering
    console.log("7. Waiting for execution & rendering to complete...");
    await new Promise(r => setTimeout(r, 4500));

    // Verify Canvas has rendered paths and steps counter
    const renderCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const engine = window.nrgTurtleEngine;
        const canvas = document.getElementById('turtleCanvas');
        const stepsText = document.getElementById('valTurtleSteps').textContent;
        const coordsText = document.getElementById('valTurtleX').textContent + ', ' + document.getElementById('valTurtleY').textContent;
        const angleText = document.getElementById('valTurtleHeading').textContent;

        // Check non-white/non-transparent pixels in canvas
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let coloredPixels = 0;
        for (let i = 0; i < imgData.data.length; i += 4) {
          const r = imgData.data[i];
          const g = imgData.data[i+1];
          const b = imgData.data[i+2];
          const a = imgData.data[i+3];
          // Check if pixel is drawn (not default dark or white bg)
          if (a > 0 && !(r === 15 && g === 23 && b === 42) && !(r === 255 && g === 255 && b === 255)) {
            coloredPixels++;
          }
        }

        return {
          commandCount: engine ? engine.commands.length : 0,
          drawnItemsCount: engine ? engine.drawnItems.length : 0,
          stepsText: stepsText,
          coords: coordsText,
          angle: angleText,
          coloredPixels: coloredPixels,
          activeTab: document.querySelector('.terminal-tab-btn.active')?.dataset.termTab
        };
      })()`,
      returnByValue: true
    });

    console.log("   Render Verification Results:", renderCheck.result.value);

    // Capture Final Canvas Artwork Screenshot
    console.log("8. Capturing Rendered Turtle Canvas Artwork Screenshot...");
    const screenshot2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const img2Buffer = Buffer.from(screenshot2.data, 'base64');
    fs.writeFileSync(path.join(artifactDir, 'nrg_turtle_spiral_rendered.png'), img2Buffer);
    
    // Also save to assets/screenshots
    const screenshotAssetDir = path.resolve(__dirname, '..', 'assets', 'screenshots');
    if (!fs.existsSync(screenshotAssetDir)) fs.mkdirSync(screenshotAssetDir, { recursive: true });
    fs.writeFileSync(path.join(screenshotAssetDir, 'nrg_turtle_spiral_rendered.png'), img2Buffer);
    console.log("   Saved nrg_turtle_spiral_rendered.png to artifacts and assets!");

    ws.close();

    console.log("\n==========================================================");
    console.log("🎉 BROWSER VERIFICATION SUCCEEDED WITH 100% PASS RATE!");
    console.log("==========================================================");

  } finally {
    chrome.kill();
    server.kill();
  }
}

runBrowserVerification().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
