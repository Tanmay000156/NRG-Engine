async function findLanguages() {
  const res = await fetch('https://ce.judge0.com/languages');
  const langs = await res.json();
  
  const targets = ['c (', 'c++ (', 'java (', 'python (', 'javascript (', 'c# (', 'go (', 'rust (', 'php (', 'kotlin ('];
  
  console.log('Matching languages:');
  for (const l of langs) {
    for (const t of targets) {
      if (l.name.toLowerCase().includes(t)) {
        console.log(`ID: ${l.id} -> ${l.name}`);
      }
    }
  }
}

findLanguages();
