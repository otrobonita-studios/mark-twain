const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const ragDir = path.join(__dirname, '../rag');
const illustrationsDir = path.join(__dirname, '../public/images/book-illustrations');

// 1. Get all disk illustration folders
const diskFolders = fs.readdirSync(illustrationsDir).filter(f => {
  return fs.statSync(path.join(illustrationsDir, f)).isDirectory();
});

// 2. Build normalization map
function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const diskMap = {};
diskFolders.forEach(folder => {
  diskMap[normalize(folder)] = folder;
});

// Manual overrides
const manualOverrides = {
  'adventuresoftomsawyer': 'Tom_Sawyer',
  'captainstormfieldsvisttoheaven': 'Captain-Stormfields-Visit-to-Heaven',
  'captainstormfieldsvisttoheavenhtml': 'Captain-Stormfields-Visit-to-Heaven',
  'connecticutyankee': 'Connecticut_Yankee',
  'huckleberryfinn': 'Huckleberry_Finn',
  'tomsawyer': 'Tom_Sawyer'
};

function getActualFolder(bookName) {
  const norm = normalize(bookName);
  if (manualOverrides[norm]) {
    return manualOverrides[norm];
  }
  
  // Try direct normalized match
  if (diskMap[norm]) {
    return diskMap[norm];
  }
  
  // Try substring matches (e.g., "adventuresoftomsawyer" containing "tomsawyer")
  for (const [normDisk, folder] of Object.entries(diskMap)) {
    if (norm.includes(normDisk) || normDisk.includes(norm)) {
      return folder;
    }
  }
  
  return null;
}

// Helper to recursively find html files
function findHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Gather all HTML files to process
const htmlFiles = [
  ...findHtmlFiles(booksDir),
  ...findHtmlFiles(ragDir)
];

console.log(`Gathered ${htmlFiles.length} HTML files to inspect.`);

const specificRegex = /(src|href|data-zoom-src)="\/images\/(mark-twain\/)?([^/"]+)\/([^/"]+\.[a-zA-Z0-9]+)"/gi;

let totalReplaced = 0;
let filesModifiedCount = 0;

htmlFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  let replacedCountInFile = 0;
  
  const updatedContent = content.replace(specificRegex, (match, attr, prefix, bookDirName, filename) => {
    // Ignore standard folders
    if (bookDirName === 'book-covers' || bookDirName === 'book-illustrations' || bookDirName === 'carousel') {
      return match;
    }
    
    const resolvedFolder = getActualFolder(bookDirName);
    if (!resolvedFolder) {
      console.warn(`[WARN] Could not resolve illustration folder for directory: "${bookDirName}" in file: ${path.basename(filePath)}`);
      return match;
    }
    
    let targetPath;
    if (resolvedFolder === 'eves-diary') {
      targetPath = `/images/book-illustrations/eves-diary/${filename}`;
    } else {
      targetPath = `/images/book-illustrations/${resolvedFolder}/images/${filename}`;
    }
    
    replacedCountInFile++;
    totalReplaced++;
    return `${attr}="${targetPath}"`;
  });
  
  if (replacedCountInFile > 0) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    filesModifiedCount++;
    console.log(`Updated ${replacedCountInFile} paths in ${path.relative(path.join(__dirname, '..'), filePath)}`);
  }
});

console.log(`\nDone! Modified ${filesModifiedCount} files, replacing a total of ${totalReplaced} image paths.`);
