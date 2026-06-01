// scripts/generate_social_comments.js
// This script scans all *.txt files in the TwainCorpus directory, extracts quote-like lines, and builds
// a JSON array adhering to the schema defined for social comments. It writes the result to
// agents/social-comment/social-comments.json.

const fs = require('fs');
const path = require('path');

// Directory containing the corpus .txt files
const corpusDir = path.resolve(__dirname, '..', 'rag', 'data-collection', 'TwainCorpus');

// Output file for the generated quotes
const outputFile = path.resolve(__dirname, '..', 'agents', 'social-comment', 'social-comments.json');

// Simple list of names to filter out (personal names). Extend as needed.
const forbiddenNames = [
  'Mark Twain', 'Samuel Clemens', 'Alice', 'Bob', 'John', 'Jane', 'Emily', 'Michael', 'Sarah',
];

// Helper to determine if a string contains any forbidden name (case‑insensitive)
function containsForbiddenName(text) {
  const lower = text.toLowerCase();
  return forbiddenNames.some(name => lower.includes(name.toLowerCase()));
}

// Heuristic to extract quote blocks: lines that start and end with double quotes or are surrounded by "\n"
function extractQuotesFromFile(content) {
  const quotes = [];
  // Split into sentences (basic heuristic)
  const sentences = content.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length >= 40 && trimmed.length <= 200 && !containsForbiddenName(trimmed)) {
      quotes.push(trimmed);
    }
  }
  return quotes;
}

function inferMetadataFromPath(filePath) {
  // Very naive metadata inference – use filename as work, unknown year, empty source_note.
  const base = path.basename(filePath, '.txt');
  return {
    work: base.replace(/[_-]/g, ' '),
    year: null,
    source_note: `Derived from ${base}.txt`,
    themes: [],
    confidence: 'documented'
  };
}

function generateSocialComments() {
  const results = [];
  // Recursively collect all .txt files
  function collectTxtFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(collectTxtFiles(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.txt')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = collectTxtFiles(corpusDir);
  files.forEach(file => {
    const fullPath = file; // file already contains absolute path from collectTxtFiles
    const raw = fs.readFileSync(fullPath, 'utf8');
    const quotes = extractQuotesFromFile(raw);
    const meta = inferMetadataFromPath(fullPath);
    quotes.forEach(q => {
      results.push({
        quote: q,
        work: meta.work,
        year: meta.year,
        source_note: meta.source_note,
        themes: meta.themes,
        confidence: meta.confidence
      });
    });
  });

  // Write pretty‑printed JSON
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Generated ${results.length} social comments to ${outputFile}`);
}

generateSocialComments();
