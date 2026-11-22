const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const nodeModulesRay = path.join(root, 'node_modules', '@ray');
const nodeModules = path.join(root, 'node_modules');

if (!fs.existsSync(nodeModulesRay)) {
  fs.mkdirSync(nodeModulesRay, { recursive: true });
}

const packages = fs.readdirSync(path.join(root, 'packages'));
let count = 0;

for (const pkg of packages) {
  if (pkg === 'examples') continue;
  const target = path.join(root, 'packages', pkg);
  const link = pkg.startsWith('create-')
    ? path.join(nodeModules, pkg)
    : path.join(nodeModulesRay, pkg);

  try {
    const stat = fs.lstatSync(link);
    if (stat.isSymbolicLink() || stat.isDirectory()) {
      fs.rmdirSync(link);
    } else {
      fs.unlinkSync(link);
    }
  } catch (e) {
    // doesn't exist
  }

  try {
    execSync(`cmd /c mklink /J "${link}" "${target}"`, { stdio: 'pipe' });
    count++;
  } catch (err) {
    console.error(`Failed to link ${pkg}:`, err.message);
  }
}

const demoLink = path.join(nodeModules, 'ray-demo');
const demoTarget = path.join(root, 'demo');
try {
  const stat = fs.lstatSync(demoLink);
  if (stat.isSymbolicLink() || stat.isDirectory()) {
    fs.rmdirSync(demoLink);
  }
} catch (e) {}

try {
  execSync(`cmd /c mklink /J "${demoLink}" "${demoTarget}"`, { stdio: 'pipe' });
  count++;
} catch (err) {
  console.error('Failed to link demo:', err.message);
}

console.log(`Successfully linked ${count} workspace packages/demo junctions.`);
