// landmarksH/porticos.js - the porticoes of the Admiralty and the two Neva pavilions.
//   garden porticoes   a +-(130..168), b -14.8: a rusticated block 5.2 m high, a terrace with a balustrade, 8 smooth Doric columns (11 m, R 0.72) in front of the glazed wall, entablature to 19.4 m and an
//                      attic with white panels (photos 001 004; the dossier's "6 columns on the front" was read on an oblique photo: 8 with a 5.1 m pitch fit the 38 m OSM width)
//   flank porticoes    b 53..93 on both outer wings, projecting 6 m, the same order under a PEDIMENT (photo 001: pedimented block on the east face)
//   Neva pavilions     wing ends b 133..158: the arch block (arch r 4.8, archivolt r 7.2, two Glories, laurel wreaths) between two loggias of 5 columns, the red-roofed cornice, the yellow brick drum with
//                      a railing round its foot, the grey cone and a bronze group of dolphins (the flagstaff is omitted: no flags); photos 025 004 019.
import * as THREE from 'three';
import { band } from './kit.js';
import { TX, TZ, ROT, W } from './frame.js';
import { ellip } from './sculpt.js';

const rectEdges = (x0, x1, z0, z1) => [
  { a: [x0, z1], b: [x1, z1], n: [0, 1] }, { a: [x1, z1], b: [x1, z0], n: [1, 0] }, { a: [x1, z0], b: [x0, z0], n: [0, -1] }, { a: [x0, z0], b: [x0, z1], n: [-1, 0] },
].map((e) => ({ ...e, len: Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) }));

/** base elevation of one face in its own frame (x right, z out): granite foot, ochre rustication, string course */
function baseFace(K, M, len, o = {}) {
  const P = K.P;
  P.box(M.granite, 0, len, 0, 1.0, 0, 0.14, 'kb', 1.0);
  K.wallQuad(M.rust, 0, len, 1.0, 4.6, 2.4, 0, 1.1);
  P.box(M.white, 0, len, 4.6, 5.2, 0, 0.3, 'kb');
  if (len > 5) for (const x of K.bays(1.6, len - 1.6, 4.35)) {
    K.window({ x, y: 1.25, w: 1.3, h: 2.45, head: 'arch', sw: 0.16, d: 0.08, sill: false, frame: 'brown', surMat: M.white });
    P.box(M.white, x - 0.3, x + 0.3, 3.5, 4.45, 0, 0.13, 'kb');
  }
}

/** one portico in its local frame: x across (+-hw), z from the wall (0) out to the front (D). ped = pedimented */
function portico(K, ctx, M, H, o) {
  const P = K.P, { hw, D, ped } = o;
  const Hb = 5.2, Hc = 16.2;
  // ---- the rusticated block: front + both sides, terrace on top
  P.push(-hw, 0, D, 0); baseFace(K, M, 2 * hw); P.pop();
  P.push(hw, 0, D, Math.PI / 2); baseFace(K, M, D); P.pop();
  P.push(-hw, 0, 0, -Math.PI / 2); baseFace(K, M, D); P.pop();
  P.quad(M.graniteLight, [-hw, Hb, D], [hw, Hb, D], [hw, Hb, 0], [-hw, Hb, 0], [0, 1, 0], [[-hw / 3, D / 3], [hw / 3, D / 3], [hw / 3, 0], [-hw / 3, 0]]);
  // ---- the rear wall (the glazed wall behind the columns): ochre with two rows of tall windows
  K.wallQuad(M.wall, -hw, hw, Hb, 19.4, 3, 0);
  const wx = [];
  const n = Math.round(2 * hw / 4.35); for (let i = 0; i < n; i++) wx.push(-hw + (i + 0.5) * 2 * hw / n);
  for (const x of wx) {
    K.window({ x, y: Hb + 1.0, w: 1.5, h: 4.6, head: 'arch', sw: 0.16, d: 0.1, sill: false, frame: 'brown', surMat: M.white });
    K.window({ x, y: 12.6, w: 1.4, h: 2.8, head: 'flat', sw: 0.16, d: 0.1, sill: true, frame: 'brown', surMat: M.white });
  }
  // ---- terrace balustrade along the front and the sides
  const bal = (x0, x1, z, rot) => { P.push(0, 0, 0, 0); K.balustrade(x0, x1, Hb, 0.95, 0.24, M.white); P.pop(); void z; void rot; };
  P.push(0, 0, D - 0.9, 0); K.balustrade(-hw + 0.3, hw - 0.3, Hb, 0.95, 0.24, M.white); P.pop();
  P.push(hw - 0.9, 0, D - 0.6, Math.PI / 2); K.balustrade(0.4, D - 1.2, Hb, 0.95, 0.24, M.white); P.pop();
  P.push(-hw + 0.9, 0, D - 0.6, -Math.PI / 2); K.balustrade(-D + 1.2, -0.4, Hb, 0.95, 0.24, M.white); P.pop();
  void bal;
  // ---- columns: 8 on the front line, one in the middle of each side
  const cz = D - 1.5, cx0 = hw - 2.3, cols = [];
  for (let i = 0; i < 8; i++) cols.push([-cx0 + i * 2 * cx0 / 7, cz]);
  cols.push([-cx0, cz - 3.0], [cx0, cz - 3.0]);
  for (const [x, z] of cols) { K.column(M.white, x, z, Hb, Hc, 0.72, { capH: 1.15, seg: 12, volutes: false }); const [wx0, wz0] = o.toWorld(x, z); ctx.physics.addCylinder(wx0, wz0, 0.8, Hb - 0.1, Hc); }
  // ---- entablature: architrave 16.2-17.1, frieze (wall) 17.1-18.0, mutules 18.0-18.5, corona 18.5-19.4
  const E = rectEdges(-hw + 0.35, hw - 0.35, 0, D - 0.4);
  const draw = (e) => e.n[1] !== -1;
  band(P, E, Hc, 17.1, 0.15, { front: M.white, top: M.white, under: M.whiteShade }, { draw });
  band(P, E, 17.1, 18.0, 0.0, { front: M.frieze2 || M.wallPale, top: null, under: null }, { draw });
  band(P, E, 18.0, 18.5, 0.75, { front: M.mutule, top: null, under: M.whiteShade }, { draw, uvs: 0.5 });
  band(P, E, 18.5, 19.4, 1.15, { front: M.white, top: M.white, under: M.whiteShade }, { draw });
  const hx = hw - 0.35, zf = D - 0.4;
  P.quad(M.white, [-hx, 19.4, zf], [hx, 19.4, zf], [hx, 19.4, 0.2], [-hx, 19.4, 0.2], [0, 1, 0]);                  // the roof of the entablature inside its outline
  P.quad(M.whiteShade, [-hx, Hc, zf], [hx, Hc, zf], [hx, Hc, 0.2], [-hx, Hc, 0.2], [0, -1, 0]);                      // its ceiling over the colonnade
  if (!ped) {
    // attic with white panels
    P.box(M.wall, -hx + 0.5, hx - 0.5, 19.4, 21.0, 0.3, zf - 0.5, 'b');
    for (let i = 0; i < 9; i++) { const x = -hx + 1.5 + i * (2 * hx - 3) / 8; P.box(M.white, x - 0.8, x + 0.8, 19.9, 20.7, zf - 0.55, zf - 0.47, 'kb'); }
    band(P, rectEdges(-hx + 0.5, hx - 0.5, 0.3, zf - 0.5), 20.7, 21.0, 0.3, { front: M.white, top: M.white, under: M.whiteShade }, { draw });
    P.box(M.roofTex, -hx + 0.5, hx - 0.5, 20.98, 21.0, 0.3, zf - 0.5, 'b');
  } else {
    // pediment: tympanum (ochre with cream relief), raking cornices, red roof
    const rise = 3.9, y0 = 19.4;
    P.fan(M.wall, [[-hx, y0, zf], [hx, y0, zf], [0, y0 + rise, zf]], [0, 0, 1]);
    P.fan(M.wall, [[hx, y0, 0.3], [-hx, y0, 0.3], [0, y0 + rise, 0.3]], [0, 0, -1]);
    for (const s of [-1, 1]) {
      const ang = Math.atan2(rise, hx), len = Math.hypot(hx, rise) + 0.4;
      P.geo(M.white, new THREE.BoxGeometry(len, 0.55, 1.5), s * hx / 2, y0 + rise / 2 + 0.1, zf + 0.6, 0, 0, -s * ang);
      P.quad(M.roofTex, [s * (hx + 0.6), y0 - 0.05, zf + 1.0], [0, y0 + rise + 0.18, zf + 1.0], [0, y0 + rise + 0.18, 0.3], [s * (hx + 0.6), y0 - 0.05, 0.3], [0, 1, 0], [[0, 0], [1, 0], [1, 4], [0, 4]]);
    }
    for (let i = 0; i < 7; i++) { const x = -hx * 0.7 + i * hx * 1.4 / 6, h = 1.0 + 1.2 * (1 - Math.abs(x) / hx); P.cyl(M.cream, [x, y0 + 0.1, zf - 0.02], [x, y0 + 0.1 + h, zf - 0.02], 0.35, 0.25, 6, true); }
  }
}

export function buildPorticos(K, ctx, H) {
  const P = K.P, M = H.M;
  // garden porticoes (model frame: X = a, Z = -b): east centre a = 149, west a = -149; wall plane b = -7.7 -> Z = 7.7; the portico projects to Z = 14.8
  for (const s of [1, -1]) {
    const cx = s * 149, z0 = 7.7;
    P.push(cx, 0, z0, 0);
    const toWorld = (x, z) => W(cx + x, -(z0 + z));
    portico(K, ctx, M, H, { hw: 19, D: 7.1, ped: false, toWorld });
    P.pop();
  }
  // flank porticoes: east outer wing a = 202.2 -> out +X (rot +PI/2), b 55.75..93; west outer wing a = -202.0 -> out -X, b 52.5..90.4
  for (const [s, wallA, bc] of [[1, 202.2, 74.4], [-1, -202.0, 71.45]]) {
    P.push(wallA, 0, -bc, s * Math.PI / 2);
    const toWorld = (x, z) => W(wallA + s * z, -(-bc - s * x * -1) * 1);                 // local x -> -Z * s ... resolved numerically below
    const rot = s * Math.PI / 2, c = Math.cos(rot), sn = Math.sin(rot);
    const tw = (x, z) => { const X = wallA + x * c + z * sn, Zm = -bc + (-x * sn + z * c); return W(X, -Zm); };
    portico(K, ctx, M, H, { hw: 18.7, D: 6.1, ped: true, toWorld: tw });
    P.pop();
    void toWorld;
  }
  for (const s of [1, -1]) pavilion(K, ctx, M, H, s * 176.0, 155.2);
}

/** a Neva pavilion: local frame x across (as seen from the Neva), z out of the wall plane towards the river (b increases); origin at a = `a`, b = `b0` */
function pavilion(K, ctx, M, H, a, b0) {
  const P = K.P, T = THREE;
  const Z0 = -b0;                                             // model Z of the wall plane
  P.push(a, 0, Z0, Math.PI);
  const hw = 29, AW = 11.5;                                    // overall half width, half width of the arch block
  const RIN = 4.8, ROUT = 7.2, SPR = 4.8, TOP = 17.4;
  // ---- the arch block (projects 1.6 m): rustication, smooth wall with the arch notch, archivolt, Glories
  P.push(0, 0, 1.6, 0);
  for (const [x0, x1] of [[-AW, -RIN], [RIN, AW]]) {
    P.box(M.granite, x0, x1, 0, 1.0, 0, 0.14, 'kb', 1.0); K.wallQuad(M.rust, x0, x1, 1.0, SPR, 2.4, 0, 1.1);
    P.box(M.white, x0 - (x0 === -AW ? 0.2 : 0), x1 + (x1 === AW ? 0.2 : 0), SPR, SPR + 0.5, 0, 0.26, 'kb');
  }
  for (const sign of [-1,1]) {
    const x=sign*AW;
    P.quad(M.wall,[x,0,-1.6],[x,TOP,-1.6],[x,TOP,0],[x,0,0],[sign,0,0]);
  }
  const s = new T.Shape(); s.moveTo(-AW, SPR + 0.5); s.lineTo(-RIN, SPR + 0.5); s.lineTo(-RIN, SPR); s.absarc(0, SPR, RIN, Math.PI, 0, true); s.lineTo(RIN, SPR + 0.5); s.lineTo(AW, SPR + 0.5); s.lineTo(AW, TOP); s.lineTo(-AW, TOP); s.closePath();
  P.face(M.wall, s, 0, 3, 10);
  const ring = new T.Shape(); ring.moveTo(RIN, SPR); ring.lineTo(ROUT, SPR); ring.absarc(0, SPR, ROUT, 0, Math.PI, false); ring.lineTo(-RIN, SPR); ring.absarc(0, SPR, RIN, Math.PI, 0, true); ring.closePath();
  P.extrude(M.white, ring, 0, 0.3, 1, 24);
  for (let i = 0; i < 20; i++) {
    const a0 = Math.PI * i / 20 + 0.012, a1 = Math.PI * (i + 1) / 20 - 0.012, r0 = RIN + 0.04, r1 = ROUT - 0.04, p = (an, r) => [Math.cos(an) * r, SPR + Math.sin(an) * r, 0.32];
    P.quad(M.wall, p(a0, r0), p(a1, r0), p(a1, r1), p(a0, r1), [0, 0, 1]);
  }
  for (const sx of [-1, 1]) P.quad(H.glory, [sx * 3.0 - sx * 2.6, 10.9, 0.07], [sx * 3.0 + sx * 2.6, 10.9, 0.07], [sx * 3.0 + sx * 2.6, 13.4, 0.07], [sx * 3.0 - sx * 2.6, 13.4, 0.07], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.pop();
  // the brick arch tunnel (closed by an iron gate 8 m in)
  {
    const r = RIN - 0.3, seg = 16;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg, mid = (a0 + a1) / 2, nn = [-Math.cos(mid), -Math.sin(mid), 0];
      const q = (an, z) => [Math.cos(an) * r, SPR + Math.sin(an) * r, z];
      P.quad(H.brick, q(a0, 1.6), q(a1, 1.6), q(a1, -7), q(a0, -7), nn, [[i / seg * 3, 0], [(i + 1) / seg * 3, 0], [(i + 1) / seg * 3, 3], [i / seg * 3, 3]]);
    }
    for (const sx of [-1, 1]) P.quad(H.brick, [sx * r, 0, 1.6], [sx * r, 0, -7], [sx * r, SPR, -7], [sx * r, SPR, 1.6], [-sx, 0, 0], [[0, 0], [2, 0], [2, 1.5], [0, 1.5]]);
    P.box(M.iron, -r, r, 0, SPR + r, -7.05, -6.95, '');
  }
  // ---- the two loggias: recessed wall (z = 0) with windows, columns at z = 3.4 in front, entablature
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? AW : -hw, x1 = sx > 0 ? hw : -AW;
    // Solid rusticated podium under the whole colonnade, including its exposed
    // ends. The OSM wing ends behind the authored loggia on the eastern bank.
    const back = a > 0 ? -3.0 : -.35, front = 4.18;
    P.box(M.granite,x0,x1,0,1.0,back,front,'b');
    P.box(M.rust,x0,x1,1.0,4.85,back,front,'bt',2.4);
    P.box(M.white,x0-.04,x1+.04,4.85,5.2,back,front+.06,'b');
    const [cx,cz]=W(a-(x0+x1)/2,b0+(front+back)/2);
    ctx.physics.addWalkBox(cx,cz,x1-x0,front-back,ROT,5.2,0);
    // Close the return where the window wall meets the surveyed side wall.
    const outside = sx*hw;
    P.box(M.wall, outside-.12,outside+.12,5.18,17.9,back,0,'b');
    K.wallQuad(M.wall, x0, x1, 5.2, 17.9, 3, 0);
    const n = 5, px0 = sx * (AW + 1.7), px1 = sx * (hw - 1.8);
    for (let i = 0; i < n; i++) {
      const x = px0 + (px1 - px0) * i / (n - 1);
      if (i < n - 1) K.window({ x: x + (px1 - px0) / (n - 1) / 2, y: 6.3, w: 1.4, h: 3.8, head: 'flat', sw: 0.16, d: 0.1, sill: true, frame: 'brown', surMat: M.white });
      K.column(M.white, x, 3.2, 5.2, 14.2, 0.66, { capH: 1.0, seg: 12, volutes: false });
      const [wx, wz] = (() => { const c = Math.cos(Math.PI), sn = Math.sin(Math.PI); return W(a + (x * c + 3.2 * sn), -(Z0 + (-x * sn + 3.2 * c))); })();
      ctx.physics.addCylinder(wx, wz, 0.75, 5.0, 14.2);
    }
    K.balustrade(Math.min(x0, x1) + 0.6, Math.max(x0, x1) - 0.6, 5.2, 0.9, 0.24, M.white);
    P.box(M.white, x0, x1, 14.2, 15.1, 0.0, 3.9, 'k');
  }
  // entablature along the whole front (loggias z 3.9, block z 1.6 + 1.5 projection), cornice 15.1 - 17.4
  const E = [{ a: [-hw, 3.9], b: [hw, 3.9], n: [0, 1], len: 2 * hw }];
  band(P, E, 15.1, 16.2, 0.0, { front: M.wallPale, top: null, under: M.whiteShade }, { draw: () => true });
  band(P, E, 16.2, 16.7, 0.6, { front: M.mutule, top: null, under: M.whiteShade }, { draw: () => true, uvs: 0.5 });
  band(P, E, 16.7, 17.4, 1.0, { front: M.white, top: M.white, under: M.whiteShade }, { draw: () => true });
  // ---- the cube above the arch block: attic 17.4 - 20.4, wreaths, cap, roof ledge
  P.box(M.wall, -AW + 0.2, AW - 0.2, 17.4, 20.4, -14, 1.6, 'b');
  for (const sx of [-1, 1]) { P.geo(M.white, K.wreathGeo2 || (K.wreathGeo2 = new T.TorusGeometry(1, 0.13, 6, 18)), sx * 7.2, 18.9, 1.67, 0, 0, 0, 1.3, 1.3, 1.3); }
  band(P, [{ a: [-AW + 0.2, 1.6], b: [AW - 0.2, 1.6], n: [0, 1], len: 2 * AW - 0.4 }], 20.4, 21.1, 0.6, { front: M.white, top: M.white, under: M.whiteShade }, { draw: () => true });
  P.box(M.roofTex, -AW - 0.4, AW + 0.4, 21.05, 21.1, -14, 1.6, 'b');
  // ---- drum: yellow brick cylinder with a railing round its foot, grey cone, bronze group of dolphins
  const DR = 7.0, DY0 = 21.1;
  P.cyl(M.white, [0, DY0, -6], [0, DY0 + 0.6, -6], DR + 0.5, DR + 0.5, 28, true);
  P.cyl(M.wallPale, [0, DY0 + 0.6, -6], [0, DY0 + 6.2, -6], DR, DR, 28, true);
  P.cyl(M.white, [0, DY0 + 6.2, -6], [0, DY0 + 6.8, -6], DR + 0.5, DR + 0.5, 28, true);
  P.cyl(M.zinc, [0, DY0 + 6.8, -6], [0, DY0 + 8.3, -6], DR + 0.1, 2.0, 28, true);
  P.cyl(M.zinc, [0, DY0 + 8.3, -6], [0, DY0 + 9.0, -6], 2.0, 1.4, 16, true);
  for (let k = 0; k < 3; k++) {                                                                  // bronze dolphins + rock
    const an = k / 3 * Math.PI * 2;
    P.cyl(M.bronze, [Math.cos(an) * 0.4, DY0 + 9.0, -6 + Math.sin(an) * 0.4], [Math.cos(an) * 1.2, DY0 + 11.2, -6 + Math.sin(an) * 1.2], 0.35, 0.14, 6, true);
  }
  P.cyl(M.bronze, [0, DY0 + 9.0, -6], [0, DY0 + 10.4, -6], 0.55, 0.3, 8, true);
  K.railing(Array.from({ length: 25 }, (_, i) => [Math.cos(i / 24 * 6.2832) * (DR + 0.35), -6 + Math.sin(i / 24 * 6.2832) * (DR + 0.35)]), DY0 + 0.6, 0.9, true);
  P.pop();
}
