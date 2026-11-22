const fs = require('fs');
const lines = fs.readFileSync('C:/Users/tanma/.gemini/antigravity-cli/brain/c01c1d9c-ad02-407b-b604-cfdd966075d3/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');
const userLines = lines.filter(l => l.includes('"source":"USER_EXPLICIT"'));
console.log('User lines count:', userLines.length);
if (userLines.length > 0) {
  const last = userLines[userLines.length - 1];
  console.log('Full last user message:\n', JSON.parse(last).content);
}
