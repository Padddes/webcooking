# Architecture

## Overview

paddes.lu is a static site. A small build script written in TypeScript turns JSON content into HTML pages. Interactive parts run in the browser. There is no server and no database.

```
src/content/   JSON content (pages, navigation, glossary; guides and regex data later)
src/styles/    CSS: tokens.css → base.css → layout.css → components.css (concatenated in that order)
src/client/    Browser TypeScript; types are stripped at build time, one file = one module
public/        Static files copied as-is (favicon, later images)
build/         Build script, page templates, content schemas, preview server
tests/         node:test suites
docs/          Decisions, architecture, later: setup, editing and rollback guides
dist/          Build output (not committed)
```

## Build pipeline (`build/build.ts`)

1. `build/content.ts` loads every content file and validates it against schemas in `build/lib/schema.ts`. Unknown fields, wrong types, bad links or duplicate ids stop the build with the file and field path.
2. CSS files are concatenated into `assets/site.<hash>.css`.
3. Each `src/client/*.ts` file has its types stripped with `node:module` `stripTypeScriptTypes` and is written as `assets/<name>.<hash>.js`. Hashed names allow year-long caching.
4. `build/pages.ts` defines every route; `build/layout.ts` wraps each in the shared shell (sidebar, breadcrumbs, footer).
5. `sitemap.xml`, `robots.txt`, `404.html` and Cloudflare `_headers` are written.

## Routes

| Route | Source |
| --- | --- |
| `/` | `pages/home.json` |
| `/about/` | `pages/about.json` |
| `/poe/` | `pages/poe.json` + `pages/tools.json` |
| `/poe/guides/` | `pages/poe.json` categories (guides arrive in milestone 2) |
| `/poe/glossary/` | `glossary/terms.json` (only `published: true` entries) |
| `/poe/tools/` | `pages/tools.json` |
| `/poe/tools/regex/` | placeholder until milestone 3 |
| `/404.html` | `build/pages.ts` |

Every route is a folder with `index.html`, so direct links and refreshes work on any static host. The preview server mirrors Cloudflare Pages: `/about` redirects to `/about/`, and unknown paths get `404.html` with status 404.

## Navigation

- Desktop (≥ 900 px): sticky sidebar. It can collapse to icons, the choice is saved on the device, and labels stay available to screen readers and as tooltips.
- Mobile: a top bar with a menu button that opens the sidebar as a modal drawer. Focus stays inside it, Escape closes it, focus returns to the button, and the rest of the page is made `inert` while it's open.
- Without JavaScript the navigation shows inline below the top bar.

## Hosting (planned)

Cloudflare Pages with build command `npm run build`, output `dist`, and Node version from `.nvmrc`. No functions are needed for public pages. The CMS login will need one small OAuth component, documented when added in milestone 4.

## Known trade-offs of the no-dependency build

- There's no type-checker. Types are documentation, so mistakes surface in tests, not at compile time.
- There's no image pipeline yet. Images must be optimised before they're committed (milestone 5 adds a check).
- Search (milestone 2) will be a small custom static index instead of Pagefind.
