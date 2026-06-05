const { execSync } = require('child_process');
const fs = require('fs');
try {
  const log = execSync('git log --oneline -n 10', { encoding: 'utf8' });
  fs.writeFileSync('scratch/git_fast.txt', 'LOG:\n' + log);
  
  try {
    const show = execSync('git show HEAD~1:src/data/about.html', { encoding: 'utf8' });
    fs.appendFileSync('scratch/git_fast.txt', '\n\nSHOW HEAD~1:\n' + show);
  } catch (err) {
    fs.appendFileSync('scratch/git_fast.txt', '\n\nSHOW ERROR:\n' + err.message);
  }
} catch (e) {
  fs.writeFileSync('scratch/git_fast.txt', 'ERROR:\n' + e.message + '\n' + e.stderr);
}
console.log("Done");
