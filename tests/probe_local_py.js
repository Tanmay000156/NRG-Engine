const { spawnSync } = require('child_process');

console.log('Probing Local Python...');
const script = `
for mod in ['matplotlib', 'pygame', 'cv2', 'plotly', 'PIL', 'numpy', 'tkinter', 'turtle']:
    try:
        m = __import__(mod)
        print(f"{mod}: available (version: {getattr(m, '__version__', 'unknown')})")
    except Exception as e:
        print(f"{mod}: NOT available ({e})")
`;

try {
  const res = spawnSync('python', ['-c', script], { encoding: 'utf-8' });
  console.log(res.stdout);
} catch (e) {
  console.error('Local python probe error:', e.message);
}
