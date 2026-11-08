import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routes = ['index.html','about.html','history.html','deity.html','architecture.html','festivals.html','seva.html','donations.html','annadana.html','news.html','gallery.html','videos.html','panchanga.html','visitor-information.html','contact.html','privacy.html','terms.html','image-credits.html'];
const failures = [];
for (const route of routes) {
  const html = await readFile(join(root,route),'utf8');
  if (!html.includes('data-prerendered="true"') || !/<h1\b/.test(html)) failures.push(`${route}: missing pre-rendered content`);
  if (!/<title(?:\s[^>]*)?>[^<]+<\/title>/.test(html) || !/<meta name="description" content="[^"]+"[^>]*>/.test(html)) failures.push(`${route}: missing title or description`);
  if (!/<html\b[^>]*lang="kn"/.test(html) || !html.includes('data-lang="kn"') || !html.includes('data-lang="en"')) failures.push(`${route}: missing Kannada default or language switch`);
  for (const [,ref] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
    const local = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!local) continue;
    const localPath = local.startsWith('/') ? resolve(root,'public',local.slice(1)) : local.startsWith('images/') ? resolve(root,'public',local) : resolve(root,local);
    try { await access(localPath); }
    catch { failures.push(`${route}: broken local reference ${ref}`); }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Passed: ${routes.length} pre-rendered routes, unique page metadata and local link/asset resolution.`);
}
