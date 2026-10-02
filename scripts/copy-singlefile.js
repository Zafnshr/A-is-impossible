import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('dist/index.html');
const destPublicA = path.resolve('public/a-is-impossible-singlefile.html');
const destDistA = path.resolve('dist/a-is-impossible-singlefile.html');
const destPublicLegacy = path.resolve('public/a-plus-is-impossible-singlefile.html');
const destDistLegacy = path.resolve('dist/a-plus-is-impossible-singlefile.html');

if (fs.existsSync(src)) {
  const content = fs.readFileSync(src, 'utf8');

  // Verify that the generated dist/index.html is valid single-file HTML
  if (!content.toLowerCase().includes('<!doctype html') || !content.includes('id="root"')) {
    console.error('[build] Error: dist/index.html is not a valid HTML document!');
    process.exit(1);
  }

  fs.copyFileSync(src, destPublicA);
  fs.copyFileSync(src, destDistA);
  fs.copyFileSync(src, destPublicLegacy);
  fs.copyFileSync(src, destDistLegacy);
  console.log(`[build] Successfully synced singlefile bundles:`);
  console.log(`   -> ${destPublicA}`);
  console.log(`   -> ${destDistA}`);
} else {
  console.warn(`[build] Warning: ${src} does not exist, skipping copy.`);
}
