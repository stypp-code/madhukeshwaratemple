import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routeSlugs = ['index','about','history','deity','architecture','festivals','seva','donations','annadana','news','gallery','videos','panchanga','visitor-information','contact','privacy','terms','image-credits'];
const source = (await readFile(join(root,'site.js'),'utf8')).replace("document.addEventListener('DOMContentLoaded',init);",'');
const context = vm.createContext({});
vm.runInContext(`${source}\nglobalThis.renderTempleMarkup=(slug)=>{const key=slug==='index'?'home':slug;return header()+(key==='home'?home():pageHtml(key,pages[key]))+footer()+'<div class="gallery-open" role="dialog" aria-modal="true" aria-label="Photograph viewer"><button type="button" aria-label="Close photograph">Close ✕</button><img alt=""></div>'};`, context);

for (const slug of routeSlugs) {
  const file = join(root, slug === 'index' ? 'index.html' : `${slug}.html`);
  let html = await readFile(file,'utf8');
  html = html.replace(/name="theme-color" content="[^"]+"/, 'name="theme-color" content="#283451"');
  const markup = context.renderTempleMarkup(slug);
  const rootStart = html.indexOf('<div id="site"');
  if (rootStart < 0) throw new Error(`Missing site mount in ${slug}.html`);
  const divTags = /<\/?div\b[^>]*>/g;
  divTags.lastIndex = 0;
  let depth = 0;
  let rootEnd = -1;
  for (const match of html.slice(rootStart).matchAll(divTags)) {
    if (match[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) { rootEnd = rootStart + match.index + match[0].length; break; }
  }
  if (rootEnd < 0) throw new Error(`Unclosed site mount in ${slug}.html`);
  html = html.slice(0,rootStart) + `<div id="site" data-prerendered="true">${markup}</div>` + html.slice(rootEnd);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'');
  const structured = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Place","name":"Shri Madhukeshwara Temple","address":{"@type":"PostalAddress","addressLocality":"Banavasi","addressRegion":"Karnataka","addressCountry":"IN"}}</script>';
  if (!html.includes('application/ld+json')) html = html.replace('</head>',`${structured}</head>`);
  await writeFile(file,html,'utf8');
}
console.log(`Pre-rendered ${routeSlugs.length} static pages.`);
