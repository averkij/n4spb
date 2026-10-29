import { handleBakedRevision } from './lib/dev-revision.mjs';
// Minimal static file server for local development (no dependencies).
// usage: node tools/serve.mjs [port] [--area <id> | --page <file>]   (default port 5176)  ->  http://localhost:5176
// Every file of the site root is served, so every area page is reachable by its name (/index.html, /north.html ...); --area / --page only choose the page that "/" opens (default: the strip).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveArea, parseFlags } from './lib/area-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), flags = parseFlags(argv);
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const port = Number(positional[0] || process.env.PORT || 5176);
const DEFAULT_PAGE = (flags.area || flags.page) ? resolveArea(flags, root).page : 'index.html';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += p === '/' ? DEFAULT_PAGE : 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': /\.[a-f0-9]{20}\.bin\.gz$/.test(file) ? 'public, max-age=31536000, immutable' : 'no-store',
    });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`serving ${root} on http://localhost:${port}  ("/" opens ${DEFAULT_PAGE})`);
  for (const f of fs.readdirSync(root).filter((n) => n.endsWith('.html')).sort()) console.log(`  page: http://localhost:${port}/${f}`);
});
