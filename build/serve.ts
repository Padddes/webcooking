// Local preview server for dist/. Mimics Cloudflare Pages routing closely enough
// for development: /path/ → /path/index.html, /path → 308 to /path/, unknown → 404.html.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4321);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const target = join(DIST, safe);
  if (!target.startsWith(DIST)) {
    res.writeHead(400).end('Bad request');
    return;
  }

  let file: string | null = null;
  if (pathname.endsWith('/') && (await isFile(join(target, 'index.html')))) {
    file = join(target, 'index.html');
  } else if (!pathname.endsWith('/') && (await isFile(target))) {
    file = target;
  } else if (!pathname.endsWith('/') && (await isFile(join(target, 'index.html')))) {
    res.writeHead(308, { Location: `${pathname}/${url.search}` }).end();
    return;
  }

  const status = file ? 200 : 404;
  file ??= join(DIST, '404.html');
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Preview: http://localhost:${PORT}/`);
});
