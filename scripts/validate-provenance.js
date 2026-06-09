// scripts/validate-provenance.js
const fs = require('fs');
const path = require('path');

// 1. Transpile provenance.ts to standard JavaScript dynamically
const tsPath = path.join(__dirname, '../src/data/provenance.ts');
if (!fs.existsSync(tsPath)) {
  console.error(`Error: provenance.ts not found at ${tsPath}`);
  process.exit(1);
}

let tsContent = fs.readFileSync(tsPath, 'utf8');

// Strip TypeScript interfaces and type assertions to make it executable CommonJS
tsContent = tsContent.replace(/export interface [\s\S]*?\n\}/g, '');
tsContent = tsContent.replace(/export const storyProvenance: Record<string, ProvenanceEntry> =/, 'const storyProvenance =');
tsContent += '\nmodule.exports = { storyProvenance };';

// Write to a temporary file in scratch/
const scratchDir = path.join(__dirname, '../scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}
const tempJsPath = path.join(scratchDir, 'provenance_transpiled.js');
fs.writeFileSync(tempJsPath, tsContent, 'utf8');

// Load storyProvenance
const { storyProvenance } = require(tempJsPath);

// List of custom/hand-coded routes that don't map to a static HTML file
const customRoutes = new Set([
  'eves-diary',
  'Eves-Diary-young-readers'
]);

// Helper to check if a slug resolves to a valid page
function isValidSlug(slug) {
  if (customRoutes.has(slug)) return true;
  // Check if .html file exists in src/data/books
  const htmlPath = path.join(__dirname, '../src/data/books', `${slug}.html`);
  return fs.existsSync(htmlPath);
}

console.log('--- STARTING PROVENANCE REGISTRY VALIDATION ---');
let errors = 0;
let warnings = 0;

// Iterate through the registry
for (const [key, entry] of Object.entries(storyProvenance)) {
  console.log(`Checking entry: "${key}" (${entry.title})`);

  // Check genre
  if (!['story', 'sketch', 'essay'].includes(entry.genre)) {
    console.error(`  [ERROR] Invalid genre: "${entry.genre}". Expected story, sketch, or essay.`);
    errors++;
  }

  // Check year range
  const year = entry.canonical.year;
  if (!year || typeof year !== 'number' || year < 1867 || year > 1910) {
    console.error(`  [ERROR] Invalid publication year: ${year}. Plausible range is 1867 to 1910.`);
    errors++;
  }

  // Check canonical slug existence
  const canonicalSlug = entry.canonical.slug;
  if (canonicalSlug !== null) {
    if (!isValidSlug(canonicalSlug)) {
      console.error(`  [ERROR] Canonical slug "${canonicalSlug}" does not map to a real page.`);
      errors++;
    }
  }

  // Check reprints
  if (!Array.isArray(entry.reprints)) {
    console.error(`  [ERROR] reprints must be an array.`);
    errors++;
  } else {
    for (const reprint of entry.reprints) {
      // Check reprint slug validity
      if (!isValidSlug(reprint.slug)) {
        console.error(`  [ERROR] Reprint slug "${reprint.slug}" does not map to a real page.`);
        errors++;
      }

      // Check for self-referential reprint listing: reprint slug cannot be entry's canonical slug
      if (reprint.slug === canonicalSlug) {
        console.error(`  [ERROR] Piece lists its own canonical slug "${reprint.slug}" as a reprint.`);
        errors++;
      }

      // If the entry key represents the canonical standalone page itself
      if (key === canonicalSlug && reprint.slug === key) {
        console.error(`  [ERROR] Canonical standalone "${key}" lists itself in reprints.`);
        errors++;
      }
    }
  }
}

// 2. Validate all JSON books to ensure data-canonical-slug resolves to an entry in the registry
const jsonDir = path.join(__dirname, '../src/data/books/json');
if (fs.existsSync(jsonDir)) {
  const jsonFiles = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  for (const file of jsonFiles) {
    const bookPath = path.join(jsonDir, file);
    try {
      const doc = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
      if (doc && Array.isArray(doc.sections)) {
        for (const section of doc.sections) {
          if (section.canonicalSlug) {
            // Must map to an entry in the registry
            if (!storyProvenance[section.canonicalSlug]) {
              console.error(`  [ERROR] JSON ${file} section "${section.title}" has canonicalSlug "${section.canonicalSlug}", which is missing from storyProvenance registry.`);
              errors++;
            }
          }
        }
      }
    } catch (err) {
      console.error(`  [ERROR] Failed to parse JSON book ${file}: ${err.message}`);
      errors++;
    }
  }
}

console.log('\n--- VALIDATION SUMMARY ---');
console.log(`Errors found: ${errors}`);
console.log(`Warnings found: ${warnings}`);

if (errors > 0) {
  console.error('Validation FAILED!');
  process.exit(1);
} else {
  console.log('Validation PASSED successfully!');
  process.exit(0);
}
