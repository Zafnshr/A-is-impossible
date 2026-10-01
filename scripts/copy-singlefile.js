import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('dist/index.html');
const dest = path.resolve('public/a-plus-is-impossible-singlefile.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log(`[build] Successfully synced ${src} -> ${dest}`);
} else {
  console.warn(`[build] Warning: ${src} does not exist, skipping copy.`);
}
