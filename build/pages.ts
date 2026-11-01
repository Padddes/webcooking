import type { Content } from './content.ts';
import type { PageMeta } from './layout.ts';
import { html, inline, type SafeHtml } from './lib/html.ts';
import { icon } from './lib/icons.ts';

export interface Page {
  meta: PageMeta;
  main: SafeHtml;
  /** Output file relative to dist/, e.g. "poe/index.html". */
  file: string;
}

const HOME = { label: 'Home', href: '/' };
const POE = { label: 'Path of Exile', href: '/poe/' };

function fileFor(path: string): string {
  return path === '/' ? 'index.html' : `${path.replace(/^\//, '')}index.html`;
}

function page(meta: PageMeta, main: SafeHtml): Page {
  return { meta, main, file: fileFor(meta.path) };
}

const statusLabel = {
  available: 'Available',
  'in-development': 'In development',
  planned: 'Planned',
} as const;

export function buildPages(content: Content): Page[] {
  const { home, about, poe, tools, glossary } = content;
  const publishedTerms = glossary.terms.filter((t) => t.published);
  const pages: Page[] = [];

  // ── Home ──────────────────────────────────────────────────────────────
  pages.push(
    page(
      { path: '/', title: home.title, description: home.seoDescription },
      html`<section class="hero">
  <h1>${home.heading}</h1>
  <p class="lead">${inline(home.lead)}</p>
</section>
<section class="feature-card" aria-labelledby="featured-title">
  <div class="feature-card__art" aria-hidden="true">${icon('poe', 'feature-glyph')}</div>
  <div class="feature-card__body">
    <p class="eyebrow">${home.featured.eyebrow}</p>
    <h2 id="featured-title">${home.featured.title}</h2>
    <p>${inline(home.featured.text)}</p>
    <ul class="button-row">
      ${home.featured.links.map(
        (l, i) => html`<li><a class="button${i === 0 ? ' button--primary' : ''}" href="${l.href}">${l.label}${icon('arrow')}</a></li>`,
      )}
    </ul>
  </div>
</section>
${home.intro ? html`<section class="prose intro"><h2>Hello</h2><p>${inline(home.intro)}</p><p><a href="/about/">More about this site</a></p></section>` : ''}`,
    ),
  );

  // ── About ─────────────────────────────────────────────────────────────
  pages.push(
    page(
      { path: '/about/', title: about.title, description: about.seoDescription, breadcrumbs: [HOME, { label: about.title }] },
      html`<article class="prose">
  <h1>${about.heading}</h1>
  ${about.body.map((p) => html`<p>${inline(p)}</p>`)}
</article>`,
    ),
  );

  // ── PoE hub ───────────────────────────────────────────────────────────
  pages.push(
    page(
      { path: '/poe/', title: poe.title, description: poe.seoDescription, breadcrumbs: [HOME, { label: poe.title }] },
      html`<section class="hero hero--section">
  <p class="eyebrow">Learning hub</p>
  <h1>${poe.heading}</h1>
  <p class="lead">${inline(poe.lead)}</p>
</section>
<section aria-labelledby="learn-title">
  <div class="section-head">
    <h2 id="learn-title">Learn</h2>
    <a href="/poe/guides/">All guides</a>
  </div>
  <ul class="card-grid">
    ${poe.categories.map(
      (c) => html`<li><a class="card" href="/poe/guides/#${c.id}">
      <h3>${c.label}</h3>
      <p>${c.description}</p>
    </a></li>`,
    )}
  </ul>
</section>
<section aria-labelledby="tools-title">
  <div class="section-head">
    <h2 id="tools-title">Tools</h2>
    <a href="/poe/tools/">All tools</a>
  </div>
  <ul class="card-grid card-grid--wide">
    ${tools.tools
      .filter((t) => t.href)
      .map(
        (t) => html`<li><a class="card" href="${t.href}">
      <span class="status status--${t.status}">${statusLabel[t.status]}</span>
      <h3>${t.label}</h3>
      <p>${t.description}</p>
    </a></li>`,
      )}
    <li><a class="card" href="/poe/glossary/">
      <h3>Glossary</h3>
      <p>Short definitions of the terms and abbreviations you'll see in guides and chat.</p>
    </a></li>
  </ul>
</section>`,
    ),
  );

  // ── Guides index ──────────────────────────────────────────────────────
  pages.push(
    page(
      {
        path: '/poe/guides/',
        title: 'Guides',
        description: 'Path of Exile 1 guides by topic: getting started, character building, damage, defences, items and endgame.',
        breadcrumbs: [HOME, POE, { label: 'Guides' }],
      },
      html`<header class="page-head">
  <h1>Guides</h1>
  <p class="lead">Grouped by topic. Each guide starts with a quick explanation, then a worked example and the common mistakes.</p>
</header>
<nav class="chip-row" aria-label="Guide categories">
  ${poe.categories.map((c) => html`<a class="chip" href="#${c.id}">${c.label}</a>`)}
</nav>
${poe.categories.map(
  (c) => html`<section class="category" id="${c.id}" aria-labelledby="${c.id}-title">
  <h2 id="${c.id}-title">${c.label}</h2>
  <p class="muted">${c.description}</p>
  <p class="empty-state">No guides published in this category yet.</p>
</section>`,
)}`,
    ),
  );

  // ── Glossary ──────────────────────────────────────────────────────────
  pages.push(
    page(
      {
        path: '/poe/glossary/',
        title: 'Glossary',
        description: 'Path of Exile 1 terms and abbreviations explained in plain language.',
        breadcrumbs: [HOME, POE, { label: 'Glossary' }],
      },
      html`<header class="page-head">
  <h1>Glossary</h1>
  <p class="lead">Short, plain definitions of Path of Exile terms and abbreviations.</p>
</header>
${
  publishedTerms.length
    ? html`<dl class="glossary">${publishedTerms
        .sort((a, b) => a.term.localeCompare(b.term))
        .map((t) => html`<div id="${t.id}"><dt>${t.term}</dt><dd>${inline(t.definition)}</dd></div>`)}</dl>`
    : html`<p class="empty-state">The first glossary entries are being written and checked.</p>`
}`,
    ),
  );

  // ── Tools index ───────────────────────────────────────────────────────
  pages.push(
    page(
      { path: '/poe/tools/', title: tools.title, description: tools.seoDescription, breadcrumbs: [HOME, POE, { label: tools.title }] },
      html`<header class="page-head">
  <h1>${tools.heading}</h1>
  <p class="lead">${inline(tools.lead)}</p>
</header>
<ul class="card-grid card-grid--wide">
  ${tools.tools.map((t) =>
    t.href
      ? html`<li><a class="card" href="${t.href}">
      <span class="status status--${t.status}">${statusLabel[t.status]}</span>
      <h3>${t.label}</h3><p>${t.description}</p></a></li>`
      : html`<li><div class="card card--static">
      <span class="status status--${t.status}">${statusLabel[t.status]}</span>
      <h3>${t.label}</h3><p>${t.description}</p></div></li>`,
  )}
</ul>`,
    ),
  );

  // ── Map regex (placeholder until milestone 3) ─────────────────────────
  pages.push(
    page(
      {
        path: '/poe/tools/regex/',
        title: 'Map regex builder',
        description: 'Build a Path of Exile 1 stash search for map modifiers.',
        breadcrumbs: [HOME, POE, { label: 'Tools', href: '/poe/tools/' }, { label: 'Map regex builder' }],
        bodyClass: 'page-tool',
      },
      html`<header class="page-head">
  <span class="status status--in-development">In development</span>
  <h1>Map regex builder</h1>
  <p class="lead">Choose the map modifiers you want to avoid and the ones you want, then copy a search string to paste into your stash search.</p>
</header>
<div class="notice" role="status">
  <p><strong>Not available yet.</strong> The builder is being made and checked against the game's actual search behaviour before it goes live, so it never gives you a search that silently misses mods.</p>
</div>`,
    ),
  );

  return pages;
}

export function notFoundPage(): Page {
  return {
    file: '404.html',
    meta: { path: '/404.html', title: 'Page not found', description: 'This page does not exist.', noindex: true },
    main: html`<section class="hero">
  <p class="eyebrow">404</p>
  <h1>This page doesn't exist</h1>
  <p class="lead">The link may be old, or the address may have a typo.</p>
  <ul class="button-row">
    <li><a class="button button--primary" href="/">Go to the homepage${icon('arrow')}</a></li>
    <li><a class="button" href="/poe/">Path of Exile hub</a></li>
  </ul>
</section>`,
  };
}
