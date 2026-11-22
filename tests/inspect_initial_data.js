const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const pDataIdx = html.indexOf('let projectsData =');
if (pDataIdx !== -1) {
  console.log('projectsData:\n', html.slice(pDataIdx, pDataIdx + 800));
}

const sDataIdx = html.indexOf('let snippetsData =');
if (sDataIdx !== -1) {
  console.log('snippetsData:\n', html.slice(sDataIdx, sDataIdx + 800));
}
