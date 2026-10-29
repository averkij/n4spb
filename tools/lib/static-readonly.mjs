// A tiny READ-ONLY static server over the repository for the tools that load a page in a headless browser and want to know which files it asked for (closure-groundtruth.mjs).
// GET and HEAD only, no directory listing, no path outside the root, no-store; every served repository path is recorded in `served` (POSIX, no leading slash, no query).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

/** startStaticServer(root, { onServed? }) -> Promise<{ port, served: Map(rel -> first time ms), missing: Set, close() }> */
export async function startStaticServer(root, { onServed = null } = {}) {
  const served = new Map(), missing = new Set(), t0 = Date.now(), base = path.resolve(root);
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch (e) { res.writeHead(400); return res.end(); }
    if (rel === '') rel = 'index.html';
    const f = path.resolve(base, rel);
    if (f !== base && !f.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
    if (rel.startsWith('__') || rel.startsWith('.git/') || rel.startsWith('node_modules/') && !rel.startsWith('node_modules/three/')) { missing.add(rel); res.writeHead(404); return res.end(); }
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { missing.add(rel); res.writeHead(404); return res.end(); }
      if (!served.has(rel)) { served.set(rel, Date.now() - t0); if (onServed) onServed(rel); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(f).pipe(res);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { port: server.address().port, served, missing, close: () => new Promise((r) => server.close(r)) };
}
