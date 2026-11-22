const { execSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPath = 'C:\\Users\\tanma\\.gemini\\antigravity-cli\\brain\\c01c1d9c-ad02-407b-b604-cfdd966075d3\\live_vercel_check.png';
const cmd = `"${chromePath}" --headless --disable-gpu --screenshot="${outPath}" --window-size=1920,1080 "https://nrg-engine.vercel.app"`;
console.log('Running:', cmd);
execSync(cmd, { stdio: 'inherit' });
console.log('Screenshot captured!');
