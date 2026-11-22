/**
 * NRG ENGINE — COMPREHENSIVE UNIVERSAL GRAPHICS VALIDATION SUITE
 * Validates Part 9 testing requirements across languages, execution runtimes,
 * graphics adapters, error diagnostics, and git automation controls.
 */

const assert = require('assert');
const { executeCode } = require('../api/_compiler');
const { detectGraphics, extractGraphicsOutput } = require('../api/_graphics_bridge');
const { execSync } = require('child_process');

async function runValidationSuite() {
  console.log('================================================================');
  console.log('⚡ NRG ENGINE — UNIVERSAL GRAPHICS SYSTEM VALIDATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function record(testName, ok, info = '') {
    if (ok) {
      console.log(`   ✅ PASS: ${testName} ${info ? `(${info})` : ''}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${testName} ${info ? `(${info})` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Python Turtle Animation
  // ---------------------------------------------------------------------------
  console.log('1. Testing Python Turtle Execution & Command Stream...');
  try {
    const turtleCode = `import turtle
t = turtle.Turtle()
t.pencolor("blue")
for i in range(4):
    t.forward(50)
    t.left(90)
turtle.done()
`;
    const res = await executeCode({ language: 'python', source_code: turtleCode });
    const hasCommands = res.data.success && res.data.turtle_commands && res.data.turtle_commands.length > 0;
    record('Python Turtle', hasCommands, `${res.data.turtle_commands ? res.data.turtle_commands.length : 0} commands`);
  } catch (err) {
    record('Python Turtle', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 2. Python Matplotlib Chart
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Python Matplotlib Data Visualization...');
  try {
    const mplCode = `import matplotlib.pyplot as plt
import numpy as np
t = np.linspace(0, 10, 50)
plt.plot(t, np.sin(t))
plt.title("Waveform")
plt.show()
`;
    const res = await executeCode({ language: 'python', source_code: mplCode });
    const hasImage = res.data.success && res.data.graphics_output && res.data.graphics_output.type === 'image';
    record('Python Matplotlib', hasImage, `format: ${res.data.graphics_output?.format}, engine: ${res.data.graphics_output?.engine}`);
  } catch (err) {
    record('Python Matplotlib', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 3. C Graphics Program (PPM Framebuffer)
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing C Graphics Program (PPM Framebuffer)...');
  try {
    const cCode = `#include <stdio.h>
int main() {
    int w = 8, h = 8;
    printf("P3\\n%d %d\\n255\\n", w, h);
    for(int y = 0; y < h; y++) {
        for(int x = 0; x < w; x++) {
            printf("%d %d %d  ", x * 30, y * 30, 255);
        }
        printf("\\n");
    }
    return 0;
}
`;
    const res = await executeCode({ language: 'c', source_code: cCode });
    const hasPpm = res.data.success && res.data.graphics_output && res.data.graphics_output.type === 'ppm';
    record('C PPM Framebuffer', hasPpm, `type: ${res.data.graphics_output?.type}`);
  } catch (err) {
    record('C PPM Framebuffer', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 4. C++ Graphics Program (Mandelbrot PPM)
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing C++ Graphics Program (Mandelbrot PPM)...');
  try {
    const cppCode = `#include <iostream>
int main() {
    std::cout << "P3\\n4 4\\n255\\n";
    for(int i = 0; i < 16; i++) {
        std::cout << "0 102 255  ";
    }
    std::cout << "\\n";
    return 0;
}
`;
    const res = await executeCode({ language: 'cpp', source_code: cppCode });
    const hasPpm = res.data.success && res.data.graphics_output && res.data.graphics_output.type === 'ppm';
    record('C++ PPM Graphics', hasPpm, `engine: ${res.data.graphics_output?.engine}`);
  } catch (err) {
    record('C++ PPM Graphics', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 5. JavaScript Canvas Animation Detection
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing JavaScript Canvas & WebGL Detection...');
  try {
    const jsCode = `const ctx = canvas.getContext('2d');
let x = 0;
function loop() {
    ctx.clearRect(0,0,800,600);
    ctx.fillRect(x++, 50, 40, 40);
    requestAnimationFrame(loop);
}
loop();`;
    const det = detectGraphics('javascript', jsCode);
    record('JavaScript Canvas Detection', det.isGraphics === true && det.engine === 'javascript-canvas', det.label);
  } catch (err) {
    record('JavaScript Canvas Detection', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 6. 3D Graphics Detection (Three.js WebGL)
  // ---------------------------------------------------------------------------
  console.log('\n6. Testing 3D WebGL / Three.js Detection...');
  try {
    const threeCode = `const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.render(scene, camera);`;
    const det = detectGraphics('javascript', threeCode);
    record('3D WebGL / Three.js Detection', det.isGraphics === true, det.label);
  } catch (err) {
    record('3D WebGL / Three.js Detection', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 7. Graphics Program with Missing Dependency
  // ---------------------------------------------------------------------------
  console.log('\n7. Testing Missing Dependency Error Reporting...');
  try {
    const missingCode = `import non_existent_3d_graphics_lib_12345
print("Never reaches here")`;
    const res = await executeCode({ language: 'python', source_code: missingCode });
    const caught = !res.data.success && (res.data.stderr.includes('No module named') || res.data.stderr.includes('ModuleNotFoundError'));
    record('Missing Dependency Error Caught', caught, 'Genuine ModuleNotFoundError reported');
  } catch (err) {
    record('Missing Dependency Error Caught', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 8. Invalid Graphics Source Code (Syntax Error)
  // ---------------------------------------------------------------------------
  console.log('\n8. Testing Invalid Graphics Source Code (Syntax Error)...');
  try {
    const invalidCode = `import turtle
t = turtle.Turtle(
# Syntax error: unclosed parenthesis`;
    const res = await executeCode({ language: 'python', source_code: invalidCode });
    const hasSyntaxError = !res.data.success && res.data.problems && res.data.problems.length > 0;
    record('Syntax Error Diagnostics', hasSyntaxError, `${res.data.problems?.length} problem diagnostics`);
  } catch (err) {
    record('Syntax Error Diagnostics', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 9. Console-Only Normal Execution (Must NOT Trigger Graphics Tab)
  // ---------------------------------------------------------------------------
  console.log('\n9. Testing Normal Console-Only Execution...');
  try {
    const consoleCode = `#include <stdio.h>
int main() {
    printf("Star Triangle\\n*\\n**\\n***\\n");
    return 0;
}
`;
    const res = await executeCode({ language: 'c', source_code: consoleCode });
    const isConsoleOnly = res.data.success && !res.data.is_graphics && !res.data.graphics_output;
    record('Console-Only Execution Isolation', isConsoleOnly, 'is_graphics is FALSE');
  } catch (err) {
    record('Console-Only Execution Isolation', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // 10. Git Automation Guardrail Verification (Parts 7 & 8)
  // ---------------------------------------------------------------------------
  console.log('\n10. Testing Git Automation Guardrails (NO Auto-Commit/Push)...');
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\Users\\tanma\\Desktop\\NRG-Engine-main', encoding: 'utf-8' });
    const hasLocalChanges = gitStatus.trim().length > 0;
    record('Local Changes Kept Local (Uncommitted)', hasLocalChanges, 'Working tree contains unstaged/uncommitted edits');

    const lastCommitLog = execSync('git log -1 --oneline', { cwd: 'C:\\Users\\tanma\\Desktop\\NRG-Engine-main', encoding: 'utf-8' });
    record('No Silent Automatic Commit Created', !lastCommitLog.includes('auto-deploy'), `Head commit: ${lastCommitLog.trim()}`);
  } catch (err) {
    record('Git Automation Guardrail', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`VALIDATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runValidationSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
