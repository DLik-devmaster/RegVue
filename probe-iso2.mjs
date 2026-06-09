// Check the defer JS bundle and custom.js for Algolia config
const urls = [
  'https://www.iso.org/generated-resources/698d959c2e92f2316b3dbf8eb1b7fb-defer.min.js',
  'https://www.iso.org/modules/isoorg-template/javascript/custom.js?v1',
];

for (const jsUrl of urls) {
  console.log('\n=== fetching', jsUrl.split('/').pop());
  try {
    const res = await fetch(jsUrl, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131' } });
    const js = await res.text();
    console.log('size:', js.length);

    // Search for Algolia-related strings
    const algIdx = js.toLowerCase().indexOf('algolia');
    if (algIdx >= 0) {
      console.log('algolia context:', js.slice(Math.max(0, algIdx-100), algIdx+600));
    }

    const initIdx = js.indexOf('initSearch');
    if (initIdx >= 0) {
      console.log('initSearch context:', js.slice(Math.max(0, initIdx-50), initIdx+800));
    }

    // Look for hex strings that look like API keys
    const hexKeys = [...js.matchAll(/['"]([a-f0-9]{20,40})['"]/gi)].map(m => m[1]);
    if (hexKeys.length) console.log('hex strings:', hexKeys.slice(0, 5));

    // Look for uppercase alphanum (app IDs)
    const appIds = [...js.matchAll(/['"]([A-Z][A-Z0-9]{5,11})['"]/g)].map(m => m[1]);
    if (appIds.length) console.log('possible appIds:', [...new Set(appIds)].slice(0, 10));
  } catch(e) {
    console.log('error:', e.message);
  }
}
