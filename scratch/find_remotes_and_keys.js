const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const devDir = 'E:\\development';

function runCmd(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return `ERROR: ${err.message}\nStdout: ${err.stdout}\nStderr: ${err.stderr}`;
  }
}

async function audit() {
  console.log(`Starting audit in ${devDir}...\n`);
  const items = fs.readdirSync(devDir);

  for (const item of items) {
    const itemPath = path.join(devDir, item);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const gitPath = path.join(itemPath, '.git');
    if (!fs.existsSync(gitPath)) {
      // Check if it contains json/env credentials directly
      checkDirFilesForSecrets(itemPath);
      continue;
    }

    console.log(`========================================`);
    console.log(`REPOSITORY: ${item}`);
    console.log(`Path: ${itemPath}`);

    // Check remotes
    const remotes = runCmd('git remote -v', itemPath);
    console.log(`Remotes:\n${remotes || 'None'}\n`);

    // Check status
    const status = runCmd('git status --porcelain', itemPath);
    if (status) {
      console.log(`Uncommitted/untracked files:\n${status}\n`);
    }

    // Check currently tracked secret files
    const trackedFilesStr = runCmd('git ls-files', itemPath);
    const trackedFiles = trackedFilesStr.split('\n').filter(Boolean);
    for (const f of trackedFiles) {
      const fPath = path.join(itemPath, f);
      if (fs.existsSync(fPath) && !fs.statSync(fPath).isDirectory()) {
        const content = fs.readFileSync(fPath, 'utf8');
        if (content.includes('AIzaSy') || content.includes('private_key') || content.includes('-----BEGIN PRIVATE KEY-----')) {
          console.log(`⚠️  TRACKED SECRET FILE COMMITTED: ${f}`);
        }
      }
    }

    // Check git history
    console.log(`Checking git history for "AIza"...`);
    const historyAIza = runCmd('git log -S "AIza" --oneline', itemPath);
    if (historyAIza && !historyAIza.includes('ERROR:')) {
      console.log(`⚠️  FOUND "AIza" IN COMMIT HISTORY:\n${historyAIza}\n`);
    }

    console.log(`Checking git history for "private_key"...`);
    const historyPK = runCmd('git log -S "private_key" --oneline', itemPath);
    if (historyPK && !historyPK.includes('ERROR:')) {
      console.log(`⚠️  FOUND "private_key" IN COMMIT HISTORY:\n${historyPK}\n`);
    }

    console.log('\n');
  }
}

function checkDirFilesForSecrets(dirPath) {
  // Recursively search for json files or env files that have keys, up to a certain depth
  function search(dir, depth = 0) {
    if (depth > 3) return;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next') continue;
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          search(itemPath, depth + 1);
        } else if (stat.isFile()) {
          if (item.endsWith('.json') || item.includes('env') || item.endsWith('.txt') || item.endsWith('.js') || item.endsWith('.ts')) {
            const content = fs.readFileSync(itemPath, 'utf8');
            if (content.includes('-----BEGIN PRIVATE KEY-----') || (content.includes('AIzaSy') && !content.includes('gtag'))) {
              console.log(`⚠️  EXPOSED SECRET FILE IN NON-GIT / UNTRACKED DIRECTORY: ${itemPath}`);
            }
          }
        }
      }
    } catch (e) {}
  }
  search(dirPath);
}

audit().catch(console.error);
