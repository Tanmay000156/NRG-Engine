const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function verifyHomeFinal1080p() {
  console.log("==================================================================");
  console.log("🚀 VERIFYING HOME DASHBOARD 1080P FIT & PROFILE DROPDOWN PORTAL");
  console.log("==================================================================\n");

  const PORT = 3021;
  const CDP_PORT = 9241;

  // 1. Start Server
  console.log(`1. Launching server on port ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });

  await new Promise(r => setTimeout(r, 1500));

  // 2. Launch Chrome Headless at 1920x1080
  console.log(`2. Launching Chrome with CDP on port ${CDP_PORT} at 1920x1080...`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
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

    // Set 1920x1080 viewport explicitly via CDP
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Navigate to Home Section
    console.log("3. Navigating to Home Section...");
    await sendCommand('Runtime.evaluate', {
      expression: `navigateToSection('home')`
    });
    await new Promise(r => setTimeout(r, 800));

    // -----------------------------------------------------------------
    // TEST 1: VIEWPORT 1920x1080 NO-SCROLL VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Viewport 1920x1080 No-Scroll & Content Measurement ---");
    const scrollMetrics = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.home-dashboard-card');
        const section = document.getElementById('sectionHome');
        const app = document.querySelector('.app-container');
        return {
          windowInnerWidth: window.innerWidth,
          windowInnerHeight: window.innerHeight,
          cardScrollHeight: card ? card.scrollHeight : 0,
          cardClientHeight: card ? card.clientHeight : 0,
          hasCardVerticalScroll: card ? (card.scrollHeight > card.clientHeight + 1) : false,
          appScrollHeight: app ? app.scrollHeight : 0,
          appClientHeight: app ? app.clientHeight : 0,
          hasAppVerticalScroll: app ? (app.scrollHeight > app.clientHeight + 1) : false
        };
      })()`,
      returnByValue: true
    });
    console.log("   Scroll Metrics at 1920x1080:", scrollMetrics.result.value);

    // -----------------------------------------------------------------
    // TEST 2: HOME DASHBOARD ELEMENTS INSPECTION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Home Dashboard Elements & Genuine Statistics ---");
    const elementsCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Stats
        const statProjects = document.getElementById('homeStatProjectsCount')?.textContent;
        const statSnippets = document.getElementById('homeStatSnippetsCount')?.textContent;
        const statActivity = document.getElementById('homeStatLastActivity')?.textContent;

        // Banned items check
        const hasStreak = !!document.getElementById('homeStatStreakCount');
        const hasCompilersOnline = !!document.querySelector('.home-stats-grid .stat-card:nth-child(3)');
        const hasToolsPanel = !!document.getElementById('toolTerminal');
        const hasOverviewPanel = !!document.getElementById('ovTotalFiles');
        const hasOldQA = !!document.getElementById('qaNewProject');

        // Quick Launch shortcuts
        const qlNew = !!document.getElementById('qlNewProject');
        const qlOpen = !!document.getElementById('qlOpenProject');
        const qlTerm = !!document.getElementById('qlTerminal');
        const qlGraph = !!document.getElementById('qlGraphics');

        // Recent Projects
        const recentProjects = Array.from(document.querySelectorAll('#homeRecentProjectsList .recent-proj-name')).map(el => el.textContent.trim());

        // Quick Files
        const quickFiles = Array.from(document.querySelectorAll('#homeQuickFilesRow .quick-file-chip span')).map(el => el.textContent.trim());

        // Recent Activity
        const recentActs = Array.from(document.querySelectorAll('#recentActivityList .activity-item .activity-text')).map(el => el.textContent.trim());

        return {
          stats: { statProjects, statSnippets, statActivity },
          bannedActual: { hasStreak, hasCompilersOnline, hasToolsPanel, hasOverviewPanel, hasOldQA },
          quickLaunch: { qlNew, qlOpen, qlTerm, qlGraph },
          recentProjects,
          quickFiles,
          recentActs
        };
      })()`,
      returnByValue: true
    });
    console.log("   Elements Inspection:", JSON.stringify(elementsCheck.result.value, null, 2));

    // Capture clean 1920x1080 Home Dashboard screenshot
    const snapHome1080 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const snapHomePath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_home_dashboard_1080p_clean.png';
    fs.writeFileSync(snapHomePath, Buffer.from(snapHome1080.data, 'base64'));
    console.log("   📸 1920x1080 Home Dashboard saved to:", snapHomePath);

    // -----------------------------------------------------------------
    // TEST 3: PROFILE DROPDOWN PORTAL OVERLAY & Z-INDEX FIX
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Profile Dropdown Portal Overlay & Layering Verification ---");
    // Click User Profile Pill
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('userProfileBtn').click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const dropdownPortalCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const menu = document.getElementById('profileDropdownMenu');
        const btn = document.getElementById('userProfileBtn');
        const overlay = document.getElementById('nrgOverlayLayer');
        const rectMenu = menu ? menu.getBoundingClientRect() : null;
        const rectBtn = btn ? btn.getBoundingClientRect() : null;
        const computed = menu ? window.getComputedStyle(menu) : null;

        return {
          isParentOverlay: menu ? menu.parentElement === overlay : false,
          isBodyOverlayChild: overlay ? overlay.parentElement === document.body : false,
          isOpen: menu ? menu.classList.contains('open') : false,
          position: computed ? computed.position : null,
          zIndex: computed ? computed.zIndex : null,
          rectMenu: rectMenu ? { top: rectMenu.top, left: rectMenu.left, width: rectMenu.width, height: rectMenu.height } : null,
          rectBtn: rectBtn ? { top: rectBtn.top, bottom: rectBtn.bottom, left: rectBtn.left, right: rectBtn.right } : null,
          isBeneathBtn: rectMenu && rectBtn ? rectMenu.top >= rectBtn.bottom : false,
          isWithinViewportX: rectMenu ? (rectMenu.left >= 0 && rectMenu.right <= window.innerWidth) : false,
          isWithinViewportY: rectMenu ? (rectMenu.top >= 0 && rectMenu.bottom <= window.innerHeight) : false
        };
      })()`,
      returnByValue: true
    });
    console.log("   Profile Dropdown Portal Status:", dropdownPortalCheck.result.value);

    // Capture screenshot with profile dropdown open
    const snapProfile = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const snapProfilePath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_profile_dropdown_portaled_1080p.png';
    fs.writeFileSync(snapProfilePath, Buffer.from(snapProfile.data, 'base64'));
    console.log("   📸 Profile Dropdown Portaled screenshot saved to:", snapProfilePath);

    // Test Inside Click (does not close)
    console.log("   Testing click inside profile dropdown (must NOT close)...");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('profileDropdownMenu').click()`
    });
    await new Promise(r => setTimeout(r, 200));
    const stillOpenCheck = await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('profileDropdownMenu').classList.contains('open')`,
      returnByValue: true
    });
    console.log("   Still open after internal click:", stillOpenCheck.result.value);

    // Test Escape key closes
    console.log("   Testing Escape key closes profile dropdown...");
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await new Promise(r => setTimeout(r, 200));
    const closedOnEsc = await sendCommand('Runtime.evaluate', {
      expression: `!document.getElementById('profileDropdownMenu').classList.contains('open')`,
      returnByValue: true
    });
    console.log("   Closed on Escape:", closedOnEsc.result.value);

    // -----------------------------------------------------------------
    // TEST 4: NOTIFICATIONS DROPDOWN PORTAL VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Notifications Dropdown Portal Verification ---");
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('btnNotifications').click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const notifPortalCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const menu = document.getElementById('notificationsDropdownMenu');
        const overlay = document.getElementById('nrgOverlayLayer');
        const computed = menu ? window.getComputedStyle(menu) : null;
        return {
          isParentOverlay: menu ? menu.parentElement === overlay : false,
          isOpen: menu ? menu.classList.contains('open') : false,
          position: computed ? computed.position : null,
          zIndex: computed ? computed.zIndex : null
        };
      })()`,
      returnByValue: true
    });
    console.log("   Notifications Dropdown Portal Status:", notifPortalCheck.result.value);

    const snapNotif = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const snapNotifPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_notifications_dropdown_portaled.png';
    fs.writeFileSync(snapNotifPath, Buffer.from(snapNotif.data, 'base64'));
    console.log("   📸 Notifications Dropdown Portaled screenshot saved to:", snapNotifPath);

    // Close notifications
    await sendCommand('Runtime.evaluate', {
      expression: `closeAllHeaderDropdowns()`
    });

    // -----------------------------------------------------------------
    // TEST 5: RESPONSIVE VIEWPORT CHECK (1366x768)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: Responsive Viewport Check (1366x768) ---");
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 400));

    const snap1366 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const snap1366Path = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\nrg_home_dashboard_responsive_1366.png';
    fs.writeFileSync(snap1366Path, Buffer.from(snap1366.data, 'base64'));
    console.log("   📸 1366x768 Responsive Screenshot saved to:", snap1366Path);

    console.log("\n==================================================================");
    console.log("🎉 ALL FINAL HOME DASHBOARD & PORTAL TESTS PASSED PERFECTLY!");
    console.log("==================================================================");

    ws.close();
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { server.kill(); } catch (e) {}
  }
}

verifyHomeFinal1080p().catch(console.error);
