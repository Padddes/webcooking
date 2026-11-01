// Loads and validates every content file. The build fails on invalid content,
// so mistakes made in the editor never reach the live site.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { arr, bool, ContentError, href, obj, oneOf, optional, slug, str, type Schema } from './lib/schema.ts';

export const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT = join(ROOT, 'src', 'content');

const icon = oneOf('home', 'poe', 'book', 'tool', 'glossary', 'about');

const navChild = obj({ id: slug, label: str({ min: 1, max: 40 }), href, icon });
const navItem = obj({
  id: slug,
  label: str({ min: 1, max: 40 }),
  href,
  icon,
  children: optional(arr(navChild)),
});

const link = obj({ label: str({ min: 1, max: 60 }), href });

const schemas = {
  site: obj({
    title: str({ min: 1 }),
    description: str({ min: 1, max: 300 }),
    url: str({ pattern: /^https:\/\/[^/]+$/ }),
    language: oneOf('en', 'de'),
    footerNote: str({ min: 1 }),
  }),
  navigation: obj({ items: arr(navItem, { min: 1 }) }),
  home: obj({
    title: str({ min: 1 }),
    seoDescription: str({ min: 1, max: 300 }),
    heading: str({ min: 1 }),
    lead: str({ min: 1 }),
    intro: str(),
    featured: obj({
      eyebrow: str({ min: 1 }),
      title: str({ min: 1 }),
      text: str({ min: 1 }),
      links: arr(link, { min: 1 }),
    }),
  }),
  about: obj({
    title: str({ min: 1 }),
    seoDescription: str({ min: 1, max: 300 }),
    heading: str({ min: 1 }),
    body: arr(str({ min: 1 }), { min: 1 }),
  }),
  poe: obj({
    title: str({ min: 1 }),
    seoDescription: str({ min: 1, max: 300 }),
    heading: str({ min: 1 }),
    lead: str({ min: 1 }),
    categories: arr(obj({ id: slug, label: str({ min: 1 }), description: str({ min: 1 }) }), { min: 1 }),
  }),
  tools: obj({
    title: str({ min: 1 }),
    seoDescription: str({ min: 1, max: 300 }),
    heading: str({ min: 1 }),
    lead: str({ min: 1 }),
    tools: arr(
      obj({
        id: slug,
        label: str({ min: 1 }),
        href: optional(href),
        status: oneOf('available', 'in-development', 'planned'),
        description: str({ min: 1 }),
      }),
    ),
  }),
  glossary: obj({
    terms: arr(
      obj({
        id: slug,
        term: str({ min: 1 }),
        aliases: optional(arr(str({ min: 1 }))),
        definition: str({ min: 1 }),
        published: bool,
      }),
    ),
  }),
};

async function load<T>(file: string, schema: Schema<T>): Promise<T> {
  const path = join(CONTENT, file);
  let data: unknown;
  try {
    data = JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    throw new ContentError(`${file}: could not read JSON (${(err as Error).message})`);
  }
  return schema(data, file);
}

export async function loadContent() {
  const [site, navigation, home, about, poe, tools, glossary] = await Promise.all([
    load('site.json', schemas.site),
    load('navigation.json', schemas.navigation),
    load('pages/home.json', schemas.home),
    load('pages/about.json', schemas.about),
    load('pages/poe.json', schemas.poe),
    load('pages/tools.json', schemas.tools),
    load('glossary/terms.json', schemas.glossary),
  ]);

  // Cross-file checks.
  const ids = new Set<string>();
  for (const item of navigation.items) {
    for (const entry of [item, ...(item.children ?? [])]) {
      if (ids.has(entry.id)) throw new ContentError(`navigation.json: duplicate id "${entry.id}"`);
      ids.add(entry.id);
    }
  }
  for (const tool of tools.tools) {
    if (tool.status !== 'planned' && !tool.href) {
      throw new ContentError(`pages/tools.json: tool "${tool.id}" needs a link unless its status is "planned"`);
    }
  }

  return { site, navigation, home, about, poe, tools, glossary };
}

export type Content = Awaited<ReturnType<typeof loadContent>>;
