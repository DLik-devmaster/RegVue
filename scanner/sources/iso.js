// ISO scanner — direct Algolia API (no Playwright)
// Credentials from iso.org/search.html (algolia.settings block)
const ALGOLIA_APP_ID = 'JCL49WV5AR';
const ALGOLIA_API_KEY = 'MzcxYjJlODU3ZmEwYmRhZTc0NTZlODNlZmUwYzVjNDRiZDEzMzRjMjYwNTAwODU3YmIzNjEwZmNjNDFlOTBjYXJlc3RyaWN0SW5kaWNlcz1QUk9EX2lzb29yZ19lbiUyQ1BST0RfaXNvb3JnX2VuX2F1dG9jb21wbGV0ZQ==';
const ALGOLIA_INDEX  = 'PROD_isoorg_en';
const ALGOLIA_URL    = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

const DELAY_MS = 1500;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(baseCode, attempt = 1) {
  const res = await fetch(ALGOLIA_URL, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      'Referer': 'https://www.iso.org/search.html',
      'Origin': 'https://www.iso.org',
    },
    body: JSON.stringify({ query: baseCode, hitsPerPage: 15 }),
  });

  if (!res.ok) {
    if (attempt < 3) {
      console.error(`[iso] Algolia ${res.status} for ${baseCode}, retry ${attempt}/2`);
      await sleep(2000 * attempt);
      return fetchWithRetry(baseCode, attempt + 1);
    }
    console.error(`[iso] Algolia ${res.status} for ${baseCode}, giving up after ${attempt} attempts`);
    return null;
  }

  return res.json();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "ISO 10993-1" must match "ISO 10993-1:2025" but NOT "ISO 10993-12:2021" or
// "ISO 10993-18:2020" — a plain startsWith() treats those as matches because
// "10993-12" and "10993-18" both start with the digits "10993-1". Require
// that whatever follows baseCode isn't itself a digit (i.e. part of a
// different, longer part number).
function matchesBaseCode(reference, baseCode) {
  const re = new RegExp('^' + escapeRegex(baseCode) + '(?![\\d-])', 'i');
  return re.test((reference || '').trim());
}

async function searchISO(code) {
  const baseCode = code.replace(/:\d{4}.*/, '').trim();

  const json = await fetchWithRetry(baseCode);
  if (!json) return { baseCode, fetchFailed: true };

  const hits = json.hits || [];

  // Multiple hits can match the same base code (base edition + amendments,
  // e.g. "ISO 15223-1:2021" and "ISO 15223-1:2021/Amd 1:2025" both rank as
  // top hits). Algolia's relevance order is NOT chronological, so we must
  // pick the one with the highest year ourselves instead of the first hit.
  const matches = hits
    .filter(h => h.statusKey === 'ENT_ACTIVE')
    .filter(h => matchesBaseCode(h.reference, baseCode))
    .map(h => {
      // Amendments look like "ISO 15223-1:2021/Amd 1:2025" — take the LAST
      // ":YYYY" in the reference (the amendment year), not the first
      // (the base edition year), so amendments outrank their base edition.
      const years = [...(h.reference || '').matchAll(/:(\d{4})/g)].map(m => parseInt(m[1]));
      return years.length ? { reference: h.reference, year: Math.max(...years) } : null;
    })
    .filter(Boolean);

  if (matches.length === 0) {
    console.log(`[iso] no active match for ${baseCode} (${hits.length} hits) — possibly withdrawn`);
    return { baseCode, notFound: true };
  }

  matches.sort((a, b) => b.year - a.year);
  const best = matches[0];

  console.log(`[iso] ${baseCode} → ${best.reference}`);
  return { baseCode, latestEdition: best.reference, year: String(best.year) };
}

export async function checkISOStandards(regulations) {
  const isoRegs = regulations.filter(r => r.body === 'ISO');
  if (isoRegs.length === 0) return {};

  const results = {};
  for (const reg of isoRegs) {
    try {
      const result = await searchISO(reg.code);
      if (result) results[reg.code] = result;
    } catch (err) {
      console.error(`[iso] error for ${reg.code}:`, err.message);
    }
    await sleep(DELAY_MS);
  }
  return results;
}
