const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/What-Is-Man-And-Others.html');
const destDir = path.join(__dirname, '../src/data/books');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const content = fs.readFileSync(srcPath, 'utf8');

// Match all chapter blocks: <div class="chapter">...</div>
const regex = /<div class="chapter">([\s\S]*?)<\/div>(?:\s*<!--end chapter-->)?/gi;
const chapters = [];
let match;
while ((match = regex.exec(content)) !== null) {
  chapters.push(match[1]);
}

const essays = [
  { chapterNum: 2, title: "The Death of Jean", slug: "The-Death-of-Jean" },
  { chapterNum: 3, title: "The Turning-Point of My Life", slug: "The-Turning-Point-of-My-Life" },
  { chapterNum: 4, title: "How to Make History Dates Stick", slug: "How-to-Make-History-Dates-Stick" },
  { chapterNum: 5, title: "The Memorable Assassination", slug: "The-Memorable-Assassination" },
  { chapterNum: 6, title: "A Scrap of Curious History", slug: "A-Scrap-of-Curious-History" },
  { chapterNum: 7, title: "Switzerland, The Cradle of Liberty", slug: "Switzerland-The-Cradle-of-Liberty" },
  { chapterNum: 8, title: "At the Shrine of St. Wagner", slug: "At-the-Shrine-of-St-Wagner" },
  { chapterNum: 9, title: "William Dean Howells", slug: "William-Dean-Howells" },
  { chapterNum: 10, title: "English As She Is Taught", slug: "English-As-She-Is-Taught" },
  { chapterNum: 11, title: "A Simplified Alphabet", slug: "A-Simplified-Alphabet" },
  { chapterNum: 12, title: "As Concerns Interpreting the Deity", slug: "As-Concerns-Interpreting-the-Deity" },
  { chapterNum: 13, title: "Concerning Tobacco", slug: "Concerning-Tobacco" },
  { chapterNum: 14, title: "The Bee", slug: "The-Bee" },
  { chapterNum: 15, title: "Taming the Bicycle", slug: "Taming-the-Bicycle" }
];

essays.forEach(essay => {
  const chapterContent = chapters[essay.chapterNum - 1];
  if (!chapterContent) {
    console.error(`Error: Chapter ${essay.chapterNum} not found in HTML!`);
    return;
  }

  const cleanContent = chapterContent.trim();
  const destPath = path.join(destDir, `${essay.slug}.html`);

  const fileTemplate = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${essay.title}, by Mark Twain</title>
    <script type="application/ld+json">
{
    "@context": "https://schema.org",
    "name": "${essay.title}, by Mark Twain",
    "author": {
        "name": "Mark Twain",
        "@type": "Person"
    },
    "@type": "Book",
    "inLanguage": "en"
}
</script>
    <style>
        :root {
            --bg: #15110d;
            --surface: #1d1611;
            --text: rgba(255, 244, 223, 0.95);
            --accent: #d9a34a;
            --spacing: 1.5rem;
        }

        * {
            box-sizing: border-box;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: Georgia, serif;
            margin: 0;
            padding: 2rem;
            line-height: 1.8;
        }

        .book-text-content {
            max-width: 900px;
            margin: 0 auto;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            font-family: 'Courier Prime', 'Playfair Display', serif;
            color: var(--accent);
            margin-top: 2.5em;
            margin-bottom: 1em;
            text-align: center;
        }

        h1 {
            font-size: 2.5em;
        }

        h2 {
            font-size: 2em;
        }

        h3 {
            font-size: 1.5em;
        }

        p {
            margin: 0.8em 0;
        }

        hr {
            border: none;
            border-top: 2px solid var(--accent);
            margin: 2em 0;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
        }
    </style>
</head>

<body>
    <div class="book-title-block">
        <h1>${essay.title.toUpperCase()}</h1>
        <h2>BY MARK TWAIN</h2>
    </div>
    <div class="book-text-content">
        <hr />
        <div class="chapter">
            ${cleanContent}
        </div>
    </div>
</body>

</html>`;

  fs.writeFileSync(destPath, fileTemplate, 'utf8');
  console.log(`✓ Extracted: "${essay.title}" -> src/data/books/${essay.slug}.html`);
});

console.log('\nAll essays extracted successfully!');
