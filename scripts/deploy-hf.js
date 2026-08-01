const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'out');

// Ensure outDir exists
if (!fs.existsSync(outDir)) {
  console.error('Error: "out/" directory does not exist. Please run "npm run build:static" first.');
  process.exit(1);
}

// 1. Resolve HF remote URL (use environment variable or prompt/argument)
const hfUrl = process.env.HF_SPACE_URL || process.argv[2];
if (!hfUrl) {
  console.error('Error: Please provide HF_SPACE_URL environment variable or as an argument.');
  console.error('Example: node scripts/deploy-hf.js https://huggingface.co/spaces/Otrobonita/mark-twain');
  process.exit(1);
}

console.log('--- Initializing Hugging Face Git Deploy inside out/ ---');

try {
  // Init git if not already a repo
  if (!fs.existsSync(path.join(outDir, '.git'))) {
    execSync('git init -b main', { cwd: outDir, stdio: 'inherit' });
  }

  // Set remote origin
  try {
    execSync(`git remote remove origin`, { cwd: outDir, stdio: 'ignore' });
  } catch (e) {}
  execSync(`git remote add origin ${hfUrl}`, { cwd: outDir, stdio: 'inherit' });

  // Add files, commit, and push
  execSync('git add .', { cwd: outDir, stdio: 'inherit' });
  
  // Try committing. If there are no changes, it will fail, so we catch it.
  try {
    execSync('git commit -m "deploy: update static space build"', { cwd: outDir, stdio: 'inherit' });
  } catch (e) {
    console.log('No new changes to commit.');
  }

  console.log('Pushing to Hugging Face...');
  execSync('git push origin main --force', { cwd: outDir, stdio: 'inherit' });
  console.log('🚀 Successfully deployed to Hugging Face Space!');
} catch (err) {
  console.error('Deployment failed:', err.message);
  process.exit(1);
}
