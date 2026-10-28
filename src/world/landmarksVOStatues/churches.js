// landmarksVOStatues/churches.js - FOUR churches of Vasilievsky Island that the generic city drew as flat boxes (CHURCH_KINDS): the Armenian Church of the Holy Resurrection (Smolensky Armenian cemetery, 1791-93), the chapel of
// St Spyridon of Trimythous (Bolshoy pr. / 19th line, S. Kondratiev 1902-10), the church of St Mary Magdalene (children's hospital, 3rd line) and the chapel of St Alexander Nevsky (Bolshoy pr. 77).  St George (a temporary
// hall, a permit for an unbuilt five-domed church) stays a box.  Photos: SP/refs/vo-statues-other/ch_arm (c00, c04), ch_spi (c00, c02), vo-garden/ch_07_mary1, ch_13_alex1 (opened).  The walls follow the REAL baked
// footprints (rectilinear polygons); the roofs, drums, domes, porticos and crosses are built on top.  Exterior only: solid walls (addPolyColliders), closed doors, no bells (silent), no flags.
// Each church is built in a local frame whose +z is the FRONT (toward the nearest way) and whose origin is the centre of the footprint's oriented bounding box.
import { addPolyColliders } from '../lib/massing.js';
import * as THREE from 'three';
import { frustumBox, lathe, prism } from './solids.js';
import { geosOf, put } from './objs.js';

const GOLD = '#d8b04a', WHITE = '#f1eee4';

/** minimal-area oriented bounding box of a ring [[x, z], ...]: { cx, cz, a (axis angle), u0, u1, v0, v1 } where u = (cos a, sin a) and v = (-sin a, cos a) */
function obb(ring) {
  let best = null;
  for (let a = 0; a < 180; a += 0.5) {
    const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const [x, z] of ring) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) best = { A, a: r, u0, u1, v0, v1 };
  }
  const c = Math.cos(best.a), s = Math.sin(best.a), cu = (best.u0 + best.u1) / 2, cv = (best.v0 + best.v1) / 2;
  return { ...best, cx: cu * c - cv * s, cz: cu * s + cv * c };
}

/** orient a church: the frame rotation rotY so that local +z points to the side of the OBB (one of +-u, +-v) facing the nearest way; `across` = the preferred front axis ('short' = a front on the long side) */
function frameOf(L, ring, pref = 'long') {
  const B = obb(ring), eu = [Math.cos(B.a), Math.sin(B.a)], ev = [-Math.sin(B.a), Math.cos(B.a)], W = B.u1 - B.u0, D = B.v1 - B.v0;
  const hits = L.roadsNear(B.cx, B.cz, 40, {}), p = hits[0] ? [hits[0].x - B.cx, hits[0].z - B.cz] : [0, 1];
  // candidate fronts: +-eu, +-ev; the front perpendicular to the LONG axis (a front on the long face) is preferred by `pref`
  const cands = [[eu, 'u', 1], [[-eu[0], -eu[1]], 'u', -1], [ev, 'v', 1], [[-ev[0], -ev[1]], 'v', -1]];
  const score = (c) => c[0][0] * p[0] + c[0][1] * p[1] + ((pref === 'long' ? (W >= D ? c[1] === 'v' : c[1] === 'u') : (W >= D ? c[1] === 'u' : c[1] === 'v')) ? 1.5 : 0);
  const f = cands.reduce((m, c) => (score(c) > score(m) ? c : m), cands[0]);
  const rot = Math.atan2(f[0][0], f[0][1]);
  // extents in the new frame: x = lateral, z = depth
  const cs = Math.cos(rot), sn = Math.sin(rot); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const [x, z] of ring) { const dx = x - B.cx, dz = z - B.cz, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; x0 = Math.min(x0, lx); x1 = Math.max(x1, lx); z0 = Math.min(z0, lz); z1 = Math.max(z1, lz); }
  return { cx: B.cx, cz: B.cz, rot, x0, x1, z0, z1, W: x1 - x0, D: z1 - z0 };
}
const toLocal = (F, ring) => ring.map(([x, z]) => { const dx = x - F.cx, dz = z - F.cz; return [dx * Math.cos(F.rot) - dz * Math.sin(F.rot), dx * Math.sin(F.rot) + dz * Math.cos(F.rot)]; });

// ------------------------------------------------------------------------------------------------ small kit
/** a gabled roof over x0..x1 x z0..z1 with the ridge along x (or z), eave y0, ridge y1, overhang o */
function gable(P, mat, x0, x1, z0, z1, y0, y1, o = 0.3, alongZ = false) {
  const ex = alongZ ? o * 0.5 : o, ez = alongZ ? o : o * 0.5;
  x0 -= ex; x1 += ex; z0 -= ez; z1 += ez;
  if (!alongZ) {
    const zm = (z0 + z1) / 2;
    P.quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, zm], [x0, y1, zm], [0, 0.6, 1]); P.quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, zm], [x1, y1, zm], [0, 0.6, -1]);
    P.fan(mat, [[x0, y0, z1], [x0, y1, zm], [x0, y0, z0]], [-1, 0, 0]); P.fan(mat, [[x1, y0, z0], [x1, y1, zm], [x1, y0, z1]], [1, 0, 0]);
  } else {
    const xm = (x0 + x1) / 2;
    P.quad(mat, [x1, y0, z1], [x1, y0, z0], [xm, y1, z0], [xm, y1, z1], [1, 0.6, 0]); P.quad(mat, [x0, y0, z0], [x0, y0, z1], [xm, y1, z1], [xm, y1, z0], [-1, 0.6, 0]);
    P.fan(mat, [[x1, y0, z1], [xm, y1, z1], [x0, y0, z1]], [0, 0, 1]); P.fan(mat, [[x0, y0, z0], [xm, y1, z0], [x1, y0, z0]], [0, 0, -1]);
  }
}
/** a pediment triangle (front face + a thin slab) on the +z face of a portico at z, width w, from y0 to y1 */
function pediment(P, mat, x, z, w, y0, y1, depth, trim) {
  P.fan(mat, [[x - w / 2, y0, z], [x + w / 2, y0, z], [x, y1, z]], [0, 0, 1]);
  P.quad(mat, [x - w / 2, y0, z], [x, y1, z], [x, y1, z - depth], [x - w / 2, y0, z - depth], [-0.6, 0.8, 0]); P.quad(mat, [x + w / 2, y0, z - depth], [x, y1, z - depth], [x, y1, z], [x + w / 2, y0, z], [0.6, 0.8, 0]);
  if (trim) { P.tint(trim); P.box(mat, x - w / 2 - 0.1, x + w / 2 + 0.1, y0 - 0.22, y0, z - depth, z + 0.14, 'b'); }
}
/** an Orthodox cross (gilt) with its base at (x, y, z), height h */
function cross(P, M, x, y, z, h = 1.3, col = GOLD) {
  P.tint(col); const t = h * 0.035;
  P.box(M.vc, x - t, x + t, y, y + h, z - t, z + t, 'b'); P.box(M.vc, x - h * 0.22, x + h * 0.22, y + h * 0.62, y + h * 0.62 + t * 1.6, z - t, z + t, 'b'); P.box(M.vc, x - h * 0.13, x + h * 0.13, y + h * 0.84, y + h * 0.84 + t * 1.4, z - t, z + t, 'b');
  P.box(M.vc, x - h * 0.15, x + h * 0.15, y + h * 0.22, y + h * 0.22 + t * 1.4, z - t, z + t, 'b');
}
/** a round dome (spherical cap) of base radius r and rise h at (x, y, z) */
const dome = (P, M, r, h, x, y, z, seg = 24) => lathe(P, M.vc, Array.from({ length: 9 }, (_, i) => { const a = i / 8 * Math.PI / 2; return [Math.max(0.001, r * Math.cos(a)), h * Math.sin(a)]; }), seg, { x, y, z, caps: false });
/** an onion dome of base radius r, height h */
const onion = (P, M, r, h, x, y, z, seg = 16) => lathe(P, M.vc, [[r * 0.45, 0], [r * 0.7, h * 0.1], [r, h * 0.3], [r * 0.98, h * 0.48], [r * 0.7, h * 0.68], [r * 0.34, h * 0.86], [r * 0.06, h]], seg, { x, y, z, caps: false });
/** an arched dark window with a white archivolt on the +z plane of the current frame */
function arch(P, M, cx, y0, w, h, z, trim = WHITE) {
  const shape = (ww, hh, off) => { const s = new THREE.Shape(), r = ww / 2; s.moveTo(cx - r, y0 - off); s.lineTo(cx + r, y0 - off); s.lineTo(cx + r, y0 + hh); s.absarc(cx, y0 + hh, r, 0, Math.PI, false); s.lineTo(cx - r, y0 - off); return s; };
  P.tint(trim); P.face(M.vc, shape(w + 0.34, h, 0), z, 1, 8);
  P.tint('#2a2e33'); P.face(M.vc, shape(w, h - 0.17, 0), z + 0.012, 1, 8);
}
/** a column with a base and a capital block */
function column(P, M, x, z, y0, y1, r, col = WHITE, corinthian = false) {
  P.tint(col); P.box(M.vc, x - r * 1.3, x + r * 1.3, y0, y0 + 0.2, z - r * 1.3, z + r * 1.3, 'b'); P.col(M.vc, x, z, y0 + 0.2, y1 - 0.3, r, r * 0.88, 14, false);
  P.box(M.vc, x - r * 1.35, x + r * 1.35, y1 - 0.3, y1, z - r * 1.35, z + r * 1.35, 'b');
  if (corinthian) { P.tint('#dfdbcf'); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; P.box(M.vc, x + Math.cos(a) * r * 1.05 - 0.05, x + Math.cos(a) * r * 1.05 + 0.05, y1 - 0.5, y1 - 0.28, z + Math.sin(a) * r * 1.05 - 0.05, z + Math.sin(a) * r * 1.05 + 0.05, 'b'); } }
}

const wallsOf = (P, M, F, ring, h, col) => { P.tint(col); prism(P, M.vc, toLocal(F, ring), 0, h, { top: false }); };
const addColliders = (ctx, b, h) => { const poly = b.polys[0]; if (ctx.physics) addPolyColliders(ctx, poly, 0, h, 0.8); };
const ringOf = (b) => { const o = b.polys[0].o, r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]); return r; };

// ------------------------------------------------------------------------------------------------ the four churches
const CHURCHES = [
  {
    id: 'w111944528', key: 'armenian', name: 'Армянская церковь Св. Воскресения Христова', pref: 'long', h: 14.5,
    build(P, M, F) {
      const OCH = '#e8d276', ROOF = '#6f757a', Wd = F.W, D = F.D;                         // 25.5 x 11.8: wings 8 m deep, the centre block 12.4 m wide with a portico at each end
      void Wd;
      P.tint(OCH);
      const ring = toLocal(F, ringOfCache.get('w111944528')); prism(P, M.vc, ring, 0, 5.4, { top: false });
      // the centre block rises higher: a cross gable (ridge along z) with pediments front and back, the wings have low gable roofs (ridge along x)
      const cw = 6.2, wz = 4.0, zf = D / 2, ze = 7.6;
      P.box(M.vc, -cw, cw, 5.4, ze, -zf + 0.0, zf, 'b');
      P.tint(ROOF); gable(P, M.vc, -F.W / 2, -cw + 0.2, -wz, wz, 5.4, 7.2, 0.5); gable(P, M.vc, cw - 0.2, F.W / 2, -wz, wz, 5.4, 7.2, 0.5);
      gable(P, M.vc, -cw, cw, -zf, zf, ze, 9.6, 0.4, true);
      // the drum: an octagon with a shallow dome and a cross
      P.tint(OCH); prism(P, M.vc, Array.from({ length: 8 }, (_, i) => [Math.cos(i / 8 * Math.PI * 2 + Math.PI / 8) * 4.3, Math.sin(i / 8 * Math.PI * 2 + Math.PI / 8) * 4.3]), 8.6, 10.6, { top: false });
      P.tint(WHITE); P.box(M.vc, -4.7, 4.7, 10.6, 10.85, -4.7, 4.7, 'b');
      P.tint(ROOF); dome(P, M, 4.4, 1.5, 0, 10.85, 0, 24);
      cross(P, M, 0, 12.2, 0, 1.6);
      // the front portico: two free columns, two pilasters, an entablature and a pediment with a sunburst
      const z0 = zf, pw = 4.6;
      for (const sx of [-1, 1]) { P.tint(WHITE); P.box(M.vc, sx * pw - 0.4, sx * pw + 0.4, 0, ze - 0.8, z0 - 0.3, z0 + 0.1, 'b'); column(P, M, sx * 2.0, z0 + 1.4, 0, ze - 0.8, 0.38); }
      P.tint(WHITE); P.box(M.vc, -pw - 0.5, pw + 0.5, ze - 0.8, ze, z0 - 0.4, z0 + 1.9, 'b');
      P.tint(OCH); pediment(P, M.vc, 0, z0 + 1.9, 2 * pw + 1.2, ze, 9.7, 1.0, null);
      P.tint(WHITE); for (let i = 0; i < 13; i++) { const a = -Math.PI / 2 + (i - 6) * 0.2; P.box(M.vc, Math.sin(a) * 0.0 - 0.02 + Math.sin(a) * 1.2, Math.sin(a) * 1.2 + 0.02, 8.2, 8.3, z0 + 1.95, z0 + 1.96, 'b'); void a; }
      P.tint('#6b3f2a'); const door = new THREE.Shape(); door.moveTo(-0.9, 0); door.lineTo(0.9, 0); door.lineTo(0.9, 2.4); door.absarc(0, 2.4, 0.9, 0, Math.PI, false); door.lineTo(-0.9, 0); P.face(M.vc, door, z0 + 0.12, 1, 8);
      // arched windows on the wings and the centre block
      for (const x of [-10.2, -7.6, 7.6, 10.2]) arch(P, M, x, 1.7, 1.0, 2.2, wz + 0.01);
      for (const x of [-10.2, -7.6, 7.6, 10.2]) { P.push(0, 0, 0, Math.PI); arch(P, M, -x, 1.7, 1.0, 2.2, wz + 0.01); P.pop(); }
      for (const s of [-1, 1]) { P.push(0, 0, 0, s * Math.PI / 2); arch(P, M, 0, 2.6, 1.2, 2.8, 6.2 + 0.01); P.pop(); }
      // the back portico of the centre block: pilasters and the apse door
      P.tint(WHITE); P.push(0, 0, 0, Math.PI); for (const sx of [-1, 1]) P.box(M.vc, sx * pw - 0.4, sx * pw + 0.4, 0, ze - 0.8, zf - 0.3, zf + 0.1, 'b'); P.box(M.vc, -pw - 0.5, pw + 0.5, ze - 0.8, ze, zf - 0.3, zf + 0.15, 'b'); P.pop();
      P.tint('#5d6063'); P.box(M.vc, -6.5, 6.5, 0, 0.5, -zf - 0.04, zf + 0.04, 'b');                             // plinth line
    },
  },
  {
    id: 'w114538182', key: 'spyridon', name: 'Часовня Св. Спиридона Тримифунтского', pref: 'long', h: 10.5,
    build(P, M, F) {
      const WALL = '#e6d088', R = 4.4, H = 6.2;
      // the rotunda with three pedimented porticos (an arm is built where the footprint reaches beyond the rotunda)
      P.tint(WALL); P.col(M.vc, 0, 0, 0, H, R, R, 24, false);
      P.tint('#cdb774'); for (let k = 0; k < 6; k++) P.col(M.vc, 0, 0, 0.6 + k * 0.9, 0.78 + k * 0.9, R + 0.02, R + 0.02, 24, false);                        // rustication bands low on the wall
      P.tint(WHITE); P.col(M.vc, 0, 0, H, H + 0.5, R + 0.45, R + 0.45, 24, true);                                                                  // the cornice
      P.tint('#aeb4b9'); lathe(P, M.vc, [[3.9, H + 0.5], [3.9, H + 1.3], [3.2, H + 1.4]], 20, { caps: false });
      P.tint('#cfd5d9'); dome(P, M, 3.7, 2.6, 0, H + 1.3, 0, 24); P.tint('#c4cacd'); P.col(M.vc, 0, 0, H + 3.8, H + 4.5, 0.55, 0.45, 12, true); P.tint(GOLD); P.col(M.vc, 0, 0, H + 4.5, H + 4.8, 0.22, 0.02, 8, true);
      cross(P, M, 0, H + 4.8, 0, 1.4);
      for (let k = 0; k < 4; k++) { P.push(0, 0, 0, Math.PI / 4 + k * Math.PI / 2); arch(P, M, 0, 1.5, 1.1, 2.6, R - 0.02); P.pop(); }                      // arched windows on the diagonals between the porticos
      const arms = [[0, 1], [1, 0], [-1, 0], [0, -1]].filter(([dx, dz]) => { const ext = dz ? (dz > 0 ? F.z1 : -F.z0) : (dx > 0 ? F.x1 : -F.x0); return ext > R + 1.2; });
      for (const [dx, dz] of arms) {
        P.push(0, 0, 0, Math.atan2(dx, dz));
        const pz = R + 0.2, pd = F.__armDepth || 2.5, hw = 2.9;
        P.tint(WALL); P.box(M.vc, -hw, hw, 0, H - 0.6, R - 0.6, pz + 0.3, 'b');
        for (const sx of [-1, 1]) { column(P, M, sx * (hw - 0.4), pz + pd - 0.4, 0, H - 0.6, 0.3, WHITE, true); column(P, M, sx * (hw - 1.3), pz + pd - 0.4, 0, H - 0.6, 0.3, WHITE, true); }
        P.tint(WHITE); P.box(M.vc, -hw - 0.2, hw + 0.2, H - 0.6, H + 0.1, R - 0.5, pz + pd + 0.2, 'b');
        P.tint(WALL); pediment(P, M.vc, 0, pz + pd + 0.2, 2 * hw + 0.4, H + 0.1, H + 1.9, 0.8, WHITE);
        P.tint('#a9783f'); const d = new THREE.Shape(); d.moveTo(-0.7, 0); d.lineTo(0.7, 0); d.lineTo(0.7, 2.2); d.absarc(0, 2.2, 0.7, 0, Math.PI, false); d.lineTo(-0.7, 0); P.face(M.vc, d, pz + 0.31, 1, 8);
        P.tint('#e9e3d0'); P.cyl(M.vc, [0, 4.3, pz + 0.31], [0, 4.3, pz + 0.37], 0.5, 0.5, 16, true);                                                 // the relief medallion
        P.pop();
      }
    },
  },
  {
    id: 'w216877738', key: 'magdalene', name: 'Храм Св. Марии Магдалины при детской больнице', pref: 'long', h: 10.0,
    build(P, M, F) {
      const OCH = '#d9a841', W = F.W, D = F.D;
      P.tint('#b8ae95'); P.box(M.vc, -W / 2, W / 2, 0, 1.1, -D / 2, D / 2, 'b');                                         // the rusticated stone base
      P.tint(OCH); prism(P, M.vc, toLocal(F, ringOfCache.get('w216877738')), 1.1, 4.2, { top: false });
      P.tint('#e4e2dc'); P.box(M.vc, -W / 2 - 0.05, W / 2 + 0.05, 4.2, 4.9, -D / 2 - 0.05, D / 2 + 0.05, 'b');           // the white frieze (Greek key) under the eaves
      P.tint('#9ea0a2'); for (let i = 0; i < 18; i++) P.box(M.vc, -W / 2 + 0.4 + i * (W - 0.8) / 18, -W / 2 + 0.4 + i * (W - 0.8) / 18 + 0.32, 4.28, 4.8, D / 2 + 0.0, D / 2 + 0.07, 'b');
      P.tint(OCH); P.box(M.vc, -W * 0.38, W * 0.38, 4.9, 7.0, -D * 0.34, D * 0.34, 'b');                                 // the raised upper volume
      P.tint('#6a8a5e'); gable(P, M.vc, -W * 0.38, W * 0.38, -D * 0.34, D * 0.34, 7.0, 8.2, 0.35);
      P.tint(OCH); P.fan(M.vc, [[-W * 0.38, 7.0, D * 0.34 + 0.01], [W * 0.38, 7.0, D * 0.34 + 0.01], [0, 8.1, D * 0.34 + 0.01]], [0, 0, 1]);
      P.tint('#e4e2dc'); P.cyl(M.vc, [0, 7.3, D * 0.34 + 0.02], [0, 7.3, D * 0.34 + 0.1], 0.5, 0.5, 14, true);
      P.tint('#6b3f2a'); P.box(M.vc, -0.95, 0.95, 1.1, 3.4, D / 2 - 0.02, D / 2 + 0.08, 'b');                             // the double door
      P.tint('#3a2a1c'); for (const x of [-3.6, 3.6]) P.box(M.vc, x - 0.8, x + 0.8, 2.6, 3.7, D / 2 - 0.02, D / 2 + 0.05, 'b');
      P.tint('#4f7f58'); P.col(M.vc, 0, 0, 8.0, 9.0, 0.7, 0.65, 12, true); P.tint('#d8b04a'); onion(P, M, 0.9, 1.5, 0, 9.0, 0); P.tint(GOLD); cross(P, M, 0, 10.4, 0, 1.2);
    },
  },
  {
    id: 'w207939781', key: 'alexander', name: 'Часовня Св. Александра Невского', pref: 'long', h: 9.0,
    build(P, M, F) {
      const BR = '#9a4a3a', BR2 = '#823c2e', W = F.W, D = F.D;
      P.tint(BR); prism(P, M.vc, toLocal(F, ringOfCache.get('w207939781')), 0, 4.4, { top: false });
      P.tint(BR2); P.box(M.vc, -W / 2 - 0.1, W / 2 + 0.1, 0, 0.5, -D / 2 - 0.1, D / 2 + 0.1, 'b');
      for (let i = 0; i < 8; i++) { const x = -W / 2 + 0.4 + i * (W - 0.8) / 7; P.tint('#b05a46'); P.box(M.vc, x - 0.22, x + 0.22, 3.9, 4.3, D / 2, D / 2 + 0.1, 'b'); }          // the kokoshnik band
      P.tint('#e0d8c8'); P.box(M.vc, -W / 2 - 0.1, W / 2 + 0.1, 4.4, 4.6, -D / 2 - 0.1, D / 2 + 0.1, 'b');
      // the hipped green roof, the drum and the onion with a cross
      P.tint('#5f7f66'); frustumBox(P, M.vc, W / 2 + 0.3, D / 2 + 0.3, 0.45, 0.45, 4.6, 7.3);
      P.tint('#8a4a3a'); P.col(M.vc, 0, 0, 7.3, 8.1, 0.5, 0.5, 10, true); P.tint('#6a8a6a'); onion(P, M, 0.62, 1.2, 0, 8.1, 0, 12); cross(P, M, 0, 9.3, 0, 1.1);
      // the entrance niche: an arched recess with a dark inner arch and two small relief crosses
      P.tint('#b05a46'); const a1 = new THREE.Shape(); a1.moveTo(-1.1, 0.5); a1.lineTo(1.1, 0.5); a1.lineTo(1.1, 2.7); a1.absarc(0, 2.7, 1.1, 0, Math.PI, false); a1.lineTo(-1.1, 0.5); P.face(M.vc, a1, D / 2 + 0.01, 1, 8);
      P.tint('#6a3a2a'); const a2 = new THREE.Shape(); a2.moveTo(-0.75, 0.5); a2.lineTo(0.75, 0.5); a2.lineTo(0.75, 2.6); a2.absarc(0, 2.6, 0.75, 0, Math.PI, false); a2.lineTo(-0.75, 0.5); P.face(M.vc, a2, D / 2 + 0.03, 1, 8);
      P.tint('#6a3a2a'); for (const s of [-1, 1]) { P.box(M.vc, s * 1.45 - 0.04, s * 1.45 + 0.04, 1.3, 2.3, D / 2, D / 2 + 0.05, 'b'); P.box(M.vc, s * 1.45 - 0.22, s * 1.45 + 0.22, 1.85, 1.93, D / 2, D / 2 + 0.05, 'b'); }
    },
  },
];
const ringOfCache = new Map();

export function build(K) {
  const { ctx, M, root, svc } = K, L = ctx.L;
  for (const c of CHURCHES) {
    if (!K.ids.has(c.id)) continue;
    try {
      const b = L.buildingById(c.id); if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksVOStatues] church footprint missing: ' + c.id); continue; }
      const ring = ringOf(b); ringOfCache.set(c.id, ring);
      const F = frameOf(L, ring, c.pref);
      const geo = (P) => { P.push(0, 0, 0, 0); c.build(P, M, F); P.pop(); };
      // build in the local frame, put at the OBB centre turned by the frame rotation
      const set = geosOf(geo);
      put(root, set, F.cx, 0, F.cz, F.rot, 1, 'vos-' + c.key);
      addColliders(ctx, b, c.h * 0.9);
      svc.triangles += set.tris; svc.parts[c.key] = { tris: set.tris, id: c.id, yaw: F.rot, x: F.cx, z: F.cz, probe: F.D / 2 + 3.5 };
      svc.monuments.push({ id: c.id, name: c.name, x: F.cx, z: F.cz, h: c.h });
      svc.drawn.push(c.id);
    } catch (e) { console.error('[landmarksVOStatues] church ' + c.key + ' failed:', e); svc.failed.push(c.key + ': ' + (e && e.stack || e)); }
  }
}
