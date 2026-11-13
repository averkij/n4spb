// Surveyed-footprint roofs. Split convex roof pieces at every ridge/valley
// equation before lifting them: the resulting faces are planar, watertight,
// and meet the actual eaves instead of leaving floating rectangular planes.
import { triangulateRing, subtractConvex, clipHalf, area2 } from '../environment/clip.js';

function cleanRing(ring) {
  const points = ring.filter((p, i) => Math.hypot(p[0] - ring[(i + ring.length - 1) % ring.length][0], p[1] - ring[(i + ring.length - 1) % ring.length][1]) > 1e-7);
  for (let changed = true; changed && points.length > 3;) {
    changed = false;
    for (let i = 0; i < points.length; i++) {
      const a = points[(i + points.length - 1) % points.length], b = points[i], c = points[(i + 1) % points.length];
      if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-7) continue;
      points.splice(i, 1); changed = true; break;
    }
  }
  return points;
}

export function roofPieces(record, exclude = []) {
  let pieces = record.polys.flatMap(p => triangulateRing(p.o, p.h || []));
  for (const other of exclude) for (const p of other?.polys || [])
    for (const cut of triangulateRing(p.o, p.h || [])) pieces = subtractConvex(pieces, cut);
  return pieces;
}

export function insideRecord(record, x, z, margin = .015) {
  for (const poly of record?.polys || []) {
    const ring = poly.o; let inside = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const ax = ring[j], az = ring[j + 1], bx = ring[i], bz = ring[i + 1];
      const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      if (Math.hypot(x - ax - t * dx, z - az - t * dz) < margin) return true;
      if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

export function clippedPieces(pieces, a, b, inside = true) {
  return pieces.map(p => clipHalf(p, a, b, inside)).filter(p => p.length >= 3 && Math.abs(area2(p)) > 1e-5);
}

// A profile is a pitched ridge running along the other coordinate: v profile
// = east/west nave; u profile = its transverse gable. `run` is half the width.
export function fittedRoof(P, mat, pieces, { x, z, rot, eave, profiles, boundary = [], wallMat = mat, shadeMat = null }) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const local = ([px, pz]) => [(px - x) * c - (pz - z) * s, (px - x) * s + (pz - z) * c];
  const planes = [[0, 0, eave]];
  for (const p of profiles) for (const sign of [-1, 1]) {
    const a = sign * p.rise / p.run;
    planes.push(p.axis === 'u' ? [a, 0, eave + p.rise - a * (p.at || 0)] : [0, a, eave + p.rise - a * (p.at || 0)]);
  }
  const lines = [];
  for (let i = 0; i < planes.length; i++) for (let j = i + 1; j < planes.length; j++) {
    const A = planes[i][0] - planes[j][0], B = planes[i][1] - planes[j][1], C = planes[i][2] - planes[j][2];
    if (Math.hypot(A, B) < 1e-7) continue;
    const a = Math.abs(A) > Math.abs(B) ? [-C / A, 0] : [0, -C / B];
    lines.push([a, [a[0] - B * 100, a[1] + A * 100]]);
  }
  const yAt = (u, v) => eave + Math.max(0, ...profiles.map(p => p.rise * (1 - Math.abs((p.axis === 'u' ? u : v) - (p.at || 0)) / p.run)));
  const border = boundary.flatMap(rec => (rec?.polys || []).flatMap(p => [p.o, ...(p.h || [])])).map(r => {
    const pts = []; for (let i = 0; i < r.length; i += 2) pts.push(local(r.slice(i, i + 2))); return pts;
  });
  const onBorder = (u, v) => border.some(r => r.some((a, i) => {
    const b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(u - a[0] - t * dx, v - a[1] - t * dz) < .02;
  }));
  P.push(x, 0, z, rot);
  for (const piece of pieces) {
    let parts = [piece.map(local)];
    for (const [a, b] of lines) parts = parts.flatMap(p => [clipHalf(p, a, b, true), clipHalf(p, a, b, false)])
      .filter(p => p.length >= 3 && Math.abs(area2(p)) > 1e-5);
    for (const raw of parts) {
      const part = cleanRing(raw); if (part.length < 3 || Math.abs(area2(part)) < 1e-5) continue;
      const pts = part.map(([u, v]) => [u, yAt(u, v), v]);
      const a = pts[0], b = pts[1], d = pts[2], u = b.map((v, i) => v - a[i]), v = d.map((v, i) => v - a[i]);
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[1] < 0) n = n.map(v => -v);
      const len = Math.hypot(...n); if (len < 1e-7) continue;
      n = n.map(v => v / len);
      const topMat=shadeMat&&(n[0]+n[2])<-.01?shadeMat:mat;
      P.fan(topMat, pts, n); P.fan(mat, pts.map(([u, y, v]) => [u, y - .16, v]), n.map(v => -v));
      for (let i = 0; i < part.length; i++) {
        const a = part[i], b = part[(i + 1) % part.length];
        if (!onBorder((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
        const ya = yAt(...a), yb = yAt(...b), normal = [b[1] - a[1], 0, a[0] - b[0]];
        if (Math.max(ya, yb) > eave + .19) P.quad(wallMat, [a[0], eave - .08, a[1]], [b[0], eave - .08, b[1]], [b[0], yb - .16, b[1]], [a[0], ya - .16, a[1]], normal);
        P.quad(mat, [a[0], ya - .16, a[1]], [b[0], yb - .16, b[1]], [b[0], yb, b[1]], [a[0], ya, a[1]], normal);
      }
    }
  }
  P.pop();
  return (px, pz) => yAt(...local([px, pz]));
}
