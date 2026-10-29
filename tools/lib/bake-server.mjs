// The local HTTP server of a bake (tools/bake-scene.mjs): serves the repository to the headless page, answers the revision of the area that is being baked, and receives the products the page uploads.
// It RECORDS every repository file it serves (current.served): the bake audits that set against the closure of the area before it publishes (tools/lib/bake-guard.mjs auditServed).
//   createBakeServer({ root, current: () => state })   state = { revision, output, files, sizes, served:Set<string> }
//   POST /__bake/<name>  X-Bake-Offset / X-Bake-Final   chunks of a product -> <name>.<revision>.part -> <name>.<revision>.bin.gz (gzip, streamed)
//   GET /__baked_revision, /__bake_inputs                the revision of the area; the field / kerb products a later (nav-only) stage reads back
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

export function createBakeServer({ root, current, log = console.log }) {
  return http.createServer(async (req, res) => {
    const state = current();
    if (!state) { res.writeHead(503); return res.end('no area is being baked'); }
    const { output, files, sizes, revision, served } = state;
    try {
      const url = new URL(req.url, 'http://local');
      if (url.pathname === '/__baked_revision') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ revision })); }
      if (url.pathname === '/__bake_inputs') {
        if (!files.field || !files['street-kerbs']) { res.writeHead(409); return res.end('The medium-quality field and kerb bakes are not complete'); }
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
        const inputs = Object.keys(files).filter((name) => name === 'field' || name.startsWith('field-') || name === 'street-kerbs');
        return res.end(JSON.stringify({ revision, files: Object.fromEntries(inputs.map((name) => [name, files[name]])),
          sizes: Object.fromEntries(inputs.map((name) => [name, sizes[name]])) }));
      }
      if (req.method === 'POST' && url.pathname.startsWith('/__bake/')) {
        const name = url.pathname.slice(8); if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid asset name');
        const chunks = []; let bytes = 0;
        for await (const chunk of req) { bytes += chunk.length; if (bytes > 4 * 1024 * 1024) throw new Error('Bake chunk too large'); chunks.push(chunk); }
        const part = path.join(output, `${name}.${revision}.part`), offset = Number(req.headers['x-bake-offset']);
        if (offset === 0) fs.writeFileSync(part, Buffer.concat(chunks));
        else { if (fs.statSync(part).size !== offset) throw new Error('Out-of-order bake upload'); fs.appendFileSync(part, Buffer.concat(chunks)); }
        if (req.headers['x-bake-final'] !== '1') { res.end('ok'); return; }
        const filename = `${name}.${revision}.bin.gz`, destination = path.join(output, filename);
        const rawBytes = fs.statSync(part).size;
        // The field is nearly 1 GiB. Stream compression instead of allocating another full copy in Node while the browser retains its scene/buffers.
        await pipeline(fs.createReadStream(part), createGzip({ level: 6 }), fs.createWriteStream(`${destination}.tmp`));
        fs.renameSync(`${destination}.tmp`, destination);
        files[name] = filename; sizes[name] = { raw: rawBytes, gzip: fs.statSync(destination).size };
        fs.unlinkSync(part); log(`  ${name}: ${(sizes[name].gzip / 1048576).toFixed(2)} MiB`);
        res.end('ok'); return;
      }
      const pathname = decodeURIComponent(url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
      const filename = path.resolve(root, '.' + pathname);
      if (!filename.startsWith(root + path.sep)) throw new Error('Outside project root');
      fs.readFile(filename, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        served.add(pathname.replace(/^\/+/, ''));        // the path as the page asked for it (exact spelling: the host that deploys the game is case sensitive)
        res.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store'); res.end(data);
      });
    } catch (e) { res.writeHead(500); res.end(e.message); console.error(e); }
  });
}
