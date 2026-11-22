async function checkProdUrl() {
  const url = 'https://nrg-engine-nrg18.vercel.app';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Length:', text.length);
  console.log('ThemeManager:', text.includes('ThemeManager'));
  console.log('modalThemes:', text.includes('id="modalThemes"'));
}
checkProdUrl().catch(console.error);
