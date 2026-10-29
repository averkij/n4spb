// landmarksMining/wings.js - everything of the Mining University main building r2902646 (OSM relation: outer ring of 34 vertices + the museum courtyard hole) except the portico block (portico.js):
// the walls of every footprint edge from bay textures (wing / link / east-range / west-range / yard styles, docs/research/mining.md sections 6, 7: 11 bays per wing front, plinth 1.6 m, rusticated plaster,
// hoods), mitred cornices, the green copper roof (a low hip with a flat top; the sides that meet the central block are open), the two relief friezes of the links, the 12 bronze plaques with their real
// texts (reserved through ctx.services.labels), the church risalit with its gable, thermal window and cross, the church door, the closed MUSEUM door on the 22nd line front (2026-10-09), chimneys, and the long REAR RANGE w116609897 (4 storeys, flat roof, sand grey).
// Every ring edge gets a wall or a documented reason: the open front line 17-18 is the portico colonnade (portico.js draws its end walls, back wall and colliders).  Eave 11.0 for the whole complex.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, frameOf, band, localOnEdge } from './kit.js';
import { shellWalls, shellCornice, edgeColliders } from './shell.js';
import { plate } from './plaques.js';
import { inRing } from './surfaces.js';
import { P as FP, HT, RING_P } from './frame.js';

const EAVE = HT.wing;

/** classify the outer-ring edge i -> i+1 of r2902646 (dossier 2.3 table) */
function styleOf(i) {
  if (i === 16 || i === 17 || i === 18) return 'skip';                      // gallery side wall (16-17), the open colonnade line (17-18), gallery side wall (18-19): portico.js
  if (i === 13 || i === 14 || i === 21 || i === 22 || i === 20) return 'wing';
  if (i === 15 || i === 19) return 'link';
  if (i >= 3 && i <= 12) return 'east';
  if (i === 23) return 'west';
  return 'yard';
}
const PLAQUES = [
  [-41.0, -11.1, 'Бауман', 'Здесь с 1895 по 1923 год жил и работал выдающийся деятель горной науки, основоположник отечественной маркшейдерской школы и разведочной геофизики профессор Владимир Иванович Бауман'],
  [-48.1, -13.6, 'Обручев', 'Здесь с 1881 по 1886 г.г. учился геолог, географ и знаменитый путешественник, Герой Социалистического Труда академик Владимир Афанасьевич Обручев'],
  [-52.1, -14.9, 'Соболевский', 'Здесь с 1824 по 1841 гг. работал крупнейший металлург, член-корреспондент Академии наук Пётр Григорьевич Соболевский'],
  [-59.4, -17.4, 'Наливкин', 'Здесь с 1906 по 1982 гг. учился и работал выдающийся советский геолог, Герой Социалистического Труда, лауреат Ленинской премии и Государственной премии СССР академик Дмитрий Васильевич Наливкин'],
  [67.1, -23.0, 'Герман', 'Здесь с 1903 по 1953 гг. жил и работал выдающийся учёный, один из создателей советской школы горной механики академик Александр Петрович Герман'],
  [60.2, -19.9, 'Бокий', 'Здесь с 1907 по 1927 гг. жил и работал один из основоположников горной науки профессор Борис Иванович Бокий'],
  [53.0, -16.8, 'Карпинский', 'Здесь учился, жил и работал с 1858 по 1896 год выдающийся геолог и палеонтолог, профессор Горного института, создатель отечественной геологической школы, первый президент советской Академии наук, академик Александр Петрович Карпинский'],
  [49.5, -15.2, 'Скочинский', 'Здесь с 1895 по 1930 гг. учился и работал крупнейший учёный, основоположник рудничной аэрологии академик Александр Александрович Скочинский'],
  [42.3, -12.1, 'Курнаков', 'Здесь с 1882 по 1941 гг. жил и работал выдающийся советский химик академик Николай Семёнович Курнаков'],
  [38.9, -10.6, 'Фёдоров', 'Здесь с 1896 по 1919 гг. жил и работал гениальный русский учёный, основоположник современной науки о кристаллах академик Евграф Степанович Фёдоров'],
  [93.5, -75.3, 'Дивизия', 'В этом здании с 30 июня по 5 августа 1941 года формировалась 2-я Гвардейская дивизия Народного ополчения, участвовавшая в обороне Ленинграда'],
];
const wrap = (text, n = 20) => { const out = []; let cur = ''; for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };

/** offset a ring by per-edge distances (positive = outward): the mitre of consecutive offset lines.  Returns [[x, z]..]. nrm = outward unit normals per edge i (a_i -> a_{i+1}) */
function offsetRing(ring, nrm, dist) {
  const n = ring.length, out = [];
  for (let i = 0; i < n; i++) {
    const pe = (i + n - 1) % n, n1 = nrm[pe], n2 = nrm[i], d1 = dist[pe], d2 = dist[i], dot = n1[0] * n2[0] + n1[1] * n2[1], p = ring[i];
    if (dot > 0.9995 || 1 - dot * dot < 1e-4) { out.push([p[0] + n2[0] * d2, p[1] + n2[1] * d2]); continue; }
    const det = 1 - dot * dot, s = (d1 - d2 * dot) / det, t = (d2 - d1 * dot) / det;
    let qx = n1[0] * s + n2[0] * t, qz = n1[1] * s + n2[1] * t;
    const lim = 3 * Math.max(Math.abs(d1), Math.abs(d2)) + 0.01, l = Math.hypot(qx, qz);
    if (l > lim) { qx *= lim / l; qz *= lim / l; }
    out.push([p[0] + qx, p[1] + qz]);
  }
  return out;
}
const ringNormals = (ring, hole) => {
  // outward normal per edge, tested against the ring itself: outside the ring for an outer ring, INSIDE the hole for a courtyard ring (the facade looks into the courtyard)
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; let nx = dz / l, nz = -dx / l;
    const mx = (a[0] + b[0]) / 2 + nx * 0.05, mz = (a[1] + b[1]) / 2 + nz * 0.05;
    if (inRing(ring, mx, mz) !== !!hole) { nx = -nx; nz = -nz; }
    out.push([nx, nz]);
  }
  return out;
};
/** a low hip with a flat top over a ring + holes: skirts from the eave ring (eaveY, overhang `over`) to the plateau ring (topY, inset `inset`); edges with cut[i] have no skirt and no inset */
function hipRoof(P, mat, ring, holes, eaveY, topY, o = {}) {
  const over = o.over ?? 0.4, inset = o.inset ?? 3.2;
  const rings = [{ r: ring, hole: false, cut: o.cut || [] }].concat(holes.map((h) => ({ r: h, hole: true, cut: [] })));
  const plats = [];
  for (const { r, hole, cut } of rings) {
    const nrm = ringNormals(r, hole), n = r.length;
    const eaveR = offsetRing(r, nrm, r.map((_, i) => (cut[i] ? 0 : over)));
    const platR = offsetRing(r, nrm, r.map((_, i) => (cut[i] ? 0 : -inset)));
    for (let i = 0; i < n; i++) {
      if (cut[i]) continue;
      const j = (i + 1) % n, A = eaveR[i], B = eaveR[j], C = platR[j], D = platR[i], l = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (l < 0.05) continue;
      const nn = nrm[i], rise = topY - eaveY;
      P.quad(mat, [A[0], eaveY, A[1]], [B[0], eaveY, B[1]], [C[0], topY, C[1]], [D[0], topY, D[1]], [nn[0] * rise, inset, nn[1] * rise], [[0, 0], [l / 0.6, 0], [l / 0.6, 6], [0, 6]]);
    }
    plats.push({ ring: platR, hole });
  }
  const outer = plats.find((p) => !p.hole);
  P.cap(mat, outer.ring, topY, true, 0.6, plats.filter((p) => p.hole).map((p) => p.ring));
  return plats;
}
const toRing = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.01) r.pop(); return r; };

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, label = ctx.services.labels;
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMining/wings] ${name}:`, e); } };
  const bld = L.buildingById('r2902646');
  if (!bld || !bld.polys || !bld.polys[0]) throw new Error('r2902646 is not in the bake');
  const poly = bld.polys[0];
  const styles = {
    wing: { mat: M.wing, bayW: 3.95, texH: 11.0, eave: EAVE, plain: M.plaster },
    link: { mat: M.link, bayW: 3.95, texH: 11.0, eave: EAVE, plain: M.plaster },
    east: { mat: M.east, bayW: 4.1, texH: 11.0, eave: EAVE, plain: M.plasterEast },
    west: { mat: M.west, bayW: 4.0, texH: 11.0, eave: EAVE, plain: M.plasterWest },
    yard: { mat: M.yard, bayW: 4.0, texH: 11.0, eave: EAVE, plain: M.plasterWest },
  };
  let edges = [];
  step('walls', () => {
    edges = shellWalls(P, poly, { minEdge: 0.3, def: styles.yard, style: (e) => { if (e.hole) return styles.yard; const s = styleOf(e.i); return s === 'skip' ? 'skip' : styles[s]; } });
    const white = { white: M.white, soffit: M.whiteShade };
    shellCornice(P, { o: poly.o, h: poly.h }, EAVE, white, { d: 0.5, h: 0.7, mat: M.white, holes: false, draw: (e) => !(e.i >= 16 && e.i <= 18) });
  });
  // ------------------------------------------------------------------------------------------ the roof: the ring with the front line closed round the central block (cut sides: no skirt)
  step('roof', () => {
    const ringW = toRing(poly.o);
    // replace the vertices 17, 18 (the open front line) by a path round the central block rectangle (u -21.9 .. 21.8, w down to -24.0): those three edges are cut edges (they meet the block walls)
    const w17 = ringW[17], w18 = ringW[18], n = ringW.length;
    if (n !== 34) throw new Error('unexpected ring size ' + n);
    const a = FP.W(21.8, -24.0), b = FP.W(-21.9, -24.0);
    const r2 = [], cut = [];
    for (let i = 0; i < n; i++) {
      if (i === 17) { r2.push([a.x, a.z]); cut[r2.length - 2] = true; continue; }          // 16 -> a is the cut edge u = 21.8
      if (i === 18) { r2.push([b.x, b.z]); cut[r2.length - 2] = true; cut[r2.length - 1] = true; continue; }   // a -> b (back of the block) and b -> 19 (west side of the block)
      r2.push(ringW[i]);
    }
    void w17; void w18;
    const holes = poly.h.map(toRing);
    hipRoof(P, M.roof, r2, holes, EAVE, EAVE + 2.4, { inset: 3.4, over: 0.45, cut });
  });
  // ------------------------------------------------------------------------------------------ colliders: every wall of the footprint (the open front line 17-18 is the colonnade)
  step('colliders', () => {
    edgeColliders(ctx, edges.filter((e) => !e.skipped || (e.i !== 17)), HT.corniceTop, (e) => !e.hole && e.i === 17, 0.9);
  });
  // ------------------------------------------------------------------------------------------ relief friezes over the links, plaques, the church risalit
  const edgeAt = (i, hole = false) => edges.find((e) => !e.hole === !hole && e.i === i);
  step('friezes', () => {
    for (const [i, mat] of [[15, M.friezeE], [19, M.friezeW]]) {
      const e = edgeAt(i); if (!e) continue;
      onEdge(P, e, (len) => {
        const w = Math.min(10.0, len - 0.4), x0 = (len - w) / 2, y0 = 8.65, y1 = 9.95;
        P.quad(mat, [x0, y0, 0.03], [x0 + w, y0, 0.03], [x0 + w, y1, 0.03], [x0, y1, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        P.box(M.white, x0 - 0.1, x0 + w + 0.1, y1, y1 + 0.1, 0, 0.1, 'kb'); P.box(M.white, x0 - 0.1, x0 + w + 0.1, y0 - 0.1, y0, 0, 0.1, 'kb');
      });
    }
  });
  step('plaques', () => {
    let k = 0;
    for (const [u, w, key, text] of PLAQUES) {
      const wp = FP.W(u, w);
      let best = null;
      for (const e of edges) { if (e.hole || e.skipped) continue; const q = localOnEdge(e, wp.x, wp.z); if (q.u > 0.5 && q.u < e.len - 0.5 && Math.abs(q.d) < 3.2 && (!best || Math.abs(q.d) < Math.abs(best.q.d))) best = { e, q }; }
      if (!best) continue;
      const { e, q } = best, st = e.st || {}, pitch = st.mat && e.lay && e.lay.n ? e.lay.pitch : 0;
      let x = q.u;
      if (pitch) { const t = (x - e.lay.x0) / pitch, f = t - Math.floor(t); if (Math.abs(f - 0.5) * pitch < 1.0) x = e.lay.x0 + (Math.round(t)) * pitch; }      // a plaque never covers a window: snap to the pier
      onEdge(P, e, (len, f) => {
        plate({ ctx, P, M: { iron: M.frame } }, { id: 'mining-plaque-' + key, x, y: 3.7, w: 0.55, h: 0.78, z: 0.02, lines: wrap(text, 17).slice(0, 12), key: 'mining-' + key, style: 'bronze', size: 40,
          world: (lx, lz) => [f.x + f.xa[0] * lx + e.n[0] * lz, f.z + f.xa[1] * lx + e.n[1] * lz], n: e.n });
      });
      k++;
    }
    svc.plaques = k;
  });
  step('risalit', () => {
    // the church block (east range): the central risalit 17.8 m (edge 10 -> 11, jogs 11-12 / 9-10) with a gable, a half-round (thermal) window under the apex and a gilt cross on a ball
    const e = edgeAt(10); if (!e) return;
    const thermal = ctx.tex.draw(512, 256, (g, w, h) => {
      g.fillStyle = '#ecd07b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#efece2'; g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.5, h * 0.78, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#2b2420'; g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.455, h * 0.7, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#7f95a4'; g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.43, h * 0.66, 0, Math.PI, 0); g.fill();
      g.strokeStyle = '#2b2420'; g.lineWidth = 5; for (let k = 1; k < 8; k++) { const a = Math.PI * k / 8; g.beginPath(); g.moveTo(w / 2, h * 0.9); g.lineTo(w / 2 + Math.cos(a) * w * 0.43, h * 0.9 - Math.sin(a) * h * 0.66); g.stroke(); }
      g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.2, h * 0.3, 0, Math.PI, 0); g.stroke();
    }, { key: 'lmMin-thermal' });
    const mt = ctx.mat.toon('#ffffff', { map: thermal, name: 'lmMin-thermal', paint: 0.02 });
    onEdge(P, e, (len) => {
      const xm = len / 2, hw = len / 2 + 0.3, y0 = EAVE - 0.1, yA = 15.0, zf = 0.05;
      P.quad(M.plasterEast, [xm - hw, y0, zf], [xm + hw, y0, zf], [xm, yA, zf], [xm, yA, zf], [0, 0, 1], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]]);
      P.quad(mt, [xm - 3.15, y0 + 0.45, zf + 0.012], [xm + 3.15, y0 + 0.45, zf + 0.012], [xm + 3.15, y0 + 0.45 + 3.2, zf + 0.012], [xm - 3.15, y0 + 0.45 + 3.2, zf + 0.012], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const sl = (yA - y0) / hw;
      for (const s of [-1, 1]) {                                            // raking cornice and the gable roof behind
        const sh = new THREE.Shape(), E = hw + 0.3, pts = [[0, yA], [0, yA + 0.5], [E, yA + 0.5 - sl * E], [E, yA - sl * E]].map(([x, y]) => [x * s, y]); if (s < 0) pts.reverse();
        sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
        P.push(xm, 0, 0, 0); P.extrude(M.white, sh, -0.1, 0.55, 3); P.pop();
        P.quad(M.roof, [xm + s * (hw + 0.3), y0 - 0.3, 0.4], [xm + s * (hw + 0.3), y0 - 0.3, -11], [xm, yA + 0.35, -11], [xm, yA + 0.35, 0.4], [s * sl, 1, 0], [[0, 0], [11.4 / 0.6, 0], [11.4 / 0.6, 6], [0, 6]]);
      }
      P.fan(M.plasterEast, [[xm - hw, y0 - 0.2, -11], [xm + hw, y0 - 0.2, -11], [xm, yA + 0.2, -11]], [0, 0, -1], (p) => [p[0] / 3, p[1] / 3]);
      P.cyl(M.gold, [xm, yA + 0.5, -0.3], [xm, yA + 1.35, -0.3], 0.05, 0.05, 6, true); P.cyl(M.gold, [xm - 0.35, yA + 1.1, -0.3], [xm + 0.35, yA + 1.1, -0.3], 0.04, 0.04, 6, true);
      P.geo(M.gold, new THREE.SphereGeometry(1, 8, 6), xm, yA + 0.62, -0.3, 0, 0, 0, 0.16, 0.16, 0.16);
    });
    // the church door (OSM n6549729294) on the facade segment S1 (edge 12): a double door 1.7 x 2.6 under a small iron canopy
    const s1 = edgeAt(12); if (!s1) return;
    const dw = FP.W(79.5, -43.1), q = localOnEdge(s1, dw.x, dw.z);
    if (q.u > 1 && q.u < s1.len - 1) onEdge(P, s1, () => {
      const x = q.u; P.box(M.door, x - 0.85, x + 0.85, 0, 2.6, 0, 0.12, 'kb'); P.box(M.white, x - 1.05, x + 1.05, 2.6, 2.8, 0, 0.18, 'kb');
      P.box(M.iron, x - 1.1, x + 1.1, 3.05, 3.12, 0.0, 1.2, 'b'); for (const s of [-1, 1]) P.cyl(M.iron, [x + s * 1.0, 0, 1.15], [x + s * 1.0, 3.05, 1.15], 0.04, 0.04, 6, true);
      P.cyl(M.gold, [x, 3.12, 0.6], [x, 3.62, 0.6], 0.025, 0.025, 4, true); P.cyl(M.gold, [x - 0.15, 3.45, 0.6], [x + 0.15, 3.45, 0.6], 0.02, 0.02, 4, true);
    });
    const dd = FP.W(79.5, -43.1); svc.entrances.push({ x: dd.x, z: dd.z, rotY: Math.atan2(s1.n[0], s1.n[1]), name: 'Церковь преподобного Макария Египетского', closed: true });
  });
  // ------------------------------------------------------------------------------------------ the MUSEUM entrance (dossier 7.2; mining-fix 2026-10-09)
  // the Mining Museum (1787 wing, Postnikov hall) opens on the 22nd line: its exact position is unknown [?], so one bay of the west range front (edge 23, a third of the way along) gets a closed dark double door
  // with a white architrave, one light stone step and a small dark board plate on the next pier (no text texture: it would add a draw call; the existing materials only); no walk-in (the wall colliders stay), listed in svc.entrances as closed
  step('museum', () => {
    const e = edgeAt(23); if (!e || !e.lay || !(e.lay.n > 3)) return;
    const bay = Math.min(5, e.lay.n - 2), x = e.lay.x0 + (bay + 0.5) * e.lay.pitch;
    let door = null;
    onEdge(P, e, (len, f) => {
      P.box(M.frame, x - 0.9, x + 0.9, 0, 2.7, 0, 0.12, 'kb'); P.box(M.white, x - 0.012, x + 0.012, 0.05, 2.65, 0.11, 0.13, 'kb');       // two dark leaves (the plate material: its batch already spans the front)
      P.box(M.white, x - 1.12, x + 1.12, 2.7, 2.92, 0, 0.18, 'kb'); P.box(M.white, x - 1.12, x - 0.9, 0, 2.7, 0, 0.16, 'kb'); P.box(M.white, x + 0.9, x + 1.12, 0, 2.7, 0, 0.16, 'kb');
      P.box(M.white, x - 1.25, x + 1.25, 0, 0.16, 0, 0.5, 'kb');
      // the small plate beside the door: a dark bronze board with a pale rule top and bottom, drawn from the materials this part already uses (a text texture would be one more draw call at every view of the module)
      const px = x + e.lay.pitch / 2, pw = 0.64, ph2 = 0.26, py = 2.0, wp = [f.x + f.xa[0] * px + e.n[0] * 0.03, f.z + f.xa[1] * px + e.n[1] * 0.03];
      if (!label || label.reserve('mining-museum-plate', wp[0], py, wp[1], pw, ph2, e.n[0], e.n[1], 'plate-landmark')) {
        P.box(M.frame, px - pw / 2, px + pw / 2, py - ph2 / 2, py + ph2 / 2, 0.0, 0.035, 'kb');
        for (const dy of [-0.075, 0.075]) P.box(M.white, px - pw / 2 + 0.05, px + pw / 2 - 0.05, py + dy - 0.006, py + dy + 0.006, 0.034, 0.042, 'kb');
      }
      door = { x: f.x + f.xa[0] * x + e.n[0] * 0.2, z: f.z + f.xa[1] * x + e.n[1] * 0.2 };
    });
    if (door) svc.entrances.push({ x: door.x, z: door.z, rotY: Math.atan2(e.n[0], e.n[1]), name: 'Горный музей (вход со стороны 22-й линии)', closed: true });
  });
  // ------------------------------------------------------------------------------------------ chimneys along the roof (pale yellow stacks 0.8 x 0.8 m, 1.6 m)
  step('chimneys', () => {
    const rnd = ctx.rng(4711);
    for (const e of edges) {
      if (e.hole || e.skipped || e.len < 14 || !['wing', 'east', 'west'].includes(styleOf(e.i))) continue;
      const m = Math.floor(e.len / 12);
      for (let q = 0; q < m; q++) {
        const t = (q + 0.5 + (rnd() - 0.5) * 0.3) / m, x = e.a[0] + (e.b[0] - e.a[0]) * t - e.n[0] * 4.4, z = e.a[1] + (e.b[1] - e.a[1]) * t - e.n[1] * 4.4, yy = EAVE + 2.4;
        P.push(x, 0, z, Math.atan2(e.n[0], e.n[1])); P.box(M.chimney, -0.4, 0.4, yy - 0.3, yy + 1.5, -0.4, 0.4, 'b'); P.box(M.chimneyCap, -0.47, 0.47, yy + 1.5, yy + 1.64, -0.47, 0.47, ''); P.pop();
      }
    }
  });
  // ------------------------------------------------------------------------------------------ the rear range w116609897: 4 storeys, flat roof, blank sand-grey facade
  step('rear', () => {
    const rb = L.buildingById('w116609897'); if (!rb || !rb.polys || !rb.polys[0]) return;
    const rp = rb.polys[0], RH = 14.0;
    const re = shellWalls(P, rp, { minEdge: 0.3, def: { mat: M.rear, bayW: 3.6, texH: 14.0, eave: RH, plain: M.plasterRear } });
    shellCornice(P, { o: rp.o, h: rp.h }, RH, { white: M.whiteShade, soffit: M.whiteShade }, { d: 0.25, h: 0.5, mat: M.whiteShade });
    P.cap(M.rearRoof, toRing(rp.o), RH + 0.02, true, 3, rp.h.map(toRing));
    edgeColliders(ctx, re, RH, null, 0.9);
    K.svc.rearTris = P.tris;
  });
}
