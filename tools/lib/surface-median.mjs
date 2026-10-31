// Median audit pairing must match streets/net.js fillMedians, while still
// reporting wider reservations as exceptions. Widths vary along a segment.
export function partnerWidth(w, i, t, right) {
  const h = right ? w.hR : w.hL;
  return h[i] + (h[i + 1] - h[i]) * t;
}

// A line projected far past the segment's end is not between two parallel
// carriageways; clamping it would invent a diagonal median at a junction.
export function projectsToSegment(t, length, tolerance = 0.2) {
  return t * length >= -tolerance && (t - 1) * length <= tolerance;
}

export function pairedStreet(w, v, dot, gap, x, z, layout) {
  if (dot > -0.85) return false;
  if (v.name !== w.name && v.name && w.name && !(w.rank >= 3 && v.rank >= 3) && !(gap < 3 && w.rank >= 2 && v.rank >= 2)) return false;
  return !(layout.inRiver?.(x, z) || layout.insideBuilding?.(x, z, 0));
}
// A pedestrian square or mapped traffic island is not a carriageway merely
// because two opposing roads pass beside it. Actual lane samples stay audited.
export function mappedMedian(o,areas,inside){
 return o.kind==='median'&&/^area-(square-flush|island)$/.test(o.cause)&&areas.some(a=>['square','traffic_island'].includes(a.hw)&&a.polys.some(p=>inside(o.x,o.z,p.o)));
}
