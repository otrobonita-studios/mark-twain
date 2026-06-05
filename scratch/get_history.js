const { execSync } = require('child_process');

try {
  console.log("=== Git status ===");
  console.log(execSync('git status', { encoding: 'utf8' }));

  console.log("=== Git log (oneline) ===");
  console.log(execSync('git log --oneline -n 10', { encoding: 'utf8' }));

  console.log("=== Git show HEAD~1:src/data/about.html ===");
  console.log(execSync('git show HEAD~1:src/data/about.html', { encoding: 'utf8' }));
} catch (error) {
  console.error("Error executing git command:", error.message);
  if (error.stdout) console.log("Stdout:", error.stdout);
  if (error.stderr) console.error("Stderr:", error.stderr);
}
