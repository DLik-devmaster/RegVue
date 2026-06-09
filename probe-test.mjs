// Test direct API calls for ISO (Algolia) and IEC (search-api)

const ALGOLIA_APP_ID = 'JCL49WV5AR';
const ALGOLIA_API_KEY = 'MzcxYjJlODU3ZmEwYmRhZTc0NTZlODNlZmUwYzVjNDRiZDEzMzRjMjYwNTAwODU3YmIzNjEwZmNjNDFlOTBjYXJlc3RyaWN0SW5kaWNlcz1QUk9EX2lzb29yZ19lbiUyQ1BST0RfaXNvb3JnX2VuX2F1dG9jb21wbGV0ZQ==';
const ALGOLIA_INDEX = 'PROD_isoorg_en';

// ── ISO via Algolia ───────────────────────────────────────────────
async function testISO(code) {
  const baseCode = code.replace(/:\d{4}.*/, '').trim();
  console.log('[iso] querying Algolia for:', baseCode);

  const res = await fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: baseCode, hitsPerPage: 10 }),
  });

  console.log('  status:', res.status);
  if (!res.ok) { console.log(await res.text()); return; }

  const json = await res.json();
  const hits = json.hits || [];
  console.log('  total hits:', json.nbHits);

  const match = hits.find(h => (h.reference || '').toUpperCase().startsWith(baseCode.toUpperCase()));
  if (match) {
    const yearM = (match.reference || '').match(/:(\d{4})/);
    console.log('  match:', match.reference, '| year:', yearM?.[1]);
  } else {
    console.log('  no match. first 3 refs:', hits.slice(0,3).map(h => h.reference));
  }
}

// ── IEC via direct API ────────────────────────────────────────────
async function testIEC(code) {
  const baseCode = code.replace(/:\d{4}.*/, '').trim();
  console.log('\n[iec] querying search-api for:', baseCode);

  const res = await fetch('https://webstore-search-api.iec.ch/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 Chrome/131',
      'Referer': 'https://webstore.iec.ch/',
      'Origin': 'https://webstore.iec.ch',
    },
    body: JSON.stringify({ query: baseCode }),
  });

  console.log('  status:', res.status);
  if (!res.ok) { console.log(await res.text()); return; }

  const json = await res.json();
  const hits = json?.primary?.hits?.hits || [];
  console.log('  total hits:', json?.primary?.hits?.total?.value);

  const matching = hits
    .map(h => h._source)
    .filter(s => (s.reference || '').toUpperCase().startsWith(baseCode.toUpperCase()))
    .filter(s => s.publication_date && s.status !== 'WITHDRAWN');

  if (matching.length) {
    matching.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
    const best = matching[0];
    console.log('  match:', best.reference, '| date:', best.publication_date, '| status:', best.status);
  } else {
    console.log('  no match. first 3 refs:', hits.slice(0,3).map(h => h._source?.reference));
  }
}

await testISO('ISO 13485');
await testISO('ISO 14971');
await testIEC('IEC 60601-2-44');
await testIEC('IEC 62366-1');
