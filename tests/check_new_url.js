async function checkNewUrl() {
  const url = 'https://nrg-engine-icgsg93ca-nrg18.vercel.app';
  const res = await fetch(url);
  const text = await res.text();
  console.log(url);
  console.log('Status:', res.status);
  console.log('Length:', text.length);
  console.log('ThemeManager:', text.includes('ThemeManager'));
  console.log('modalThemes:', text.includes('id="modalThemes"'));
  console.log('Glass Light:', text.includes('Glass Light'));
}
checkNewUrl().catch(console.error);
