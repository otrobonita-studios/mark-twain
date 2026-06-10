// scratch/split_alonzo.js
const fs = require('fs');
const path = require('path');

const originalFile = path.join(__dirname, '../src/data/books/The-Loves-of-Alonzo-Fitz.html');
const content = fs.readFileSync(originalFile, 'utf8');

// Extract head and style
const headMatch = content.match(/<head>([\s\S]*?)<\/head>/i);
const headInner = headMatch ? headMatch[1] : '';

// Remove the ld+json script from headInner since we will generate a fresh one for each file
const headCleaned = headInner.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '').trim();

// The list of stories, their headings (exact match or similar), and target slugs.
// Rogers has a custom h2 in the file. Let's find exactly what H2s are there:
// headings: [
//   'BY MARK TWAIN', // skip this
//   'THE LOVES OF ALONZO FITZ CLARENCE AND ROSANNAH ETHELTON',
//   'ON THE DECAY OF THE ART OF LYING',
//   'ABOUT MAGNANIMOUS-INCIDENT LITERATURE',
//   'PUNCH, BROTHERS, PUNCH',
//   'THE GREAT REVOLUTION IN PITCAIRN',
//   "THE CANVASSER'S TALE",
//   'AN ENCOUNTER WITH AN INTERVIEWER',
//   'PARIS NOTES',
//   'LEGEND OF SAGENFELD, IN GERMANY',
//   'SPEECH ON THE BABIES',
//   'SPEECH ON THE WEATHER',
//   'CONCERNING THE AMERICAN LANGUAGE &mdash;', // Rogers heading comes next or is Rogers itself?
//   'ROGERS'
// ]
// Wait, 'CONCERNING THE AMERICAN LANGUAGE &mdash;' is a heading, and 'ROGERS' is another heading.
// Let's get the exact list.
const storyMap = [
  {
    heading: 'THE LOVES OF ALONZO FITZ CLARENCE AND ROSANNAH ETHELTON',
    slug: 'The-Loves-of-Alonzo-Fitz',
    title: 'The Loves of Alonzo Fitz Clarence and Rosannah Ethelton'
  },
  {
    heading: 'ON THE DECAY OF THE ART OF LYING',
    slug: 'On-the-Decay-of-the-Art-of-Lying',
    title: 'On the Decay of the Art of Lying'
  },
  {
    heading: 'ABOUT MAGNANIMOUS-INCIDENT LITERATURE',
    slug: 'About-Magnanimous-Incident-Literature',
    title: 'About Magnanimous-Incident Literature'
  },
  {
    heading: 'PUNCH, BROTHERS, PUNCH',
    slug: 'Punch-Brothers-Punch',
    title: 'Punch, Brothers, Punch'
  },
  {
    heading: 'THE GREAT REVOLUTION IN PITCAIRN',
    slug: 'The-Great-Revolution-in-Pitcairn',
    title: 'The Great Revolution in Pitcairn'
  },
  {
    heading: "THE CANVASSER'S TALE",
    slug: 'The-Canvassers-Tale',
    title: "The Canvasser's Tale"
  },
  {
    heading: 'AN ENCOUNTER WITH AN INTERVIEWER',
    slug: 'An-Encounter-with-an-Interviewer',
    title: 'An Encounter with an Interviewer'
  },
  {
    heading: 'PARIS NOTES',
    slug: 'Paris-Notes',
    title: 'Paris Notes'
  },
  {
    heading: 'LEGEND OF SAGENFELD, IN GERMANY',
    slug: 'Legend-of-Sagenfeld',
    title: 'Legend of Sagenfeld, in Germany'
  },
  {
    heading: 'SPEECH ON THE BABIES',
    slug: 'Speech-on-the-Babies',
    title: 'Speech on the Babies'
  },
  {
    heading: 'SPEECH ON THE WEATHER',
    slug: 'Speech-on-the-Weather',
    title: 'Speech on the Weather'
  },
  {
    heading: 'CONCERNING THE AMERICAN LANGUAGE &mdash;',
    slug: 'Concerning-the-American-Language',
    title: 'Concerning the American Language'
  },
  {
    heading: 'ROGERS',
    slug: 'Rogers',
    title: 'Rogers'
  }
];

// Let's parse content.
// We can find the start of each story by locating its H2 tag.
// Since the file has links like `<a id="link2H_4_000x">` preceding the H2 tags, we should split cleanly.
const storyPositions = [];

storyMap.forEach(story => {
  // Find where this heading occurs inside h2 tag
  const h2Regex = new RegExp(`<h2>\\s*${story.heading}\\s*</h2>|<h2\\b[^>]*>\\s*${story.heading}\\s*</h2>`, 'i');
  const match = content.match(h2Regex);
  if (match) {
    // Look backwards slightly to capture the anchor tag if present
    let startIdx = match.index;
    const anchorMatch = content.substring(Math.max(0, startIdx - 150), startIdx).match(/<p>\s*<a id="link2H_4_\d+">[\s\S]*?<\/a>\s*<\/p>/gi);
    if (anchorMatch) {
      // Offset startIdx
      startIdx = content.indexOf(anchorMatch[0], startIdx - 150);
    }
    storyPositions.push({
      ...story,
      start: startIdx,
      matchLength: match[0].length
    });
  } else {
    console.error("Could not find heading:", story.heading);
  }
});

// Sort by start position
storyPositions.sort((a, b) => a.start - b.start);

// Write them out
for (let i = 0; i < storyPositions.length; i++) {
  const current = storyPositions[i];
  const next = storyPositions[i + 1];
  const end = next ? next.start : content.indexOf('</div>\n</body>');

  let storyBody = content.substring(current.start, end).trim();

  // If this is the first story (Alonzo), let's strip the warning card since they are now standalone pages
  if (current.slug === 'The-Loves-of-Alonzo-Fitz') {
    // Remove the warning card div if it's there
    storyBody = storyBody.replace(/<div\s+style="background:[\s\S]*?<\/div>/i, '').trim();
    // Remove title block div since we will generate a clean title block
    storyBody = storyBody.replace(/<div class="book-title-block">[\s\S]*?<\/div>\s*<hr\s*\/?>/i, '').trim();
  }

  // Wrap inside standard template
  const newHtml = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${current.title}, by Mark Twain</title>
  <script type="application/ld+json">
{
    "@context": "https://schema.org",
    "name": "${current.title}, by Mark Twain",
    "author": {
        "name": "Mark Twain",
        "@type": "Person"
    },
    "@type": "Book",
    "inLanguage": "en"
}
</script>
  ${headCleaned}
</head>

<body>
  <div class="book-title-block">
    <h1>${current.title.toUpperCase()}</h1>
    <h2>BY MARK TWAIN</h2>
  </div>
  <hr />
  <div class="book-text-content">
    ${storyBody}
  </div>
</body>

</html>
`;

  const outPath = path.join(__dirname, `../src/data/books/${current.slug}.html`);
  fs.writeFileSync(outPath, newHtml, 'utf8');
  console.log(`Split & Saved: ${current.slug}.html`);
}
