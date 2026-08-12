import axios from 'axios';
import * as cheerio from 'cheerio';

const MDCG_URL = 'https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en';

const CODE_RE = /MDCG\s+\d{4}-\d+(?:-\d+)?/i;
// Revision must sit immediately after the code — observed live formats
// include "MDCG 2021-24 Rev.1", "MDCG 2019-9 rev. 1", and "MDCG 2024-14 -
// rev.1" (dash separator). Page cells often mention a second, unrelated
// document nearby (e.g. "...relationship between MDCG 2020-6 and MEDDEV
// 2.7/1 rev.4...") — searching the whole cell text for /rev\.?\s*\d+/
// anywhere picked up that unrelated document's revision instead.
const REV_AFTER_RE = /^\s*[-–—]?\s*\(?\s*rev\.?\s*(\d+)\s*\)?/i;

// Extract a document's code and its own revision (if adjacent) from text
function parseDocMatch(text) {
  const m = text.match(CODE_RE);
  if (!m) return null;
  const code = m[0].replace(/\s+/, ' ').toUpperCase();
  const rev = text.slice(m.index + m[0].length).match(REV_AFTER_RE);
  return { code, rev: rev ? { label: `Rev.${rev[1]}`, num: parseInt(rev[1], 10) } : null };
}

// A document can appear multiple times on the page (main list + change
// history), in no guaranteed order. Only replace a stored match with one
// that has a strictly higher revision number — otherwise an older
// revision encountered later in DOM order overwrites nothing, but a
// higher one found later must still win.
function isHigherRevision(candidate, stored) {
  if (!stored) return true;
  if (!candidate) return false;
  return !stored.rev || candidate.num > stored.rev.num;
}

export async function fetchMDCGVersions() {
  console.log('[mdcg] fetching guidance page...');
  const res = await axios.get(MDCG_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RegVue/1.0)' },
    timeout: 15000
  });

  const $ = cheerio.load(res.data);
  const found = {};

  const consider = (match, rawText) => {
    if (!match) return;
    const { code, rev } = match;
    if (isHigherRevision(rev, found[code])) {
      found[code] = { code, rev, rawText };
    }
  };

  // The page lists documents in tables or lists — find all links/text containing "MDCG"
  $('a, td, li').each((_, el) => {
    const text = $(el).text().trim();
    consider(parseDocMatch(text), text);
  });

  // Also check page update dates from links
  $('a[href*="mdcg"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    consider(parseDocMatch(text) || parseDocMatch(href), text);
  });

  console.log(`[mdcg] found ${Object.keys(found).length} documents`);
  return found;
}
