// Builds the STUDY® pages from js/study.js:
//   study.html              the archive
//   study/<slug>.html       one page per post
//   sitemap.xml
// Static HTML, so the text, images and metadata (Open Graph, Twitter cards,
// JSON-LD) are there for search engines and link previews.
// Usage: node tools/build-study.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://good-maker.vercel.app';
const POSTS = require('../js/study.js');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const date = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function head({ title, description, url, image, imageAlt, type = 'website', extra = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${SITE}${url}">
  <meta name="theme-color" content="#0000ff">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:site_name" content="GOOD® DESIGN">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${SITE}${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${SITE}${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}${image}">
  <meta name="twitter:image:alt" content="${esc(imageAlt)}">
${extra}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
</head>`;
}

const masthead = (back) => `
<header class="st-bar">
  <a class="st-wordmark" href="/">GOOD® <span>DESIGN</span></a>
  <nav class="st-nav" aria-label="Main">
    ${back}
    <a href="/colors.html">COLORS®</a>
    <a href="/">OUTFITTER</a>
    <a href="/collaborations.html">COLLABORATIONS®</a>
  </nav>
</header>`;

function block(b, first) {
  if (b.p) return `<p${first ? ' class="st-first"' : ''}>${b.p}${b.end ? ' <span class="st-end" aria-hidden="true">■</span>' : ''}</p>`;
  if (b.note) return `<p class="st-note">${b.note}</p>`;
  if (b.q) return `<p class="st-q">${b.q}</p>`;
  if (b.quote) return `<blockquote class="st-pull"><p>${b.quote}</p></blockquote>`;
  // A shape the text wraps around (CSS shape-outside follows the image's outline).
  // The mask carries the gap beside each row, so nothing bleeds up or down into the gaps.
  if (b.wrap) return `<img class="st-wrap" src="${b.wrap}" alt="${esc(b.alt)}" style="--cols:${b.cols || 4}">`;
  if (b.head) return `<h2 class="st-h">${b.head}</h2>`;
  if (b.fig) return `<figure class="st-fig st-wide"><img src="${b.fig}" alt="${esc(b.alt)}" loading="lazy"><figcaption>${b.caption || ''}</figcaption></figure>`;
  if (b.pair) return `<figure class="st-fig st-wide st-pair st-n${b.pair.length}">${b.pair.map((i) => `<div class="st-tile"><img src="${i.img}" alt="${esc(i.alt)}" loading="lazy"></div>`).join('')}<figcaption>${b.caption || ''}</figcaption></figure>`;
  if (b.gallery) return `<section class="st-gallery st-wide">${b.title ? `<h3>${b.title}</h3>` : ''}<div class="st-grid st-n${b.gallery.length}">${b.gallery.map((i) => `<figure><div class="st-tile"><img src="${i.img}" alt="${esc(`${i.label}: ${i.sub}`)}" loading="lazy"></div><figcaption><strong>${i.label}</strong><span>${i.sub}</span></figcaption></figure>`).join('')}</div>${b.caption ? `<p class="st-gcap">${b.caption}</p>` : ''}</section>`;
  throw new Error(`Unknown block: ${JSON.stringify(b)}`);
}

function postPage(post) {
  const url = `/study/${post.slug}.html`;
  const full = `${post.title}: ${post.dek.replace(/\.$/, '')}`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: full, description: post.description, image: [`${SITE}${post.og}`],
    datePublished: post.date, dateModified: post.date, mainEntityOfPage: `${SITE}${url}`,
    author: { '@type': 'Organization', name: 'GOOD® DESIGN', url: SITE },
    publisher: { '@type': 'Organization', name: 'GOOD® DESIGN', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/apple-touch-icon.png` } },
  };
  const extra = `  <meta property="article:published_time" content="${post.date}">
  <meta property="article:section" content="STUDY®">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
`;
  let firstP = true;
  const body = post.body.map((b) => { const f = firstP && !!b.p; if (b.p) firstP = false; return block(b, f); }).join('\n      ');
  return `${head({ title: `${full} · STUDY® · GOOD® DESIGN`, description: post.description, url, image: post.og, imageAlt: post.lead.alt, type: 'article', extra })}
<body class="st">
${masthead('<a href="/study.html">← STUDY®</a>')}
<main>
  <article class="st-article" data-slug="${post.slug}">
    <header class="st-head">
      <p class="st-rubric">${post.rubric}</p>
      <h1>${post.title}</h1>
      <p class="st-dek">${post.dek}</p>
      <p class="st-byline">By <strong>${post.byline}</strong> <time datetime="${post.date}">${date(post.date)}</time></p>
    </header>
    <figure class="st-lead">
      <img src="${post.lead.img}" alt="${esc(post.lead.alt)}">
      <figcaption>${post.lead.caption}</figcaption>
    </figure>
    <div class="st-body">
      ${body}
    </div>
    <section class="st-comments" aria-labelledby="stCommentsTitle">
      <h2 class="st-h" id="stCommentsTitle">Comments</h2>
      <form class="st-form" id="stForm" autocomplete="off">
        <input name="name" maxlength="40" placeholder="Name (optional)" aria-label="Name">
        <textarea name="text" maxlength="1000" rows="4" placeholder="Say something GOOD®." aria-label="Comment" required></textarea>
        <input class="st-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="st-form-foot"><span id="stFormMsg" aria-live="polite"></span><button type="submit">Post</button></div>
      </form>
      <ol class="st-list" id="stComments"></ol>
    </section>
  </article>
</main>
<footer class="st-foot">© 2026 GOOD® DESIGN. All rights reserved. <a href="/study.html">More from STUDY®</a></footer>
<script src="/js/study-comments.js"></script>
<script src="/js/nav.js"></script>
</body>
</html>
`;
}

function archivePage() {
  const items = POSTS.map((p, i) => `
    <article class="st-item${i === 0 ? ' st-feature' : ''}">
      <a class="st-item-img" href="/study/${p.slug}.html" tabindex="-1" aria-hidden="true"><img src="${p.thumb}" alt=""></a>
      <div class="st-item-text">
        <p class="st-rubric">${p.rubric}</p>
        <h2><a href="/study/${p.slug}.html">${p.title}</a></h2>
        <p class="st-dek">${p.dek}</p>
        <p class="st-byline">By <strong>${p.byline}</strong> <time datetime="${p.date}">${date(p.date)}</time></p>
      </div>
    </article>`).join('');
  const latest = POSTS[0];
  return `${head({ title: 'STUDY® · GOOD® DESIGN', description: 'STUDY®: notes, experiments and conversations from the GOOD® DESIGN studio. Every idea, including the ones that didn’t make it.', url: '/study.html', image: latest.og, imageAlt: latest.lead.alt })}
<body class="st">
<script>
  // Old links (study.html?p=<slug>) go to the post's own page.
  (() => { const p = new URLSearchParams(location.search).get('p'); if (p && /^[a-z0-9-]+$/.test(p)) location.replace('/study/' + p + '.html'); })();
</script>
${masthead('<a href="/">← BACK</a>')}
<main class="st-archive">
  <header class="st-mast">
    <h1>STUDY<span>®</span></h1>
    <p>Notes, experiments and conversations from the GOOD® studio. Every idea, including the ones that didn’t make it.</p>
  </header>
  ${items}
</main>
<footer class="st-foot">© 2026 GOOD® DESIGN. All rights reserved.</footer>
<script src="/js/nav.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(ROOT, 'study'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'study.html'), archivePage());
for (const p of POSTS) fs.writeFileSync(path.join(ROOT, 'study', `${p.slug}.html`), postPage(p));
// Sitemap: the fixed pages plus every post.
const urls = ['/', '/colors.html', '/study.html', '/among-the-trees.html', '/collaborations.html'].map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
  .concat(POSTS.map((p) => `  <url><loc>${SITE}/study/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>`));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`STUDY®: archive + ${POSTS.length} post(s) + sitemap written.`);
