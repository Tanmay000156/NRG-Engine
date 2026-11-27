/**
 * NRG ENGINE — ISOLATED LOCAL SANDBOX RUNNER & TOOLCHAIN PROBE
 * Executes code in isolated per-run temp directories with stripped environment variables
 * (zero host secret leakage), bounded C/C++ compile caching, OS resource limits,
 * hard 10s compile / 30s overall timeouts, and live toolchain probing.
 */

const { execFileSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EXECUTION_LIMITS } = require('./_config');
const { buildSandboxedEnv } = require('./_security');
const {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  preprocessCppCompat,
  buildCompileArgs
} = require('./_cpp_compat');
const {
  makeCompileKey,
  getCachedBinary,
  putCachedBinary
} = require('./_compile_cache');

let cachedPythonCmd = undefined;
const cachedModuleSupport = new Map();
const cachedCmdAvailability = new Map();
const MAX_OUTPUT_BYTES = EXECUTION_LIMITS.MAX_OUTPUT_BYTES;

const SCIENTIFIC_PYTHON_MODULES = new Set([
  'numpy', 'matplotlib', 'pandas', 'seaborn', 'scipy', 'sklearn',
  'cv2', 'PIL', 'sympy', 'statsmodels', 'plotly', 'networkx',
  'torch', 'tensorflow', 'keras', 'requests', 'bs4', 'pygame', 'openpyxl'
]);

const PYODIDE_SUPPORTED_MODULES = new Set([
  'numpy', 'matplotlib', 'pandas', 'scipy', 'PIL', 'pillow',
  'sympy', 'scikit-learn', 'sklearn', 'seaborn', 'networkx', 'statsmodels'
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

function getScientificModulesUsed(sourceCode) {
  return extractPythonImports(sourceCode).filter(m => SCIENTIFIC_PYTHON_MODULES.has(m));
}

function areModulesPyodideCompatible(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return false;
  return modules.every(m => PYODIDE_SUPPORTED_MODULES.has(m));
}

/**
 * Checks whether host Python can import all specified modules (using sanitized env).
 */
function hasLocalPythonModules(modules) {
  const pythonExe = resolvePythonExecutable();
  if (!pythonExe) return false;
  const safeEnv = buildSandboxedEnv(os.tmpdir());

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
        env: safeEnv,
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

function hasLocalCommand(cmd, versionArg = '--version') {
  const cacheKey = `${cmd}:${versionArg}`;
  if (cachedCmdAvailability.has(cacheKey)) return cachedCmdAvailability.get(cacheKey);
  let found = false;
  try {
    execFileSync(cmd, [versionArg], {
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    found = true;
  } catch (_) {}
  cachedCmdAvailability.set(cacheKey, found);
  return found;
}

function killProcessTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${child.pid} /T /F`, () => {});
    } else {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (_) {
        child.kill('SIGKILL');
      }
    }
  } catch (_) {}
}

/**
 * Wraps execution command on POSIX hosts with ulimit CPU, file-size, and FD caps.
 */
function applyPosixResourceLimits(cmd, args) {
  if (process.platform === 'win32') {
    return { cmd, args, detached: false };
  }
  const cpuSec = Math.max(5, Math.ceil(MAX_EXECUTION_TIMEOUT_MS / 1000));
  const wrapper = `ulimit -t ${cpuSec} -f 16384 -n 128 2>/dev/null || true; exec "$@"`;
  return {
    cmd: '/bin/sh',
    args: ['-c', wrapper, '_', cmd, ...args],
    detached: true
  };
}

/**
 * Executes a spawned child process cleanly with isolated env, bounded output capture, and wall timeout.
 */
function runSpawnedProcess(cmd, args, { cwd, env, stdin, timeoutMs }) {
  return new Promise((resolve) => {
    const startMs = Date.now();
    let timedOut = false;
    let settled = false;
    const stdoutChunks = [];
    const stderrChunks = [];
    let outBytes = 0;
    let truncated = false;

    const launch = applyPosixResourceLimits(cmd, args);
    const child = spawn(launch.cmd, launch.args, {
      cwd,
      env,
      detached: launch.detached,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      timedOut = true;
      killProcessTree(child);
    }, timeoutMs);

    const pushChunk = (arr, chunk) => {
      if (outBytes >= MAX_OUTPUT_BYTES) {
        truncated = true;
        return;
      }
      const slice = chunk.length + outBytes > MAX_OUTPUT_BYTES
        ? chunk.subarray(0, MAX_OUTPUT_BYTES - outBytes)
        : chunk;
      outBytes += slice.length;
      if (slice.length < chunk.length) truncated = true;
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
        durationMs: Date.now() - startMs,
        durationSec: ((Date.now() - startMs) / 1000).toFixed(3)
      });
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      let stdoutStr = Buffer.concat(stdoutChunks).toString('utf8');
      if (truncated) stdoutStr += '\n[NRG Sandbox: Output truncated at 5 MB cap]\n';
      resolve({
        exitCode: timedOut ? 124 : (code !== null ? code : 1),
        timedOut,
        stdout: stdoutStr,
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        durationMs: Date.now() - startMs,
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
 * Executes C, C++, Python, or JavaScript locally inside a private sandboxed temp directory
 * honoring the 10s compile timeout, 30s overall execution timeout, compile caching, and zero-leak env.
 */
async function executeLocal({ language, source_code, stdin }) {
  const lang = (language || '').toLowerCase().trim();
  const overallStart = Date.now();
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrg_exec_'));
  let compileMs = 0;
  let cacheHit = false;

  try {
    if (process.platform !== 'win32') {
      try { fs.chmodSync(sessionDir, 0o700); } catch (_) {}
    }
    try { fs.mkdirSync(path.join(sessionDir, '.mplconfig'), { recursive: true }); } catch (_) {}

    const env = buildSandboxedEnv(sessionDir);
    let cmd = null;
    let args = [];

    if (lang === 'python') {
      const pyExe = resolvePythonExecutable();
      if (!pyExe) return null;
      const srcPath = path.join(sessionDir, 'main.py');
      fs.writeFileSync(srcPath, source_code, 'utf8');
      cmd = pyExe;
      args = ['-I', '-u', srcPath]; // -I isolates Python from user site/env tampering where clean, fallback safe on imports?
      // Note: -I omits user-site packages on Windows when numpy/matplotlib are installed in user site-packages! Use -s/no -I so user pip packages work.
      args = ['-u', srcPath];

    } else if (lang === 'javascript') {
      if (!hasLocalCommand('node')) return null;
      const srcPath = path.join(sessionDir, 'script.js');
      fs.writeFileSync(srcPath, source_code, 'utf8');
      cmd = 'node';
      args = ['--max-old-space-size=128', srcPath];

    } else if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const compiler = isCpp ? 'g++' : 'gcc';
      if (!hasLocalCommand(compiler)) return null;

      const filename = isCpp ? 'main.cpp' : 'main.c';
      const srcPath = path.join(sessionDir, filename);
      const exePath = path.join(sessionDir, process.platform === 'win32' ? 'app.exe' : 'app');
      const compatCode = preprocessCppCompat(source_code, lang, filename);
      const compileArgs = buildCompileArgs(isCpp, srcPath, exePath, '-O0');
      const cacheKey = makeCompileKey(lang, compatCode, isCpp ? '-O0 -std=c++17 -lm' : '-O0 -lm');

      const cached = getCachedBinary(cacheKey, exePath);
      if (cached) {
        cacheHit = true;
        compileMs = 1;
      } else {
        fs.writeFileSync(srcPath, compatCode, 'utf8');
        const cStart = Date.now();
        try {
          execFileSync(compiler, compileArgs, {
            encoding: 'utf8',
            cwd: sessionDir,
            env,
            timeout: COMPILE_TIMEOUT_MS,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          compileMs = Date.now() - cStart;
          putCachedBinary(cacheKey, exePath, compileMs);
        } catch (compErr) {
          compileMs = Date.now() - cStart;
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
            compile_time_ms: compileMs,
            execution_time_ms: 0,
            cache_hit: false,
            memory: 0
          };
        }
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
        compile_time_ms: compileMs,
        execution_time_ms: runRes.durationMs,
        cache_hit: cacheHit,
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
      compile_time_ms: compileMs,
      execution_time_ms: runRes.durationMs,
      cache_hit: cacheHit,
      memory: 0
    };
  } finally {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

/**
 * Probes host toolchains and scientific Python packages cleanly for diagnostics.
 */
function probeHostToolchains() {
  const pyExe = resolvePythonExecutable();
  const compilers = {
    node: hasLocalCommand('node'),
    python: !!pyExe,
    gcc: hasLocalCommand('gcc'),
    gpp: hasLocalCommand('g++'),
    javac: hasLocalCommand('javac', '-version'),
    dotnet: hasLocalCommand('dotnet'),
    go: hasLocalCommand('go', 'version'),
    rustc: hasLocalCommand('rustc'),
    php: hasLocalCommand('php'),
    kotlinc: hasLocalCommand('kotlinc', '-version')
  };
  const sciList = ['numpy', 'matplotlib', 'pandas', 'scipy', 'seaborn', 'PIL', 'sympy'];
  const pythonPackages = {};
  for (const mod of sciList) {
    pythonPackages[mod] = pyExe ? hasLocalPythonModules([mod]) : false;
  }
  return { compilers, pythonPackages, pythonExecutable: pyExe };
}

module.exports = {
  resolvePythonExecutable,
  getScientificModulesUsed,
  areModulesPyodideCompatible,
  hasLocalPythonModules,
  hasLocalCommand,
  executeLocal,
  probeHostToolchains
};
