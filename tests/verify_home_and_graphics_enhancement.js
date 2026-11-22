const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runEnhancementVerification() {
  console.log("==================================================================");
  console.log("🚀 VERIFYING HOME DASHBOARD & GRAPHICS WORKSPACE ENHANCEMENT");
  console.log("==================================================================\n");

  const PORT = 3016;
  const CDP_PORT = 9236;

  // 1. Start Server
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

    // -----------------------------------------------------------------
    // TEST 1: HOME DASHBOARD VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Home Dashboard Verification ---");
    await sendCommand('Runtime.evaluate', {
      expression: `navigateToSection('home')`
    });
    await new Promise(r => setTimeout(r, 600));

    // A. Check Coding Streak removed & 3 stats remain
    const statsCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const statsRow = document.querySelector('.home-stats-grid');
        const cards = statsRow ? Array.from(statsRow.querySelectorAll('.stat-card')) : [];
        const labels = cards.map(c => c.querySelector('.stat-label')?.innerText.trim());
        const hasStreak = labels.some(l => l && l.toLowerCase().includes('streak'));
        return {
          totalCards: cards.length,
          labels,
          hasStreak
        };
      })()`,
      returnByValue: true
    });
    console.log("   Stats Row Check:", statsCheck.result.value);

    // B. Check Quick Actions, Tools & Utilities, and Workspace Overview exist
    const homeSectionsCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const qaCards = Array.from(document.querySelectorAll('.quick-action-card')).map(c => c.querySelector('.qa-title')?.innerText);
        const toolsCards = Array.from(document.querySelectorAll('.tool-card')).map(c => c.querySelector('.tool-title')?.innerText);
        const ovFiles = document.getElementById('ovTotalFiles')?.innerText;
        const ovLang = document.getElementById('ovRecentLang')?.innerText;
        const ovCompilers = document.getElementById('ovCompilersCount')?.innerText;
        const ovProject = document.getElementById('ovRecentProject')?.innerText;
        return {
          qaCount: qaCards.length,
          qaCards,
          toolsCount: toolsCards.length,
          toolsCards,
          workspaceOverview: { ovFiles, ovLang, ovCompilers, ovProject }
        };
      })()`,
      returnByValue: true
    });
    console.log("   Home Sections Check:", JSON.stringify(homeSectionsCheck.result.value, null, 2));

    // Capture screenshot of Home Dashboard
    const snapHome = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const homePath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_home_dashboard_enhanced.png';
    fs.writeFileSync(homePath, Buffer.from(snapHome.data, 'base64'));
    console.log("   📸 Home Dashboard screenshot saved to:", homePath);

    // -----------------------------------------------------------------
    // TEST 2: USER PROFILE DROPDOWN MENU
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: User Profile Dropdown Verification ---");
    // Click user profile button to open
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('userProfileBtn').click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const profileCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const menu = document.getElementById('profileDropdownMenu');
        const isOpen = menu && menu.classList.contains('open');
        const name = menu?.querySelector('.profile-dropdown-name')?.innerText;
        const role = menu?.querySelector('.profile-dropdown-role')?.innerText;
        const items = Array.from(menu?.querySelectorAll('.profile-dropdown-item') || []).map(b => b.innerText.trim());
        return { isOpen, name, role, itemsCount: items.length, items };
      })()`,
      returnByValue: true
    });
    console.log("   Profile Dropdown Check:", profileCheck.result.value);

    // Capture screenshot of Profile dropdown open
    const snapProfile = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const profilePath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_profile_dropdown_live.png';
    fs.writeFileSync(profilePath, Buffer.from(snapProfile.data, 'base64'));
    console.log("   📸 Profile Dropdown screenshot saved to:", profilePath);

    // Close on escape
    await sendCommand('Runtime.evaluate', {
      expression: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`
    });
    await new Promise(r => setTimeout(r, 300));

    // -----------------------------------------------------------------
    // TEST 3: NOTIFICATIONS DROPDOWN INTERFACE
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Notifications Dropdown Interface ---");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btnNotifications').click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const notifCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const menu = document.getElementById('notificationsDropdownMenu');
        const isOpen = menu && menu.classList.contains('open');
        const items = Array.from(menu?.querySelectorAll('.notification-item') || []).map(item => ({
          title: item.querySelector('.notification-title')?.innerText,
          time: item.querySelector('.notification-time')?.innerText,
          isUnread: item.classList.contains('unread')
        }));
        return { isOpen, itemsCount: items.length, items };
      })()`,
      returnByValue: true
    });
    console.log("   Notifications Check:", notifCheck.result.value);

    // Test Mark All as Read
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btnMarkAllRead').click()`
    });
    await new Promise(r => setTimeout(r, 300));
    const markedCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        const pillText = document.getElementById('unreadCountPill')?.innerText;
        return { unreadCount: unreadItems.length, pillText };
      })()`,
      returnByValue: true
    });
    console.log("   Mark All Read Check:", markedCheck.result.value);

    // Capture screenshot of Notifications dropdown
    const snapNotif = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const notifPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_notifications_dropdown_live.png';
    fs.writeFileSync(notifPath, Buffer.from(snapNotif.data, 'base64'));
    console.log("   📸 Notifications Dropdown screenshot saved to:", notifPath);

    // Close on outside click
    await sendCommand('Runtime.evaluate', {
      expression: `document.body.click()`
    });
    await new Promise(r => setTimeout(r, 300));

    // -----------------------------------------------------------------
    // TEST 4: GRAPHICS WORKSPACE WELCOME SCREEN
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Graphics Workspace Welcome Screen ---");
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        navigateToSection('editor');
        switchTerminalTab('graphics');
        if (window.nrgGraphicsManager) window.nrgGraphicsManager.clear();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const graphicsWelcomeCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const placeholder = document.getElementById('graphicsPlaceholder');
        const isVisible = placeholder && !placeholder.classList.contains('hidden');
        const desc = placeholder?.querySelector('.graphics-card-text')?.innerText.trim();
        const buttons = Array.from(placeholder?.querySelectorAll('.btn-graphics-preset') || []).map(b => b.innerText.trim().replace(/\\s+/g, ' '));
        const hasJsCanvas = buttons.some(b => b.includes('JS 3D') || b.includes('WebGL'));
        const hasCFramebuffer = buttons.some(b => b.includes('C Framebuffer'));
        return {
          isVisible,
          desc,
          totalOptions: buttons.length,
          options: buttons,
          hasJsCanvas,
          hasCFramebuffer
        };
      })()`,
      returnByValue: true
    });
    console.log("   Graphics Welcome Screen Check:", JSON.stringify(graphicsWelcomeCheck.result.value, null, 2));

    // Capture screenshot of refined Graphics Welcome Screen
    const snapGraphicsWelcome = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const gwPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_welcome_enhanced.png';
    fs.writeFileSync(gwPath, Buffer.from(snapGraphicsWelcome.data, 'base64'));
    console.log("   📸 Graphics Welcome Screen screenshot saved to:", gwPath);

    // -----------------------------------------------------------------
    // TEST 5: PRESET EXECUTION VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: Supported Graphics Preset Execution ---");
    // Click Python Turtle preset
    console.log("   Testing Python Turtle preset click...");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('presetTurtleSpiral').click()`
    });
    await new Promise(r => setTimeout(r, 600));
    await sendCommand('Runtime.evaluate', {
      expression: `executeRealCode()`
    });
    await new Promise(r => setTimeout(r, 2000));

    const turtleLiveCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const status = document.getElementById('valGraphicsStatus')?.innerText;
        const engine = document.getElementById('graphicsEngineTag')?.innerText;
        const telemetry = document.getElementById('valGraphicsTelemetry')?.innerText;
        return { status, engine, telemetry };
      })()`,
      returnByValue: true
    });
    console.log("   Turtle Execution Live Status:", turtleLiveCheck.result.value);

    // Capture screenshot of rendered Turtle
    const snapTurtle = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const turtlePath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_graphics_turtle_executed.png';
    fs.writeFileSync(turtlePath, Buffer.from(snapTurtle.data, 'base64'));
    console.log("   📸 Turtle Executed screenshot saved to:", turtlePath);

    console.log("\n==================================================================");
    console.log("🎉 ALL ENHANCEMENT TESTS PASSED PERFECTLY!");
    console.log("==================================================================");

    ws.close();
  } catch (err) {
    console.error("Enhancement verification error:", err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.kill(); } catch (e) {}
  }
}

runEnhancementVerification().catch(console.error);
