import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('dist/index.html');
const destPublic = path.resolve('public/a-plus-is-impossible-singlefile.html');
const destDist = path.resolve('dist/a-plus-is-impossible-singlefile.html');

if (fs.existsSync(src)) {
  const content = fs.readFileSync(src, 'utf8');

  // Verify that the generated dist/index.html is valid single-file HTML
  if (!content.toLowerCase().includes('<!doctype html') || !content.includes('id="root"')) {
    console.error('[build] Error: dist/index.html is not a valid HTML document!');
    process.exit(1);
  }

  fs.copyFileSync(src, destPublic);
  fs.copyFileSync(src, destDist);
  console.log(`[build] Successfully synced singlefile bundle:`);
  console.log(`   -> ${destPublic}`);
  console.log(`   -> ${destDist}`);
} else {
  console.warn(`[build] Warning: ${src} does not exist, skipping copy.`);
}
