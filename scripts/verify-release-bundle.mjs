import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

if (!fs.existsSync('dist')) {
  console.error('dist directory missing (build did not run or failed)');
  process.exit(1);
}

if (!fs.existsSync('dist/simon42-dashboard-strategy.js')) {
  console.error('dist/simon42-dashboard-strategy.js missing');
  process.exit(1);
}

const files = fs.readdirSync('dist');

const requiredChunkPatterns = {
  core: /^simon42-dashboard-strategy-core\.[a-f0-9]{8}\.js$/,
  lit: /^simon42-dashboard-strategy-lit\.[a-f0-9]{8}\.js$/,
  views: /^simon42-dashboard-strategy-views\.[a-f0-9]{8}\.js$/,
  editor: /^simon42-dashboard-strategy-editor\.[a-f0-9]{8}\.js$/,
};

for (const [chunkName, pattern] of Object.entries(requiredChunkPatterns)) {
  const hasChunk = files.some((file) => pattern.test(file));
  if (!hasChunk) {
    console.error(`Missing required chunk file for '${chunkName}' in dist/`);
    process.exit(1);
  }
}

const hasAnyLicenseFile = files.some((file) => file.endsWith('.js.LICENSE.txt'));
if (!hasAnyLicenseFile) {
  console.error('No .js.LICENSE.txt files found in dist/');
  process.exit(1);
}

console.log('Bundle check passed: entry + required hashed chunks + license files present');
