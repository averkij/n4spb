// landmarksMakarova/lionfig.js - the granite LION of the Lions pier (Спуск со львами, 1806-09; docs/research/makarova.md 6.2, photos l05 crit_n01 crit_n02 l02 l07): a lion lying in the sphinx pose, forepaws stretched
// forward, hind legs tucked, head up with a heavy ruff of curls round the head and chest, mouth half open, the tail curled along the left side, carved in rough pink-grey granite.  1.75 m long (paw tips to the rump),
// 0.85 m high with the head up, 0.75 m wide.  Built with the figure kit's Sculpt (lofted tubes and blobs, ~6 k triangles at detail 1); the figure faces +z, stands on y = 0, +x is its LEFT.
// `turn` turns the head (rad, + toward the figure's left): the pier's two lions look at the river and turn their heads ~12 degrees toward the axis of the stair.  The surface uv is TRIPLANAR (granite grain, no streaks).
import { BufferAttribute } from 'three';
import { Sculpt, V, hash1 } from '../lib/figures.js';

/** a granite lion; o: { turn, pitch, detail, mane } -> Figure { geos: { main, dark }, tris } */
export function lyingLion(o = {}) {
  const S = new Sculpt({ detail: o.detail ?? 1, patina: false });
  const sg = (n) => S.seg(n), pr = (n) => Math.max(2, Math.round(n * Math.min(1, S.detail * 1.1)));
  const key = 'main', maneS = o.mane ?? 1;
  const Tu = (path, rad, oo = {}, k = key) => S.tube(k, path, rad, { seg: sg(12), per: pr(4), ...oo });
  const Bl = (c, r, oo = {}, k = key) => S.blob(k, c, r, { w: sg(10), h: sg(7), ...oo });
  const BB = (p, q, ra, rb, oo = {}, k = key) => S.blobBetween(k, p, q, ra, rb, { w: sg(10), h: sg(7), ...oo });

  // ---------------------------------------------------------------- body: deep chest, tucked waist, broad haunches, resting on its belly
  Tu([[0, 0.27, -0.74], [0, 0.31, -0.5], [0, 0.29, -0.18], [0, 0.34, 0.18], [0, 0.4, 0.42]], [[0.25, 0.24], [0.29, 0.27], [0.26, 0.23], [0.3, 0.28], [0.29, 0.3]], { seg: sg(16), per: pr(5) });
  Bl([0, 0.34, 0.42], [0.27, 0.27, 0.27]);                                                              // chest
  for (const s of [1, -1]) {
    BB([s * 0.2, 0.46, -0.62], [s * 0.3, 0.18, -0.36], 0.15, 0.2);                                       // the tucked thigh
    BB([s * 0.17, 0.45, 0.28], [s * 0.2, 0.2, 0.42], 0.12, 0.16);                                        // shoulder blade
    // hind paw lying forward along the belly
    Bl([s * 0.26, 0.06, -0.14], [0.08, 0.055, 0.17], { dir: [0, 0, 1], ref: [1, 0, 0] });
    for (let i = -1; i <= 1; i++) Bl([s * 0.26 + i * 0.04, 0.045, 0.01], [0.028, 0.03, 0.035], { w: 6, h: 5 });
    // foreleg stretched forward
    Tu([[s * 0.2, 0.36, 0.3], [s * 0.21, 0.17, 0.48], [s * 0.18, 0.1, 0.72], [s * 0.17, 0.07, 0.92]], [[0.14, 0.17], [0.115, 0.12], [0.1, 0.09], [0.1, 0.08]], { seg: sg(10), per: pr(3) });
    Bl([s * 0.17, 0.06, 0.95], [0.095, 0.06, 0.15], { dir: [0, 0, 1], ref: [1, 0, 0] });
    for (let i = -1; i <= 1; i++) Bl([s * 0.17 + i * 0.045, 0.045, 1.08], [0.03, 0.032, 0.036], { w: 6, h: 5 });
  }
  // ---------------------------------------------------------------- neck and head (head up, a little down-looking)
  Tu([[0, 0.42, 0.42], [0, 0.52, 0.52], [0, 0.6, 0.58]], [[0.22, 0.24], [0.21, 0.23], [0.2, 0.21]], { seg: sg(14), per: pr(5) });
  const hd = { turn: o.turn ?? 0, pitch: o.pitch ?? -0.04 };
  const hb = [0, 0.63, 0.64], ct = Math.cos(hd.turn), st = Math.sin(hd.turn), hp = hd.pitch, HS = o.headScale ?? 1.6;
  const dir = V.unit([st * Math.cos(hp), -Math.sin(hp), ct * Math.cos(hp)]);
  const side = [ct, 0, -st], up = V.cross(dir, side);
  const HF = (x, y, z) => V.add(V.add(V.add(hb, V.mul(side, x * HS)), V.mul(up, y * HS)), V.mul(dir, z * HS));
  const Hd = (x, y, z) => V.add(V.add(V.mul(side, x), V.mul(up, y)), V.mul(dir, z));
  const hbl = (c, r, d, k = key, w = 10, h = 7) => S.blob(k, HF(...c), [r[0] * HS, r[1] * HS, r[2] * HS], { dir: d ? Hd(...d) : dir, ref: side, w: sg(w), h: sg(h) });
  hbl([0, 0, 0], [0.135, 0.125, 0.16], [0, 0, 1], key, 12, 9);                                           // cranium
  S.tube(key, [HF(0, -0.01, 0.08), HF(0, -0.04, 0.17), HF(0, -0.055, 0.24), HF(0, -0.05, 0.28)], [[0.105 * HS, 0.09 * HS], [0.1 * HS, 0.08 * HS], [0.09 * HS, 0.07 * HS], [0.08 * HS, 0.062 * HS]], { seg: sg(12), per: pr(4), ref: side });   // the broad short muzzle
  hbl([0, -0.025, 0.29], [0.055, 0.034, 0.04], [0, -0.2, 1]);                                             // nose pad
  const open = 0.22;                                                                                     // the mouth just open (granite lions: lips parted)
  S.tube(key, [HF(0, -0.1, 0.06), HF(0, -0.108 - 0.05 * open, 0.16), HF(0, -0.1 - 0.1 * open, 0.255)], [[0.085 * HS, 0.047 * HS], [0.075 * HS, 0.04 * HS], [0.062 * HS, 0.032 * HS]], { seg: sg(10), per: pr(4), ref: side });   // the lower jaw
  hbl([0, -0.075 - 0.04 * open, 0.17], [0.05, 0.016 + 0.04 * open, 0.085], [0, -0.1, 1], 'dark', 8, 6);      // the dark mouth
  for (const s of [1, -1]) {
    hbl([s * 0.1, -0.05, 0.14], [0.055, 0.06, 0.1], [s * 0.3, -0.2, 1]);                                // cheek / whisker pad
    hbl([s * 0.07, 0.056, 0.15], [0.062, 0.03, 0.055], [s * 0.2, 0.3, 1]);                              // heavy brow
    hbl([s * 0.064, 0.028, 0.17], [0.03, 0.02, 0.022], [s * 0.2, 0, 1], 'dark', 6, 5);                  // eye
    hbl([s * 0.03, -0.012, 0.35], [0.015, 0.012, 0.012], [0, 0, 1], 'dark', 5, 4);                       // nostril
  }
  hbl([0, 0.045, 0.2], [0.034, 0.03, 0.09], [0, -0.2, 1]);                                               // nose bridge ridge
  // ---------------------------------------------------------------- the ruff: shaggy locks (the technique of the kit lion) round the head, over the chest and back over the shoulders
  if (maneS > 0.05) {
    const upv = up, dn = Math.min(1.2, S.detail + 0.2);
    // concentric rings of overlapping rounded curls round the face (a collar open to the front, each ring set back a little): radii are final sizes (HF scales by HS, so they are divided by it)
    const RUFF = [{ r: 0.255, n: 12, z: 0.0, s: 0.062 }, { r: 0.315, n: 16, z: -0.045, s: 0.07 }, { r: 0.375, n: 20, z: -0.1, s: 0.078 }, { r: 0.435, n: 24, z: -0.165, s: 0.085 }];
    RUFF.forEach((rg, k) => {
      const n = Math.round(rg.n * dn);
      for (let i = 0; i < n; i++) {
        const a = (i + (k % 2) * 0.5) / n * Math.PI * 2 + 0.1 * hash1(i * 7.1 + k * 13);
        if (k >= 3 && Math.sin(a) < -0.6) continue;                                                        // the chin side of the outer ring falls onto the chest locks
        const rr = rg.r * (1 + 0.05 * hash1(i * 3.1 + k)) / HS, zz = (rg.z - 0.025 * hash1(i * 1.7 + k)) / HS, sz = rg.s * maneS * (1 + 0.14 * hash1(i * 5.3 + k * 2));
        const ca = Math.cos(a), sa = Math.sin(a);
        S.blob(key, HF(ca * rr, sa * rr * 0.94, zz), [sz * 0.95, sz * 0.8, sz * 1.4], { dir: Hd(-sa, ca, -0.4), ref: Hd(ca, sa, 0), w: 7, h: 5 });
      }
    });
    for (let i = 0; i < Math.round(14 * Math.min(1.2, S.detail + 0.2)); i++) {                           // the chest ruff: locks hanging from the throat and chest
      const t = i / 13, a = (t - 0.5) * 2.4, p0 = V.add(V.add(hb, V.mul(side, Math.sin(a) * 0.17)), V.mul(upv, -0.1 - 0.02 * Math.cos(a)));
      const p1 = V.add(p0, [Math.sin(a) * 0.05, -0.2 * maneS - 0.05 * hash1(i), -0.04 + 0.03 * hash1(i + 4)]);
      S.blobBetween(key, V.add(p0, [0, 0, -0.04]), p1, 0.05 * maneS + 0.012, 0.032 * maneS + 0.01, { w: 6, h: 4, ref: side });
    }
    for (let i = 0; i < Math.round(12 * Math.min(1.2, S.detail + 0.2)); i++) {                           // the mane running back over the shoulders
      const t = i / 11, s2 = i % 2 ? 1 : -1, p0 = [s2 * (0.08 + 0.07 * t), 0.5 - 0.06 * t, 0.36 - 0.28 * t];
      S.blobBetween(key, p0, [p0[0] + s2 * 0.05, p0[1] - 0.1, p0[2] - 0.17], 0.055 * maneS, 0.035 * maneS, { w: 6, h: 4, ref: [1, 0, 0] });
    }
  }
  // ---------------------------------------------------------------- the tail curled along the left side
  const ts = o.tailSide ?? 1;
  Tu([[0, 0.3, -0.76], [0.14 * ts, 0.22, -0.92], [0.4 * ts, 0.12, -0.8], [0.47 * ts, 0.09, -0.5], [0.45 * ts, 0.09, -0.22]], [[0.055, 0.055], [0.05, 0.05], [0.045, 0.045], [0.042, 0.042], [0.04, 0.04]], { seg: sg(8), per: pr(5) });
  Bl([0.44 * ts, 0.1, -0.12], [0.07, 0.06, 0.1], { dir: [0, 0, 1], ref: [1, 0, 0] });                       // the tuft
  // ---------------------------------------------------------------- the surface uv: triplanar granite grain (metres / 1.6)
  const fig = S.finish({});
  triplanar(fig, 1.6);
  return fig;
}

/** replace the uv of every geometry of a Figure by a triplanar mapping (dominant normal axis), `scale` metres per texture repeat */
export function triplanar(fig, scale) {
  for (const g of Object.values(fig.geos)) {
    const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
      uv[i * 2] = u / scale; uv[i * 2 + 1] = v / scale;
    }
    g.setAttribute('uv', new BufferAttribute(uv, 2));
  }
  return fig;
}
