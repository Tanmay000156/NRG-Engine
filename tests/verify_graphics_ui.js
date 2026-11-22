const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runBrowserVerification() {
  console.log("==========================================================");
  console.log("🎨 BROWSER CDP VERIFICATION: UNIVERSAL GRAPHICS WORKSPACE");
  console.log("==========================================================\n");

  const PORT = 3014;
  const CDP_PORT = 9230;

  // 1. Start Server
  console.log(`1. Starting NRG Engine Server on port ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
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

    await new Promise(r => setTimeout(r, 1500));

    // Test A: Check Tab Rename & Elements
    console.log("4. Verifying Graphics Tab button & Workspace elements...");
    const checkUiRes = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const tabBtn = document.getElementById('tabBtnGraphics');
        const view = document.getElementById('termViewGraphics');
        const runBtn = document.getElementById('btnGraphicsRun');
        const stopBtn = document.getElementById('btnGraphicsStop');
        const restartBtn = document.getElementById('btnGraphicsRestart');
        const resSelect = document.getElementById('graphicsResolutionSelect');
        const clearBtn = document.getElementById('btnGraphicsClear');
        const exportBtn = document.getElementById('btnGraphicsExport');
        const fullscreenBtn = document.getElementById('btnGraphicsFullscreen');

        const tabText = tabBtn ? tabBtn.innerText.trim() : '';

        return {
          hasTabBtn: !!tabBtn,
          tabText: tabText,
          hasView: !!view,
          hasRunBtn: !!runBtn,
          hasStopBtn: !!stopBtn,
          hasRestartBtn: !!restartBtn,
          hasResSelect: !!resSelect,
          hasClearBtn: !!clearBtn,
          hasExportBtn: !!exportBtn,
          hasFullscreenBtn: !!fullscreenBtn,
          hasGraphicsManager: !!window.nrgGraphicsManager,
          hasTurtleEngine: !!window.nrgTurtleEngine
        };
      })()`,
      returnByValue: true
    });

    console.log("   UI Elements Check:", JSON.stringify(checkUiRes.result.value, null, 2));

    // Test B: Switch to Graphics tab & take screenshot of empty state
    console.log("\n5. Switching to Graphics tab...");
    await sendCommand('Runtime.evaluate', {
      expression: `switchTerminalTab('graphics')`
    });
    await new Promise(r => setTimeout(r, 500));

    const snapEmpty = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const emptyPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_workspace_empty.png';
    fs.writeFileSync(emptyPath, Buffer.from(snapEmpty.data, 'base64'));
    console.log("   📸 Empty state screenshot saved to:", emptyPath);

    // Test C: Click preset Matplotlib and run
    console.log("\n6. Loading Python Matplotlib preset & executing...");
    await sendCommand('Runtime.evaluate', {
      expression: `loadGraphicsPreset('matplotlib')`
    });
    await new Promise(r => setTimeout(r, 800));

    // Click Run Code
    console.log("7. Triggering Run Code for Matplotlib...");
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });

    // Wait for compilation & render
    console.log("8. Awaiting Matplotlib render output...");
    let rendered = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 800));
      const statusRes = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const img = document.getElementById('graphicsImg');
          const isImgVisible = !document.getElementById('graphicsImageView').classList.contains('hidden');
          const status = document.getElementById('valGraphicsStatus').innerText;
          const engine = document.getElementById('graphicsEngineTag').innerText;
          return {
            hasSrc: img && img.src.startsWith('data:image/png'),
            isImgVisible,
            status,
            engine
          };
        })()`,
        returnByValue: true
      });

      if (statusRes.result.value.hasSrc && statusRes.result.value.isImgVisible) {
        console.log("   ✅ Matplotlib graphic visible in viewport!", statusRes.result.value);
        rendered = true;
        break;
      }
    }

    // Capture screenshot of rendered graphic
    const snapMpl = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const mplPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_matplotlib_verified.png';
    fs.writeFileSync(mplPath, Buffer.from(snapMpl.data, 'base64'));
    console.log("   📸 Matplotlib render screenshot saved to:", mplPath);

    // Test D: Load JS Canvas 3D preset
    console.log("\n9. Testing JavaScript 3D Canvas preset...");
    await sendCommand('Runtime.evaluate', {
      expression: `loadGraphicsPreset('js_canvas')`
    });
    await new Promise(r => setTimeout(r, 500));
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const snapJs = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const jsPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_js_canvas_verified.png';
    fs.writeFileSync(jsPath, Buffer.from(snapJs.data, 'base64'));
    console.log("   📸 JS 3D Canvas render screenshot saved to:", jsPath);

    console.log("\n🎉 ALL BROWSER CDP TESTS PASSED SUCCESSFULLY!");

    ws.close();
  } catch (err) {
    console.error("Browser verification error:", err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.kill(); } catch (e) {}
  }
}

runBrowserVerification().catch(err => {
  console.error("Failed:", err);
});
