// landmarksFortress/gates.js - the gates of the fortress (dossier docs/research/fortress.md sections 3, 6): the vaulted passages through the ramparts (frame.js GATES: walls.js leaves the wall faces out
// where a portal stands) and their portals:
//  * PETROVSKY GATE (Trezzini 1717-18; photos refs/fortress 126 127 130 132): cream rusticated baroque portal, niches with the statues of Bravery and Prudence, attic with the dark wooden relief
//    "The overthrow of Simon Magus", curved pediment, volutes, the black lead double-headed eagle with gilded crowns; inner face red plaster with a white arch;
//  * NEVSKY GATE (Lvov 1784-87; photos 135 136 139): grey granite portico 12.2 x 12 m, paired Tuscan columns with diamond blocks, pediment with the anchor, two bombs; inner face white with green outlines;
//    the COMMANDANT PIER (photos 141 142 009): three-arch granite bridge, landing with parapets and three stairs to the water, ice-breaker piles;
//  * IOANNOVSKY GATE (1740; photos 120 122 124): white rusticated portal, pediment with trophies and a gilded crown;  VASILIEVSKY (yellow, pilasters + pediment; 150-153);
//    NIKOLSKY (ochre neo-Renaissance, two square towers on both faces; 146 149);  KRONVERKSKY (plain portal with a keystone).
// Gate frame: origin = the passage axis on the face, local +z = out of the wall, +x = to the right seen from outside.
import * as THREE from 'three';
import * as G from './geo.js';
import { GATES, WALL, RAV, axisToRing } from './frame.js';
import { human, cached, figureMats } from '../lib/figures.js';

/** outline of a wall panel -hw .. hw, 0 .. H with the arched opening w x h cut out of its foot (one simple polygon) */
function archOutline(hw, H, w, h, n = 10) {
  const r = w / 2, pts = [[-hw, 0], [-r, 0], [-r, h - r]];
  for (let i = 1; i < n; i++) { const a = Math.PI - Math.PI * i / n; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
  pts.push([r, h - r], [r, 0], [hw, 0], [hw, H], [-hw, H]);
  return pts;
}
const segPts = (hw, y, rise, n = 10) => { const p = [[-hw, y]]; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; p.push([-Math.cos(a) * hw, y + Math.sin(a) * rise]); } return p; };

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] gates/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const gate = (key) => GATES.find((g) => g.key === key);
  const outer = (g, fn) => { P.push(g.outer[0], 0, g.outer[1], Math.atan2(-g.d[0], -g.d[1])); try { fn(); } finally { P.pop(); } };
  const inner = (g, fn) => { P.push(g.inner[0], 0, g.inner[1], Math.atan2(g.d[0], g.d[1])); try { fn(); } finally { P.pop(); } };
  /** the vaulted passage of gate g (outer frame: it runs along -z), lining material `mat` */
  const tunnel = (g, mat) => outer(g, () => {
    const r = g.w / 2 + 0.04, hs = g.h - g.w / 2, z0 = 0.4, z1 = -g.len - 0.4, L = z0 - z1, nb = Math.max(1, Math.round(L / 3));      // 4 cm wider than the portal openings: no coplanar soffits
    for (const s of [-1, 1]) P.quad(mat, [s * r, 0, z0], [s * r, 0, z1], [s * r, hs, z1], [s * r, hs, z0], [-s, 0, 0], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
    for (let i = 0; i < 8; i++) { const a0 = Math.PI * i / 8, a1 = Math.PI * (i + 1) / 8, am = (a0 + a1) / 2; P.quad(mat, [Math.cos(a0) * r, hs + Math.sin(a0) * r, z0], [Math.cos(a0) * r, hs + Math.sin(a0) * r, z1], [Math.cos(a1) * r, hs + Math.sin(a1) * r, z1], [Math.cos(a1) * r, hs + Math.sin(a1) * r, z0], [-Math.cos(am), -Math.sin(am), 0], [[0, 0], [nb, 0], [nb, 0.3], [0, 0.3]]); }
    P.quad(M.cobble, [-r, 0.032, z0], [r, 0.032, z0], [r, 0.032, z1], [-r, 0.032, z1], [0, 1, 0], [[-r / 2, 0], [r / 2, 0], [r / 2, L / 2], [-r / 2, L / 2]]);
    // side colliders of the passage (world frame)
    const cx = (g.outer[0] + g.inner[0]) / 2, cz = (g.outer[1] + g.inner[1]) / 2, rot = Math.atan2(-g.d[1], g.d[0]);
    for (const s of [-1, 1]) ph.addBox(cx + g.t[0] * s * (r + 0.5), cz + g.t[1] * s * (r + 0.5), g.len + 1.6, 0.9, rot, -1, g.h + 2);
    svc.gates.push({ key: g.key, name: g.name, x: cx, z: cz, rotY: Math.atan2(g.d[0], g.d[1]), w: g.w, len: g.len, outer: g.outer, inner: g.inner });
  });
  /** a portal block: panel -hw .. hw x 0 .. H with the opening w x h, from depth zb to the front zf */
  const block = (mat, hw, H, w, h, zb, zf, uvs = 3) => G.solid(P, mat, archOutline(hw, H, w, h), zb, zf - zb, uvs);
  const tuscan = (mat, x, z, y0, y1, R) => { P.box(mat, x - R * 1.25, x + R * 1.25, y0, y0 + R * 0.5, z - R * 1.25, z + R * 1.25, 'b', 1); P.col(mat, x, z, y0 + R * 0.5, y1 - R * 0.8, R, R * 0.86, 12, false); P.col(mat, x, z, y1 - R * 0.8, y1 - R * 0.4, R * 0.9, R * 1.2, 12, false); P.box(mat, x - R * 1.3, x + R * 1.3, y1 - R * 0.4, y1, z - R * 1.3, z + R * 1.3, 'b', 1); };
  const sign = (key, txt, w, h, fg, bg, font = 'serif') => ctx.mat.toon('#ffffff', { map: M.tex(512, Math.max(32, Math.round(512 * h / w)), 'sign-' + key, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = fg; g.font = `bold ${Math.round(ch * 0.66)}px ${ctx.tex.FONTS ? ctx.tex.FONTS[font] || font : font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, cw / 2, ch * 0.54, cw * 0.94); }), name: 'lmFort-sign-' + key, polygonOffset: -2 });

  // ================================================================== PETROVSKY GATE
  stage('petrovsky', () => {
    const g = gate('petrovsky'), st = M.col('#e6dcb8', 'pudost'), stS = M.col('#cfc49c', 'pudostS');
    tunnel(g, M.innerFlat);
    outer(g, () => {
      const hw = g.hwO, H = 10.6, zf = 0.9;
      block(st, hw, H, g.w, g.h, -1.6, zf);
      // rustication: horizontal joints as thin shadow bands, rusticated pilasters
      for (let y = 0.9; y < H - 0.8; y += 0.62) for (const [x0, x1] of [[-hw, -g.w / 2 - 0.5], [g.w / 2 + 0.5, hw]]) P.box(stS, x0, x1, y, y + 0.05, zf, zf + 0.02, 'bk', 1);
      for (const x of [-7.95, -3.0, 3.0, 7.95]) { P.box(st, x - 0.6, x + 0.6, 0, H - 0.7, zf, zf + 0.34, 'bk', 2); for (let y = 0.5; y < H - 1.2; y += 1.24) P.box(stS, x - 0.66, x + 0.66, y, y + 0.56, zf + 0.34, zf + 0.42, 'bk', 1); P.box(st, x - 0.75, x + 0.75, H - 1.3, H - 0.7, zf, zf + 0.5, 'bk', 1); }
      // archivolt and keystone
      G.frameRing(P, st, G.archPts(0, 0, g.w + 0.9, g.h + 0.45, 12), G.archPts(0, 0, g.w, g.h, 12), zf, 0.22, 1);
      P.box(stS, -0.4, 0.4, g.h - 0.25, g.h + 1.0, zf, zf + 0.42, 'bk', 1);
      // niches with the two statues (Bravery on the right, Prudence on the left)
      const mk = figureMats(ctx).keys('bronze', 'bronze');
      const fig = (seed, sex) => cached('lmFort-gate-' + seed, () => human({ detail: 0.34, body: { sex, bulk: 1.0 }, pose: { spine: [0.02, seed ? 0.2 : -0.2, 0], head: [0.05, seed ? -0.3 : 0.3, 0], arms: { R: { hand: [-0.34, 1.12, 0.22], grip: 'hold' }, L: { hand: [0.3, 0.86, 0.12], grip: 'relaxed' } } }, outfit: { torso: 'robe', hem: 0.95, flare: 0.4, folds: 0.07, sleeves: 'short', cape: 'mantle' }, face: { age: 0.3, hair: 'curly', seed: 3 + seed } }));
      for (const s of [-1, 1]) {
        G.solid(P, M.col('#8d8468', 'niche'), G.archPts(s * 5.45, 2.5, 1.35, 3.3, 8), zf - 0.02, 0.03, 1);
        G.frameRing(P, st, G.archPts(s * 5.45, 2.4, 1.75, 3.6, 8), G.archPts(s * 5.45, 2.5, 1.35, 3.3, 8), zf, 0.18, 1);
        P.box(st, s * 5.45 - 0.8, s * 5.45 + 0.8, 2.15, 2.5, zf, zf + 0.5, 'bk', 1);
        fig(s > 0 ? 1 : 0, 'f').place(P, mk, s * 5.45, 2.5, zf + 0.22, 0, 1.35);
      }
      // entablature
      P.box(st, -hw - 0.1, hw + 0.1, H - 0.7, H - 0.25, zf, zf + 0.45, 'bk', 1); P.box(st, -hw - 0.35, hw + 0.35, H - 0.25, H + 0.15, zf - 2.4, zf + 0.8, 'b', 1);
      // the lead double-headed eagle with three gilded crowns over the arch
      eagle(P, M, 0, 8.25, zf + 0.34, 1.0);
      // attic: the panel block, the wooden relief, the curved pediment, volutes on the shoulders
      const ya = H + 0.15, ha = 4.4, aw = 4.6;
      P.box(st, -aw, aw, ya, ya + ha, zf - 1.5, zf, 'b', 2);
      for (const x of [-aw + 0.45, aw - 0.45]) P.box(st, x - 0.45, x + 0.45, ya, ya + ha - 0.3, zf, zf + 0.25, 'bk', 1);
      const relief = M.tex(512, 256, 'simon', (c, w, h) => {
        c.fillStyle = '#4a3628'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a4e3a'; c.fillRect(8, 8, w - 16, h - 16);
        c.fillStyle = '#56402f'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(60 + i * 66, 50 + (i % 2) * 14, 44, 22, 0, 0, 6.3); c.fill(); }                               // clouds
        c.fillStyle = '#7a5c44'; c.fillRect(w / 2 - 34, 96, 68, 110); c.fillRect(w / 2 - 12, 62, 24, 40); c.beginPath(); c.moveTo(w / 2 - 12, 62); c.lineTo(w / 2, 34); c.lineTo(w / 2 + 12, 62); c.fill();   // the fortress church
        c.fillStyle = '#8a6a50'; for (let i = 0; i < 12; i++) { const x = 40 + i * 38 + (i > 5 ? 24 : 0), y = 150 + (i % 3) * 8; c.beginPath(); c.ellipse(x, y + 34, 15, 36, 0, 0, 6.3); c.fill(); c.beginPath(); c.arc(x, y - 10, 11, 0, 6.3); c.fill(); }   // the crowd
        c.fillStyle = '#84644a'; c.beginPath(); c.ellipse(w / 2 + 6, 66, 12, 26, 0.5, 0, 6.3); c.fill();                                                                                    // the falling magus
      });
      const rm = ctx.mat.toon('#ffffff', { map: relief, name: 'lmFort-simon', polygonOffset: -1 });
      P.quad(rm, [-3.3, ya + 0.55, zf + 0.03], [3.3, ya + 0.55, zf + 0.03], [3.3, ya + 3.8, zf + 0.03], [-3.3, ya + 3.8, zf + 0.03], [0, 0, 1]);
      G.frameRing(P, st, [[-3.6, ya + 0.3], [3.6, ya + 0.3], [3.6, ya + 4.05], [-3.6, ya + 4.05]], [[-3.3, ya + 0.55], [3.3, ya + 0.55], [3.3, ya + 3.8], [-3.3, ya + 3.8]], zf, 0.16, 1);
      P.box(st, -aw - 0.3, aw + 0.3, ya + ha, ya + ha + 0.4, zf - 1.7, zf + 0.45, 'b', 1);
      G.solid(P, st, segPts(aw + 0.3, ya + ha + 0.4, 1.9), zf - 1.5, 1.75, 2);
      G.solid(P, M.col('#8d8468', 'niche'), segPts(aw - 0.9, ya + ha + 0.62, 1.2), zf + 0.25, 0.04, 1);
      G.ball(P, stS, 0, ya + ha + 1.15, zf + 0.34, 0.42, 8);                                                    // the relief of Sabaoth (a head in clouds)
      for (const s of [-1, 1]) {                                                                               // volutes sweeping down to the side parts
        const pts = [[s * aw, ya], [s * (hw - 0.3), ya], [s * (hw - 0.3), ya + 0.9]]; for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push([s * (hw - 0.3 - (hw - 0.3 - aw) * Math.sin(t * Math.PI / 2)), ya + 0.9 + (ha - 1.3) * (1 - Math.cos(t * Math.PI / 2))]); } pts.push([s * aw, ya + ha - 0.4]);
        G.solid(P, st, s > 0 ? pts : pts.reverse(), zf - 1.2, 1.2, 2);
        const tg = new THREE.TorusGeometry(0.6, 0.16, 5, 12, Math.PI * 1.6); P.geo(stS, tg, s * (hw - 1.2), ya + 1.0, zf + 0.06, 0, 0, s > 0 ? -0.5 : Math.PI + 0.5 - Math.PI * 1.6); tg.dispose();
      }
    });
    inner(g, () => {
      const hw = g.hwI, H = 10.4;
      block(M.innerFlat, hw, H, g.w, g.h, -1.2, 0.35);
      G.frameRing(P, M.white, G.archPts(0, 0, g.w + 0.8, g.h + 0.4, 12), G.archPts(0, 0, g.w, g.h, 12), 0.35, 0.14, 1);
      P.box(M.white, -hw - 0.15, hw + 0.15, H - 0.6, H, 0, 0.55, 'b', 1); G.solid(P, M.innerFlat, segPts(hw * 0.62, H, 1.5), -1.0, 1.3, 2); G.frameRing(P, M.white, segPts(hw * 0.62 + 0.2, H, 1.72), segPts(hw * 0.62 - 0.1, H + 0.2, 1.3), 0.3, 0.12, 1);
      for (const s of [-1, 1]) { P.box(M.chimney, s * (hw - 0.9) - 0.5, s * (hw - 0.9) + 0.5, H, H + 2.2, -1.0, 0, 'b', 1); P.box(M.white, s * (hw - 0.9) - 0.6, s * (hw - 0.9) + 0.6, H + 2.2, H + 2.4, -1.1, 0.1, '', 1); }
    });
    svc.monuments.push({ id: 'petrovsky-gate', name: 'Петровские ворота', x: g.outer[0], z: g.outer[1], h: 16.5 });
    svc.photoSpots.push({ x: g.outer[0] - g.d[0] * 24, z: g.outer[1] - g.d[1] * 24, yaw: ctx.L.yawToward(g.outer[0] - g.d[0] * 24, g.outer[1] - g.d[1] * 24, g.outer[0], g.outer[1]), pitch: 14, name: 'Петровские ворота' });
  });

  // ================================================================== NEVSKY GATE + COMMANDANT PIER
  stage('nevsky', () => {
    const g = gate('nevsky'), st = M.stoneGrey, stS = M.stoneGreyShade;
    tunnel(g, M.white);
    outer(g, () => {
      const hw = g.hwO, zf = 0.5, zc = 2.3;                                    // wall panel at zf, the columns stand at zc
      block(M.graniteFlat, hw, 12.2, g.w, g.h, -1.6, zf);
      G.frameRing(P, st, G.archPts(0, 0, g.w + 1.3, g.h + 0.65, 12), G.archPts(0, 0, g.w, g.h, 12), zf, 0.3, 1);
      P.box(st, -hw, hw, 0, 1.0, zf, zc + 0.75, 'b', 2);                        // the socle
      for (const s of [-1, 1]) for (const x of [3.05, 5.05]) {
        tuscan(st, s * x, zc, 1.0, 7.9, 0.46);
        for (const y of [2.2, 4.0, 5.8]) { P.box(stS, s * x - 0.6, s * x + 0.6, y, y + 0.95, zc - 0.6, zc + 0.6, '', 1); const pg = new THREE.ConeGeometry(0.62, 0.26, 4); P.geo(st, pg, s * x, y + 0.48, zc + 0.6, Math.PI / 2, Math.PI / 4, 0); pg.dispose(); }
        P.box(st, s * x - 0.5, s * x + 0.5, 1.0, 7.9, zf, zf + 0.16, 'bk', 1);                                 // pilaster behind the column
      }
      P.box(st, -hw, hw, 7.9, 9.1, zf, zc + 0.6, 'b', 2); P.box(stS, -hw - 0.25, hw + 0.25, 9.1, 9.45, zf, zc + 0.9, '', 1);
      const sm = sign('nevsky', 'НЕВСКIЯ ВОРОТА 1787', 5.6, 0.5, '#3a3a36', '#b9b6ae');
      P.quad(sm, [-2.8, 8.25, zc + 0.62], [2.8, 8.25, zc + 0.62], [2.8, 8.75, zc + 0.62], [-2.8, 8.75, zc + 0.62], [0, 0, 1]);
      // pediment with the anchor and crossed palm branches, a bomb with a flame on each corner
      G.solid(P, st, [[-hw - 0.25, 9.45], [hw + 0.25, 9.45], [0, 12.0]], zf, zc + 0.9 - zf, 2);
      G.solid(P, stS, [[-hw + 1.0, 9.75], [hw - 1.0, 9.75], [0, 11.5]], zc + 0.9, 0.04, 1);
      P.box(M.bronze, -0.06, 0.06, 9.95, 11.0, zc + 0.94, zc + 1.02, '', 1); P.box(M.bronze, -0.4, 0.4, 10.85, 10.95, zc + 0.94, zc + 1.02, '', 1);
      { const tg = new THREE.TorusGeometry(0.42, 0.06, 4, 10, Math.PI); P.geo(M.bronze, tg, 0, 10.35, zc + 0.98, 0, 0, Math.PI); tg.dispose(); }
      for (const s of [-1, 1]) { P.geo(M.bronze, new THREE.BoxGeometry(1.5, 0.07, 0.05), s * 0.75, 10.25, zc + 0.98, 0, 0, s * 0.42); G.ball(P, M.graniteDark, s * (hw - 0.3), 9.95, zc + 0.3, 0.42, 8); P.col(M.goldFlat, s * (hw - 0.3), zc + 0.3, 10.3, 10.85, 0.16, 0.02, 6, false); }
      // barred windows of the curtain beside the portico are in the wall texture
    });
    inner(g, () => {
      const hw = g.hwI, H = 8.2, gr = M.col('#3f8a5a', 'nevGreen');
      block(M.white, hw, H, g.w, g.h, -1.2, 0.4);
      G.frameRing(P, gr, G.archPts(0, 0, g.w + 0.9, g.h + 0.45, 12), G.archPts(0, 0, g.w + 0.3, g.h + 0.15, 12), 0.4, 0.06, 1);
      for (const s of [-1, 1]) for (const x of [2.9, 4.3]) { P.box(M.white, s * x - 0.4, s * x + 0.4, 0.5, H - 0.8, 0.4, 0.62, 'bk', 1); P.box(gr, s * x - 0.3, s * x + 0.3, 0.9, H - 1.2, 0.62, 0.64, 'bk', 1); }
      P.box(M.white, -hw - 0.2, hw + 0.2, H - 0.8, H, 0.2, 0.8, 'b', 1); G.solid(P, M.white, [[-hw - 0.2, H], [hw + 0.2, H], [0, H + 2.3]], -0.8, 1.5, 2); G.solid(P, gr, [[-hw + 0.9, H + 0.25], [hw - 0.9, H + 0.25], [0, H + 1.85]], 0.7, 0.03, 1);
      const sm = sign('nev1787', '1787', 1.6, 0.5, '#c9a24b', '#3f8a5a'); P.quad(sm, [-0.8, H - 0.68, 0.82], [0.8, H - 0.68, 0.82], [0.8, H - 0.18, 0.82], [-0.8, H - 0.18, 0.82], [0, 0, 1]);
    });
    // ---- the Commandant pier (outer frame; z0 = where the passage axis reaches the edge of the banquette = the island ring)
    outer(g, () => {
      const z0 = axisToRing(g), zb = z0 + 20, zp = zb + 12, bw = 3.0, pw = 8.0, gm = M.graniteFlat, gl = M.graniteLit, wy = -3.4;
      // bridge deck on three low arches
      P.box(M.slab, -bw, bw, -0.25, 0.05, z0 - 0.4, zb, '', 2);
      for (const s of [-1, 1]) {
        const side = [[z0 - 0.4, -4.4], [zb, -4.4], [zb, 0.05], [z0 - 0.4, 0.05]], holes = [];
        for (let k = 0; k < 3; k++) { const c = z0 + 3.3 + k * 6.6, hp = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; hp.push([c - Math.cos(a) * 2.6, -3.3 + Math.sin(a) * 2.5]); } hp.unshift([c - 2.6, -4.3]); hp.push([c + 2.6, -4.3]); holes.push(hp); }
        P.push(s * bw, 0, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2);
        P.face(gm, G.shapeOf(side.map((q) => [s > 0 ? -q[0] : q[0], q[1]]), holes.map((h) => h.map((q) => [s > 0 ? -q[0] : q[0], q[1]]))), 0, 2, 8);
        P.pop();
        P.box(gl, s * bw - 0.25, s * bw + 0.25, 0.05, 0.95, z0 + 0.4, zb, 'b', 2);                              // parapet
      }
      for (let k = 0; k <= 3; k++) { const c = z0 + k * 6.6; P.box(gm, -bw, bw, -4.4, -0.6, c - 0.55, c + 0.55, 'tb', 2); }      // piers between the arches
      for (let k = 0; k < 3; k++) { const c = z0 + 3.3 + k * 6.6; for (let i = 0; i < 6; i++) { const a0 = Math.PI * i / 6, a1 = Math.PI * (i + 1) / 6; P.quad(gm, [-bw, -3.3 + Math.sin(a0) * 2.5, c - Math.cos(a0) * 2.6], [bw, -3.3 + Math.sin(a0) * 2.5, c - Math.cos(a0) * 2.6], [bw, -3.3 + Math.sin(a1) * 2.5, c - Math.cos(a1) * 2.6], [-bw, -3.3 + Math.sin(a1) * 2.5, c - Math.cos(a1) * 2.6], [0, -1, 0]); } }
      // landing: a platform with parapets, the front stair and two side stairs going down to the water
      P.box(gm, -pw, pw, -4.4, 0.05, zb, zp - 4.2, 'b', 2); P.quad(M.slab, [-pw, 0.06, zp - 4.2], [pw, 0.06, zp - 4.2], [pw, 0.06, zb], [-pw, 0.06, zb], [0, 1, 0], [[-pw / 2, 0], [pw / 2, 0], [pw / 2, 4], [-pw / 2, 4]]);
      for (const s of [-1, 1]) { P.box(gl, s * pw - 0.3, s * pw + 0.3, 0.05, 0.95, zb + 4.6, zp - 4.2, 'b', 2); P.box(gl, s * (bw + 0.25), s * pw + s * 0.3, 0.05, 0.95, zb - 0.3, zb + 0.3, 'b', 2); G.ball(P, gl, s * pw, 1.3, zp - 4.2, 0.42, 8); }
      const ns = 10;
      for (let i = 0; i < ns; i++) { const y = 0.05 - (i + 1) * 0.34; P.box(gm, -pw + 1.2, pw - 1.2, y - 0.6, y, zp - 4.2 + i * 0.42, zp - 4.2 + (i + 1) * 0.42, 'b', 2); for (const s of [-1, 1]) P.box(gm, s * (pw + i * 0.42), s * (pw + (i + 1) * 0.42), y - 0.6, y, zb + 0.4, zb + 4.4, 'b', 2); }
      for (const [x, z] of [[-pw - 6, zp + 2], [pw + 6, zp + 2], [0, zp + 5], [-pw - 9, zb - 6], [pw + 9, zb - 6]]) { for (const [dx, dz] of [[0, 0], [0.5, 0.2], [0.2, 0.5]]) P.col(M.timberDark, x + dx, z + dz, -4.4, wy + 1.9, 0.2, 0.2, 6, true); P.col(M.iron, x + 0.25, z + 0.25, wy + 1.3, wy + 1.45, 0.52, 0.52, 8, false); }
      // physics (world frame): deck + platform walk boxes, three stairs, parapet colliders, the outer edges
      const W = (lx, lz) => [g.outer[0] + g.t[0] * lx - g.d[0] * lz, g.outer[1] + g.t[1] * lx - g.d[1] * lz], rot = Math.atan2(-g.d[0], -g.d[1]);
      const wb = (lx, lz, w, d, top) => { const p = W(lx, lz); ph.addWalkBox(p[0], p[1], w, d, rot, top, -8); };
      const cb = (lx, lz, w, d, y0, y1) => { const p = W(lx, lz); ph.addBox(p[0], p[1], w, d, rot, y0, y1); };
      wb(0, (z0 + zb) / 2 - 0.2, 2 * bw, zb - z0 + 0.8, 0.05); wb(0, (zb + zp - 4.2) / 2, 2 * pw, zp - 4.2 - zb, 0.06);
      { const p = W(0, zp - 4.2 + ns * 0.21); ph.addStairs(p[0], p[1], 2 * pw - 2.4, ns * 0.42, rot, 0.05, 0.05 - ns * 0.34, ns); }
      for (const s of [-1, 1]) { const p = W(s * (pw + ns * 0.21), zb + 2.4); ph.addStairs(p[0], p[1], 4.0, ns * 0.42, rot + (s > 0 ? Math.PI / 2 : -Math.PI / 2), 0.05, 0.05 - ns * 0.34, ns); cb(s * bw, (z0 + zb) / 2, 0.5, zb - z0, -1, 1.2); cb(s * pw, (zb + 4.6 + zp - 4.2) / 2, 0.6, zp - 4.2 - zb - 4.6, -1, 1.2); cb(s * (bw + pw) / 2, zb, pw - bw, 0.6, -1, 1.2); cb(s * (pw + ns * 0.42 + 0.3), zb + 2.4, 0.5, 5.6, -8, 1); }
      cb(0, zp + 0.4, 2 * pw + 2, 0.5, -8, 1);
      svc.pier = { x: W(0, zb + 4)[0], z: W(0, zb + 4)[1], rot, z0, zb, zp, pw, steps: ns * 0.42 };
      svc.crowd.push({ x: W(0, zb + 4)[0], z: W(0, zb + 4)[1], r: 5, n: 8, kind: 'pier' });
    });
    svc.monuments.push({ id: 'nevsky-gate', name: 'Невские ворота и Комендантская пристань', x: g.outer[0], z: g.outer[1], h: 12 });
  });

  // ================================================================== IOANNOVSKY GATE (white rusticated, in the ravelin)
  stage('ioannovsky', () => {
    const g = gate('ioannovsky'), st = M.white, stS = M.whiteShade;
    tunnel(g, M.white);
    outer(g, () => {
      const hw = g.hwO, H = 8.0, zf = 0.7;
      block(st, hw, H, g.w, g.h, -1.4, zf);
      for (let y = 0.7; y < H - 0.5; y += 0.66) for (const [x0, x1] of [[-hw, -g.w / 2 - 0.1], [g.w / 2 + 0.1, hw]]) P.box(stS, x0, x1, y, y + 0.06, zf, zf + 0.02, 'bk', 1);
      for (const s of [-1, 1]) for (let y = 0; y < H - 0.6; y += 1.32) { P.box(st, s * (hw - 0.75) - 0.75, s * (hw - 0.75) + 0.75, y, y + 0.62, zf, zf + 0.22, 'bk', 1); P.box(st, s * (g.w / 2 + 0.75) - 0.7, s * (g.w / 2 + 0.75) + 0.7, y, y + 0.62, zf, zf + 0.22, 'bk', 1); }
      G.frameRing(P, st, G.archPts(0, 0, g.w + 1.2, g.h + 0.6, 12), G.archPts(0, 0, g.w, g.h, 12), zf, 0.24, 1);
      P.box(st, -hw - 0.2, hw + 0.2, H - 0.75, H, zf, zf + 0.5, 'b', 1);
      const sm = sign('ioann', '1740 ГОДА', 3.0, 0.42, '#5a5a56', '#efece2'); P.quad(sm, [-1.5, H - 0.62, zf + 0.52], [1.5, H - 0.62, zf + 0.52], [1.5, H - 0.2, zf + 0.52], [-1.5, H - 0.2, zf + 0.52], [0, 0, 1]);
      G.solid(P, st, [[-hw - 0.2, H], [hw + 0.2, H], [0, H + 2.6]], -1.2, zf + 1.7, 2);
      G.solid(P, M.col('#4b6a58', 'trophy'), [[-hw + 1.6, H + 0.3], [hw - 1.6, H + 0.3], [0, H + 1.9]], zf + 0.5, 0.04, 1);
      P.col(M.goldFlat, 0, zf + 0.62, H + 1.0, H + 1.45, 0.32, 0.26, 8, true); G.ball(P, M.goldFlat, 0, H + 1.6, zf + 0.62, 0.13, 6);
      for (const s of [-1, 1]) { P.geo(M.col('#6f8a78', 'trophy2'), new THREE.BoxGeometry(2.4, 0.09, 0.06), s * 1.3, H + 0.75, zf + 0.58, 0, 0, s * 0.42); P.geo(M.col('#6f8a78', 'trophy2'), new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8), s * 2.4, H + 0.55, zf + 0.6, Math.PI / 2, 0, 0); }
    });
    inner(g, () => {
      const hw = g.hwI, H = 6.4;
      block(st, hw, H, g.w, g.h - 0.2, -1.0, 0.35);
      for (let y = 0.6; y < H - 0.4; y += 0.66) for (const [x0, x1] of [[-hw, -g.w / 2 - 0.1], [g.w / 2 + 0.1, hw]]) P.box(stS, x0, x1, y, y + 0.06, 0.35, 0.37, 'bk', 1);
      P.box(st, -hw - 0.15, hw + 0.15, H - 0.5, H, 0, 0.6, 'b', 1);
      for (const s of [-1, 1]) { const rg = new THREE.RingGeometry(0.2, 0.42, 10); P.geo(stS, rg, s * (hw - 0.7), H - 1.2, 0.37); rg.dispose(); }
    });
    svc.monuments.push({ id: 'ioannovsky-gate', name: 'Иоанновские ворота', x: g.outer[0], z: g.outer[1], h: 10.6 });
  });

  // ================================================================== VASILIEVSKY, KRONVERKSKY, NIKOLSKY
  stage('vasilievsky', () => {
    const g = gate('vasilievsky'), ye = M.col('#e7c65a', 'vasYellow'), yS = M.col('#cfae48', 'vasYellowS');
    tunnel(g, M.plasterFlat);
    outer(g, () => {
      const hw = g.hwO, H = g.hO + 2.2, zf = 0.6;
      block(ye, hw, H - 2.2, g.w, g.h, -1.5, zf);
      for (const s of [-1, 1]) for (const x of [2.7, 3.9]) P.box(ye, s * x - 0.36, s * x + 0.36, 0.4, H - 2.9, zf, zf + 0.22, 'bk', 1);
      P.box(yS, -hw - 0.15, hw + 0.15, H - 2.9, H - 2.2, zf - 0.2, zf + 0.5, 'b', 1);
      G.solid(P, ye, [[-hw - 0.15, H - 2.2], [hw + 0.15, H - 2.2], [0, H]], -1.3, zf + 1.8, 2);
      G.frameRing(P, yS, G.archPts(0, 0, g.w + 0.7, g.h + 0.35, 10), G.archPts(0, 0, g.w, g.h, 10), zf, 0.12, 1);
    });
    inner(g, () => { const hw = g.hwI, H = g.hI; block(ye, hw, H, g.w, g.h, -1.0, 0.3); P.box(yS, -hw - 0.1, hw + 0.1, H - 0.5, H, 0, 0.5, 'b', 1); G.frameRing(P, M.white, G.archPts(0, 0, g.w + 0.7, g.h + 0.35, 10), G.archPts(0, 0, g.w, g.h, 10), 0.3, 0.1, 1); });
  });
  stage('kronverksky', () => {
    const g = gate('kronverksky');
    tunnel(g, M.innerFlat);
    outer(g, () => { const hw = g.hwO, H = g.hO; block(M.white, hw, H, g.w, g.h, -1.5, 0.45); G.frameRing(P, M.whiteShade, G.archPts(0, 0, g.w + 1.0, g.h + 0.5, 10), G.archPts(0, 0, g.w, g.h, 10), 0.45, 0.16, 1); P.box(M.whiteShade, -0.4, 0.4, g.h - 0.2, g.h + 1.1, 0.45, 0.8, 'bk', 1); P.box(M.white, -hw - 0.2, hw + 0.2, H - 0.6, H, 0.2, 0.8, 'b', 1); });
    inner(g, () => { const hw = g.hwI, H = g.hI; block(M.innerFlat, hw, H, g.w, g.h, -1.0, 0.3); G.frameRing(P, M.white, G.archPts(0, 0, g.w + 0.8, g.h + 0.4, 10), G.archPts(0, 0, g.w, g.h, 10), 0.3, 0.12, 1); P.box(M.white, -hw - 0.1, hw + 0.1, H - 0.45, H, 0, 0.5, 'b', 1); });
  });
  stage('nikolsky', () => {
    const g = gate('nikolsky'), oc = M.col('#e3b25c', 'nikOchre'), oS = M.col('#c99a48', 'nikOchreS');
    tunnel(g, M.col('#e9dfc4', 'nikVault'));
    const front = (hw, zf) => {
      const H = 10.4;
      block(oc, hw - 2.6, H, g.w, g.h, -1.5, zf);
      G.frameRing(P, oS, G.archPts(0, 0, g.w + 1.4, g.h + 0.7, 12), G.archPts(0, 0, g.w, g.h, 12), zf, 0.2, 1);
      for (let i = 0; i < 9; i++) P.box(oS, -hw + 2.9 + i * (2 * hw - 5.8) / 9 + 0.1, -hw + 2.9 + (i + 0.55) * (2 * hw - 5.8) / 9, H - 1.05, H - 0.6, zf, zf + 0.3, 'bk', 1);           // the machicolation-like frieze
      P.box(oc, -hw + 2.4, hw - 2.4, H - 0.6, H, zf - 0.1, zf + 0.45, 'b', 1);
      for (const s of [-1, 1]) {                                                                                  // the two square towers
        const x = s * (hw - 1.3);
        P.box(oc, x - 1.3, x + 1.3, 0, 12.6, -1.6, zf + 0.5, 'b', 3); P.box(M.limestone, x - 1.4, x + 1.4, 0, 1.3, zf + 0.5, zf + 0.6, 'bk', 2);
        for (let y = 2.0; y < 11.2; y += 1.6) for (const sx of [-1, 1]) P.box(oS, x + sx * 1.3 - 0.3, x + sx * 1.3 + 0.3, y, y + 0.8, zf + 0.5, zf + 0.58, 'bk', 1);                  // quoins
        P.box(oS, x - 1.5, x + 1.5, 11.5, 12.0, -1.8, zf + 0.7, 'b', 1); P.box(oc, x - 1.65, x + 1.65, 12.0, 12.6, -1.95, zf + 0.85, 'b', 1); P.box(M.roofGreen, x - 1.5, x + 1.5, 12.6, 12.8, -1.8, zf + 0.7, 'b', 1);
      }
    };
    outer(g, () => front(g.hwO, 0.7));
    inner(g, () => front(g.hwI, 0.5));
  });
  void WALL; void RAV;
  if (errs.length) throw new Error(errs.join('\n'));
}

/** the lead double-headed eagle (black, three gilded crowns, sceptre and orb): centre (x, y), on the plane z, scale s (wing span 2.9 s) */
function eagle(P, M, x, y, z, s = 1) {
  const sph = new THREE.SphereGeometry(1, 10, 8), E = (mat, ex, ey, ez, rx, ry, rz, rot = 0) => P.geo(mat, sph, x + ex * s, y + ey * s, z + ez * s, 0, 0, rot, rx * s, ry * s, rz * s);
  E(M.lead, 0, 0, 0.1, 0.42, 0.62, 0.24);                                                                         // body
  E(M.goldFlat, 0, 0.02, 0.33, 0.2, 0.26, 0.05);                                                                   // the shield on the breast
  for (const sd of [-1, 1]) {
    E(M.lead, sd * 0.2, 0.72, 0.12, 0.12, 0.3, 0.12, -sd * 0.35); E(M.lead, sd * 0.36, 1.0, 0.14, 0.16, 0.15, 0.14);                 // neck, head
    P.geo(M.goldFlat, new THREE.ConeGeometry(0.06 * s, 0.24 * s, 4), x + sd * 0.56 * s, y + 0.99 * s, z + 0.16 * s, 0, 0, -sd * Math.PI / 2);   // beak
    P.col(M.goldFlat, x + sd * 0.36 * s, z + 0.14 * s, y + 1.14 * s, y + 1.3 * s, 0.1 * s, 0.14 * s, 6, true);                         // crown
    for (let k = 0; k < 5; k++) { const a = 0.25 + k * 0.3, len = (1.5 - k * 0.14) * s, cx = x + sd * (0.35 * s + Math.cos(a) * len / 2), cy = y + 0.2 * s + Math.sin(a) * len / 2 * 0.9; P.geo(M.lead, sph, cx, cy, z + 0.08 * s, 0, 0, sd * a, len / 2, 0.11 * s, 0.06 * s); }   // wing feathers
    E(M.lead, sd * 0.3, -0.72, 0.1, 0.09, 0.3, 0.09, sd * 0.4);                                                    // legs
    P.col(M.goldFlat, x + sd * 0.52 * s, z + 0.2 * s, y - 1.25 * s, y - 0.45 * s, 0.035 * s, 0.035 * s, 5, false);  // sceptre / orb staff
  }
  E(M.goldFlat, 0.52, -0.42, 0.2, 0.1, 0.1, 0.1);
  P.col(M.goldFlat, x, z + 0.14 * s, y + 1.32 * s, y + 1.56 * s, 0.14 * s, 0.2 * s, 6, true);                      // the big middle crown
  for (let k = 0; k < 3; k++) E(M.lead, (k - 1) * 0.16, -0.78 - Math.abs(k - 1) * 0.02, 0.1, 0.09, 0.3, 0.06);     // tail
  sph.dispose();
}
