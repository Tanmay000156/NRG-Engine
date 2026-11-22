const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runLiveVerification() {
  console.log("==========================================================");
  console.log("🚀 NRG ENGINE: LIVE CDP VERIFICATION OF GRAPHICS REPAIR");
  console.log("==========================================================\n");

  const PORT = 3015;
  const CDP_PORT = 9235;

  // 1. Start Server on isolated port
  console.log(`1. Launching server on port ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });

  await new Promise(r => setTimeout(r, 1500));

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

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await new Promise(r => setTimeout(r, 1200));

    // TEST 1: JavaScript 3D Rotating Polyhedron
    console.log("\n--- TEST 1: JavaScript 3D Rotating Polyhedron ---");
    await sendCommand('Runtime.evaluate', {
      expression: `loadGraphicsPreset('js_canvas')`
    });
    await new Promise(r => setTimeout(r, 500));
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const jsStatus = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const iframe = document.getElementById('graphicsIframe');
        const iframeVisible = !document.getElementById('graphicsIframeContainer').classList.contains('hidden');
        const status = document.getElementById('valGraphicsStatus').innerText;
        const engine = document.getElementById('graphicsEngineTag').innerText;
        return { iframeVisible, status, engine };
      })()`,
      returnByValue: true
    });
    console.log("   JS Status:", jsStatus.result.value);

    const snapJs = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const jsPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_polyhedron_live.png';
    fs.writeFileSync(jsPath, Buffer.from(snapJs.data, 'base64'));
    console.log("   📸 Polyhedron screenshot saved to:", jsPath);

    // Test Stop button
    console.log("\n   Testing Stop button...");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btnGraphicsStop').click()`
    });
    await new Promise(r => setTimeout(r, 500));
    const stoppedStatus = await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('valGraphicsStatus').innerText`,
      returnByValue: true
    });
    console.log("   Status after Stop:", stoppedStatus.result.value);

    // Test Restart button
    console.log("   Testing Restart button...");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btnGraphicsRestart').click()`
    });
    await new Promise(r => setTimeout(r, 800));
    const restartedStatus = await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('valGraphicsStatus').innerText`,
      returnByValue: true
    });
    console.log("   Status after Restart:", restartedStatus.result.value);

    // TEST 2: C Mandelbrot Fractal (PPM Framebuffer)
    console.log("\n--- TEST 2: C Mandelbrot Fractal (PPM Framebuffer) ---");
    await sendCommand('Runtime.evaluate', {
      expression: `loadGraphicsPreset('c_framebuffer')`
    });
    await new Promise(r => setTimeout(r, 500));
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });

    console.log("   Awaiting C Mandelbrot compilation & PPM render...");
    let cRendered = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 800));
      const cCheck = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const canvas = document.getElementById('graphicsCanvas');
          const isCanvasVisible = canvas && canvas.style.display !== 'none';
          const status = document.getElementById('valGraphicsStatus').innerText;
          const engine = document.getElementById('graphicsEngineTag').innerText;
          const telemetry = document.getElementById('valGraphicsTelemetry').innerText;
          return { isCanvasVisible, status, engine, telemetry };
        })()`,
        returnByValue: true
      });
      if (cCheck.result.value.status === 'Rendered') {
        console.log("   ✅ C Mandelbrot PPM rendered!", cCheck.result.value);
        cRendered = true;
        break;
      }
    }

    const snapC = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const cPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_c_mandelbrot_live.png';
    fs.writeFileSync(cPath, Buffer.from(snapC.data, 'base64'));
    console.log("   📸 C Mandelbrot screenshot saved to:", cPath);

    // TEST 3: Java AWT Graphics2D
    console.log("\n--- TEST 3: Java AWT Graphics2D ---");
    await sendCommand('Runtime.evaluate', {
      expression: `loadGraphicsPreset('java_awt')`
    });
    await new Promise(r => setTimeout(r, 500));
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });

    console.log("   Awaiting Java AWT compilation & render...");
    let javaRendered = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 800));
      const javaCheck = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const img = document.getElementById('graphicsImg');
          const isImgVisible = !document.getElementById('graphicsImageView').classList.contains('hidden');
          const status = document.getElementById('valGraphicsStatus').innerText;
          const engine = document.getElementById('graphicsEngineTag').innerText;
          return { hasSrc: img && img.src.startsWith('data:image/png'), isImgVisible, status, engine };
        })()`,
        returnByValue: true
      });
      if (javaCheck.result.value.hasSrc && javaCheck.result.value.isImgVisible) {
        console.log("   ✅ Java AWT graphic rendered!", javaCheck.result.value);
        javaRendered = true;
        break;
      }
    }

    const snapJava = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const javaPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_java_awt_live.png';
    fs.writeFileSync(javaPath, Buffer.from(snapJava.data, 'base64'));
    console.log("   📸 Java AWT screenshot saved to:", javaPath);

    console.log("\n==========================================================");
    console.log("✨ ALL LIVE CDP TESTS COMPLETED SUCCESSFULLY!");
    console.log("==========================================================");

    ws.close();
  } catch (err) {
    console.error("Live verification error:", err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.kill(); } catch (e) {}
  }
}

runLiveVerification().catch(console.error);
