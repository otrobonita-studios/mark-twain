const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const rootDir = path.resolve(__dirname, '..');
const reportFile = path.join(rootDir, 'scratch', 'scan_report.md');

// Directories to ignore during recursive scanning if they are within src/public/scripts
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

const allFiles = getAllFiles(rootDir);

// Build path case maps for all files we scanned (plus all public images)
const fileCaseMap = new Map(); // lowercase absolute path -> actual absolute path
for (const file of allFiles) {
  fileCaseMap.set(file.toLowerCase(), file);
}

// Map all images in public
const publicDir = path.join(rootDir, 'public');
function mapAllImages(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      mapAllImages(filePath);
    } else {
      fileCaseMap.set(filePath.toLowerCase(), filePath);
    }
  }
}
mapAllImages(publicDir);

// Mojibake definitions
const mojibakePatterns = [
  { pattern: 'Ã¥', representation: 'å' },
  { pattern: 'Ã¤', representation: 'ä' },
  { pattern: 'Ã¶', representation: 'ö' },
  { pattern: 'Ã…', representation: 'Å' },
  { pattern: 'Ã„', representation: 'Ä' },
  { pattern: 'Ã–', representation: 'Ö' },
  { pattern: 'Ã©', representation: 'é' },
  { pattern: 'Ã¨', representation: 'è' },
  { pattern: 'Ã¡', representation: 'á' },
  { pattern: 'Ã³', representation: 'ó' },
  { pattern: 'Ã¦', representation: 'æ' },
  { pattern: 'Ã¸', representation: 'ø' },
  { pattern: 'â€™', representation: '’' },
  { pattern: 'â€œ', representation: '“' },
  { pattern: 'â€', representation: '”' }, 
  { pattern: 'â€\u009d', representation: '”' },
  { pattern: 'â€', representation: '” or similar curly quote / dash' },
  { pattern: 'ï¿½', representation: 'Replacement Character' },
  { pattern: '\uFFFD', representation: 'Replacement Character' }
];

const fileReports = {};
const decoder = new TextDecoder('utf-8', { fatal: true });

// Process each file
for (const file of allFiles) {
  if (isBinaryFile(file)) {
    continue;
  }
  
  const relativeFile = path.relative(rootDir, file).replace(/\\/g, '/');
  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(file);
  } catch (e) {
    console.error(`Failed to read file ${file}:`, e.message);
    continue;
  }
  
  const report = {
    utf8Invalid: false,
    invalidMessage: '',
    mojibakeCounts: {}, // pattern -> count
    mojibakeLines: [],  // list of first few occurrences
    missingImages: [],
    caseMismatchedImages: []
  };

  // 1. Check UTF-8 validity
  let text = '';
  try {
    text = decoder.decode(fileBuffer);
  } catch (err) {
    report.utf8Invalid = true;
    report.invalidMessage = err.message;
    text = fileBuffer.toString('utf8'); // fallback so we can scan mojibake/images
  }
  
  // 2. Check for Mojibake
  const lines = text.split(/\r?\n/);
  lines.forEach((lineText, lineIdx) => {
    for (const item of mojibakePatterns) {
      // Find all occurrences on this line
      let index = lineText.indexOf(item.pattern);
      while (index !== -1) {
        report.mojibakeCounts[item.pattern] = (report.mojibakeCounts[item.pattern] || 0) + 1;
        if (report.mojibakeLines.length < 5) {
          report.mojibakeLines.push({
            pattern: item.pattern,
            rep: item.representation,
            line: lineIdx + 1,
            text: lineText.trim()
          });
        }
        index = lineText.indexOf(item.pattern, index + 1);
      }
    }
  });

  // 3. Scan for image references
  const imgRegex1 = /(?:["']|url\()([a-zA-Z0-9_\-\.\/@]+?\.(?:png|jpg|jpeg|webp|svg|gif|bmp|xcf|ico))(?:\)|["'])/gi;
  const imgRegex2 = /!\[.*?\]\(([^)]+?\.(?:png|jpg|jpeg|webp|svg|gif|bmp|xcf|ico))\)/gi;

  const foundPaths = new Set();
  let match;
  while ((match = imgRegex1.exec(text)) !== null) {
    foundPaths.add(match[1]);
  }
  while ((match = imgRegex2.exec(text)) !== null) {
    foundPaths.add(match[1]);
  }

  for (const imgPath of foundPaths) {
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('//')) {
      continue;
    }

    let resolvedPath = '';
    if (imgPath.startsWith('@/')) {
      resolvedPath = path.join(rootDir, imgPath.replace(/^@\//, 'src/'));
    } else if (imgPath.startsWith('/')) {
      resolvedPath = path.join(rootDir, 'public', imgPath);
    } else {
      resolvedPath = path.resolve(path.dirname(file), imgPath);
      if (!fs.existsSync(resolvedPath)) {
        const publicTry = path.join(rootDir, 'public', imgPath);
        if (fs.existsSync(publicTry)) {
          resolvedPath = publicTry;
        }
      }
    }

    const resolvedLower = resolvedPath.toLowerCase();
    const existsInCaseMap = fileCaseMap.has(resolvedLower);
    const existsOnDisk = fs.existsSync(resolvedPath);

    if (!existsOnDisk && !existsInCaseMap) {
      report.missingImages.push({
        path: imgPath,
        resolved: path.relative(rootDir, resolvedPath).replace(/\\/g, '/')
      });
    } else {
      const actualPath = fileCaseMap.get(resolvedLower) || resolvedPath;
      const normActual = actualPath.replace(/\\/g, '/');
      const normResolved = resolvedPath.replace(/\\/g, '/');
      if (normActual !== normResolved) {
        report.caseMismatchedImages.push({
          path: imgPath,
          actual: path.relative(rootDir, actualPath).replace(/\\/g, '/')
        });
      }
    }
  }

  // Only store files that have issues
  const hasMojibake = Object.keys(report.mojibakeCounts).length > 0;
  const hasMissing = report.missingImages.length > 0;
  const hasMismatch = report.caseMismatchedImages.length > 0;

  if (report.utf8Invalid || hasMojibake || hasMissing || hasMismatch) {
    fileReports[relativeFile] = report;
  }
}

// Generate Markdown report
let md = `# Repository Health Analysis Report\n\n`;
md += `This report lists all files in the repository (\`src\`, \`public\`, \`scripts\`, and root level files) with UTF-8/Mojibake encoding issues and broken/case-mismatched image references. **No changes have been made to any file.**\n\n`;

// 1. High-level Summary
let totalUtf8IssuesCount = 0;
let totalMissingImages = 0;
let totalCaseMismatches = 0;
const utf8FilesList = [];
const imageFilesList = [];

for (const [relFile, report] of Object.entries(fileReports)) {
  const fileUtf8Total = Object.values(report.mojibakeCounts).reduce((a, b) => a + b, 0) + (report.utf8Invalid ? 1 : 0);
  if (fileUtf8Total > 0) {
    totalUtf8IssuesCount += fileUtf8Total;
    utf8FilesList.push({ file: relFile, count: fileUtf8Total, invalid: report.utf8Invalid });
  }
  const imgTotal = report.missingImages.length + report.caseMismatchedImages.length;
  if (imgTotal > 0) {
    totalMissingImages += report.missingImages.length;
    totalCaseMismatches += report.caseMismatchedImages.length;
    imageFilesList.push({ file: relFile, missing: report.missingImages.length, mismatched: report.caseMismatchedImages.length });
  }
}

md += `## High-Level Summary\n\n`;
md += `- **Total Files with Issues:** ${Object.keys(fileReports).length}\n`;
md += `- **UTF-8 / Mojibake Issues:** ${totalUtf8IssuesCount} issues across ${utf8FilesList.length} files.\n`;
md += `- **Missing / Broken Images:** ${totalMissingImages} references.\n`;
md += `- **Case Mismatch Images:** ${totalCaseMismatches} references.\n\n`;

// 2. Section: UTF-8 / Mojibake Issues
md += `## 1. UTF-8 & Mojibake Issues\n\n`;
if (utf8FilesList.length === 0) {
  md += `*No UTF-8 encoding or Mojibake issues found!*\n\n`;
} else {
  // Sort files by issue count descending
  utf8FilesList.sort((a, b) => b.count - a.count);
  
  md += `### Affected Files Summary\n\n`;
  md += `| File | UTF-8 Invalid | Mojibake Count | Status |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  for (const item of utf8FilesList) {
    md += `| \`${item.file}\` | ${item.invalid ? '❌ **Yes**' : '✅ No'} | ${item.count} | ${item.count > 100 ? '🔴 Major Corruption' : item.count > 5 ? '🟡 Moderate' : '🟢 Minor'} |\n`;
  }
  md += `\n`;

  md += `### Detailed Findings per File (Top Affected / Sample Occurrences)\n\n`;
  for (const item of utf8FilesList) {
    const report = fileReports[item.file];
    md += `#### 📄 [\`${item.file}\`](file:///${rootDir.replace(/\\/g, '/')}/${item.file})\n`;
    if (report.utf8Invalid) {
      md += `> ⚠️ **Invalid UTF-8 Byte Sequence:** This file failed to decode. Details: \`${report.invalidMessage}\`\n\n`;
    }
    
    md += `**Character Occurrence Counts:**\n`;
    for (const [pattern, count] of Object.entries(report.mojibakeCounts)) {
      const rep = mojibakePatterns.find(p => p.pattern === pattern)?.representation || '';
      md += `- \`${pattern}\` (should probably be \`${rep}\`): **${count}** times\n`;
    }
    md += `\n`;

    if (report.mojibakeLines.length > 0) {
      md += `**Sample lines:**\n`;
      md += `\`\`\`text\n`;
      for (const sample of report.mojibakeLines) {
        md += `Line ${sample.line}: [Found '${sample.pattern}' -> should be '${sample.rep}']\n  ${sample.text}\n\n`;
      }
      md += `\`\`\`\n\n`;
    }
  }
}

// 3. Section: Image Path Issues
md += `## 2. Image Path Issues\n\n`;
if (imageFilesList.length === 0) {
  md += `*All image path references are valid and casing matches perfectly!*\n\n`;
} else {
  md += `### Affected Files Summary\n\n`;
  md += `| File | Missing Images | Case Mismatches |\n`;
  md += `| :--- | :---: | :---: |\n`;
  for (const item of imageFilesList) {
    md += `| \`${item.file}\` | ${item.missing} | ${item.mismatched} |\n`;
  }
  md += `\n`;

  md += `### Detailed Image Findings per File\n\n`;
  for (const item of imageFilesList) {
    const report = fileReports[item.file];
    md += `#### 📄 [\`${item.file}\`](file:///${rootDir.replace(/\\/g, '/')}/${item.file})\n`;
    
    if (report.missingImages.length > 0) {
      md += `**❌ Missing Images (${report.missingImages.length}):**\n`;
      // If there are too many (e.g. Huck Finn has 100+), show a summary or the list up to 15, then indicate how many more.
      const displayMissing = report.missingImages.slice(0, 15);
      for (const img of displayMissing) {
        md += `- Referenced: \`${img.path}\` (resolves to \`${img.resolved}\`)\n`;
      }
      if (report.missingImages.length > 15) {
        md += `- *...and ${report.missingImages.length - 15} more missing images in this file.*\n`;
      }
      md += `\n`;
    }

    if (report.caseMismatchedImages.length > 0) {
      md += `**⚠️ Case-Mismatched Images (${report.caseMismatchedImages.length}):**\n`;
      for (const img of report.caseMismatchedImages) {
        md += `- Referenced: \`${img.path}\` but actual file is: \`${img.actual}\`\n`;
      }
      md += `\n`;
    }
  }
}

fs.writeFileSync(reportFile, md);
console.log(`Aggregated markdown report successfully written to ${reportFile}`);
