import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routeSlugs = ['index','about','history','deity','architecture','festivals','seva','donations','annadana','news','gallery','videos','panchanga','visitor-information','contact','privacy','terms','image-credits'];
const source = (await readFile(join(root,'site.js'),'utf8')).replace("document.addEventListener('DOMContentLoaded',init);",'');
const localeSource = await readFile(join(root,'locales-kn.js'),'utf8');
const faviconTags = [
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
  '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
  '<link rel="shortcut icon" href="/favicon.ico">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
  '<meta name="theme-color" content="#650b08">'
].join('\n  ');
const context = vm.createContext({});
vm.runInContext(localeSource, context);
vm.runInContext(`${source}\nglobalThis.renderTempleMarkup=(slug)=>{const key=slug==='index'?'home':slug;return header(key==='home')+(key==='home'?home():pageHtml(key,pages[key]))+footer()+'<div class="gallery-open" role="dialog" aria-modal="true" aria-label="Photograph viewer"><button type="button" aria-label="Close photograph">Close ✕</button><img alt=""></div>'}; globalThis.getTempleMeta=(slug)=>{const key=slug==='index'?'home':slug;const page=pages[key]||pages.about;return {title:key==='home'?'Shri Madhukeshwara Temple, Banavasi | Heritage & Visitor Information':page.title+' | Shri Madhukeshwara Temple, Banavasi',description:key==='home'?'Explore the heritage, architecture and visitor information for Shri Madhukeshwara Temple in Banavasi, Karnataka.':page.desc}};`, context);

const dictionary = context.templeTranslations.kn;
const dictionaryLower = new Map(Object.entries(dictionary).map(([english,kannada]) => [english.toLocaleLowerCase(), kannada]));
const getTranslation = value => dictionary[value] || dictionaryLower.get(value.toLocaleLowerCase());
const escapeAttribute = value => String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const decodeText = value => value.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const plainText = value => decodeText(value.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
function translateMarkup(markup) {
  const blockTags = 'p|h1|h2|h3|h4|h5|h6|li|strong|label|button|time|figcaption';
  markup = markup.replace(new RegExp(`<(${blockTags})(\\b[^>]*)>([\\s\\S]*?)<\\/\\1>`, 'gi'), (whole, tag, attrs, inner) => {
    if (/data-i18n-html-en=/.test(attrs)) return whole;
    const english = plainText(inner);
    const kannada = getTranslation(english);
    if (!kannada) return whole;
    let localized = kannada;
    const inlineTags = /<(a|strong|em|b|i)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    for (const match of inner.matchAll(inlineTags)) {
      const linkText = plainText(match[3]);
      const translatedLabel = getTranslation(linkText);
      if (!translatedLabel) continue;
      const localizedTag = `<${match[1]}${match[2]}>${translatedLabel}</${match[1]}>`;
      if (localized.includes(translatedLabel)) localized = localized.replace(translatedLabel, localizedTag);
      else if (match[1].toLowerCase() === 'a') localized += ` ${localizedTag}`;
    }
    return `<${tag}${attrs} data-i18n-html-en="${escapeAttribute(inner)}" data-i18n-html-kn="${escapeAttribute(localized)}">${localized}</${tag}>`;
  });
  markup = markup.replace(/>([^<>]+)</g, (whole, text) => {
    const english = decodeText(text).trim();
    if (!english || !/[A-Za-z]/.test(english)) return whole;
    const breadcrumbText = english.replace(/^[/\s\u3000]+/,'');
    const kannada = getTranslation(english) || getTranslation(breadcrumbText);
    if (!kannada) return whole;
    const leading = text.match(/^\s*/)?.[0] || '';
    const trailing = text.match(/\s*$/)?.[0] || '';
    return `>${leading}<span data-i18n-en="${escapeAttribute(english)}" data-i18n-kn="${escapeAttribute(kannada)}">${kannada}</span>${trailing}<`;
  });
  markup = markup.replace(/\b(alt|aria-label|title|placeholder)="([^"]*)"/g, (whole, attr, value) => {
    const english = decodeText(value);
    const photoViewer = attr === 'aria-label' ? english.match(/^View larger image:\s*(.*)$/i) : null;
    const kannada = photoViewer ? `ದೊಡ್ಡದಾಗಿ ವೀಕ್ಷಿಸಿ: ${getTranslation(photoViewer[1]) || photoViewer[1]}` : getTranslation(english);
    if (!kannada) return whole;
    return `${attr}="${escapeAttribute(kannada)}" data-i18n-${attr}-en="${escapeAttribute(english)}" data-i18n-${attr}-kn="${escapeAttribute(kannada)}"`;
  });
  return markup;
}
function setLocalizedHead(html, slug) {
  const meta = context.getTempleMeta(slug);
  const titleKn = dictionary[meta.title] || 'ಶ್ರೀ ಮಧುಕೇಶ್ವರ ದೇವಸ್ಥಾನ, ಬನವಾಸಿ';
  const descriptionKn = dictionary[meta.description] || 'ಬನವಾಸಿಯ ಶ್ರೀ ಮಧುಕೇಶ್ವರ ದೇವಸ್ಥಾನದ ಇತಿಹಾಸ, ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ಪ್ರವಾಸಿ ಮಾಹಿತಿಯನ್ನು ತಿಳಿಯಿರಿ.';
  html = html.replace(/<html\b([^>]*)lang="[^"]*"([^>]*)>/i, '<html$1lang="kn"$2>');
  html = html.replace(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i, `<title data-i18n-en="${escapeAttribute(meta.title)}" data-i18n-kn="${escapeAttribute(titleKn)}">${titleKn}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeAttribute(descriptionKn)}" data-i18n-content-en="${escapeAttribute(meta.description)}" data-i18n-content-kn="${escapeAttribute(descriptionKn)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeAttribute(titleKn)}" data-i18n-content-en="${escapeAttribute(meta.title)}" data-i18n-content-kn="${escapeAttribute(titleKn)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeAttribute(descriptionKn)}" data-i18n-content-en="${escapeAttribute(meta.description)}" data-i18n-content-kn="${escapeAttribute(descriptionKn)}">`);
  html = html.replace('Noto+Serif+Kannada:wght@400;500;600', 'Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Serif+Kannada:wght@400;500;600');
  if (!html.includes('src="locales-kn.js"')) html = html.replace('<script src="site.js" defer></script>', '<script src="locales-kn.js" defer></script><script src="site.js" defer></script>');
  return html;
}

for (const slug of routeSlugs) {
  const file = join(root, slug === 'index' ? 'index.html' : `${slug}.html`);
  let html = await readFile(file,'utf8');
  html = html.replace(/name="theme-color" content="[^"]+"/, 'name="theme-color" content="#650b08"');
  html = setLocalizedHead(html, slug);
  if (!html.includes('href="/favicon.svg"')) html = html.replace('</head>',`  ${faviconTags}\n</head>`);
  else if (!html.includes('href="/favicon-48x48.png"')) html = html.replace('</head>','  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">\n</head>');
  const markup = translateMarkup(context.renderTempleMarkup(slug));
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
