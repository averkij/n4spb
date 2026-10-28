// landmarksUniversity/collegia.js - the building of the Twelve Collegia (Университетская наб., 7-9; D. Trezzini / T. Schwertfeger 1722-42; the main building of the University; OSM
// r3170387): docs/research/university-embankment.md section 5, photos refs/university tc_24 (the elevation of a section) tc_01 (the embankment end, the measuring photo) tc_04 tc_23
// (fence, garden) re_05 tc_07 (roofs) tc_12 tc_16 (west gallery) tc_05 (north end).
//   388.6 m end-on to the Neva: twelve sections of 9 window axes (3 + the 3-axis projection + 3) separated by broad piers with paired pilasters; red walls, white giant pilasters and
//   eared frames (bay textures of mats.js + real pilaster strips, string course, cornice), a balcony with an iron railing and a curved baroque gable on every projection, one silver
//   hipped roof with red chimneys per section; the 4-axis ends; on the west the two-storey gallery under a lean-to roof; the iron garden fence on its limestone plinth along
//   Mendeleevskaya line (OSM ways w172796325 / w172796272, the gap between them = the gate to the main door) and the red gate wall of the University on the embankment (w142418184).
// Frame TC (frame.js): origin = the SE corner, +x along the east front to the NNW, +z out to Mendeleevskaya line.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS } from '../data/city.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, hipRect, chimney, edgeColliders, texQuad, plainQuad, ringFromFlat } from './shell.js';
import { plate } from './plaques.js';
import { coverFn } from './surfaces.js';
import { TC, TC_LEN, TC_DEPTH, TC_GAL, GENIUS } from './frame.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { knockBays, splitBays, unitPanel, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the garden fence is a row of breakable bays

const ID = 'r3170387', TH = 15.2, G = 3.9, GEAVE = 8.5, GTOP = 9.45;

function gablePath(cx, y0, k = 1) {
  const s = new THREE.Shape(), X = (x) => cx + x * k, Y = (y) => y0 + 0.02 + (y - 0.02) * k + (k < 1 ? 0.32 : 0);
  s.moveTo(X(-4.5), Y(0)); s.lineTo(X(4.5), Y(0)); s.lineTo(X(4.5), Y(0.9)); s.quadraticCurveTo(X(2.9), Y(1.0), X(2.5), Y(2.2)); s.lineTo(X(2.5), Y(2.8));
  s.quadraticCurveTo(X(2.3), Y(4.3), X(0), Y(4.3)); s.quadraticCurveTo(X(-2.3), Y(4.3), X(-2.5), Y(2.8)); s.lineTo(X(-2.5), Y(2.2)); s.quadraticCurveTo(X(-2.9), Y(1.0), X(-4.5), Y(0.9)); s.lineTo(X(-4.5), Y(0));
  return s;
}

export function collegia(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const b = L.buildingById ? L.buildingById(ID) : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Twelve Collegia footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), loc = (p) => TC.M(p[0], p[1]);
  const kind = (e) => {
    const a = loc(e.a), c = loc(e.b), zmin = Math.min(a[1], c[1]), zmax = Math.max(a[1], c[1]), xmin = Math.min(a[0], c[0]), xmax = Math.max(a[0], c[0]);
    if (zmax < -22.4) return 'gallery';
    if (xmin > TC_LEN - 3) return 'north';
    if (xmax < 1.5 && zmin < -10) return 'south';
    if (zmin > 1.4) return 'risalit';
    if (zmax > 1.4 && zmin < 0.8 && e.len < 4) return 'side';
    if (zmin > -0.8 && zmax < 0.8) return 'recess';
    return 'other';
  };
  const edges = shellWalls(P, poly, { style: () => 'skip', def: null, minEdge: 0.3 });
  for (const e of edges) { e.kind = kind(e); const a = loc(e.a), c = loc(e.b); e.tx = (a[0] + c[0]) / 2; }
  const ris = edges.filter((e) => e.kind === 'risalit').sort((m, n) => m.tx - n.tx);
  const gx = TC.M(GENIUS.x, GENIUS.z)[0], mainRis = ris.reduce((best, e) => (!best || Math.abs(e.tx - gx) < Math.abs(best.tx - gx) ? e : best), null);
  const cover = coverFn(ctx);
  const strip = (len, y0 = G, y1 = G + 0.28, d = 0.12) => { const k = Math.max(1, Math.ceil(len / 14)); for (let i = 0; i < k; i++) P.box(M.white, (len * i) / k, (len * (i + 1)) / k, y0, y1, 0, d, 'kb'); };
  const pil = (x0, x1) => P.box(M.white, x0, x1, G + 0.28, 13.7, 0, 0.14, 'kb');

  for (const e of edges) onEdge(P, e, (len, f) => {
    const world = (x, z) => [f.x + f.xa[0] * x + e.n[0] * z, f.z + f.xa[1] * x + e.n[1] * z];
    if (e.kind === 'risalit') {
      // -------------------------------------------------------------------------------------------- the projection: 3 axes, balcony, gable
      const p = len / 3, isMain = e === mainRis;
      for (let i = 0; i < 3; i++) texQuad(P, isMain && i === 1 ? M.tcDoorR : M.tcBayR, i * p, (i + 1) * p, 0, TH, 0, 1, TH);
      strip(len); for (let i = 0; i <= 3; i++) pil(Math.max(0, i * p - 0.5), Math.min(len, i * p + 0.5));
      P.box(M.white, 0.45, len - 0.45, G + 0.12, G + 0.3, 0, 1.25, 'k');                                   // balcony slab, brackets, wrought-iron railing
      for (const bx of [0.95, p - 0.22, p + 0.22, 2 * p - 0.22, 2 * p + 0.22, len - 0.95]) { P.box(M.white, bx - 0.09, bx + 0.09, G - 0.75, G + 0.12, 0, 0.55, 'kt'); P.box(M.white, bx - 0.09, bx + 0.09, G - 0.25, G + 0.12, 0.55, 1.0, 'kt'); }
      const r0 = G + 0.3, r1 = G + 1.3, n = Math.round(len - 0.9);
      P.quad(M.ironwork, [0.45, r0, 1.2], [len - 0.45, r0, 1.2], [len - 0.45, r1, 1.2], [0.45, r1, 1.2], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
      for (const sx of [0.47, len - 0.47]) P.quad(M.ironwork, [sx, r0, 0], [sx, r0, 1.2], [sx, r1, 1.2], [sx, r1, 0], [sx < 1 ? -1 : 1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const cx = len / 2;
      P.extrude(M.white, gablePath(cx, TH), -0.22, 0.44, 1, 6); P.face(M.tc, gablePath(cx, TH, 0.8), 0.228, 3, 6);
      P.cyl(M.white, [cx, TH + 2.45, 0.2], [cx, TH + 2.45, 0.34], 0.78, 0.7, 14, true); P.box(M.white, cx - 1.5, cx + 1.5, TH + 1.25, TH + 1.5, 0.2, 0.3, 'kb'); P.box(M.white, cx - 0.3, cx + 0.3, TH + 3.2, TH + 3.75, 0.2, 0.3, 'kb');
      if (isMain) {
        // the door steps stop at the service way that OSM leads to the door (road integrity: nothing is laid over a carriageway)
        const free = (hw, d) => [-hw, 0, hw].every((sx) => { const q = world(cx + sx, d); return cover(q[0], q[1]) < -0.25; });
        if (free(1.9, 1.3)) { P.box(M.granitePlain, cx - 1.9, cx + 1.9, 0, 0.16, 0, 1.3, 'kb'); P.box(M.granitePlain, cx - 1.6, cx + 1.6, 0.16, 0.32, 0, 0.9, 'kb'); }
        else if (free(1.6, 0.55)) P.box(M.granitePlain, cx - 1.6, cx + 1.6, 0, 0.16, 0, 0.55, 'kb');
        const d = world(cx, 1.8); K.svc.entrances.push({ x: d[0], z: d[1], rotY: Math.atan2(e.n[0], e.n[1]), name: 'Санкт-Петербургский государственный университет', closed: true });
        plate(K, { id: ID, x: p, y: 2.15, w: 0.9, h: 0.7, key: 'tc-mendeleev', style: 'stone', world, n: e.n, size: 36, lines: ['ЗДЕСЬ УЧИЛСЯ, РАБОТАЛ И ЖИЛ', 'с 1850 г. по 1890 г.', 'ВЕЛИКИЙ РУССКИЙ УЧЁНЫЙ', 'ДМИТРИЙ ИВАНОВИЧ', 'МЕНДЕЛЕЕВ'] });
        plate(K, { id: ID, x: 2 * p, y: 2.15, w: 0.9, h: 0.7, key: 'tc-1905', style: 'stone', world, n: e.n, size: 34, lines: ['ЗДЕСЬ, В УНИВЕРСИТЕТЕ,', 'В 1905–1906 гг. ПРОИСХОДИЛИ', 'СХОДКИ И МНОГОТЫСЯЧНЫЕ МИТИНГИ', 'РАБОЧИХ И РЕВОЛЮЦИОННОГО', 'СТУДЕНЧЕСТВА'] });
      }
    } else if (e.kind === 'side') {
      plainQuad(P, M.tcWall, 0, len, 0, G); plainQuad(P, M.white, 0, len, G, TH);
    } else if (e.kind === 'recess') {
      // -------------------------------------------------------------------------------------------- the wall between two projections: 3 axes, the pier of the section boundary, 3 axes
      const where = e.tx < 20 ? 'south' : e.tx > TC_LEN - 20 ? 'north' : 'mid';
      if (where === 'mid') {
        const p = (len / 2 - 0.7) / 3, xp = 3 * p;
        texQuad(P, M.tcBay, 0, xp, 0, TH, 0, 3, TH); texQuad(P, M.tcPier, xp, xp + 1.4, 0, TH, 0, 1, TH); texQuad(P, M.tcBay, xp + 1.4, len, 0, TH, 0, 3, TH);
        for (let i = 0; i <= 2; i++) { pil(Math.max(0, i * p - 0.45), i * p + 0.45); pil(xp + 1.4 + (i + 1) * p - 0.45, Math.min(len, xp + 1.4 + (i + 1) * p + 0.45)); }
        pil(xp - 0.45, xp + 0.62); pil(xp + 0.78, xp + 1.85);
      } else {
        const n = where === 'south' ? 4 : 3, p = (len - 1.4) / n, x0 = where === 'south' ? 1.4 : 0, xc = where === 'south' ? 0 : len - 1.4;
        texQuad(P, M.tcBay, x0, x0 + n * p, 0, TH, 0, n, TH); texQuad(P, M.tcPier, xc, xc + 1.4, 0, TH, 0, 1, TH);
        for (let i = 0; i <= n; i++) pil(Math.max(0, x0 + i * p - 0.45), Math.min(len, x0 + i * p + 0.45));
        pil(xc + 0.05, xc + 1.35);
      }
      strip(len);
    } else if (e.kind === 'south' || e.kind === 'north') {
      // -------------------------------------------------------------------------------------------- the 4-axis ends (the north one with the end of the gallery on its right)
      const W = TC_DEPTH, p = (W - 1.4) / 4;
      texQuad(P, M.tcPier, 0, 0.7, 0, TH, 0, 0.5, TH); texQuad(P, M.tcPier, W - 0.7, W, 0, TH, 0.5, 1, TH);
      for (let i = 0; i < 4; i++) texQuad(P, e.kind === 'north' && i === 1 ? M.tcDoorR : M.tcBayR, 0.7 + i * p, 0.7 + (i + 1) * p, 0, TH, 0, 1, TH);
      if (e.kind === 'north') { for (let k = 0; k < Math.ceil(W / 9); k++) { P.box(M.white, (W * k) / Math.ceil(W / 9) - (k ? 0 : 0.5), (W * (k + 1)) / Math.ceil(W / 9), TH - 0.5, TH, 0, 0.5, 'k'); P.box(M.white, (W * k) / Math.ceil(W / 9), (W * (k + 1)) / Math.ceil(W / 9), TH - 0.82, TH - 0.5, 0, 0.21, 'kt'); } P.box(M.granitePlain, 0.7 + 1.5 * p - 1.5, 0.7 + 1.5 * p + 1.5, 0, 0.16, 0, 1.0, 'kb'); }
      for (let i = 0; i <= 4; i++) pil(Math.max(0, 0.7 + i * p - 0.5), Math.min(W, 0.7 + i * p + 0.5));
      strip(W);
      if (len > W + 1) { texQuad(P, M.tcGal, W, len, 0, GEAVE, 0, 1.5, GEAVE); P.fan(M.white, [[W, GEAVE, 0], [len, GEAVE, 0], [W, GTOP, 0]], [0, 0, 1]); }
      if (e.kind === 'north') plate(K, { id: ID, x: 0.7 + 2 * p, y: 2.3, w: 1.2, h: 0.8, key: 'tc-name', style: 'board', world, n: e.n, size: 40, lines: ['САНКТ-ПЕТЕРБУРГСКИЙ', 'ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ', 'ОСНОВАН В 1724 ГОДУ'] });
    } else if (e.kind === 'gallery') {
      // -------------------------------------------------------------------------------------------- the west gallery, its lean-to roof, the upper wall of the main block behind it
      const n = Math.round(len / 3.6);
      texQuad(P, M.tcGal, 0, len, 0, GEAVE, 0, n, GEAVE);
      const k = Math.ceil(len / 16);
      for (let i = 0; i < k; i++) {
        const a = (len * i) / k, c = (len * (i + 1)) / k;
        P.quad(M.tcRoof, [a, GEAVE, 0.3], [c, GEAVE, 0.3], [c, GTOP, -TC_GAL], [a, GTOP, -TC_GAL], [0, 5.4, 0.95], [[a / 0.6, 0], [c / 0.6, 0], [c / 0.6, 9.5], [a / 0.6, 9.5]]);
        P.box(M.white, a, c, GEAVE - 0.3, GEAVE, 0, 0.3, 'kt');
      }
      texQuad(P, M.tcWest, 0, len, GTOP, TH, 0, n, 5.8, -TC_GAL, GTOP);
    } else {
      // -------------------------------------------------------------------------------------------- the stubs at the SW corner: the west wall south of the gallery, the gallery's end
      const a = loc(e.a), c = loc(e.b), gal = Math.min(a[1], c[1]) < -19;
      if (gal) { texQuad(P, M.tcGal, 0, len, 0, GEAVE, 0, 1.5, GEAVE); P.fan(M.white, [[0, GEAVE, 0], [len, GEAVE, 0], [len, GTOP, 0]], [0, 0, 1]); }
      else if (len > 6) { const n = Math.max(1, Math.round(len / 4.1)); texQuad(P, M.tcBayR, 0, len, 0, TH, 0, n, TH); strip(len); }
      else plainQuad(P, M.tc, 0, len, 0, TH);
    }
  });
  shellCornice(P, poly, (e) => (kind(e) === 'gallery' ? GEAVE - 0.02 : TH), M, { d: 0.5, h: 0.5, draw: (e) => { const k2 = kind(e); return k2 !== 'gallery' && k2 !== 'north' && !(k2 === 'other' && Math.min(loc(e.a)[1], loc(e.b)[1]) < -19); } });
  edgeColliders(ctx, edges, (e) => (e.kind === 'gallery' ? GTOP + 1 : TH + 2));

  // ---------------------------------------------------------------------------------------------- roofs: one hip per section, red chimneys; the flat cap under the valleys
  P.cap(M.tcRoof, ring, TH - 0.06, true, 0.6);
  P.push(TC.O[0], 0, TC.O[1], TC.rot);
  const cs = ris.map((e) => e.tx), bounds = [0]; for (let i = 0; i + 1 < cs.length; i++) bounds.push((cs[i] + cs[i + 1]) / 2); bounds.push(TC_LEN);
  for (let i = 0; i + 1 < bounds.length; i++) {
    const a = bounds[i], c = bounds[i + 1], Ls = c - a;
    hipRect(P, M.tcRoof, a, c, -TC_DEPTH, 0, TH + 0.05, 5.5, { over: 0.3 });
    for (const [dx, dz] of [[9.5, -5.6], [13.5, -12.4], [Ls - 13.5, -5.6], [Ls - 9.5, -12.4]]) chimney(P, M.tc, M.white, a + dx, dz, TH + 1.5, TH + 6.6, 0.9, 1.4);
  }
  P.pop();

  // ---------------------------------------------------------------------------------------------- garden fence (iron pickets on a limestone plinth) and the gate wall on the embankment
  const fenceBays = [];
  for (const id of ['w172796325', 'w172796272']) {
    const w = BARRIERS.find((r) => r.id === id); if (!w || !w.pts) continue;
    const pts = []; for (let i = 0; i + 1 < w.pts.length; i += 2) pts.push([w.pts[i], w.pts[i + 1]]);
    fenceBays.push(...polyBays(pts));
    K.svc.fences.push({ id, pts });
  }
  fence(K, fenceBays);
  const gw = BARRIERS.find((r) => r.id === 'w142418184');
  if (gw && gw.pts && gw.pts.length >= 4) {
    const a = [gw.pts[0], gw.pts[1]], c = [gw.pts[gw.pts.length - 2], gw.pts[gw.pts.length - 1]], dx = c[0] - a[0], dz = c[1] - a[1], len = Math.hypot(dx, dz);
    P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
    P.box(M.tcWall, 0, len, 0, 4.4, -0.3, 0.3, 'b', 0.84); P.box(M.white, -0.1, len + 0.1, 4.4, 4.62, -0.4, 0.4, '');
    P.box(M.white, len / 2 - 1.0, len / 2 + 1.0, 0, 2.9, 0.3, 0.36, 'kb'); P.box(M.door, len / 2 - 0.8, len / 2 + 0.8, 0, 2.6, 0.36, 0.4, 'kb'); P.box(M.white, len / 2 - 1.0, len / 2 + 1.0, 0, 2.9, -0.36, -0.3, 'fb'); P.box(M.door, len / 2 - 0.8, len / 2 + 0.8, 0, 2.6, -0.4, -0.36, 'fb');
    P.pop();
    ph.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, len, 0.7, Math.atan2(-dz, dx), 0, 4.6);
  }
  K.svc.monuments.push({ id: 'twelve-collegia', name: 'Здание Двенадцати коллегий', x: b.cx, z: b.cz, h: TH + 5.5, r: 0 });
  const ps = TC.W(-28, 4); K.svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: 0, name: 'Двенадцать коллегий' });
  void TC_GAL;
}

/** the bays of the garden fence along a polyline: one bay per ~3.6 m (the post pitch of the source), a post at the start of every bay and one at the end of the last */
function polyBays(pts) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], c = pts[i + 1]; if (Math.hypot(c[0] - a[0], c[1] - a[1]) < 0.4) continue;
    out.push(...splitBays(a[0], a[1], c[0], c[1], 3.6, { y: 0 }).map((b) => ({ ...b, last: false })));
  }
  if (out.length) out[out.length - 1].last = true;
  return out;
}

/** the garden fence: limestone plinth 0.6 m, iron pickets to 3.2 m (cut-out texture), posts every ~3.6 m. n4spb: a row of BREAKABLE bays (plinth + picket panel per bay, one thin collider and one knock record each;
 *  the posts stay instanced with the bay that starts at them, the last one carries the closing post): a car breaks a bay off at the foot, the gap is passable */
function fence(K, bays) {
  const { ctx, M } = K;
  if (!bays.length) return;
  const post = new THREE.BoxGeometry(0.14, 2.7, 0.14); post.translate(0, 0.6 + 1.35, 0);
  const cap = new THREE.CylinderGeometry(0.02, 0.09, 0.22, 6, 1, false); cap.translate(0, 3.41, 0);
  const postGeo = mergeGeometries([post, cap]);
  knockBays(ctx, { name: 'lmU-garden-fence', bays, far: 320,
    parts: [
      { geo: unitBox(0, 0.6, -0.24, 0.24, { uLen: 3.6, uvs: 1.2 }), mat: M.limestone, name: 'plinth', stretch: true },
      { geo: unitPanel(0.6, 3.2, { u1: 6 }), mat: M.pickets, name: 'pickets', stretch: true, shadow: false, receive: false, noOutline: true },
      { geo: postGeo, mat: M.iron, name: 'post', ats: (b) => (b.last ? ['start', 'end'] : ['start']), shadow: false, receive: false },
    ],
    collider: { y0: 0, y1: 3.3, thick: 0.4, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 600, h: 3.3, anchored: 24, hitK: 0.5, metal: true, minDv: 0 }) });
  K.extraTris += bays.length * (10 + 2 + 36) + 2 * 36;
}
