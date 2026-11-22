const fs = require('fs');
const path = require('path');

const compilerPath = path.resolve(__dirname, '../api/_compiler.js');
let code = fs.readFileSync(compilerPath, 'utf8');

// 1. Remove spawnSync import
code = code.replace("const { spawnSync } = require('child_process');\n", "");

// 2. Remove runLocalPython function definition
const runLocalPythonTarget = `// Local Python Execution Fallback (if Judge0 unreachable)
function runLocalPython(code, stdin) {
  try {
    const res = spawnSync('python', ['-c', code], {
      input: stdin || '',
      encoding: 'utf-8',
      timeout: 10000
    });
    return {
      status: {
        id: res.status === 0 ? 3 : 11,
        description: res.status === 0 ? 'Accepted' : 'Runtime Error'
      },
      stdout: Buffer.from(res.stdout || '', 'utf-8').toString('base64'),
      stderr: Buffer.from(res.stderr || '', 'utf-8').toString('base64'),
      compile_output: null,
      message: null,
      exit_code: res.status !== null ? res.status : 1,
      time: '0.040',
      memory: 2048
    };
  } catch (e) {
    return null;
  }
}`;

code = code.replace(runLocalPythonTarget, `// Security Hardening: Arbitrary local server code execution removed per NRG Engine 2.0 directive.
// All user programs run exclusively within isolated remote sandbox containers.`);

// 3. Update executeCode to validate payloads and handle Judge0 errors cleanly without local fallback
const oldExecuteBlock = `  let judge0Result;
  try {
    judge0Result = await submitToJudge0(langData.id, codeToExecute, stdin || '');
  } catch (apiErr) {
    // Attempt fallback ID if primary ID had an issue
    if (langData.fallbackId && langData.fallbackId !== langData.id) {
      try {
        judge0Result = await submitToJudge0(langData.fallbackId, codeToExecute, stdin || '');
      } catch (fallbackErr) {
        if (langKey === 'python') {
          judge0Result = runLocalPython(codeToExecute, stdin);
          if (!judge0Result) throw apiErr;
        } else {
          throw apiErr;
        }
      }
    } else if (langKey === 'python') {
      judge0Result = runLocalPython(codeToExecute, stdin);
      if (!judge0Result) throw apiErr;
    } else {
      throw apiErr;
    }
  }

  // If Judge0 failed with missing Python library (e.g. matplotlib/cv2) and local Python is available, attempt local run
  if (langKey === 'python' && judge0Result && judge0Result.status && judge0Result.status.id !== 3) {
    const rawStderr = b64decode(judge0Result.stderr);
    if (rawStderr.includes('No module named') || rawStderr.includes('ModuleNotFoundError')) {
      const localRun = runLocalPython(codeToExecute, stdin);
      if (localRun && localRun.status && localRun.status.id === 3) {
        judge0Result = localRun;
      }
    }
  }`;

const newExecuteBlock = `  // Input payload validation & limits (Security Hardening)
  if (typeof source_code !== 'string' || source_code.length > 262144) {
    return {
      status: 400,
      data: {
        success: false,
        status: { id: 14, description: 'Payload Too Large' },
        error: 'Source code exceeds maximum permitted payload limit (256 KB).'
      }
    };
  }

  if (stdin && (typeof stdin !== 'string' || stdin.length > 65536)) {
    return {
      status: 400,
      data: {
        success: false,
        status: { id: 14, description: 'Payload Too Large' },
        error: 'STDIN exceeds maximum permitted payload limit (64 KB).'
      }
    };
  }

  let judge0Result;
  try {
    judge0Result = await submitToJudge0(langData.id, codeToExecute, stdin || '');
  } catch (apiErr) {
    // Attempt secondary fallback compiler ID on Judge0 if available
    if (langData.fallbackId && langData.fallbackId !== langData.id) {
      try {
        judge0Result = await submitToJudge0(langData.fallbackId, codeToExecute, stdin || '');
      } catch (fallbackErr) {
        console.error('Judge0 primary and secondary compilers unreachable:', fallbackErr.message);
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
    } else {
      console.error('Judge0 compiler unreachable:', apiErr.message);
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
  }`;

if (code.includes(oldExecuteBlock)) {
  code = code.replace(oldExecuteBlock, newExecuteBlock);
  console.log('Successfully replaced executeCode block with hardened implementation');
} else {
  console.error('oldExecuteBlock not found!');
  process.exit(1);
}

// 4. Update execution_mode in responseData
code = code.replace("execution_mode: judge0Result.memory === 2048 ? 'Local Python Environment' : 'Judge0 Isolated Sandbox',",
                    "execution_mode: 'Judge0 Isolated Sandbox',");

fs.writeFileSync(compilerPath, code, 'utf8');
console.log('Successfully updated api/_compiler.js with security hardening');
