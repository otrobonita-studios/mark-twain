import fs from 'fs';
import path from 'path';

// Helper function to search for the file in expected corpus directories
function findFilePath(filename) {
  const baseDir = process.cwd();
  
  // 1. Direct check in project gutenberg Works directory
  const gutenbergPath = path.join(baseDir, 'rag', 'data-collection', 'TwainCorpus', 'project-gutenberg', 'Works', filename);
  if (fs.existsSync(gutenbergPath)) {
    return gutenbergPath;
  }
  
  // 2. Direct check in rag/data-collection/ folder
  const dataCollectionPath = path.join(baseDir, 'rag', 'data-collection', filename);
  if (fs.existsSync(dataCollectionPath)) {
    return dataCollectionPath;
  }
  
  // 3. Recursive fallback under the 'rag/data-collection/TwainCorpus' directory
  const corpusDir = path.join(baseDir, 'rag', 'data-collection', 'TwainCorpus');
  if (fs.existsSync(corpusDir)) {
    const recursivePath = searchRecursively(corpusDir, filename, 0);
    if (recursivePath) {
      return recursivePath;
    }
  }

  // 4. Default fallback to current working directory
  return path.join(baseDir, filename);
}

function searchRecursively(dir, filename, depth = 0) {
  if (depth > 4) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.venv' && file !== '__pycache__') {
        const found = searchRecursively(fullPath, filename, depth + 1);
        if (found) return found;
      }
    } else if (file.toLowerCase() === filename.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || '';

    if (!file) {
      return Response.json({ success: false, error: "No file specified" }, { status: 400 });
    }

    const safeFilename = path.basename(file);
    const filePath = findFilePath(safeFilename);

    if (!fs.existsSync(filePath)) {
      return Response.json({ success: false, error: `File not found: ${safeFilename}` }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return Response.json({ success: true, filename: safeFilename, content });
  } catch (err) {
    console.error("API Txt Reading Error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
