// landmarksKamennyDachasWest/compound.js - the three small houses of the Gauswald compound (OSM w158330617 lit. P = the gate lodge, w158330618 lit. R = the steep-gabled house, w158330619 lit. N = the hip-roofed half-timber
// block; photos G02 G04 G07 G13): the same pale-green clapboard, dark-green members and red tiles as the main house.  Each house is its OSM ring (world metres) with clapboard walls, windows by wall length and a hip or
// gable roof over the oriented bounding box of the ring.  Exterior only, solid.
import { COMPOUND } from './frame.js';
import { ringEdges, polyOf, band } from './kit.js';
import { onE, spread, hip, gable, chimney, win } from './util.js';

const HOUSES = {
  w158330618: { eave: 5.0, roof: 'gable', rise: 3.8, storeys: 2, chim: [0.0, 0.0] },     // lit. R: the gabled house (G02 right)
  w158330619: { eave: 6.0, roof: 'hip', rise: 2.6, storeys: 2, chim: [0.2, 0.0] },       // lit. N: the hip-roof block (G02 middle, G04)
  w158330617: { eave: 3.2, roof: 'gable', rise: 2.2, storeys: 1, chim: [0.0, 0.0] },     // lit. P: the lodge by the gate (G04 left)
};

export async function build(K) {
  const { M, P, N } = K;
  for (const [id, ring] of Object.entries(COMPOUND)) {
    const o = HOUSES[id], edges = ringEdges(polyOf(ring));
    for (const e of edges) {
      onE([P, N], e, (len) => {
        P.quad(M.clap, [0, 0, 0], [len, 0, 0], [len, o.eave, 0], [0, o.eave, 0], [0, 0, 1], [[0, 0], [len / 1.6, 0], [len / 1.6, o.eave / 1.6], [0, o.eave / 1.6]]);
        N.box(M.greenD, -0.05, 0.1, 0.5, o.eave, 0, 0.06, 'k', 1);
        if (o.storeys > 1) N.box(M.greenD, 0, len, 2.9, 3.1, 0, 0.07, 'k', 1);
        for (const cx of spread(len, 3.2, 1.6)) for (let s = 0; s < o.storeys; s++) win(P, N, M.winG1D, M.clap, { cx, y0: 0.9 + s * 3.0, w: 1.1, h: 1.5 }, { sw: 0.12, proud: 0.06, sill: 0.08 });
      });
    }
    band(P, edges, 0, 0.5, 0.06, { front: M.limestone, top: M.limestone }, { uvs: 1.8 });
    // the oriented bounding box of the ring (axis = its longest edge)
    const le = edges.reduce((a, b) => (b.len > a.len ? b : a)), th = Math.atan2(le.b[1] - le.a[1], le.b[0] - le.a[0]), c = Math.cos(th), s = Math.sin(th);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const [x, z] of ring) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const um = (u0 + u1) / 2, vm = (v0 + v1) / 2, cx = um * c - vm * s, cz = um * s + vm * c, L = u1 - u0, Wd = v1 - v0;
    P.push(cx, 0, cz, -th);
    const base = { x0: -L / 2, x1: L / 2, z0: -Wd / 2, z1: Wd / 2, y: o.eave, rise: o.rise, ov: 0.55, tu: 1.4 };
    if (o.roof === 'hip') hip(P, M.tileG, base);
    else gable(P, M.tileG, M.halfG, { ...base, axis: L >= Wd ? 'x' : 'z', ovG: 0.5, gtu: 2.7 });
    chimney(P, M, o.chim[0], o.chim[1], o.eave + o.rise * 0.2, o.eave + o.rise + 1.2, 0.8, 0.8, M.brickRed);
    P.pop();
    // collider: the oriented box
    (K.shared.cols ||= []).push({ box: [cx, cz, L, Wd, -th, o.eave + o.rise] });
  }
}
