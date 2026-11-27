/**
 * NRG ENGINE — AI CODE ASSISTANT & STATIC ANALYZER ENGINE
 * Supports: Explain, Debug Diagnostics, Optimize, and Dependency Detection.
 * Calls configured external/local LLM when available and performs real AST/regex static analysis offline.
 */

const { parseSymbols } = require('./_predictor');

const STDLIB_BY_LANG = {
  c: new Set(['stdio.h', 'stdlib.h', 'string.h', 'math.h', 'time.h', 'ctype.h', 'stdbool.h', 'limits.h', 'stdint.h', 'float.h']),
  cpp: new Set(['iostream', 'vector', 'string', 'algorithm', 'cmath', 'map', 'unordered_map', 'set', 'memory', 'utility', 'queue', 'stack', 'sstream']),
  python: new Set(['sys', 'os', 'math', 'json', 're', 'time', 'datetime', 'random', 'collections', 'itertools', 'functools', 'typing', 'pathlib', 'io', 'turtle']),
  javascript: new Set(['fs', 'path', 'os', 'http', 'crypto', 'events', 'util', 'url', 'stream', 'buffer']),
  java: new Set(['java.util', 'java.io', 'java.lang', 'java.math', 'java.awt', 'javax.swing', 'javax.imageio']),
  go: new Set(['fmt', 'os', 'io', 'math', 'strings', 'sort', 'sync', 'time', 'net/http', 'encoding/json']),
  rust: new Set(['std::io', 'std::collections', 'std::thread', 'std::sync', 'std::time', 'std::cmp'])
};

/**
 * Extracts imports/headers/libraries and classifies them cleanly as stdlib, bridge, or external.
 */
function detectDependencies(language, code) {
  const lang = (language || 'c').toLowerCase().trim();
  const text = typeof code === 'string' ? code : '';
  const deps = [];
  const seen = new Set();

  const addDep = (name, kind, note) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    deps.push({ name, kind, note });
  };

  if (lang === 'c' || lang === 'cpp') {
    for (const m of text.matchAll(/^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm)) {
      const hdr = m[1].trim();
      if (hdr === 'conio.h') addDep(hdr, 'compat-shim', 'NRG Portable ANSI conio.h shim');
      else if (STDLIB_BY_LANG[lang]?.has(hdr)) addDep(hdr, 'stdlib', 'C/C++ Standard Library');
      else addDep(hdr, 'header', 'Header dependency');
    }
  } else if (lang === 'python') {
    for (const m of text.matchAll(/^\s*import\s+([A-Za-z0-9_., \t]+)/gm)) {
      for (const part of m[1].split(',')) {
        const pkg = part.trim().split(/\s+as\s+/)[0].split('.')[0].trim();
        if (!pkg) continue;
        if (pkg === 'turtle') addDep(pkg, 'graphics-bridge', 'NRG HTML5 Vector Turtle Bridge');
        else if (['matplotlib', 'numpy', 'pandas', 'scipy', 'seaborn', 'sympy', 'PIL'].includes(pkg)) {
          addDep(pkg, 'scientific', 'Native Python / Pyodide WebAssembly Runtime');
        } else if (STDLIB_BY_LANG.python.has(pkg)) {
          addDep(pkg, 'stdlib', 'Python Standard Library');
        } else {
          addDep(pkg, 'external', 'Third-party Python module');
        }
      }
    }
    for (const m of text.matchAll(/^\s*from\s+([A-Za-z0-9_]+)(?:\.[A-Za-z0-9_]+)*\s+import\b/gm)) {
      const pkg = m[1].trim();
      if (['matplotlib', 'numpy', 'pandas', 'scipy', 'seaborn', 'sympy', 'PIL'].includes(pkg)) {
        addDep(pkg, 'scientific', 'Native Python / Pyodide WebAssembly Runtime');
      } else if (pkg === 'turtle') {
        addDep(pkg, 'graphics-bridge', 'NRG HTML5 Vector Turtle Bridge');
      } else if (STDLIB_BY_LANG.python.has(pkg)) {
        addDep(pkg, 'stdlib', 'Python Standard Library');
      } else {
        addDep(pkg, 'external', 'Third-party Python module');
      }
    }
  } else if (lang === 'javascript') {
    for (const m of text.matchAll(/(?:import\s+[^'"]*['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g)) {
      const pkg = (m[1] || m[2] || '').trim();
      addDep(pkg, STDLIB_BY_LANG.javascript.has(pkg) ? 'stdlib' : 'package', STDLIB_BY_LANG.javascript.has(pkg) ? 'Node.js Built-in' : 'Module import');
    }
    if (/(THREE\.|createCanvas|d3\.|getContext\()/.test(text)) {
      addDep('Browser Canvas / WebGL Bridge', 'graphics-bridge', 'Hardware-accelerated iframe sandbox');
    }
  } else if (lang === 'java') {
    for (const m of text.matchAll(/^\s*import\s+([A-Za-z0-9_.*]+);/gm)) {
      const imp = m[1].trim();
      const isGui = /^(java\.awt|javax\.swing|javax\.imageio)/.test(imp);
      addDep(imp, isGui ? 'graphics-bridge' : 'stdlib', isGui ? 'Java 2D Graphics / Headless Stream' : 'JDK Standard Package');
    }
  } else if (lang === 'go') {
    for (const m of text.matchAll(/["']([a-z0-9_./-]+)["']/g)) {
      if (STDLIB_BY_LANG.go.has(m[1])) addDep(m[1], 'stdlib', 'Go Standard Library');
    }
  } else if (lang === 'rust') {
    for (const m of text.matchAll(/^\s*use\s+([A-Za-z0-9_:]+)/gm)) {
      const crate = m[1].split('::').slice(0, 2).join('::');
      addDep(crate, crate.startsWith('std::') ? 'stdlib' : 'crate', crate.startsWith('std::') ? 'Rust Standard Library' : 'Rust Use Path');
    }
  } else if (lang === 'csharp') {
    for (const m of text.matchAll(/^\s*using\s+([A-Za-z0-9_.]+);/gm)) {
      addDep(m[1], m[1].startsWith('System') ? 'stdlib' : 'namespace', 'C# / Mono Namespace');
    }
  }

  return deps;
}

function computeStaticMetrics(language, code) {
  const lines = (code || '').split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  let branchPoints = 1;
  let maxDepth = 0;
  let curDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/\b(if|else\s+if|elif|for|while|switch|case|match|catch|except)\b/.test(trimmed) || /\?.*:/.test(trimmed)) {
      branchPoints++;
    }
    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    if (language === 'python' && trimmed.endsWith(':')) {
      const pyIndent = Math.floor((line.length - trimmed.length) / 4) + 1;
      if (pyIndent > maxDepth) maxDepth = pyIndent;
    } else {
      curDepth = Math.max(0, curDepth + opens - closes);
      if (curDepth > maxDepth) maxDepth = curDepth;
    }
  }

  const symbols = parseSymbols(code, language);
  return {
    totalLines: lines.length,
    codeLines: nonEmpty.length,
    cyclomaticComplexity: branchPoints,
    maxNestingDepth: maxDepth,
    functions: symbols.funcs,
    variables: symbols.vars.slice(0, 12)
  };
}

function buildStaticAssistance({ mode, language, code, errorOutput, dependencies, metrics }) {
  const langUpper = (language || 'code').toUpperCase();
  const fnList = metrics.functions.length ? metrics.functions.join(', ') : 'entry point / global scope';
  const varList = metrics.variables.length ? metrics.variables.map(v => `${v.name} (${v.type})`).join(', ') : 'none detected';

  if (mode === 'dependencies') {
    if (!dependencies.length) {
      return `Dependency Analysis (${langUpper}):\n- No explicit imports or external headers detected.\n- Lines of code: ${metrics.codeLines} active lines, Cyclomatic complexity: ${metrics.cyclomaticComplexity}.`;
    }
    return `Detected Dependencies (${dependencies.length}) in ${langUpper}:\n` +
      dependencies.map(d => `- ${d.name} [${d.kind}] — ${d.note}`).join('\n');
  }

  if (mode === 'debug') {
    const issues = [];
    if (errorOutput && errorOutput.trim()) {
      issues.push(`Observed Error Output:\n${errorOutput.trim().split('\n').slice(0, 6).join('\n')}`);
      if (/expected ['";]/i.test(errorOutput)) issues.push('Hint: Check for missing semicolons, parentheses, or unclosed braces prior to the reported line.');
      if (/undeclared|not defined|cannot find symbol|E0425/i.test(errorOutput)) issues.push('Hint: Verify variable declaration scope, spelling, or missing #include / import.');
      if (/ModuleNotFoundError/i.test(errorOutput)) issues.push('Hint: Third-party Python packages are supported via host Python or browser Pyodide WebAssembly fallback (numpy, matplotlib, pandas, scipy, sympy, PIL).');
      if (/Segmentation fault|SIGSEGV|out of bounds/i.test(errorOutput)) issues.push('Hint: Check pointer initialization, malloc NULL checks, and loop bounds (`< n`, not `<= n`).');
    }
    if ((language === 'c' || language === 'cpp') && /\bgets\s*\(/.test(code)) {
      issues.push('Security Warning: `gets()` causes buffer overflows. Replace with `fgets(buf, sizeof(buf), stdin)`.');
    }
    if ((language === 'c' || language === 'cpp') && /\bmalloc\s*\(/.test(code) && !/\bfree\s*\(/.test(code)) {
      issues.push('Memory Leak Check: `malloc()` detected without matching `free()`.');
    }
    if (language === 'python' && /except\s*:/.test(code)) {
      issues.push('Reliability Tip: Bare `except:` catches SystemExit/KeyboardInterrupt; catch `except Exception as err:` instead.');
    }
    if (issues.length === 0) {
      issues.push('Static Diagnostics Check: No obvious syntax/memory traps detected in static scan. Run the code (Ctrl+Enter) to verify runtime behavior.');
    }
    return issues.join('\n\n');
  }

  if (mode === 'optimize') {
    const tips = [];
    if (metrics.maxNestingDepth >= 3) {
      tips.push(`High Nesting Depth (${metrics.maxNestingDepth}): Consider early returns (` + '`return`' + `) or helper functions to flatten deeply nested blocks.`);
    }
    if ((language === 'c' || language === 'cpp') && /for\s*\([^)]*strlen\s*\(/.test(code)) {
      tips.push('Loop Optimization: Calling `strlen()` inside a `for` loop condition recalculates length every iteration (O(n^2)). Cache the length in a variable first.');
    }
    if (language === 'cpp' && /std::endl/.test(code)) {
      tips.push('I/O Performance: Replace `std::endl` inside hot loops with `"\\n"` to avoid flushing output buffers on every line.');
    }
    if (language === 'python' && /for\s+\w+\s+in\s+range\s*\(\s*len\s*\(/.test(code)) {
      tips.push('Pythonic Iteration: Prefer `for idx, val in enumerate(items):` over `range(len(...))` for readability and speed.');
    }
    if (tips.length === 0) {
      tips.push(`Complexity Summary: ${metrics.codeLines} active lines, Cyclomatic complexity ${metrics.cyclomaticComplexity}, Nesting depth ${metrics.maxNestingDepth}. Code structure is clean and concise.`);
    }
    return `Optimization & Performance Audit (${langUpper}):\n- ` + tips.join('\n- ');
  }

  // Default: explain
  return [
    `Code Summary (${langUpper}):`,
    `- Structure: ${metrics.codeLines} active lines (${metrics.totalLines} total), Cyclomatic complexity: ${metrics.cyclomaticComplexity}, Max nesting: ${metrics.maxNestingDepth}.`,
    `- Defined Functions/Routines: ${fnList}`,
    `- Identified Symbols/Variables: ${varList}`,
    `- Dependencies (${dependencies.length}): ${dependencies.length ? dependencies.map(d => d.name).join(', ') : 'None (pure language primitives)'}`
  ].join('\n');
}

const {
  resolveAiConfig,
  getAiPublicStatus,
  invokeChatCompletion
} = require('./_ai_provider');

function buildAssistMessages({ mode, language, code, errorOutput, messages }) {
  const sysBase = [
    'You are NRG Engine AI Studio, an expert systems and software engineering assistant embedded inside a polyglot IDE.',
    `Active workspace language: ${language}.`,
    'Give concise, technically accurate responses. When proposing code fixes or improvements, provide clean runnable fenced code blocks matching the active language.'
  ].join(' ');

  if (mode === 'chat') {
    const cleanTurns = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string' && m.content.trim())
          .slice(-14)
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content.slice(0, 6000)
          }))
      : [];

    const ctxParts = [sysBase];
    if (code && code.trim()) {
      ctxParts.push(`\nCurrent open file (${language}):\n\`\`\`${language}\n${code.slice(0, 6500)}\n\`\`\``);
    }
    if (errorOutput && errorOutput.trim()) {
      ctxParts.push(`\nRecent compiler / runtime output:\n\`\`\`text\n${errorOutput.slice(0, 1800)}\n\`\`\``);
    }
    if (!cleanTurns.length) {
      cleanTurns.push({ role: 'user', content: `Analyze the open ${language} file and summarize how I can improve or test it.` });
    }
    return [{ role: 'system', content: ctxParts.join('\n') }, ...cleanTurns];
  }

  const taskPrompts = {
    explain: `Explain what this ${language} code does step-by-step, its key data flow, and its time/space complexity.`,
    debug: `Analyze this ${language} code for bugs, edge cases, UB/memory hazards, or syntax issues, and give exact fixed code.${errorOutput ? `\n\nCompiler/Runtime output:\n\`\`\`text\n${errorOutput.slice(0, 1800)}\n\`\`\`` : ''}`,
    optimize: `Analyze this ${language} code for performance, algorithmic complexity, memory efficiency, and clarity, and provide optimized code.`
  };

  return [
    { role: 'system', content: sysBase },
    {
      role: 'user',
      content: `${taskPrompts[mode] || taskPrompts.explain}\n\nCode:\n\`\`\`${language}\n${code.slice(0, 7500)}\n\`\`\``
    }
  ];
}

async function analyzeAndAssist({ mode = 'explain', language = 'c', code = '', errorOutput = '', messages = null, aiConfig = null }) {
  const safeCode = typeof code === 'string' ? code.slice(0, 16000) : '';
  const safeMode = ['explain', 'debug', 'optimize', 'dependencies', 'chat'].includes(mode) ? mode : 'explain';
  const dependencies = detectDependencies(language, safeCode);
  const metrics = computeStaticMetrics(language, safeCode);

  if (safeMode === 'dependencies') {
    const aiStatus = getAiPublicStatus(aiConfig || {});
    return {
      success: true,
      mode: 'dependencies',
      source: 'static-ast',
      llmConfigured: aiStatus.configured,
      analysis: buildStaticAssistance({ mode: 'dependencies', language, code: safeCode, errorOutput, dependencies, metrics }),
      metrics,
      dependencies
    };
  }

  const resolved = resolveAiConfig(aiConfig || {}, 'assist');
  if (!resolved.configured) {
    return {
      success: false,
      statusCode: 503,
      configured: false,
      mode: safeMode,
      errorCode: resolved.errorCode,
      error: resolved.error,
      missingConfig: resolved.missingConfig,
      metrics,
      dependencies
    };
  }

  const llmMessages = buildAssistMessages({
    mode: safeMode,
    language,
    code: safeCode,
    errorOutput: typeof errorOutput === 'string' ? errorOutput : '',
    messages
  });

  try {
    const llmRes = await invokeChatCompletion({
      resolved,
      messages: llmMessages,
      temperature: 0.2,
      maxTokens: safeMode === 'chat' ? 1200 : 850,
      timeoutMs: 28000,
      stream: false
    });
    return {
      success: true,
      configured: true,
      mode: safeMode,
      source: `${resolved.provider}-llm`,
      provider: resolved.provider,
      providerLabel: resolved.label,
      model: llmRes.model || resolved.model,
      analysis: llmRes.text,
      reply: llmRes.text,
      metrics,
      dependencies
    };
  } catch (err) {
    return {
      success: false,
      statusCode: err.statusCode || 502,
      configured: true,
      mode: safeMode,
      provider: resolved.provider,
      providerLabel: resolved.label,
      model: resolved.model,
      errorCode: err.errorCode || 'AI_ASSIST_FAILED',
      error: err.message,
      metrics,
      dependencies
    };
  }
}

function writeSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
}

async function streamAssistChat({ mode = 'chat', language = 'c', code = '', errorOutput = '', messages = null, aiConfig = null }, res) {
  const safeCode = typeof code === 'string' ? code.slice(0, 16000) : '';
  const safeMode = ['explain', 'debug', 'optimize', 'chat'].includes(mode) ? mode : 'chat';
  const dependencies = detectDependencies(language, safeCode);
  const metrics = computeStaticMetrics(language, safeCode);

  const resolved = resolveAiConfig(aiConfig || {}, 'assist');
  if (!resolved.configured) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      configured: false,
      mode: safeMode,
      errorCode: resolved.errorCode,
      error: resolved.error,
      missingConfig: resolved.missingConfig
    }));
    return;
  }

  const llmMessages = buildAssistMessages({
    mode: safeMode,
    language,
    code: safeCode,
    errorOutput: typeof errorOutput === 'string' ? errorOutput : '',
    messages
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  writeSseEvent(res, 'meta', {
    provider: resolved.provider,
    providerLabel: resolved.label,
    model: resolved.model,
    mode: safeMode
  });

  try {
    const llmRes = await invokeChatCompletion({
      resolved,
      messages: llmMessages,
      temperature: 0.2,
      maxTokens: 1200,
      timeoutMs: 29000,
      stream: true,
      onDelta: (delta) => {
        if (delta && !res.writableEnded) writeSseEvent(res, 'delta', { text: delta });
      }
    });
    if (!res.writableEnded) {
      writeSseEvent(res, 'done', {
        fullText: llmRes.text,
        provider: resolved.provider,
        providerLabel: resolved.label,
        model: llmRes.model || resolved.model,
        streamed: llmRes.streamed,
        metrics,
        dependencies
      });
      res.end();
    }
  } catch (err) {
    if (!res.writableEnded) {
      writeSseEvent(res, 'error', {
        statusCode: err.statusCode || 502,
        configured: true,
        provider: resolved.provider,
        providerLabel: resolved.label,
        errorCode: err.errorCode || 'AI_STREAM_ERROR',
        error: err.message
      });
      res.end();
    }
  }
}

module.exports = {
  detectDependencies,
  computeStaticMetrics,
  analyzeAndAssist,
  streamAssistChat
};
