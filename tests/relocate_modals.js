const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Extract the modalPreferences & modalThemes HTML
const prefMarker = '<!-- 5. Developer Preferences Modal -->';
const prefIdx = html.indexOf(prefMarker);
if (prefIdx === -1) {
  console.error('prefMarker not found!');
  process.exit(1);
}

// Find the end of modalThemes
const endThemesMarker = '<!-- 6. Theme Selection Modal -->';
const endThemesIdx = html.indexOf(endThemesMarker);
const closeThemesIdx = html.indexOf('</div>\n    </div>\n', endThemesIdx);
const endOfModals = closeThemesIdx + '</div>\n    </div>'.length;

const modalsHTML = html.slice(prefIdx, endOfModals);
console.log('Extracted modalsHTML length:', modalsHTML.length);

// Remove modalsHTML from after script
html = html.slice(0, prefIdx) + html.slice(endOfModals);

// Insert modalsHTML inside .nrg-overlay-layer right after modalSignOutConfirm
const insertTarget = '      </div>\n    </div>\n\n  </div>\n\n  <script>';
const replacement = '      </div>\n    </div>\n\n' + modalsHTML + '\n  </div>\n\n  <script>';

if (html.includes(insertTarget)) {
  html = html.replace(insertTarget, replacement);
  console.log('Successfully inserted modals inside .nrg-overlay-layer before <script>!');
} else {
  console.error('insertTarget not found!');
  process.exit(1);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Saved index.html');
