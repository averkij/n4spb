// landmarksAndrew/pel.js - the PEL HOUSE (Доходный дом и аптека А. В. Пеля, 7-я линия 16-18 / Днепровский пер. 1, r1193123; 1907-10) with the GRIFFINS (Digit) TOWER in its yard: a five-storey Art Nouveau house of
// orange-brown brick on a rough granite base (cream brick above the second floor with orange bands, a dark-green glazed band under the grey-green mansard), a rounded corner bay under a green bell-capped
// turret (tip 29 m), two smaller green turrets on the Dneprovsky face, a shaped gable, dormers, the arched pharmacy portal in a rusticated granite surround and the old-orthography sign bands; in the yard the
// red-brick chimney with two iron bands, a corbelled cap and white digits on the bricks (11 m, no egg).  Dossier docs/research/andrew.md section 7 (critic-corrected), photos refs/andrew 95 96 97 99 100 101 104 107.
// Frame P (frame.js).  The two street faces (north, east) are bay-textured walls (one painted 3.3 m bay per tile), the other faces plain cream plaster with windows; roofs / turrets / portal are geometry.
// Colliders: the footprint wall boxes, the tower cylinder (the yard is closed: nobody enters it).
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, band, onEdge, polyOf, localOnEdge, roundCorner } from './kit.js';
import * as G from './geo.js';
import { FP } from './frame.js';
import { footprintIn, offsetRing } from './ringkit.js';

const FALL = { outer: [[-30.2, -27.3], [35.5, -26.5], [35.1, 16.4], [4.9, 16.0], [4.6, 38.4], [-30.8, 38.0], [-30.8, 31.7], [-2.0, 32.1], [-1.9, 23.4], [-16.7, 23.1], [-16.8, 25.4], [-30.7, 25.2]],
  holes: [[[-16.7, -5.3], [-16.9, 16.2], [-10.4, 16.3], [-10.3, -5.2]], [[5.0, -4.9], [5.0, 4.0], [2.2, 3.9], [2.1, 7.9], [14.8, 8.1], [16.5, 10.9], [18.4, 11.0], [18.6, -1.4], [16.4, -4.8], [14.7, -4.8], [14.5, -2.8], [12.0, -2.9], [10.9, -4.8]]] };
const H = { base: 2.2, shop: 5.2, brick2: 9.2, green: 19.5, cornice: 21.0, mansard: 24.5, bay: 3.3 };
const BELL = [[1.0, 0], [1.02, 0.1], [0.82, 0.24], [0.7, 0.4], [0.82, 0.58], [1.0, 0.72], [0.92, 0.86], [0.55, 0.95], [0.2, 0.99], [0, 1]];

function mats(K) {
  const { ctx, M } = K; if (M.pel) return M.pel;
  const T = ctx.mat.toon, tex = ctx.tex, F = tex.FONTS, W = '#ffffff', r = ctx.rng(7733);
  const draw = (w, h, fn, key, rep = [1, 1]) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat: rep });
  const PX = 256 / H.bay, PY = 1024 / H.cornice, Y = (m) => 1024 - m * PY, X = (m) => m * PX;
  const brickLines = (g, y0, y1, col) => { g.fillStyle = col; for (let y = y0; y < y1; y += 12) g.fillRect(0, y, 256, 1.2); };
  const win = (g, x0, x1, ya, yb, arch) => {                                          // a window: dark brown frame, glass, mullions; yb = top (metres), ya = sill
    const l = X(x0), rr = X(x1), top = Y(yb), bot = Y(ya), w = rr - l;
    g.fillStyle = '#4a3326'; g.beginPath(); g.moveTo(l - 5, bot + 5); g.lineTo(l - 5, top + (arch ? w * 0.25 : 0) - 5); if (arch) g.quadraticCurveTo(l + w / 2, top - w * 0.2, rr + 5, top + w * 0.25 - 5); else g.lineTo(rr + 5, top - 5); g.lineTo(rr + 5, bot + 5); g.closePath(); g.fill();
    const gr = g.createLinearGradient(l, top, rr, bot); gr.addColorStop(0, '#5f7f8c'); gr.addColorStop(0.5, '#2c3d48'); gr.addColorStop(1, '#1a2630'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(l, bot); g.lineTo(l, top + (arch ? w * 0.25 : 0)); if (arch) g.quadraticCurveTo(l + w / 2, top - w * 0.14, rr, top + w * 0.25); else g.lineTo(rr, top); g.lineTo(rr, bot); g.closePath(); g.fill();
    g.fillStyle = '#4a3326'; g.fillRect((l + rr) / 2 - 2, top + 4, 4, bot - top - 4); g.fillRect(l, top + (bot - top) * 0.34, rr - l, 3);
  };
  const bay = draw(256, 1024, (g) => {
    g.fillStyle = '#8d7a74'; g.fillRect(0, Y(H.base), 256, 1024 - Y(H.base));                                       // rough granite base
    for (let row = 0; row < 3; row++) for (let c = -1; c < 3; c++) { const x = c * 100 + (row % 2) * 50, y = Y(H.base) + row * (Y(0) - Y(H.base)) / 3, v = 0.86 + r() * 0.28; g.fillStyle = `rgb(${150 * v | 0},${128 * v | 0},${120 * v | 0})`; g.fillRect(x + 2, y + 2, 96, (Y(0) - Y(H.base)) / 3 - 4); }
    g.fillStyle = '#c98a5a'; g.fillRect(0, Y(H.brick2), 256, Y(H.base) - Y(H.brick2)); brickLines(g, Y(H.brick2), Y(H.base), 'rgba(250,215,170,0.30)');      // orange-brown brick to the second floor
    g.fillStyle = '#d8c29c'; g.fillRect(0, Y(H.green), 256, Y(H.brick2) - Y(H.green)); brickLines(g, Y(H.green), Y(H.brick2), 'rgba(255,248,225,0.30)');       // cream brick above
    g.fillStyle = '#c98a5a'; for (const y of [9.2, 13.15, 17.1]) g.fillRect(0, Y(y + 0.55), 256, 0.55 * PY);                                              // orange bands at every floor
    const gg = g.createLinearGradient(0, Y(H.cornice), 0, Y(H.green)); gg.addColorStop(0, '#3f7358'); gg.addColorStop(1, '#2f5a45'); g.fillStyle = gg; g.fillRect(0, Y(H.cornice), 256, (H.cornice - H.green) * PY);   // dark-green glazed band
    g.fillStyle = 'rgba(120,200,160,0.18)'; for (let x = 0; x < 256; x += 22) g.fillRect(x, Y(H.cornice), 11, (H.cornice - H.green) * PY);
    g.fillStyle = '#a2603a'; g.fillRect(X(0.45), Y(5.4), X(2.4), 0.35 * PY);                                         // brick lintel over the shop window
    win(g, 0.55, 2.75, 2.4, 5.0, false);                                                                              // shop window 2.2 x 2.6
    g.fillStyle = '#2a2624'; g.fillRect(X(0.6), Y(1.05), X(2.1), 0.5 * PY); for (let x = 0.7; x < 2.7; x += 0.25) { g.fillStyle = '#1a1816'; g.fillRect(X(x), Y(1.05), 3, 0.5 * PY); }   // cellar grille
    win(g, 1.0, 2.3, 6.4, 8.3, true);                                                                                  // second floor: arched window
    win(g, 1.0, 2.3, 10.1, 12.0, true); win(g, 1.0, 2.3, 14.05, 15.95, true); win(g, 1.0, 2.3, 18.0, 19.35, false);       // floors 3-5
    g.fillStyle = 'rgba(255,240,210,0.5)'; for (const y of [8.45, 12.15, 16.1]) g.fillRect(X(0.85), Y(y), X(1.6), 0.1 * PY);                                 // sills
  }, 'pelBay');
  const yard = draw(256, 1024, (g) => {                                              // the yard / back faces: cream plaster, plain windows with black grilles
    g.fillStyle = '#e5d9a2'; g.fillRect(0, 0, 256, 1024);
    g.fillStyle = '#c9bd88'; g.fillRect(0, Y(0.9), 256, 0.9 * PY); g.fillStyle = 'rgba(120,100,60,0.25)'; g.fillRect(0, Y(H.cornice) - 8, 256, 8);
    for (let f = 0; f < 5; f++) { const y0 = 1.0 + f * 3.95, y1 = y0 + (f === 0 ? 2.3 : 2.0); g.fillStyle = '#f2ece0'; g.fillRect(X(0.85), Y(y1 + 0.12), X(1.6), (y1 - y0 + 0.24) * PY); g.fillStyle = '#26323b'; g.fillRect(X(1.0), Y(y1), X(1.3), (y1 - y0) * PY); g.fillStyle = '#e8e4d8'; g.fillRect(X(1.62) - 2, Y(y1), 4, (y1 - y0) * PY); if (f === 0) { g.strokeStyle = '#111'; g.lineWidth = 2; for (let x = 1.0; x <= 2.3; x += 0.22) { g.beginPath(); g.moveTo(X(x), Y(y1)); g.lineTo(X(x), Y(y0)); g.stroke(); } } }
  }, 'pelYard');
  const bandTex = (key, text, w = 512, h = 64) => draw(w, h, (g) => {                // grey sign plaque with light capitals (old orthography, real texts)
    g.fillStyle = '#7f8683'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5f6663'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.textAlign = 'center'; g.textBaseline = 'middle'; let sz = 34; g.font = `600 ${sz}px ${F.serif}`; while (sz > 9 && g.measureText(text).width > w - 28) { sz--; g.font = `600 ${sz}px ${F.serif}`; }
    g.fillStyle = '#d3d7d4'; g.fillText(text, w / 2, h / 2 + 2);
  }, key);
  const aptekaTex = draw(256, 72, (g, w, h) => { g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a3d6b'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#25376a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 46px ${F.serif}`; g.fillText('АПТЕКА', w / 2, h / 2 + 2); }, 'pelApteka');
  const digitTex = draw(256, 256, (g, w, h) => {                                     // the Digit tower: brick courses with white painted numerals (cylinder uv: u round, v up; tile ~2.8 m x 2.2 m)
    g.fillStyle = '#b0553c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(205,190,165,0.7)'; g.fillRect(0, y, w, 1.2); const off = (y / 8) % 2 ? 0 : 10; for (let x = off; x < w; x += 20) g.fillRect(x, y, 1.2, 8); }
    g.fillStyle = 'rgba(242,239,230,0.85)'; g.font = `700 7px ${F.sans}`; g.textBaseline = 'top'; for (let y = 1; y < h - 8; y += 8) for (let x = 3; x < w - 8; x += 20) if (r() < 0.8) g.fillText(String((r() * 10) | 0), x + 5, y);
  }, 'pelDigits');
  const m = {
    bay: T(W, { map: bay, name: 'lmAnd-pelBay', paint: 0.03 }), yard: T(W, { map: yard, name: 'lmAnd-pelYard', paint: 0.03 }), digits: T(W, { map: digitTex, name: 'lmAnd-pelDigits', paint: 0.03 }),
    cream: T('#d8c29c', { name: 'lmAnd-pelCream', paint: 0.04 }), brick: T('#c98a5a', { name: 'lmAnd-pelBrick', paint: 0.04 }), granite: T('#8d7a74', { map: M.A.rustic, name: 'lmAnd-pelGranite', paint: 0.04 }),
    copper: T('#5ba283', { map: M.A.sheetGlow, name: 'lmAnd-pelCopper', paint: 0.04, side: 'double' }), copperShade: T('#35594a', { name: 'lmAnd-pelCopperShade', paint: 0.04 }),
    roof: T('#5d6e62', { map: M.A.seams, name: 'lmAnd-pelRoof', paint: 0.04, side: 'double' }), iron: T('#3a3633', { name: 'lmAnd-pelIron', paint: 0.02 }), win: T(W, { map: M.A.winBrownTall, name: 'lmAnd-pelWin', paint: 0, polygonOffset: -1 }),
    apteka: T(W, { map: aptekaTex, name: 'lmAnd-pelApteka', paint: 0, polygonOffset: -2 }), cornice: T('#cdbb94', { name: 'lmAnd-pelCornice', paint: 0.04 }),
    s1: T(W, { map: bandTex('pelSign1', 'РУССКІЙ ДЛЯ ВНѢШНЕЙ ТОРГОВЛИ БАНКЪ'), name: 'lmAnd-pelSign1', paint: 0, polygonOffset: -2 }), s2: T(W, { map: bandTex('pelSign2', 'ТВО ПРОФЕССОРА ДОКТОРА ПЕЛЯ и СЫНОВЕЙ.'), name: 'lmAnd-pelSign2', paint: 0, polygonOffset: -2 }),
    s3: T(W, { map: bandTex('pelSign3', 'АПТЕКА ПРОФ. ДОКТОРА ПЕЛЯ и СЫНОВЕЙ'), name: 'lmAnd-pelSign3', paint: 0, polygonOffset: -2 }), s4: T(W, { map: bandTex('pelSign4', 'ЛАБОРАТОРІЯ', 256, 56), name: 'lmAnd-pelSign4', paint: 0, polygonOffset: -2 }),
  };
  for (const k of ['win', 'apteka', 's1', 's2', 's3', 's4']) M.decals.add(m[k]);
  M.pel = m; return m;
}
const label = (ctx, id, x, y, z, w, h, nx, nz, kind) => { const lb = ctx.services && ctx.services.labels; return !lb || lb.reserve(id, x, y, z, w, h, nx, nz, kind); };

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, mk = mats(K);
  const fp = footprintIn('r1193123', FP, FALL), outer = fp.outer, holes = fp.holes;
  const all = ringEdges(polyOf(outer, holes));
  const wr = (ring) => ring.map(([a, b]) => { const p = FP.W(a, b); return [p.x, p.z]; }), wAll = ringEdges(polyOf(wr(outer), holes.map(wr)));
  const isNorth = (e) => !e.hole && e.n[1] < -0.9 && e.len > 50, isEast = (e) => !e.hole && e.n[0] > 0.9 && e.len > 35;
  // the rounded NE corner (R 2.6) above the corbel at 8.7 m: the ring with the corner vertex replaced by an arc
  const NE = outer.reduce((bi, p, i) => (Math.hypot(p[0] - 35.5, p[1] + 26.5) < Math.hypot(outer[bi][0] - 35.5, outer[bi][1] + 26.5) ? i : bi), 0), NEv = outer[NE], CORB = 8.7, RB = 2.6;
  const ringR = roundCorner(outer, NE, RB, 6), arc = ringR.slice(NE, NE + 7);
  const chunks = (edges) => { const out = []; for (const e of edges) { const c = out[out.length - 1]; if (c && Math.hypot(c[c.length - 1].b[0] - e.a[0], c[c.length - 1].b[1] - e.a[1]) < 0.05) c.push(e); else out.push([e]); } return out; };
  const bayQuads = (m, x0, x1, y0, y1, pitchLen) => {                                  // bay-textured wall x0..x1 at z = 0: whole bays between x0 and x1, one painted bay per tile (v = y / 21 m)
    const n = Math.max(1, Math.round((x1 - x0) / pitchLen)), v0 = y0 / H.cornice, v1 = y1 / H.cornice;
    for (let i = 0; i < n; i++) { const a = x0 + i * (x1 - x0) / n, b = x0 + (i + 1) * (x1 - x0) / n; P.quad(m, [a, y0, 0], [b, y0, 0], [b, y1, 0], [a, y1, 0], [0, 0, 1], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
  };
  P.push(FP.ox, 0, FP.oz, FP.rot);
  try {
    for (const e of all) onEdge(P, e, (len, f) => {
      const street = isNorth(e) || isEast(e), m = street ? mk.bay : mk.yard;
      if (len < 2.2) { G.wall(P, mk.cream, 0, len, 0, H.cornice, 0, 3); return; }
      const adj = !e.hole && (e.i === NE || e.i === (NE + outer.length - 1) % outer.length);
      if (!adj) { bayQuads(m, 0, len, 0, H.cornice, H.bay); return; }
      bayQuads(m, 0, len, 0, CORB, H.bay);                                              // the square corner below the corbel
      const cornerAtX0 = Math.hypot(f.x - NEv[0], f.z - NEv[1]) < 0.3;
      if (cornerAtX0) bayQuads(m, RB, len, CORB, H.cornice, H.bay); else bayQuads(m, 0, len - RB, CORB, H.cornice, H.bay);
    });
    // the rounded corner strip: one continuous bay texture round the arc (the window in the middle), a granite ledge (the corbel top) between the arc and the square corner
    { let tot = 0; for (let k = 0; k < 6; k++) tot += Math.hypot(arc[k + 1][0] - arc[k][0], arc[k + 1][1] - arc[k][1]);
      let s = 0; for (let k = 0; k < 6; k++) {
        const A = arc[k], B = arc[k + 1], l = Math.hypot(B[0] - A[0], B[1] - A[1]), u0 = 0.5 + (s - tot / 2) / H.bay, u1 = 0.5 + (s + l - tot / 2) / H.bay, v0 = CORB / H.cornice, mx = (A[0] + B[0]) / 2 - 30, mz = (A[1] + B[1]) / 2 + 20;
        P.quad(mk.bay, [A[0], CORB, A[1]], [B[0], CORB, B[1]], [B[0], H.cornice, B[1]], [A[0], H.cornice, A[1]], [mx, 0, mz], [[u0, v0], [u1, v0], [u1, 1], [u0, 1]]); s += l;
      }
      P.cap(mk.granite, [...arc, NEv], CORB, true, 2);
      P.cap(mk.granite, [...arc, NEv], CORB - 0.25, false, 2);
    }
    // plinth / cornice rings (mitred) round every ring; the outer cornice follows the rounded corner
    { const eR = ringEdges(polyOf(ringR)); band(P, eR, H.cornice - 0.5, H.cornice, 0.45, { front: mk.cornice, top: mk.cornice, under: M.underside }, { uvs: 3 });
      const eH = all.filter((e) => e.hole);
      for (const c of chunks(eH)) band(P, c, H.cornice - 0.5, H.cornice, 0.45, { front: mk.cornice, top: mk.cornice, under: M.underside }, { uvs: 3 });
      for (const c of chunks(all)) band(P, c, H.base - 0.12, H.base + 0.08, 0.12, { front: mk.granite, top: mk.granite }, { uvs: 2 }); }
    // ---- the roof: a mansard (steep lower slope from the cornice to the inset ring, a flat top), dormers on the two street faces
    const inset = 1.9, rise = H.mansard - H.cornice;
    const top = offsetRing(outer, inset), htops = holes.map((h) => offsetRing(h, -inset));
    const slope = (a0, a1, b0, b1) => { const l = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / 2.2; P.quad(mk.roof, [a0[0], H.cornice, a0[1]], [a1[0], H.cornice, a1[1]], [b1[0], H.mansard, b1[1]], [b0[0], H.mansard, b0[1]], [0, 1, 0], [[0, 0], [l, 0], [l, 2], [0, 2]]); };
    for (let i = 0; i < outer.length; i++) { const j = (i + 1) % outer.length; slope(outer[i], outer[j], top[i], top[j]); }
    holes.forEach((h, k) => { const ht = htops[k]; for (let i = 0; i < h.length; i++) { const j = (i + 1) % h.length; slope(h[i], h[j], ht[i], ht[j]); } });
    try { P.cap(mk.roof, top, H.mansard, true, 3, htops); } catch (e) { console.warn('[landmarksAndrew] pel roof cap:', e && e.message); }
    for (const e of all) if (isNorth(e) || isEast(e)) onEdge(P, e, (len) => { const nb = Math.max(1, Math.round(len / H.bay)); for (let i = 1; i < nb - 1; i += 2) dormer(P, mk, (i + 0.5) * len / nb, rise / inset); });
    // ---- turrets: the lantern + bell cap of the NE corner bay, two small ones on the north face, the shaped gable at the NW end of the north face
    corner(P, mk, 33.0, -24.4);
    for (const [a, b] of [[8, -25.4], [-22, -25.4]]) { P.col(mk.cream, a, b, H.cornice, H.cornice + 1.8, 1.25, 1.25, 12, true); G.lathe(P, mk.copper, 'pelBell', BELL, a, H.cornice + 1.8, b, 1.3, 3.0, 12, 12); P.cyl(mk.iron, [a, H.cornice + 4.8, b], [a, H.cornice + 5.1, b], 0.05, 0.02, 5, true); }
    { const e = all.find(isNorth); if (e) onEdge(P, e, () => { const u0 = 3.0, pts = [[u0, H.cornice], [u0 + 7, H.cornice], [u0 + 7, H.cornice + 1.2], [u0 + 5.4, H.cornice + 2.8], [u0 + 3.5, H.cornice + 4.2], [u0 + 1.6, H.cornice + 2.8], [u0, H.cornice + 1.2]]; G.solid(P, mk.cream, pts, -0.6, 0.6, 2); G.planeShape(P, mk.win, G.archPts(u0 + 3.5, H.cornice + 0.6, 1.4, 2.4, 8), 0.03); }); }
    // ---- the pharmacy portal on the east face (OSM n7175627836 at P(35.3, -7.8)): round arch 3.4 x 4.6 in a rusticated granite surround, the APTEKA plaque, the sign bands
    const ee = all.find(isEast), ei = all.indexOf(ee);
    if (ee) onEdge(P, ee, (len) => {
      const u = localOnEdge(ee, 35.3, -7.8).u;
      P.quad(mk.granite, [u - 2.9, 0, 0.04], [u + 2.9, 0, 0.04], [u + 2.9, 6.4, 0.04], [u - 2.9, 6.4, 0.04], [0, 0, 1], [[0, 0], [1.8, 0], [1.8, 2], [0, 2]]);
      G.planeShape(P, M.doorBrown, G.archPts(u, 0.05, 2.8, 4.0, 10), 0.08);
      G.frameRing(P, mk.granite, G.archPts(u, 0, 4.6, 6.0, 12), G.archPts(u, 0.05, 2.8, 4.0, 10), 0.04, 0.35, 1);
      for (const dx of [-3.4, 3.4]) P.box(mk.iron, u + dx - 0.04, u + dx + 0.04, 3.2, 4.3, 0.04, 0.8, '', 1);                  // the two scrolled bracket lamps
      const bands = [[mk.apteka, u, 6.55, 2.0, 0.55, 'apteka'], [mk.s2, u + 4.8, 5.55, 5.2, 0.52, 'sign'], [mk.s1, u - 6.2, 5.55, 5.6, 0.52, 'sign']];
      for (const [mat, uc, yc, w, h, kind] of bands) { if (uc - w / 2 < 0.3 || uc + w / 2 > len - 0.3) continue; if (!kk(ctx, ei, wAll, uc, yc, w, h, kind)) continue; P.quad(mat, [uc - w / 2, yc - h / 2, 0.05], [uc + w / 2, yc - h / 2, 0.05], [uc + w / 2, yc + h / 2, 0.05], [uc - w / 2, yc + h / 2, 0.05], [0, 0, 1]); }
      { const uc = len * 0.28, yc = 12.0; if (kk(ctx, ei, wAll, uc, yc, 2.6, 0.45, 'sign')) P.quad(mk.s4, [uc - 1.3, yc - 0.225, 0.05], [uc + 1.3, yc - 0.225, 0.05], [uc + 1.3, yc + 0.225, 0.05], [uc - 1.3, yc + 0.225, 0.05], [0, 0, 1]); }
    });
    const nn = all.find(isNorth), ni = all.indexOf(nn);
    if (nn) onEdge(P, nn, (len) => { const uc = len - 14, yc = 5.55; if (kk(ctx, ni, wAll, uc, yc, 7.0, 0.55, 'sign')) P.quad(mk.s3, [uc - 3.5, yc - 0.275, 0.05], [uc + 3.5, yc - 0.275, 0.05], [uc + 3.5, yc + 0.275, 0.05], [uc - 3.5, yc + 0.275, 0.05], [0, 0, 1]); });
    // ---- the Griffins Tower in the yard: P(11.0, -0.6)
    tower(P, mk, 11.0, -0.6);
  } finally { P.pop(); }
  try { const rec = L.buildingById('r1193123'); if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 22, 1.0); } catch (e) { console.warn('[landmarksAndrew] pel colliders:', e && e.message); }
  const tw = FP.W(11.0, -0.6); ph.addCylinder(tw.x, tw.z, 1.6, 0, 11.5);
  const nc = FP.W(33, -24);
  K.svc.monuments.push({ id: 'r1193123', name: 'Дом Пеля (Аптека Пеля)', x: nc.x, z: nc.z, h: 29.0, r: 8 }, { id: 'n951709427', name: 'Башня грифонов (Цифровая башня)', x: tw.x, z: tw.z, h: 11.0, r: 3 });
  K.svc.crowd.push({ id: 'pel-corner', kind: 'photo', x: FP.W(41, -30).x, z: FP.W(41, -30).z, r: 6, n: 4 });
  const sp = FP.W(58, -42); if (!L.isOnRoad(sp.x, sp.z, 0)) K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: 159, pitch: 14, name: 'Дом Пеля: угловая башня с 7-й линии' });
  void THREE;
}

/** reserve a rectangle on the wall of world edge i at (u, y) of w x h (true = draw it) */
function kk(ctx, i, wAll, u, y, w, h, kind) {
  const e = wAll[i], dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz) || 1, fwd = true; void fwd;
  // facade-local u runs to the right as seen from outside: origin = the end from which the +xa direction points along the edge
  const xa = [e.n[1], -e.n[0]], along = dx * xa[0] + dz * xa[1] > 0, o = along ? e.a : e.b;
  return label(ctx, 'r1193123', o[0] + xa[0] * u + e.n[0] * 0.05, y, o[1] + xa[1] * u + e.n[1] * 0.05, w, h, e.n[0], e.n[1], kind) && l > 0;
}

/** the lantern drum with two arched windows and the bulbous green bell cap (tip 29.0) over the rounded NE corner bay (centre P(33.0, -24.4)) */
function corner(P, mk, cx, cz) {
  G.tube(P, mk.cream, cx, cz, H.cornice, H.cornice + 2.6, 2.2, 2.2, 14, 3, 1);
  for (const a of [0.8, 2.2]) { const x = cx + Math.sin(a) * 2.18, z = cz + Math.cos(a) * 2.18; P.push(x, 0, z, a); G.planeShape(P, mk.win, G.archPts(0, H.cornice + 0.5, 1.0, 1.8, 8), 0.02); P.pop(); }
  G.lathe(P, mk.copper, 'pelBell', BELL, cx, H.cornice + 2.6, cz, 2.3, 5.0, 16, 14);
  P.cyl(mk.iron, [cx, 28.5, cz], [cx, 29.0, cz], 0.07, 0.02, 5, true);
}
/** a small dormer with green-copper cheeks on the steep mansard (facade frame; slope sl = rise / run): window front, two cheeks, a gable roof meeting the slope */
function dormer(P, mk, cx, sl) {
  const hw = 0.7, z0 = -0.4, yr = (z) => H.cornice - sl * z, yb = yr(z0) - 0.02, yt = yb + 1.5, zE = z0 - (yt - yr(z0)) / sl, ry = yt + 0.5, zR = z0 - (ry - yr(z0)) / sl;
  P.quad(mk.copperShade, [cx - hw, yb, z0], [cx + hw, yb, z0], [cx + hw, yt, z0], [cx - hw, yt, z0], [0, 0, 1]);
  P.quad(mk.win, [cx - 0.4, yb + 0.2, z0 + 0.02], [cx + 0.4, yb + 0.2, z0 + 0.02], [cx + 0.4, yb + 1.3, z0 + 0.02], [cx - 0.4, yb + 1.3, z0 + 0.02], [0, 0, 1]);
  P.fan(mk.copperShade, [[cx - hw - 0.06, yt, z0], [cx + hw + 0.06, yt, z0], [cx, ry, z0]], [0, 0, 1]);
  for (const s of [-1, 1]) {
    P.fan(mk.copperShade, [[cx + s * hw, yb, z0], [cx + s * hw, yt, z0], [cx + s * hw, yt, zE]], [s, 0, 0]);
    P.quad(mk.copper, [cx + s * (hw + 0.06), yt, z0], [cx, ry, z0], [cx, ry, zR], [cx + s * (hw + 0.06), yt, zE], [s * 0.5, 1, 0]);
  }
}
/** the Griffins Tower: d 3.0 at the flared foot (0 .. 1.4), 2.5 at the shaft, two iron bands at 0.40 / 0.72 of the height, a corbelled cap (9.6 .. 10.2) and a flat iron crown (d 2.9) */
function tower(P, mk, x, z) {
  G.tube(P, mk.digits, x, z, 0, 1.4, 1.55, 1.3, 20, 2, 1.2);
  G.tube(P, mk.digits, x, z, 1.4, 9.6, 1.25, 1.2, 20, 2.8, 3.7);
  for (const y of [4.4, 7.9]) G.tube(P, mk.iron, x, z, y, y + 0.14, 1.27, 1.27, 20, 4, 1);
  G.tube(P, mk.digits, x, z, 9.6, 10.2, 1.3, 1.5, 20, 2, 1, { capTop: mk.iron });
  P.col(mk.iron, x, z, 10.2, 10.45, 1.5, 1.5, 20, true);
}
