// Find algolia.settings in the HTML of iso.org/search.html
const res = await fetch('https://www.iso.org/search.html', {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131', 'Accept-Language': 'en-US' }
});
const html = await res.text();
const idx = html.indexOf('algolia');
if (idx < 0) { console.log('algolia not found in HTML'); process.exit(1); }

// Print all algolia occurrences with context
let pos = 0;
let count = 0;
while ((pos = html.indexOf('algolia', pos)) >= 0 && count < 10) {
  console.log(`\n[pos ${pos}]:`, html.slice(Math.max(0,pos-30), pos+300));
  pos += 7;
  count++;
}
