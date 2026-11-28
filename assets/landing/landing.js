(() => {
  const gate = document.getElementById('nrgLandingGate');
  if (!gate) return;

  // Optional direct skip via URL query/hash for deep links
  const params = new URLSearchParams(window.location.search);
  const skipLanding = params.get('skipLanding') === '1' || window.location.hash === '#dashboard';
  if (skipLanding) {
    window.__nrgLandingActive = false;
    gate.hidden = true;
    document.body.classList.remove('nrg-landing-active');
    document.body.classList.add('nrg-dashboard-ready');
    return;
  }

  window.__nrgLandingActive = true;

  const TOTAL_FRAMES = 201;
  const SPINE_STEP = 5;
  const MAX_PROMOTE_CONCURRENCY = 6;
  // Video finishes at 84% of gate travel; 84-88% holds pure black beat; 88-96% dissolves into Main Dashboard
  const VIDEO_END_AT = 0.84;
  const DISSOLVE_START = 0.88;
  const DISSOLVE_COMPLETE = 0.96;

  const track = document.getElementById('landingScrollTrack');
  const canvas = document.getElementById('landingScrubCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const video = document.getElementById('landingFallbackVideo');
  const header = document.getElementById('landingHeader');
  const scrim = document.getElementById('landingScrim');
  const progressTrack = document.getElementById('landingProgressTrack');
  const progressBar = document.getElementById('landingProgressBar');

  const navLinks = Array.from(gate.querySelectorAll('.nl-nav-link'));
  const mobileLinks = Array.from(gate.querySelectorAll('.nl-mobile-link'));
  const navTriggers = Array.from(gate.querySelectorAll('[data-landing-nav]'));
  const mobileMenuBtn = document.getElementById('landingMobileMenuBtn');
  const mobileDrawer = document.getElementById('landingMobileDrawer');

  const launchBtn = document.getElementById('landingLaunchBtn');
  const pricingLaunchBtn = document.getElementById('landingPricingLaunchBtn');

  const sceneEls = {
    home: document.getElementById('landingSceneHome'),
    features: document.getElementById('landingSceneFeatures'),
    pricing: document.getElementById('landingScenePricing'),
    nrg: document.getElementById('landingSceneNrg'),
  };

  // Mapped within [0 .. VIDEO_END_AT (0.84)] so all text fades completely before pure black screen
  const SCENES = [
    { key: 'home', fadeInStart: -0.10, fullStart: 0.00, fullEnd: 0.13, fadeOutEnd: 0.19 },
    { key: 'features', fadeInStart: 0.17, fullStart: 0.22, fullEnd: 0.37, fadeOutEnd: 0.42 },
    { key: 'pricing', fadeInStart: 0.40, fullStart: 0.45, fullEnd: 0.58, fadeOutEnd: 0.63 },
    { key: 'nrg', fadeInStart: 0.61, fullStart: 0.66, fullEnd: 0.75, fadeOutEnd: 0.81 },
  ];

  const NAV_SCROLL_TARGETS = {
    home: 0.0,
    features: 0.295,
    pricing: 0.515,
    nrg: 0.705,
  };

  const frames = new Array(TOTAL_FRAMES).fill(null);
  const bitmaps = new Array(TOTAL_FRAMES).fill(null);
  const loadedFlags = new Array(TOTAL_FRAMES).fill(false);
  const promoteQueue = [];
  const queuedFlags = new Uint8Array(TOTAL_FRAMES);

  let activeNav = 'home';
  let targetProgress = 0;
  let currentProgress = 0;
  let lastDrawnIndex = -1;
  let canvasActivated = false;
  let videoRemoved = false;
  let rafId = null;
  let autoScrollRaf = null;
  let lastTickTs = 0;
  let activePromotions = 0;
  let dashboardEntered = false;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad3(n) {
    return String(n).padStart(3, '0');
  }

  function releaseVideoFallback() {
    if (videoRemoved || !video) return;
    videoRemoved = true;
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    } catch {}
  }

  function getRenderableSource(index) {
    if (bitmaps[index]) return bitmaps[index];
    if (loadedFlags[index] && frames[index]) return frames[index];
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0) {
        if (bitmaps[prev]) return bitmaps[prev];
        if (loadedFlags[prev] && frames[prev]) return frames[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES) {
        if (bitmaps[next]) return bitmaps[next];
        if (loadedFlags[next] && frames[next]) return frames[next];
      }
    }
    return null;
  }

  function pumpPromoteQueue() {
    if (typeof createImageBitmap !== 'function') return;
    while (activePromotions < MAX_PROMOTE_CONCURRENCY && promoteQueue.length > 0) {
      const idx = promoteQueue.shift();
      const img = frames[idx];
      if (!img || bitmaps[idx]) continue;

      activePromotions++;
      createImageBitmap(img)
        .then((bm) => {
          bitmaps[idx] = bm;
          frames[idx] = null;
          const videoP = Math.min(1, currentProgress / VIDEO_END_AT);
          const targetIdx = Math.round(videoP * (TOTAL_FRAMES - 1));
          if (!canvasActivated && idx === 0) {
            canvasActivated = true;
            canvas.classList.add('is-ready');
            releaseVideoFallback();
            renderAtProgress(currentProgress, true);
          } else if (idx === targetIdx && idx !== lastDrawnIndex) {
            renderAtProgress(currentProgress, true);
          }
        })
        .catch(() => {})
        .finally(() => {
          activePromotions = Math.max(0, activePromotions - 1);
          pumpPromoteQueue();
        });
    }
  }

  function enqueuePromote(idx, priority = false) {
    if (typeof createImageBitmap !== 'function' || bitmaps[idx] || queuedFlags[idx]) return;
    queuedFlags[idx] = 1;
    if (priority) promoteQueue.unshift(idx);
    else promoteQueue.push(idx);
    pumpPromoteQueue();
  }

  function preloadFrames() {
    const order = [];
    const seen = new Uint8Array(TOTAL_FRAMES);
    const push = (i) => {
      if (!seen[i]) {
        seen[i] = 1;
        order.push(i);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i += SPINE_STEP) push(i);
    push(TOTAL_FRAMES - 1);
    for (let i = 0; i < TOTAL_FRAMES; i++) push(i);

    order.forEach((idx) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loadedFlags[idx] = true;
        const videoP = Math.min(1, currentProgress / VIDEO_END_AT);
        const targetIdx = Math.round(videoP * (TOTAL_FRAMES - 1));
        if (!canvasActivated && idx === 0) {
          canvasActivated = true;
          canvas.classList.add('is-ready');
          releaseVideoFallback();
          renderAtProgress(currentProgress, true);
        } else if (idx === targetIdx) {
          renderAtProgress(currentProgress, true);
        }
        enqueuePromote(idx, idx % SPINE_STEP === 0 || Math.abs(idx - targetIdx) <= 12);
      };
      img.src = `assets/landing/frames/f_${pad3(idx)}.jpg`;
      frames[idx] = img;
    });
  }

  function getMaxScroll() {
    return Math.max(1, track.offsetHeight - gate.clientHeight);
  }

  function getScrollProgress() {
    return Math.min(1, Math.max(0, gate.scrollTop / getMaxScroll()));
  }

  function getNavForProgress(p) {
    if (p < 0.18) return 'home';
    if (p < 0.41) return 'features';
    if (p < 0.62) return 'pricing';
    return 'nrg';
  }

  function setActiveNav(navName) {
    if (activeNav === navName) return;
    activeNav = navName;
    navLinks.forEach((btn) => {
      const active = btn.dataset.landingNav === navName;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    mobileLinks.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.landingNav === navName);
    });
  }

  function computeSceneState(scene, p) {
    if (p <= scene.fadeInStart || p >= scene.fadeOutEnd) {
      return { opacity: 0, offsetY: p <= scene.fadeInStart ? 14 : -14 };
    }
    if (p < scene.fullStart) {
      const t = (p - scene.fadeInStart) / (scene.fullStart - scene.fadeInStart);
      const eased = t * t * (3 - 2 * t);
      return { opacity: eased, offsetY: (1 - eased) * 14 };
    }
    if (p <= scene.fullEnd) {
      return { opacity: 1, offsetY: 0 };
    }
    const t = (p - scene.fullEnd) / (scene.fadeOutEnd - scene.fullEnd);
    const eased = t * t * (3 - 2 * t);
    return { opacity: 1 - eased, offsetY: -eased * 14 };
  }

  function completeDashboardTransition() {
    if (dashboardEntered) return;
    dashboardEntered = true;
    cancelAutoScroll();
    window.__nrgLandingActive = false;

    document.body.classList.remove('nrg-landing-active');
    document.body.classList.add('nrg-dashboard-ready');
    gate.style.opacity = '0';
    gate.style.pointerEvents = 'none';

    if (typeof window.nrgEnterDashboard === 'function') {
      window.nrgEnterDashboard();
    }

    setTimeout(() => {
      gate.hidden = true;
      // Release GPU bitmaps cleanly once inside Main Dashboard
      for (let i = 0; i < bitmaps.length; i++) {
        if (bitmaps[i]) {
          try { bitmaps[i].close(); } catch {}
          bitmaps[i] = null;
        }
      }
    }, 560);
  }

  function updateScenes(p) {
    SCENES.forEach((scene) => {
      const el = sceneEls[scene.key];
      if (!el) return;
      const { opacity, offsetY } = computeSceneState(scene, p);
      el.style.opacity = opacity.toFixed(3);
      if (!prefersReducedMotion) {
        el.style.transform = `translate3d(0, calc(-50% + ${offsetY.toFixed(1)}px), 0)`;
      } else {
        el.style.transform = 'translate3d(0, -50%, 0)';
      }
      const interactive = opacity >= 0.45 && p < 0.80;
      el.classList.toggle('is-visible', interactive);
      el.setAttribute('aria-hidden', String(!interactive));
    });

    // Fade top nav tabs, scrim, and bottom progress track completely out before pitch-black pause (0.77..0.83)
    const chromeOp = p <= 0.77 ? 1 : Math.max(0, 1 - (p - 0.77) / 0.06);
    if (scrim) scrim.style.opacity = chromeOp.toFixed(3);
    if (header) {
      header.style.opacity = chromeOp.toFixed(3);
      header.style.pointerEvents = chromeOp > 0.05 ? 'auto' : 'none';
    }
    if (progressTrack) {
      progressTrack.style.opacity = chromeOp.toFixed(3);
    }

    // Scrolling further past pitch-black (0.88..0.96) smoothly dissolves into Obsidian Main Dashboard
    if (!dashboardEntered) {
      if (p >= DISSOLVE_COMPLETE) {
        document.body.style.setProperty('--nrg-dash-opacity', '1');
        document.body.style.setProperty('--nrg-dash-scale', '1');
        completeDashboardTransition();
      } else if (p > DISSOLVE_START) {
        const t = (p - DISSOLVE_START) / (DISSOLVE_COMPLETE - DISSOLVE_START);
        const eased = t * t * (3 - 2 * t);
        gate.style.opacity = (1 - eased).toFixed(3);
        document.body.style.setProperty('--nrg-dash-opacity', eased.toFixed(3));
        document.body.style.setProperty('--nrg-dash-scale', (0.986 + 0.014 * eased).toFixed(4));
      } else {
        gate.style.opacity = '1';
        document.body.style.setProperty('--nrg-dash-opacity', '0');
        document.body.style.setProperty('--nrg-dash-scale', '0.986');
      }
    }
  }

  function updateUIState(p) {
    const barP = Math.min(1, p / VIDEO_END_AT);
    if (progressBar) progressBar.style.transform = `scaleX(${barP.toFixed(4)})`;
    setActiveNav(getNavForProgress(p));
    updateScenes(p);
  }

  function renderAtProgress(p, force = false) {
    const videoP = Math.min(1, Math.max(0, p / VIDEO_END_AT));
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(videoP * (TOTAL_FRAMES - 1))));
    if (frameIndex !== lastDrawnIndex || force) {
      const src = getRenderableSource(frameIndex);
      if (src) {
        if (!canvasActivated) {
          canvasActivated = true;
          canvas.classList.add('is-ready');
          releaseVideoFallback();
        }
        ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
        lastDrawnIndex = frameIndex;
      }
    }
    updateUIState(p);
  }

  function tick(now) {
    if (dashboardEntered) {
      rafId = null;
      lastTickTs = 0;
      return;
    }

    const dt = lastTickTs ? Math.min(0.05, Math.max(0.001, (now - lastTickTs) / 1000)) : 0.016;
    lastTickTs = now;

    if (prefersReducedMotion) {
      currentProgress = targetProgress;
      renderAtProgress(currentProgress);
      rafId = null;
      lastTickTs = 0;
      return;
    }

    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.00018) {
      const alpha = 1 - Math.exp(-30 * dt);
      currentProgress += diff * alpha;
      renderAtProgress(currentProgress);
      rafId = requestAnimationFrame(tick);
    } else {
      currentProgress = targetProgress;
      renderAtProgress(currentProgress);
      rafId = null;
      lastTickTs = 0;
    }
  }

  function startTick() {
    if (rafId === null && !dashboardEntered) {
      lastTickTs = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  function cancelAutoScroll() {
    if (autoScrollRaf !== null) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  function smoothScrollTo(targetY, durationMs = 2000, onComplete = null) {
    cancelAutoScroll();
    const clampedTarget = Math.max(0, Math.min(getMaxScroll(), Math.round(targetY)));
    const startY = gate.scrollTop;
    const delta = clampedTarget - startY;

    if (prefersReducedMotion || Math.abs(delta) < 2) {
      gate.scrollTop = clampedTarget;
      targetProgress = getScrollProgress();
      currentProgress = targetProgress;
      renderAtProgress(currentProgress, true);
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const startTs = performance.now();
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function step(now) {
      if (dashboardEntered) {
        autoScrollRaf = null;
        return;
      }
      const t = Math.min(1, (now - startTs) / durationMs);
      gate.scrollTop = Math.round(startY + delta * easeInOutCubic(t));
      if (t < 1) {
        autoScrollRaf = requestAnimationFrame(step);
      } else {
        autoScrollRaf = null;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    autoScrollRaf = requestAnimationFrame(step);
  }

  gate.addEventListener(
    'scroll',
    () => {
      targetProgress = getScrollProgress();
      startTick();
    },
    { passive: true }
  );

  gate.addEventListener('wheel', cancelAutoScroll, { passive: true });
  gate.addEventListener('touchstart', cancelAutoScroll, { passive: true });
  gate.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#landingLaunchBtn') && !e.target.closest('#landingPricingLaunchBtn') && !e.target.closest('[data-landing-nav]')) {
      cancelAutoScroll();
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (dashboardEntered) return;
    targetProgress = getScrollProgress();
    renderAtProgress(currentProgress, true);
  });

  navTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.landingNav || 'home';
      if (mobileDrawer && !mobileDrawer.hidden) {
        mobileDrawer.hidden = true;
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
      const anchor = NAV_SCROLL_TARGETS[target] ?? 0;
      smoothScrollTo(anchor * getMaxScroll(), 850);
    });
  });

  const handleLaunchWorkspace = () => {
    const remaining = Math.max(0.25, 1 - currentProgress);
    const duration = Math.round(Math.max(1050, remaining * 2500));
    smoothScrollTo(getMaxScroll(), duration, () => {
      completeDashboardTransition();
    });
  };

  if (launchBtn) launchBtn.addEventListener('click', handleLaunchWorkspace);
  if (pricingLaunchBtn) pricingLaunchBtn.addEventListener('click', handleLaunchWorkspace);

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const open = !mobileDrawer.hidden;
      mobileDrawer.hidden = open;
      mobileMenuBtn.setAttribute('aria-expanded', String(!open));
    });
  }

  window.__nrgLandingDebug = () => ({
    landingActive: !!window.__nrgLandingActive,
    dashboardEntered,
    activeNav,
    targetProgress,
    currentProgress,
    lastDrawnIndex,
    loadedCount: loadedFlags.filter(Boolean).length,
    bitmapCount: bitmaps.filter(Boolean).length,
    videoRemoved,
    headerOpacity: header?.style.opacity,
    progressOpacity: progressTrack?.style.opacity,
    gateOpacity: gate.style.opacity,
    dashOpacity: document.body.style.getPropertyValue('--nrg-dash-opacity'),
    sceneOpacities: {
      home: sceneEls.home?.style.opacity,
      features: sceneEls.features?.style.opacity,
      pricing: sceneEls.pricing?.style.opacity,
      nrg: sceneEls.nrg?.style.opacity,
    },
  });

  targetProgress = getScrollProgress();
  currentProgress = targetProgress;
  updateUIState(currentProgress);
  preloadFrames();
})();
