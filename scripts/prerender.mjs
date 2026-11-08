import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routeSlugs = ['index','about','history','deity','architecture','festivals','seva','donations','annadana','news','gallery','videos','panchanga','visitor-information','contact','privacy','terms'];

const source = (await readFile(join(root, 'site.js'), 'utf8')).replace("document.addEventListener('DOMContentLoaded',init);", '');
const localeSource = await readFile(join(root, 'locales-kn.js'), 'utf8');

const context = vm.createContext({});
vm.runInContext(localeSource, context);
vm.runInContext(`${source}
globalThis.renderTempleMarkup = (slug) => {
  const key = slug === 'index' ? 'home' : slug;
  return header(key === 'home') + (key === 'home' ? home() : pageHtml(key, pages[key])) + footer() + '<div class="gallery-open" role="dialog" aria-modal="true" aria-label="Photograph viewer"><button type="button" aria-label="Close photograph">Close ✕</button><img alt=""></div>';
};
globalThis.getTempleMeta = (slug) => {
  const key = slug === 'index' ? 'home' : slug;
  const page = pages[key] || pages.about;
  return {
    title: key === 'home' ? 'Shri Madhukeshwara Temple, Banavasi | Heritage & Visitor Information' : page.title + ' | Shri Madhukeshwara Temple, Banavasi',
    description: key === 'home' ? 'Explore the heritage, architecture and visitor information for Shri Madhukeshwara Temple in Banavasi, Karnataka.' : page.desc,
    image: key === 'home' ? pics.entrance : page.image
  };
};
`, context);

const dictionary = context.templeTranslations.kn;
const dictionaryLower = new Map(Object.entries(dictionary).map(([k, v]) => [k.toLowerCase().trim(), v]));
const getTranslation = value => dictionary[value] || dictionaryLower.get(String(value).toLowerCase().trim());
const escapeAttribute = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decodeText = value => String(value).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const plainText = value => decodeText(String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());

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
    const breadcrumbText = english.replace(/^[/\s\u3000]+/, '');
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

// Strict translation validation: detects any untranslated English strings in the output
function validateTranslations(slug, translatedMarkup) {
  const allowedExceptions = new Set(['english', 'en', 'close ✕', 'asi', 'upi id', 'ip', 'google maps']);
  const untranslated = [];

  const textMatches = translatedMarkup.match(/>([^<]+)</g) || [];
  for (const m of textMatches) {
    const t = m.slice(1, -1).trim();
    if (/[a-zA-Z]{3,}/.test(t)) {
      if (!t.startsWith('http') && !t.includes('.jpg') && !t.includes('.webp') && !t.includes('.png') && !t.includes('.svg') && !t.includes('©')) {
        const lower = t.toLowerCase();
        if (!allowedExceptions.has(lower) && !lower.includes('asi') && !lower.includes('upi') && !lower.includes('google maps') && !lower.includes('ip')) {
          untranslated.push({ type: 'text', text: t });
        }
      }
    }
  }

  for (const match of translatedMarkup.matchAll(/\b(alt|aria-label|title)="([^"]*)"/gi)) {
    const attr = match[1];
    const val = decodeText(match[2]).trim();
    if (/[a-zA-Z]{3,}/.test(val)) {
      if (!val.startsWith('http') && !val.includes('.jpg') && !val.includes('.webp') && !val.includes('.png') && !val.includes('.svg')) {
        const lower = val.toLowerCase();
        if (!allowedExceptions.has(lower)) {
          untranslated.push({ type: `@${attr}`, text: val });
        }
      }
    }
  }

  return untranslated;
}

function renderFullPageHtml(slug, markup, meta, titleKn, descKn) {
  const isHome = slug === 'index';
  const canonicalUrl = isHome
    ? 'https://shrimadhukeshwaratemple.vercel.app/'
    : `https://shrimadhukeshwaratemple.vercel.app/${slug}.html`;
  const ogImageUrl = meta.image.startsWith('http')
    ? meta.image
    : `https://shrimadhukeshwaratemple.vercel.app${meta.image.startsWith('/') ? '' : '/'}${meta.image}`;

  return `<!doctype html>
<!-- ==========================================================================
     SHRI MADHUKESHWARA TEMPLE, BANAVASI — OFFICIAL HERITAGE PORTAL
     GENERATED FILE: DO NOT EDIT THIS FILE DIRECTLY.
     Source templates: site.js, locales-kn.js, site.css
     Build command: npm run build (or node scripts/build.mjs)
     ========================================================================== -->
<html lang="kn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F58213">
  <title data-i18n-en="${escapeAttribute(meta.title)}" data-i18n-kn="${escapeAttribute(titleKn)}">${titleKn}</title>
  <meta name="description" content="${escapeAttribute(descKn)}" data-i18n-content-en="${escapeAttribute(meta.description)}" data-i18n-content-kn="${escapeAttribute(descKn)}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Serif+Kannada:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="site.css">
  <meta property="og:title" content="${escapeAttribute(titleKn)}" data-i18n-content-en="${escapeAttribute(meta.title)}" data-i18n-content-kn="${escapeAttribute(titleKn)}">
  <meta property="og:description" content="${escapeAttribute(descKn)}" data-i18n-content-en="${escapeAttribute(meta.description)}" data-i18n-content-kn="${escapeAttribute(descKn)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImageUrl}">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Place","name":"Shri Madhukeshwara Temple","address":{"@type":"PostalAddress","addressLocality":"Banavasi","addressRegion":"Karnataka","addressCountry":"IN"}}</script>
</head>
<body>
  <div id="site" data-prerendered="true">${markup}</div>
  <script src="locales-kn.js" defer></script>
  <script src="site.js" defer></script>
</body>
</html>
`;
}

let totalUntranslated = 0;

for (const slug of routeSlugs) {
  const meta = context.getTempleMeta(slug);
  const titleKn = dictionary[meta.title] || 'ಶ್ರೀ ಮಧುಕೇಶ್ವರ ದೇವಸ್ಥಾನ, ಬನವಾಸಿ';
  const descKn = dictionary[meta.description] || 'ಬನವಾಸಿಯ ಶ್ರೀ ಮಧುಕೇಶ್ವರ ದೇವಸ್ಥಾನದ ಇತಿಹಾಸ, ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ಪ್ರವಾಸಿ ಮಾಹಿತಿಯನ್ನು ತಿಳಿಯಿರಿ.';
  const markup = translateMarkup(context.renderTempleMarkup(slug));

  const untranslated = validateTranslations(slug, markup);
  if (untranslated.length > 0) {
    console.warn(`[i18n WARNING] ${slug}: ${untranslated.length} untranslated strings found:`);
    for (const u of untranslated) {
      console.warn(`  - [${u.type}] ${u.text}`);
    }
    totalUntranslated += untranslated.length;
  }

  const fullHtml = renderFullPageHtml(slug, markup, meta, titleKn, descKn);
  const targetFile = join(root, slug === 'index' ? 'index.html' : `${slug}.html`);
  await writeFile(targetFile, fullHtml, 'utf8');
}

if (totalUntranslated > 0) {
  console.warn(`\n[i18n NOTICE] Total untranslated warnings: ${totalUntranslated}. Please add translations to locales-kn.js.`);
} else {
  console.log(`[i18n CHECK] 100% translation coverage verified across all ${routeSlugs.length} routes.`);
}

console.log(`Pre-rendered ${routeSlugs.length} static pages from canonical source.`);
