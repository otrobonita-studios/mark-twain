// scratch/fetch_page.js
const http = require('http');

http.get('http://localhost:3000/read/A-Telephonic-Conversation', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    const hasProvenance = data.includes('provenance-alert-banner');
    console.log("Contains provenance-alert-banner:", hasProvenance);
    if (hasProvenance) {
      const idx = data.indexOf('provenance-alert-banner');
      console.log("Snippet:", data.substring(idx - 100, idx + 400));
    } else {
      console.log("Title block snippet:", data.substring(data.indexOf('book-text-content'), data.indexOf('book-text-content') + 1000));
    }
  });
}).on('error', (err) => {
  console.error("Error:", err);
});
