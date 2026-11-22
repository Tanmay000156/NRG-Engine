const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original index.html length:', html.length);

// If nrgOverlayLayer already exists, extract it first to clean up
const existingOverlayStart = html.indexOf('<div id="nrgOverlayLayer"');
if (existingOverlayStart !== -1) {
  const existingOverlayEnd = html.indexOf('</div>\n  </div>', existingOverlayStart);
  if (existingOverlayEnd !== -1) {
    html = html.substring(0, existingOverlayStart) + html.substring(existingOverlayEnd + 15);
  } else {
    const endBody = html.lastIndexOf('</body>');
    html = html.substring(0, existingOverlayStart) + html.substring(endBody);
  }
}

// Ensure the dropdowns are NOT in top nav
const notifInNav = html.indexOf('id="notificationsDropdownMenu"');
const profileInNav = html.indexOf('id="profileDropdownMenu"');

// We have the template for the dropdowns
const cleanNotifDropdown = `
    <!-- Notification Dropdown Menu -->
    <div class="notifications-dropdown-menu portal-dropdown" id="notificationsDropdownMenu" role="menu">
      <div class="notifications-dropdown-header">
        <div class="notifications-dropdown-title">
          <span>Notifications</span>
          <span class="unread-count-pill" id="unreadCountPill">2 new</span>
        </div>
        <button class="notifications-mark-read" id="btnMarkAllRead">Mark All as Read</button>
      </div>
      <div class="notifications-list" id="notificationsList">
        <div class="notification-item unread" data-action="editor">
          <div class="notification-dot"></div>
          <div class="notification-content">
            <div class="notification-title">Welcome to NRG ENGINE</div>
            <div class="notification-desc">Cloud IDE initialized with 10 high-performance compilers.</div>
            <div class="notification-time">Just now</div>
          </div>
        </div>
        <div class="notification-item unread" data-action="projects">
          <div class="notification-dot"></div>
          <div class="notification-content">
            <div class="notification-title">Your recent project is ready to continue</div>
            <div class="notification-desc">Workspace state and multi-file tree preserved.</div>
            <div class="notification-time">15m ago</div>
          </div>
        </div>
        <div class="notification-item" data-action="templates">
          <div class="notification-dot"></div>
          <div class="notification-content">
            <div class="notification-title">Explore available code templates</div>
            <div class="notification-desc">10+ language starter algorithms and systems templates.</div>
            <div class="notification-time">2h ago</div>
          </div>
        </div>
        <div class="notification-item" data-action="graphics">
          <div class="notification-dot"></div>
          <div class="notification-content">
            <div class="notification-title">Graphics Workspace is available</div>
            <div class="notification-desc">Render visual computing pipelines in Turtle, Matplotlib & Java AWT.</div>
            <div class="notification-time">1d ago</div>
          </div>
        </div>
      </div>
    </div>`;

const cleanProfileDropdown = `
    <!-- Profile Dropdown Menu -->
    <div class="profile-dropdown-menu portal-dropdown" id="profileDropdownMenu" role="menu">
      <div class="profile-dropdown-header">
        <div class="profile-dropdown-avatar">
          <span>TV</span>
        </div>
        <div class="profile-dropdown-info">
          <div class="profile-dropdown-name">Tanmay Verma</div>
          <div class="profile-dropdown-role">Developer</div>
        </div>
        <span class="profile-dropdown-badge">PRO</span>
      </div>
      <div class="profile-dropdown-divider"></div>
      <div class="profile-dropdown-items">
        <button class="profile-dropdown-item" id="pmenuAccount">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>My Account</span>
        </button>
        <button class="profile-dropdown-item" id="pmenuPreferences">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Preferences</span>
        </button>
        <button class="profile-dropdown-item" id="pmenuTheme">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <span>Theme</span>
        </button>
        <button class="profile-dropdown-item" id="pmenuShortcuts">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="6" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line></svg>
          <span>Keyboard Shortcuts</span>
        </button>
        <button class="profile-dropdown-item" id="pmenuHelp">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Help & Support</span>
        </button>
        <div class="profile-dropdown-divider"></div>
        <button class="profile-dropdown-item profile-dropdown-item-danger" id="pmenuSignOut">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>`;

const portalOverlayHTML = `
  <!-- ====================================================================
       PORTAL OVERLAY LAYER (Document-level overlay above all stacking contexts)
       ==================================================================== -->
  <div id="nrgOverlayLayer" class="nrg-overlay-layer">
    ${cleanNotifDropdown}
    ${cleanProfileDropdown}
  </div>
`;

// Crucial: Inject BEFORE <script> tag so elements exist in DOM when script executes!
const scriptTagIdx = html.indexOf('<script>');
if (scriptTagIdx === -1) throw new Error('Could not find <script>');
html = html.substring(0, scriptTagIdx) + portalOverlayHTML + '\n  ' + html.substring(scriptTagIdx);
console.log('Injected nrgOverlayLayer BEFORE <script> successfully');

// =========================================================================
// CSS UPDATES: Make .portal-dropdown fixed with top/left/right defaults
// =========================================================================

const portalCssMarker = '.nrg-overlay-layer {';
const portalCssIdx = html.indexOf(portalCssMarker);
if (portalCssIdx !== -1) {
  const portalCssEnd = html.indexOf('/* Cards Grid (Projects & Templates) */', portalCssIdx);
  const correctPortalCSS = `.nrg-overlay-layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 0;
      z-index: 1000;
      pointer-events: none;
    }
    .profile-dropdown-menu.portal-dropdown,
    .notifications-dropdown-menu.portal-dropdown {
      position: fixed !important;
      top: 0;
      left: 0;
      right: auto !important;
      bottom: auto !important;
      z-index: 1000 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateY(-8px) !important;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s !important;
    }
    .profile-dropdown-menu.portal-dropdown.open,
    .notifications-dropdown-menu.portal-dropdown.open {
      opacity: 1 !important;
      visibility: visible !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    
    `;
  html = html.substring(0, portalCssIdx) + correctPortalCSS + html.substring(portalCssEnd);
}

// =========================================================================
// JS UPDATES: Ensure elements are accessed reliably
// =========================================================================

const jsDropdownStart = html.indexOf('// User Profile & Notification Dropdown Handlers');
const jsDropdownEnd = html.indexOf('document.getElementById(\'btnMessages\')', jsDropdownStart);

if (jsDropdownStart !== -1 && jsDropdownEnd !== -1) {
  const robustDropdownsJS = `// User Profile & Notification Dropdown Handlers (Overlay Portal Positioning)
    function positionProfileDropdown() {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      if (!profileDropdown || !userProfileBtn) return;

      const rect = userProfileBtn.getBoundingClientRect();
      const menuWidth = 250;
      const padding = 12;

      let top = rect.bottom + 8;
      let left = rect.right - menuWidth;

      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      const menuHeight = profileDropdown.offsetHeight || 310;
      if (top + menuHeight > window.innerHeight - padding) {
        const topAbove = rect.top - menuHeight - 8;
        if (topAbove >= padding) {
          top = topAbove;
        } else {
          top = Math.max(padding, window.innerHeight - menuHeight - padding);
        }
      }

      profileDropdown.style.top = Math.round(top) + 'px';
      profileDropdown.style.left = Math.round(left) + 'px';
    }

    function positionNotificationsDropdown() {
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');
      if (!notificationsDropdown || !btnNotifications) return;

      const rect = btnNotifications.getBoundingClientRect();
      const menuWidth = 320;
      const padding = 12;

      let top = rect.bottom + 8;
      let left = rect.right - menuWidth;

      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      const menuHeight = notificationsDropdown.offsetHeight || 380;
      if (top + menuHeight > window.innerHeight - padding) {
        const topAbove = rect.top - menuHeight - 8;
        if (topAbove >= padding) {
          top = topAbove;
        } else {
          top = Math.max(padding, window.innerHeight - menuHeight - padding);
        }
      }

      notificationsDropdown.style.top = Math.round(top) + 'px';
      notificationsDropdown.style.left = Math.round(left) + 'px';
    }

    function closeAllHeaderDropdowns() {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');

      if (profileDropdown) {
        profileDropdown.classList.remove('open');
        userProfileBtn?.setAttribute('aria-expanded', 'false');
        userProfileBtn?.classList.remove('open');
      }
      if (notificationsDropdown) {
        notificationsDropdown.classList.remove('open');
        btnNotifications?.setAttribute('aria-expanded', 'false');
      }
    }

    const userProfileBtnEl = document.getElementById('userProfileBtn');
    if (userProfileBtnEl) {
      userProfileBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const profileDropdown = document.getElementById('profileDropdownMenu');
        const isOpen = profileDropdown && profileDropdown.classList.contains('open');
        closeAllHeaderDropdowns();
        if (!isOpen && profileDropdown) {
          positionProfileDropdown();
          profileDropdown.classList.add('open');
          userProfileBtnEl.setAttribute('aria-expanded', 'true');
          userProfileBtnEl.classList.add('open');
        }
      });
    }

    const profileDropdownEl = document.getElementById('profileDropdownMenu');
    if (profileDropdownEl) {
      profileDropdownEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const btnNotificationsEl = document.getElementById('btnNotifications');
    if (btnNotificationsEl) {
      btnNotificationsEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
        const isOpen = notificationsDropdown && notificationsDropdown.classList.contains('open');
        closeAllHeaderDropdowns();
        if (!isOpen && notificationsDropdown) {
          positionNotificationsDropdown();
          notificationsDropdown.classList.add('open');
          btnNotificationsEl.setAttribute('aria-expanded', 'true');
        }
      });
    }

    const notificationsDropdownEl = document.getElementById('notificationsDropdownMenu');
    if (notificationsDropdownEl) {
      notificationsDropdownEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Reposition portal dropdowns on resize & scroll
    window.addEventListener('resize', () => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      if (profileDropdown?.classList.contains('open')) positionProfileDropdown();
      if (notificationsDropdown?.classList.contains('open')) positionNotificationsDropdown();
    });
    window.addEventListener('scroll', () => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      if (profileDropdown?.classList.contains('open')) positionProfileDropdown();
      if (notificationsDropdown?.classList.contains('open')) positionNotificationsDropdown();
    }, true);

    // Profile Dropdown Options Handlers
    document.getElementById('pmenuAccount')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      showToast('👤 Account Profile: Tanmay Verma • Developer Edition (Pro Active)');
    });
    document.getElementById('pmenuPreferences')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      navigateToSection('settings');
    });
    document.getElementById('pmenuTheme')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      document.getElementById('btnThemeToggle')?.click();
    });
    document.getElementById('pmenuShortcuts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      showToast('⌨️ Shortcuts: Ctrl+K Search • Ctrl+Enter Run • Ctrl+S Save • Esc Close');
    });
    document.getElementById('pmenuHelp')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      showToast('💡 NRG Engine Help: Docs, compiler benchmarks & visual execution guide available');
    });
    document.getElementById('pmenuSignOut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      showToast('ℹ️ Signed in as Tanmay Verma (Developer Edition)');
    });

    // Notifications Dropdown Actions
    document.getElementById('btnMarkAllRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('#notificationsList .notification-item').forEach(item => {
        item.classList.remove('unread');
      });
      const unreadDot = document.getElementById('notificationsBadgeDot');
      const unreadPill = document.getElementById('unreadCountPill');
      if (unreadDot) unreadDot.style.display = 'none';
      if (unreadPill) unreadPill.textContent = '0 new';
      showToast('All notifications marked as read');
    });

    document.querySelectorAll('#notificationsList .notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.remove('unread');
        const unreadPill = document.getElementById('unreadCountPill');
        const unreadDot = document.getElementById('notificationsBadgeDot');
        const remainingUnread = document.querySelectorAll('#notificationsList .notification-item.unread').length;
        if (unreadPill) unreadPill.textContent = \`\${remainingUnread} new\`;
        if (remainingUnread === 0 && unreadDot) unreadDot.style.display = 'none';

        const action = item.dataset.action;
        closeAllHeaderDropdowns();
        if (action === 'editor') navigateToSection('editor');
        else if (action === 'projects') navigateToSection('projects');
        else if (action === 'templates') navigateToSection('templates');
        else if (action === 'graphics') {
          navigateToSection('editor');
          switchTerminalTab('graphics');
        }
      });
    });

    // Close header dropdowns on outside click
    document.addEventListener('click', (e) => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');

      if (profileDropdown && !profileDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
        profileDropdown.classList.remove('open');
        userProfileBtn?.classList.remove('open');
        userProfileBtn?.setAttribute('aria-expanded', 'false');
      }
      if (notificationsDropdown && !notificationsDropdown.contains(e.target) && !btnNotifications.contains(e.target)) {
        notificationsDropdown.classList.remove('open');
        btnNotifications?.setAttribute('aria-expanded', 'false');
      }
    });

    // Escape key closes dropdowns
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllHeaderDropdowns();
      }
    });
`;
  html = html.substring(0, jsDropdownStart) + robustDropdownsJS + '\n    ' + html.substring(jsDropdownEnd);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated index.html successfully! New length:', html.length);
