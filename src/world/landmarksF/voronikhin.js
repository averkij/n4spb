// landmarksF/voronikhin.js - the Voronikhin garden (Воронихинский сквер) west of the cathedral: a semicircular lawn garden (OSM r2050448) with gravel paths, old lindens and chestnuts, white benches, the
// cast-iron fence of Voronikhin (1811-12, 153 m: black-bronze spears with a zig-zag top row, a frieze of rosettes, on a granite base with 14 granite Doric pylons crowned by balls: photo 22) round the arc, a low
// fence on the street side with two gates, and the Thomon drinking fountain "1809 ГОДА" (pink granite, Neptune mask: photo 26).  docs/research/kazan-cathedral.md 5.
import * as THREE from 'three';
import { C0, ROT, W, Mdl, boxAt, cylAt } from './frame.js';
import { GREEN, BARRIERS, ROADS, FURNITURE, TREES } from '../data/city.js';
import { ringToModel, ringOf, inPoly, recById, fenceRun, ribbon, tree, lantern, templateOf, benchGeo } from './util.js';
import { knockInstances } from '../lib/knock-inst.js';
import { liveFountain } from '../lib/live-fountain.js';

const PARK = 'r2050448', FENCE = 'w151672020';
const fountainModel = () => Mdl(-1571.4, -225.9);

export function build(K) {
  const P = K.P, errs = [];
  const park = recById(GREEN, PARK); if (!park) return;
  const ring = ringOf(park);
  K.vor = { ring, paths: [] };
  P.push(C0.x, 0, C0.z, ROT);
  const steps = [['ground', () => ground(K, ring)], ['fence', () => fences(K, ring)], ['fountain', () => fountain1809(K)], ['trees', () => trees(K, ring)], ['lamps', () => lamps(K)]];
  for (const [name, fn] of steps) { try { fn(); } catch (e) { console.error(`[landmarksF] voronikhin/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } }
  P.pop();
  try { benches(K, ring); } catch (e) { errs.push('benches: ' + e); }
  if (errs.length) throw new Error(errs.join('\n'));
}

function ground(K, ring) {
  const P = K.P, M = K.M;
  P.cap(M.lawn, ring, 0.14, true, 4);
  for (const id of ['w145343544', 'w233051394']) {
    const r = ROADS.find((q) => q.id === id); if (!r) continue;
    const pts = ringToModel(r.pts);
    ribbon(P, M.gravel, pts, 2.6, 0.16, 3);
    K.vor.paths.push(pts);
  }
}

function fences(K, ring) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  const arc = BARRIERS.find((b) => b.id === FENCE); if (!arc) return;
  const pts = ringToModel(arc.pts);
  // base wall (0.7 m granite) + ornate panels (2.7 m) + 14 pylons spaced along the arc length
  let total = 0; const cum = [0];
  for (let i = 0; i + 1 < pts.length; i++) { total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); cum.push(total); }
  const at = (d) => { let i = 0; while (i + 2 < cum.length && cum[i + 1] < d) i++; const t = (d - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i]); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; };
  const baseH = 0.7, panelH = 2.7, y0 = 0.14;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.1) continue;
    const nx = dz / l, nz = -dx / l, k = Math.max(1, Math.round(l / 3.0));
    P.quad(M.voron, [a[0], y0 + baseH, a[1]], [b[0], y0 + baseH, b[1]], [b[0], y0 + baseH + panelH, b[1]], [a[0], y0 + baseH + panelH, a[1]], [nx, 0, nz], [[0, 0], [k, 0], [k, 1], [0, 1]]);
    P.quad(M.voron, [b[0], y0 + baseH, b[1]], [a[0], y0 + baseH, a[1]], [a[0], y0 + baseH + panelH, a[1]], [b[0], y0 + baseH + panelH, b[1]], [-nx, 0, -nz], [[k, 0], [0, 0], [0, 1], [k, 1]]);
    P.push(a[0], y0, a[1], Math.atan2(dx, dz) - Math.PI / 2);                                  // local +x along the segment
    P.box(M.stoneDark, 0, l, 0, baseH, -0.25, 0.25, 'b');
    P.pop();
    boxAt(ph, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l, 0.4, Math.atan2(-dz, dx), -1, y0 + baseH + panelH);
  }
  for (let k = 0; k < 14; k++) {
    const d = total * k / 13, [x, z] = at(Math.min(d, total - 0.001)), nx = at(Math.min(d + 0.5, total)), ang = Math.atan2(nx[0] - x, nx[1] - z);
    P.push(x, y0, z, ang);
    P.box(M.stoneDark, -0.55, 0.55, 0, 0.9, -0.55, 0.55, 'b');
    P.box(M.stoneDark, -0.42, 0.42, 0.9, 3.0, -0.42, 0.42, '');
    for (const sx of [-0.2, 0, 0.2]) P.box(M.stoneShade, sx - 0.02, sx + 0.02, 1.0, 2.9, 0.42, 0.45, 'b');
    P.box(M.stoneDark, -0.55, 0.55, 3.0, 3.35, -0.55, 0.55, '');
    P.geo(M.stoneDark, K.pylonBall || (K.pylonBall = new THREE.SphereGeometry(0.42, 10, 8)), 0, 3.75, 0);
    P.pop();
    cylAt(ph, x, z, 0.6, 0, 4.2);
  }
  // street side (the chord): a low black fence with two gates
  const chord = ring.filter((p) => p[0] > -84).sort((p, q) => p[1] - q[1]);
  if (chord.length >= 2) fenceRun(K, chord, [{ x: chord[0][0], z: 52, w: 3.4 }, { x: chord[0][0], z: 96, w: 3.4 }], { h: 1.1, y: 0.14, mat: M.pickets });
}

function fountain1809(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const { mx, mz } = fountainModel();
  const sign = ctx.tex.draw(512, 256, (g, w, h) => {
    g.fillStyle = '#b88c80'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d6a93a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = '1809 ГОДА', R = h * 0.62;
    g.save(); g.translate(w / 2, h * 0.94);
    for (let i = 0; i < txt.length; i++) { const a = (i - (txt.length - 1) / 2) * 0.27; g.save(); g.rotate(a); g.translate(0, -R); g.font = '700 38px "Noto Serif", serif'; g.fillText(txt[i], 0, 0); g.restore(); }
    g.restore();
  }, { key: 'lmF-1809' });
  const mSign = ctx.mat.toon('#ffffff', { map: sign, name: 'lmF-1809', paint: 0.02 });
  P.push(mx, 0, mz, Math.PI / 2);                                     // faces east (the street)
  P.box(M.pink, -1.6, 1.6, 0.14, 0.24, -0.2, 1.9, '');
  P.box(M.pink, -1.5, 1.5, 0.24, 1.4, -0.2, 0.9, '');
  const arch = new THREE.Shape(); arch.moveTo(-1.5, 1.4); arch.lineTo(1.5, 1.4); arch.absarc(0, 1.4, 1.5, 0, Math.PI, false); arch.lineTo(-1.5, 1.4);
  const g = new THREE.ShapeGeometry(arch, 12), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) + 1.5) / 3, (pa.getY(i) - 1.4) / 1.5 * 0.8 + 0.1);
  P.geo(mSign, g, 0, 0, 0.92); g.dispose();                           // tympanum face with the gilded lettering
  P.extrude(M.pink, arch, -0.2, 1.1, 1, 12);
  P.box(M.rim, -1.0, 1.0, 0.9, 1.25, 0.92, 1.0, 'kb');
  P.geo(M.gold, K.maskGeo || (K.maskGeo = new THREE.SphereGeometry(0.28, 8, 6)), 0, 0.95, 1.05, 0, 0, 0, 1, 1.1, 0.5);                    // Neptune mask
  P.box(M.stoneDark, -1.2, 1.2, 0.24, 0.28, 1.0, 1.9, ''); // shallow trough floor
  for(const x of[-1.2,1.1])P.box(M.stoneDark,x,x+.1,.28,.52,1.0,1.9);
  P.box(M.stoneDark,-1.1,1.1,.28,.52,1.8,1.9);
  P.quad(M.water, [-1.1, 0.51, 1.1], [1.1, 0.51, 1.1], [1.1, 0.51, 1.8], [-1.1, 0.51, 1.8], [0, 1, 0]);
  const point=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(P.m);
  const center=point(0,0,1.45),mouth=point(0,.95,1.2);
  const flow=liveFountain(ctx,{id:'n2306201359',x:center.x,z:center.z,y:.51,r:.45,far:180,
    nozzles:[{x:mouth.x-center.x,y:.44,z:mouth.z-center.z,height:.055,width:.018,target:[0,0,0]}]});
  flow.nozzles[0].ripple=.22; // keep small impact rings within the narrow trough
  const corners=[[-1.1,1.1],[1.1,1.1],[1.1,1.8],[-1.1,1.8]].map(([x,z])=>point(x,.28,z));
  ph.addWater({ring:corners.flatMap(p=>[p.x,p.z]),level:.51});
  for(const ids of[[0,1,2],[0,2,3]])ph.addWalkTriangle(ids.map(i=>corners[i].toArray()),.04);
  const platform=point(0,0,.85),back=point(0,0,.35);
  ph.addWalkBox(platform.x,platform.z,3.2,2.1,ROT+Math.PI/2,.24,.14);
  ph.addBox(back.x,back.z,3.2,1.1,ROT+Math.PI/2,.24,2.9);
  P.pop();
}

function trees(K, ring) {
  const P = K.P, M = K.M, rnd = K.ctx.rng(913), osm = [];
  for (let i = 0; i + 1 < TREES.length; i += 2) { const m = Mdl(TREES[i], TREES[i + 1]); if (m.mx < -75 && m.mx > -140 && m.mz > 10 && m.mz < 130) osm.push([m.mx, m.mz]); }
  const paths = K.vor.paths.flat(), placed = [], F = fountainModel();
  for (let t = 0; t < 900 && placed.length < 26; t++) {
    const x = -134 + rnd() * 56, z = 16 + rnd() * 108;
    if (!inPoly(ring, x, z)) continue;
    if (Math.hypot(x - F.mx, z - F.mz) < 7) continue;
    if (paths.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.8)) continue;
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 7.5) || osm.some((p) => Math.hypot(p[0] - x, p[1] - z) < 5)) continue;
    if (ring.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3.0)) continue;
    placed.push([x, z]);
  }
  for (const [x, z] of placed) { const s = 1.25 + rnd() * 0.7; tree(P, M, x, z, s, rnd, rnd() < 0.5 ? 0 : 2, 0.14); const w = W(x, z); K.ctx.physics.addCylinder(w.x, w.z, 0.45 * s, 0, 12); }
  K.vor.trees = placed.length;
}

function lamps(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, spots = [], items = [];
  for (const [x, z] of [[-55.5, 54.2], [-55.5, 91.4], [-14.5, 110.5], [14.5, 110.5]]) {
    if (!ctx.knock) { lantern(P, M, x, z); cylAt(ph, x, z, 0.3, 0, 4); continue; }          // (no knock: the lantern is merged into the module, as ever)
    const w = W(x, z); spots.push({ x: w.x, y: 0, z: w.z, rotY: ROT }); items.push(cylAt(ph, x, z, 0.3, 0, 4));
  }
  // knockable (core/knock.js): a cast-iron lantern, anchored: holds a bump, breaks off at the foot above 22 km/h and topples; iron pole + glass lantern are instances of one template
  if (spots.length) knockInstances(ctx, {
    name: 'lmF-vor-lanterns', parts: templateOf((T) => lantern(T, M, 0, 0)).map((t) => ({ geo: t.geo, mat: t.mat, name: t.mat === M.lampGlass ? 'glass' : 'iron' })),
    spots, items, far: 260, rec: { kind: 'lamp', mass: 250, h: 4.25, r: 0.3, anchored: 22, hitK: 0.5, metal: true },
  });
}

function benches(K, ring) {
  const ctx = K.ctx, list = [], F = fountainModel();
  for (const f of FURNITURE) {
    if (f.kind !== 'bench') continue; const m = Mdl(f.x, f.z);
    if (!inPoly(ring, m.mx, m.mz)) continue;
    list.push({ x: f.x, y: 0.14, z: f.z, rotY: Math.atan2(F.mx - m.mx, F.mz - m.mz) + ROT });
  }
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, name: 'lmF-bench', paint: 0.02 });
  const items = list.map((b) => ctx.physics.addBox(b.x, b.z, 1.7, 0.6, b.rotY, 0, 0.9));
  // knockable (core/knock.js): a light park bench, free: slides and tumbles when the car hits it; without ctx.knock it is the one static instanced mesh of before
  knockInstances(ctx, { name: 'lmF-vor-benches', parts: [{ geo: benchGeo(), mat, receive: false }], spots: list, items, far: 220,
    rec: { kind: 'bench', mass: 42, h: 0.9, w: 1.7, d: 0.6, hitK: 0.25, minDv: 0.5 } });
  (K.svc.vorBenches ||= []).push(...list.map((b) => ({ x: b.x, z: b.z, rotY: b.rotY, len: 1.7 })));
}
