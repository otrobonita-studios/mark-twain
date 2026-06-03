const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const illustrationsDir = path.join(__dirname, '../public/images/book-illustrations');

// 1. Get all disk illustration folders
const diskFolders = fs.readdirSync(illustrationsDir).filter(f => {
  return fs.statSync(path.join(illustrationsDir, f)).isDirectory();
});

console.log('Disk illustration folders:', diskFolders);

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

// 3. Scan books and find all image patterns
const htmlFiles = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));

const foundPaths = new Set();
const resolutionMap = {};

htmlFiles.forEach(file => {
  const filePath = path.join(booksDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find paths matching `/images/mark-twain/...` or `/images/...`
  // We look for patterns like src="/images/..."
  const regex = /(?:src|href)="\/images\/([^/"]+)\/([^/"]+\.[a-zA-Z0-9]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawPath = match[0];
    const pathBookDir = match[1];
    const filename = match[2];
    
    // Ignore cover carousel images or static assets
    if (pathBookDir === 'book-covers' || pathBookDir === 'book-illustrations' || pathBookDir === 'carousel') {
      continue;
    }
    
    // If it starts with mark-twain/
    let bookDir = pathBookDir;
    let isMarkTwainPrefix = false;
    if (bookDir === 'mark-twain') {
      // The match is actually /images/mark-twain/BookTitle/Filename
      // Let's parse with a more specific regex for /images/mark-twain/...
      isMarkTwainPrefix = true;
    }
    
    foundPaths.add(pathBookDir);
  }
});

console.log('\nFound path directories in HTML:', Array.from(foundPaths));

// Let's refine the pattern matching to get book directory name
const specificRegex = /(?:src|href)="\/images\/(mark-twain\/)?([^/"]+)\/([^/"]+\.[a-zA-Z0-9]+)"/g;
const detailedMatches = [];

htmlFiles.forEach(file => {
  const filePath = path.join(booksDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  let match;
  while ((match = specificRegex.exec(content)) !== null) {
    const prefix = match[1] || ''; // 'mark-twain/' or ''
    const bookDirName = match[2];
    const filename = match[3];
    
    if (bookDirName === 'book-covers' || bookDirName === 'book-illustrations' || bookDirName === 'carousel') {
      continue;
    }
    
    const resolvedFolder = getActualFolder(bookDirName);
    
    detailedMatches.push({
      file,
      original: `/images/${prefix}${bookDirName}/${filename}`,
      resolvedBookDir: bookDirName,
      resolvedFolder,
      filename,
      targetPath: resolvedFolder ? `/images/book-illustrations/${resolvedFolder}/images/${filename}` : 'COULD NOT RESOLVE'
    });
  }
});

// Print unique resolutions
const uniqueResolutions = {};
detailedMatches.forEach(m => {
  uniqueResolutions[m.resolvedBookDir] = {
    resolvedFolder: m.resolvedFolder,
    sampleTargetPath: m.targetPath
  };
});

console.log('\nUnique resolutions mapping:');
console.log(JSON.stringify(uniqueResolutions, null, 2));
