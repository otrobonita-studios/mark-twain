const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Directories to ignore during scanning
function shouldIgnoreDir(dirName) {
  const ignoreDirs = [
    '.git',
    'node_modules',
    '.next',
    'out',
    '.firebase',
    '.vercel',
    'scratch',
    '.venv',
    'venv',
    'env'
  ];
  return ignoreDirs.includes(dirName);
}

// Check if file is binary
function isBinaryFile(filePath) {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.bmp', '.xcf',
    '.ttf', '.woff', '.woff2', '.otf', '.eot',
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
    '.zip', '.pdf', '.tar.gz', '.gz', '.db', '.map', '.mp4', '.mov',
    '.svg', '.epub'
  ];
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

// Get all files recursively in specific allowed directories
function getAllFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (dir === rootDir) {
        // At the root, only descend into target directories
        if (['src', 'public', 'scripts'].includes(file)) {
          getAllFiles(filePath, filesList);
        }
      } else {
        if (!shouldIgnoreDir(file)) {
          getAllFiles(filePath, filesList);
        }
      }
    } else {
      if (file === 'package-lock.json') continue;
      filesList.push(filePath);
    }
  }
  return filesList;
}

// Mojibake definitions
const replacements = [
  // 3-byte mojibakes first (most specific)
  { pattern: /â€”/g, replacement: '—', name: 'Em Dash' },
  { pattern: /â€“/g, replacement: '–', name: 'En Dash' },
  { pattern: /â€¦/g, replacement: '…', name: 'Ellipsis' },
  { pattern: /â€œ/g, replacement: '“', name: 'Left Curly Double Quote' },
  { pattern: /â€/g, replacement: '”', name: 'Right Curly Double Quote' },
  { pattern: /â€\u009d/g, replacement: '”', name: 'Right Curly Double Quote Alt' },
  { pattern: /â€˜/g, replacement: '‘', name: 'Left Curly Single Quote' },
  { pattern: /â€™/g, replacement: '’', name: 'Right Curly Single Quote / Apostrophe' },
  { pattern: /â€²/g, replacement: '′', name: 'Prime Character' },
  { pattern: /â€¢/g, replacement: '•', name: 'Bullet' }, // Added bullet

  // Latin-1 characters
  { pattern: /Ã¦/g, replacement: 'æ', name: 'Ligature ae' },
  { pattern: /Ã†/g, replacement: 'Æ', name: 'Capital Ligature ae' },
  { pattern: /Ã©/g, replacement: 'é', name: 'Small e acute' },
  { pattern: /Ã¨/g, replacement: 'è', name: 'Small e grave' },
  { pattern: /Ã¡/g, replacement: 'á', name: 'Small a acute' },
  { pattern: /Ã³/g, replacement: 'ó', name: 'Small o acute' },
  { pattern: /Ã¥/g, replacement: 'å', name: 'Swedish å' },
  { pattern: /Ã¤/g, replacement: 'ä', name: 'Swedish ä' },
  { pattern: /Ã¶/g, replacement: 'ö', name: 'Swedish ö' },
  { pattern: /Ã…/g, replacement: 'Å', name: 'Swedish Å' },
  { pattern: /Ã„/g, replacement: 'Ä', name: 'Swedish Ä' },
  { pattern: /Ã–/g, replacement: 'Ö', name: 'Swedish Ö' },
  
  // Specific pronunciation Mojibake from NSRW entry
  { pattern: /klÄ•m/g, replacement: 'klĕm', name: 'Pronunciation symbol ĕ' },

  // Catch-all for remaining â€ on its own (becomes hyphen/dash)
  { pattern: /â€/g, replacement: '-', name: 'Hyphen / Dash' }
];

const allFiles = getAllFiles(rootDir);
let processedFilesCount = 0;
let updatedFilesCount = 0;

console.log(`Starting UTF-8 Mojibake character correction...`);
console.log(`Found ${allFiles.length} files total to check.`);

for (const file of allFiles) {
  if (isBinaryFile(file)) {
    continue;
  }
  
  processedFilesCount++;
  
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`Failed to read file ${file}:`, e.message);
    continue;
  }
  
  let updatedContent = content;
  const counts = {};
  
  // Run all replacements
  for (const item of replacements) {
    const matchCount = (content.match(item.pattern) || []).length;
    if (matchCount > 0) {
      counts[item.name] = matchCount;
      updatedContent = updatedContent.replace(item.pattern, item.replacement);
    }
  }
  
  // If content has changed, save the file
  if (updatedContent !== content) {
    try {
      fs.writeFileSync(file, updatedContent, 'utf8');
      updatedFilesCount++;
      const relativeFile = path.relative(rootDir, file).replace(/\\/g, '/');
      console.log(`Updated [${updatedFilesCount}]: ${relativeFile}`);
      for (const [name, count] of Object.entries(counts)) {
        console.log(`  - Replaced ${count} instance(s) of ${name}`);
      }
    } catch (e) {
      console.error(`Failed to write file ${file}:`, e.message);
    }
  }
}

console.log(`\nCorrection completed!`);
console.log(`Processed text files: ${processedFilesCount}`);
console.log(`Updated files: ${updatedFilesCount}`);
