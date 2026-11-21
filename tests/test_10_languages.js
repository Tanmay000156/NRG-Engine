function b64encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function b64decode(b64) {
  if (!b64) return '';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

const tests = [
  {
    lang: 'c',
    name: 'C (GCC)',
    id: 103, // fallback 50
    code: '#include <stdio.h>\nint main() { printf("Hello from C!\\n"); return 0; }'
  },
  {
    lang: 'cpp',
    name: 'C++ (GCC)',
    id: 105, // fallback 54
    code: '#include <iostream>\nint main() { std::cout << "Hello from C++!" << std::endl; return 0; }'
  },
  {
    lang: 'java',
    name: 'Java (JDK)',
    id: 91, // fallback 62
    code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}'
  },
  {
    lang: 'python',
    name: 'Python',
    id: 100, // fallback 71
    code: 'print("Hello from Python!")'
  },
  {
    lang: 'javascript',
    name: 'JavaScript (Node.js)',
    id: 102, // fallback 63
    code: 'console.log("Hello from JavaScript!");'
  },
  {
    lang: 'csharp',
    name: 'C# (Mono)',
    id: 51,
    code: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}'
  },
  {
    lang: 'go',
    name: 'Go',
    id: 107, // fallback 60
    code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello from Go!")\n}'
  },
  {
    lang: 'rust',
    name: 'Rust',
    id: 108, // fallback 73
    code: 'fn main() {\n    println!("Hello from Rust!");\n}'
  },
  {
    lang: 'php',
    name: 'PHP',
    id: 98, // fallback 68
    code: '<?php\necho "Hello from PHP!\\n";\n?>'
  },
  {
    lang: 'kotlin',
    name: 'Kotlin',
    id: 111, // fallback 78
    code: 'fun main() {\n    println("Hello from Kotlin!")\n}'
  }
];

async function runTest(t) {
  try {
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: t.id,
        source_code: b64encode(t.code)
      })
    });
    const data = await res.json();
    const stdout = b64decode(data.stdout).trim();
    const stderr = b64decode(data.stderr).trim();
    const compileOutput = b64decode(data.compile_output).trim();
    console.log(`[${t.lang.toUpperCase()}] ID: ${t.id} - Status: ${data.status?.description} - Output: "${stdout}" ${stderr ? 'Stderr: ' + stderr : ''} ${compileOutput ? 'Compile: ' + compileOutput : ''}`);
    return { ok: data.status?.id === 3, stdout };
  } catch (e) {
    console.error(`[${t.lang.toUpperCase()}] Failed:`, e.message);
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log('Testing all 10 languages on Judge0 CE...');
  for (const t of tests) {
    await runTest(t);
  }
}

main();
