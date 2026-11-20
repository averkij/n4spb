// Ground paint describes the layer UNDER road ribbons. Tyres must sample the
// rendered carriageway first, then fall back to lawn/gravel/paving roughness.
const ROUGHNESS = { grass: 1, gravel: .8, setts: .35 };
const roads = new WeakMap(), CELL = 32;
function roadIndex(net) {
  if (roads.has(net)) return roads.get(net);
  const skipSet = new Set(net.ways.filter(w => w.pedestrianOnly || w.tramBed));
  const options = { skipSet, noBed: true, noFillets: true }, cells = new Map();
  for (const f of net.fillets ?? []) {
    if (f.ways.some(w => skipSet.has(w) || w.skipDraw)) continue;
    for (let x = Math.floor(f.box[0] / CELL); x <= Math.floor(f.box[1] / CELL); x++) {
      for (let z = Math.floor(f.box[2] / CELL); z <= Math.floor(f.box[3] / CELL); z++) {
        const key = x * 4096 + z;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(f);
      }
    }
  }
  const result = { options, cells }; roads.set(net, result); return result;
}
function inRing(points, x, z) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function createKartRoughness(ctx) {
  return (x, z) => {
    const net = ctx.services?.streets?.net;
    if (net) {
      const { options, cells } = roadIndex(net);
      if (net.cover(x, z, options) >= 0) return 0;
      const patches = cells.get(Math.floor(x / CELL) * 4096 + Math.floor(z / CELL));
      if (patches) for (const f of patches) {
        if (x >= f.box[0] && x <= f.box[1] && z >= f.box[2] && z <= f.box[3] && inRing(f.poly, x, z)) return 0;
      }
    }
    return ROUGHNESS[ctx.services?.environment?.kindAt(x, z)] ?? 0;
  };
}
