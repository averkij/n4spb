// landmarksKirova/erfig2.js - ERA and ARTA, the two forged-steel figures by Dmitry Zhukov (2009), second version (erarta-detail round 2026-10-10).
// Photos refs/erarta-detail a01 a06 a04 crops/era_arta.jpg (close views from the plaza, 2009-2010): both figures are ~5 m SMOOTH-SKINNED steel torsos with deep forged FLUTES, a semi-gloss black surface
// whose upper ridges and up-facing planes carry strong blue-white SKY reflections (#6c7f98 .. #8fa3bd) and whose lower folds have a warm brown undertone (#4a3a2c).  The sheen is NOT a material: the colour of
// every vertex is computed from its normal (sky / front-light / warm bounce) and a little noise, so the figure needs no extra material kind (it uses the flat base with white handle * vertex colour).
//   ERA   a woman's slim torso (skirt dissolving into long forged STRIPS that splay at the foot like roots, a plated waist, a bulging bodice) opening upward into a big FLUTED FLARE (calla / trumpet), the
//         rim ragged and curling, leaning to +x (the viewer's right); 4.6 m.
//   ARTA  a headless draped Nike torso (long vertical folds, a belt of overlapping plates, a torn two-pronged neck, the left prong higher), a huge layered WING of long feather plates sweeping up and
//         out to +x with the sky on its upper face, a comb of hanging tongues under it, strips splayed round the foot; 4.5 m.
// Frame of the figures: y up, +z toward the street (the figure's front), +x to the right seen from the street, origin at the foot.  buildEra() / buildArta() return a THREE.BufferGeometry (position, normal,
// uv, color) in that frame; no dependency on the layout (the figure viewer can load it).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const C_DARK = hex('#2e2421'), C_WARM = hex('#5b4535'), C_SKY = hex('#7d93b0'), C_SKY2 = hex('#c4d4e6');
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** colour of a steel vertex from its unit normal (nx, ny, nz), a height y and a noise value h in 0..1 */
function steel(nx, ny, nz, y, h, k = 1) {
  const sky = Math.pow(Math.max(0, ny * 0.7 + nz * 0.55 + nx * 0.1), 3.2);                       // the sky and the sunny street in front of the figure
  const rim = Math.pow(Math.max(0, 1 - Math.abs(nz)), 4) * 0.25;                                    // edges seen on the side catch light too
  const warm = Math.max(0, -ny) * 0.7 + 0.18 * h;
  let c = lerp3(C_DARK, C_WARM, Math.min(1, warm));
  c = lerp3(c, C_SKY, Math.min(1, sky * 1.15 * k + rim * 0.3));
  if (sky * k > 0.45) c = lerp3(c, C_SKY2, Math.min(1, (sky * k - 0.45) * 1.4));
  const m = 0.86 + 0.28 * h; return [c[0] * m, c[1] * m, c[2] * m];
}

/** collects triangles; smooth() = shared-vertex lofts (normals averaged), flat quads for bars */
class G {
  constructor() { this.pos = []; this.col = []; this.nrm = []; this.idx = []; this.n = 0; }
  /** a smooth loft: rows[k][i] = [x, y, z], closed ring in i (wrap) or open; normals averaged from the faces; `hn(k, i)` noise 0..1 */
  loft(rows, closed, hn = () => 0.5, ck = 1, hl = null) {
    const K = rows.length, N = rows[0].length, base = this.n, nrm = new Array(K * N).fill(0).map(() => [0, 0, 0]);
    const at = (k, i) => rows[k][closed ? (i + N) % N : Math.max(0, Math.min(N - 1, i))];
    for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) this.pos.push(...rows[k][i]);
    const tri = (a, b, c) => {
      const pa = this.pos.slice(3 * (base + a), 3 * (base + a) + 3), pb = this.pos.slice(3 * (base + b), 3 * (base + b) + 3), pc = this.pos.slice(3 * (base + c), 3 * (base + c) + 3);
      const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2], vx = pc[0] - pa[0], vy = pc[1] - pa[1], vz = pc[2] - pa[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { nrm[q][0] += nx; nrm[q][1] += ny; nrm[q][2] += nz; }
      this.idx.push(base + a, base + b, base + c);
    };
    const M = closed ? N : N - 1;
    for (let k = 0; k + 1 < K; k++) for (let i = 0; i < M; i++) {
      const i1 = (i + 1) % N, a = k * N + i, b = k * N + i1, c = (k + 1) * N + i1, d = (k + 1) * N + i;
      tri(a, c, b); tri(a, d, c);
    }
    void at;
    for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) {
      const v = nrm[k * N + i], l = Math.hypot(v[0], v[1], v[2]) || 1, nx = v[0] / l, ny = v[1] / l, nz = v[2] / l, p = rows[k][i];
      this.nrm.push(nx, ny, nz); let c = steel(nx, ny, nz, p[1], hn(k, i), ck);
      if (hl) { const w = hl(k, i); if (w > 0) c = lerp3(c, C_SKY2, Math.min(0.85, w)); }
      this.col.push(...c);
    }
    this.n += K * N;
  }
  /** a flat shaded quad a b c d (counter clockwise seen from the front); the normal comes from the points */
  quad(a, b, c, d, h = 0.5, ck = 1) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const base = this.n; for (const p of [a, b, c, d]) { this.pos.push(...p); this.nrm.push(nx, ny, nz); this.col.push(...steel(nx, ny, nz, p[1], h, ck)); }
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); this.n += 4;
  }
  /** a bar (rectangular section, closed ends) along `path`, width w(s) across `side` (unit vector, may vary) and thickness t: flat faces */
  bar(path, wf, t, sideOf, h = 0.5, ck = 1) {
    const S = path.length, ring = [];
    for (let s = 0; s < S; s++) {
      const p = path[s], q = path[Math.min(S - 1, s + 1)], o = path[Math.max(0, s - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let sd = sideOf(s / (S - 1)); const dot = sd[0] * tx + sd[1] * ty + sd[2] * tz; sd = [sd[0] - dot * tx, sd[1] - dot * ty, sd[2] - dot * tz]; const sl = Math.hypot(...sd) || 1; sd = sd.map((v) => v / sl);
      const nm = [ty * sd[2] - tz * sd[1], tz * sd[0] - tx * sd[2], tx * sd[1] - ty * sd[0]];                // thickness direction = tangent x side
      const w = wf(s / (S - 1)) / 2, th = t / 2;
      ring.push([[p[0] - sd[0] * w - nm[0] * th, p[1] - sd[1] * w - nm[1] * th, p[2] - sd[2] * w - nm[2] * th], [p[0] + sd[0] * w - nm[0] * th, p[1] + sd[1] * w - nm[1] * th, p[2] + sd[2] * w - nm[2] * th],
        [p[0] + sd[0] * w + nm[0] * th, p[1] + sd[1] * w + nm[1] * th, p[2] + sd[2] * w + nm[2] * th], [p[0] - sd[0] * w + nm[0] * th, p[1] - sd[1] * w + nm[1] * th, p[2] - sd[2] * w + nm[2] * th]]);
    }
    for (let s = 0; s + 1 < S; s++) for (let f = 0; f < 4; f++) { const f1 = (f + 1) % 4; this.quad(ring[s][f], ring[s][f1], ring[s + 1][f1], ring[s + 1][f], h, ck); }
    this.quad(ring[0][0], ring[0][3], ring[0][2], ring[0][1], h, ck); this.quad(ring[S - 1][0], ring[S - 1][1], ring[S - 1][2], ring[S - 1][3], h, ck);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(this.n * 2), 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
}

const tri = (x) => 1 - Math.abs(2 * (x - Math.floor(x)) - 1);                                    // triangle wave 0..1 (period 1)
/** piecewise linear keyframes [[y, v], ...] */
const key = (kf, y) => { if (y <= kf[0][0]) return kf[0][1]; for (let i = 0; i + 1 < kf.length; i++) if (y <= kf[i + 1][0]) { const t = (y - kf[i][0]) / (kf[i + 1][0] - kf[i][0]); return kf[i][1] + (kf[i + 1][1] - kf[i][1]) * t; } return kf[kf.length - 1][1]; };

/** forged strips from a splayed foot up into the body: n strips, ellipse radius at the foot (fx, fz), leaning toward `lean` (x direction, back = -z) */
function footStrips(g, n, seed, o) {
  for (let i = 0; i < n; i++) {
    const a = (i + hash(seed + i) * 0.6) / n * TAU, rr = 0.55 + 0.45 * hash(seed + i * 3.1), h = hash(seed + i * 7.7);
    const fx = Math.cos(a) * o.fx * rr + o.lean * 0.3, fz = Math.sin(a) * o.fz * rr - 0.05;
    const topR = key(o.top, 1.3), tx = Math.cos(a) * topR * 0.92 + o.cx, tz = Math.sin(a) * topR * 0.68 * 0.92;
    const path = [];
    for (let s = 0; s <= 6; s++) {
      const u = s / 6, e = u * u * (3 - 2 * u), y = 0.02 + 1.35 * u;
      path.push([fx + (tx - fx) * e + Math.sin(u * 3 + i) * 0.03, y, fz + (tz - fz) * e + Math.cos(u * 2.3 + i) * 0.03]);
    }
    const ang = a + Math.PI / 2;
    g.bar(path, (u) => (0.09 + 0.07 * h) * (1 - 0.35 * u), 0.04, () => [Math.cos(ang), 0.15, Math.sin(ang)], h);
  }
}

/** a band of overlapping plates (scales) round the body at y0..y1: rings of n plates, radius from `rad(y)` */
function plates(g, y0, y1, rows, n, rad, cx, rz) {
  for (let r = 0; r < rows; r++) {
    const yb = y0 + (y1 - y0) * r / rows, yt = yb + (y1 - y0) / rows * 1.5, R = rad(yb) + 0.012, Rt = rad(yt) + 0.012;
    for (let i = 0; i < n; i++) {
      const a0 = (i + (r % 2) * 0.5) / n * TAU, a1 = a0 + TAU / n * 1.3, h = hash(r * 31 + i * 7);
      const p = (a, R2, y, out) => [cx + Math.cos(a) * (R2 + out), y, Math.sin(a) * (R2 + out) * rz];
      g.quad(p(a1, R, yb, 0.03), p(a0, R, yb, 0.03), p(a0, Rt, yt, 0), p(a1, Rt, yt, 0), h);
    }
  }
}

/** ERA: 4.6 m */
export function buildEra() {
  const g = new G();
  const RX = [[0.9, 0.34], [1.4, 0.29], [1.95, 0.205], [2.2, 0.22], [2.55, 0.29], [2.95, 0.315], [3.35, 0.42], [3.75, 0.68], [4.15, 1.0], [4.5, 1.26]];
  const K = 44, N = 72, y0 = 0.9, y1 = 4.45, rows = [], HL = [];
  for (let k = 0; k <= K; k++) {
    const u = k / K, y = y0 + (y1 - y0) * u, t = (y - y0) / (y1 - y0), r = key(RX, y), cx = 0.04 + 0.55 * Math.pow(t, 2.1), ring = [];
    const amp = 0.035 + 0.13 * Math.pow(t, 1.25), phi = 2.6 * t, tail = Math.max(0, (k - (K - 5)) / 5), hrow = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, fl = 1 + amp * Math.sin(12 * a + phi) + 0.03 * Math.sin(5 * a - 2 * t), bust = (y > 2.3 && y < 3.3 ? 0.085 * Math.exp(-Math.pow((y - 2.75) / 0.34, 2)) * Math.max(0, Math.sin(a)) : 0);
      const lipLift = 0.16 * Math.max(0, Math.cos(a)) * t * t;
      // the ragged rim: triangular teeth, tall on the left (a near PI), a long curling lip on the right
      const teeth = 0.34 * tri(a * 5.5 / TAU + 0.15) + 0.5 * Math.max(0, Math.cos(a - Math.PI * 0.92)) ** 4 + 0.16 * Math.max(0, Math.cos(a + 0.1)) + 0.16 * hash(i * 3.3);
      const rr = r * fl, crest = Math.max(0, Math.sin(12 * a + phi)) ** 5, front = Math.max(0, Math.sin(a) * 0.8 + 0.35);
      hrow.push(crest * front * (0.22 + 0.55 * t) * (0.7 + 0.6 * hash(i * 5.1 + k * 0.37)));
      ring.push([cx + Math.cos(a) * rr * (1 + 0.18 * lipLift), y + tail * teeth * tail + lipLift * tail, Math.sin(a) * (rr * 0.6 + bust)]);
    }
    rows.push(ring); HL.push(hrow);
  }
  g.loft(rows, true, (k, i) => 0.5 + 0.5 * Math.sin(i * 1.3 + k * 0.4), 1, (k, i) => HL[k][i]);
  // the plated waist and the strips of the skirt
  plates(g, 1.65, 2.25, 3, 24, (y) => key(RX, y), 0.06, 0.62);
  footStrips(g, 22, 11, { fx: 0.66, fz: 0.42, top: RX, cx: 0.03, lean: 0.25 });
  return g.geometry();
}

/** ARTA: 4.5 m, wing to +x */
export function buildArta() {
  const g = new G();
  const RX = [[0.9, 0.46], [1.5, 0.4], [2.0, 0.34], [2.4, 0.265], [2.7, 0.315], [3.1, 0.375], [3.6, 0.415], [3.95, 0.4], [4.15, 0.27], [4.28, 0.2]];
  const K = 46, N = 72, y0 = 0.9, y1 = 4.2, rows = [], HL = [];
  for (let k = 0; k <= K; k++) {
    const u = k / K, y = y0 + (y1 - y0) * u, t = u, r = key(RX, y), tw = 0.55 * t, cx = -0.05 + 0.09 * Math.sin(t * 3), ring = [];
    const foldAmp = y < 2.3 ? 0.1 - 0.035 * (y - 0.9) / 1.4 : 0.035, tail = Math.max(0, (k - (K - 3)) / 3), hrow = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, fl = 1 + foldAmp * Math.sin(11 * a + 2.2 * t) + 0.025 * Math.sin(5 * a - 3 * t);
      const prong = tail * (0.62 * Math.max(0, Math.cos(a - Math.PI)) ** 3 + 0.3 * Math.max(0, Math.cos(a - 0.15)) ** 3) + tail * 0.05 * hash(i);          // two prongs, the left (-x) one higher
      const chest = (y > 2.8 && y < 3.9 ? 0.06 * Math.sin(a) : 0), rr = r * fl, crest = Math.max(0, Math.sin(11 * a + 2.2 * t)) ** 5, front = Math.max(0, Math.sin(a + tw) * 0.8 + 0.35);
      hrow.push(crest * front * (y < 2.3 ? 0.55 : 0.3) * (0.7 + 0.6 * hash(i * 5.7 + k * 0.31)));
      ring.push([cx + Math.cos(a + tw) * rr, y + prong, Math.sin(a + tw) * (rr * 0.66 + chest)]);
    }
    rows.push(ring); HL.push(hrow);
  }
  g.loft(rows, true, (k, i) => 0.5 + 0.5 * Math.sin(i * 1.7 + k * 0.5), 1, (k, i) => HL[k][i]);
  plates(g, 2.15, 2.65, 3, 22, (y) => key(RX, y), -0.04, 0.66);
  footStrips(g, 18, 41, { fx: 0.72, fz: 0.42, top: RX, cx: -0.05, lean: -0.5 });
  // the wing: 14 overlapping blades from the left shoulder (viewer's right), sweeping up and out: a broad layered plane
  for (let i = 0; i < 14; i++) {
    const u = i / 13, ang = (10 + 52 * u) * Math.PI / 180, len = 1.0 + 1.35 * Math.sin(Math.PI * (0.1 + 0.75 * u)), w0 = 0.56 - 0.16 * u, h = hash(i * 4.4);
    const R = [0.22 + 0.05 * u, 3.28 + 0.62 * u, -0.1 - 0.02 * i], path = [];
    for (let s = 0; s <= 7; s++) { const q = s / 7; path.push([R[0] + Math.cos(ang) * len * q, R[1] + Math.sin(ang) * len * q + 0.32 * q * q * (0.5 + u), R[2] - 0.22 * q + 0.04 * Math.sin(q * 5 + i)]); }
    g.bar(path, (q) => w0 * (1 - 0.55 * q) + 0.05, 0.06, () => [0.12, 0.6, 0.8], h, 1.25);                       // broad face toward the front and the sky
  }
  // a short comb of tongues under the wing root: torn feather ends
  for (let i = 0; i < 8; i++) {
    const u = i / 7, x = 0.28 + u * 1.1, y = 3.3 + 0.18 * Math.sin(u * 2.4), h = hash(i * 8.8), path = [];
    for (let s = 0; s <= 4; s++) { const q = s / 4; path.push([x + 0.08 * q, y - (0.28 + 0.4 * h) * q, -0.14 - 0.2 * q]); }
    g.bar(path, (q) => 0.1 * (1 - 0.5 * q) + 0.02, 0.04, () => [1, 0, 0.2], h);
  }
  return g.geometry();
}

/** the white LED tube and the plate are done by the caller; this returns the height of each figure for the colliders */
export const FIG_H = { era: 5.4, arta: 5.3 };
