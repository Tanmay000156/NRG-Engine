/**
 * NRG ENGINE — CONTEXT-AWARE AI CODE PREDICTION ENGINE
 * Combines real configured LLM fill-in-the-middle inference
 * (OpenAI / OpenAI-compatible / Groq / Gemini / Anthropic / Ollama / user-configured endpoint)
 * with a fast, multi-line deterministic symbol-table & AST-context analyzer across all 10 languages.
 */

const { PREDICTOR_LIMITS } = require('./_config');

// Tiny in-memory LRU response cache to eliminate duplicate calls while typing/pausing
const PREDICTION_CACHE = new Map();
const MAX_CACHE_ENTRIES = 64;
const CACHE_TTL_MS = 12000;

function readCache(key) {
  const entry = PREDICTION_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    PREDICTION_CACHE.delete(key);
    return null;
  }
  return entry.val;
}

function writeCache(key, val) {
  if (!val || !val.suggestion) return;
  if (PREDICTION_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = PREDICTION_CACHE.keys().next().value;
    PREDICTION_CACHE.delete(firstKey);
  }
  PREDICTION_CACHE.set(key, { ts: Date.now(), val });
}

/**
 * Computes single-line or multi-line inline suffix prediction from a configured LLM
 * or falls back cleanly to local multi-line syntactic & symbol-table analysis.
 */
async function predictCode({ language, prefix, suffix = '', tabSize = 4, trigger = 'type', aiConfig = null, signal }) {
  const lang = (language || 'c').toLowerCase().trim();
  const safePrefix = typeof prefix === 'string' ? prefix.slice(-PREDICTOR_LIMITS.MAX_CONTEXT_CHARS) : '';
  const safeSuffix = typeof suffix === 'string' ? suffix.slice(0, 2000) : '';
  const indentUnit = ' '.repeat(tabSize === 2 ? 2 : 4);

  if (!safePrefix.trim()) {
    return { suggestion: '', multiline: false, source: 'none', confidence: 0 };
  }

  // Do not overwrite meaningful trailing tokens on the same line (unless just closing punctuation)
  const currentLineAfter = safeSuffix.split('\n')[0] || '';
  if (currentLineAfter.trim().length > 0 && !/^[)\]}'",;\s]+$/.test(currentLineAfter)) {
    return { suggestion: '', multiline: false, source: 'none', confidence: 0 };
  }

  const aiSig = aiConfig && typeof aiConfig === 'object'
    ? `${aiConfig.provider || 'auto'}:${aiConfig.model || ''}:${aiConfig.endpoint || ''}:${aiConfig.apiKey ? String(aiConfig.apiKey).slice(-6) : 'nokey'}`
    : 'auto';
  const cacheKey = `${lang}|${tabSize}|${aiSig}|${safePrefix.slice(-600)}|${currentLineAfter}`;
  const cached = readCache(cacheKey);
  if (cached) return { ...cached, cached: true };

  // 1. Real External or Local LLM Provider Inference (env vars or user-configured API settings)
  const llmRes = await tryExternalLlmPredict({
    language: lang,
    prefix: safePrefix,
    suffix: safeSuffix,
    aiConfig: aiConfig && typeof aiConfig === 'object' ? aiConfig : {},
    signal
  });

  if (llmRes.configured) {
    if (llmRes.error) {
      return {
        suggestion: '',
        multiline: false,
        source: 'error',
        llmConfigured: true,
        provider: llmRes.provider,
        model: llmRes.model,
        error: llmRes.error,
        errorCode: llmRes.errorCode,
        statusCode: llmRes.statusCode,
        rateLimited: llmRes.statusCode === 429
      };
    }
    const out = {
      suggestion: llmRes.suggestion || '',
      multiline: !!(llmRes.suggestion && llmRes.suggestion.includes('\n')),
      source: llmRes.source || `${llmRes.provider}-llm`,
      provider: llmRes.provider,
      model: llmRes.model,
      llmConfigured: true,
      confidence: llmRes.suggestion ? 0.94 : 0
    };
    if (out.suggestion) writeCache(cacheKey, out);
    return out;
  }

  // If user explicitly picked a provider other than 'auto' without credentials, report missing config honestly
  const reqProv = String(aiConfig?.provider || 'auto').toLowerCase();
  if (reqProv !== 'auto' && reqProv !== 'default' && reqProv !== 'env') {
    return {
      suggestion: '',
      multiline: false,
      source: 'unconfigured',
      llmConfigured: false,
      requiresAiConfig: true,
      provider: reqProv,
      error: llmRes.error,
      errorCode: llmRes.errorCode || 'NO_AI_CREDENTIALS',
      missingConfig: llmRes.missingConfig
    };
  }

  // 2. When 'auto' has no LLM credentials, expose local AST symbol context clearly labeled (not LLM)
  const ctxSuggestion = analyzeAndPredictContext({
    language: lang,
    prefix: safePrefix,
    suffix: safeSuffix,
    currentLineAfter,
    indentUnit,
    trigger
  });

  const out = {
    suggestion: ctxSuggestion || '',
    multiline: !!(ctxSuggestion && ctxSuggestion.includes('\n')),
    source: ctxSuggestion ? 'local-context-ast' : 'none',
    llmConfigured: false,
    requiresAiConfig: true,
    provider: 'none',
    warning: llmRes.error,
    missingConfig: llmRes.missingConfig,
    confidence: ctxSuggestion ? 0.84 : 0
  };
  writeCache(cacheKey, out);
  return out;
}

async function tryExternalLlmPredict({ language, prefix, suffix, aiConfig = {}, signal }) {
  const { resolveAiConfig, invokeChatCompletion } = require('./_ai_provider');
  const resolved = resolveAiConfig(aiConfig, 'predict');
  if (!resolved.configured) {
    return {
      configured: false,
      error: resolved.error,
      errorCode: resolved.errorCode,
      missingConfig: resolved.missingConfig
    };
  }

  const systemPrompt =
    `You are an inline code autocomplete engine for ${language}. ` +
    `Return ONLY the exact missing code continuation starting immediately at <CURSOR> (1-5 lines max, supporting multiline blocks when unfinished, no markdown fences, no prose, no repeating PREFIX).`;
  const userPrompt = `PREFIX:\n${prefix.slice(-3600)}\n<CURSOR>\nSUFFIX:\n${suffix.slice(0, 900)}`;

  try {
    const res = await invokeChatCompletion({
      resolved,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      maxTokens: 160,
      timeoutMs: PREDICTOR_LIMITS.LLM_TIMEOUT_MS,
      stream: false
    });
    if (signal?.aborted) return { configured: true, provider: resolved.provider, suggestion: '' };
    const cleaned = sanitizeCompletion(res.text || '');
    return {
      configured: true,
      provider: resolved.provider,
      model: res.model || resolved.model,
      source: `${resolved.provider}-llm`,
      suggestion: cleaned
    };
  } catch (err) {
    return {
      configured: true,
      provider: resolved.provider,
      model: resolved.model,
      suggestion: '',
      error: err.message,
      errorCode: err.errorCode || 'AI_PREDICT_FAILED',
      statusCode: err.statusCode || 502
    };
  }
}

function sanitizeCompletion(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.replace(/^```[\w-]*\r?\n?/, '').replace(/\r?\n?```$/, '');
  text = text.replace(/\r/g, '');
  if (!text.trim()) return '';
  // Allow clean multiline blocks up to 6 lines
  const lines = text.split('\n').slice(0, 6);
  return lines.join('\n');
}

/**
 * Extracts declared variables, inferred types, function names, and imported modules from source.
 */
function parseSymbols(code, lang) {
  const vars = []; // { name, type }
  const seen = new Set();
  const funcs = [];
  const imports = new Set();

  const addVar = (name, type) => {
    if (!name || seen.has(name) || /^(if|else|for|while|return|main|int|void|float|double|char|bool|def|class|struct|const|let|var|public|private|static|package|import|using|namespace|fn|func)$/.test(name)) {
      return;
    }
    seen.add(name);
    vars.push({ name, type: type || 'unknown' });
  };

  // Imports / includes
  for (const m of code.matchAll(/#\s*include\s*[<"]([^>"]+)[>"]/g)) imports.add(m[1]);
  for (const m of code.matchAll(/^\s*import\s+([\w.]+)(?:\s+as\s+(\w+))?/gm)) {
    imports.add(m[1]);
    if (m[2]) addVar(m[2], `module:${m[1]}`);
  }
  for (const m of code.matchAll(/^\s*from\s+([\w.]+)\s+import\s+([^\n#]+)/gm)) {
    imports.add(m[1]);
    m[2].split(',').forEach(part => {
      const nm = part.trim().split(/\s+as\s+/).pop().trim();
      if (/^\w+$/.test(nm)) addVar(nm, `from:${m[1]}`);
    });
  }

  if (lang === 'c' || lang === 'cpp' || lang === 'java' || lang === 'csharp') {
    for (const m of code.matchAll(/\b(int|long|short|float|double|char|bool|boolean|String|string|size_t|auto|std::vector<[^>]+>|std::string|Node\*?|var)\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)/g)) {
      const type = m[1];
      m[2].split(',').forEach(part => {
        const cleanName = part.trim().replace(/^\*+/, '');
        if (/^[a-zA-Z_]\w*$/.test(cleanName)) addVar(cleanName, type);
      });
    }
    for (const m of code.matchAll(/\b(?:void|int|double|float|char\*?|bool|boolean|String|string|auto)\s+([a-zA-Z_]\w*)\s*\([^)]*\)/g)) {
      if (m[1] !== 'main' && !funcs.includes(m[1])) funcs.push(m[1]);
    }
  }

  if (lang === 'python') {
    for (const m of code.matchAll(/^\s*def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/gm)) {
      if (!funcs.includes(m[1])) funcs.push(m[1]);
      m[2].split(',').forEach(arg => {
        const nm = arg.split('=')[0].split(':')[0].trim().replace(/^\*+/, '');
        if (/^[a-zA-Z_]\w*$/.test(nm) && nm !== 'self') addVar(nm, 'param');
      });
    }
    for (const m of code.matchAll(/^\s*([a-zA-Z_]\w*)(?:\s*,\s*([a-zA-Z_]\w*))?\s*=\s*([^\n#]+)/gm)) {
      const rhs = m[3].trim();
      let t = 'any';
      if (/plt\.subplots/.test(rhs)) {
        addVar(m[1], 'figure');
        if (m[2]) addVar(m[2], 'axes');
        continue;
      }
      if (/pd\.DataFrame|pd\.read_/.test(rhs)) t = 'dataframe';
      else if (/np\.|array\(|linspace\(|arange\(/.test(rhs)) t = 'ndarray';
      else if (/^["']/.test(rhs)) t = 'str';
      else if (/^\[/.test(rhs)) t = 'list';
      else if (/^\{/.test(rhs)) t = 'dict';
      else if (/^\d+\.\d+/.test(rhs)) t = 'float';
      else if (/^\d+$/.test(rhs)) t = 'int';
      addVar(m[1], t);
      if (m[2]) addVar(m[2], t);
    }
    for (const m of code.matchAll(/^\s*for\s+([a-zA-Z_]\w*)\s+in\b/gm)) {
      addVar(m[1], 'int');
    }
  }

  if (lang === 'javascript') {
    for (const m of code.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*([^\n;]+)/g)) {
      const rhs = m[2].trim();
      let t = 'any';
      if (/^\[/.test(rhs)) t = 'array';
      else if (/^["'`]/.test(rhs)) t = 'string';
      else if (/getContext\(/.test(rhs)) t = 'canvas2d';
      else if (/^\d/.test(rhs)) t = 'number';
      addVar(m[1], t);
    }
    for (const m of code.matchAll(/\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/g)) {
      if (!funcs.includes(m[1])) funcs.push(m[1]);
      m[2].split(',').forEach(arg => {
        const nm = arg.trim();
        if (/^[a-zA-Z_$][\w$]*$/.test(nm)) addVar(nm, 'param');
      });
    }
  }

  if (lang === 'go' || lang === 'rust' || lang === 'kotlin' || lang === 'php') {
    for (const m of code.matchAll(/\b(?:let(?:\s+mut)?|val|var)\s+([a-zA-Z_]\w*)\b|([a-zA-Z_]\w*)\s*:=/g)) {
      const nm = m[1] || m[2];
      if (nm) addVar(nm, 'var');
    }
    for (const m of code.matchAll(/\$([a-zA-Z_]\w*)\s*=/g)) {
      addVar(m[1], 'phpvar');
    }
    for (const m of code.matchAll(/\b(?:fn|func|fun|function)\s+([a-zA-Z_]\w*)\s*\(/g)) {
      if (m[1] !== 'main' && !funcs.includes(m[1])) funcs.push(m[1]);
    }
  }

  return { vars, funcs, imports };
}

function getFormatSpecifier(type) {
  if (/double|float/.test(type)) return '%.2f';
  if (/char\s*\*|String|string/.test(type)) return '%s';
  if (/char/.test(type)) return '%c';
  if (/long|size_t/.test(type)) return '%ld';
  return '%d';
}

function stripClosingIfPresent(suggestion, lineAfter) {
  if (!suggestion || !lineAfter) return suggestion;
  const trimmedAfter = lineAfter.trim();
  if (trimmedAfter && suggestion.endsWith(trimmedAfter)) {
    return suggestion.slice(0, suggestion.length - trimmedAfter.length);
  }
  return suggestion;
}

function analyzeAndPredictContext({ language, prefix, suffix, currentLineAfter, indentUnit, trigger = 'type' }) {
  const lines = prefix.split('\n');
  const currentLine = lines[lines.length - 1] || '';
  const trimmedLine = currentLine.trim();
  const prevLine = (lines[lines.length - 2] || '').trim();
  const leadingIndentMatch = currentLine.match(/^(\s*)/);
  const baseIndent = leadingIndentMatch ? leadingIndentMatch[1] : '';
  const fullCode = prefix + suffix;
  // Avoid recommending an incomplete LHS variable inside its own initializer expression
  const incompleteAssign = currentLine.match(/^\s*(?:[a-zA-Z_]\w*\s+)?([a-zA-Z_]\w*)\s*=\s*[^;]*$/);
  const symbolSource = incompleteAssign ? lines.slice(0, -1).join('\n') : prefix;
  const symbols = parseSymbols(symbolSource, language);
  const lastVar = symbols.vars.length ? symbols.vars[symbols.vars.length - 1] : null;
  const numericVars = symbols.vars.filter(v => /^(int|long|short|float|double|size_t|number|int|float|param)$/.test(v.type) || /^(n|x|y|sum|total|count|res|ans|val|i|j|idx|size|len)$/i.test(v.name));
  const limitVar = symbols.vars.find(v => /^(n|len|size|count|limit|max|rows|cols|num|N)$/i.test(v.name));
  const hasClosingBraceAfter = /^\s*\}/.test(suffix.trim());

  // Don't autocomplete inside single-line comments
  if ((trimmedLine.startsWith('//') && language !== 'python' && language !== 'php') ||
      (trimmedLine.startsWith('#') && !/^#\s*in/.test(trimmedLine) && language !== 'c' && language !== 'cpp')) {
    if (!(language === 'c' || language === 'cpp')) return '';
    if (!/^\s*#\s*(?:inc|in)?/.test(currentLine)) return '';
  }

  let suggestion = '';

  // --- 1. C / C++ Specific Context Predictions (Single-line & Multiline) ---
  if (language === 'c' || language === 'cpp') {
    const incMatch = currentLine.match(/^\s*#\s*include\s*<([a-zA-Z0-9_./]*)$/);
    if (incMatch) {
      const partial = incMatch[1];
      const candidates = language === 'cpp'
        ? ['iostream>', 'vector>', 'algorithm>', 'string>', 'cmath>', 'map>', 'set>', 'memory>', 'stdio.h>', 'conio.h>', 'bits/stdc++.h>']
        : ['stdio.h>', 'stdlib.h>', 'math.h>', 'string.h>', 'stdbool.h>', 'conio.h>', 'ctype.h>', 'time.h>', 'limits.h>'];
      const prioritized = candidates.find(h => {
        if (partial && !h.startsWith(partial)) return false;
        if (h === 'math.h>' && /\b(sin|cos|sqrt|pow|fabs)\b/.test(fullCode)) return true;
        if (h === 'stdlib.h>' && /\b(malloc|calloc|free|rand|abs)\b/.test(fullCode)) return true;
        if (h === 'conio.h>' && /\b(clrscr|getch|gotoxy|textcolor|kbhit)\b/.test(fullCode)) return true;
        if (h === 'vector>' && /\bvector\b/.test(fullCode)) return true;
        if (h === 'algorithm>' && /\b(sort|reverse|max|min)\b/.test(fullCode)) return true;
        return h.startsWith(partial);
      });
      if (prioritized) return prioritized.slice(partial.length);
    }

    if (/^\s*#\s*in$/.test(currentLine)) return 'clude <stdio.h>';
    if (/^\s*usin$/.test(currentLine) && language === 'cpp') return 'g namespace std;';
    if (/^\s*using\s+name$/.test(currentLine) && language === 'cpp') return 'space std;';

    // Multiline main() signature scaffold
    if (/^\s*int\s+ma?i?$/.test(currentLine)) {
      const tail = currentLine.endsWith('mai') ? 'n' : currentLine.endsWith('ma') ? 'in' : currentLine.endsWith('m') ? 'ain' : 'main';
      if (hasClosingBraceAfter) return `${tail}() {\n${baseIndent}${indentUnit}`;
      const bodyStmt = language === 'cpp' ? 'std::cout << "Hello\\n";' : 'printf("Hello\\n");';
      return `${tail}() {\n${baseIndent}${indentUnit}${bodyStmt}\n${baseIndent}${indentUnit}return 0;\n${baseIndent}}`;
    }

    // Multiline for-loop completion using real bound variable
    if (/^\s*for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*0\s*;\s*$/.test(currentLine)) {
      const idx = RegExp.$1;
      const bound = limitVar && limitVar.name !== idx ? limitVar.name : 'n';
      const printStmt = language === 'cpp' ? `std::cout << ${idx} << " ";` : `printf("%d ", ${idx});`;
      return hasClosingBraceAfter
        ? `${idx} < ${bound}; ${idx}++) {\n${baseIndent}${indentUnit}`
        : `${idx} < ${bound}; ${idx}++) {\n${baseIndent}${indentUnit}${printStmt}\n${baseIndent}}`;
    }
    if (/^\s*for\s*\(\s*$/.test(currentLine)) {
      const idx = !symbols.vars.some(v => v.name === 'i') ? 'i' : 'j';
      const bound = limitVar ? limitVar.name : 'n';
      const printStmt = language === 'cpp' ? `std::cout << ${idx} << " ";` : `printf("%d ", ${idx});`;
      return hasClosingBraceAfter
        ? `int ${idx} = 0; ${idx} < ${bound}; ${idx}++) {\n${baseIndent}${indentUnit}`
        : `int ${idx} = 0; ${idx} < ${bound}; ${idx}++) {\n${baseIndent}${indentUnit}${printStmt}\n${baseIndent}}`;
    }

    // Multiline if / while block
    if (/^\s*if\s*\(\s*$/.test(currentLine) && lastVar && !/^module:/.test(lastVar.type)) {
      return `${lastVar.name} > 0) {\n${baseIndent}${indentUnit}${language === 'cpp' ? `std::cout << ${lastVar.name} << "\\n";` : `printf("%d\\n", ${lastVar.name});`}\n${baseIndent}}`;
    }

    if (/printf\s*\(\s*$/.test(currentLine)) {
      if (lastVar && !/^module:/.test(lastVar.type)) {
        const spec = getFormatSpecifier(lastVar.type);
        return `"${lastVar.name} = ${spec}\\n", ${lastVar.name});`;
      }
      return `"\\n");`;
    }
    if (/scanf\s*\(\s*$/.test(currentLine)) {
      if (lastVar) {
        const spec = getFormatSpecifier(lastVar.type).replace(/\.\d+/, '');
        return `"${spec}", &${lastVar.name});`;
      }
      return `"%d", &n);`;
    }
    if (language === 'cpp' && /(?:std::)?cout\s*<<\s*$/.test(currentLine)) {
      if (lastVar) return `${lastVar.name} << std::endl;`;
      return `"Result: " << std::endl;`;
    }

    const cppDot = currentLine.match(/([a-zA-Z_]\w*)(?:\.|->)$/);
    if (cppDot) {
      const target = symbols.vars.find(v => v.name === cppDot[1]);
      if (target && /vector/.test(target.type)) return currentLine.endsWith('.') ? 'push_back(' : '';
      if (target && /Node/.test(target.type) && currentLine.endsWith('->')) return 'next';
    }

    if (/^\s*retu?r?n?$/.test(currentLine) && currentLine.trim().length >= 3) {
      const rem = 'return'.slice(trimmedLine.length);
      return `${rem} ${lastVar && /sum|res|ans|result|total/i.test(lastVar.name) ? lastVar.name : '0'};`;
    }
    // Pause / next-line suggestion on empty indented line inside C/C++ block
    if (trimmedLine === '' && baseIndent.length >= 2) {
      const forPrev = prevLine.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\b/);
      if (forPrev) {
        const idx = forPrev[1];
        const acc = numericVars.find(v => /^(sum|total|acc)$/i.test(v.name));
        if (acc) return `${acc.name} += ${idx};`;
        return language === 'cpp' ? `std::cout << ${idx} << " ";` : `printf("%d ", ${idx});`;
      }
      if (/\bint\s+main\s*\([^)]*\)\s*\{[\s\S]*$/.test(prefix) && !/\breturn\s+/.test(prefix.slice(prefix.lastIndexOf('main('))) && /\}$/.test(suffix.trim())) {
        if (lastVar && /^(int|float|double|long)$/.test(lastVar.type) && !prefix.includes('printf') && !prefix.includes('cout') && trigger === 'pause') {
          return language === 'cpp' ? `std::cout << ${lastVar.name} << std::endl;\n${baseIndent}return 0;` : `printf("%d\\n", ${lastVar.name});\n${baseIndent}return 0;`;
        }
        return 'return 0;';
      }
    }
  }

  // --- 2. Python Context Predictions (Single-line & Multiline) ---
  if (language === 'python') {
    const modDot = currentLine.match(/([a-zA-Z_]\w*)\.([a-zA-Z_]*)$/);
    if (modDot) {
      const objName = modDot[1];
      const memberPrefix = modDot[2] || '';
      const sym = symbols.vars.find(v => v.name === objName);

      const completeMember = (methods) => {
        const match = methods.find(m => m.name.startsWith(memberPrefix));
        return match ? match.snippet.slice(memberPrefix.length) : '';
      };

      if (objName === 'plt' || sym?.type === 'module:matplotlib.pyplot') {
        const xVar = symbols.vars.find(v => /^(t|x|x_vals|xs)$/.test(v.name));
        const yVar = symbols.vars.find(v => /^(y|y1|y_vals|ys)$/.test(v.name));
        const plotArgs = (xVar && yVar) ? `${xVar.name}, ${yVar.name})` : '';
        const list = [
          { name: 'plot', snippet: `plot(${plotArgs}` },
          { name: 'subplots', snippet: 'subplots()' },
          { name: 'show', snippet: 'show()' },
          { name: 'title', snippet: 'title("")' },
          { name: 'xlabel', snippet: 'xlabel("")' },
          { name: 'ylabel', snippet: 'ylabel("")' },
          { name: 'legend', snippet: 'legend()' },
          { name: 'grid', snippet: 'grid(True)' },
          { name: 'scatter', snippet: `scatter(${plotArgs}` },
          { name: 'bar', snippet: `bar(${plotArgs}` }
        ];
        if (!memberPrefix && prefix.includes('plt.plot(') && !prefix.includes('plt.show(')) return 'show()';
        if (!memberPrefix && xVar && yVar) return `plot(${xVar.name}, ${yVar.name})`;
        const hit = completeMember(list);
        if (hit) return hit;
      }
      if (objName === 'np' || sym?.type === 'module:numpy') {
        const hit = completeMember([
          { name: 'linspace', snippet: 'linspace(0, 10, 100)' },
          { name: 'arange', snippet: 'arange(0, 10, 1)' },
          { name: 'array', snippet: 'array([])' },
          { name: 'zeros', snippet: 'zeros()' },
          { name: 'ones', snippet: 'ones()' },
          { name: 'sin', snippet: 'sin(' },
          { name: 'cos', snippet: 'cos(' },
          { name: 'mean', snippet: 'mean(' },
          { name: 'sum', snippet: 'sum(' }
        ]);
        if (hit) return hit;
      }
      if (objName === 'pd' || sym?.type === 'module:pandas') {
        const hit = completeMember([
          { name: 'DataFrame', snippet: 'DataFrame({' },
          { name: 'Series', snippet: 'Series([' },
          { name: 'read_csv', snippet: 'read_csv("")' }
        ]);
        if (hit) return hit;
      }
      if (objName === 'math' || sym?.type === 'module:math') {
        const numArg = lastVar && !/^module:/.test(lastVar.type) ? lastVar.name : '';
        const hit = completeMember([
          { name: 'sqrt', snippet: numArg ? `sqrt(${numArg})` : 'sqrt(' },
          { name: 'sin', snippet: 'sin(' },
          { name: 'cos', snippet: 'cos(' },
          { name: 'pow', snippet: 'pow(' },
          { name: 'floor', snippet: 'floor(' },
          { name: 'ceil', snippet: 'ceil(' },
          { name: 'pi', snippet: 'pi' }
        ]);
        if (hit) return hit;
      }
      if (sym?.type === 'dataframe') {
        const hit = completeMember([
          { name: 'head', snippet: 'head()' },
          { name: 'describe', snippet: 'describe()' },
          { name: 'info', snippet: 'info()' },
          { name: 'plot', snippet: 'plot()' }
        ]);
        if (hit) return hit;
      }
      if (sym?.type === 'axes') {
        if (!memberPrefix && prefix.includes(`${objName}.plot(`) && !prefix.includes(`${objName}.set_title`)) {
          return 'set_title("Chart")';
        }
        const hit = completeMember([
          { name: 'grid', snippet: 'grid(True)' },
          { name: 'set_title', snippet: 'set_title("Chart")' },
          { name: 'set_xlabel', snippet: 'set_xlabel("")' },
          { name: 'set_ylabel', snippet: 'set_ylabel("")' },
          { name: 'legend', snippet: 'legend()' }
        ]);
        if (hit) return hit;
      }
      if (sym?.type === 'list') {
        const hit = completeMember([
          { name: 'append', snippet: 'append(' },
          { name: 'extend', snippet: 'extend(' },
          { name: 'sort', snippet: 'sort()' }
        ]);
        if (hit) return hit;
      }
      if (sym?.type === 'dict') {
        const hit = completeMember([
          { name: 'get', snippet: 'get(' },
          { name: 'keys', snippet: 'keys()' },
          { name: 'items', snippet: 'items()' }
        ]);
        if (hit) return hit;
      }
    }

    if (/^\s*import\s+mat/.test(currentLine)) return 'matplotlib.pyplot as plt'.slice(trimmedLine.replace(/^import\s+/, '').length);
    if (/^\s*import\s+num/.test(currentLine)) return 'numpy as np'.slice(trimmedLine.replace(/^import\s+/, '').length);
    if (/^\s*import\s+pan/.test(currentLine)) return 'pandas as pd'.slice(trimmedLine.replace(/^import\s+/, '').length);
    if (/^\s*import\s+sea/.test(currentLine)) return 'seaborn as sns'.slice(trimmedLine.replace(/^import\s+/, '').length);

    if (/^\s*if\s+__name__\s*=*$/.test(currentLine)) {
      const hasMain = symbols.funcs.includes('main');
      return `${currentLine.endsWith('==') ? '' : (currentLine.endsWith('=') ? '= ' : ' == ')}"__main__":\n${baseIndent}${indentUnit}${hasMain ? 'main()' : 'pass'}`;
    }

    if (/^\s*for\s+([a-zA-Z_]\w*)\s+in\s*(?:r?a?n?g?)?$/.test(currentLine)) {
      const loopVar = RegExp.$1;
      const iterable = symbols.vars.find(v => /^(list|array|ndarray|dataframe|dict)$/.test(v.type));
      const typedTail = currentLine.split(/\bin\s*/)[1] || '';
      if (!typedTail && iterable) return `${iterable.name}:\n${baseIndent}${indentUnit}print(${loopVar})`;
      const bound = limitVar ? limitVar.name : '10';
      if ('range'.startsWith(typedTail)) return `range(${bound}):\n${baseIndent}${indentUnit}print(${loopVar})`.slice(typedTail.length);
    }

    if (/^\s*prin?t?$/.test(currentLine) && trimmedLine.startsWith('pri')) {
      const typed = trimmedLine;
      const tail = 'print'.slice(typed.length);
      if (lastVar && !/^module:/.test(lastVar.type)) {
        return `${tail}(f"${lastVar.name}: {${lastVar.name}}")`;
      }
      return `${tail}("`;
    }

    if (/^\s*print\(\s*$/.test(currentLine)) {
      if (lastVar && !/^module:/.test(lastVar.type)) {
        return `f"${lastVar.name}: {${lastVar.name}}")`;
      }
    }

    if (/^\s*try\s*:?$/.test(currentLine)) {
      return `${trimmedLine.endsWith(':') ? '' : ':'}\n${baseIndent}${indentUnit}pass\n${baseIndent}except Exception as err:\n${baseIndent}${indentUnit}print("Error:", err)`;
    }

    if (/^\s*def\s+([a-zA-Z_]\w*)\s*$/.test(currentLine)) {
      return `():\n${baseIndent}${indentUnit}`;
    }

    // Empty line / pause next-line predictions in Python
    if (trimmedLine === '') {
      if (baseIndent.length >= 2) {
        const defMatch = prevLine.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\):$/);
        if (defMatch) {
          const firstParam = defMatch[2].split(',')[0]?.split('=')[0]?.split(':')[0]?.trim();
          return firstParam ? `return ${firstParam}` : 'pass';
        }
        const forPy = prevLine.match(/^for\s+([a-zA-Z_]\w*)\s+in\b/);
        if (forPy) {
          const acc = numericVars.find(v => /^(sum|total|acc)$/i.test(v.name));
          return acc ? `${acc.name} += ${forPy[1]}` : `print(${forPy[1]})`;
        }
      } else if (trigger === 'pause') {
        if (prefix.includes('plt.plot(') && !prefix.includes('plt.show(')) {
          return 'plt.grid(True)\nplt.show()';
        }
        if (lastVar && !/^module:/.test(lastVar.type) && !prefix.includes(`print(${lastVar.name})`) && !prefix.includes(`{${lastVar.name}}`)) {
          return `print(f"${lastVar.name}: {${lastVar.name}}")`;
        }
      }
    }
  }

  // --- 3. JavaScript Context Predictions ---
  if (language === 'javascript') {
    const conMatch = currentLine.match(/console\.([a-zA-Z]*)$/);
    if (conMatch && 'log'.startsWith(conMatch[1])) {
      const tail = 'log'.slice(conMatch[1].length);
      return lastVar ? `${tail}('${lastVar.name}:', ${lastVar.name});` : `${tail}();`;
    }
    if (/console\.log\(\s*$/.test(currentLine) && lastVar) {
      return `'${lastVar.name}:', ${lastVar.name});`;
    }
    if (/^\s*for\s*\(\s*$/.test(currentLine)) {
      const arrVar = symbols.vars.find(v => v.type === 'array');
      const bound = arrVar ? `${arrVar.name}.length` : (limitVar ? limitVar.name : '10');
      return hasClosingBraceAfter
        ? `let i = 0; i < ${bound}; i++) {\n${baseIndent}${indentUnit}`
        : `let i = 0; i < ${bound}; i++) {\n${baseIndent}${indentUnit}console.log(i);\n${baseIndent}}`;
    }
    if (/^\s*try\s*$/.test(currentLine)) {
      return ` {\n${baseIndent}${indentUnit}\n${baseIndent}} catch (err) {\n${baseIndent}${indentUnit}console.error(err);\n${baseIndent}}`;
    }
    const jsDot = currentLine.match(/([a-zA-Z_$][\w$]*)\.$/);
    if (jsDot) {
      const v = symbols.vars.find(item => item.name === jsDot[1]);
      if (v?.type === 'array') return 'map((item) => item)';
      if (v?.type === 'canvas2d') return 'fillRect(0, 0, canvas.width, canvas.height);';
    }
    if (trimmedLine === '' && trigger === 'pause' && baseIndent.length === 0 && lastVar && !prefix.includes('console.log(')) {
      return `console.log('${lastVar.name}:', ${lastVar.name});`;
    }
  }

  // --- 4. Java / C# / Go / Rust / PHP / Kotlin Context Predictions ---
  if (language === 'java') {
    if (/System\.out\.p?r?i?n?$/.test(currentLine)) {
      const m = currentLine.match(/System\.out\.(\w*)$/);
      const p = m ? m[1] : '';
      if ('println'.startsWith(p)) return 'println'.slice(p.length) + (lastVar ? `(${lastVar.name});` : '();');
    }
    if (/public\s+static\s+void\s+ma?i?$/.test(currentLine)) {
      const part = trimmedLine.split(/\s+/).pop();
      return 'main'.slice(part.length) + (hasClosingBraceAfter
        ? `(String[] args) {\n${baseIndent}${indentUnit}`
        : `(String[] args) {\n${baseIndent}${indentUnit}System.out.println("Ready");\n${baseIndent}}`);
    }
    if (/^\s*for\s*\(\s*$/.test(currentLine)) {
      return `int i = 0; i < ${limitVar ? limitVar.name : 'n'}; i++) {\n${baseIndent}${indentUnit}System.out.println(i);\n${baseIndent}}`;
    }
  }
  if (language === 'csharp' && /Console\.W?r?i?t?$/.test(currentLine)) {
    const p = currentLine.match(/Console\.(\w*)$/)?.[1] || '';
    if ('WriteLine'.startsWith(p)) return 'WriteLine'.slice(p.length) + (lastVar ? `(${lastVar.name});` : '();');
  }
  if (language === 'csharp' && /^\s*for\s*\(\s*$/.test(currentLine)) {
    return `int i = 0; i < ${limitVar ? limitVar.name : 'n'}; i++) {\n${baseIndent}${indentUnit}Console.WriteLine(i);\n${baseIndent}}`;
  }
  if (language === 'go') {
    if (/fmt\.P?r?i?n?$/.test(currentLine)) {
      const p = currentLine.match(/fmt\.(\w*)$/)?.[1] || '';
      if ('Println'.startsWith(p)) return 'Println'.slice(p.length) + (lastVar ? `(${lastVar.name})` : '()');
    }
    if (/^\s*if\s+err\s*!$/.test(currentLine)) {
      return `= nil {\n${baseIndent}${indentUnit}return err\n${baseIndent}}`;
    }
    if (/^\s*for\s+i\s*:?$/.test(currentLine)) {
      return `= 0; i < ${limitVar ? limitVar.name : 'n'}; i++ {\n${baseIndent}${indentUnit}fmt.Println(i)\n${baseIndent}}`;
    }
  }
  if (language === 'rust') {
    if (/\bprintl?n?$/.test(currentLine) && currentLine.trim().endsWith('printl')) {
      return lastVar ? `n!("{}", ${lastVar.name});` : 'n!("{}");';
    }
    if (/^\s*for\s+i\s+in\s*$/.test(currentLine)) {
      return `0..${limitVar ? limitVar.name : '10'} {\n${baseIndent}${indentUnit}println!("{}", i);\n${baseIndent}}`;
    }
  }
  if (language === 'kotlin') {
    if (/\bprintl?$/.test(currentLine) && trimmedLine.length >= 5) {
      const p = trimmedLine.match(/(\w+)$/)?.[1] || '';
      if ('println'.startsWith(p)) return 'println'.slice(p.length) + (lastVar ? `(${lastVar.name})` : '()');
    }
    if (/^\s*for\s*\(\s*i\s+in\s*$/.test(currentLine)) {
      return `0 until ${limitVar ? limitVar.name : '10'}) {\n${baseIndent}${indentUnit}println(i)\n${baseIndent}}`;
    }
  }
  if (language === 'php') {
    if (/\bech$/.test(currentLine)) {
      return lastVar ? `o $${lastVar.name} . "\\n";` : 'o "\\n";';
    }
    if (/^\s*for\s*\(\s*$/.test(currentLine)) {
      return `$i = 0; $i < 10; $i++) {\n${baseIndent}${indentUnit}echo $i . "\\n";\n${baseIndent}}`;
    }
  }

  // --- 5. Generic Context Symbol Prefix & Function Call Completion (All Languages) ---
  // Skip when completing object members right after '.' or '->'
  const identMatch = currentLine.match(/(^|[^\w.>-])([a-zA-Z_][a-zA-Z0-9_]{1,})$/);
  if (identMatch) {
    const word = identMatch[2];
    const matchFunc = symbols.funcs.find(fn => fn.startsWith(word) && fn.length > word.length);
    if (matchFunc) {
      suggestion = matchFunc.slice(word.length) + '()';
    } else {
      const matchVar = [...symbols.vars].reverse().find(v => v.name.startsWith(word) && v.name.length > word.length);
      if (matchVar) {
        suggestion = matchVar.name.slice(word.length);
      }
    }
  }

  // Context-aware block body suggestion inside an empty indented line of an open loop / accumulator block
  if (!suggestion && trimmedLine === '' && baseIndent.length >= 2) {
    const loopMatch = prevLine.match(/^for\s*(?:\(\s*int\s+)?([a-zA-Z_]\w*)\b/);
    if (loopMatch && numericVars.some(v => /^(sum|total|acc)$/i.test(v.name))) {
      const acc = numericVars.find(v => /^(sum|total|acc)$/i.test(v.name)).name;
      const idx = loopMatch[1];
      suggestion = (language === 'python' || language === 'go' || language === 'kotlin') ? `${acc} += ${idx}` : `${acc} += ${idx};`;
    }
  }

  return stripClosingIfPresent(suggestion, currentLineAfter);
}

module.exports = {
  predictCode,
  analyzeAndPredictContext,
  parseSymbols
};
