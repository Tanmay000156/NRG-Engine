const fs = require('fs');
const path = require('path');
const indexPath = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// The broken snippet has:
// --editor-tab-size: 4;\n    }\n\n\n      /* Dropdown Theme Tokens (Light Mode) */
const oldSnippet = `      --editor-tab-size: 4;
    }


      /* Dropdown Theme Tokens (Light Mode) */
      --dropdown-bg: rgba(255, 255, 255, 0.98);
      --dropdown-border: rgba(0, 102, 255, 0.22);
      --dropdown-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 102, 255, 0.1);
      --dropdown-header-bg: rgba(0, 102, 255, 0.05);
      --dropdown-text-main: #0f172a;
      --dropdown-text-sub: #475569;
      --dropdown-text-muted: #64748b;
      --dropdown-badge-bg: rgba(0, 102, 255, 0.1);
      --dropdown-badge-text: #0066ff;
      --dropdown-badge-border: rgba(0, 102, 255, 0.25);
      --dropdown-divider: rgba(0, 0, 0, 0.08);
      --dropdown-item-hover: rgba(0, 102, 255, 0.08);
      --dropdown-icon-stroke: #475569;
      --dropdown-icon-hover-stroke: #0066ff;
      --dropdown-danger-text: #ef4444;
      --dropdown-danger-hover-bg: rgba(239, 68, 68, 0.08);
      --dropdown-danger-hover-text: #dc2626;
    }`;

const newSnippet = `      --editor-tab-size: 4;

      /* Dropdown Theme Tokens (Light Mode) */
      --dropdown-bg: rgba(255, 255, 255, 0.98);
      --dropdown-border: rgba(0, 102, 255, 0.22);
      --dropdown-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 102, 255, 0.1);
      --dropdown-header-bg: rgba(0, 102, 255, 0.05);
      --dropdown-text-main: #0f172a;
      --dropdown-text-sub: #475569;
      --dropdown-text-muted: #64748b;
      --dropdown-badge-bg: rgba(0, 102, 255, 0.1);
      --dropdown-badge-text: #0066ff;
      --dropdown-badge-border: rgba(0, 102, 255, 0.25);
      --dropdown-divider: rgba(0, 0, 0, 0.08);
      --dropdown-item-hover: rgba(0, 102, 255, 0.08);
      --dropdown-icon-stroke: #475569;
      --dropdown-icon-hover-stroke: #0066ff;
      --dropdown-danger-text: #ef4444;
      --dropdown-danger-hover-bg: rgba(239, 68, 68, 0.08);
      --dropdown-danger-hover-text: #dc2626;
    }`;

const normOld = oldSnippet.replace(/\r\n/g, '\n');
const normHtml = html.replace(/\r\n/g, '\n');

if (normHtml.includes(normOld)) {
  const fixed = normHtml.replace(normOld, newSnippet);
  fs.writeFileSync(indexPath, fixed, 'utf8');
  console.log('Fixed :root closing brace successfully!');
} else {
  console.log('Could not find old snippet, checking positions:');
  const pos = normHtml.indexOf('--dropdown-bg: rgba(255, 255, 255');
  console.log(normHtml.slice(pos - 100, pos + 200));
}
