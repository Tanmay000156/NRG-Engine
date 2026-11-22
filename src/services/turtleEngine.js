// NRG ENGINE 2.0 — HTML5 Canvas Python Turtle Engine
class NRGTurtleEngine {
      constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        if (!this.canvas || !this.container) return;
        this.ctx = this.canvas.getContext('2d');

        this.commands = [];
        this.cmdIndex = 0;
        this.isPlaying = false;
        this.speed = 20; // Default 20 steps/frame
        this.animFrameId = null;

        const isDarkTheme = document.body.classList.contains('crystal-obsidian') || document.body.classList.contains('theme-dark');
        this.bgColor = isDarkTheme ? '#070d18' : '#ffffff';
        this.hasCustomBg = false;
        this.turtles = {};
        this.drawnItems = [];
        this.stamps = {};

        this.originX = 0;
        this.originY = 0;
        this.scale = 1.0;

        this.initCanvas();
        this.bindControls();
      }

      initCanvas() {
        this.resize();
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => this.resize());
          ro.observe(this.container);
        } else {
          window.addEventListener('resize', () => this.resize());
        }

        // Theme change detection
        const observer = new MutationObserver(() => {
          const isDark = document.body.classList.contains('crystal-obsidian') || document.body.classList.contains('theme-dark');
          if (!this.hasCustomBg) {
            this.bgColor = isDark ? '#070d18' : '#ffffff';
            this.redraw();
          }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }

      resize() {
        if (!this.canvas || !this.container) return;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        this.dpr = dpr;
        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = Math.round(rect.width * dpr);
        this.canvas.height = Math.round(rect.height * dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.originX = rect.width / 2;
        this.originY = rect.height / 2;

        this.redraw();
      }

      toCanvasX(turtleX) {
        return this.originX + (turtleX * this.scale);
      }

      toCanvasY(turtleY) {
        // Cartesian +Y is UP, Canvas +Y is DOWN
        return this.originY - (turtleY * this.scale);
      }

      getTurtle(tid) {
        if (!this.turtles[tid]) {
          this.turtles[tid] = {
            tid: tid,
            x: 0,
            y: 0,
            heading: 0, // 0 = East
            penDown: true,
            penColor: '#000000',
            fillColor: '#000000',
            penSize: 1.5,
            speed: 3,
            visible: true,
            shape: 'classic',
            isFilling: false,
            fillPoints: []
          };
        }
        return this.turtles[tid];
      }

      loadCommands(commandList) {
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }

        this.commands = commandList || [];
        this.cmdIndex = 0;
        this.hasCustomBg = false;
        const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-navy');
        this.bgColor = isDark ? '#0f172a' : '#ffffff';

        this.turtles = {};
        this.drawnItems = [];
        this.stamps = {};

        const placeholder = document.getElementById('turtlePlaceholder');
        if (placeholder) placeholder.classList.add('hidden');

        this.isPlaying = true;
        this.updatePlayPauseBtn(true);
        this.updateStatusBadge();
        this.loop();
      }

      loop() {
        if (!this.isPlaying) return;

        if (this.speed === 0) {
          // Instant mode: process all remaining commands at once
          while (this.cmdIndex < this.commands.length) {
            this.processCommand(this.commands[this.cmdIndex]);
            this.cmdIndex++;
          }
          this.redraw();
          this.updateStatusBadge();
          this.isPlaying = false;
          this.updatePlayPauseBtn(false);
          return;
        }

        const batch = Math.min(this.speed, this.commands.length - this.cmdIndex);
        for (let i = 0; i < batch; i++) {
          if (this.cmdIndex >= this.commands.length) break;
          this.processCommand(this.commands[this.cmdIndex]);
          this.cmdIndex++;
        }

        this.redraw();
        this.updateStatusBadge();

        if (this.cmdIndex < this.commands.length) {
          this.animFrameId = requestAnimationFrame(() => this.loop());
        } else {
          this.isPlaying = false;
          this.updatePlayPauseBtn(false);
        }
      }

      processCommand(cmd) {
        if (!cmd) return;
        const t = cmd.tid ? this.getTurtle(cmd.tid) : null;

        switch (cmd.cmd) {
          case 'create_turtle': {
            const turtle = this.getTurtle(cmd.tid);
            turtle.shape = cmd.shape || 'classic';
            turtle.visible = cmd.visible !== false;
            turtle.x = cmd.x || 0;
            turtle.y = cmd.y || 0;
            turtle.heading = cmd.heading || 0;
            turtle.penColor = cmd.pencolor || '#000000';
            turtle.fillColor = cmd.fillcolor || '#000000';
            turtle.penSize = cmd.pensize || 1.5;
            break;
          }
          case 'move': {
            if (!t) break;
            const x0 = cmd.x0 !== undefined ? cmd.x0 : t.x;
            const y0 = cmd.y0 !== undefined ? cmd.y0 : t.y;
            const x1 = cmd.x1;
            const y1 = cmd.y1;

            if (cmd.pen && (x0 !== x1 || y0 !== y1)) {
              this.drawnItems.push({
                type: 'line',
                x0: x0,
                y0: y0,
                x1: x1,
                y1: y1,
                color: cmd.color || t.penColor,
                size: cmd.size || t.penSize
              });
            }

            if (t.isFilling) {
              t.fillPoints.push({ x: x1, y: y1 });
            }

            t.x = x1;
            t.y = y1;
            break;
          }
          case 'rotate': {
            if (!t) break;
            t.heading = cmd.heading;
            break;
          }
          case 'penup': {
            if (t) t.penDown = false;
            break;
          }
          case 'pendown': {
            if (t) t.penDown = true;
            break;
          }
          case 'pencolor': {
            if (t) t.penColor = cmd.color;
            break;
          }
          case 'fillcolor': {
            if (t) t.fillColor = cmd.color;
            break;
          }
          case 'pensize': {
            if (t) t.penSize = cmd.size;
            break;
          }
          case 'begin_fill': {
            if (t) {
              t.isFilling = true;
              t.fillPoints = [{ x: t.x, y: t.y }];
              t.currentFillColor = cmd.color || t.fillColor;
            }
            break;
          }
          case 'end_fill': {
            if (t && t.isFilling) {
              t.isFilling = false;
              if (t.fillPoints && t.fillPoints.length >= 3) {
                this.drawnItems.push({
                  type: 'fill',
                  points: [...t.fillPoints],
                  color: cmd.color || t.currentFillColor || t.fillColor
                });
              }
              t.fillPoints = [];
            }
            break;
          }
          case 'dot': {
            this.drawnItems.push({
              type: 'dot',
              x: cmd.x,
              y: cmd.y,
              size: cmd.size || 4,
              color: cmd.color || (t ? t.penColor : '#000000')
            });
            break;
          }
          case 'stamp': {
            if (cmd.sid) {
              this.stamps[cmd.sid] = {
                x: cmd.x,
                y: cmd.y,
                heading: cmd.heading,
                shape: cmd.shape || 'classic',
                penColor: cmd.pencolor || '#000000',
                fillColor: cmd.fillcolor || '#000000'
              };
            }
            break;
          }
          case 'clearstamp': {
            if (cmd.sid && this.stamps[cmd.sid]) {
              delete this.stamps[cmd.sid];
            }
            break;
          }
          case 'clearstamps': {
            this.stamps = {};
            break;
          }
          case 'write': {
            this.drawnItems.push({
              type: 'text',
              text: cmd.text,
              x: cmd.x,
              y: cmd.y,
              align: cmd.align || 'left',
              font: cmd.font,
              color: cmd.color || '#000000'
            });
            break;
          }
          case 'bgcolor': {
            this.bgColor = cmd.color;
            this.hasCustomBg = true;
            break;
          }
          case 'hideturtle': {
            if (t) t.visible = false;
            break;
          }
          case 'showturtle': {
            if (t) t.visible = true;
            break;
          }
          case 'shape': {
            if (t) t.shape = cmd.shape;
            break;
          }
          case 'screen_clear': {
            this.drawnItems = [];
            this.stamps = {};
            break;
          }
          case 'resetscreen': {
            this.drawnItems = [];
            this.stamps = {};
            Object.values(this.turtles).forEach(turtle => {
              turtle.x = 0;
              turtle.y = 0;
              turtle.heading = 0;
              turtle.penDown = true;
            });
            break;
          }
          case 'turtle_reset': {
            if (t) {
              t.x = 0;
              t.y = 0;
              t.heading = 0;
              t.penDown = true;
            }
            break;
          }
        }
      }

      redraw() {
        if (!this.ctx || !this.width || !this.height) return;
        const ctx = this.ctx;
        const dpr = this.dpr || 1;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 1. Draw Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Subtle Coordinate Center Grid Lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.originX, 0);
        ctx.lineTo(this.originX, this.height);
        ctx.moveTo(0, this.originY);
        ctx.lineTo(this.width, this.originY);
        ctx.stroke();

        // 3. Draw All Committed Items (Fills, Lines, Dots, Text)
        for (const item of this.drawnItems) {
          if (item.type === 'fill') {
            if (item.points && item.points.length >= 3) {
              ctx.beginPath();
              ctx.moveTo(this.toCanvasX(item.points[0].x), this.toCanvasY(item.points[0].y));
              for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(this.toCanvasX(item.points[i].x), this.toCanvasY(item.points[i].y));
              }
              ctx.closePath();
              ctx.fillStyle = item.color;
              ctx.fill();
            }
          } else if (item.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(this.toCanvasX(item.x0), this.toCanvasY(item.y0));
            ctx.lineTo(this.toCanvasX(item.x1), this.toCanvasY(item.y1));
            ctx.strokeStyle = item.color;
            ctx.lineWidth = item.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          } else if (item.type === 'dot') {
            ctx.beginPath();
            ctx.arc(this.toCanvasX(item.x), this.toCanvasY(item.y), item.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = item.color;
            ctx.fill();
          } else if (item.type === 'text') {
            ctx.fillStyle = item.color;
            ctx.textAlign = item.align || 'left';
            ctx.font = '13px Consolas, monospace';
            ctx.fillText(item.text, this.toCanvasX(item.x), this.toCanvasY(item.y));
          }
        }

        // 4. Draw Active In-Progress Fill Polygons
        Object.values(this.turtles).forEach(t => {
          if (t.isFilling && t.fillPoints && t.fillPoints.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(this.toCanvasX(t.fillPoints[0].x), this.toCanvasY(t.fillPoints[0].y));
            for (let i = 1; i < t.fillPoints.length; i++) {
              ctx.lineTo(this.toCanvasX(t.fillPoints[i].x), this.toCanvasY(t.fillPoints[i].y));
            }
            ctx.fillStyle = t.currentFillColor || t.fillColor;
            ctx.fill();
          }
        });

        // 5. Draw Stamps
        Object.values(this.stamps).forEach(st => {
          this.drawTurtleShape(ctx, this.toCanvasX(st.x), this.toCanvasY(st.y), st.heading, st.shape, st.penColor, st.fillColor, 0.85);
        });

        // 6. Draw Live Turtle Cursors
        Object.values(this.turtles).forEach(t => {
          if (t.visible) {
            this.drawTurtleShape(ctx, this.toCanvasX(t.x), this.toCanvasY(t.y), t.heading, t.shape, t.penColor, t.fillColor, 1.0, t.tid);
          }
        });

        ctx.restore();
      }

      drawTurtleShape(ctx, cx, cy, headingDeg, shape, penColor, fillColor, alpha = 1.0, tid = null) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-headingDeg * Math.PI / 180);
        ctx.globalAlpha = alpha;

        ctx.fillStyle = fillColor || '#2563eb';
        ctx.strokeStyle = penColor || '#1d4ed8';
        ctx.lineWidth = 1.5;

        // Classic Turtle Triangular Arrow
        ctx.beginPath();
        ctx.moveTo(11, 0);       // Nose / Tip
        ctx.lineTo(-8, -6);     // Left fin
        ctx.lineTo(-4, 0);      // Inner notch
        ctx.lineTo(-8, 6);      // Right fin
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // If multiple turtles, draw small TID badge
        if (tid && Object.keys(this.turtles).length > 1) {
          ctx.rotate(headingDeg * Math.PI / 180); // Unrotate for horizontal text
          ctx.fillStyle = '#2563eb';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(`T${tid}`, 10, -8);
        }

        ctx.restore();
      }

      updateStatusBadge() {
        const turtleList = Object.values(this.turtles);
        const activeTurtle = turtleList[0] || { x: 0, y: 0, heading: 0 };

        const elX = document.getElementById('valTurtleX');
        const elY = document.getElementById('valTurtleY');
        const elH = document.getElementById('valTurtleHeading');
        const elS = document.getElementById('valTurtleSteps');

        if (elX) elX.textContent = Math.round(activeTurtle.x);
        if (elY) elY.textContent = Math.round(activeTurtle.y);
        if (elH) elH.textContent = Math.round(activeTurtle.heading) + '°';
        if (elS) elS.textContent = `${this.cmdIndex} / ${this.commands.length}`;
      }

      updatePlayPauseBtn(playing) {
        const btnText = document.getElementById('labelTurtlePlay');
        const btnSvg = document.getElementById('svgTurtlePlay');
        if (!btnText || !btnSvg) return;

        if (playing) {
          btnText.textContent = 'Pause';
          btnSvg.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
        } else {
          btnText.textContent = (this.cmdIndex >= this.commands.length && this.commands.length > 0) ? 'Replay' : 'Play';
          btnSvg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        }
      }

      play() {
        if (this.cmdIndex >= this.commands.length && this.commands.length > 0) {
          this.replay();
          return;
        }
        this.isPlaying = true;
        this.updatePlayPauseBtn(true);
        this.loop();
      }

      pause() {
        this.isPlaying = false;
        this.updatePlayPauseBtn(false);
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
      }

      togglePlayPause() {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      }

      replay() {
        if (this.commands.length === 0) return;
        this.loadCommands(this.commands);
      }

      clear() {
        this.pause();
        this.commands = [];
        this.cmdIndex = 0;
        this.drawnItems = [];
        this.stamps = {};
        this.turtles = {};
        const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-navy');
        this.bgColor = isDark ? '#0f172a' : '#ffffff';
        this.redraw();
        this.updateStatusBadge();
        const placeholder = document.getElementById('turtlePlaceholder');
        if (placeholder) placeholder.classList.remove('hidden');
        showToast('Turtle canvas cleared');
      }

      exportPNG() {
        if (!this.canvas) return;
        const link = document.createElement('a');
        link.download = `nrg_turtle_drawing_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        showToast('Turtle graphic exported as PNG');
      }

      bindControls() {
        const btnPlayPause = document.getElementById('btnTurtlePlayPause') || document.getElementById('btnGraphicsPlayPause');
        if (btnPlayPause) btnPlayPause.addEventListener('click', () => this.togglePlayPause());

        const btnRestart = document.getElementById('btnGraphicsRestart') || document.getElementById('btnTurtleRestart');
        if (btnRestart) btnRestart.addEventListener('click', () => this.replay());

        const btnClear = document.getElementById('btnGraphicsClear') || document.getElementById('btnTurtleClear');
        if (btnClear) btnClear.addEventListener('click', () => this.clear());

        const btnExport = document.getElementById('btnGraphicsExport') || document.getElementById('btnTurtleExport');
        if (btnExport) btnExport.addEventListener('click', () => this.exportPNG());

        const speedSelect = document.getElementById('graphicsSpeedSelect') || document.getElementById('turtleSpeedSelect');
        if (speedSelect) {
          speedSelect.addEventListener('change', (e) => {
            this.speed = parseInt(e.target.value, 10);
            if (!this.isPlaying && this.cmdIndex < this.commands.length) {
              this.play();
            }
          });
        }
      }
    }

    // ==========================================================================
    // NRG ENGINE — UNIVERSAL GRAPHICS WORKSPACE MANAGER
    // Centralized visual computing surface supporting Python, JavaScript, C/C++, Java
    // ==========================================================================
    class NRGGraphicsManager {
      constructor() {
        this.canvas = document.getElementById('graphicsCanvas') || document.getElementById('turtleCanvas');
        this.viewport = document.getElementById('graphicsViewport') || document.getElementById('turtleViewport');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        // View Layers
        this.layerCanvas = this.canvas;
        this.layerImg = document.getElementById('graphicsImageView');
        this.imgEl = document.getElementById('graphicsImg');
        this.layerIframe = document.getElementById('graphicsIframeContainer');
        this.iframeEl = document.getElementById('graphicsIframe');
        this.layerSvg = document.getElementById('graphicsSvgContainer');
        this.placeholder = document.getElementById('graphicsPlaceholder') || document.getElementById('turtlePlaceholder');
        this.errorBanner = document.getElementById('graphicsErrorBanner');
        this.errorText = document.getElementById('graphicsErrorText');

        // Telemetry Elements
        this.engineTag = document.getElementById('graphicsEngineTag');
        this.valRes = document.getElementById('valGraphicsRes');
        this.valStatus = document.getElementById('valGraphicsStatus');
        this.valTelemetry = document.getElementById('valGraphicsTelemetry');

        this.currentEngine = 'ready';
        this.resolution = 'fit';
        this.lastResult = null;

        this.initViewport();
        this.bindEvents();
        this.bindMessageListener();
      }

      initViewport() {
        this.resize();
        if (window.ResizeObserver && this.viewport) {
          const ro = new ResizeObserver(() => this.resize());
          ro.observe(this.viewport);
        } else {
          window.addEventListener('resize', () => this.resize());
        }
      }

      resize() {
        if (!this.canvas || !this.viewport) return;
        if (this.resolution !== 'fit') {
          const parts = this.resolution.split('x');
          const rw = parseInt(parts[0], 10);
          const rh = parseInt(parts[1], 10);
          this.canvas.style.width = rw + 'px';
          this.canvas.style.height = rh + 'px';
          this.canvas.width = rw * (window.devicePixelRatio || 1);
          this.canvas.height = rh * (window.devicePixelRatio || 1);
          if (this.valRes) this.valRes.textContent = `${rw}×${rh}`;
          return;
        }

        const rect = this.viewport.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(rect.width * dpr);
        this.canvas.height = Math.round(rect.height * dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        if (this.valRes) this.valRes.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`;

        if (window.nrgTurtleEngine && this.currentEngine === 'python-turtle') {
          window.nrgTurtleEngine.resize();
        }
      }

      showLayer(layerName) {
        if (this.layerCanvas) this.layerCanvas.style.display = (layerName === 'canvas') ? 'block' : 'none';
        if (this.layerImg) this.layerImg.classList.toggle('hidden', layerName !== 'image');
        if (this.layerIframe) this.layerIframe.classList.toggle('hidden', layerName !== 'iframe');
        if (this.layerSvg) this.layerSvg.classList.toggle('hidden', layerName !== 'svg');
        if (this.placeholder) this.placeholder.classList.add('hidden');
        this.hideError();
      }

      showError(msg) {
        if (this.errorBanner && this.errorText) {
          this.errorText.textContent = `❌ ${msg}`;
          this.errorBanner.classList.remove('hidden');
        }
        if (this.valStatus) this.valStatus.textContent = 'Error';
      }

      hideError() {
        if (this.errorBanner) this.errorBanner.classList.add('hidden');
      }

      setEngine(engineName, status = 'Active') {
        this.currentEngine = engineName;
        if (this.engineTag) this.engineTag.textContent = engineName.toUpperCase();
        if (this.valStatus) this.valStatus.textContent = status;
      }

      // Universal loader for all graphics payloads
      loadGraphicsResult(data) {
        this.lastResult = data;
        const graphicsOutput = data.graphics_output;

        // Case 1: Python Turtle
        if (data.turtle_commands || (graphicsOutput && graphicsOutput.type === 'turtle')) {
          const cmds = data.turtle_commands || graphicsOutput.commands;
          this.showLayer('canvas');
          this.setEngine('Python Turtle', 'Rendering');
          if (this.valTelemetry) this.valTelemetry.textContent = `${cmds.length} steps`;
          if (window.nrgTurtleEngine) {
            window.nrgTurtleEngine.loadCommands(cmds);
          }
          return;
        }

        // Case 2: Static / Rendered Images (Matplotlib, OpenCV, Pygame, Java AWT)
        if (graphicsOutput && graphicsOutput.type === 'image') {
          this.showLayer('image');
          this.setEngine(graphicsOutput.engine || 'Image Render', 'Displayed');
          if (this.imgEl) {
            this.imgEl.src = graphicsOutput.data;
          }
          if (this.valTelemetry) this.valTelemetry.textContent = graphicsOutput.title || 'PNG 2D';
          return;
        }

        // Case 3: C/C++ Framebuffer (PPM P3/P6 format)
        if (graphicsOutput && graphicsOutput.type === 'ppm') {
          this.renderPpm(graphicsOutput.data);
          return;
        }

        // Case 4: Vector SVG
        if (graphicsOutput && graphicsOutput.type === 'svg') {
          this.showLayer('svg');
          this.setEngine(graphicsOutput.engine || 'Vector SVG', 'Displayed');
          if (this.layerSvg) {
            this.layerSvg.innerHTML = graphicsOutput.data;
          }
          if (this.valTelemetry) this.valTelemetry.textContent = 'Vector SVG';
          return;
        }
      }

      // Genuine PPM Framebuffer Renderer (P3 ASCII and P6 Binary)
      renderPpm(ppmText) {
        if (!this.ctx || !ppmText) return;
        this.showLayer('canvas');
        this.setEngine('C Framebuffer (PPM)', 'Rendered');

        try {
          // 1. Strip comments starting with #
          const cleanText = ppmText.replace(/#[^\r\n]*/g, '');
          const tokens = cleanText.trim().split(/\s+/);
          const magic = tokens[0];

          if (magic !== 'P3' && magic !== 'P6') {
            throw new Error(`Unsupported PPM format: ${magic}`);
          }
          const width = parseInt(tokens[1], 10);
          const height = parseInt(tokens[2], 10);
          const maxVal = parseInt(tokens[3], 10) || 255;

          if (!width || !height || width <= 0 || height <= 0) {
            throw new Error('Invalid PPM dimensions');
          }

          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const offCtx = offCanvas.getContext('2d');
          const imgData = offCtx.createImageData(width, height);

          if (magic === 'P3') {
            let tokIdx = 4;
            let pIdx = 0;
            const totalPixels = width * height;
            for (let i = 0; i < totalPixels; i++) {
              const r = Math.min(255, Math.floor((parseInt(tokens[tokIdx++] || 0, 10) / maxVal) * 255));
              const g = Math.min(255, Math.floor((parseInt(tokens[tokIdx++] || 0, 10) / maxVal) * 255));
              const b = Math.min(255, Math.floor((parseInt(tokens[tokIdx++] || 0, 10) / maxVal) * 255));
              imgData.data[pIdx++] = r;
              imgData.data[pIdx++] = g;
              imgData.data[pIdx++] = b;
              imgData.data[pIdx++] = 255;
            }
          } else if (magic === 'P6') {
            const headerMatch = cleanText.match(/P6\s+\d+\s+\d+\s+\d+\s/);
            if (headerMatch) {
              const byteStart = headerMatch[0].length;
              let pIdx = 0;
              for (let i = byteStart; i < byteStart + width * height * 3; i += 3) {
                imgData.data[pIdx++] = cleanText.charCodeAt(i) || 0;
                imgData.data[pIdx++] = cleanText.charCodeAt(i + 1) || 0;
                imgData.data[pIdx++] = cleanText.charCodeAt(i + 2) || 0;
                imgData.data[pIdx++] = 255;
              }
            }
          }

          offCtx.putImageData(imgData, 0, 0);

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          const scale = Math.min((this.canvas.width * 0.95) / width, (this.canvas.height * 0.95) / height, 8.0);
          const dw = Math.floor(width * scale);
          const dh = Math.floor(height * scale);
          const dx = Math.floor((this.canvas.width - dw) / 2);
          const dy = Math.floor((this.canvas.height - dh) / 2);

          this.ctx.imageSmoothingEnabled = false;
          this.ctx.drawImage(offCanvas, dx, dy, dw, dh);

          if (this.valTelemetry) this.valTelemetry.textContent = `${width}×${height} px (Scale ${scale.toFixed(1)}x)`;
          if (this.valStatus) this.valStatus.textContent = 'Rendered';
          this.hideError();
        } catch (e) {
          this.showError(`PPM Parse Error: ${e.message}`);
        }
      }

      // JavaScript Sandboxed Client Execution (Canvas 2D, WebGL 3D, Three.js, p5.js, D3.js)
      runJavaScriptGraphics(jsCode) {
        this.showLayer('iframe');
        this.setEngine('JavaScript WebGL / Canvas', 'Running');
        if (this.valTelemetry) this.valTelemetry.textContent = '60 FPS Hardware Viewport';

        if (!this.iframeEl) return;

        // Escape closing script tags in user code to prevent premature HTML script tag closure
        const safeJs = (jsCode || '').replace(/<\/script>/gi, '<\\/script>');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NRG Graphics Viewport</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0b1120;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"><\\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"><\\/script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    // 1. Error & Diagnostic Interception
    window.onerror = function(msg, url, line, col, err) {
      const errText = err ? (err.message || String(err)) : String(msg);
      window.parent.postMessage({ type: 'nrg_graphics_error', message: errText, line: line, col: col }, '*');
    };
    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      const errText = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
      window.parent.postMessage({ type: 'nrg_graphics_error', message: errText }, '*');
    });

    // 2. Console Redirection to Terminal
    const _origLog = console.log;
    console.log = function(...args) {
      _origLog.apply(console, args);
      window.parent.postMessage({ type: 'nrg_graphics_log', text: args.join(' ') }, '*');
    };

    // 3. Canvas & Context Initialization
    const _canvasEl = document.getElementById('canvas');
    window.canvas = _canvasEl;

    function _syncCanvasSize() {
      if (!_canvasEl) return;
      _canvasEl.width = window.innerWidth;
      _canvasEl.height = window.innerHeight;
      _canvasEl.style.width = '100%';
      _canvasEl.style.height = '100%';
    }
    _syncCanvasSize();
    window.addEventListener('resize', _syncCanvasSize);

    let _activeCtx = null;
    let _activeGl = null;

    Object.defineProperty(window, 'ctx', {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!_activeCtx && _canvasEl) {
          _activeCtx = _canvasEl.getContext('2d');
        }
        return _activeCtx;
      },
      set: function(v) { _activeCtx = v; }
    });

    Object.defineProperty(window, 'gl', {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!_activeGl && _canvasEl) {
          _activeGl = _canvasEl.getContext('webgl2') || _canvasEl.getContext('webgl') || _canvasEl.getContext('experimental-webgl');
        }
        return _activeGl;
      },
      set: function(v) { _activeGl = v; }
    });

    // 4. Animation & Event Tracking for Runaway Protection & Clean Shutdown
    const _rafs = new Set();
    const _intervals = new Set();
    const _timeouts = new Set();
    const _listeners = [];

    const _origRaf = window.requestAnimationFrame.bind(window);
    const _origCaf = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = function(cb) {
      let id;
      const wrapped = function(ts) {
        _rafs.delete(id);
        cb(ts);
      };
      id = _origRaf(wrapped);
      _rafs.add(id);
      return id;
    };
    window.cancelAnimationFrame = function(id) {
      _rafs.delete(id);
      return _origCaf(id);
    };

    const _origSetInterval = window.setInterval.bind(window);
    const _origClearInterval = window.clearInterval.bind(window);
    window.setInterval = function(fn, ms, ...args) {
      const id = _origSetInterval(fn, ms, ...args);
      _intervals.add(id);
      return id;
    };
    window.clearInterval = function(id) {
      _intervals.delete(id);
      return _origClearInterval(id);
    };

    const _origSetTimeout = window.setTimeout.bind(window);
    const _origClearTimeout = window.clearTimeout.bind(window);
    window.setTimeout = function(fn, ms, ...args) {
      let id;
      const wrapped = function(...a) {
        _timeouts.delete(id);
        fn(...a);
      };
      id = _origSetTimeout(wrapped, ms, ...args);
      _timeouts.add(id);
      return id;
    };
    window.clearTimeout = function(id) {
      _timeouts.delete(id);
      return _origClearTimeout(id);
    };

    const _origAddEventListener = window.addEventListener.bind(window);
    const _origRemoveEventListener = window.removeEventListener.bind(window);
    window.addEventListener = function(type, listener, options) {
      _listeners.push({ type, listener, options });
      return _origAddEventListener(type, listener, options);
    };

    window._cleanAll = function() {
      for (const id of _rafs) _origCaf(id);
      _rafs.clear();
      for (const id of _intervals) _origClearInterval(id);
      _intervals.clear();
      for (const id of _timeouts) _origClearTimeout(id);
      _timeouts.clear();
      for (const item of _listeners) {
        try { _origRemoveEventListener(item.type, item.listener, item.options); } catch (e) {}
      }
      _listeners.length = 0;
    };

    window.addEventListener('message', function(ev) {
      if (ev.data && (ev.data.action === 'stop' || ev.data.type === 'nrg_stop')) {
        window._cleanAll();
      }
    });

    // 5. Execute User Code Inside Safe Sandboxed Scope
    try {
      (function() {
        ${safeJs}
      })();
    } catch(err) {
      window.parent.postMessage({ type: 'nrg_graphics_error', message: err.message }, '*');
    }
  <\\/script>
</body>
</html>`;

        this.iframeEl.srcdoc = html;
      }

      stop() {
        if (window.nrgTurtleEngine && window.nrgTurtleEngine.isPlaying) {
          window.nrgTurtleEngine.pause();
        }
        if (this.iframeEl) {
          try {
            if (this.iframeEl.contentWindow) {
              this.iframeEl.contentWindow.postMessage({ action: 'stop' }, '*');
            }
          } catch (e) {}
          if (!this.layerIframe.classList.contains('hidden')) {
            this.iframeEl.srcdoc = '<!DOCTYPE html><html><body style="background:#0b1120;color:#94a3b8;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div>⏸ Execution Stopped</div></body></html>';
          }
        }
        this.setEngine(this.currentEngine, 'Stopped');
        const pulse = document.getElementById('graphicsPulseDot') || document.getElementById('turtlePulseDot');
        if (pulse) pulse.classList.remove('active');
        showToast('Graphics execution stopped');
      }

      restart() {
        if (currentLang === 'javascript') {
          this.runJavaScriptGraphics(currentCode);
        } else if (this.lastResult) {
          this.loadGraphicsResult(this.lastResult);
        } else if (typeof executeRealCode === 'function') {
          executeRealCode();
        }
      }

      clear() {
        if (window.nrgTurtleEngine) {
          window.nrgTurtleEngine.clear();
        }
        if (this.ctx && this.canvas) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.imgEl) this.imgEl.src = '';
        if (this.layerSvg) this.layerSvg.innerHTML = '';
        if (this.iframeEl) this.iframeEl.srcdoc = '';
        if (this.placeholder) this.placeholder.classList.remove('hidden');
        this.hideError();
        this.setEngine('Ready', 'Idle');
        if (this.valTelemetry) this.valTelemetry.textContent = '0 / 0';
        showToast('Graphics viewport cleared');
      }

      exportImage() {
        if (this.layerImg && !this.layerImg.classList.contains('hidden') && this.imgEl && this.imgEl.src) {
          const a = document.createElement('a');
          a.download = `nrg_graphics_${Date.now()}.png`;
          a.href = this.imgEl.src;
          a.click();
          showToast('Image exported as PNG');
          return;
        }

        if (this.canvas) {
          const a = document.createElement('a');
          a.download = `nrg_graphics_${Date.now()}.png`;
          a.href = this.canvas.toDataURL('image/png');
          a.click();
          showToast('Canvas exported as PNG');
        }
      }

      toggleFullscreen() {
        if (!this.viewport) return;
        if (!document.fullscreenElement) {
          this.viewport.requestFullscreen().catch(err => {
            showToast(`Fullscreen error: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      }

      bindEvents() {
        document.getElementById('btnGraphicsRun')?.addEventListener('click', () => {
          if (typeof executeRealCode === 'function') executeRealCode();
        });
        document.getElementById('btnGraphicsStop')?.addEventListener('click', () => this.stop());
        document.getElementById('btnGraphicsRestart')?.addEventListener('click', () => this.restart());
        document.getElementById('btnGraphicsClear')?.addEventListener('click', () => this.clear());
        document.getElementById('btnGraphicsExport')?.addEventListener('click', () => this.exportImage());
        document.getElementById('btnGraphicsFullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btnDismissGraphicsError')?.addEventListener('click', () => this.hideError());

        const resSelect = document.getElementById('graphicsResolutionSelect');
        if (resSelect) {
          resSelect.addEventListener('change', (e) => {
            this.resolution = e.target.value;
            this.resize();
            showToast(`Resolution set to: ${this.resolution}`);
          });
        }

        // Preset Starter Buttons
        document.getElementById('presetTurtleSpiral')?.addEventListener('click', () => loadGraphicsPreset('turtle_spiral'));
        document.getElementById('presetMatplotlib')?.addEventListener('click', () => loadGraphicsPreset('matplotlib'));
        document.getElementById('presetJsCanvas')?.addEventListener('click', () => loadGraphicsPreset('js_canvas'));
        document.getElementById('presetCFramebuffer')?.addEventListener('click', () => loadGraphicsPreset('c_framebuffer'));
        document.getElementById('presetJavaAwt')?.addEventListener('click', () => loadGraphicsPreset('java_awt'));
      }

      bindMessageListener() {
        window.addEventListener('message', (e) => {
          if (!e.data || typeof e.data !== 'object') return;
          if (e.data.type === 'nrg_graphics_error') {
            this.showError(`Runtime Exception: ${e.data.message}${e.data.line ? ` (Line ${e.data.line})` : ''}`);
            showToast(`Graphics Runtime Error: ${e.data.message}`);
          } else if (e.data.type === 'nrg_graphics_log') {
            const termStream = document.getElementById('termLogStream');
            if (termStream) {
              termStream.innerHTML += `<div class="term-output-text">[Graphics Console]: ${escapeHtml(e.data.text)}</div>`;
            }
          }
        });
      }
    }

    // Universal Graphics Starter Presets
    function loadGraphicsPreset(type) {
      if (typeof navigateToSection === 'function') {
        navigateToSection('editor');
      }

      if (type === 'turtle_spiral' || type === 'spiral') {
        switchLanguage('python');
        codeInput.value = `import turtle

t = turtle.Turtle()
t.speed(0)
turtle.bgcolor("#0f172a")

colors = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb7185", "#34d399"]

for i in range(120):
    t.pencolor(colors[i % len(colors)])
    t.pensize(i / 30 + 1)
    t.forward(i * 2)
    t.left(59)

turtle.done()
`;
      } else if (type === 'turtle_star' || type === 'star') {
        switchLanguage('python');
        codeInput.value = `import turtle

t = turtle.Turtle()
t.speed(0)
turtle.bgcolor("#1e1b4b")

t.color("#facc15", "#f59e0b")
t.begin_fill()

for i in range(36):
    t.forward(160)
    t.left(170)

t.end_fill()
t.hideturtle()
turtle.done()
`;
      } else if (type === 'matplotlib') {
        switchLanguage('python');
        codeInput.value = `import matplotlib.pyplot as plt
import numpy as np

# High-resolution trigonometric waveforms
t = np.linspace(0, 2 * np.pi, 300)
y1 = np.sin(t)
y2 = np.cos(t)

fig, ax = plt.subplots(figsize=(6, 4), dpi=120)
ax.plot(t, y1, label="sin(t)", color="#0066ff", lw=2.5)
ax.plot(t, y2, label="cos(t)", color="#8b5cf6", lw=2.5)
ax.set_facecolor("#0f172a")
fig.patch.set_facecolor("#0b1120")
ax.tick_params(colors="#94a3b8")
for spine in ax.spines.values(): spine.set_color("#334155")
ax.set_title("NRG Engine • Matplotlib Waveform", color="#f8fafc", fontsize=12, pad=10)
ax.legend(loc="upper right", facecolor="#1e293b", edgecolor="#334155", labelcolor="#e2e8f0")
ax.grid(True, linestyle="--", alpha=0.3, color="#475569")

plt.show()
`;
      } else if (type === 'js_canvas') {
        switchLanguage('javascript');
        codeInput.value = `// 3D Rotating Polyhedron in Canvas 2D
const ctx = canvas.getContext('2d');
let angleX = 0, angleY = 0;

const vertices = [
    [-90, -90, -90], [90, -90, -90], [90, 90, -90], [-90, 90, -90],
    [-90, -90, 90],  [90, -90, 90],  [90, 90, 90],  [-90, 90, 90]
];

const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
];

function render() {
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;

    angleX += 0.015; angleY += 0.02;
    const radX = angleX, radY = angleY;

    const projected = vertices.map(([x, y, z]) => {
        let x1 = x * Math.cos(radY) + z * Math.sin(radY);
        let z1 = -x * Math.sin(radY) + z * Math.cos(radY);
        let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
        const fov = 400;
        const scale = fov / (fov + z2 + 200);
        return [cx + x1 * scale, cy + y2 * scale];
    });

    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 10;

    edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
    });
    requestAnimationFrame(render);
}
render();
`;
      } else if (type === 'c_framebuffer') {
        switchLanguage('c');
        codeInput.value = `#include <stdio.h>
#include <math.h>

int main() {
    int width = 240, height = 180;
    printf("P3\\n%d %d\\n255\\n", width, height);

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            double cr = (x - width * 0.7) / (width * 0.35);
            double ci = (y - height * 0.5) / (height * 0.35);
            double zr = 0, zi = 0;
            int iter = 0, max_iter = 64;

            while (zr * zr + zi * zi <= 4.0 && iter < max_iter) {
                double temp = zr * zr - zi * zi + cr;
                zi = 2.0 * zr * zi + ci;
                zr = temp;
                iter++;
            }

            if (iter == max_iter) {
                printf("11 17 32  ");
            } else {
                int r = (int)(sin(iter * 0.16) * 127 + 128);
                int g = (int)(sin(iter * 0.16 + 2) * 127 + 128);
                int b = (int)(sin(iter * 0.16 + 4) * 127 + 128);
                printf("%d %d %d  ", r, g, b);
            }
        }
        printf("\\n");
    }
    return 0;
}
`;
      } else if (type === 'java_awt') {
        switchLanguage('java');
        codeInput.value = `import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

public class Main {
    public static void main(String[] args) throws Exception {
        int width = 500, height = 400;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Background
        g.setColor(new Color(11, 17, 32));
        g.fillRect(0, 0, width, height);

        // Mandala Geometric Circles
        int cx = width / 2, cy = height / 2;
        g.setStroke(new BasicStroke(2.0f));

        for (int i = 0; i < 36; i++) {
            double angle = i * Math.PI / 18;
            int x = cx + (int)(Math.cos(angle) * 70);
            int y = cy + (int)(Math.sin(angle) * 70);
            g.setColor(new Color(0, 102, 255, 160));
            g.drawOval(x - 50, y - 50, 100, 100);
        }

        g.setColor(Color.WHITE);
        g.drawString("NRG Engine • Java AWT Graphics2D", 20, 30);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());
        System.out.println("\\n__NRG_GRAPHICS_STREAM_START__{\\"type\\":\\"image\\",\\"engine\\":\\"java-awt\\",\\"format\\":\\"png\\",\\"data\\":\\"data:image/png;base64," + b64 + "\\"}\\n__NRG_GRAPHICS_STREAM_END__");
    }
}
`;
      }

      currentCode = codeInput.value;
      activeLineNumber = 1;
      updateEditorDisplay();
      switchTerminalTab('graphics');
      showToast(`Loaded ${type} graphics template! Click 'Run Graphics' or 'Run Code' to execute.`);
    }

    function loadTurtleTemplate(type) {
      loadGraphicsPreset(type === 'spiral' ? 'turtle_spiral' : (type === 'star' ? 'turtle_star' : type));
    }

    // Initialize Global Graphics & Turtle Engines

export default NRGTurtleEngine;
