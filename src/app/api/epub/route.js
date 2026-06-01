import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const filePath = path.join(process.cwd(), 'rag/data-collection/TwainCorpus/HTML/Eves-Diary.html');
    if (!fs.existsSync(filePath)) {
      return Response.json({ error: "Book file not found" }, { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, 'utf8');

    // Extract start/end
    let startIndex = htmlContent.indexOf('<h1>');
    if (startIndex === -1) startIndex = htmlContent.indexOf('<h2>');
    if (startIndex === -1) startIndex = 0;

    let endIndex = htmlContent.indexOf('*** END OF THIS PROJECT GUTENBERG');
    if (endIndex === -1) endIndex = htmlContent.lastIndexOf('</body>');
    if (endIndex === -1) endIndex = htmlContent.length;

    let bodyContent = htmlContent.substring(startIndex, endIndex);

    // XHTML fixes
    bodyContent = bodyContent.replace(/<br\s*>/gi, '<br />');
    bodyContent = bodyContent.replace(/<hr\s*>/gi, '<hr />');
    bodyContent = bodyContent.replace(/&mdash;/g, '&#8212;');
    bodyContent = bodyContent.replace(/&ldquo;/g, '&#8220;');
    bodyContent = bodyContent.replace(/&rdquo;/g, '&#8221;');
    bodyContent = bodyContent.replace(/&lsquo;/g, '&#8216;');
    bodyContent = bodyContent.replace(/&rsquo;/g, '&#8217;');

    // Clean up images so they point to relative file within EPUB
    bodyContent = bodyContent.replace(/src="\/images\/eves-diary\/(.*?)"/g, 'src="../images/$1"');
    bodyContent = bodyContent.replace(/src="images\/(.*?)"/g, 'src="../images/$1"');

    // Fix unclosed images
    bodyContent = bodyContent.replace(/<img([^>]+)>/gi, (match, attrs) => {
      if (!attrs.trim().endsWith('/')) {
        return `<img ${attrs.trim()} />`;
      }
      return match;
    });

    const zip = new AdmZip();

    // 1. mimetype (MUST be first and uncompressed)
    zip.addFile("mimetype", Buffer.from("application/epub+zip"), "", 0);

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.addFile("META-INF/container.xml", Buffer.from(containerXml));

    // 3. OEBPS/style.css
    const styleCss = `body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 5%;
  color: #1a1a1a;
  background-color: #faf6ee;
}
h1, h2, h3 {
  text-align: center;
  color: #8b6508;
  font-weight: bold;
}
p {
  text-indent: 1.5em;
  margin-bottom: 0.8em;
  text-align: justify;
}
.cover-title {
  font-size: 2.5em;
  text-align: center;
  margin-top: 30%;
  color: #8b6508;
  font-weight: bold;
}
.cover-author {
  font-size: 1.5em;
  text-align: center;
  margin-top: 10%;
  font-style: italic;
}`;
    zip.addFile("OEBPS/style.css", Buffer.from(styleCss));

    // 4. OEBPS/text/cover.xhtml
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Eve's Diary</title>
  <link rel="stylesheet" type="text/css" href="../style.css"/>
</head>
<body>
  <div class="cover-title">EVE'S DIARY</div>
  <div class="cover-author">by Mark Twain</div>
  <p style="text-align: center; text-indent: 0; margin-top: 20%; font-size: 0.9em; color: #666;">
    E-Ink &amp; Kindle Edition — Mark Twain Reappears
  </p>
</body>
</html>`;
    zip.addFile("OEBPS/text/cover.xhtml", Buffer.from(coverXhtml));

    // 5. OEBPS/text/diary.xhtml
    const diaryXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Eve's Diary</title>
  <link rel="stylesheet" type="text/css" href="../style.css"/>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
    zip.addFile("OEBPS/text/diary.xhtml", Buffer.from(diaryXhtml));

    // 6. OEBPS/content.opf
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Eve's Diary</dc:title>
    <dc:creator>Mark Twain</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookID">urn:uuid:eves-diary-twain-reappears</dc:identifier>
    <meta property="dcterms:modified">2026-06-01T12:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="diary" href="text/diary.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="toc">
    <itemref idref="cover"/>
    <itemref idref="diary"/>
  </spine>
</package>`;
    zip.addFile("OEBPS/content.opf", Buffer.from(contentOpf));

    // 7. OEBPS/toc.ncx
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:eves-diary-twain-reappears"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>Eve's Diary</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>Cover</text>
      </navLabel>
      <content src="text/cover.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-2" playOrder="2">
      <navLabel>
        <text>Eve's Diary</text>
      </navLabel>
      <content src="text/diary.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
    zip.addFile("OEBPS/toc.ncx", Buffer.from(tocNcx));

    // Ensure output download folder exists
    const downloadsDir = path.join(process.cwd(), 'public/downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const outputPath = path.join(downloadsDir, 'eves-diary.epub');
    zip.writeZip(outputPath);

    return Response.json({ 
      success: true, 
      downloadUrl: "/downloads/eves-diary.epub", 
      message: "EPUB generated successfully" 
    });

  } catch (err) {
    console.error("EPUB Generation Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
