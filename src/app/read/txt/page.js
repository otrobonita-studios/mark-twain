import fs from 'fs';
import path from 'path';
import TxtReaderClient from '../../../components/TxtReaderClient';

export const metadata = {
  title: "Document Viewer — Mark Twain Reappears",
  description: "View text manuscripts in classic document editors.",
};

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
  
  // 3. Recursive fallback under the 'rag' directory
  const ragDir = path.join(baseDir, 'rag');
  if (fs.existsSync(ragDir)) {
    const recursivePath = searchRecursively(ragDir, filename);
    if (recursivePath) {
      return recursivePath;
    }
  }

  // 4. Default fallback to current working directory
  return path.join(baseDir, filename);
}

function searchRecursively(dir, filename) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.venv') {
        const found = searchRecursively(fullPath, filename);
        if (found) return found;
      }
    } else if (file.toLowerCase() === filename.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

export default async function TxtViewerPage(props) {
  // Support both page components async parameters in Next.js 15+
  const searchParams = await props.searchParams;
  const file = searchParams?.file || '';

  if (!file) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ff5555' }}>
        Error: No file specified. Please provide a file parameter (e.g. ?file=Adventures-of-Tom-Sawyer.txt)
      </div>
    );
  }

  // Prevent directory traversal attacks
  const safeFilename = path.basename(file);
  const filePath = findFilePath(safeFilename);

  let content = '';
  let error = null;

  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    error = `File not found: ${safeFilename}`;
  }

  return (
    <TxtReaderClient 
      filename={safeFilename} 
      initialContent={content} 
      initialError={error} 
    />
  );
}
