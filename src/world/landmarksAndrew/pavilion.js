// landmarksAndrew/pavilion.js - the VASILEOSTROVSKAYA METRO PAVILION (станция «Василеостровская», Средний пр. 32 / 7-я линия, w183122885; A. Getskin, V. Shuvalova, 1967): a low beige stone-and-glass box (29.7 x 33.3 m
// with a notch) under a flat canopy with a deep overhang, raised on 11 wide granite steps that run along the two entrance faces (an L round the north corner): travertine panels to 3.3 m above the floor, ribbon
// glazing under the canopy (4.8 m), the open door groups at the OSM entrances, green "Касса" pills, the name letters «ВАСИЛЕОСТРОВСКАЯ» on the fascia and a plain blue M.  Dossier docs/research/andrew.md section 6,
// photos refs/andrew 90 91 92; contract docs/research/vo-requests-metro.md (floor 1.65, metro floor 1.70, ceiling floor + 4.6, roof soffit >= floor + 4.8): the walls are the footprint line, the metro draws the inside.
// Frame V (frame.js).  Also paves the PAVILION SQUARE (granite slabs between the pavilion and the first houses of the boulevard, frame B).  Colliders: the footprint wall boxes (split at the DOORWAYS rows by
// lib/massing.js), the stair treads as walk boxes (concentric L round the corner), the stainless rails.  The pavilion owner's "podium" is the stair block + the wall base; the floor under the roof is the metro's.
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, onEdge, polyOf, frameOf, localOnEdge } from './kit.js';
import * as G from './geo.js';
import { FV, FB } from './frame.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { footprintIn, offsetRing } from './ringkit.js';

const FALL = { outer: [[-15.3, -15.7], [14.0, -16.0], [14.4, 17.1], [-6.4, 17.3], [-6.5, 12.1], [-15.0, 12.1]], holes: [] };
const H = { fl: 1.65, panel: 4.95, soffit: 6.45, roof: 7.15, tread: 0.3, rise: 0.15, n: 11 };

function mats(K) {
  const { ctx, M } = K; if (M.pav) return M.pav;
  const T = ctx.mat.toon, tex = ctx.tex, F = tex.FONTS, W = '#ffffff';
  const draw = (w, h, fn, key) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat: [1, 1] });
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const r = ctx.rng(9131);
  const travTex = draw(256, 256, (g, w, h) => {                                        // travertine panels 1.2 x 0.6 m, fine joints, warm variation (tile 1.2 m)
    g.fillStyle = '#dccaa4'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let c = 0; c < 2; c++) { const v = 0.975 + r() * 0.05; g.fillStyle = `rgb(${220 * v | 0},${201 * v | 0},${164 * v | 0})`; g.fillRect(c * 128 + 2, row * 64 + 2, 124, 60); }
    g.fillStyle = 'rgba(150,120,80,0.30)'; for (let row = 0; row < 4; row++) g.fillRect(0, row * 64, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(128, 0, 2, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,130,90,0.16)' : 'rgba(255,248,230,0.16)'; g.fillRect(r() * w, r() * h, 6 + r() * 14, 1 + r() * 1.5); }
  }, 'pavTrav');
  const glazeTex = draw(256, 200, (g, w, h) => {                                       // ribbon glazing: tinted grey-green panes (1.9 m) in dark frames, a sky reflection
    g.fillStyle = '#3a3d3f'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w * 0.6, h); gr.addColorStop(0, '#5d7a80'); gr.addColorStop(0.5, '#324a4c'); gr.addColorStop(1, '#22353a'); g.fillStyle = gr; g.fillRect(6, 6, w - 12, h - 12);
    g.fillStyle = 'rgba(190,215,225,0.10)'; g.beginPath(); g.moveTo(10, h - 10); g.lineTo(w * 0.42, 10); g.lineTo(w * 0.6, 10); g.lineTo(w * 0.28, h - 10); g.fill();
  }, 'pavGlaze');
  const pillTex = draw(384, 100, (g, w, h) => {                                        // the green "Касса / Ticket office" pill (plain words)
    g.clearRect(0, 0, w, h); g.fillStyle = '#1d8a4c'; rr(g, 2, 2, w - 4, h - 4, 40); g.fill(); g.strokeStyle = '#f2f2ee'; g.lineWidth = 3; rr(g, 8, 8, w - 16, h - 16, 34); g.stroke();
    g.fillStyle = '#f7f7f2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 40px ${F.sans}`; g.fillText('Касса', w * 0.5, h * 0.36); g.font = `500 24px ${F.sans}`; g.fillText('Ticket office', w * 0.5, h * 0.72);
  }, 'pavPill');
  const nameTex = draw(1024, 96, (g, w, h) => {                                        // the name on the fascia: dark bronze capitals
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; let sz = 84; g.font = `600 ${sz}px ${F.serif}`; while (sz > 20 && g.measureText('ВАСИЛЕОСТРОВСКАЯ').width > w - 30) { sz -= 3; g.font = `600 ${sz}px ${F.serif}`; }
    g.fillStyle = '#2a2218'; g.fillText('ВАСИЛЕОСТРОВСКАЯ', w / 2 + 2, h / 2 + 3); g.fillStyle = '#6a583e'; g.fillText('ВАСИЛЕОСТРОВСКАЯ', w / 2, h / 2);
  }, 'pavName');
  const mTex = draw(128, 128, (g, w, h) => {                                           // plain blue M in a white disc (no logo, no brand)
    g.clearRect(0, 0, w, h); g.fillStyle = '#f2f2ee'; g.beginPath(); g.arc(64, 64, 62, 0, 6.2832); g.fill(); g.strokeStyle = '#1a4fb4'; g.lineWidth = 15; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(30, 94); g.lineTo(30, 36); g.lineTo(64, 74); g.lineTo(98, 36); g.lineTo(98, 94); g.stroke();
  }, 'pavM');
  const shutterTex = draw(128, 100, (g, w, h) => { g.fillStyle = '#e8e8e4'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(80,80,80,0.28)'; for (let y = 4; y < h; y += 7) g.fillRect(0, y, w, 2); g.strokeStyle = '#5a5e60'; g.lineWidth = 5; g.strokeRect(2, 2, w - 4, h - 4); }, 'pavShutter');
  const m = {
    trav: T('#ffffff', { map: travTex, name: 'lmAnd-pavTrav', paint: 0.03 }), base: T('#4d4a47', { map: M.A.graniteGrain, name: 'lmAnd-pavBase', paint: 0.04 }),
    glaze: T(W, { map: glazeTex, name: 'lmAnd-pavGlaze', paint: 0.01 }), frame: T('#3a3d3f', { name: 'lmAnd-pavFrame', paint: 0.01 }),
    step: T('#a29f99', { map: M.A.graniteGrain, name: 'lmAnd-pavStep', paint: 0.04 }), steel: T('#b9bdbf', { name: 'lmAnd-pavSteel', paint: 0.01 }), yellow: T('#e2b92d', { name: 'lmAnd-pavYellow', paint: 0.01, polygonOffset: -4 }),
    under: T('#cdbb99', { name: 'lmAnd-pavUnder', paint: 0.03 }), fascia: T('#c9b48f', { name: 'lmAnd-pavFascia', paint: 0.03 }), roofTop: T('#4b4944', { name: 'lmAnd-pavRoof', paint: 0.03 }),
    pill: T(W, { map: pillTex, name: 'lmAnd-pavPill', paint: 0, polygonOffset: -2, transparent: true, depthWrite: false }), name: T(W, { map: nameTex, name: 'lmAnd-pavName', paint: 0, polygonOffset: -2, transparent: true, depthWrite: false }),
    mark: T(W, { map: mTex, name: 'lmAnd-pavM', paint: 0, polygonOffset: -2, transparent: true, depthWrite: false }), shutter: T(W, { map: shutterTex, name: 'lmAnd-pavShutter', paint: 0, polygonOffset: -2 }),
  };
  for (const k of ['pill', 'name', 'mark', 'shutter']) M.decals.add(m[k]);
  M.pav = m; return m;
}

/** reserve a facade rectangle through the label registry (true when it is free or there is no registry) */
const label = (ctx, id, x, y, z, w, h, nx, nz, kind) => { const lb = ctx.services && ctx.services.labels; return !lb || lb.reserve(id, x, y, z, w, h, nx, nz, kind); };

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, mk = mats(K), cover = coverFn(ctx);
  const fp = footprintIn('w183122885', FV, FALL), ring = fp.outer;
  const edges = ringEdges(polyOf(ring));
  const wr = ring.map(([a, b]) => { const p = FV.W(a, b); return [p.x, p.z]; }), wEdges = ringEdges(polyOf(wr));                    // the same edges in world metres (colliders)
  const door = (e) => { const out = []; for (const d of (L.DOORWAYS || []).filter((q) => q.bldg === 'w183122885')) { const m = FV.M(d.x, d.z), lo = localOnEdge(e, m.a, m.b); if (Math.abs(lo.d) < 1.3 && lo.u > 1 && lo.u < e.len - 1) out.push({ u: lo.u, w: d.w || 4.4, id: d.id, rotY: d.rotY, x: d.x, z: d.z }); } return out; };
  const wpos = (i, u, y, z) => { const e = wEdges[i], f = frameOf(e); return [f.x + f.xa[0] * u + e.n[0] * z, y, f.z + f.xa[1] * u + e.n[1] * z]; }, wnorm = (i) => [wEdges[i].n[0], wEdges[i].n[1]];      // world point / normal of an edge frame
  const stairFace = (e) => e.len > 20 && (e.n[1] < -0.9 || e.n[0] > 0.9);
  // overhang offsets per edge: 1.8 m on the stair faces, 0.6 m elsewhere (outward = negative)
  const canopy = offsetRing(ring, edges.map((e) => -(stairFace(e) ? 1.8 : 0.6)));
  const ne = edges.find((e) => e.n[0] > 0.9 && e.len > 20), nw = edges.find((e) => e.n[1] < -0.9 && e.len > 20);
  P.push(FV.ox, 0, FV.oz, FV.rot);
  try {
    for (const e of edges) onEdge(P, e, (len) => {
      const dr = door(e), st = stairFace(e);
      // wall base (granite, podium) and the travertine panels in segments between the door gaps
      const gaps = dr.map((d) => [d.u - 2.4, d.u + 2.4]).sort((a, b) => a[0] - b[0]);
      const segs = []; let u0 = 0; for (const g of gaps) { if (g[0] > u0 + 0.02) segs.push([u0, g[0]]); u0 = g[1]; } if (u0 < len - 0.02) segs.push([u0, len]);
      for (const [a, b] of segs) {
        P.quad(mk.base, [a, 0, 0], [b, 0, 0], [b, H.fl, 0], [a, H.fl, 0], [0, 0, 1], [[a / 2, 0], [b / 2, 0], [b / 2, H.fl / 2], [a / 2, H.fl / 2]]);
        const top = st ? H.panel : H.soffit;
        P.quad(mk.trav, [a, H.fl, 0], [b, H.fl, 0], [b, top, 0], [a, top, 0], [0, 0, 1], [[a / 1.2, H.fl / 1.2], [b / 1.2, H.fl / 1.2], [b / 1.2, top / 1.2], [a / 1.2, top / 1.2]]);
        if (st) P.quad(mk.glaze, [a, H.panel, 0], [b, H.panel, 0], [b, H.soffit, 0], [a, H.soffit, 0], [0, 0, 1], [[a / 1.9, 0], [b / 1.9, 0], [b / 1.9, 1], [a / 1.9, 1]]);
        else for (let u = a + 2.0; u < b - 1.4; u += 3.8) P.quad(mk.frame, [u, 4.0, 0.02], [u + 0.5, 4.0, 0.02], [u + 0.5, 5.4, 0.02], [u, 5.4, 0.02], [0, 0, 1]);   // narrow window slits on the plain faces
      }
      for (const d of dr) {                                                                                      // an open door group: jamb posts, a transom of glazing, the pill, the reveal
        const x0 = d.u - 2.4, x1 = d.u + 2.4;
        P.box(mk.base, x0, x1, 0, H.fl, -0.3, 0, 'bk', 2);
        P.quad(mk.trav, [x0, H.fl + 2.6, 0], [x1, H.fl + 2.6, 0], [x1, H.panel, 0], [x0, H.panel, 0], [0, 0, 1]);            // transom above the doors: dark glass
        P.quad(mk.glaze, [x0, H.fl + 2.6, 0.01], [x1, H.fl + 2.6, 0.01], [x1, H.soffit, 0.01], [x0, H.soffit, 0.01], [0, 0, 1], [[x0 / 1.9, 0], [x1 / 1.9, 0], [x1 / 1.9, 1], [x0 / 1.9, 1]]);
        for (const x of [x0 - 0.06, x1 + 0.06]) P.box(mk.frame, x - 0.08, x + 0.08, H.fl, H.fl + 2.6, -0.12, 0.08, 'b', 1);
        P.box(mk.frame, x0 - 0.06, x1 + 0.06, H.fl + 2.55, H.fl + 2.68, -0.12, 0.08, 'b', 1);
        // the green ticket-office pill over the door and two shuttered ticket windows beside it (each reserved on the wall first)
        const ei = edges.indexOf(e), pillY = H.fl + 3.1;
        if (label(ctx, 'w183122885', ...wpos(ei, d.u, pillY + 0.2, 0.03), 1.5, 0.4, ...wnorm(ei), 'shop')) P.quad(mk.pill, [d.u - 0.75, pillY, 0.03], [d.u + 0.75, pillY, 0.03], [d.u + 0.75, pillY + 0.4, 0.03], [d.u - 0.75, pillY + 0.4, 0.03], [0, 0, 1]);
        if (e.n[0] > 0.9) for (const dx of [-4.4, 4.4]) {
          const u = d.u + dx; if (u < 0.8 || u > len - 0.8) continue;
          if (label(ctx, 'w183122885', ...wpos(ei, u, H.fl + 1.5, 0.03), 1.2, 1.0, ...wnorm(ei), 'shop')) P.quad(mk.shutter, [u - 0.6, H.fl + 1.0, 0.03], [u + 0.6, H.fl + 1.0, 0.03], [u + 0.6, H.fl + 2.0, 0.03], [u - 0.6, H.fl + 2.0, 0.03], [0, 0, 1]);
        }
      }
    });
    // ---- the canopy: a flat slab (soffit 6.45, top 7.15) over the footprint with the overhang, a fascia band and the roof
    const R = canopy, n = R.length, cenA = ring.reduce((t, p) => t + p[0], 0) / ring.length, cenB = ring.reduce((t, p) => t + p[1], 0) / ring.length;
    P.cap(mk.under, R, H.soffit, false, 3);
    P.cap(mk.roofTop, R, H.roof, true, 3);
    for (let i = 0; i < n; i++) {
      const a = R[i], b = R[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      // outward normal: away from the footprint centre
      const mx = (a[0] + b[0]) / 2 - cenA, mz = (a[1] + b[1]) / 2 - cenB, out = mx * nx + mz * nz > 0 ? 1 : -1;
      P.quad(mk.fascia, [a[0], H.soffit, a[1]], [b[0], H.soffit, b[1]], [b[0], H.roof, b[1]], [a[0], H.roof, a[1]], [nx * out, 0, nz * out], [[0, 0], [l / 2, 0], [l / 2, 0.35], [0, 0.35]]);
    }
    // the name on the fascia of the north-east face and the plain blue M at the north corner
    if (ne) onEdge(P, ne, (len) => {
      const ov = 1.8, y0 = H.soffit + 0.14, uc = len * 0.5;
      const ni = edges.indexOf(ne);
      if (label(ctx, 'w183122885', ...wpos(ni, uc, y0 + 0.22, ov + 0.02), 7.8, 0.45, ...wnorm(ni), 'name')) P.quad(mk.name, [uc - 3.9, y0, ov + 0.02], [uc + 3.9, y0, ov + 0.02], [uc + 3.9, y0 + 0.45, ov + 0.02], [uc - 3.9, y0 + 0.45, ov + 0.02], [0, 0, 1]);
      P.quad(mk.mark, [len - 1.9 - 0.45, y0 - 0.1, ov + 0.02], [len - 1.9 + 0.45, y0 - 0.1, ov + 0.02], [len - 1.9 + 0.45, y0 + 0.8, ov + 0.02], [len - 1.9 - 0.45, y0 + 0.8, ov + 0.02], [0, 0, 1]);
    });
    if (nw) onEdge(P, nw, (len) => { const ov = 1.8, y0 = H.soffit + 0.14, uc = len * 0.35, ni = edges.indexOf(nw); if (label(ctx, 'w183122885', ...wpos(ni, uc, y0 + 0.22, ov + 0.02), 7.8, 0.45, ...wnorm(ni), 'name')) P.quad(mk.name, [uc - 3.9, y0, ov + 0.02], [uc + 3.9, y0, ov + 0.02], [uc + 3.9, y0 + 0.45, ov + 0.02], [uc - 3.9, y0 + 0.45, ov + 0.02], [0, 0, 1]); });
    // ---- the granite steps: concentric L round the north corner (n = 11 risers of 0.15, treads 0.30, the first tread is the landing at the wall)
    const neE = ne, nwE = nw;
    const flight = (e, lo, hi, railAt) => onEdge(P, e, (len) => {
      for (let j = 0; j < H.n; j++) {
        const top = H.fl - H.rise * j, z0 = H.tread * j, z1 = H.tread * (j + 1), x0 = -(lo(j)), x1 = len + hi(j);
        P.box(mk.step, x0, x1, 0, top, z0, z1, 'b', 2);
      }
      // stainless handrails at the two flight ends (posts + a sloped rail from the landing down to the pavement)
      for (const x of [railAt === 0 ? -0.05 : len + 0.05]) {
        P.cyl(mk.steel, [x, H.fl + 0.95, 0.3], [x, 0.95, H.tread * H.n], 0.025, 0.025, 6, false);
        for (const z of [0.3, H.tread * H.n - 0.1]) P.cyl(mk.steel, [x, z < 1 ? H.fl : 0, z], [x, (z < 1 ? H.fl : 0) + 0.95, z], 0.03, 0.03, 6, true);
      }
    });
    if (neE) flight(neE, () => 0, (j) => H.tread * (j + 1), 0);
    if (nwE) flight(nwE, (j) => H.tread * j, () => 0, 1);
    // yellow tactile band along the foot of the steps (0.4 m wide)
    for (const e of [neE, nwE]) if (e) onEdge(P, e, (len) => {
      const z0 = H.tread * H.n + 0.25, z1 = z0 + 0.4, xa = e === nwE ? -(H.tread * H.n) : 0, xb = e === neE ? len + H.tread * H.n : len;
      P.quad(mk.yellow, [xa, 0.06, z0], [xb, 0.06, z0], [xb, 0.06, z1], [xa, 0.06, z1], [0, 1, 0]);
    });
  } finally { P.pop(); }
  // ---- the pavilion square: granite slabs between the pavilion, the first houses of the boulevard and Sredny pr. (frame B: q -58 .. -5.5, s 0 .. 70), clipped at the real asphalt
  P.push(FB.ox, 0, FB.oz, FB.rot);
  try { K.svc.pavilionSquareTris = fillPolyClipped(P, M.slabGrey, [[-58, 0], [-5.5, 0], [-5.5, 70], [-58, 70]], 0.04, (x, z) => cover(x, z), { margin: 0.25, maxEdge: 3, tile: 3.6 }); } finally { P.pop(); }
  // ---- colliders: wall boxes (split at the DOORWAYS), the steps (walk boxes in the world edge frames), the handrails
  try { const rec = L.buildingById('w183122885'); if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 8, 0.8); } catch (e) { console.warn('[landmarksAndrew] pavilion colliders:', e && e.message); }
  const wne = ne ? wEdges[edges.indexOf(ne)] : null, wnw = nw ? wEdges[edges.indexOf(nw)] : null;
  const walkTread = (e, x0, x1, z0, z1, top) => {                      // a walk box in a world edge frame (x along the wall, z out)
    const f = frameOf(e), lx = (x0 + x1) / 2, lz = (z0 + z1) / 2, cx = f.x + f.xa[0] * lx + e.n[0] * lz, cz = f.z + f.xa[1] * lx + e.n[1] * lz;
    const it = ph.addWalkBox(cx, cz, x1 - x0, z1 - z0, f.rot, top, 0); if (it) it.sticky = true;
  };
  if (wne) for (let j = 0; j < H.n; j++) walkTread(wne, 0.0, wne.len + H.tread * (j + 1), H.tread * j, H.tread * (j + 1), Math.max(0.12, H.fl - H.rise * j));
  if (wnw) for (let j = 0; j < H.n; j++) walkTread(wnw, -H.tread * j, wnw.len, H.tread * j, H.tread * (j + 1), Math.max(0.12, H.fl - H.rise * j));
  // ---- services: entrances (the metro's OSM doors), crowd on the steps, photo spots
  for (const d of (L.DOORWAYS || []).filter((q) => q.bldg === 'w183122885')) K.svc.entrances.push({ id: d.id, x: d.x, z: d.z, rotY: d.rotY, kind: d.kind, name: d.kind === 'entrance' ? 'Станция «Василеостровская»: вход' : 'Станция «Василеостровская»: выход' });
  const c = FV.W(17.0, 0), c2 = FV.W(0, -20);
  K.svc.crowd.push({ id: 'vo-pavilion-steps', kind: 'metro', x: c.x, z: c.z, r: 8, n: 8 }, { id: 'vo-pavilion-sredny', kind: 'metro', x: c2.x, z: c2.z, r: 6, n: 6 });
  K.svc.monuments.push({ id: 'w183122885', name: 'Станция метро «Василеостровская» (наземный вестибюль)', x: FV.W(0, 0).x, z: FV.W(0, 0).z, h: 7.15 });
  for (const [a, b, yaw, name] of [[17.6 + 14, -2, 35, 'Вестибюль «Василеостровской»: ступени'], [-3, -19.3 - 14, 121, 'Вестибюль «Василеостровской»: вход со стороны Среднего проспекта']]) {
    const p = FV.W(a, b); if (cover(p.x, p.z) < -0.6) K.svc.photoSpots.push({ x: p.x, z: p.z, yaw, pitch: 4, name });
  }
  void THREE; void G;
}
