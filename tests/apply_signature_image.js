// Script to replace bottom-left branding with TANMAY NRG signature image
const fs = require('fs');

const htmlPath = 'C:/Users/tanma/nrg-engine/index.html';
const imagePath = 'C:/Users/tanma/nrg-engine/assets/tanmay_nrg_signature.png';

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/\r\n/g, '\n');

// Read signature image base64
const imgBuffer = fs.readFileSync(imagePath);
const sigB64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
console.log('Signature image base64 length:', sigB64.length);

// 1. Replace CSS for developer-signature-card with .sidebar-signature-wrap & .sidebar-signature-img
const oldCssBlock = `    /* Developer Signature Card (Sidebar) */
    .developer-signature-card {
      margin-top: auto;
      margin-bottom: 8px;
      padding: 10px 12px;
      background: var(--card-bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-panel-border);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 3px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .developer-signature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2.5px;
      background: linear-gradient(90deg, #38bdf8, #2563eb, #6366f1);
      opacity: 0.9;
    }
    .developer-signature-card:hover {
      border-color: rgba(37, 99, 235, 0.4);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.15);
      transform: translateY(-1px);
    }
    .dev-sig-header {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dev-sig-sparkle {
      color: #38bdf8;
      font-size: 11px;
      display: inline-block;
      animation: sigSparkle 2s ease-in-out infinite alternate;
    }
    @keyframes sigSparkle {
      0% { transform: scale(0.9) rotate(0deg); opacity: 0.75; }
      100% { transform: scale(1.2) rotate(15deg); opacity: 1; filter: drop-shadow(0 0 4px #38bdf8); }
    }
    .dev-sig-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .dev-sig-name {
      font-family: 'Playfair Display', 'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, serif;
      font-size: 15.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.25;
      background: linear-gradient(135deg, var(--text-main) 60%, var(--primary-blue));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .dev-sig-badge {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.9px;
      text-transform: uppercase;
      color: var(--primary-blue);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
      opacity: 0.95;
    }`;

const newCssBlock = `    /* Sidebar Developer Signature (Pure Image Replacement) */
    .sidebar-signature-wrap {
      margin-top: auto;
      padding: 12px 4px 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .sidebar-signature-img {
      width: 100%;
      max-width: 172px;
      height: auto;
      aspect-ratio: 2000 / 666;
      object-fit: contain;
      display: block;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .sidebar-signature-wrap {
        display: none !important;
      }
    }
    .sidebar-panel.collapsed .sidebar-signature-wrap {
      display: none !important;
    }`;

if (html.includes(oldCssBlock)) {
  html = html.replace(oldCssBlock, () => newCssBlock);
  console.log('✓ Replaced signature CSS block');
} else {
  console.error('Could not find oldCssBlock in index.html!');
  process.exit(1);
}

// 2. Replace HTML markup in sidebar
const oldHtmlMarkup = `        <!-- Developer Signature Card (Requirement 4) -->
        <div class="developer-signature-card">
          <div class="dev-sig-header">
            <span class="dev-sig-sparkle">✦</span>
            <span class="dev-sig-label">CREATOR</span>
          </div>
          <div class="dev-sig-name">Developed by Tanmay Verma</div>
          <div class="dev-sig-badge">NRG ENGINE &bull; DEVELOPER EDITION</div>
        </div>

        <!-- Sidebar Footer Version -->
        <div class="sidebar-footer">
          <div class="version-bar"></div>
          <span class="version-text">NRG ENGINE v1</span>
        </div>`;

const newHtmlMarkup = `        <!-- Tanmay NRG Developer Signature Image -->
        <div class="sidebar-signature-wrap" id="sidebarSignatureWrap">
          <img src="assets/tanmay_nrg_signature.png" id="sidebarDevSignatureImg" alt="Developed by Tanmay NRG" class="sidebar-signature-img">
        </div>`;

if (html.includes(oldHtmlMarkup)) {
  html = html.replace(oldHtmlMarkup, () => newHtmlMarkup);
  console.log('✓ Replaced sidebar branding markup with pure signature image');
} else {
  console.error('Could not find oldHtmlMarkup in index.html!');
  process.exit(1);
}

// 3. Add TANMAY_SIGNATURE_B64 in JavaScript
const avatarSearch = `const TANMAY_AVATAR_B64 = 'data:image/png;base64,`;
if (html.includes(avatarSearch)) {
  const sigDecl = `const TANMAY_SIGNATURE_B64 = '${sigB64}';\n    ` + avatarSearch;
  html = html.replace(avatarSearch, () => sigDecl);
  console.log('✓ Injected TANMAY_SIGNATURE_B64 declaration');
} else {
  console.error('Could not find TANMAY_AVATAR_B64 in index.html!');
  process.exit(1);
}

// 4. Assign signature image src on load in JS
const avatarSetupSearch = `    if (avatarImg) {
      avatarImg.src = TANMAY_AVATAR_B64;
    }`;

const sigSetupReplacement = `    if (avatarImg) {
      avatarImg.src = TANMAY_AVATAR_B64;
    }
    const sidebarDevSignatureImg = document.getElementById('sidebarDevSignatureImg');
    if (sidebarDevSignatureImg) {
      sidebarDevSignatureImg.src = TANMAY_SIGNATURE_B64;
    }`;

if (html.includes(avatarSetupSearch)) {
  html = html.replace(avatarSetupSearch, () => sigSetupReplacement);
  console.log('✓ Injected signature image initialization');
} else {
  console.error('Could not find avatarSetupSearch in index.html!');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('SUCCESS: Bottom-left branding replaced with TANMAY NRG signature image!');
