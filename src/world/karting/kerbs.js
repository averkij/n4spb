// The three sections share their edges with the rendered mesh and the wheels'
// contact surface. Height varies slightly along the painted blocks.
export const KERB_PROFILE = [
  { offset: 0, height: .008 },
  { offset: .20, height: .087 },
  { offset: .43, height: .087 },
  { offset: .54, height: .006 },
];
const CELL = 4;
const key = (x, z) => x * 65536 + z;

export function createTrackSurfaceIndex() {
  const cells = new Map();
  function addTriangle(a, b, c, section) {
    const ux = b[0] - a[0], uz = b[2] - a[2], vx = c[0] - a[0], vz = c[2] - a[2];
    const det = ux * vz - uz * vx;
    if (Math.abs(det) < 1e-6) return;
    const uy = b[1] - a[1], vy = c[1] - a[1];
    const gx = (uy * vz - vy * uz) / det, gz = (vy * ux - uy * vx) / det;
    const plane = {
      gx, gz, section,
      height(x, z) { return a[1] + gx * (x - a[0]) + gz * (z - a[2]); },
      contains(x, z) {
        const dx = x - a[0], dz = z - a[2];
        const u = (dx * vz - dz * vx) / det, v = (dz * ux - dx * uz) / det;
        return u >= -1e-7 && v >= -1e-7 && u + v <= 1 + 1e-7;
      },
    };
    const [x0, x1] = [Math.min(a[0], b[0], c[0]), Math.max(a[0], b[0], c[0])];
    const [z0, z1] = [Math.min(a[2], b[2], c[2]), Math.max(a[2], b[2], c[2])];
    for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++) {
      for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) {
        const k = key(ix, iz);
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(plane);
      }
    }
  }
  return {
    addFace([a, b, c, d], section) {
      addTriangle(a, b, c, section);
      addTriangle(a, c, d, section);
    },
    at(x, z) {
      const planes = cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
      return planes?.find(plane => plane.contains(x, z)) ?? null;
    },
  };
}
