async function testImports() {
  const { LANGUAGES } = await import('../src/constants/languages.js');
  console.log('Languages count:', Object.keys(LANGUAGES).length);
  const { TEMPLATES_CATALOG } = await import('../src/constants/templates.js');
  console.log('Templates count:', TEMPLATES_CATALOG.length);
}
testImports().catch(console.error);
