// A small, persistent authoring server. Uses the production renderer and module
// contract, but loads only the explicitly selected builders. Never a benchmark.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), modules = [], options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) options[args[i].slice(2)] = args[++i];
  else modules.push(...args[i].split(','));
}
const selected = [...new Set([...modules, ...(options.with || '').split(',')].filter(Boolean))];
if (!selected.length || selected.some(n => !/^[A-Za-z][A-Za-z0-9_-]*$/.test(n) || !fs.existsSync(path.join(root, 'src/world', n + '.js')))) {
  console.error('Usage: npm run dev:area -- landmarksH [--with landmarksG] [--cam x,y,z,yaw,pitch] [--port 5177]');
  process.exit(1);
}
const params = new URLSearchParams({ only: selected.join(','), q: options.q || 'medium', t: '0', noroof: '1', areaPreview: '1' });
if (options.cam) params.set('cam', options.cam);
const clients = new Set(), mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' && !url.search) { res.writeHead(302, { Location: '/?' + params }); return res.end(); }
  if (url.pathname === '/__area/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(': connected\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  if (handleBakedRevision(req, res, root)) return;
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname)); }
  catch { res.writeHead(400); return res.end(); }
  // root has a trailing separator on Windows; relative() also rejects sibling
  // names sharing the project prefix and Windows drive/UNC path escapes.
  const relative = path.relative(root, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); return res.end(); }
  fs.readFile(filename, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    if (filename.endsWith('index.html')) {
      let html = data.toString('utf8').replaceAll('https://cdn.jsdelivr.net/npm/three@0.170.0/', '/node_modules/three/');
      if (url.searchParams.has('areaPreview')) html = html.replace('</body>', '<script type="module" src="/tools/area-preview.js"></script></body>');
      data = html;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  });
});
let debounce;
// Windows can notify watchers when tools merely read source files. Compare
// modification time/size so preview loads and audits cannot reload themselves.
const versions = new Map(), src = path.join(root, 'src');
const version = filename => { try { const s = fs.statSync(filename); return `${s.mtimeMs}/${s.size}`; } catch { return null; } };
function remember(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) remember(filename);
    else if (/\.(js|html|css)$/.test(entry.name)) versions.set(filename, version(filename));
  }
}
remember(src);
for (const file of ['index.html', 'tools/area-preview.js']) { const filename = path.join(root, file); versions.set(filename, version(filename)); }
const changed = filename => {
  if (!filename || !/\.(js|html|css)$/.test(String(filename))) return;
  const current = version(filename);
  if (versions.get(filename) === current) return;
  versions.set(filename, current);
  clearTimeout(debounce);
  debounce = setTimeout(() => { for (const client of clients) client.write('data: reload\n\n'); console.log('Reload:', String(filename)); }, 400);
};
const watchers = [fs.watch(src, { recursive: true }, (_, file) => file && changed(path.join(src, String(file)))),
  ...['index.html', 'tools/area-preview.js'].map(file => fs.watch(path.join(root, file), () => changed(path.join(root, file))))];
const heartbeat = setInterval(() => { for (const client of clients) client.write(': keepalive\n\n'); }, 15000);
server.listen(Number(options.port || 5177), '127.0.0.1', () => {
  console.log(`Area preview: http://127.0.0.1:${server.address().port}/?${params}`);
  console.log('Saves reload the selected builders and retain the camera. Grid context only; use the integration link for the full city.');
});
function close() { clearInterval(heartbeat); clearTimeout(debounce); watchers.forEach(w => w.close()); clients.forEach(c => c.end()); server.close(); }
process.on('SIGINT', close); process.on('SIGTERM', close);
