// landmarksKamennyDachasEast/wing.js - the WING of the Oldenburg dacha (OSM w31065814, "Флигель дачи принца П. Г. Ольденбургского", Malaya Nevka embankment 13; photo O09 of docs/research/kamenny-2026.md): a two-storey
// ochre-yellow stucco house 14.1 x 23.1 m on a stone footing, white flat pilaster strips between the window bays (eight bays on the long walls, four on the ends), white-framed windows of six panes, two brown wooden doors
// with black pent canopies on scroll brackets on the east long wall, a stepped white cornice with an attic band, a grey sheet-iron hip roof with three pale stucco chimneys.  Exterior only, solid.
// Frame WG (frame.js): +z = the long axis (SSE), local +x = ENE.  Collectors: P = shell (LOD 1100 m), N = near detail (window surrounds, canopy brackets, chimney caps).
import { WG, WP } from './frame.js';
import { holedWall, Q, surround } from './facade.js';
import { band, ringEdges, polyOf } from './kit.js';

const { hw, hl, PL, E1, WT, CT, roofRise } = WP;
const on = (Ps, x, z, nx, nz, fn) => { for (const P of Ps) P.push(x, 0, z, Math.atan2(nx, nz)); try { return fn(); } finally { for (const P of Ps) P.pop(); } };

/** a hip roof over the half extents (hx, hz) at y0: the eaves overhang by `ov` and drop 0.15; the ridge runs along z */
function hipRoof(P, M, hx, hz, y0, rise, ov = 0.45) {
  const ex = hx + ov, ez = hz + ov, ye = y0 - 0.12, rl = hz - hx, yr = y0 + rise, u = 2.4;
  const sl = Math.hypot(ex, rise);
  P.quad(M.roof, [ex, ye, -ez], [ex, ye, ez], [0, yr, rl], [0, yr, -rl], [rise, ex, 0], [[-ez / u, 0], [ez / u, 0], [rl / u, sl / u], [-rl / u, sl / u]]);
  P.quad(M.roof, [-ex, ye, ez], [-ex, ye, -ez], [0, yr, -rl], [0, yr, rl], [-rise, ex, 0], [[-ez / u, 0], [ez / u, 0], [rl / u, sl / u], [-rl / u, sl / u]]);
  const sh = Math.hypot(ez - rl, rise);
  P.fan(M.roof, [[ex, ye, ez], [-ex, ye, ez], [0, yr, rl]], [0, ez - rl, rise], (p) => [p[0] / u, p[1] / u]);
  P.fan(M.roof, [[-ex, ye, -ez], [ex, ye, -ez], [0, yr, -rl]], [0, ez - rl, -rise], (p) => [p[0] / u, p[1] / u]);
  P.quad(M.shade, [-ex, ye, -ez], [ex, ye, -ez], [ex, ye, ez], [-ex, ye, ez], [0, -1, 0]);                                   // the soffit
  void sh;
}

export async function build(K) {
  const { M, P, N } = K;
  P.push(WG.ox, 0, WG.oz, WG.rot); N.push(WG.ox, 0, WG.oz, WG.rot);
  try {
    P.box(M.plinth, -hw - 0.1, hw + 0.1, 0, PL, -hl - 0.1, hl + 0.1, 'b', 1.8);
    const faces = [
      { x: hw, z: 0, nx: 1, nz: 0, w: 2 * hl, nb: 8, doors: true }, { x: -hw, z: 0, nx: -1, nz: 0, w: 2 * hl, nb: 8, doors: false },
      { x: 0, z: hl, nx: 0, nz: 1, w: 2 * hw, nb: 4, doors: false }, { x: 0, z: -hl, nx: 0, nz: -1, w: 2 * hw, nb: 4, doors: false },
    ];
    for (const f of faces) {
      on([P, N], f.x, f.z, f.nx, f.nz, () => {
        const pitch = f.w / f.nb, H = [];
        for (let i = 0; i < f.nb; i++) {
          const cx = -f.w / 2 + (i + 0.5) * pitch, door = f.doors && (i === 1 || i === 6);
          if (door) H.push({ x0: cx - 0.55, x1: cx + 0.55, y0: PL + 0.05, y1: PL + 2.35, kind: 'door' });
          else H.push({ x0: cx - 0.75, x1: cx + 0.75, y0: 1.3, y1: 3.2, kind: 'win' });
          H.push({ x0: cx - 0.75, x1: cx + 0.75, y0: 4.9, y1: 6.6, kind: 'win' });
        }
        holedWall(P, M.stucco, -f.w / 2, f.w / 2, PL, WT, H, { depth: 0.3, uvs: 3 });
        const z = -0.26;
        for (const h of H) {
          const S = h.kind === 'door' ? M.doorW : M.winW;
          Q(P, S, [h.x0, h.y0, z], [h.x1, h.y0, z], [h.x1, h.y1, z], [h.x0, h.y1, z], [0, 0, 1]);
          if (h.kind === 'win') surround(N, M.white, h, { sw: 0.08, proud: 0.05, sill: 0.1 });
          else {
            surround(N, M.white, h, { sw: 0.1, proud: 0.05, sill: 0 });
            const cx = (h.x0 + h.x1) / 2, yc = h.y1 + 0.28;                                                    // the pent canopy: a sloped black sheet on two scroll brackets
            P.quad(M.iron, [cx - 0.95, yc, 0.02], [cx + 0.95, yc, 0.02], [cx + 0.95, yc - 0.32, 0.95], [cx - 0.95, yc - 0.32, 0.95], [0, 1, 0.35]);
            P.quad(M.iron, [cx - 0.95, yc - 0.04, 0.02], [cx - 0.95, yc - 0.36, 0.95], [cx + 0.95, yc - 0.36, 0.95], [cx + 0.95, yc - 0.04, 0.02], [0, -1, -0.35]);
            for (const s of [-1, 1]) { N.cyl(M.iron, [cx + s * 0.8, yc - 0.55, 0.03], [cx + s * 0.8, yc - 0.05, 0.03], 0.025, 0.025, 4, false); N.cyl(M.iron, [cx + s * 0.8, yc - 0.55, 0.03], [cx + s * 0.8, yc - 0.34, 0.9], 0.02, 0.02, 4, false); }
          }
        }
        // the white flat pilaster strips between the bays (and a half strip at each corner)
        for (let i = 0; i <= f.nb; i++) {
          const x = -f.w / 2 + i * pitch;
          P.box(M.white, Math.max(x - 0.3, -f.w / 2), Math.min(x + 0.3, f.w / 2), PL, WT, 0, 0.07, 'kb', 1);
        }
        P.box(M.white, -f.w / 2, f.w / 2, E1 - 0.1, E1 + 0.14, 0, 0.13, 'k', 1);                           // the string course between the floors, over the strips
      });
    }
    // ---- stepped cornice with the attic band, the hip roof, chimneys
    const ring = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]];
    const edges = ringEdges(polyOf(ring));
    band(P, edges, WT, WT + 0.3, 0.1, { front: M.white, top: null, under: null }, { uvs: 3 });
    band(P, edges, WT + 0.3, CT, 0.4, { front: M.stucco, top: M.white, under: M.shade }, { uvs: 3 });
    hipRoof(P, M, hw, hl, CT, roofRise);
    for (const z of [-3.6, 0.2, 3.6]) {
      const y0 = CT + roofRise * (1 - Math.abs(z) / (hl - hw) * 0.0) - 0.4;
      P.box(M.chimney, -0.5, 0.5, CT + roofRise - 0.4, CT + roofRise + 1.6, z - 0.5, z + 0.5, 'b', 2);
      N.box(M.white, -0.58, 0.58, CT + roofRise + 1.6, CT + roofRise + 1.75, z - 0.58, z + 0.58, 'b', 1);
      void y0;
    }
  } finally { P.pop(); N.pop(); }
}
