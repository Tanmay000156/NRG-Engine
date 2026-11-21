/**
 * NRG ENGINE — COMPILER BACKEND SERVICE
 * Multi-Language Execution Service powered by Judge0 CE Sandbox
 * 
 * Supported Languages:
 * C, C++, Java, Python, JavaScript, C#, Go, Rust, PHP, Kotlin
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || ''; // Optional RapidAPI Key

// 1. Language Definitions & Judge0 IDs
const LANGUAGE_REGISTRY = {
  c: {
    id: 103, // C (GCC 14.1.0)
    fallbackId: 50, // C (GCC 9.2.0)
    name: 'C (GCC 14.1.0)',
    compiler: 'gcc',
    file: 'main.c'
  },
  cpp: {
    id: 105, // C++ (GCC 14.1.0)
    fallbackId: 54, // C++ (GCC 9.2.0)
    name: 'C++ (GCC 14.1.0)',
    compiler: 'g++',
    file: 'main.cpp'
  },
  java: {
    id: 91, // Java (JDK 17.0.6)
    fallbackId: 62, // Java (OpenJDK 13.0.1)
    name: 'Java (JDK 17.0.6)',
    compiler: 'javac',
    file: 'Main.java'
  },
  python: {
    id: 100, // Python (3.12.5)
    fallbackId: 71, // Python (3.8.1)
    name: 'Python (3.12.5)',
    compiler: 'python3',
    file: 'main.py'
  },
  javascript: {
    id: 102, // JavaScript (Node.js 22.08.0)
    fallbackId: 63, // Node.js 12.14.0
    name: 'JavaScript (Node.js 22.08.0)',
    compiler: 'node',
    file: 'script.js'
  },
  csharp: {
    id: 51, // C# (Mono 6.6.0.161)
    fallbackId: 51,
    name: 'C# (Mono 6.6.0)',
    compiler: 'mcs / mono',
    file: 'Program.cs'
  },
  go: {
    id: 107, // Go (1.23.5)
    fallbackId: 60, // Go 1.13.5
    name: 'Go (1.23.5)',
    compiler: 'go build',
    file: 'main.go'
  },
  rust: {
    id: 108, // Rust (1.85.0)
    fallbackId: 73, // Rust 1.40.0
    name: 'Rust (1.85.0)',
    compiler: 'rustc',
    file: 'main.rs'
  },
  php: {
    id: 98, // PHP (8.3.11)
    fallbackId: 68, // PHP 7.4.1
    name: 'PHP (8.3.11)',
    compiler: 'php',
    file: 'index.php'
  },
  kotlin: {
    id: 111, // Kotlin (2.1.10)
    fallbackId: 78, // Kotlin 1.3.70
    name: 'Kotlin (2.1.10)',
    compiler: 'kotlinc',
    file: 'Main.kt'
  }
};

// Base64 Helpers
function b64encode(str) {
  if (str === null || str === undefined) return '';
  return Buffer.from(str, 'utf-8').toString('base64');
}

function b64decode(b64) {
  if (!b64) return '';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

// Compiler Diagnostics Parser
function parseDiagnostics(compileOutput, stderr, lang) {
  const problems = [];
  const rawText = (compileOutput || '') + '\n' + (stderr || '');
  if (!rawText.trim()) return problems;

  // 1. GCC / Clang (C, C++) & Kotlin & generic file:line:col: severity: msg
  const gccRegex = /(?:^|\n)(?:(?:\/box\/|main\.[a-z0-9]+|[^:\n]+)):(\d+):(\d+):\s*(error|warning|fatal error|note):\s*([^\n]+)/gi;
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

  // 3. Rust: error[E0425]: cannot find value ... --> src/main.rs:2:5
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

  // 4. Go: ./main.go:4:2: undefined: fmt.Printl
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

  // 5. C# Mono: main.cs(4,9): error CS0103: The name 'foo' does not exist
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

  // 6. Python: File "/box/script.py", line 1 ... SyntaxError / Exception
  const pyLineRegex = /File "([^"]+)", line (\d+)(?:, in [^\n]+)?(?:\n\s+[^\n]+)?(?:\n\s+\^~*)?(?:\n([A-Za-z0-9_]+Error:[^\n]+|SyntaxError:[^\n]+))?/g;
  while ((match = pyLineRegex.exec(rawText)) !== null) {
    const line = parseInt(match[2], 10);
    const msg = match[3] || 'Runtime error encountered';
    problems.push({
      file: 'main.py',
      line: line,
      column: 1,
      severity: 'error',
      message: msg.trim(),
      raw: match[0].trim()
    });
  }

  // 7. PHP: Parse error: syntax error ... on line 3
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

// Request submission to Judge0 CE
async function submitToJudge0(languageId, sourceCode, stdin) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = url.parse(JUDGE0_API_URL).host;
  }

  const payload = {
    language_id: languageId,
    source_code: b64encode(sourceCode),
    stdin: b64encode(stdin || ''),
    cpu_time_limit: 5.0,     // 5 seconds CPU time limit
    cpu_extra_time: 1.0,
    wall_time_limit: 10.0,   // 10 seconds Wall time limit
    memory_limit: 128000,    // 128 MB RAM
    max_file_size: 1024      // 1 MB max file
  };

  const endpoint = `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Judge0 API error HTTP ${response.status}: ${errText}`);
  }

  let result = await response.json();

  // If status is queued or processing (id <= 2), poll until resolved or timeout
  if (result.status && result.status.id <= 2 && result.token) {
    const startTime = Date.now();
    while (result.status && result.status.id <= 2 && (Date.now() - startTime) < 12000) {
      await new Promise(r => setTimeout(r, 600));
      const pollEndpoint = `${JUDGE0_API_URL}/submissions/${result.token}?base64_encoded=true`;
      const pollRes = await fetch(pollEndpoint, { headers });
      if (pollRes.ok) {
        result = await pollRes.json();
      }
    }
  }

  return result;
}

// Set standard CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Health Endpoint
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'NRG Engine Compiler Backend',
      backend: 'Judge0 CE',
      version: '1.0.0',
      supported_languages: Object.keys(LANGUAGE_REGISTRY)
    }));
    return;
  }

  // 2. Languages Endpoint
  if (req.method === 'GET' && pathname === '/api/languages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(LANGUAGE_REGISTRY));
    return;
  }

  // 3. Execution Endpoint (POST /api/execute)
  if (req.method === 'POST' && pathname === '/api/execute') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB max
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const langKey = (payload.language || '').toLowerCase().trim();
        const sourceCode = payload.source_code || '';
        const stdin = payload.stdin || '';

        if (!langKey || !LANGUAGE_REGISTRY[langKey]) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: `Unsupported language: '${langKey}'. Supported: ${Object.keys(LANGUAGE_REGISTRY).join(', ')}`
          }));
          return;
        }

        const langData = LANGUAGE_REGISTRY[langKey];

        // Call Judge0 API
        let judge0Result;
        try {
          judge0Result = await submitToJudge0(langData.id, sourceCode, stdin);
        } catch (apiErr) {
          // Attempt fallback ID if primary ID had an issue
          if (langData.fallbackId && langData.fallbackId !== langData.id) {
            try {
              judge0Result = await submitToJudge0(langData.fallbackId, sourceCode, stdin);
            } catch (fallbackErr) {
              throw apiErr;
            }
          } else {
            throw apiErr;
          }
        }

        // Decode Base64 Output Fields
        const stdout = b64decode(judge0Result.stdout);
        const stderr = b64decode(judge0Result.stderr);
        const compileOutput = b64decode(judge0Result.compile_output);
        const message = b64decode(judge0Result.message);
        const statusId = judge0Result.status ? judge0Result.status.id : 0;
        const statusDesc = judge0Result.status ? judge0Result.status.description : 'Unknown';

        // Parse Diagnostics
        const problems = parseDiagnostics(compileOutput, stderr, langKey);

        // Success is strictly statusId === 3 (Accepted) AND exit_code === 0
        const isCompilationSuccess = statusId !== 6; // Status 6 is Compilation Error
        const isExecutionSuccess = statusId === 3;

        const responseData = {
          success: isExecutionSuccess,
          status: {
            id: statusId,
            description: statusDesc
          },
          compilation_success: isCompilationSuccess,
          stdout: stdout,
          stderr: stderr,
          compile_output: compileOutput,
          message: message,
          exit_code: judge0Result.exit_code !== undefined && judge0Result.exit_code !== null ? judge0Result.exit_code : (isExecutionSuccess ? 0 : 1),
          time: judge0Result.time || '0.000',
          memory: judge0Result.memory || 0,
          problems: problems,
          language: langKey,
          compiler: langData.name,
          execution_mode: 'Judge0 Isolated Sandbox'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));

      } catch (err) {
        console.error('Execution handler error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Compiler Service Error: ${err.message}`,
          backend_error: true
        }));
      }
    });
    return;
  }

  // 4. Static File Server (Serving NRG Engine UI)
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ NRG ENGINE — COMPILER BACKEND SERVER ONLINE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔧 Execution Endpoint: http://localhost:${PORT}/api/execute`);
  console.log(`🛡 Mode: Real Multi-Language Compiler (Judge0 CE)`);
  console.log(`====================================================`);
});
