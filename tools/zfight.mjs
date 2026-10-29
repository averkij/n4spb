// Z-fighting probe in the real renderer (headless Edge/Chrome + puppeteer-core, like tools/shot.mjs).
//   node tools/zfight.mjs [--area vasilyevsky] [--only mod,mod] [--cams "hero;v2;x,z,yaw,pitch;x,y,z,yaw,pitch"] [--t 20] [--thr 40] [--out shots/zfight/run]
// The same frame is rendered three times with the screen-space outline switched off: A, A again, and B with near / far changed by 7 %
// (an identical picture whose depth buffer is quantised differently). Surfaces that are really separated cannot change; two surfaces that
// z-fight flip between B and A. Pixels with |A - B| > thr are "noisy". For every noisy 24 px cell the probe casts a ray through the pixel
// into the scene and reports the distance, the world point and the material, so you can see WHAT fights WHERE (roads at 200 m, a roof
// parapet, a wall decal ...). Writes <out>_<i>.png (noisy pixels in red over the dimmed frame) and prints a table.
// Camera names as in tools/shot.mjs (hero, v1..v5, views, overview, aerial, top); default = a set of street / roof / aerial views.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveArea, activateArea } from './lib/area-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; args[k] = v; } }
const W = Number(args.w || 1280), H = Number(args.h || 720), THR = Number(args.thr || 40);
const AREA = resolveArea(args, root);          // --area <id> | --page <file>: another area's page (default: the strip, index.html); its layout gives hero / v1..
await activateArea(AREA.row, root);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const pose = (p) => `${p.x},${p.z},${p.yaw},${p.pitch}`;
const PRESETS = { hero: [pose(L.HERO)], views: L.VIEWS.map(pose), overview: ['-102,430,430,0,-42'], aerial: ['330,300,380,55,-38'], top: ['-102.9,452,83.7,0,-90'] };
L.VIEWS.forEach((v, i) => { PRESETS['v' + (i + 1)] = [pose(v)]; });
const DEFAULT = ['hero', 'views',
  '-292,134,-47,3', '-292,134,133,3', '-120,40,-150,2', '-60,150,40,2', '-250,200,-20,3',                // eye level along the streets
  '-186,20,-137,45,-14', '-186,45,-137,90,-18', '-186,100,-137,200,-14',                                   // free cameras 20 / 45 / 100 m up looking toward the horizon
  '-163,150,97,-137,-12', '-163,300,97,-137,-30', 'aerial'];
let cams = (args.cams ? args.cams.split(';') : DEFAULT).map((s) => s.trim()).filter(Boolean).flatMap((c) => PRESETS[c] || [c]);
// --grid step[,yawCount[,eyeY]]: eye-level cameras on a grid over the play area (free spots only), several headings each: a statistical sweep
if (args.grid) {
  const [step, nyaw, eye] = String(args.grid === '1' ? '90,2' : args.grid).split(',').map(Number); const P = L.WORLD.play; cams = [];
  for (let x = P.x0 + step / 2; x < P.x1; x += step) for (let z = P.z0 + step / 2; z < P.z1; z += step) {
    if (L.insideBuilding(x, z, 1.5)) continue;
    for (let k = 0; k < (nyaw || 2); k++) { const yaw = Math.round(((k / (nyaw || 2)) * 360 + (((x * 7 + z * 13) | 0) % 90)) % 360); cams.push(eye ? `${x},${eye},${z},${yaw},-2` : `${x},${z},${yaw},2`); }
  }
  console.log('grid sweep:', cams.length, 'cameras');
}
const out = args.out || 'shots/zfight/run';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: 600000,
});
const logs = []; let totalNoisy = 0; const AGG = new Map();
try {
  const page = await browser.newPage();
  const threeRoot = path.join(root, 'node_modules', 'three');
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
    if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    req.continue();
  });
  page.on('console', (m) => { const t = m.type(); if (t === 'error') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ shot: '1', w: String(W), h: String(H), t: String(args.t || 20), q: args.q || 'high' });
  if (args.only) q.set('only', args.only);
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
  q.set('cam', cams[0]);
  await page.goto(`http://127.0.0.1:${port}/${AREA.page}?${q}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction('window.__ready === true', { timeout: 600000, polling: 250 });
  await page.evaluate(() => {
    window.__grab = () => { const gl = document.getElementById('scene').getContext('webgl2'); const px = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4); gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  });
  if (args.pre) await page.evaluate(args.pre);          // experiments: e.g. --pre "window.__ctx.scene.traverse(o => { if (o.isLight) o.castShadow = false; })"
  for (let i = 0; i < cams.length; i++) {
    const v = cams[i].split(',').map(Number);
    const r = await page.evaluate(async (v, THR, GATE, MODE, WIN) => {
      const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
      if (v.length === 4) window.__setCam(v[0], null, v[1], v[2], v[3]); else window.__setCam(v[0], v[1], v[2], v[3], v[4]);
      const THREE = window.THREE, ctx = window.__ctx, cam = ctx.camera, pl = window.__pipeline;
      await raf(); window.__fixedNear = true;                  // main.js grows the near plane with the eye height: freeze it for the probe
      pl.compMat.uniforms.uOutline.value = 0;                 // the outline moves with the camera and would fake or hide surface fighting
      await raf(); const A = window.__grab(); await raf(); const A2 = window.__grab();
      const n0 = cam.near, f0 = cam.far; if (MODE !== 'far') cam.near = n0 * 1.07; if (MODE !== 'near') cam.far = f0 * 0.93; cam.updateProjectionMatrix();
      await raf(); const B = window.__grab();
      cam.near = n0; cam.far = f0; cam.updateProjectionMatrix(); pl.compMat.uniforms.uOutline.value = 1; window.__fixedNear = false;
      const w = document.getElementById('scene').width, h = document.getElementById('scene').height, n = w * h;
      let same = 0, noisy = 0; const cell = 24, cw = Math.ceil(w / cell), ch = Math.ceil(h / cell), cells = new Uint16Array(cw * ch);
      const mask = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        const o = k * 4;
        same += Math.abs(A[o] - A2[o]) + Math.abs(A[o + 1] - A2[o + 1]) + Math.abs(A[o + 2] - A2[o + 2]);
        const d = Math.abs(A[o] - B[o]) + Math.abs(A[o + 1] - B[o + 1]) + Math.abs(A[o + 2] - B[o + 2]);
        if (d > THR) { mask[k] = 1; noisy++; const y = (k / w) | 0, x = k - y * w; cells[((y / cell) | 0) * cw + ((x / cell) | 0)]++; }
      }
      // what is where: ray through the centre of the noisiest cells
      const ray = new THREE.Raycaster(); ray.camera = cam; ray.layers.mask = 1 | 2 | 8; const hits = [];
      const order = [...cells.keys()].filter((c) => cells[c] >= GATE).sort((a, b) => cells[b] - cells[a]).slice(0, 20);
      const roots = [ctx.staticRoot, ctx.dynamicRoot].filter(Boolean);
      const mname = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; return (m.name || m.type) + (m.color ? '#' + m.color.getHexString() : '') + (m.polygonOffset ? '+po' : ''); };
      for (const c of order) {
        // the real noisy pixels of the cell (not its centre: another object may be there); up to 4 evenly spaced samples
        const cx0 = (c % cw) * cell, cy0 = ((c / cw) | 0) * cell, pts = [];
        for (let yy = cy0; yy < Math.min(h, cy0 + cell); yy++) for (let xx = cx0; xx < Math.min(w, cx0 + cell); xx++) if (mask[yy * w + xx]) pts.push([xx, yy]);
        const nS = Math.min(4, pts.length);
        for (let si = 0; si < nS; si++) {
          const [px, py] = pts[Math.floor((si + 0.5) * pts.length / nS)];
          ray.setFromCamera(new THREE.Vector2(((px + 0.5) / w) * 2 - 1, ((py + 0.5) / h) * 2 - 1), cam);
          const all = ray.intersectObjects(roots, true).filter((x) => {
            if (x.object.userData.ndProxy) return false;
            for (let o = x.object; o; o = o.parent) if (!o.visible) return false;
            return true;
          });
          const hit = all[0];
          const pair = hit ? all.filter((x) => x.distance - hit.distance < WIN + hit.distance * 0.002).map((x) => (x.object.name || x.object.type) + ':' + mname(x.object) + ' y=' + x.point.y.toFixed(3) + ' d=' + (x.distance - hit.distance).toFixed(3)) : [];
          hits.push({ px: [px, h - py], noisyPx: Math.round(cells[c] / nS), dist: hit ? +hit.distance.toFixed(1) : null, at: hit ? [hit.point.x, hit.point.y, hit.point.z].map((t) => +t.toFixed(1)) : null,
            mat: hit ? mname(hit.object) : null, mesh: hit ? hit.object.name || hit.object.type : null, pair });
        }
      }
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), im = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (h - 1 - y) * w + x, o = k * 4, p = (y * w + x) * 4; if (mask[k]) { im.data[p] = 255; im.data[p + 1] = 0; im.data[p + 2] = 0; } else { im.data[p] = A[o] * 0.55; im.data[p + 1] = A[o + 1] * 0.55; im.data[p + 2] = A[o + 2] * 0.55; } im.data[p + 3] = 255; }
      g.putImageData(im, 0, 0);
      return { w, h, sameDiff: same, noisy, frac: noisy / n, hits, dump: cv.toDataURL('image/png') };
    }, v, THR, Number(args.gate || 24), args.mode || 'both', Number(args.win || 0.12));
    const file = path.resolve(root, `${out}_${i}.png`);
    fs.writeFileSync(file, Buffer.from(r.dump.split(',')[1], 'base64'));
    if (args.beauty) {
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.screenshot({ path: path.resolve(root, `${out}_${i}-scene.png`) });
    }
    totalNoisy += r.noisy;
    console.log(`${r.noisy > r.w * r.h * 0.0005 ? 'NOISY' : 'ok   '} cam=[${cams[i]}] noisy ${r.noisy} px (${(r.frac * 100).toFixed(3)} %)  identical-frame diff ${r.sameDiff}  -> ${path.relative(root, file)}`);
    for (const h of r.hits) { if (h.dist === null || h.dist < 1.0) continue; /* camera inside a car / tree crown / wall, or the sky: not a depth fight of the scene */ const key = h.pair && h.pair.length > 1 ? h.pair.map((p) => p.replace(/ y=.*$/, '')).join('  <>  ') : `${h.mesh}|${h.mat}`; const a = AGG.get(key) || { px: 0, frames: 0, dmin: 1e9, dmax: 0, ex: null }; a.px += h.noisyPx; a.frames++; if (h.dist) { a.dmin = Math.min(a.dmin, h.dist); a.dmax = Math.max(a.dmax, h.dist); } if (!a.ex || h.noisyPx > a.ex.n) a.ex = { n: h.noisyPx, cam: cams[i], at: h.at }; AGG.set(key, a); }
    if (!args.quiet) for (const h of r.hits) console.log(`      ${String(h.noisyPx).padStart(4)} px at ${h.px.join(',')}  dist ${h.dist} m  point ${h.at ? h.at.join(' ') : '-'}  ${h.pair && h.pair.length > 1 ? h.pair.join('  <>  ') : 'material ' + h.mat + '  mesh ' + h.mesh}`);
  }
  console.log(`TOTAL noisy pixels: ${totalNoisy}`);
  console.log('OFFENDERS (mesh|material: noisy px, frames, distance range, worst example):');
  for (const [k, a] of [...AGG.entries()].sort((x, y) => y[1].px - x[1].px).slice(0, 40)) console.log(`  ${String(a.px).padStart(6)} px ${String(a.frames).padStart(3)} fr  ${a.dmin.toFixed(0)}-${a.dmax.toFixed(0)} m  ${k}   e.g. cam ${a.ex.cam} at ${a.ex.at ? a.ex.at.join(' ') : '-'}`);
} catch (e) {
  console.log('ZFIGHT PROBE FAILED:', e.message);
  process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 30)) console.log(' ', l.slice(0, 400)); }
  await browser.close();
  server.close();
}
