/**
 * NRG ENGINE — COMPILER CORE & EXECUTION ORCHESTRATOR
 * Shared compiler engine across local Node server, Render Docker/Node services, and Vercel Serverless.
 * Integrates Judge0 CE sandbox, local sandboxed execution, compile cache, C/C++ <conio.h> compat,
 * Universal Graphics Bridge, and automatic cloud scientific runtime signaling (Pyodide fallback).
 */

const { generatePythonTurtleRunner } = require('./_turtle_bridge');
const { detectGraphics, prepareExecutionCode, extractGraphicsOutput } = require('./_graphics_bridge');
const { EXECUTION_LIMITS } = require('./_config');
const { checkStaticResourceHazards } = require('./_security');
const { recordExecutionMetric } = require('./_store');
const {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  preprocessCppCompat
} = require('./_cpp_compat');
const {
  getScientificModulesUsed,
  areModulesPyodideCompatible,
  hasLocalPythonModules,
  executeLocal
} = require('./_local_runner');

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

// Supported 10 Programming Languages & Judge0 IDs
const LANGUAGE_REGISTRY = {
  c: {
    id: 103,
    fallbackId: 50,
    name: 'C (GCC 14.1.0)',
    compiler: 'gcc',
    file: 'main.c'
  },
  cpp: {
    id: 105,
    fallbackId: 54,
    name: 'C++ (GCC 14.1.0)',
    compiler: 'g++',
    file: 'main.cpp'
  },
  java: {
    id: 91,
    fallbackId: 62,
    name: 'Java (JDK 17.0.6)',
    compiler: 'javac',
    file: 'Main.java'
  },
  python: {
    id: 100,
    fallbackId: 71,
    name: 'Python (3.12.5)',
    compiler: 'python3',
    file: 'main.py'
  },
  javascript: {
    id: 102,
    fallbackId: 63,
    name: 'JavaScript (Node.js 22.08)',
    compiler: 'node',
    file: 'script.js'
  },
  csharp: {
    id: 51,
    fallbackId: 51,
    name: 'C# (Mono 6.6.0)',
    compiler: 'mcs / mono',
    file: 'Program.cs'
  },
  go: {
    id: 107,
    fallbackId: 60,
    name: 'Go (1.23.5)',
    compiler: 'go build',
    file: 'main.go'
  },
  rust: {
    id: 108,
    fallbackId: 73,
    name: 'Rust (1.85.0)',
    compiler: 'rustc',
    file: 'main.rs'
  },
  php: {
    id: 98,
    fallbackId: 68,
    name: 'PHP (8.3.11)',
    compiler: 'php',
    file: 'index.php'
  },
  kotlin: {
    id: 111,
    fallbackId: 78,
    name: 'Kotlin (2.1.10)',
    compiler: 'kotlinc',
    file: 'Main.kt'
  }
};

function b64encode(str) {
  if (str === null || str === undefined) return '';
  return Buffer.from(str, 'utf-8').toString('base64');
}

function b64decode(b64) {
  if (!b64) return '';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

/**
 * Parses compiler & interpreter diagnostics while filtering benign Kotlin/JVM startup noise.
 */
function parseDiagnostics(compileOutput, stderr, lang) {
  const problems = [];
  const rawJoined = ((compileOutput || '') + '\n' + (stderr || '')).trim();
  if (!rawJoined) return problems;

  const rawText = rawJoined
    .split(/\r?\n/)
    .filter(line => !/WARNING:\s+(A restricted method|java\.lang\.System::load|Use --enable-native-access|Restricted methods will be blocked|A terminally deprecated method|sun\.misc\.Unsafe|Please consider reporting this to the maintainers)/i.test(line))
    .join('\n');

  if (!rawText.trim()) return problems;

  // 1. GCC / Clang (C, C++) & Kotlin & generic file:line:col: severity: msg
  const gccRegex = /(?:^|\n)(?:(?:\/box\/|main\.[a-z0-9]+|Main\.kt|[^:\n]+)):(\d+):(\d+):\s*(error|warning|fatal error|note):\s*([^\n]+)/gi;
  let match;
  while ((match = gccRegex.exec(rawText)) !== null) {
    const sev = match[3].toLowerCase().includes('error') ? 'error' : (match[3].toLowerCase().includes('warning') ? 'warning' : 'info');
    problems.push({
      file: LANGUAGE_REGISTRY[lang]?.file || 'source',
      line: parseInt(match[1], 10),
      column: parseInt(match[2], 10),
      severity: sev,
      message: match[4].trim(),
      raw: match[0].trim()
    });
  }

  // 2. Java: Main.java:3: error: ';' expected
  const javaRegex = /(?:^|\n)(?:Main\.java|[^:\n]+):(\d+):\s*(error|warning):\s*([^\n]+)/gi;
  while ((match = javaRegex.exec(rawText)) !== null) {
    const lineNum = parseInt(match[1], 10);
    const msg = match[3].trim();
    if (!problems.some(p => p.line === lineNum && p.message === msg)) {
      problems.push({
        file: 'Main.java',
        line: lineNum,
        column: 1,
        severity: match[2].toLowerCase(),
        message: msg,
        raw: match[0].trim()
      });
    }
  }

  if (lang === 'java' && (rawText.includes('HeadlessException') || rawText.includes('No X11 DISPLAY'))) {
    const mainMatch = rawText.match(/(?:at\s+([A-Za-z0-9_]+)\.[A-Za-z0-9_]+\(([A-Za-z0-9_]+\.java):(\d+)\))/);
    problems.push({
      file: mainMatch ? mainMatch[2] : 'Main.java',
      line: mainMatch ? parseInt(mainMatch[3], 10) : 1,
      column: 1,
      severity: 'error',
      message: 'Desktop GUI windows require headless BufferedImage & Graphics2D in cloud sandboxes to stream PNG output to the NRG Graphics viewport.',
      raw: 'java.awt.HeadlessException: No X11 DISPLAY variable was set'
    });
  }

  if (lang === 'java' && (rawText.includes('package javafx') || rawText.includes('javafx does not exist'))) {
    problems.push({
      file: 'Main.java',
      line: 1,
      column: 1,
      severity: 'warning',
      message: 'JavaFX is not bundled in headless JDK; use Java AWT / Swing Graphics2D offscreen rendering.',
      raw: 'JavaFX library not found'
    });
  }

  // 3. Rust
  const rustRegex = /(error(?:\[[^\]]+\])?|warning):\s*([^\n]+)\n\s*-->\s*[^:\n]+:(\d+):(\d+)/gi;
  while ((match = rustRegex.exec(rawText)) !== null) {
    problems.push({
      file: 'main.rs',
      line: parseInt(match[3], 10),
      column: parseInt(match[4], 10),
      severity: match[1].toLowerCase().startsWith('error') ? 'error' : 'warning',
      message: match[2].trim(),
      raw: match[0].trim()
    });
  }

  // 4. Go
  const goRegex = /(?:^|\n)(?:\.\/)?(?:main\.go|[^:\n]+):(\d+):(\d+):\s*([^\n]+)/gi;
  while ((match = goRegex.exec(rawText)) !== null) {
    if (!match[3].toLowerCase().startsWith('error') && !match[3].toLowerCase().startsWith('warning')) {
      problems.push({
        file: 'main.go',
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        severity: 'error',
        message: match[3].trim(),
        raw: match[0].trim()
      });
    }
  }

  // 5. C# Mono
  const csharpRegex = /(?:^|\n)[^(:\n]+\((\d+),(\d+)\):\s*(error|warning)\s*[^:]*:\s*([^\n]+)/gi;
  while ((match = csharpRegex.exec(rawText)) !== null) {
    problems.push({
      file: 'Program.cs',
      line: parseInt(match[1], 10),
      column: parseInt(match[2], 10),
      severity: match[3].toLowerCase(),
      message: match[4].trim(),
      raw: match[0].trim()
    });
  }

  // 6. Python tracebacks (filter internal wrapper frames and preserve user 'main.py')
  const pyLineRegex = /File "(?:main\.py)", line (\d+)(?:, in [^\n]+)?(?:\n\s+[^\n]+)?(?:\n\s+\^~*)?(?:\n([A-Za-z0-9_]+Error:[^\n]+|SyntaxError:[^\n]+|Exception:[^\n]+))?/g;
  while ((match = pyLineRegex.exec(rawText)) !== null) {
    const line = parseInt(match[1], 10);
    const msg = match[2] || 'Runtime error encountered';
    problems.push({
      file: 'main.py',
      line,
      column: 1,
      severity: 'error',
      message: msg.trim(),
      raw: match[0].trim()
    });
  }

  // 7. PHP
  const phpRegex = /(Parse error|Fatal error|Warning):\s*([^\n]+)\s+in\s+.*?\s+on\s+line\s+(\d+)/gi;
  while ((match = phpRegex.exec(rawText)) !== null) {
    problems.push({
      file: 'index.php',
      line: parseInt(match[3], 10),
      column: 1,
      severity: match[1].toLowerCase().includes('warning') ? 'warning' : 'error',
      message: match[2].trim(),
      raw: match[0].trim()
    });
  }

  return problems;
}

async function submitToJudge0(languageId, sourceCode, stdin) {
  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = new URL(JUDGE0_API_URL).host;
  }

  const payload = {
    language_id: languageId,
    source_code: b64encode(sourceCode),
    stdin: b64encode(stdin || ''),
    cpu_time_limit: 15.0,
    cpu_extra_time: 5.0,
    wall_time_limit: 30.0,
    memory_limit: 128000,
    max_file_size: 1024
  };

  if (languageId === 103 || languageId === 50 || languageId === 48 || languageId === 49) {
    payload.compiler_options = '-O0 -lm';
  } else if (languageId === 105 || languageId === 54 || languageId === 53 || languageId === 52) {
    payload.compiler_options = '-std=c++17 -O0 -lm';
  }

  const overallStart = Date.now();
  const endpoint = `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Math.min(25000, MAX_EXECUTION_TIMEOUT_MS))
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Judge0 API error HTTP ${response.status}: ${errText}`);
  }

  let result = await response.json();

  if (result.status && result.status.id <= 2 && result.token) {
    while (result.status && result.status.id <= 2 && (Date.now() - overallStart) < MAX_EXECUTION_TIMEOUT_MS) {
      await new Promise(r => setTimeout(r, 400));
      const remainingMs = MAX_EXECUTION_TIMEOUT_MS - (Date.now() - overallStart);
      if (remainingMs <= 0) break;
      const pollEndpoint = `${JUDGE0_API_URL}/submissions/${result.token}?base64_encoded=true`;
      const pollRes = await fetch(pollEndpoint, {
        headers,
        signal: AbortSignal.timeout(Math.min(10000, remainingMs))
      });
      if (pollRes.ok) result = await pollRes.json();
    }
    if (result.status && result.status.id <= 2) {
      result.status = { id: 5, description: 'Time Limit Exceeded' };
      result.message = b64encode('Execution timed out after 30 seconds maximum overall execution timeout.');
    }
  }

  return result;
}

async function executeCode(payloadArg) {
  const { language, source_code, code, stdin, allow_client_fallback } = payloadArg || {};
  const rawSource = typeof source_code === 'string' ? source_code : code;
  const langKey = (language || '').toLowerCase().trim();
  const langData = LANGUAGE_REGISTRY[langKey];

  if (!langKey || !langData) {
    return {
      status: 400,
      data: {
        success: false,
        error: `Unsupported language: '${langKey}'. Supported: ${Object.keys(LANGUAGE_REGISTRY).join(', ')}`
      }
    };
  }

  if (typeof rawSource !== 'string' || rawSource.length > EXECUTION_LIMITS.MAX_SOURCE_BYTES) {
    return {
      status: 400,
      data: {
        success: false,
        status: { id: 14, description: 'Payload Too Large' },
        error: 'Source code exceeds maximum permitted payload limit (256 KB).'
      }
    };
  }

  if (stdin && (typeof stdin !== 'string' || stdin.length > EXECUTION_LIMITS.MAX_STDIN_BYTES)) {
    return {
      status: 400,
      data: {
        success: false,
        status: { id: 14, description: 'Payload Too Large' },
        error: 'STDIN exceeds maximum permitted payload limit (64 KB).'
      }
    };
  }

  // Security guard against static fork bombs / resource exhaustion attacks
  const hazard = checkStaticResourceHazards(langKey, rawSource);
  if (!hazard.safe) {
    return {
      status: 403,
      data: {
        success: false,
        status: { id: 14, description: 'Blocked by Security Policy' },
        error: hazard.reason
      }
    };
  }

  const wallStart = Date.now();
  const graphicsDetection = detectGraphics(langKey, rawSource);
  const prepared = prepareExecutionCode(langKey, rawSource);
  let codeToExecute = prepared.code;
  if (langKey === 'c' || langKey === 'cpp') {
    codeToExecute = preprocessCppCompat(codeToExecute, langKey, langData.file);
  }

  let judge0Result = null;
  let isLocalResult = false;
  let executionModeLabel = 'Judge0 Isolated Sandbox';

  const sciModules = langKey === 'python' ? getScientificModulesUsed(rawSource) : [];
  if (langKey === 'python') {
    if (process.env.NRG_EXECUTION_MODE === 'local' || (sciModules.length > 0 && hasLocalPythonModules(sciModules))) {
      const localRes = await executeLocal({ language: langKey, source_code: codeToExecute, stdin: stdin || '' });
      if (localRes) {
        judge0Result = localRes;
        isLocalResult = true;
        executionModeLabel = sciModules.length > 0
          ? `Local Python Sandbox (${sciModules.join(', ')})`
          : 'Local Python Sandbox';
      }
    } else if (sciModules.length > 0 && areModulesPyodideCompatible(sciModules) && allow_client_fallback !== false) {
      // Cloud host & Judge0 CE lack compiled wheels (matplotlib/numpy/pandas/scipy/etc.)
      // Signal the client sandbox to run inside our isolated Pyodide WebAssembly Worker cleanly.
      return {
        status: 200,
        data: {
          success: false,
          requires_client_runtime: true,
          fallback_runtime: 'pyodide',
          pyodide_packages: sciModules,
          status: { id: 15, description: 'Client Scientific Runtime Available' },
          language: langKey,
          compiler: langData.name,
          is_graphics: graphicsDetection.isGraphics,
          graphics_engine: graphicsDetection.engine || null,
          execution_mode: `WebAssembly Scientific Python Worker (${sciModules.join(', ')})`,
          message: `Scientific packages (${sciModules.join(', ')}) are not installed on the server container; routing cleanly to the browser Pyodide WebAssembly sandbox.`
        }
      };
    }
  }

  if (!judge0Result) {
    try {
      judge0Result = await submitToJudge0(langData.id, codeToExecute, stdin || '');
    } catch (_) {
      await new Promise(r => setTimeout(r, 350));
      const retryId = (langData.fallbackId && langData.fallbackId !== langData.id) ? langData.fallbackId : langData.id;
      try {
        judge0Result = await submitToJudge0(retryId, codeToExecute, stdin || '');
      } catch (fallbackErr) {
        console.error('Judge0 primary and fallback compilers unreachable:', fallbackErr.message);
      }
    }

    const decodedStderr = judge0Result ? b64decode(judge0Result.stderr) : '';
    const missingModMatch = langKey === 'python' && decodedStderr.match(/ModuleNotFoundError:\s*No module named ['"]([^'"]+)['"]/);
    if (
      (!judge0Result && ['c', 'cpp', 'python', 'javascript'].includes(langKey)) ||
      (missingModMatch && hasLocalPythonModules([missingModMatch[1].split('.')[0]]))
    ) {
      const localRes = await executeLocal({ language: langKey, source_code: codeToExecute, stdin: stdin || '' });
      if (localRes) {
        judge0Result = localRes;
        isLocalResult = true;
        executionModeLabel = missingModMatch
          ? `Local Python Sandbox (${missingModMatch[1]})`
          : `Local ${langData.compiler} Sandbox`;
      }
    } else if (missingModMatch && areModulesPyodideCompatible([missingModMatch[1].split('.')[0]]) && allow_client_fallback !== false) {
      const modName = missingModMatch[1].split('.')[0];
      return {
        status: 200,
        data: {
          success: false,
          requires_client_runtime: true,
          fallback_runtime: 'pyodide',
          pyodide_packages: Array.from(new Set([...sciModules, modName])),
          status: { id: 15, description: 'Client Scientific Runtime Available' },
          language: langKey,
          compiler: langData.name,
          is_graphics: graphicsDetection.isGraphics,
          graphics_engine: graphicsDetection.engine || null,
          execution_mode: `WebAssembly Scientific Python Worker (${modName})`
        }
      };
    }

    if (!judge0Result) {
      return {
        status: 503,
        data: {
          success: false,
          status: { id: 13, description: 'Service Unavailable' },
          error: 'Execution service unavailable. Please try again later.',
          backend_error: true
        }
      };
    }
  }

  const decodeField = (val) => (isLocalResult ? (val || '') : b64decode(val));
  let stdout = decodeField(judge0Result.stdout);
  const stderr = decodeField(judge0Result.stderr);
  const compileOutput = decodeField(judge0Result.compile_output);
  const message = decodeField(judge0Result.message);
  const statusId = judge0Result.status ? judge0Result.status.id : 0;
  const statusDesc = judge0Result.status ? judge0Result.status.description : 'Unknown';

  const extracted = extractGraphicsOutput(stdout);
  stdout = extracted.stdout;
  const graphicsOutput = extracted.graphicsOutput;

  const problems = parseDiagnostics(compileOutput, stderr, langKey);
  const isCompilationSuccess = statusId !== 6;
  const isExecutionSuccess = statusId === 3;
  const totalWallMs = Date.now() - wallStart;
  const compileMs = Number(judge0Result.compile_time_ms) || 0;
  const execMs = Number(judge0Result.execution_time_ms) || Math.round((parseFloat(judge0Result.time) || 0) * 1000) || totalWallMs;

  recordExecutionMetric({
    language: langKey,
    success: isExecutionSuccess,
    compileMs,
    execMs,
    mode: executionModeLabel,
    cacheHit: !!judge0Result.cache_hit
  });

  const responseData = {
    success: isExecutionSuccess,
    status: { id: statusId, description: statusDesc },
    compilation_success: isCompilationSuccess,
    stdout,
    stderr,
    compile_output: compileOutput,
    message,
    exit_code: judge0Result.exit_code !== undefined && judge0Result.exit_code !== null ? judge0Result.exit_code : (isExecutionSuccess ? 0 : 1),
    time: judge0Result.time || '0.000',
    compile_time_ms: compileMs,
    execution_time_ms: execMs,
    wall_time_ms: totalWallMs,
    cache_hit: !!judge0Result.cache_hit,
    memory: judge0Result.memory || 0,
    problems,
    language: langKey,
    compiler: langData.name,
    execution_mode: executionModeLabel,
    compile_timeout_ms: COMPILE_TIMEOUT_MS,
    execution_timeout_ms: MAX_EXECUTION_TIMEOUT_MS,
    is_graphics: graphicsDetection.isGraphics || !!graphicsOutput,
    graphics_engine: (graphicsOutput && graphicsOutput.engine) || graphicsDetection.engine || null
  };

  if (graphicsOutput) {
    responseData.graphics_output = graphicsOutput;
    if (graphicsOutput.type === 'turtle' && Array.isArray(graphicsOutput.commands)) {
      responseData.turtle_commands = graphicsOutput.commands;
    }
  }

  return { status: 200, data: responseData };
}

module.exports = {
  LANGUAGE_REGISTRY,
  b64encode,
  b64decode,
  parseDiagnostics,
  submitToJudge0,
  executeCode
};
