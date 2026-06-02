const fs = require('fs');
const path = require('path');

const vol1Path = path.join(__dirname, '../src/data/books/Volume-1.html');
const lettersPath = path.join(__dirname, '../src/data/books/Letters.html');

function updateVolume1() {
  let html = fs.readFileSync(vol1Path, 'utf8');

  // Update TOC link in Volume-1
  const oldTocLink = '<a href="#link2H_4_0002"> MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY </a>';
  const newTocLink = '<a href="/about"> MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY </a>';
  if (html.includes(oldTocLink)) {
    html = html.replace(oldTocLink, newTocLink);
    console.log("Updated TOC link in Volume-1.html");
  } else {
    console.log("Warning: Old TOC link not found in Volume-1.html");
  }

  // Find the biographical summary section to remove
  // Starts around: <a name="link2H_4_0002" ...
  // Ends before: <a name="link2H_4_0003"
  const startAnchor = '<a name="link2H_4_0002"';
  const endAnchor = '<a name="link2H_4_0003"';

  const startIndex = html.indexOf(startAnchor);
  const endIndex = html.indexOf(endAnchor);

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    // Find paragraph boundaries
    const beforePart = html.substring(0, startIndex);
    
    // We want to keep the start anchor paragraph for structural/link stability,
    // but replace the rest of the biography text up to the end anchor paragraph.
    const anchorClosingTag = html.indexOf('</a>', startIndex);
    const pEndIndex = html.indexOf('</p>', anchorClosingTag);
    const postAnchorIndex = pEndIndex !== -1 ? pEndIndex + 4 : anchorClosingTag + 4;
    
    const afterPart = html.substring(endIndex);

    const redirectBlock = `
    <div style="text-align: center; margin: 4rem auto; padding: 3rem 2rem; max-width: 650px; border: 2px solid var(--accent); background-color: var(--surface); border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <h3 style="margin-top: 0; color: var(--accent); font-family: 'Courier Prime', serif; font-size: 1.6em; letter-spacing: 0.05em;">MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY</h3>
      <p style="text-align: center; font-size: 1.05rem; line-height: 1.6; color: var(--text); opacity: 0.9;">
        This detailed biographical summary of Mark Twain's life, written by Albert Bigelow Paine, has been moved to its own dedicated reading page for an enhanced reading experience.
      </p>
      <div style="margin-top: 2rem; text-align: center;">
        <a href="/about" style="display: inline-block; padding: 0.75rem 2rem; background-color: var(--accent); color: var(--bg); font-weight: bold; border-radius: 2px; text-decoration: none; font-family: 'Courier Prime', monospace; transition: all 0.2s ease; border: 1px solid var(--accent);">
          READ BIOGRAPHY
        </a>
      </div>
    </div>
    
    `;

    const updatedHtml = beforePart + html.substring(startIndex, postAnchorIndex) + redirectBlock + afterPart;
    fs.writeFileSync(vol1Path, updatedHtml, 'utf8');
    console.log("Successfully extracted biography and created redirection block in Volume-1.html!");
  } else {
    console.log("Error: Could not locate biography start/end markers in Volume-1.html");
  }
}

function updateLetters() {
  let html = fs.readFileSync(lettersPath, 'utf8');

  // Update TOC link in Letters
  const oldTocLink = '<a href="https://www.gutenberg.org/files/3193/3193-h/3193-h.htm#2H_4_0001"> FOREWORD </a>';
  const oldBioLink = '<a href="https://www.gutenberg.org/files/3193/3193-h/3193-h.htm#2H_4_0002"> MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY </a>';
  const oldLettersLink = '<a href="https://www.gutenberg.org/files/3193/3193-h/3193-h.htm#2H_4_0003"> MARK TWAIN\'S LETTERS </a>';
  const oldCh1Link = '<a href="https://www.gutenberg.org/files/3193/3193-h/3193-h.htm#2H_4_0004"> <b>I.</b><br /> EARLY LETTERS, 1853. NEW YORK AND PHILADELPHIA </a>';
  
  // We can update the foreword, bio, letters, ch1 to point to Volume-1 instead of gutenberg external links,
  // and specifically Bio to point to /about!
  html = html.replace(oldBioLink, '<a href="/about"> MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY </a>');
  html = html.replace(oldTocLink, '<a href="/read/Volume-1#link2H_FORE"> FOREWORD </a>');
  html = html.replace(oldLettersLink, '<a href="/read/Volume-1#link2H_4_0003"> MARK TWAIN\'S LETTERS </a>');
  html = html.replace(oldCh1Link, '<a href="/read/Volume-1#link2H_4_0004"> <b>I.</b><br /> EARLY LETTERS, 1853. NEW YORK AND PHILADELPHIA </a>');

  // Let's also clean up other Volume I links in Letters.html to make them internal:
  const vol1Replacements = [
    { from: '3193-h.htm#2H_4_0005', to: 'Volume-1#link2H_4_0005' },
    { from: '3193-h.htm#2H_4_0006', to: 'Volume-1#link2H_4_0006' },
    { from: '3193-h.htm#2H_4_0008', to: 'Volume-1#link2H_4_0008' },
    { from: '3193-h.htm#2H_4_0009', to: 'Volume-1#link2H_4_0009' },
    { from: '3193-h.htm#2H_4_0011', to: 'Volume-1#link2H_4_0011' }
  ];

  vol1Replacements.forEach(rep => {
    const regex = new RegExp(`https:\\/\\/www\\.gutenberg\\.org\\/files\\/3193\\/3193-h\\/${rep.from}`, 'g');
    html = html.replace(regex, `/read/${rep.to}`);
  });

  fs.writeFileSync(lettersPath, html, 'utf8');
  console.log("Successfully updated Letters.html TOC links!");
}

updateVolume1();
updateLetters();
