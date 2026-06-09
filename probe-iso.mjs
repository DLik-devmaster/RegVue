// Find Algolia app ID and API key in ISO.org JS bundle
const jsUrl = 'https://www.iso.org/generated-resources/1883aec1c0aa5ec2431657901aeafabd.min.js';
const res = await fetch(jsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const js = await res.text();
console.log('fetched', js.length, 'bytes');

// Algolia patterns
const patterns = [
  /appId['":\s]+['"]([A-Z0-9]{6,12})['"]/gi,
  /applicationId['":\s]+['"]([A-Z0-9]{6,12})['"]/gi,
  /apiKey['":\s]+['"]([a-f0-9]{20,40})['"]/gi,
  /searchApiKey['":\s]+['"]([a-f0-9]{20,40})['"]/gi,
  /indexName['":\s]+['"]([a-zA-Z0-9_-]{5,40})['"]/gi,
  /[A-Z0-9]{10}['"]\s*,\s*['"][a-f0-9]{32}/g,
];

for (const pat of patterns) {
  const m = [...js.matchAll(pat)];
  if (m.length) console.log(pat.source.slice(0,30), '->', m.slice(0,3).map(x => x[0]));
}

// Also search for "searchConfigs" context
const idx = js.indexOf('searchConfigs');
if (idx >= 0) console.log('\nsearchConfigs context:', js.slice(Math.max(0, idx-50), idx+500));
