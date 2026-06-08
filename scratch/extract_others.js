const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'data', 'books', 'Sketches-New-and-Old.html');
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split('\n');

const stories = [
  {
    title: 'JOURNALISM IN TENNESSEE',
    filename: 'Journalism-in-Tennessee.html',
    startLine: 1254,
    endLine: 1552
  },
  {
    title: 'A TRUE STORY',
    filename: 'A-True-Story.html',
    startLine: 7911,
    endLine: 8163
  },
  {
    title: 'A GHOST STORY',
    filename: 'A-Ghost-Story.html',
    startLine: 8441,
    endLine: 8714
  }
];

stories.forEach(story => {
  const storyLines = lines.slice(story.startLine - 1, story.endLine);
  const storyContent = storyLines.join('\n');
  const destPath = path.join(__dirname, '..', 'src', 'data', 'books', story.filename);

  const wrapper = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.title}, by Mark Twain</title>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "name": "${story.title}, by Mark Twain",
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

        * { box-sizing: border-box; }

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

        h1, h2, h3, h4, h5, h6 {
            font-family: 'Courier Prime', 'Playfair Display', serif;
            color: var(--accent);
            margin-top: 2.5em;
            margin-bottom: 1em;
            text-align: center;
        }

        h1 { font-size: 2.5em; }
        h2 { font-size: 2em; }
        h3 { font-size: 1.5em; }

        p { margin: 0.8em 0;  }
        hr { border: none; border-top: 2px solid var(--accent); margin: 2em 0; }
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        
        .conversation-line {
            font-style: italic;
        }
    </style>
</head>
<body>
<div class="book-title-block">
  <h1>${story.title}</h1>
  <h2>BY MARK TWAIN</h2>
  
</div>
<hr />
<div class="book-text-content">
${storyContent}
</div>
</body>
</html>`;

  fs.writeFileSync(destPath, wrapper, 'utf8');
  console.log(`✓ Successfully extracted: ${story.title} -> ${destPath}`);
});
