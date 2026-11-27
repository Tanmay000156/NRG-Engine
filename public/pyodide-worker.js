/* eslint-disable no-restricted-globals */
/**
 * NRG ENGINE — WEBASSEMBLY SCIENTIFIC PYTHON WORKER (PYODIDE)
 * Runs genuine CPython + NumPy + Matplotlib + Pandas + SciPy + Pillow + SymPy
 * inside an isolated browser Web Worker when the cloud host (e.g. Render Node / Vercel Serverless)
 * lacks compiled scientific wheels. Emits identical graphics streams and JSON payloads.
 */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';
let pyodideInstance = null;
let pyodideBootPromise = null;

async function ensurePyodide(postProgress) {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideBootPromise) return pyodideBootPromise;

  pyodideBootPromise = (async () => {
    if (postProgress) postProgress('Loading WebAssembly Python Scientific Runtime...');
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    const py = await loadPyodide({ indexURL: PYODIDE_CDN });
    pyodideInstance = py;
    return py;
  })();

  try {
    return await pyodideBootPromise;
  } catch (err) {
    pyodideBootPromise = null;
    throw err;
  }
}

const PKG_ALIASES = {
  PIL: 'pillow',
  sklearn: 'scikit-learn',
  cv2: 'opencv-python'
};

self.onmessage = async (ev) => {
  const { id, code, stdin = '', packages = [] } = ev.data || {};
  const startMs = Date.now();
  const stdoutLines = [];
  const stderrLines = [];

  try {
    const py = await ensurePyodide((msg) => {
      self.postMessage({ id, type: 'status', message: msg });
    });

    const reqPkgs = new Set(
      (packages || [])
        .map(p => PKG_ALIASES[p] || p)
        .filter(p => p && p !== 'seaborn')
    );
    if ((packages || []).includes('seaborn') || /\bseaborn\b/.test(code || '')) {
      reqPkgs.add('matplotlib');
      reqPkgs.add('numpy');
      reqPkgs.add('pandas');
    }

    if (reqPkgs.size > 0) {
      self.postMessage({
        id,
        type: 'status',
        message: `Loading scientific packages (${Array.from(reqPkgs).join(', ')})...`
      });
      await py.loadPackage(Array.from(reqPkgs));
    }
    await py.loadPackagesFromImports(code || '');

    py.setStdout({
      batched: (s) => stdoutLines.push(s)
    });
    py.setStderr({
      batched: (s) => stderrLines.push(s)
    });

    const codeB64 = btoa(unescape(encodeURIComponent(code || '')));
    const stdinB64 = btoa(unescape(encodeURIComponent(stdin || '')));

    const runnerScript = `
import sys, os, io, base64, json, traceback

os.environ["MPLBACKEND"] = "Agg"

# Feed pre-supplied stdin cleanly
_stdin_text = base64.b64decode("${stdinB64}").decode("utf-8")
sys.stdin = io.StringIO(_stdin_text)

_EXPORTED_FIGS = set()
_NRG_GFX_ITEMS = []

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
            _NRG_GFX_ITEMS.append({
                "type": "image",
                "format": "png",
                "engine": "matplotlib",
                "title": getattr(fig, "_nrg_title", "Matplotlib Figure"),
                "data": "data:image/png;base64," + b64_img
            })
        plt.close("all")
    except Exception:
        pass

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.close("all")
    def _nrg_show(*args, **kwargs):
        _nrg_export_all_plots()
    plt.show = _nrg_show
except Exception:
    pass

_USER_CODE = base64.b64decode("${codeB64}").decode("utf-8")
_EXEC_ERR = None
_NS = {"__name__": "__main__", "__file__": "main.py"}
try:
    _COMPILED = compile(_USER_CODE, "main.py", "exec")
    exec(_COMPILED, _NS)
    _nrg_export_all_plots()
except Exception:
    _EXEC_ERR = traceback.format_exc()

_RESULT_JSON = json.dumps({
    "error": _EXEC_ERR,
    "graphics": _NRG_GFX_ITEMS[-1] if _NRG_GFX_ITEMS else None
})
`;

    await py.runPythonAsync(runnerScript);
    const metaJson = py.globals.get('_RESULT_JSON');
    const meta = JSON.parse(metaJson || '{}');
    const durationSec = ((Date.now() - startMs) / 1000).toFixed(3);
    const fullStdout = stdoutLines.join('\n');
    const fullStderr = [stderrLines.join('\n'), meta.error || ''].filter(Boolean).join('\n');
    const ok = !meta.error;

    const problems = [];
    if (meta.error) {
      const m = meta.error.match(/File "main\.py", line (\d+)[\s\S]*?\n([A-Za-z0-9_]+Error:[^\n]+|SyntaxError:[^\n]+)/);
      if (m) {
        problems.push({
          file: 'main.py',
          line: parseInt(m[1], 10),
          column: 1,
          severity: 'error',
          message: m[2].trim(),
          raw: meta.error.trim()
        });
      }
    }

    self.postMessage({
      id,
      type: 'result',
      result: {
        success: ok,
        status: { id: ok ? 3 : 11, description: ok ? 'Accepted' : 'Runtime Error (NZEC)' },
        compilation_success: true,
        stdout: fullStdout,
        stderr: fullStderr,
        compile_output: '',
        message: '',
        exit_code: ok ? 0 : 1,
        time: durationSec,
        compile_time_ms: 0,
        execution_time_ms: Date.now() - startMs,
        memory: 0,
        problems,
        language: 'python',
        compiler: 'Python (3.12 WebAssembly)',
        execution_mode: 'Pyodide Isolated WebAssembly Sandbox (Client Scientific Runtime)',
        is_graphics: !!meta.graphics,
        graphics_engine: meta.graphics ? meta.graphics.engine : null,
        graphics_output: meta.graphics || null
      }
    });
  } catch (err) {
    self.postMessage({
      id,
      type: 'result',
      result: {
        success: false,
        status: { id: 11, description: 'Runtime Error' },
        compilation_success: true,
        stdout: stdoutLines.join('\n'),
        stderr: err?.message || String(err),
        compile_output: '',
        exit_code: 1,
        time: ((Date.now() - startMs) / 1000).toFixed(3),
        problems: [],
        language: 'python',
        compiler: 'Python (3.12 WebAssembly)',
        execution_mode: 'Pyodide WebAssembly Worker'
      }
    });
  }
};
