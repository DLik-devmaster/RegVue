import axios from 'axios';

// FDA Federal Register API — free, no auth required
const FR_API = 'https://www.federalregister.gov/api/v1/documents.json';

// Built as a raw query string rather than an axios `params` object: axios's
// default array serialization emits indexed brackets ("conditions[type][0]="),
// which this API's Rails backend silently fails to parse as an array when
// there isn't a "[1]" etc. right behind it — the whole `conditions` filter
// then gets dropped and the endpoint returns its default "newest documents
// across every agency" result set instead of erroring. Confirmed by testing
// directly against the API. Empty-bracket notation ("[]=") is required, and
// `type` uses the API's internal codes (RULE/PRORULE/NOTICE), not the
// human-readable labels ("Rule"/"Proposed Rule"/"Notice") shown in results.
function buildQuery() {
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const params = [
    'conditions[agencies][]=food-and-drug-administration',
    'conditions[topics][]=medical-devices',
    'conditions[type][]=RULE',
    'conditions[type][]=PRORULE',
    'conditions[type][]=NOTICE',
    `conditions[publication_date][gte]=${since}`,
    'fields[]=title',
    'fields[]=document_number',
    'fields[]=publication_date',
    'fields[]=type',
    'fields[]=abstract',
    'per_page=20',
    'order=newest',
  ];
  return params.join('&');
}

export async function fetchFDAUpdates() {
  console.log('[fda] fetching recent medical device rules...');
  try {
    const res = await axios.get(`${FR_API}?${buildQuery()}`, { timeout: 15000 });

    const docs = res.data.results || [];
    console.log(`[fda] ${docs.length} recent documents found (of ${res.data.count} matching)`);
    return docs;
  } catch (err) {
    console.error('[fda] error:', err.message);
    return [];
  }
}
