const { executeCode } = require('../api/_compiler');

async function testUniversalCompiler() {
  console.log('Testing Universal Compiler & Graphics Bridge...\n');

  // Test 1: Python Matplotlib
  console.log('1. Testing Python Matplotlib Execution...');
  const pyPlotCode = `
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(4, 3))
ax.plot([1, 2, 3, 4], [1, 4, 9, 16], color='blue', marker='o')
ax.set_title("NRG Test Plot")
plt.show()
`;
  const plotRes = await executeCode({
    language: 'python',
    source_code: pyPlotCode,
    stdin: ''
  });

  if (plotRes.data.success && plotRes.data.graphics_output) {
    console.log('   ✅ Matplotlib rendered successfully!');
    console.log('   Engine:', plotRes.data.graphics_output.engine);
    console.log('   Type:', plotRes.data.graphics_output.type);
    console.log('   Data URL starts with:', plotRes.data.graphics_output.data.slice(0, 30));
  } else {
    console.log('   ⚠️ Plot result:', plotRes.data.status, plotRes.data.stderr || plotRes.data.stdout);
  }

  // Test 2: C PPM Graphics
  console.log('\n2. Testing C PPM Framebuffer Execution...');
  const cPpmCode = `
#include <stdio.h>
int main() {
    int w = 3, h = 3;
    printf("P3\\n%d %d\\n255\\n", w, h);
    for(int y = 0; y < h; y++) {
        for(int x = 0; x < w; x++) {
            printf("%d %d %d  ", x * 80, y * 80, 200);
        }
        printf("\\n");
    }
    return 0;
}
`;
  const cPpmRes = await executeCode({
    language: 'c',
    source_code: cPpmCode,
    stdin: ''
  });

  if (cPpmRes.data.success && cPpmRes.data.graphics_output) {
    console.log('   ✅ C PPM Framebuffer captured successfully!');
    console.log('   Engine:', cPpmRes.data.graphics_output.engine);
    console.log('   Type:', cPpmRes.data.graphics_output.type);
  } else {
    console.error('   ❌ C PPM failed:', cPpmRes.data);
  }

  // Test 3: Console-only program (C star triangle)
  console.log('\n3. Testing Console-only program (is_graphics should be false)...');
  const cCode = `#include <stdio.h>\nint main(){ printf("Hello\\n"); return 0; }`;
  const cRes = await executeCode({
    language: 'c',
    source_code: cCode,
    stdin: ''
  });
  console.log('   is_graphics:', cRes.data.is_graphics);
  if (cRes.data.is_graphics === false) {
    console.log('   ✅ Correctly classified as console-only!');
  } else {
    console.error('   ❌ Incorrectly classified as graphics');
  }

  console.log('\n🎉 ALL UNIVERSAL COMPILER TESTS COMPLETED!');
}

testUniversalCompiler().catch(err => {
  console.error('Test failed:', err);
});
