/**
 * NRG ENGINE — LOCAL RUNTIME & SCIENTIFIC PYTHON EXECUTION HELPER
 * Resolves local compilers/interpreters and executes code inside isolated temp directories
 * with strict 10s compile / 30s execution timeouts. Used automatically when Python scripts
 * import scientific packages (matplotlib, numpy, pandas, seaborn, cv2, scipy, etc.) not
 * installed on Judge0 CE, or as a clean offline fallback when Judge0 CE is unreachable.
 */

const { execFileSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  preprocessCppCompat,
  buildCompileArgs
} = require('./_cpp_compat');

let cachedPythonCmd = undefined;
const cachedModuleSupport = new Map();
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024; // 5 MB safety cap

const SCIENTIFIC_PYTHON_MODULES = new Set([
  'numpy', 'matplotlib', 'pandas', 'seaborn', 'scipy', 'sklearn',
  'cv2', 'PIL', 'sympy', 'statsmodels', 'plotly', 'networkx',
  'torch', 'tensorflow', 'keras', 'requests', 'bs4', 'pygame', 'openpyxl'
]);

/**
 * Resolves a working Python 3 executable across Windows & Linux environments.
 */
function resolvePythonExecutable() {
  if (cachedPythonCmd !== undefined) return cachedPythonCmd;

  const candidates = process.platform === 'win32'
    ? ['python', 'python3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      const out = execFileSync(cmd, ['--version'], {
        encoding: 'utf8',
        timeout: 3000,
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
      if (/Python\s+3\./i.test(out)) {
        cachedPythonCmd = cmd;
        return cmd;
      }
    } catch (_) {}
  }

  cachedPythonCmd = null;
  return null;
}

/**
 * Extracts top-level Python imported package names from source code.
 */
function extractPythonImports(sourceCode) {
  if (typeof sourceCode !== 'string') return [];
  const mods = new Set();
  const importRe = /^[ \t]*import[ \t]+([A-Za-z0-9_., \t]+?)(?:#.*)?$/gm;
  const fromRe = /^[ \t]*from[ \t]+([A-Za-z0-9_]+)(?:\.[A-Za-z0-9_]+)*[ \t]+import\b/gm;

  let m;
  while ((m = importRe.exec(sourceCode)) !== null) {
    for (const part of m[1].split(',')) {
      const rootMod = part.trim().split(/\s+as\s+/)[0].split('.')[0].trim();
      if (rootMod) mods.add(rootMod);
    }
  }
  while ((m = fromRe.exec(sourceCode)) !== null) {
    if (m[1]) mods.add(m[1].trim());
  }
  return Array.from(mods);
}

/**
 * Returns the scientific/third-party modules referenced in Python code that Judge0 CE lacks.
 */
function getScientificModulesUsed(sourceCode) {
  return extractPythonImports(sourceCode).filter(m => SCIENTIFIC_PYTHON_MODULES.has(m));
}

/**
 * Checks whether local Python can import all specified modules (cached per module).
 */
function hasLocalPythonModules(modules) {
  const pythonExe = resolvePythonExecutable();
  if (!pythonExe) return false;

  for (const mod of modules) {
    if (!/^[A-Za-z0-9_]+$/.test(mod)) return false;
    if (cachedModuleSupport.has(mod)) {
      if (!cachedModuleSupport.get(mod)) return false;
      continue;
    }
    try {
      execFileSync(pythonExe, ['-c', `import ${mod}`], {
        encoding: 'utf8',
        timeout: 8000,
        env: { ...process.env, MPLBACKEND: 'Agg' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      cachedModuleSupport.set(mod, true);
    } catch (_) {
      cachedModuleSupport.set(mod, false);
      return false;
    }
  }
  return true;
}

/**
 * Checks whether a local compiler/runtime command exists for the given language.
 */
function hasLocalCommand(cmd) {
  try {
    execFileSync(cmd, ['--version'], {
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return true;
  } catch (_) {
    return false;
  }
}

function killProcessTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${child.pid} /T /F`, () => {});
    } else {
      child.kill('SIGKILL');
    }
  } catch (_) {}
}

/**
 * Executes a spawned child process with stdin, buffered stdio capture, and hard wall timeout.
 */
function runSpawnedProcess(cmd, args, { cwd, env, stdin, timeoutMs }) {
  return new Promise((resolve) => {
    const startMs = Date.now();
    let timedOut = false;
    let settled = false;
    const stdoutChunks = [];
    const stderrChunks = [];
    let outBytes = 0;

    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      timedOut = true;
      killProcessTree(child);
    }, timeoutMs);

    const pushChunk = (arr, chunk) => {
      if (outBytes >= MAX_OUTPUT_BYTES) return;
      const slice = chunk.length + outBytes > MAX_OUTPUT_BYTES
        ? chunk.subarray(0, MAX_OUTPUT_BYTES - outBytes)
        : chunk;
      outBytes += slice.length;
      arr.push(slice);
    };

    child.stdout.on('data', (c) => pushChunk(stdoutChunks, c));
    child.stderr.on('data', (c) => pushChunk(stderrChunks, c));

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        timedOut: false,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: err.message,
        durationSec: ((Date.now() - startMs) / 1000).toFixed(3)
      });
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode: timedOut ? 124 : (code !== null ? code : 1),
        timedOut,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        durationSec: ((Date.now() - startMs) / 1000).toFixed(3)
      });
    });

    try {
      if (stdin) child.stdin.write(stdin);
      child.stdin.end();
    } catch (_) {}
  });
}

/**
 * Executes C, C++, Python, or JavaScript locally in a clean sandboxed temp directory
 * honoring the 10s compile timeout and 30s overall execution timeout.
 * Returns a Judge0-compatible result object { status, stdout, stderr, compile_output, exit_code, time, memory }.
 */
async function executeLocal({ language, source_code, stdin }) {
  const lang = (language || '').toLowerCase().trim();
  const overallStart = Date.now();
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrg_exec_'));

  try {
    let cmd = null;
    let args = [];
    const env = {
      ...process.env,
      MPLBACKEND: 'Agg',
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    };

    if (lang === 'python') {
      const pyExe = resolvePythonExecutable();
      if (!pyExe) {
        return null;
      }
      const srcPath = path.join(sessionDir, 'main.py');
      fs.writeFileSync(srcPath, source_code, 'utf8');
      cmd = pyExe;
      args = ['-u', srcPath];

    } else if (lang === 'javascript') {
      if (!hasLocalCommand('node')) return null;
      const srcPath = path.join(sessionDir, 'script.js');
      fs.writeFileSync(srcPath, source_code, 'utf8');
      cmd = 'node';
      args = [srcPath];

    } else if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const compiler = isCpp ? 'g++' : 'gcc';
      if (!hasLocalCommand(compiler)) return null;

      const filename = isCpp ? 'main.cpp' : 'main.c';
      const srcPath = path.join(sessionDir, filename);
      const exePath = path.join(sessionDir, process.platform === 'win32' ? 'app.exe' : 'app');
      const compatCode = preprocessCppCompat(source_code, lang, filename);
      fs.writeFileSync(srcPath, compatCode, 'utf8');

      try {
        execFileSync(compiler, buildCompileArgs(isCpp, srcPath, exePath, '-O0'), {
          encoding: 'utf8',
          cwd: sessionDir,
          timeout: COMPILE_TIMEOUT_MS,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (compErr) {
        const timedOutCompile = compErr.killed || compErr.code === 'ETIMEDOUT';
        const compText = timedOutCompile
          ? `Compilation timed out (10s compilation limit exceeded).\n${(compErr.stderr || '').toString()}`
          : (compErr.stderr || compErr.stdout || compErr.message || 'Compilation failed').toString();
        return {
          status: { id: 6, description: 'Compilation Error' },
          stdout: '',
          stderr: '',
          compile_output: compText,
          message: timedOutCompile ? 'Compilation Timeout (10s)' : 'Compilation Error',
          exit_code: 1,
          time: ((Date.now() - overallStart) / 1000).toFixed(3),
          memory: 0
        };
      }
      cmd = exePath;
      args = [];
    } else {
      return null;
    }

    const remainingBudget = Math.max(1000, MAX_EXECUTION_TIMEOUT_MS - (Date.now() - overallStart));
    const runRes = await runSpawnedProcess(cmd, args, {
      cwd: sessionDir,
      env,
      stdin: stdin || '',
      timeoutMs: remainingBudget
    });

    if (runRes.timedOut) {
      return {
        status: { id: 5, description: 'Time Limit Exceeded' },
        stdout: runRes.stdout,
        stderr: (runRes.stderr ? runRes.stderr + '\n' : '') + 'Execution timed out (30s maximum overall execution timeout exceeded).',
        compile_output: '',
        message: 'Time Limit Exceeded (30s overall limit)',
        exit_code: 124,
        time: ((Date.now() - overallStart) / 1000).toFixed(3),
        memory: 0
      };
    }

    const ok = runRes.exitCode === 0;
    return {
      status: { id: ok ? 3 : 11, description: ok ? 'Accepted' : 'Runtime Error (NZEC)' },
      stdout: runRes.stdout,
      stderr: runRes.stderr,
      compile_output: '',
      message: '',
      exit_code: runRes.exitCode,
      time: runRes.durationSec,
      memory: 0
    };
  } finally {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

module.exports = {
  resolvePythonExecutable,
  getScientificModulesUsed,
  hasLocalPythonModules,
  hasLocalCommand,
  executeLocal
};
