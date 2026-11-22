const { detectGraphics, prepareExecutionCode, extractGraphicsOutput } = require('../api/_graphics_bridge');
const assert = require('assert');

function runTests() {
  console.log('Testing Universal Graphics Bridge...\n');

  // 1. Detection Tests
  console.log('1. Testing Graphics Detection...');
  assert.strictEqual(detectGraphics('python', 'import turtle').isGraphics, true);
  assert.strictEqual(detectGraphics('python', 'import matplotlib.pyplot as plt').isGraphics, true);
  assert.strictEqual(detectGraphics('python', 'import cv2\nimg = cv2.imread()').isGraphics, true);
  assert.strictEqual(detectGraphics('javascript', 'const ctx = canvas.getContext("2d")').isGraphics, true);
  assert.strictEqual(detectGraphics('c', 'printf("P3\\n%d %d\\n255\\n", w, h);').isGraphics, true);
  assert.strictEqual(detectGraphics('java', 'BufferedImage img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);').isGraphics, true);
  assert.strictEqual(detectGraphics('python', 'print("Hello world")').isGraphics, false);
  console.log('   ✅ Detection tests passed');

  // 2. Extraction Tests
  console.log('\n2. Testing Extraction from Stdout...');
  
  // A. Graphics Stream
  const rawStream = 'Console log\n__NRG_GRAPHICS_STREAM_START__{"type":"image","engine":"matplotlib","data":"data:image/png;base64,AAA"}__NRG_GRAPHICS_STREAM_END__\nMore text';
  const resStream = extractGraphicsOutput(rawStream);
  assert.strictEqual(resStream.graphicsOutput.engine, 'matplotlib');
  assert.strictEqual(resStream.graphicsOutput.type, 'image');
  assert.strictEqual(resStream.stdout.includes('Console log'), true);
  assert.strictEqual(resStream.stdout.includes('__NRG_GRAPHICS_STREAM'), false);
  console.log('   ✅ Matplotlib graphics stream extraction passed');

  // B. PPM Framebuffer
  const ppmText = 'Building scene...\nP3\n2 2\n255\n255 0 0  0 255 0\n0 0 255  255 255 255\n';
  const resPpm = extractGraphicsOutput(ppmText);
  assert.strictEqual(resPpm.graphicsOutput.type, 'ppm');
  assert.strictEqual(resPpm.graphicsOutput.engine, 'c-framebuffer');
  assert.strictEqual(resPpm.graphicsOutput.data.startsWith('P3'), true);
  console.log('   ✅ PPM framebuffer extraction passed');

  // C. SVG Output
  const svgText = 'Generating diagram...\n<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>\nDone';
  const resSvg = extractGraphicsOutput(svgText);
  assert.strictEqual(resSvg.graphicsOutput.type, 'svg');
  assert.strictEqual(resSvg.graphicsOutput.data.includes('<circle'), true);
  console.log('   ✅ SVG extraction passed');

  console.log('\n🎉 ALL GRAPHICS BRIDGE UNIT TESTS PASSED!');
}

runTests();
