const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const pIdx = html.indexOf('const GRAPHICS_PRESETS');
if (pIdx !== -1) {
  console.log('GRAPHICS_PRESETS found:\n', html.slice(pIdx, pIdx + 1200));
} else {
  const btnPresets = [...html.matchAll(/data-preset="([^"]+)"/g)].map(m => m[1]);
  console.log('Preset buttons:', btnPresets);
  const pLoaders = [...html.matchAll(/function loadGraphicsPreset\(([^)]+)\)/g)];
  console.log('Preset functions:', pLoaders.map(m => m[0]));
}
