import fs from 'node:fs';
import path from 'node:path';

const darkSrc = 'C:/Users/abdal/.gemini/antigravity/brain/3ef3bff3-7003-43de-8883-8e9e30fa2afb/minimal_slash_a_dark_1790962046388.jpg';
const lightSrc = 'C:/Users/abdal/.gemini/antigravity/brain/3ef3bff3-7003-43de-8883-8e9e30fa2afb/minimal_slash_a_light_1790962063946.jpg';

const targetDir = path.resolve('public/brand');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(darkSrc, path.resolve('public/brand/logo-dark.png'));
fs.copyFileSync(lightSrc, path.resolve('public/brand/logo-light.png'));
fs.copyFileSync(darkSrc, path.resolve('public/brand/logo.png'));
fs.copyFileSync(darkSrc, path.resolve('public/brand/logo-app-icon.png'));
fs.copyFileSync(darkSrc, path.resolve('public/logo.png'));

console.log('[brand] Successfully deployed ultra-clean 2D minimal slash logos (dark and light)!');
