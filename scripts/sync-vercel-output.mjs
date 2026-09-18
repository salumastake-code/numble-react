/**
 * sync-vercel-output.mjs
 * Copies SEO files from dist/ into .vercel/output/static/
 * so that --prebuilt deploys pick up robots.txt, sitemap.xml, and route folders.
 */
import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');
const out = resolve(root, '.vercel', 'output', 'static');

if (!existsSync(out)) {
  console.log('[sync] .vercel/output/static does not exist — skipping (first build?)');
  process.exit(0);
}

// Files to copy
const filesToCopy = ['robots.txt', 'sitemap.xml'];
// Route folders to copy (pre-rendered index.html copies)
const routesToCopy = ['auth', 'rules', 'privacy', 'terms'];

for (const file of filesToCopy) {
  const src = resolve(dist, file);
  const dest = resolve(out, file);
  if (existsSync(src)) {
    cpSync(src, dest);
    console.log(`[sync] ${file} → .vercel/output/static/${file}`);
  }
}

for (const route of routesToCopy) {
  const src = resolve(dist, route);
  const dest = resolve(out, route);
  if (existsSync(src)) {
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`[sync] ${route}/ → .vercel/output/static/${route}/`);
  }
}

console.log('[sync] done');
