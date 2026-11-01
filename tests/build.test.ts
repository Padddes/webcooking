import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';
import { build } from '../build/build.ts';
import { ROOT } from '../build/content.ts';

const DIST = join(ROOT, 'dist');

const ROUTES = ['/', '/about/', '/poe/', '/poe/guides/', '/poe/glossary/', '/poe/tools/', '/poe/tools/regex/'];

function fileFor(route: string): string {
  return join(DIST, route, 'index.html');
}

function allHtml(dir = DIST): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return allHtml(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

/** Resolve a root-relative URL the way Cloudflare Pages would. */
function resolves(urlPath: string): boolean {
  const clean = urlPath.split('#')[0]!.split('?')[0]!;
  if (clean.endsWith('/')) return existsSync(join(DIST, clean, 'index.html'));
  return existsSync(join(DIST, clean)) && statSync(join(DIST, clean)).isFile();
}

describe('site build', () => {
  let builtRoutes: string[] = [];

  before(async () => {
    builtRoutes = (await build()).pages;
  });

  test('every route from the brief is generated', () => {
    for (const route of ROUTES) {
      assert.ok(existsSync(fileFor(route)), `missing ${route}`);
    }
    assert.ok(existsSync(join(DIST, '404.html')), 'missing 404.html');
    assert.deepEqual([...builtRoutes].sort(), [...ROUTES].sort());
  });

  test('all internal links, scripts and stylesheets resolve', () => {
    const broken: string[] = [];
    for (const file of allHtml()) {
      const markup = readFileSync(file, 'utf8');
      for (const m of markup.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
        const target = m[1]!;
        if (target.startsWith('//')) continue;
        if (!resolves(target)) broken.push(`${file.replace(DIST, '')} → ${target}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  test('in-page anchors point at existing ids', () => {
    const broken: string[] = [];
    for (const file of allHtml()) {
      const markup = readFileSync(file, 'utf8');
      const route = file.replace(DIST, '').replace(/index\.html$/, '');
      for (const m of markup.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
        const targetFile = join(DIST, m[1]!, 'index.html');
        const target = m[1] === route ? markup : existsSync(targetFile) ? readFileSync(targetFile, 'utf8') : '';
        if (!target.includes(`id="${m[2]}"`)) broken.push(`${route} → ${m[1]}#${m[2]}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  test('each page has a language, title, description, a single h1 and a skip link', () => {
    for (const file of allHtml()) {
      const markup = readFileSync(file, 'utf8');
      const name = file.replace(DIST, '');
      assert.match(markup, /<html lang="en"/, name);
      assert.match(markup, /<title>[^<]+<\/title>/, name);
      assert.match(markup, /<meta name="description" content="[^"]+">/, name);
      assert.equal(markup.match(/<h1[\s>]/g)?.length, 1, `${name} should have exactly one h1`);
      assert.match(markup, /class="skip-link" href="#main"/, name);
      assert.doesNotMatch(markup, /undefined|\[object Object\]/, `${name} contains a rendering bug`);
    }
  });

  test('the current page is marked in the navigation', () => {
    for (const route of ['/', '/about/', '/poe/', '/poe/tools/']) {
      const markup = readFileSync(fileFor(route), 'utf8');
      assert.match(markup, new RegExp(`href="${route}"[^>]*aria-current="page"`), route);
    }
  });

  test('nested pages have breadcrumbs back to home', () => {
    const markup = readFileSync(fileFor('/poe/tools/regex/'), 'utf8');
    assert.match(markup, /aria-label="Breadcrumb"/);
    assert.match(markup, /<a href="\/">Home<\/a>/);
    assert.match(markup, /<a href="\/poe\/tools\/">Tools<\/a>/);
  });

  test('404 page is not indexed and has no canonical URL', () => {
    const markup = readFileSync(join(DIST, '404.html'), 'utf8');
    assert.match(markup, /<meta name="robots" content="noindex">/);
    assert.doesNotMatch(markup, /rel="canonical"/);
  });

  test('planned tools are not rendered as links', () => {
    const markup = readFileSync(fileFor('/poe/tools/'), 'utf8');
    assert.match(markup, /card--static[\s\S]*Flask regex builder/);
    assert.doesNotMatch(markup, /<a[^>]*>\s*<span class="status status--planned"/);
  });
});
