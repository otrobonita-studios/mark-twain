const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mark.otrobonita.com';
const BOOKS_DIR = path.join(__dirname, '../src/data/books');

// Main pages
const mainPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/read/eves-diary', priority: '0.9', changefreq: 'monthly' },
  { url: '/chat', priority: '0.8', changefreq: 'monthly' },
  { url: '/complete-works', priority: '0.85', changefreq: 'weekly' },
  { url: '/rebuild-process', priority: '0.6', changefreq: 'monthly' },
];

// Generate sitemap
function generateSitemap() {
  const urls = [];

  // Add main pages
  mainPages.forEach(page => {
    urls.push({
      loc: `${BASE_URL}${page.url}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Add book pages
  if (fs.existsSync(BOOKS_DIR)) {
    const files = fs.readdirSync(BOOKS_DIR);

    files.forEach(file => {
      if (file.endsWith('.html') || file.endsWith('.txt')) {
        const slug = file.replace(/\.(html|txt)$/, '');

        // Skip Eve's Diary as it has a custom route
        if (slug.toLowerCase() === 'eves-diary') return;

        urls.push({
          loc: `${BASE_URL}/read/${encodeURIComponent(slug)}`,
          lastmod: new Date().toISOString(),
          changefreq: 'yearly',
          priority: '0.7'
        });
      }
    });
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  // Write to public directory
  const publicSitemapPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xml, 'utf8');

  console.log(`✓ Sitemap generated: ${publicSitemapPath}`);
  console.log(`✓ Total URLs: ${urls.length}`);
  console.log(`✓ Book pages: ${urls.length - mainPages.length}`);
}

generateSitemap();
