import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

console.log('================================================================');
console.log('  SHRI MADHUKESHWARA TEMPLE WEBSITE — CANONICAL BUILD PIPELINE  ');
console.log('================================================================');

console.log('\n[1/2] Compiling 17 routes from canonical source (site.js + locales-kn.js)...');
const prerender = spawnSync('node', [join(root, 'scripts', 'prerender.mjs')], { stdio: 'inherit' });
if (prerender.status !== 0) {
  console.error('\n[FATAL] Build failed during prerender compilation.');
  process.exit(prerender.status || 1);
}

console.log('\n[2/2] Validating routes, link integrity, and image assets...');
const check = spawnSync('node', [join(root, 'scripts', 'check-static-routes.mjs')], { stdio: 'inherit' });
if (check.status !== 0) {
  console.error('\n[FATAL] Build failed during route validation.');
  process.exit(check.status || 1);
}

console.log('\n================================================================');
console.log('  BUILD SUCCESS: All 17 pages compiled and verified clean!     ');
console.log('================================================================\n');

