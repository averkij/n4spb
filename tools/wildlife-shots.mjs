// Close-up screenshots of the ANIMALS at several places in ONE page load (real renderer, headless Edge / Chrome; the scene build takes minutes).
// The animals follow the player (docs: wildlife/director.js), so every aim first puts the player at its reference point, lets the simulation run for --dwell seconds (window.__sim) and only then
// looks for the nearest animal of the wanted kind and puts a free camera `dist` metres from it, looking at it.
//   node tools/wildlife-shots.mjs --aims "kind@x,z,dist[,dy];..." --out shots/wildlife/a [--only a,b,c] [--t 20] [--dwell 30] [--params "wl=nofear"] [--q high] [--w 1280 --h 720] [--fov 50]
//   kinds: pigeon (a resting flock bird), gull (any gull on a perch), gull-ship (a gull on a cargo ship / liner), gull-cargo, gull-liner, gull-pier, crow (crow or jackdaw), jackdaw, duck (the nearest duck group), duck-smolenka / duck-gavan / duck-<waterway key> (a group on that waterway: the player first goes to the middle of its first lane; the camera on a ship shot stands abeam of the hull), sparrow
//   dy: extra camera height above the bird (default 0.6 m over the bird's eye line, never under 1.6 m over the ground of the bird)
//   --pitch-all n: look n degrees higher / lower than the line to the animal (default 0)
// Prints for each aim: what was found (species, state, position, distance to the player), the draw calls and triangles, the animals within 60 / 150 m by species.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; args[k] = v; } }
const W = Number(args.w || 1280), H = Number(args.h || 720), T0 = Number(args.t ?? 20), DWELL = Number(args.dwell ?? 30);
const aims = String(args.aims || '').split(';').map((s) => s.trim()).filter(Boolean).map((s) => { const m = /^([a-z-]+)@(.+)$/.exec(s); const v = m[2].split(',').map(Number); return { kind: m[1], x: v[0], z: v[1], dist: v[2] ?? 8, dy: v[3] }; });
if (!aims.length) { console.log('usage: node tools/wildlife-shots.mjs --aims "pigeon@-3394,-522,7;gull-ship@-3700,-170,20" --out shots/wildlife/a [--only ...] [--dwell 30] [--params wl=nofear]'); process.exit(1); }
const out = args.out || 'shots/wildlife/shot';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: 3000000 });
const logs = [];

/** runs in the page: the nearest animal of `kind` to (x, z); returns { found, sp, st, x, y, z, d, extra } */
function findInPage(kind, x, z, tNow) {
  const svc = window.__ctx.services.wildlife; let best = null, bd = 1e9;
  const take = (o, d) => { if (d < bd) { bd = d; best = o; } };
  const nearD = (px, pz) => Math.hypot(px - x, pz - z);
  if (kind === 'duck' || kind.startsWith('duck-')) {
    const key = kind === 'duck' ? null : kind.slice(5);       // duck-smolenka / duck-gavan: only the groups whose lane is on that waterway
    const D = svc.debug.ducks; if (D) for (const g of D.groups) { if (key && g.lane.key !== key) continue; const p = D.groupPose(g, tNow); take({ sp: 'duck', st: g.kind + '@' + g.lane.key, x: p.x, y: window.__ctx.L.RIVER_Y.water + 0.15, z: p.z }, nearD(p.x, p.z)); }
  } else {
    for (const b of svc.birds) {
      if (b.dead || b.hid || b.st === 'hide') continue;
      const ok = kind === 'pigeon' ? b.sp === 'pigeon' && b.st === 'ground' : kind === 'sparrow' ? b.sp === 'sparrow' && b.st === 'ground'
        : kind === 'gull' ? b.sp === 'gull' && (b.st === 'perch' || b.st === 'ground') : kind === 'gull-ship' ? b.sp === 'gull' && b.st === 'boat' && b.boat && /^(e-vo-ship|m-liner)/.test(b.boat.bt.id) : kind === 'gull-liner' ? b.sp === 'gull' && b.st === 'boat' && b.boat && /^m-liner/.test(b.boat.bt.id) : kind === 'gull-cargo' ? b.sp === 'gull' && b.st === 'boat' && b.boat && /^e-vo-ship/.test(b.boat.bt.id)
        : kind === 'gull-pier' ? b.sp === 'gull' && b.st === 'perch' && b.perch && b.perch.key === 'pier' : kind === 'jackdaw' ? b.jack && (b.st === 'perch' || b.st === 'ground')
        : kind === 'crow-tree' ? b.sp === 'crow' && b.st === 'perch' && b.perch && b.perch.kind === 'tree' : kind === 'crow' ? b.sp === 'crow' && (b.st === 'perch' || b.st === 'ground') : false;
      if (ok) {
        let nrm = null; if (b.boat) { const a = b.boat.bt.at(tNow); nrm = [Math.sin(a.rot), Math.cos(a.rot)]; }       // a gull on a ship: the camera stands abeam of the hull (the ship's local +z axis)
        take({ sp: b.sp + (b.jack ? '(jackdaw)' : ''), st: b.st + (b.boat ? ':' + b.boat.bt.id : '') + (b.perch ? ':' + b.perch.kind : ''), x: b.x, y: b.y + 0.12, z: b.z, nrm }, nearD(b.x, b.z));
      }
    }
  }
  return best ? { found: true, ...best, d: bd } : { found: false };
}

try {
  const page = await browser.newPage();
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (fs.existsSync(threeRoot)) {
    await page.setRequestInterception(true);
    page.on('request', (req) => { const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url()); if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); } req.continue(); });
  }
  page.on('console', (m) => { const t = m.type(); if (t === 'error') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(T0), q: args.q || 'high', shot: '1' });
  if (args.only) q.set('only', args.only);
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
  q.set('cam', `${aims[0].x},${aims[0].z},0,0`);
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction('window.__ready === true', { timeout: 2400000, polling: 2000 });
  console.log('page ready in', Math.round((Date.now() - t0) / 1000), 's; wildlife', await page.evaluate(() => { const s = window.__ctx.services.wildlife; return s ? JSON.stringify({ birds: s.birds.length, ducks: s.ducks.length, perches: s.perches.length, timing: s.debug.timing }) : 'MISSING'; }));
  if (args.fov) await page.evaluate((f) => { window.__camera.fov = f; window.__camera.updateProjectionMatrix(); }, Number(args.fov));
  if (args.probe) {                                                   // --probe: a ray down onto 40 tree tops of the Smolensky cemetery: where is the crown surface relative to the perch height (tree h - 0.6)?
    const r = await page.evaluate(() => { const ctx = window.__ctx, T = ctx.THREE, svc = ctx.services.wildlife, rc = new T.Raycaster(), out = []; ctx.scene.updateMatrixWorld(true);
      for (const p of svc.perches) { if (p.kind !== 'tree' || p.x < -6300 || p.x > -5300 || p.z < -1700 || p.z > -1100) continue; if (out.length >= 40) break; rc.set(new T.Vector3(p.x, p.y + 12, p.z), new T.Vector3(0, -1, 0)); rc.far = 40; const hit = rc.intersectObject(ctx.scene, true).filter((h) => h.object.isMesh && !h.object.userData.noProbe)[0]; out.push({ perchY: +p.y.toFixed(2), hitY: hit ? +hit.point.y.toFixed(2) : null, obj: hit ? (hit.object.name || hit.object.type) : null }); }
      return out; });
    console.log('probe (perch y, first surface below y + 12):', JSON.stringify(r.slice(0, 40)));
    const d = r.filter((q) => q.hitY !== null).map((q) => q.hitY - q.perchY).sort((x, y) => x - y); if (d.length) console.log('probe: surface minus perch: min ' + d[0].toFixed(2) + ' median ' + d[d.length >> 1].toFixed(2) + ' max ' + d[d.length - 1].toFixed(2) + ' (n ' + d.length + ')');
  }
  let t = T0;
  for (let i = 0; i < aims.length; i++) {
    const a = aims[i];
    if (a.kind.startsWith('duck-')) { const l = await page.evaluate((k) => { const D = window.__ctx.services.wildlife.debug.ducks, q = D && D.lanes.find((e) => e.key === k); return q ? { x: q.cx, z: q.cz } : null; }, a.kind.slice(5)); if (l) { a.x = l.x; a.z = l.z; } }      // duck-<waterway>: the player goes to the middle of its first lane
    if (/^gull-(ship|cargo|liner)$/.test(a.kind) && !a.x && !a.z) {      // review: "gull-cargo@0,0,25" = the player goes to where the (first) cargo ship / liner will be half way through the dwell (the boat gulls follow the player to a boat within ~200 m)
      const p = await page.evaluate((k, tt) => { const bl = window.__ctx.services.wildlife.debug.birds.boatList, re = k === 'gull-liner' ? /^m-liner/ : k === 'gull-cargo' ? /^e-vo-ship/ : /^(e-vo-ship|m-liner)/, bt = bl.find((q) => re.test(q.id)); if (!bt) return null; const s = bt.at(tt); return { x: s.x, z: s.z }; }, a.kind, t + DWELL * 0.6);
      if (p) { a.x = p.x + 40; a.z = p.z + 40; }
    }
    await page.evaluate((x, z) => window.__setCam(x, null, z, 0, 0), a.x, a.z);
    t += DWELL; await page.evaluate((tt) => window.__sim(tt, 0.1), t);
    const f = await page.evaluate(findInPage, a.kind, a.x, a.z, t);
    if (!f.found) { console.log(`aim ${i} ${a.kind}@${a.x},${a.z}: NOTHING FOUND`); continue; }
    // the camera: `dist` metres from the animal on the side of the reference point, at its eye line (+dy), looking at it
    let dx = a.x - f.x, dz = a.z - f.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    if (f.nrm) { const sg = (dx * f.nrm[0] + dz * f.nrm[1]) < 0 ? -1 : 1; dx = f.nrm[0] * sg; dz = f.nrm[1] * sg; }      // on a ship: abeam, on the side of the reference point
    const cx = f.x + dx * a.dist, cz = f.z + dz * a.dist, cy = f.nrm ? Math.max(1.7, f.y + (a.dy ?? 3)) : Math.max(f.y + (a.dy ?? 0.6), (f.y > 8 ? f.y - 6 : 1.7));
    const fx = f.x - cx, fz = f.z - cz, fy = f.y + 0.05 - cy, yaw = Math.atan2(-fx, -fz) * 180 / Math.PI, pitch = Math.atan2(fy, Math.hypot(fx, fz)) * 180 / Math.PI + Number(args['pitch-all'] || 0);
    await page.evaluate((v) => window.__setCam(v[0], v[1], v[2], v[3], v[4]), [cx, cy, cz, yaw, pitch]);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const file = path.resolve(root, `${out}_${i}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => { const c = window.__camera.position, s = window.__ctx.services.wildlife; const near = (r) => { const o = {}; for (const b of s.birds) { if (b.dead || b.hid) continue; if (Math.hypot(b.x - c.x, b.z - c.z) < r) o[b.sp + (b.jack ? '(j)' : '')] = (o[b.sp + (b.jack ? '(j)' : '')] || 0) + 1; } return o; }; return { calls: window.__stats.calls, triangles: window.__stats.triangles, n60: near(60), n150: near(150) }; });
    console.log(`saved ${path.relative(root, file)}  aim=${a.kind}@${a.x},${a.z} found ${f.sp} ${f.st} at ${f.x.toFixed(1)},${f.y.toFixed(1)},${f.z.toFixed(1)} (${f.d.toFixed(0)} m from the reference)  cam=[${cx.toFixed(1)},${cy.toFixed(1)},${cz.toFixed(1)},${yaw.toFixed(0)},${pitch.toFixed(0)}] t=${t}  calls=${st.calls} tris=${st.triangles} within60=${JSON.stringify(st.n60)} within150=${JSON.stringify(st.n150)}`);
  }
  if (args.ab) {                                                      // --ab: draw calls with the animals on / off at the last camera (the birds and the ducks are two InstancedMesh groups)
    const r = await page.evaluate(async () => { const w = window.__ctx.services.wildlife.debug, g = [w.birds && w.birds.group, w.ducks && w.ducks.group].filter(Boolean), f = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))));
      await f(); const on = { calls: window.__stats.calls, triangles: window.__stats.triangles }; g.forEach((x) => { x.visible = false; }); await f(); const off = { calls: window.__stats.calls, triangles: window.__stats.triangles }; g.forEach((x) => { x.visible = true; }); await f();
      return { on, off, meshes: g.map((x) => x.children.length) }; });
    console.log('A/B animals on / off at the last camera:', JSON.stringify(r), 'draw calls of the animals:', r.on.calls - r.off.calls, 'triangles:', r.on.triangles - r.off.triangles);
  }
  const errs = await page.evaluate(() => window.__errors);
  if (errs && errs.length) { console.log('MODULE ERRORS:'); for (const e of errs) console.log(` - [${e.module}] ${String(e.message).split('\n').slice(0, 4).join('\n   ')}`); }
} catch (e) { console.log('SHOTS FAILED:', e.message); process.exitCode = 1; } finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
