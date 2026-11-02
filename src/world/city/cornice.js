// cornice.js - the projecting cornice swept around every visible piece of a ring edge (mitred at the corners), plus the small ColorBuilder (vertex-coloured triangles) the
// geometry details share. Profile (offset out of the wall, height above the cornice line), docs/research/architecture.md C7: projection 0.8 m, height 1.0 m with brackets band,
// corona and a chamfered top moulding.  Courtyard walls get a 0.55 x smaller cornice.
import * as THREE from 'three';

export class ColorBuilder {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.col = []; this.idx = []; this.n = 0; }
  get empty() { return this.n === 0; }
  get tris() { return this.idx.length / 3; }
  vert(p, n, c, u = 0, v = 0) { this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2]); this.col.push(c.r, c.g, c.b); this.uv.push(u, v); return this.n++; }
  /** quad p0..p3 (loop order) facing the normal n (winding flipped when needed) */
  quad(pts, n, c, uv) {
    const [p, q, r] = pts;
    const cx = (q[1] - p[1]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[1] - p[1]), cy = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]), cz = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const order = (cx * n[0] + cy * n[1] + cz * n[2] >= 0) ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const ix = order.map((k) => this.vert(pts[k], n, c, uv ? uv[k][0] : 0, uv ? uv[k][1] : 0));
    this.idx.push(ix[0], ix[1], ix[2], ix[0], ix[2], ix[3]);
  }
  tri(a, b, c3, n, c) { const i = [this.vert(a, n, c), this.vert(b, n, c), this.vert(c3, n, c)]; this.idx.push(i[0], i[1], i[2]); }
  /** axis-aligned-in-wall-space box: origin o (centre of the bottom), axes (dx,dz) along the wall and (nx,nz) outward, size w (along) x h (up) x d (out) */
  box(o, dx, dz, nx, nz, w, h, d, c, top = true) {
    const P = (s, y, t) => [o[0] + dx * s + nx * t, o[1] + y, o[2] + dz * s + nz * t];
    const hw = w / 2;
    this.quad([P(-hw, 0, d), P(hw, 0, d), P(hw, h, d), P(-hw, h, d)], [nx, 0, nz], c);
    this.quad([P(-hw, 0, 0), P(hw, 0, 0), P(hw, h, 0), P(-hw, h, 0)], [-nx, 0, -nz], c);
    this.quad([P(-hw, 0, 0), P(-hw, 0, d), P(-hw, h, d), P(-hw, h, 0)], [-dx, 0, -dz], c);
    this.quad([P(hw, 0, 0), P(hw, 0, d), P(hw, h, d), P(hw, h, 0)], [dx, 0, dz], c);
    if (top) this.quad([P(-hw, h, 0), P(hw, h, 0), P(hw, h, d), P(-hw, h, d)], [0, 1, 0], c);
    this.quad([P(-hw, 0, 0), P(hw, 0, 0), P(hw, 0, d), P(-hw, 0, d)], [0, -1, 0], c);
  }
  /** box without the back face (the one against the wall): front, top, two sides, bottom */
  boxLite(o, dx, dz, nx, nz, w, h, d, c, bottom = true) {
    const P = (s, y, t) => [o[0] + dx * s + nx * t, o[1] + y, o[2] + dz * s + nz * t];
    const hw = w / 2;
    this.quad([P(-hw, 0, d), P(hw, 0, d), P(hw, h, d), P(-hw, h, d)], [nx, 0, nz], c);
    this.quad([P(-hw, 0, 0), P(-hw, 0, d), P(-hw, h, d), P(-hw, h, 0)], [-dx, 0, -dz], c);
    this.quad([P(hw, 0, 0), P(hw, 0, d), P(hw, h, d), P(hw, h, 0)], [dx, 0, dz], c);
    this.quad([P(-hw, h, 0), P(hw, h, 0), P(hw, h, d), P(-hw, h, d)], [0, 1, 0], c);
    if (bottom) this.quad([P(-hw, 0, 0), P(hw, 0, 0), P(hw, 0, d), P(-hw, 0, d)], [0, -1, 0], c);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// side profile, travelled bottom (outward) -> front (up) -> top (inward); the normal of a segment is the travel direction rotated by -90 degrees
export const CORNICE = [[0, 0], [0.25, 0], [0.25, 0.28], [0.8, 0.28], [0.8, 0.78], [0.6, 1.0], [0.0, 1.0]];
// The small courtyard moulding still needs a fascia up to the common deck
// datum. Ending at 0.5 left a half-metre opening below every flat roof here.
export const CORNICE_SIMPLE = [[0, 0], [0.3, 0], [0.3, 0.42], [0.0, 0.5], [0.0, 1.0]];
export const CORNICE_H = 1.0;

/** unit miter vector at vertex i of a ring (offset by d = V + M * d is the corner of the two offset lines) */
export function miterAt(pts, i) {
  const n = pts.length, p = pts[(i + n - 1) % n], a = pts[i], b = pts[(i + 1) % n];
  const d1x = a[0] - p[0], d1z = a[1] - p[1], d2x = b[0] - a[0], d2z = b[1] - a[1];
  const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
  const n1x = d1z / l1, n1z = -d1x / l1, n2x = d2z / l2, n2z = -d2x / l2;
  const k = 1 / Math.max(0.35, 1 + n1x * n2x + n1z * n2z);
  return [(n1x + n2x) * k, (n1z + n2z) * k];
}

/** Sweep the cornice along the pieces of one edge. cB = ColorBuilder (vertex colours), c = THREE.Color, y = world y of the cornice line, scale = profile scale. */
export function addCornice(cB, e, y, c, scale = 1, profile = CORNICE) {
  const ring = e.ring, n = ring.pts.length;
  const Ms = miterAt(ring.pts, e.i), Me = miterAt(ring.pts, (e.i + 1) % n);
  const pt = (t, d, yy) => {
    if (t <= 0.01) return [e.a[0] + Ms[0] * d, yy, e.a[1] + Ms[1] * d];
    if (t >= e.len - 0.01) return [e.b[0] + Me[0] * d, yy, e.b[1] + Me[1] * d];
    return [e.a[0] + e.dx * t + e.nx * d, yy, e.a[1] + e.dz * t + e.nz * d];
  };
  const shade = [c, c.clone().multiplyScalar(0.92)];
  for (const pc of e.pieces) {
    const t0 = pc.t0, t1 = pc.t1;
    for (let k = 0; k + 1 < profile.length; k++) {
      const [d0, h0] = profile[k], [d1, h1] = profile[k + 1];
      const dd = (d1 - d0) * scale, dh = (h1 - h0) * scale;
      // normal in (out, up): travel rotated by -90 degrees = (dh, -dd)
      let no = dh, nu = -dd; const l = Math.hypot(no, nu) || 1; no /= l; nu /= l;
      const nrm = [e.nx * no, nu, e.nz * no];
      cB.quad([pt(t0, d0 * scale, y + h0 * scale), pt(t1, d0 * scale, y + h0 * scale), pt(t1, d1 * scale, y + h1 * scale), pt(t0, d1 * scale, y + h1 * scale)], nrm, nu < -0.5 ? shade[1] : shade[0]);
    }
  }
}
