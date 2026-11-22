const fs = require('fs');
const indexPath = 'C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// Replace the duplicate const isAccepted
const badCode = `// Record in Run History
      recordRunHistory(data);
      const isAccepted = data.status && data.status.id === 3;
      localStorage.setItem('nrg_last_exec', JSON.stringify({
        status: isAccepted ? 'Accepted' : 'Failed',
        time: data.time ? \`\${data.time}s\` : '0.04s',
        memory: data.memory ? \`\${Math.round(data.memory / 1024)}MB\` : '12MB',
        timestamp: Date.now()
      }));
      trackWorkspaceActivity(isAccepted ? 'run' : 'error', isAccepted ? \`Executed \${LANGUAGES[currentLang]?.file || 'code'} (Accepted)\` : \`Execution error in \${LANGUAGES[currentLang]?.file || 'code'}\`);`;

const fixedCode = `// Record in Run History
      recordRunHistory(data);
      const execIsAccepted = data.status && data.status.id === 3;
      localStorage.setItem('nrg_last_exec', JSON.stringify({
        status: execIsAccepted ? 'Accepted' : 'Failed',
        time: data.time ? \`\${data.time}s\` : '0.04s',
        memory: data.memory ? \`\${Math.round(data.memory / 1024)}MB\` : '12MB',
        timestamp: Date.now()
      }));
      trackWorkspaceActivity(execIsAccepted ? 'run' : 'error', execIsAccepted ? \`Executed \${LANGUAGES[currentLang]?.file || 'code'} (Accepted)\` : \`Execution error in \${LANGUAGES[currentLang]?.file || 'code'}\`);`;

content = content.replace(badCode, fixedCode);
fs.writeFileSync(indexPath, content, 'utf8');
console.log('Fixed duplicate variable in index.html');
