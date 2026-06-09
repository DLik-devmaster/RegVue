// Probe ISO (Algolia) and IEC (search-api) to find direct call format
// Run: node probe-apis.mjs

// ── IEC ──────────────────────────────────────────────────────────
async function probeIEC(code = 'IEC 60601-2-44') {
  const baseCode = code.replace(/:\d{4}.*/, '').trim();
  console.log('[iec] probing', baseCode);

  // Try common patterns for the search API
  const endpoints = [
    `https://webstore-search-api.iec.ch/api/search?q=${encodeURIComponent(baseCode)}`,
    `https://webstore-search-api.iec.ch/api/search?query=${encodeURIComponent(baseCode)}`,
    `https://webstore-search-api.iec.ch/api/search?text=${encodeURIComponent(baseCode)}`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://webstore.iec.ch/',
    'Origin': 'https://webstore.iec.ch',
  };

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      console.log(`  GET ${url.split('?')[1]} → ${res.status} ${res.headers.get('content-type')}`);
      if (res.ok) {
        const text = await res.text();
        console.log('  body (first 300):', text.slice(0, 300));
        return;
      }
    } catch (e) {
      console.log(`  error: ${e.message}`);
    }
  }

  // Try POST
  try {
    const res = await fetch('https://webstore-search-api.iec.ch/api/search', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: baseCode }),
    });
    console.log(`  POST /api/search → ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      console.log('  body (first 300):', text.slice(0, 300));
    }
  } catch (e) {
    console.log('  POST error:', e.message);
  }
}

// ── ISO (find Algolia credentials from page JS) ───────────────────
async function probeISO() {
  console.log('\n[iso] fetching iso.org/search.html to find Algolia credentials...');
  try {
    const res = await fetch('https://www.iso.org/search.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      }
    });
    const html = await res.text();

    // Look for Algolia app ID and API key patterns
    const appIdMatch = html.match(/['"]((?:[A-Z0-9]{8,12}))['"]\s*[,;]\s*['"]([a-f0-9]{32,40})['"]/);
    const algoliaMatch = html.match(/algolia[^\n]{0,200}/gi);
    const appIdAlt = html.match(/applicationID['":\s]+['"]([A-Z0-9]{6,12})['"]/i);
    const apiKeyAlt = html.match(/apiKey['":\s]+['"]([a-f0-9]{20,40})['"]/i);
    const indexMatch = html.match(/indexName['":\s]+['"]([^'"]{5,40})['"]/i);

    console.log('  appIdAlt:', appIdAlt?.[1]);
    console.log('  apiKeyAlt:', apiKeyAlt?.[1]);
    console.log('  indexName:', indexMatch?.[1]);
    console.log('  algolia references:', algoliaMatch?.slice(0, 3));

    // Also look for script tags pointing to Algolia
    const scriptMatches = html.match(/<script[^>]+src="[^"]*algolia[^"]*"/gi);
    console.log('  algolia script tags:', scriptMatches);

    // Try searching the JS files referenced
    const jsRefs = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/gi)].map(m => m[1]).filter(s => !s.includes('http') || s.includes('iso.org'));
    console.log('  local JS files:', jsRefs.slice(0, 5));

  } catch (e) {
    console.log('  error:', e.message);
  }
}

await probeIEC();
await probeISO();
