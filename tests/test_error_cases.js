function b64encode(str) { return Buffer.from(str, 'utf-8').toString('base64'); }
function b64decode(b64) { if (!b64) return ''; return Buffer.from(b64, 'base64').toString('utf-8'); }

const errorTests = [
  {
    name: '1. C Missing Semicolon',
    lang_id: 103,
    code: '#include <stdio.h>\nint main() {\n    printf("Hello World")\n}'
  },
  {
    name: '2. C Undeclared Variable',
    lang_id: 103,
    code: '#include <stdio.h>\nint main() {\n    undeclared_var = 42;\n    return 0;\n}'
  },
  {
    name: '3. C Missing Bracket',
    lang_id: 103,
    code: '#include <stdio.h>\nint main() {\n    printf("test");\n'
  },
  {
    name: '4. Python Invalid Syntax',
    lang_id: 100,
    code: 'def bad_func(:\n    pass'
  },
  {
    name: '5. C Undefined Function (Linker Error)',
    lang_id: 103,
    code: 'void nonExistentFunc();\nint main() {\n    nonExistentFunc();\n    return 0;\n}'
  },
  {
    name: '6. Python Runtime Exception',
    lang_id: 100,
    code: 'numbers = [1, 2]\nprint(numbers[10])'
  },
  {
    name: '7. Infinite Loop',
    lang_id: 103,
    code: 'int main() { while(1); return 0; }',
    cpu_limit: 1
  }
];

async function run() {
  for (const t of errorTests) {
    const payload = {
      language_id: t.lang_id,
      source_code: b64encode(t.code)
    };
    if (t.cpu_limit) payload.cpu_time_limit = t.cpu_limit;
    
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`=== ${t.name} ===`);
    console.log(`Status: [ID ${data.status?.id}] ${data.status?.description}`);
    if (data.compile_output) console.log(`Compile Output:\n${b64decode(data.compile_output).trim()}`);
    if (data.stderr) console.log(`Stderr:\n${b64decode(data.stderr).trim()}`);
    if (data.message) console.log(`Message: ${b64decode(data.message).trim()}`);
    console.log('-------------------------------------------');
  }
}

run();
