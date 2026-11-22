async function verifyLive() {
  const res = await fetch('https://nrg-engine.vercel.app');
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Length:', text.length);
  console.log('ThemeManager:', text.includes('ThemeManager'));
  console.log('modalThemes:', text.includes('id="modalThemes"'));
  console.log('modalPreferences:', text.includes('id="modalPreferences"'));
  console.log('Glass Light:', text.includes('Glass Light'));
  console.log('Crystal Obsidian:', text.includes('Crystal Obsidian'));

  // Also check /api/health
  const healthRes = await fetch('https://nrg-engine.vercel.app/api/health');
  const healthJson = await healthRes.json();
  console.log('API Health:', healthJson);
}

verifyLive().catch(console.error);
