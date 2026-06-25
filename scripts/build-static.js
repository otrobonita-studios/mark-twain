const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const routesToDisable = [
  'src/app/api/txt/route.js',
  'src/app/api/epub/route.js',
  'src/app/api/chat/route.js',
  'src/app/api/research/route.js',
  'src/app/api/proxy/route.js',
  'src/app/api/agents/agent-twain/route.js',
  'src/app/api/agents/quote-collector/route.js'
];

console.log('--- Preparing Static HTML Export ---');

const disabledRoutes = [];

routesToDisable.forEach(routeRelPath => {
  const fullPath = path.join(root, routeRelPath);
  const tempPath = fullPath + '_temp';
  if (fs.existsSync(fullPath)) {
    try {
      fs.renameSync(fullPath, tempPath);
      disabledRoutes.push({ original: fullPath, temp: tempPath });
      console.log(`Temporarily disabled: ${routeRelPath}`);
    } catch (e) {
      console.error(`Failed to rename ${routeRelPath}:`, e.message);
    }
  }
});

let buildSuccess = true;
try {
  console.log('Executing build: "npm run build" with BUILDING_FOR_FIREBASE=true...');
  execSync('npm run build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BUILDING_FOR_FIREBASE: 'true' }
  });
  console.log('Build completed successfully.');
} catch (err) {
  console.error('Build execution failed:', err);
  buildSuccess = false;
} finally {
  disabledRoutes.forEach(route => {
    if (fs.existsSync(route.temp)) {
      try {
        fs.renameSync(route.temp, route.original);
        console.log(`Restored: ${path.relative(root, route.original)}`);
      } catch (e) {
        console.error(`Failed to restore ${path.relative(root, route.original)}:`, e.message);
      }
    }
  });
  if (!buildSuccess) {
    process.exit(1);
  }
}
