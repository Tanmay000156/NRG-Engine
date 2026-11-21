// Test editor keyboard helpers
let val = 'int main() {}';
let start = 12; // right between { and }
let lines = val.substring(0, start).split('\n');
let curLine = lines[lines.length - 1];
let indent = curLine.match(/^\s*/)[0];
console.log('Indent:', JSON.stringify(indent));
if (val[start - 1] === '{' && val[start] === '}') {
  let insert = '\n' + indent + '    \n' + indent;
  let next = val.substring(0, start) + insert + val.substring(start);
  console.log('Result:\n' + next);
}

// Test backspace pair
let testPair = 'foo()bar';
let pos = 5; // right between ( and )
let pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
if (pairs[testPair[pos - 1]] === testPair[pos]) {
  let del = testPair.substring(0, pos - 1) + testPair.substring(pos + 1);
  console.log('Backspace pair result:', del);
}
