const { submitToJudge0 } = require('../api/_compiler');

async function probe() {
  console.log('Probing Judge0 Python 3.12 (id 100)...');
  const code = `
import sys
for mod in ['matplotlib', 'pygame', 'cv2', 'plotly', 'PIL', 'numpy', 'tkinter']:
    try:
        m = __import__(mod)
        print(f"{mod}: available (version: {getattr(m, '__version__', 'unknown')})")
    except Exception as e:
        print(f"{mod}: NOT available ({e})")
`;

  try {
    const res = await submitToJudge0(100, code, '');
    const stdout = Buffer.from(res.stdout || '', 'base64').toString('utf-8');
    const stderr = Buffer.from(res.stderr || '', 'base64').toString('utf-8');
    console.log('--- STDOUT ---');
    console.log(stdout);
    if (stderr) console.log('--- STDERR ---\n', stderr);
  } catch (err) {
    console.error('Probe failed:', err.message);
  }
}

probe();
