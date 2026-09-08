const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '../apps/web');
const modelDir = __dirname;

console.log('=== PRANA Vercel Deployment Bridge ===');
console.log('Next.js web app directory:', webDir);
console.log('Bridge deployment directory:', modelDir);

console.log('\n--> Running npm run build in apps/web...');
execSync('npm run build', { cwd: webDir, stdio: 'inherit' });

const srcNext = path.join(webDir, '.next');
const destNext = path.join(modelDir, '.next');

console.log(`\n--> Syncing build output: ${srcNext} -> ${destNext}`);
fs.rmSync(destNext, { recursive: true, force: true });
fs.cpSync(srcNext, destNext, { recursive: true });

const srcPublic = path.join(webDir, 'public');
const destPublic = path.join(modelDir, 'public');
if (fs.existsSync(srcPublic)) {
  console.log(`--> Syncing public assets: ${srcPublic} -> ${destPublic}`);
  fs.rmSync(destPublic, { recursive: true, force: true });
  fs.cpSync(srcPublic, destPublic, { recursive: true });
}

const srcVercel = path.join(webDir, '.vercel');
const destVercel = path.join(modelDir, '.vercel');
if (fs.existsSync(srcVercel)) {
  console.log(`--> Syncing .vercel output: ${srcVercel} -> ${destVercel}`);
  fs.rmSync(destVercel, { recursive: true, force: true });
  fs.cpSync(srcVercel, destVercel, { recursive: true });
}

console.log('\n=== Vercel build and artifact sync completed successfully! ===\n');
