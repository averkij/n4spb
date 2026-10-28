// landmarksMining/ship.js - the museum icebreaker KRASIN (Armstrong Whitworth 1916-17, rebuilt in Wismar 1953-60), dossier docs/research/mining.md section 9 + 9.3b (critic-corrected heights and positions), photos refs/mining 61 62 63 64 65 66
// 69 71 72 75 88 91 92 94 and mining-critic 22 24 25 26 27.  Frame S of frame.js (X port = the quay side, Z = the bow, y = street level, waterline -3.4); the hull axis is X = +0.6 (the OSM outline is not symmetric), half beam 10.8
// (port edge +11.4, 0.4-1.5 m from the quay wall face X 11.8-12.9, never beyond +11.6).  Everything is built in the axis frame X' = X - 0.6.
//   HULL: lofted from stations every 2.4 m (half breadth from the OSM outline x 1.045), slate blue-grey plating `#3a3f4a` with butt straps, white waterline stripe, pale green boot-top (2 m amidships, 3.6 m at the bow flare),
//   raked stem, anchors at Z +45, lettering «КРАСИН» (centre Z +39, 1.0 m capitals), portholes every 3 m, open cream railing; SUPERSTRUCTURE all cream `#d6c8a2`: the bridge house (semicircular front R 8.5, apex Z +26, 4 tiers
//   to +13.8), the midship deckhouse (3 tiers to +11.2) under the ONE broad funnel (8.0 x 8.7 m, centre Z +1, top +18.7: cream, red band `#c4545a`, black cap), the lattice foremast (A-frame legs, platforms, yards, top +36),
//   the aft mast (+25), the aft crane tower and stern deckhouse, six lifeboats (orange, pitch 10.3 m: outer boats covered), davits, windlasses, bitts, mooring lines, the lettered gangway (S (21.4, 6.7) -> (9.3, 5.9), +4.5).
//   No flag at the stern, no hammer and sickle on the funnel (lead decision), no sounds.  Colliders: the hull (nobody boards), the gangway foot.
import * as THREE from 'three';
import { S as FS, SHIP, HT } from './frame.js';

const AX = SHIP.axis, WL = -3.4;
const HB = [[-50.8, 2.0], [-46, 3.0], [-42, 4.8], [-38, 6.3], [-34, 7.6], [-30, 8.9], [-26, 9.5], [-22, 10.1], [-18, 10.45], [-14, 10.55], [-10, 10.6], [-6, 10.7], [-2, 10.8], [2, 10.65], [6, 10.45], [10, 10.3], [14, 10.1], [18, 9.45], [22, 8.35], [26, 7.3], [30, 6.3], [34, 5.3], [38, 3.7], [42, 2.0], [46, 0.4], [49, 0]];
const hb = (Z) => {
  if (Z >= 49) return 0; if (Z <= HB[0][0]) return HB[0][1];
  for (let i = 0; i + 1 < HB.length; i++) if (Z <= HB[i + 1][0]) { const t = (Z - HB[i][0]) / (HB[i + 1][0] - HB[i][0]); return HB[i][1] + (HB[i + 1][1] - HB[i][1]) * t; }
  return 0;
};
const sm = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
/** deck level (the top of the plating) along the hull: 2.4 amidships, the forecastle rises to 3.6 at the bow; the stern deck 2.3 */
const deckY = (Z) => 2.4 + 1.2 * sm((Z - 6) / 43) - 0.1 * sm((-Z - 30) / 20);
/** height of the green boot-top above the waterline: 2.0 m amidships and aft, 3.6 m at the bow flare */
const bootH = (Z) => 2.0 + 1.6 * sm((Z - 14) / 32);
/** the half breadth of the hull at level y and station Z (the stem rakes back going down, the sides flare at the bow) */
function hbAt(Z, y) {
  const top = deckY(Z), t = Math.max(0, Math.min(1.6, (top - y) / (top - WL))), bowK = sm((Z - 8) / 40);
  const rake = 6.0 * Math.min(t, 1.3) * sm((Z - 24) / 24);
  const m = 1 - (0.05 + 0.16 * bowK) * Math.min(t, 1) - 0.5 * Math.max(0, t - 1);
  return hb(Z + rake) * Math.max(0.2, m);
}

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, tex = ctx.tex;
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMining/ship] ${name}:`, e); } };
  const cyl8 = new THREE.CylinderGeometry(1, 1, 1, 12), sph = new THREE.SphereGeometry(1, 10, 7), box = new THREE.BoxGeometry(1, 1, 1);
  const winTile = (key, pitch, ww = 0.9, wh = 0.62) => {
    const t = tex.draw(Math.round(64 * pitch), 64, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const x0 = (w - ww * 64) / 2, y0 = (h - wh * 64) / 2;
      g.fillStyle = '#e9e3cf'; g.fillRect(x0 - 3, y0 - 6, ww * 64 + 6, 5);
      g.fillStyle = '#2a2d33'; g.fillRect(x0, y0, ww * 64, wh * 64); g.fillStyle = '#5f7686'; g.fillRect(x0 + 2, y0 + 2, ww * 64 - 4, wh * 32 - 2); g.fillStyle = '#3d4d5a'; g.fillRect(x0 + 2, y0 + wh * 32 + 1, ww * 64 - 4, wh * 32 - 3);
    }, { key: 'lmMin-win' + key, repeat: [1, 1] });
    return ctx.mat.toon('#e0d4b0', { map: t, name: 'lmMin-win' + key, paint: 0.02 });
  };
  const wTop = winTile('Top', 1.57), wMid = winTile('Mid', 2.4), wDeck = winTile('Deck', 2.0, 0.9, 0.7);
  P.push(FS.x, 0, FS.z, FS.rot);
  P.push(AX, 0, 0, 0);                                                                    // X' = X - 0.6 from here on
  try {
    // ------------------------------------------------------------------------------------------ the hull
    const Zs = []; for (let z = -50.8; z < 49; z += 2.4) Zs.push(z); Zs.push(49);
    step('hull', () => {
      const lv = (Z) => [-6.0, WL, WL + bootH(Z), WL + bootH(Z) + 0.15, deckY(Z)];             // levels: bottom, waterline, top of the green, top of the white stripe, deck
      const mats = [M.boot, M.boot, M.waterline, M.hull];
      for (let i = 0; i + 1 < Zs.length; i++) {
        const Za = Zs[i], Zb = Zs[i + 1], la = lv(Za), lb = lv(Zb);
        for (const s of [1, -1]) for (let j = 0; j < 4; j++) {
          const a0 = hbAt(Za, la[j]), a1 = hbAt(Za, la[j + 1]), b0 = hbAt(Zb, lb[j]), b1 = hbAt(Zb, lb[j + 1]);
          if (a0 + a1 + b0 + b1 < 0.01) continue;
          const mat = mats[j], u0 = Za / 4.8, u1 = Zb / 4.8;
          const uv = j === 3 ? [[u0, la[j] / 2.4], [u1, lb[j] / 2.4], [u1, lb[j + 1] / 2.4], [u0, la[j + 1] / 2.4]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
          if (j === 3) P.quad(mat, [s * a0, la[j], Za], [s * b0, lb[j], Zb], [s * b1, lb[j + 1], Zb], [s * a1, la[j + 1], Za], [s, 0.2, 0], uv);
          else P.quad(mat, [s * a0, la[j], Za], [s * b0, lb[j], Zb], [s * b1, lb[j + 1], Zb], [s * a1, la[j + 1], Za], [s, 0.2, 0], uv);
        }
        // deck strip (planks)
        const ya = deckY(Za), yb = deckY(Zb), ha = hbAt(Za, ya) - 0.05, hbb = hbAt(Zb, yb) - 0.05;
        if (ha > 0.05 || hbb > 0.05) P.quad(Za > 20 ? M.deckFore : M.deckMat, [-ha, ya, Za], [ha, ya, Za], [hbb, yb, Zb], [-hbb, yb, Zb], [0, 1, 0], [[-ha / 2, Za / 2], [ha / 2, Za / 2], [hbb / 2, Zb / 2], [-hbb / 2, Zb / 2]]);
      }
      // the bottom and the transom
      P.quad(M.boot, [-hbAt(-50.8, -6), -6, -50.8], [hbAt(-50.8, -6), -6, -50.8], [hbAt(-50.8, deckY(-50.8)), deckY(-50.8), -50.8], [-hbAt(-50.8, deckY(-50.8)), deckY(-50.8), -50.8], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.hull, [-hbAt(Zs[0], WL + 2), WL + 2, -50.78], [hbAt(Zs[0], WL + 2), WL + 2, -50.78], [hbAt(Zs[0], deckY(-50.8)), deckY(-50.8), -50.78], [-hbAt(Zs[0], deckY(-50.8)), deckY(-50.8), -50.78], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // the lettering KRASIN (centre Z +39, 9 m long, 1.0 m capitals) on both sides, 4 straight pieces along the flared hull
      for (const s of [1, -1]) {
        const zs = s > 0 ? [43, 41, 37, 34].reverse() : [34, 37, 41, 43].reverse();
        const Zl = [34, 37.5, 41, 43.5], y0 = 1.9, y1 = 2.9;
        for (let k = 0; k + 1 < Zl.length; k++) {
          const za = Zl[k], zb = Zl[k + 1], xa = s * (hbAt(za, y0) + 0.02), xb = s * (hbAt(zb, y0) + 0.02), xa1 = s * (hbAt(za, y1) + 0.02), xb1 = s * (hbAt(zb, y1) + 0.02);
          const ua = (za - 34) / 9.5, ub = (zb - 34) / 9.5;
          const uv = s > 0 ? [[1 - ua, 0], [1 - ub, 0], [1 - ub, 1], [1 - ua, 1]] : [[ua, 0], [ub, 0], [ub, 1], [ua, 1]];
          P.quad(M.lettersWhite, [xa, y0, za], [xb, y0, zb], [xb1, y1, zb], [xa1, y1, za], [s, 0, 0], uv);
        }
        void zs;
      }
      // portholes every 3 m on the upper strake: a white rim and a dark glass, normal to the hull side
      for (const s of [1, -1]) for (let Z = -33; Z <= 37; Z += 3) {
        const y = 0.9, h0 = hbAt(Z, y), dZ = 0.5, sl = (hbAt(Z + dZ, y) - hbAt(Z - dZ, y)) / (2 * dZ), rot = -Math.atan(sl) * s;
        P.geo(M.waterline, cyl8, s * (h0 + 0.07), y, Z, 0, rot, Math.PI / 2, 0.24, 0.1, 0.24);
        P.geo(M.glassDark, cyl8, s * (h0 + 0.125), y, Z, 0, rot, Math.PI / 2, 0.17, 0.1, 0.17);
      }
      // two anchors in hawse pipes at Z +45 (black, flukes up)
      for (const s of [1, -1]) {
        const Z = 45, y = 1.2, x = s * (hbAt(Z, y) + 0.1);
        P.geo(M.anchor, box, x, y, Z, 0, 0, 0.0, 0.18, 2.2, 0.18); P.geo(M.anchor, box, x, y + 0.9, Z, 0, 0, 0, 0.18, 0.18, 1.1);
        for (const f of [-1, 1]) { P.geo(M.anchor, box, x, y - 0.8, Z + f * 0.55, 0.0, 0, 0.0, 0.16, 0.2, 1.0); P.geo(M.anchor, box, x, y - 0.95, Z + f * 0.9, 0, 0, 0, 0.16, 0.6, 0.18); }
      }
      // draught marks on the stem: a few white figures (a strip)
      // fenders: black rubber cylinders every 8 m between the hull and the quay wall (port side)
      for (let Z = -24; Z <= 12; Z += 8) P.cyl(M.fender, [11.0, -2.8, Z], [11.0, 1.0, Z], 0.25, 0.25, 8, true);
    });
    // ------------------------------------------------------------------------------------------ open railing along the deck edge (posts every 1.5 m, two rails) and the forecastle bulwark
    step('railing', () => {
      const seg = 1.5;
      for (const s of [1, -1]) {
        let prev = null;
        for (let Z = -49.5; Z <= 46; Z += seg) {
          const y = deckY(Z), x = s * (hbAt(Z, y) - 0.22);
          if (Math.abs(x) < 0.4) { prev = null; continue; }
          P.cyl(M.rail, [x, y, Z], [x, y + 1.1, Z], 0.025, 0.025, 4, false);
          if (prev) { for (const [dy, r] of [[1.1, 0.03], [0.6, 0.02]]) P.cyl(M.rail, [prev[0], prev[1] + dy, prev[2]], [x, y + dy, Z], r, r, 4, false); }
          prev = [x, y, Z];
        }
      }
      // the bow rail across the stem and the stern rail
      for (const Z of [-49.6, 44.4]) { const y = deckY(Z), x = hbAt(Z, y) - 0.22; if (x > 0.5) P.cyl(M.rail, [-x, y + 1.1, Z], [x, y + 1.1, Z], 0.03, 0.03, 4, false); }
    });
    // ------------------------------------------------------------------------------------------ the bridge house, deckhouses, funnel
    const cream = M.cream, win = (m, pts, n) => m && n;
    void win;
    step('house', () => {
      const R = 8.5, ZC = 17.5, yF = 3.4, yB = 2.2;                                          // yB = the foot of the walls: below the lowest deck (2.3), so no slit shows between the deck and the house
      const tiers = [yB, yF + 2.6, yF + 5.2, yF + 7.8, yF + 10.4];                         // 2.2 (3.4 = the tier floor) .. 13.8
      // the straight sides Z 10 .. 17.5 and the semicircular front (apex Z +26), 4 tiers, windows on tiers 2 .. 4
      const arc = []; const NA = 16; for (let k = 0; k <= NA; k++) { const a = Math.PI * k / NA; arc.push([Math.cos(a) * R, ZC + Math.sin(a) * R]); }   // from +X' (port) over the bow to -X' (starboard)
      const ring = [[R, 10], ...arc, [-R, 10]];
      const wallQuad = (a, b, y0, y1, mat, off = 0, uv0 = 0, uv1 = 1, v0 = y0 / 2.6, v1 = y1 / 2.6) => {
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, n = [dz / l, -dx / l];
        const nn = (n[0] * (a[0] + b[0]) / 2 + n[1] * ((a[1] + b[1]) / 2 - ZC) < 0) ? [-n[0], -n[1]] : n;              // outward
        const ox = nn[0] * off, oz = nn[1] * off;
        P.quad(mat, [a[0] + ox, y0, a[1] + oz], [b[0] + ox, y0, b[1] + oz], [b[0] + ox, y1, b[1] + oz], [a[0] + ox, y1, a[1] + oz], [nn[0], 0, nn[1]], [[uv0, v0], [uv1, v0], [uv1, v1], [uv0, v1]]);
      };
      const mats = [null, wDeck, wMid, wTop];
      for (let t = 0; t < 4; t++) {
        let acc = 0;
        for (let i = 0; i + 1 < ring.length; i++) {
          const a = ring[i], b = ring[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
          wallQuad(a, b, tiers[t], tiers[t + 1], cream, 0, acc / 4, (acc + l) / 4);
          // the window strip: one row per tier (a 1.0 m high strip 0.8 m above the tier floor); tier 1 carries portholes instead (below)
          if (t > 0 && mats[t]) { const pitch = t === 3 ? 1.57 : t === 2 ? 2.4 : 2.0; wallQuad(a, b, tiers[t] + 0.8, tiers[t] + 1.8, mats[t], 0.03, acc / pitch, (acc + l) / pitch, 0, 1); }
          acc += l;
        }
        if (t === 3) P.fan(cream, ring.map((p) => [p[0], tiers[4], p[1]]), [0, 1, 0], (p) => [p[0] / 3, p[2] / 3]);
      }
      // the aft face of the bridge house and the portholes of tier 1
      P.quad(cream, [R, tiers[0], 10], [-R, tiers[0], 10], [-R, tiers[4], 10], [R, tiers[4], 10], [0, 0, -1], [[0, 0], [4, 0], [4, 4], [0, 4]]);
      for (let k = 1; k < NA; k++) { const a = Math.PI * k / NA, x = Math.cos(a) * (R + 0.03), z = ZC + Math.sin(a) * (R + 0.03); P.geo(M.glassDark, cyl8, x, yF + 1.5, z, 0, 0, Math.PI / 2, 0.22, 0.04, 0.22); }
      // the bridge wings: a ring of narrow balconies with cream rails round tier 3 and 4 is suggested by a rail line on the roof of tier 3; the rail round the roof
      for (const [yy, rr] of [[tiers[4], R + 0.15]]) { let pv = null; for (let k = 0; k <= NA; k++) { const a = Math.PI * k / NA, p = [Math.cos(a) * rr, yy + 1.0, ZC + Math.sin(a) * rr]; if (pv) P.cyl(M.rail, pv, p, 0.025, 0.025, 4, false); pv = p; } }
      // the midship deckhouse X' +-6.4, Z -26 .. 10: 3 tiers (to +11.2) between Z -9 and 10, 2 tiers (to +8.6) aft of it
      const dh = (z0, z1, top, w = 6.4) => {
        const nt = Math.round((top - yF) / 2.6);
        for (const s of [1, -1]) for (let t = 0; t < nt; t++) {
          const yw = yF + t * 2.6, y0 = t === 0 ? yB : yw, y1 = yw + 2.6, x = s * w;               // review fix: the first tier starts at yB (the walls reach the deck; they floated 1 m above it and the sky showed under them from the quay)
          P.quad(cream, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [s, 0, 0], [[0, y0 / 2.6], [(z1 - z0) / 4, y0 / 2.6], [(z1 - z0) / 4, y1 / 2.6], [0, y1 / 2.6]]);
          if (t > 0 || nt === 2) P.quad(wDeck, [x + s * 0.03, yw + 0.8, z0], [x + s * 0.03, yw + 0.8, z1], [x + s * 0.03, yw + 1.8, z1], [x + s * 0.03, yw + 1.8, z0], [s, 0, 0], [[0, 0], [(z1 - z0) / 2, 0], [(z1 - z0) / 2, 1], [0, 1]]);
        }
        P.quad(cream, [-w, top, z0], [w, top, z0], [w, top, z1], [-w, top, z1], [0, 1, 0], [[-2, 0], [2, 0], [2, 4], [-2, 4]]);
        P.quad(cream, [-w, yB, z0], [w, yB, z0], [w, top, z0], [-w, top, z0], [0, 0, -1], [[0, 0], [4, 0], [4, 3], [0, 3]]);
        P.quad(cream, [w, yB, z1], [-w, yB, z1], [-w, top, z1], [w, top, z1], [0, 0, 1], [[0, 0], [4, 0], [4, 3], [0, 3]]);
      };
      dh(-9, 10, yF + 7.8); dh(-26, -9, yF + 5.2);
      // the funnel base block (roof +12.9) and the ONE broad funnel: 8.0 fore-and-aft x 8.7 across, centre Z +1
      P.box(cream, -5.0, 5.0, yF + 7.8, 12.9, -4, 6, 'b', 3);
      const fy = [12.9, 15.7, 17.4, 18.7];
      P.geo(M.funnel, cyl8, 0, (fy[0] + fy[1]) / 2, 1.0, 0, 0, 0, 4.35, fy[1] - fy[0], 4.0);
      P.geo(M.band, cyl8, 0, (fy[1] + fy[2]) / 2, 1.0, 0, 0, 0, 4.37, fy[2] - fy[1], 4.02);
      P.geo(M.cap, cyl8, 0, (fy[2] + fy[3]) / 2, 1.0, 0, 0, 0, 4.4, fy[3] - fy[2], 4.05);
      P.geo(M.cap, new THREE.CylinderGeometry(0.95, 1, 0.12, 16), 0, fy[3] + 0.04, 1.0, 0, 0, 0, 4.0, 1, 3.6);
      // the funnel's steam pipes and ventilators on the roof
      for (const [x, z, h] of [[-4.2, -3.2, 1.6], [4.2, -3.2, 1.6], [-4.6, 3.5, 1.2], [4.6, 3.5, 1.2], [0, -6.2, 1.4]]) P.cyl(cream, [x, 12.9, z], [x, 12.9 + h, z], 0.3, 0.26, 8, true);
    });
    // ------------------------------------------------------------------------------------------ foremast (lattice, +36), aft mast (+25), the crane tower, stern deckhouse
    step('masts', () => {
      const cm = M.creamPlain, rod = (a, b, r = 0.07) => P.cyl(cm, a, b, r, r, 5, false);
      const base = 13.8, Zm = 12.8;
      // A-frame: two splayed legs from (+-2.65, base, Zm +- ) up to the pole at +19, braced
      for (const s of [1, -1]) {
        for (const dz of [-2.0, 2.0]) rod([s * 2.65, base, Zm + dz], [s * 0.15, 19.0, Zm], 0.11);
        for (let k = 1; k < 5; k++) { const t = k / 5, y = base + (19.0 - base) * t, x = s * (2.65 * (1 - t) + 0.15 * t); rod([x, y, Zm - 2.0 * (1 - t)], [x, y, Zm + 2.0 * (1 - t)], 0.05); }
      }
      rod([2.65, base, Zm], [-2.65, base, Zm], 0.07);
      P.cyl(cm, [0, base, Zm], [0, 36.0, Zm], 0.22, 0.12, 8, true);
      rod([0, 19.0, Zm - 0.2], [0, base, Zm - 4.4], 0.1); rod([0, 25, Zm - 0.2], [0, base + 2, Zm - 5.5], 0.05);               // the raked aft stay leg
      // platforms with rails: +19 (two searchlights), +27.5 (radar bar), yards at +24 (7.5 m) and +33.5 (4 m), the top light
      for (const [y, w] of [[19.0, 2.4], [27.5, 2.0]]) { P.box(cm, -w / 2, w / 2, y, y + 0.15, Zm - w / 2, Zm + w / 2, 'b'); for (const [a, b] of [[-w / 2, -w / 2], [w / 2, w / 2]]) P.box(cm, a - 0.03, a + 0.03, y + 0.15, y + 1.0, Zm - w / 2, Zm + w / 2, 'b'); P.box(cm, -w / 2, w / 2, y + 0.15, y + 1.0, Zm + w / 2 - 0.03, Zm + w / 2 + 0.03, 'b'); }
      for (const s of [1, -1]) P.geo(M.searchlight, cyl8, s * 0.8, 19.6, Zm + 0.8, Math.PI / 2, 0, 0, 0.35, 0.5, 0.35);
      P.cyl(cm, [-3.75, 24.0, Zm], [3.75, 24.0, Zm], 0.06, 0.06, 5, false); P.cyl(cm, [-2.0, 33.5, Zm], [2.0, 33.5, Zm], 0.05, 0.05, 5, false);
      P.box(M.steel, -1.5, 1.5, 28.7, 28.85, Zm - 0.05, Zm + 0.05, ''); P.geo(M.rail, sph, 0, 36.15, Zm, 0, 0, 0, 0.14, 0.14, 0.14);
      // stays: six thin wires from the mast to the funnel casing, the deck and the bow
      const wire = (a, b) => P.cyl(M.steel, a, b, 0.012, 0.012, 3, false);
      wire([0, 33.5, Zm], [0, 18.5, 1.0 + 4.0]); wire([0.5, 24, Zm], [6.5, 13.0, -2.5]); wire([-0.5, 24, Zm], [-6.5, 13.0, -2.5]); wire([0, 30, Zm], [0, 4.4, 40]); wire([1.5, 24, Zm], [8.0, 11.2, 22]); wire([-1.5, 24, Zm], [-8.0, 11.2, 22]);
      // the aft mast Z -22: a plain pole from the deckhouse roof (8.6) to +25 with one yard and a light
      P.cyl(cm, [0, 8.6, -22], [0, 25, -22], 0.17, 0.09, 8, true); P.cyl(cm, [-2.5, 20.5, -22], [2.5, 20.5, -22], 0.05, 0.05, 5, false); P.geo(M.rail, sph, 0, 25.1, -22, 0, 0, 0, 0.12, 0.12, 0.12);
      P.cyl(M.steel, [0, 21, -22], [0, 8.6, -10], 0.012, 0.012, 3, false); P.cyl(M.steel, [0, 21, -22], [0, 5.0, -45], 0.012, 0.012, 3, false);
      // the aft crane tower with its cab (Z -30 .. -34, top ~ +17) and the stern deckhouse (Z -48 .. -33, roof +9) with the towing winch under the overhang
      P.box(cm, -1.6, 1.6, 8.6, 15.0, -34, -30.5, 'b', 3); P.box(M.creamPlain, -2.0, 2.0, 15.0, 17.2, -34.4, -29.8, 'b', 3); P.box(M.glassDark, -1.9, 1.9, 15.6, 16.6, -29.78, -29.74, 'kb');
      P.box(cream, -5.2, 5.2, 2.4, 9.0, -48, -36, 'b', 3);
      P.cyl(M.windlass, [-1.7, 4.3, -43], [1.7, 4.3, -43], 0.9, 0.9, 12, true);
      P.box(cream, -4.5, 4.5, 9.0, 9.3, -49, -35.5, 'b', 3);
    });
    // ------------------------------------------------------------------------------------------ six lifeboats on davits (Z -18.3 / -8.0 / +3.0, X' +-7.2): boats 1 and 3 covered (black), boat 2 open
    step('boats', () => {
      const hullG = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      for (const s of [1, -1]) for (const [Z, cov] of [[-18.3, true], [-8.0, false], [3.0, true]]) {
        const x = s * 7.2, yk = 6.8;
        P.geo(M.boat, hullG, x, yk + 1.3, Z, 0, 0, 0, 1.25, 1.3, 4.1);
        P.geo(cov ? M.cover : M.deckFore, new THREE.CircleGeometry(1, 16), x, yk + 1.31, Z, -Math.PI / 2, 0, 0, 1.25, 4.1, 1);
        if (cov) P.geo(M.cover, new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), x, yk + 1.3, Z, 0, 0, 0, 1.2, 0.55, 3.95);
        else { P.box(M.deckFore, x - 1.1, x + 1.1, yk + 1.28, yk + 1.36, Z - 0.3, Z + 0.3, 'b'); P.box(M.deckFore, x - 1.1, x + 1.1, yk + 1.28, yk + 1.36, Z - 2.0, Z - 1.5, 'b'); }
        // davits: two curved arms (an up-and-in segment pair) at the ends of the boat
        for (const dz of [-1.9, 1.9]) { P.cyl(M.creamPlain, [s * 8.7, 2.4, Z + dz], [s * 8.7, 8.4, Z + dz], 0.1, 0.09, 5, false); P.cyl(M.creamPlain, [s * 8.7, 8.4, Z + dz], [x, 10.0, Z + dz], 0.09, 0.08, 5, false); P.cyl(M.steel, [x, 10.0, Z + dz], [x, yk + 1.6, Z + dz], 0.015, 0.015, 3, false); }
      }
    });
    // ------------------------------------------------------------------------------------------ deck fittings: windlasses, bitts, rope coils, mooring lines, the little swing jib
    step('fittings', () => {
      for (const s of [1, -1]) {
        P.cyl(M.windlass, [s * 3.0 - 1.5, 4.5, 36], [s * 3.0 + 1.5, 4.5, 36], 0.7, 0.7, 12, true); P.box(M.windlass, s * 3.0 - 1.7, s * 3.0 + 1.7, 3.7, 4.1, 35.0, 37.0, 'b');
        for (const z of [41, 33, 24, 12]) { P.cyl(M.windlass, [s * 8.6, deckY(z), z], [s * 8.6, deckY(z) + 0.7, z], 0.22, 0.2, 8, true); P.cyl(M.creamPlain, [s * 8.6, deckY(z) + 0.7, z], [s * 8.6, deckY(z) + 0.85, z], 0.26, 0.26, 8, true); }
      }
      for (const [x, z] of [[-3, 30], [4, 38], [-5, -42], [6, -45]]) P.geo(M.teal2, new THREE.TorusGeometry(0.55, 0.22, 6, 12), x, deckY(z) + 0.25, z, Math.PI / 2, 0, 0, 1, 1, 1);      // rope coils (teal)
      // the little swing jib on the front of the bridge house (6 m, cream)
      P.cyl(M.creamPlain, [-5.6, 6.0, 22.4], [-5.6, 12.0, 22.4], 0.15, 0.12, 6, false); P.cyl(M.creamPlain, [-5.6, 12.0, 22.4], [-9.0, 10.5, 25.5], 0.1, 0.08, 6, false);
      // mooring lines: three from the bow bollards to the quay / the D2 landing, two from the stern to the quay (thick white-grey hawsers)
      const rope = (a, b) => P.cyl(M.rope, a, b, 0.06, 0.06, 5, false);
      rope([8.0, deckY(41) + 0.8, 41], [24.5, 0.3, 48]); rope([8.6, deckY(33) + 0.7, 33], [19.5, 0.3, 31]); rope([-5, deckY(42) + 0.8, 42], [24.0, 0.3, 50]);
      rope([8.6, deckY(-42) + 0.5, -42], [14.5, 0.1, -56]); rope([6.0, deckY(-47) + 0.5, -47], [14.6, 0.1, -66]);
    });
    // ------------------------------------------------------------------------------------------ the gangway: S (21.4, 6.7) -> (9.3, 5.9), rise 4.5 m; lattice sides lettered ЛЕДОКОЛ «КРАСИН», cream hand rails; a closed gate at the foot
    step('gangway', () => {
      const A = [21.4 - AX, 0.0, 6.7], B = [9.3 - AX, 4.5, 5.9], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
      const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len, dz = (B[2] - A[2]) / len, nx = -dz, nz = dx, nl = Math.hypot(nx, nz), px = nx / nl * 0.6, pz = nz / nl * 0.6;   // sideways (0.6 m each way)
      const at = (t, side, up = 0) => [A[0] + (B[0] - A[0]) * t + px * side, A[1] + (B[1] - A[1]) * t + up, A[2] + (B[2] - A[2]) * t + pz * side];
      P.quad(M.gangway, at(0, -1), at(1, -1), at(1, 1), at(0, 1), [0, 1, 0]);                                  // the tread plane
      P.quad(M.gangway, at(0, 1, -0.5), at(1, 1, -0.5), at(1, 1), at(0, 1), [px, 0, pz]);                         // side panels (lettered below)
      P.quad(M.gangway, at(1, -1, -0.5), at(0, -1, -0.5), at(0, -1), at(1, -1), [-px, 0, -pz]);
      for (const side of [1, -1]) {
        P.quad(M.lettersGang, at(0.04, side * 1.003, -0.42), at(0.96, side * 1.003, -0.42), at(0.96, side * 1.003, -0.08), at(0.04, side * 1.003, -0.08), [px * side, 0, pz * side], side > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[1, 0], [0, 0], [0, 1], [1, 1]]);
        P.cyl(M.rail, at(0, side, 1.0), at(1, side, 1.0), 0.03, 0.03, 4, false);
        for (let k = 0; k <= 8; k++) { const t = k / 8; P.cyl(M.rail, at(t, side), at(t, side, 1.0), 0.02, 0.02, 4, false); }
      }
      // the closed gate across the foot (a plain iron bar gate)
      P.cyl(M.iron, [A[0] + 0.1, 0.1, A[2] - 0.7], [A[0] + 0.1, 1.1, A[2] - 0.7], 0.04, 0.04, 5, false); P.cyl(M.iron, [A[0] + 0.1, 0.1, A[2] + 0.7], [A[0] + 0.1, 1.1, A[2] + 0.7], 0.04, 0.04, 5, false); P.cyl(M.iron, [A[0] + 0.1, 0.95, A[2] - 0.7], [A[0] + 0.1, 0.95, A[2] + 0.7], 0.03, 0.03, 5, false);
      svc.gangway = { foot: FS.W(21.4, 6.7), top: FS.W(9.3, 5.9) };
      const f = FS.W(21.4, 6.7); svc.entrances.push({ x: f.x, z: f.z, rotY: FS.rot + Math.PI / 2, name: 'Ледокол «Красин»: трап', closed: true });
    });
  } finally { P.pop(); P.pop(); }
  // ------------------------------------------------------------------------------------------ colliders: the hull in 10 m slices (nobody boards), the gangway, the mooring lines are not solid
  step('colliders', () => {
    // n4spb (docs/AREAS.md 15.v, tools/boat-passage-test.mjs "no invisible wall"): the slices follow the hull 0.6 m over the waterline (hbAt), in 3 m steps, not the flared deck line: the raked stem is 6 m shorter at the water than at the deck, and a
    // collider that reaches beyond the drawn hull is a wall of water for the motor boat
    const hw = (Z) => hbAt(Z, WL + 0.6);
    for (let z = -50; z < 49; z += 3) {
      const z1 = Math.min(49, z + 3), zm = (z + z1) / 2, h = Math.max(hw(z), hw(z1), hw(zm)) + 0.2;
      if (h < 0.3) continue;
      FS.box(ph, AX, zm, 2 * h, z1 - z + 0.4, 0, -7, 14.5);
    }
    const A = [21.4, 6.7], B = [9.3, 5.9], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    FS.box(ph, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, len, 1.3, -Math.atan2(B[1] - A[1], B[0] - A[0]) * 0 + Math.atan2(-(B[1] - A[1]), B[0] - A[0]), 0, 5.2);
    const c = FS.W(AX, 0); svc.monuments.push({ id: 'r3283438', name: 'Ледокол-музей «Красин»', x: c.x, z: c.z, h: 36, r: 12 });
    const sp = (name, X, Z, tx, tz, pitch = 4) => { const a = FS.W(X, Z), b = FS.W(tx, tz); svc.photoSpots.push({ name, x: a.x, z: a.z, yaw: Math.atan2(b.x - a.x, -(b.z - a.z)) * -180 / Math.PI, pitch, y: 0 }); };
    sp('Ледокол «Красин» с набережной', 18, 14, 0, 6, 3);
  });
}
void HT;
