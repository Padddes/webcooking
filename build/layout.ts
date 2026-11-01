import type { Content } from './content.ts';
import { html, type SafeHtml } from './lib/html.ts';
import { icon } from './lib/icons.ts';

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageMeta {
  /** Root-relative route, e.g. "/poe/tools/". Used for canonical URL and active nav. */
  path: string;
  title: string;
  description: string;
  breadcrumbs?: Crumb[];
  /** Extra class on <body>, e.g. "page-tool" for workspace-style pages. */
  bodyClass?: string;
  /** Set for the 404 page: no canonical URL, not indexed. */
  noindex?: boolean;
}

export interface Assets {
  css: string;
  boot: string;
  nav: string;
}

function isActive(itemHref: string, path: string): 'page' | 'section' | null {
  if (itemHref === path) return 'page';
  if (itemHref !== '/' && path.startsWith(itemHref)) return 'section';
  return null;
}

function navLink(item: { label: string; href: string; icon: string }, path: string, level: 'top' | 'sub'): SafeHtml {
  const state = isActive(item.href, path);
  return html`<a class="nav-link nav-link--${level}${state ? ' is-active' : ''}" href="${item.href}"${
    state === 'page' ? html` aria-current="page"` : ''
  } data-tooltip="${item.label}">${icon(item.icon)}<span class="nav-label">${item.label}</span></a>`;
}

function sidebar(content: Content, path: string): SafeHtml {
  return html`<aside id="sidebar" class="sidebar" aria-label="Site navigation">
  <div class="sidebar-head">
    <a class="brand" href="/" aria-label="${content.site.title} home"><span class="brand-mark" aria-hidden="true">P</span><span class="brand-text">${content.site.title}</span></a>
    <button class="icon-button drawer-close" type="button" data-drawer-close aria-label="Close menu">${icon('close')}</button>
  </div>
  <nav aria-label="Main">
    <ul class="nav-list">
      ${content.navigation.items.map(
        (item) => html`<li>
        ${navLink(item, path, 'top')}
        ${
          item.children?.length
            ? html`<ul class="nav-sublist" aria-label="${item.label}">
          ${item.children.map((child) => html`<li>${navLink(child, path, 'sub')}</li>`)}
        </ul>`
            : ''
        }
      </li>`,
      )}
    </ul>
  </nav>
  <button class="collapse-toggle" type="button" data-sidebar-toggle aria-pressed="false" aria-controls="sidebar">
    ${icon('collapse')}<span class="nav-label">Collapse sidebar</span>
  </button>
</aside>`;
}

function breadcrumbs(crumbs: Crumb[] | undefined): SafeHtml | '' {
  if (!crumbs || crumbs.length < 2) return '';
  return html`<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>
    ${crumbs.map((c, i) =>
      i === crumbs.length - 1 || !c.href
        ? html`<li><span aria-current="page">${c.label}</span></li>`
        : html`<li><a href="${c.href}">${c.label}</a></li>`,
    )}
  </ol></nav>`;
}

export function layout(content: Content, assets: Assets, page: PageMeta, main: SafeHtml): string {
  const { site } = content;
  const fullTitle = page.path === '/' ? site.title : `${page.title} · ${site.title}`;
  const canonical = `${site.url}${page.path}`;
  const doc = html`<!doctype html>
<html lang="${site.language}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${page.description}">
${page.noindex ? html`<meta name="robots" content="noindex">` : html`<link rel="canonical" href="${canonical}">`}
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${page.description}">
<meta property="og:type" content="website">
${page.noindex ? '' : html`<meta property="og:url" content="${canonical}">`}
<meta name="theme-color" content="#16140f">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${assets.css}">
<script src="${assets.boot}"></script>
<script src="${assets.nav}" type="module"></script>
</head>
<body class="${page.bodyClass ?? ''}">
<a class="skip-link" href="#main">Skip to content</a>
<div class="shell">
  <header class="topbar">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">P</span><span class="brand-text">${site.title}</span></a>
    <button class="icon-button menu-button" type="button" data-drawer-open aria-controls="sidebar" aria-expanded="false" aria-label="Open menu">${icon('menu')}</button>
  </header>
  ${sidebar(content, page.path)}
  <div class="drawer-backdrop" data-drawer-close hidden></div>
  <div class="main-col">
    <main id="main" tabindex="-1">
      ${breadcrumbs(page.breadcrumbs)}
      ${main}
    </main>
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${site.title}</p>
      <p class="fine-print">${site.footerNote}</p>
    </footer>
  </div>
</div>
</body>
</html>
`;
  return doc.value;
}
