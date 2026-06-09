const res = await fetch('https://www.iso.org/search.html', {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131', 'Accept-Language': 'en-US' }
});
const html = await res.text();
const idx = html.indexOf('const algolia = {');
console.log(html.slice(idx, idx + 1500));
