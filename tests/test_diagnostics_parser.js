function parseDiagnostics(compileOutput, stderr, lang) {
  const problems = [];
  const rawText = (compileOutput || '') + '\n' + (stderr || '');
  if (!rawText.trim()) return problems;

  // 1. GCC / Clang (C, C++) & Kotlin & generic file:line:col: severity: msg
  const gccRegex = /(?:^|\n)(?:(?:\/box\/|main\.[a-z0-9]+|[^:\n]+)):(\d+):(\d+):\s*(error|warning|fatal error|note):\s*([^\n]+)/gi;
  let match;
  while ((match = gccRegex.exec(rawText)) !== null) {
    problems.push({
      file: 'source',
      line: parseInt(match[1], 10),
      column: parseInt(match[2], 10),
      severity: match[3].toLowerCase().includes('error') ? 'error' : 'warning',
      message: match[4].trim(),
      raw: match[0].trim()
    });
  }

  // 2. Java: Main.java:3: error: ';' expected
  const javaRegex = /(?:^|\n)(?:Main\.java|[^:\n]+):(\d+):\s*(error|warning):\s*([^\n]+)/gi;
  while ((match = javaRegex.exec(rawText)) !== null) {
    if (!problems.some(p => p.line === parseInt(match[1], 10) && p.message === match[3].trim())) {
      problems.push({
        file: 'Main.java',
        line: parseInt(match[1], 10),
        column: 1,
        severity: match[2].toLowerCase(),
        message: match[3].trim(),
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
    const msg = match[3] || 'Runtime exception occurred';
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

// Test with C sample
const cOut = `main.c: In function 'main':
main.c:3:26: error: expected ';' before '}' token
    3 |     printf("Hello World")
      |                          ^
      |                          ;
    4 | }
      | ~`;
console.log('C Problems:', parseDiagnostics(cOut, '', 'c'));

// Test with Python sample
const pyOut = `File "/box/script.py", line 1
    def bad_func(:
                 ^
SyntaxError: invalid syntax`;
console.log('Python Problems:', parseDiagnostics('', pyOut, 'python'));
