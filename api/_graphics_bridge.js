/**
 * NRG ENGINE — UNIVERSAL GRAPHICS EXECUTION BRIDGE
 * Centralized graphics adapter manager supporting:
 * - Python: Turtle, Matplotlib, Seaborn, OpenCV, Pygame
 * - C / C++: PPM Framebuffers, SVG, Computer Graphics Algorithms
 * - Java: AWT / Swing BufferedImage Graphics2D
 * - JavaScript: Canvas 2D, WebGL, Three.js, p5.js, D3.js (Browser-accelerated)
 */

const { generatePythonTurtleRunner } = require('./_turtle_bridge');

// Base64 helper
function b64encode(str) {
  return Buffer.from(str || '', 'utf-8').toString('base64');
}

/**
 * Detect if source code contains graphics API signatures
 */
function detectGraphics(language, code) {
  if (!code || typeof code !== 'string') return { isGraphics: false };
  const lang = (language || '').toLowerCase().trim();
  const trimmed = code.trim();

  if (lang === 'python') {
    // 1. Python Turtle
    if (/(?:^|\n)\s*(?:import\s+turtle|from\s+turtle\s+import)/m.test(code) || code.includes('turtle.')) {
      return { isGraphics: true, engine: 'python-turtle', label: 'Python Turtle' };
    }
    // 2. Python Matplotlib / Seaborn
    if (/(?:^|\n)\s*(?:import\s+matplotlib|import\s+seaborn|from\s+matplotlib|from\s+seaborn)/m.test(code) ||
        code.includes('plt.') || code.includes('sns.')) {
      return { isGraphics: true, engine: 'python-matplotlib', label: 'Python Matplotlib / Data Viz' };
    }
    // 3. Python OpenCV
    if (/(?:^|\n)\s*(?:import\s+cv2|from\s+cv2\s+import)/m.test(code) || code.includes('cv2.')) {
      return { isGraphics: true, engine: 'python-opencv', label: 'Python OpenCV Computer Vision' };
    }
    // 4. Python Pygame
    if (/(?:^|\n)\s*(?:import\s+pygame|from\s+pygame\s+import)/m.test(code) || code.includes('pygame.')) {
      return { isGraphics: true, engine: 'python-pygame', label: 'Python Pygame' };
    }
  }

  if (lang === 'javascript') {
    // Canvas / Three.js / p5.js / WebGL / D3
    if (code.includes('getContext(') || code.includes('createCanvas(') ||
        code.includes('THREE.') || code.includes('d3.') ||
        code.includes('requestAnimationFrame') || code.includes('webgl') ||
        /(?:^|\n)\s*(?:function\s+draw\s*\(|function\s+setup\s*\()/m.test(code)) {
      return { isGraphics: true, engine: 'javascript-canvas', label: 'JavaScript Canvas / WebGL' };
    }
  }

  if (lang === 'c' || lang === 'cpp') {
    // PPM / Netpbm framebuffer, BMP, or SVG generation
    if (code.includes('\"P3\\n\"') || code.includes('\"P6\\n\"') || code.includes('P3') || code.includes('P6') ||
        code.includes('<svg') || code.includes('draw_pixel') || code.includes('framebuffer') ||
        code.includes('ppm') || code.includes('SDL') || code.includes('raylib') || code.includes('SFML') ||
        code.includes('\"BM\"') || code.includes('0x4D42')) {
      return { isGraphics: true, engine: 'c-framebuffer', label: 'C/C++ Framebuffer Graphics' };
    }
  }

  if (lang === 'java') {
    // Java AWT / Swing BufferedImage Graphics2D
    if (code.includes('Graphics2D') || code.includes('BufferedImage') ||
        code.includes('java.awt') || code.includes('javax.swing') ||
        code.includes('paint(') || code.includes('paintComponent(')) {
      return { isGraphics: true, engine: 'java-awt', label: 'Java AWT / Swing 2D' };
    }
  }

  // Universal SVG detection in any language
  if (code.includes('<svg') && code.includes('</svg>')) {
    return { isGraphics: true, engine: 'universal-svg', label: 'Vector SVG Graphics' };
  }

  return { isGraphics: false };
}

/**
 * Prepare and transform code for headless execution with graphics streaming
 */
function prepareExecutionCode(language, sourceCode) {
  const lang = (language || '').toLowerCase().trim();
  const detection = detectGraphics(lang, sourceCode);

  if (!detection.isGraphics) {
    return { code: sourceCode, engine: null };
  }

  // A. Python Turtle
  if (detection.engine === 'python-turtle') {
    const b64 = b64encode(sourceCode);
    return {
      code: generatePythonTurtleRunner(b64),
      engine: 'python-turtle'
    };
  }

  // B. Python Matplotlib / Seaborn
  if (detection.engine === 'python-matplotlib') {
    const b64 = b64encode(sourceCode);
    const wrapper = `
import sys, os, io, base64, atexit, json

# Force headless Agg backend before any Matplotlib imports
os.environ["MPLBACKEND"] = "Agg"
try:
    import matplotlib
    matplotlib.use("Agg")
except ImportError:
    pass

_EXPORTED_FIGS = set()

def _nrg_export_all_plots():
    try:
        import matplotlib.pyplot as plt
        fignums = plt.get_fignums()
        figs = [plt.figure(i) for i in fignums if i not in _EXPORTED_FIGS]
        if not figs:
            gcf = plt.gcf()
            if gcf and gcf.get_axes() and id(gcf) not in _EXPORTED_FIGS:
                figs = [gcf]
        for fig in figs:
            _EXPORTED_FIGS.add(id(fig))
            buf = io.BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight", dpi=130)
            buf.seek(0)
            b64_img = base64.b64encode(buf.read()).decode("ascii")
            payload = {
                "type": "image",
                "format": "png",
                "engine": "matplotlib",
                "title": getattr(fig, "_nrg_title", "Matplotlib Figure"),
                "data": "data:image/png;base64," + b64_img
            }
            print("\\n__NRG_GRAPHICS_STREAM_START__" + json.dumps(payload) + "__NRG_GRAPHICS_STREAM_END__")
    except Exception:
        pass

try:
    import matplotlib.pyplot as plt
    _orig_show = plt.show
    def _nrg_show(*args, **kwargs):
        _nrg_export_all_plots()
    plt.show = _nrg_show
except Exception:
    pass

atexit.register(_nrg_export_all_plots)

# Execute user code safely preserving file 'main.py' and line numbers
_USER_CODE = base64.b64decode("${b64}").decode("utf-8")
_COMPILED = compile(_USER_CODE, "main.py", "exec")
exec(_COMPILED, globals())
`;
    return { code: wrapper, engine: 'python-matplotlib' };
  }

  // C. Python OpenCV
  if (detection.engine === 'python-opencv') {
    const b64 = b64encode(sourceCode);
    const wrapper = `
import sys, os, io, base64, json

try:
    import cv2
    _orig_imshow = getattr(cv2, "imshow", None)
    def _nrg_imshow(winname, mat):
        try:
            success, encoded = cv2.imencode(".png", mat)
            if success:
                b64_img = base64.b64encode(encoded.tobytes()).decode("ascii")
                payload = {
                    "type": "image",
                    "format": "png",
                    "engine": "opencv",
                    "title": str(winname),
                    "data": "data:image/png;base64," + b64_img
                }
                print("\\n__NRG_GRAPHICS_STREAM_START__" + json.dumps(payload) + "__NRG_GRAPHICS_STREAM_END__")
        except Exception as e:
            pass
    cv2.imshow = _nrg_imshow
    cv2.waitKey = lambda *args, **kwargs: 0
    cv2.destroyAllWindows = lambda *args, **kwargs: None
except ImportError:
    pass

_USER_CODE = base64.b64decode("${b64}").decode("utf-8")
_COMPILED = compile(_USER_CODE, "main.py", "exec")
exec(_COMPILED, globals())
`;
    return { code: wrapper, engine: 'python-opencv' };
  }

  // D. Python Pygame
  if (detection.engine === 'python-pygame') {
    const b64 = b64encode(sourceCode);
    const wrapper = `
import sys, os, io, base64, json, atexit

os.environ["SDL_VIDEODRIVER"] = "dummy"

try:
    import pygame
    _orig_init = pygame.init
    _orig_flip = None
    _orig_update = None

    def _export_surface(surf, title="Pygame Surface"):
        try:
            buf = io.BytesIO()
            pygame.image.save(surf, buf)
            buf.seek(0)
            b64_img = base64.b64encode(buf.read()).decode("ascii")
            payload = {
                "type": "image",
                "format": "png",
                "engine": "pygame",
                "title": title,
                "data": "data:image/png;base64," + b64_img
            }
            print("\\n__NRG_GRAPHICS_STREAM_START__" + json.dumps(payload) + "__NRG_GRAPHICS_STREAM_END__")
        except Exception:
            pass

    def _nrg_flip():
        surf = pygame.display.get_surface()
        if surf:
            _export_surface(surf)

    def _nrg_update(*args, **kwargs):
        surf = pygame.display.get_surface()
        if surf:
            _export_surface(surf)

    _orig_flip = pygame.display.flip
    _orig_update = pygame.display.update
    pygame.display.flip = _nrg_flip
    pygame.display.update = _nrg_update
except ImportError:
    pass

_USER_CODE = base64.b64decode("${b64}").decode("utf-8")
_COMPILED = compile(_USER_CODE, "main.py", "exec")
exec(_COMPILED, globals())
`;
    return { code: wrapper, engine: 'python-pygame' };
  }

  // E. Java AWT / Swing Component Offscreen Harness
  if (detection.engine === 'java-awt') {
    if ((sourceCode.includes('paintComponent') || sourceCode.includes('extends JPanel') || sourceCode.includes('extends Canvas') || sourceCode.includes('extends Component')) && !sourceCode.includes('public static void main')) {
      const classMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/) || sourceCode.match(/class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const lastBraceIndex = sourceCode.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        const injectedHarness = `
    public static void main(String[] args) {
        try {
            System.setProperty("java.awt.headless", "true");
            int w = 640, h = 480;
            java.awt.image.BufferedImage _img = new java.awt.image.BufferedImage(w, h, java.awt.image.BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D _g2 = _img.createGraphics();
            _g2.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
            ${className} _comp = new ${className}();
            _comp.setSize(w, h);
            _comp.paint(_g2);
            _g2.dispose();
            java.io.ByteArrayOutputStream _baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(_img, "png", _baos);
            String _b64 = java.util.Base64.getEncoder().encodeToString(_baos.toByteArray());
            System.out.println("\\n__NRG_GRAPHICS_STREAM_START__{\\"type\\":\\"image\\",\\"engine\\":\\"java-awt\\",\\"format\\":\\"png\\",\\"title\\":\\"${className} (AWT/Swing)\\",\\"data\\":\\"data:image/png;base64," + _b64 + "\\"}\\n__NRG_GRAPHICS_STREAM_END__\\n");
        } catch (Throwable _t) {
            _t.printStackTrace();
        }
    }
`;
        const wrappedCode = sourceCode.slice(0, lastBraceIndex) + injectedHarness + sourceCode.slice(lastBraceIndex);
        return { code: wrappedCode, engine: 'java-awt' };
      }
    }
  }

  // Default: pass original code
  return { code: sourceCode, engine: detection.engine };
}

/**
 * Parse stdout for graphics command streams, images, SVG, or Netpbm PPM buffers
 */
function extractGraphicsOutput(rawStdout) {
  let stdout = rawStdout || '';
  let graphicsOutput = null;

  // 1. Structured NRG Graphics Stream
  if (stdout.includes('__NRG_GRAPHICS_STREAM_START__')) {
    const match = stdout.match(/__NRG_GRAPHICS_STREAM_START__([\s\S]*?)__NRG_GRAPHICS_STREAM_END__/);
    if (match) {
      try {
        graphicsOutput = JSON.parse(match[1].trim());
        stdout = stdout.replace(/__NRG_GRAPHICS_STREAM_START__[\s\S]*?__NRG_GRAPHICS_STREAM_END__/, '').trim();
      } catch (e) {
        console.error('Failed to parse graphics stream:', e);
      }
    }
  }

  // 2. Structured NRG Turtle Stream (Backward compatibility & unified handling)
  if (stdout.includes('__NRG_TURTLE_STREAM_START__')) {
    const match = stdout.match(/__NRG_TURTLE_STREAM_START__([\s\S]*?)__NRG_TURTLE_STREAM_END__/);
    if (match) {
      try {
        const turtleCmds = JSON.parse(match[1].trim());
        graphicsOutput = {
          type: 'turtle',
          engine: 'python-turtle',
          commands: turtleCmds
        };
        stdout = stdout.replace(/__NRG_TURTLE_STREAM_START__[\s\S]*?__NRG_TURTLE_STREAM_END__/, '').trim();
      } catch (e) {
        console.error('Failed to parse turtle stream:', e);
      }
    }
  }

  // 3. Raw PPM Framebuffer (C / C++ / Unix graphics standard)
  if (!graphicsOutput && /(?:^|\n)P[36]\s/m.test(stdout)) {
    const ppmMatch = stdout.match(/(?:^|\n)(P[36]\s[\s\S]*)/);
    if (ppmMatch) {
      const candidate = ppmMatch[1].trim();
      const cleanTokens = candidate.replace(/#[^\r\n]*/g, '').trim().split(/\s+/);
      if (cleanTokens.length >= 4 && !isNaN(parseInt(cleanTokens[1], 10)) && !isNaN(parseInt(cleanTokens[2], 10))) {
        graphicsOutput = {
          type: 'ppm',
          engine: 'c-framebuffer',
          title: 'C/C++ Framebuffer Render',
          data: candidate
        };
        stdout = stdout.replace(ppmMatch[0], '').trim();
        const statusNote = `[Graphical Framebuffer: PPM image (${cleanTokens[1]}×${cleanTokens[2]}) captured and rendered in Graphics tab]`;
        stdout = stdout ? `${stdout}\n${statusNote}` : statusNote;
      }
    }
  }

  // 4. Raw BMP output
  if (!graphicsOutput && (stdout.startsWith('BM') || /\nBM/.test(stdout))) {
    const bmpMatch = stdout.match(/(?:^|\n)(BM[\s\S]*)/);
    if (bmpMatch) {
      const bmpRaw = bmpMatch[1];
      graphicsOutput = {
        type: 'image',
        engine: 'c-bmp',
        title: 'C/C++ BMP Framebuffer',
        data: 'data:image/bmp;base64,' + Buffer.from(bmpRaw, 'binary').toString('base64')
      };
      stdout = stdout.replace(bmpMatch[0], '').trim();
      const statusNote = '[Graphical Framebuffer: BMP image captured and rendered in Graphics tab]';
      stdout = stdout ? `${stdout}\n${statusNote}` : statusNote;
    }
  }

  // 5. Raw SVG Output
  if (!graphicsOutput && (stdout.includes('<svg') && stdout.includes('</svg>'))) {
    const svgMatch = stdout.match(/(<svg[\s\S]*?<\/svg>)/i);
    if (svgMatch) {
      graphicsOutput = {
        type: 'svg',
        engine: 'universal-svg',
        title: 'Vector SVG Output',
        data: svgMatch[1].trim()
      };
      stdout = stdout.replace(svgMatch[0], '').trim();
    }
  }

  return {
    stdout,
    graphicsOutput
  };
}

module.exports = {
  detectGraphics,
  prepareExecutionCode,
  extractGraphicsOutput
};
