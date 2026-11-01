// Static site build. Run with `npm run build`; output goes to dist/.
// Uses only Node's standard library (Node >= 22.18 runs .ts files directly).

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { loadContent, ROOT } from './content.ts';
import { layout, type Assets } from './layout.ts';
import { ContentError } from './lib/schema.ts';
import { buildPages, notFoundPage } from './pages.ts';

const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');

function hash(data: string): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 10);
}

async function writeOut(file: string, data: string): Promise<void> {
  const path = join(DIST, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
}

/** Concatenate stylesheets in a fixed order and emit a content-hashed file. */
async function buildCss(): Promise<string> {
  const order = ['tokens.css', 'base.css', 'layout.css', 'components.css'];
  const parts = await Promise.all(order.map((f) => readFile(join(SRC, 'styles', f), 'utf8')));
  const css = parts.join('\n');
  const name = `assets/site.${hash(css)}.css`;
  await writeOut(name, css);
  return `/${name}`;
}

/**
 * Compile browser TypeScript by stripping types (no bundling).
 * Imports must use relative ".ts" paths; they are rewritten to the hashed ".js" names.
 */
async function buildClient(): Promise<Record<string, string>> {
  const dir = join(SRC, 'client');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.ts'));
  const sources = new Map<string, string>();
  for (const f of files) {
    sources.set(f, stripTypeScriptTypes(await readFile(join(dir, f), 'utf8'), { mode: 'strip' }));
  }
  // Hash in dependency-free order is fine because client modules don't import each other yet;
  // guard against that assumption silently breaking.
  for (const [f, js] of sources) {
    if (/from\s+['"]\.\//.test(js)) throw new Error(`src/client/${f}: relative imports are not supported yet`);
  }
  const out: Record<string, string> = {};
  for (const [f, js] of sources) {
    const base = f.replace(/\.ts$/, '');
    const name = `assets/${base}.${hash(js)}.js`;
    await writeOut(name, js);
    out[base] = `/${name}`;
  }
  return out;
}

function sitemap(siteUrl: string, paths: string[]): string {
  const urls = paths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Cloudflare Pages header rules: long cache for hashed assets, safe defaults everywhere.
const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

export async function build(): Promise<{ pages: string[] }> {
  const started = performance.now();
  const content = await loadContent();

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(join(ROOT, 'public'), DIST, { recursive: true });

  const css = await buildCss();
  const client = await buildClient();
  const assets: Assets = { css, boot: client.boot!, nav: client.nav! };

  const pages = buildPages(content);
  for (const p of pages) {
    await writeOut(p.file, layout(content, assets, p.meta, p.main));
  }
  const nf = notFoundPage();
  await writeOut(nf.file, layout(content, assets, nf.meta, nf.main));

  await writeOut('sitemap.xml', sitemap(content.site.url, pages.map((p) => p.meta.path)));
  await writeOut('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${content.site.url}/sitemap.xml\n`);
  await writeOut('_headers', HEADERS);

  const ms = Math.round(performance.now() - started);
  console.log(`Built ${pages.length + 1} pages into ${relative(ROOT, DIST)}/ in ${ms} ms`);
  return { pages: pages.map((p) => p.meta.path) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await build();
  } catch (err) {
    if (err instanceof ContentError) {
      console.error(`\nContent error – the site was not built.\n  ${err.message}\n`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}
