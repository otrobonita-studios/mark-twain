const http = require('https');

// Helper to fetch url
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  const rootRes = await fetchUrl('https://otrobonita.com');
  const body = rootRes.body;
  console.log('--- HTML CONTENT ---');
  console.log(body);

  // Match all <script type="module" src="..."> or similar
  const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  const scriptUrls = [];
  while ((match = scriptRegex.exec(body)) !== null) {
    scriptUrls.push(match[1]);
  }

  console.log('--- FOUND SCRIPTS ---', scriptUrls);

  for (const src of scriptUrls) {
    const absoluteUrl = src.startsWith('http') ? src : `https://otrobonita.com${src.startsWith('/') ? '' : '/'}${src}`;
    console.log(`Fetching ${absoluteUrl}...`);
    try {
      const res = await fetchUrl(absoluteUrl);
      console.log(`  Status: ${res.status}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Body length: ${res.body.length}`);
      if (res.headers['content-type'].includes('text/html')) {
        console.log('  ⚠️ WARNING: MIME type is text/html (likely 404 fallback!)');
        console.log('  Body snippet:', res.body.substring(0, 200));
      }
    } catch (e) {
      console.error(`  Fetch failed: ${e.message}`);
    }
  }
}

main();
