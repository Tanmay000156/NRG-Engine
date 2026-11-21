function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAnsiTerminal(text) {
  if (!text) return '';
  let escaped = escapeHtml(text);
  const ansiColorMap = {
    '30': 'color:#4b5563;',
    '31': 'color:#ef4444;',
    '32': 'color:#22c55e;',
    '33': 'color:#eab308;',
    '34': 'color:#3b82f6;',
    '35': 'color:#a855f7;',
    '36': 'color:#06b6d4;',
    '37': 'color:#f3f4f6;',
    '1': 'font-weight:bold;'
  };
  escaped = escaped.replace(/(?:\x1b|\u001b)\[([0-9;]*)m/g, (match, codes) => {
    if (!codes || codes === '0') return '</span>';
    const parts = codes.split(';');
    let styles = '';
    for (const code of parts) {
      if (ansiColorMap[code]) styles += ansiColorMap[code];
    }
    return styles ? `<span style="${styles}">` : '';
  });
  return escaped;
}

const sampleAnsi = "\x1b[32m✔ Success:\x1b[0m \x1b[31mRed text\x1b[0m\nLine 2\n\tTabbed\n   Spaces";
console.log(renderAnsiTerminal(sampleAnsi));
