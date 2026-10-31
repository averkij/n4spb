// landmarksPetrovskyYacht/hall.js - the MAIN BUILDING of the St Petersburg River Yacht Club (Главное здание Центрального ленинградского яхт-клуба, Петровская коса 9 лит. К; 1969-80, V. Maslov, G. Morozov,
// A. Belyavskaya, O. Kurbatov, B. Mironkov; a heritage object): a 39.9 x 39.6 m "crystal" frame of three storeys on a stone podium.  Photos y01 y02 y03 y04 y05 y06 y07 of the dossier PHOTO TABLE.
//   Ground floor: the glazed / solid walls recessed 2.4 m behind white concrete Y pillars (one every 6.6 m, a flared foot, a stem and two arms) that carry the waffle-slab first floor;
//   first floor: a continuous glazed curtain wall (blue posts, white frames) behind a 1.3 m balcony ring with a blue railing and white zig-zag concrete struts (Y shaped, between the pillars) up to the second slab
//   (white band, blue stripe); above: the sloped band (45 deg, plan inset 2.3 m) of corrugated grey triangles apex up over dark glass, rusty hip edges; the parapet band with a white roof railing,
//   a stepped glass lantern with a lattice antenna mast, a smaller lantern at the east end with a vent stack, air-conditioner boxes; the stone-veneer podium with granite paving, two tiers, wide steps at the
//   south entrance and at the west end of the north hall; the glazed north hall and the west pavilion (the OSM annexes w200731329 / w200731324); the entrance door stands between two pillars at u = 3.5 (photo y04); the west terrace with white furniture under the slab.
//   Sides: S land entrance (central door, lattice windows) · N harbour hall (east 4 bays solid, 6 glazed bays under the canopy) · W terrace (glazed) · E solid.  No flags, no flagpoles, no logos.
//   Everything is in the building frame (frame.js MAIN): x along the south edge, z = south normal.
import { MAIN, H, P as PL, POD, ANNEX_N, ANNEX_W, mainWorld, DEG } from './frame.js';
import { reserve } from './labels.js';

const { F, apron, s1b, s1t, s2b, s2t, top, par } = H;
const { hx, hz, gi, gi1, slope, terr, aprW } = PL;
const DOOR_U = 3.5;
export const SIDES = [
  { n: 'S', rot: 0, hu: hx, hd: hz },
  { n: 'E', rot: Math.PI / 2, hu: hz, hd: hx },
  { n: 'N', rot: Math.PI, hu: hx, hd: hz },
  { n: 'W', rot: -Math.PI / 2, hu: hz, hd: hx },
];
/** ground-floor bay maps (10 bays between the recessed corners, u to the right as seen from outside): S solid slot window, G glass hall, L lattice windows, D door (glass) */
const MAPS = {
  S: ['S', 'G', 'G', 'G', 'G', 'S', 'S', 'L', 'L', 'L'],
  N: ['S', 'S', 'S', 'S', 'G', 'G', 'G', 'G', 'G', 'G'],
  W: ['S', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'S'],
  E: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};
const PITCH = 6.6;

function stepsOut(P, M, u0, u1, zEdge, n, rise, tread, y0) {              // a flight of n steps leaving a platform edge at z = zEdge outwards (+z), lowest step furthest out
  for (let i = 0; i < n; i++) P.box(M.granite, u0, u1, 0, y0 + (i + 1) * rise, zEdge, zEdge + (n - i) * tread, 'bk', 1.5);
}

export function build(K) {
  const { P, M, shared } = K;
  const stems = (shared.stems = []);
  P.push(MAIN.x, 0, MAIN.z, MAIN.rot);
  P.far = 900;
  const A = POD.A, B = POD.B;
  const ring = (R) => [[R.x0, R.z0], [R.x1, R.z0], [R.x1, R.z1], [R.x0, R.z1]];

  // ---------------------------------------------------------------------------------------------- podium: terrace A (F), apron B, faces of rubble
  P.box(M.rubble, B.x0, B.x1, 0, apron, B.z0, B.z1, 'tb', 2);
  P.cap(M.granite, ring(B), apron, true, 1.5, [[[A.x0, A.z0], [A.x0, A.z1], [A.x1, A.z1], [A.x1, A.z0]]]);
  P.box(M.rubble, A.x0, A.x1, 0, F, A.z0, A.z1, 'tb', 2);
  P.cap(M.granite, ring(A), F, true, 1.5);
  // steps (a flight leaves the platform edge outwards in the frame of its side): south entrance, east side, north hall west end, west terrace
  const flights = (rot, u0, u1, zA, zB) => { P.push(0, 0, 0, rot); stepsOut(P, M, u0, u1, zB, 3, apron / 3, 0.42, 0); stepsOut(P, M, u0, u1, zA, 3, (F - apron) / 3, 0.38, apron); P.pop(); };
  flights(0, -1.7, 8.7, A.z1, B.z1);                                  // south entrance
  flights(Math.PI / 2, 0.7, 4.7, A.x1, B.x1);                         // east: the mapped steps way w1283202715
  flights(Math.PI, 21.0, 26.0, -A.z0, -B.z0);                         // north hall, west end (u runs west)
  flights(-Math.PI / 2, 1.3, 5.3, -A.x0, -B.x0);                         // west terrace, south of the west pavilion

  // ---------------------------------------------------------------------------------------------- the first slab (waffle underside) and the ground floor
  P.quad(M.soffit, [-hx, s1b, -hz], [hx, s1b, -hz], [hx, s1b, hz], [-hx, s1b, hz], [0, -1, 0], [[-hx / 2.2, -hz / 2.2], [hx / 2.2, -hz / 2.2], [hx / 2.2, hz / 2.2], [-hx / 2.2, hz / 2.2]]);
  P.box(M.conc, -hx, hx, s1b, s1t, -hz, hz, 'b', 3);
  for (const s of SIDES) {
    P.push(0, 0, 0, s.rot);
    const hu = s.hu - gi, wz = s.hd - gi, map = MAPS[s.n], nb = map.length, bw = 2 * hu / nb;
    let i = 0;
    while (i < nb) {                                                          // runs of one kind become one quad
      const k = map[i] === 'D' ? 'G' : map[i]; let j = i; while (j < nb && (map[j] === 'D' ? 'G' : map[j]) === k) j++;
      const mat = k === 'S' ? M.wallSolid : k === 'L' ? M.glassLattice : M.glassGround, u0 = -hu + i * bw, u1 = -hu + j * bw;
      P.quad(mat, [u0, F, wz], [u1, F, wz], [u1, s1b, wz], [u0, s1b, wz], [0, 0, 1], [[0, 0], [j - i, 0], [j - i, 1], [0, 1]]);
      i = j;
    }
    // the dark back of the arcade ceiling is the slab underside; the door frames of the S side
    if (s.n === 'S') {                                                       // the entrance door: grey leaves in a white frame with a lintel (the plaque goes on the lintel)
      P.box(M.metal, DOOR_U - 0.72, DOOR_U + 0.72, F, F + 2.2, wz + 0.01, wz + 0.09, 'kb', 1);
      P.quad(M.glassGround, [DOOR_U - 0.62, F + 0.2, wz + 0.1], [DOOR_U + 0.62, F + 0.2, wz + 0.1], [DOOR_U + 0.62, F + 2.1, wz + 0.1], [DOOR_U - 0.62, F + 2.1, wz + 0.1], [0, 0, 1], [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9], [0.2, 0.9]]);
      P.box(M.white, DOOR_U - 0.84, DOOR_U - 0.72, F, F + 2.45, wz, wz + 0.2, 'kb', 1); P.box(M.white, DOOR_U + 0.72, DOOR_U + 0.84, F, F + 2.45, wz, wz + 0.2, 'kb', 1); P.box(M.white, DOOR_U - 0.9, DOOR_U + 0.9, F + 2.2, F + 2.6, wz, wz + 0.26, 'kb', 1);
      if (reserve(K.ctx, 'pyacht-plaque', mainWorld(6.4, wz + 0.04), F + 1.85, 1.0, 0.25, [-Math.sin(16 * DEG), Math.cos(16 * DEG)], 'plate'))
        P.quad(M.plaque, [5.9, F + 1.725, wz + 0.04], [6.9, F + 1.725, wz + 0.04], [6.9, F + 1.975, wz + 0.04], [5.9, F + 1.975, wz + 0.04], [0, 0, 1]);
    }
    // ---- ground-floor Y pillars: stems k 0..5 (the corner pillar is built by the previous side), arms k 0..6 (only inwards at the corners)
    const zc = s.hd - 0.55, pk = 2 * s.hu / 6;
    for (let k = 0; k <= 6; k++) {
      const u = -s.hu + k * pk + (k === 0 ? 0.55 : k === 6 ? -0.55 : 0);
      if (k < 6) {
        P.box(M.conc, u - 0.26, u + 0.26, F, s1b + 0.05, zc - 0.26, zc + 0.26, '', 3); P.box(M.conc, u - 0.46, u + 0.46, F, F + 0.4, zc - 0.46, zc + 0.46, 'b', 3);
        stems.push({ lx: u * Math.cos(s.rot) + zc * Math.sin(s.rot), lz: -u * Math.sin(s.rot) + zc * Math.cos(s.rot) });
      }
      const reach = 1.95;
      if (k > 0) P.beam(M.conc, [[u, F + 0.5, zc], [u - reach, s1b + 0.1, zc]], 0.5, 0.42, [0, 0, 1], 3);
      if (k < 6) P.beam(M.conc, [[u, F + 0.5, zc], [u + reach, s1b + 0.1, zc]], 0.5, 0.42, [0, 0, 1], 3);
    }
    P.pop();
  }

  // ---------------------------------------------------------------------------------------------- the first floor: curtain wall behind a balcony ring, blue railing, zig-zag Y struts
  for (const s of SIDES) {
    P.push(0, 0, 0, s.rot);
    const hu = s.hu - gi1, wz = s.hd - gi1, nb = 12;
    P.quad(M.glassFirst, [-hu, s1t, wz], [hu, s1t, wz], [hu, s2b, wz], [-hu, s2b, wz], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
    // the blue railing at the slab edge (alpha tube railing, 1.05 m)
    P.ranged(260, () => P.quad(M.railBlue, [-s.hu + 0.1, s1t, s.hd - 0.12], [s.hu - 0.1, s1t, s.hd - 0.12], [s.hu - 0.1, s1t + 1.05, s.hd - 0.12], [-s.hu + 0.1, s1t + 1.05, s.hd - 0.12], [0, 0, 1], [[0, 0], [(2 * s.hu - 0.2) / 2.0, 0], [(2 * s.hu - 0.2) / 2.0, 1], [0, 1]]));
    const zs = s.hd - 0.45, pk = 2 * s.hu / 6;
    for (let k = 0; k < 6; k++) {                                              // Y struts between the ground pillars (u offset half a pitch)
      const u = -s.hu + (k + 0.5) * pk;
      P.box(M.conc, u - 0.24, u + 0.24, s1t - 0.02, s2b + 0.04, zs - 0.24, zs + 0.24, '', 3);
      P.beam(M.conc, [[u, s1t + 0.35, zs], [u - 1.75, s2b + 0.08, zs]], 0.46, 0.36, [0, 0, 1], 3);
      P.beam(M.conc, [[u, s1t + 0.35, zs], [u + 1.75, s2b + 0.08, zs]], 0.46, 0.36, [0, 0, 1], 3);
    }
    for (const sg of [-1, 1]) {                                               // corner posts of the first floor
      const u = sg * (s.hu - 0.55);
      if (sg > 0) { P.box(M.conc, u - 0.26, u + 0.26, s1t - 0.02, s2b + 0.04, zs - 0.26, zs + 0.26, '', 3); P.beam(M.conc, [[u, s1t + 0.35, zs], [u - 1.75, s2b + 0.08, zs]], 0.46, 0.36, [0, 0, 1], 3); }
      else P.beam(M.conc, [[u, s1t + 0.35, zs], [u + 1.75, s2b + 0.08, zs]], 0.46, 0.36, [0, 0, 1], 3);
    }
    P.pop();
  }

  // ---------------------------------------------------------------------------------------------- the second slab, the sloped band, the parapet, the roof
  P.quad(M.soffit, [-hx, s2b, -hz], [hx, s2b, -hz], [hx, s2b, hz], [-hx, s2b, hz], [0, -1, 0], [[-hx / 2.2, -hz / 2.2], [hx / 2.2, -hz / 2.2], [hx / 2.2, hz / 2.2], [-hx / 2.2, hz / 2.2]]);
  const slopeLen = Math.hypot(slope, top - s2t), nrm = [0, slope / slopeLen, (top - s2t) / slopeLen];
  for (const s of SIDES) {
    P.push(0, 0, 0, s.rot);
    P.quad(M.conc, [-s.hu, s2b, s.hd], [s.hu, s2b, s.hd], [s.hu, s2t - 0.3, s.hd], [-s.hu, s2t - 0.3, s.hd], [0, 0, 1], [[-s.hu / 3, s2b / 3], [s.hu / 3, s2b / 3], [s.hu / 3, (s2t - 0.3) / 3], [-s.hu / 3, (s2t - 0.3) / 3]]);
    P.quad(M.blue, [-s.hu, s2t - 0.3, s.hd], [s.hu, s2t - 0.3, s.hd], [s.hu, s2t, s.hd], [-s.hu, s2t, s.hd], [0, 0, 1]);
    const u1 = s.hu - slope, nm = 12;
    P.quad(M.triBand, [-s.hu, s2t, s.hd], [s.hu, s2t, s.hd], [u1, top, s.hd - slope], [-u1, top, s.hd - slope], nrm,
      [[0, 0], [nm, 0], [nm * (u1 + s.hu) / (2 * s.hu), 1], [nm * (s.hu - u1) / (2 * s.hu), 1]]);
    // the parapet band (inset by the slope) and its top
    P.box(M.conc, -u1, u1, top, par, s.hd - slope - 0.45, s.hd - slope, 'b', 3);
    P.pop();
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.beam(M.rust, [[sx * hx, s2t, sz * hz], [sx * (hx - slope), top, sz * (hz - slope)]], 0.28, 0.2, null, 1);   // rusty hip edges
  P.quad(M.tar, [-hx + slope + 0.45, par - 0.2, -hz + slope + 0.45], [hx - slope - 0.45, par - 0.2, -hz + slope + 0.45], [hx - slope - 0.45, par - 0.2, hz - slope - 0.45], [-hx + slope + 0.45, par - 0.2, hz - slope - 0.45], [0, 1, 0], [[0, 0], [8, 0], [8, 8], [0, 8]]);
  // roof railing on the parapet (white tube railing, alpha)
  P.ranged(260, () => {
    for (const s of SIDES) {
      P.push(0, 0, 0, s.rot);
      const u1 = s.hu - slope - 0.1, zr = s.hd - slope - 0.2;
      P.quad(M.railWhite, [-u1, par, zr], [u1, par, zr], [u1, par + 1.1, zr], [-u1, par + 1.1, zr], [0, 0, 1], [[0, 0], [2 * u1 / 2.0, 0], [2 * u1 / 2.0, 1], [0, 1]]);
      // air-conditioner boxes on the outer face of the parapet (S and N only)
      if (s.n === 'S' || s.n === 'N') for (const u of [-14, -6.5, 2, 9.5, 15]) P.box(M.white, u - 0.4, u + 0.4, par - 0.95, par - 0.4, s.hd - slope + 0.0, s.hd - slope + 0.32, 'kb', 1);
      P.pop();
    }
  });

  // ---------------------------------------------------------------------------------------------- the lanterns and the mast
  const frustum = (cx, cz, y0, y1, w0, w1, mat, tiles) => {
    for (const s of SIDES) {
      P.push(cx, 0, cz, s.rot);
      const a = w0 / 2, b = w1 / 2, n = [0, (a - b) / Math.hypot(a - b, y1 - y0), (y1 - y0) / Math.hypot(a - b, y1 - y0)];
      P.quad(mat, [-a, y0, a], [a, y0, a], [b, y1, b], [-b, y1, b], n, [[0, 0], [tiles, 0], [tiles * (a + b) / (2 * a), 1], [tiles * (a - b) / (2 * a), 1]]);
      P.pop();
    }
    P.box(M.conc, cx - b0(w1), cx + b0(w1), y1, y1 + 0.35, cz - b0(w1), cz + b0(w1), 'b', 3);
  };
  const b0 = (w) => w / 2 + 0.25;
  P.box(M.conc, -4.9, 4.9, par - 0.2, par + 0.45, -4.9, 4.9, 'b', 3);                      // the kerb of the main lantern
  frustum(0, 0, par + 0.45, par + 3.2, 9.6, 4.4, M.triBand, 3);
  P.box(M.metal, -0.8, 0.8, par + 3.55, par + 4.3, -0.8, 0.8, '', 2);                       // the mast base box
  P.box(M.conc, 8.4, 14.6, par - 0.2, par + 0.4, -7.6, -2.0, 'b', 3);                       // the kerb of the second lantern (east end, north half)
  frustum(11.5, -4.8, par + 0.4, par + 3.0, 5.6, 3.2, M.triBand, 2);
  P.box(M.metal, 12.2, 12.65, par + 3.4, par + 7.0, -4.4, -3.95, '', 1);                    // its vent stack
  P.ranged(420, () => {                                                                       // the lattice antenna mast: three legs, ties, three guys, panel antennas
    const base = par + 4.3, topY = par + 19.0, R = 0.34;
    const leg = (i) => [Math.cos(i * 2.0944 + 0.5) * R, Math.sin(i * 2.0944 + 0.5) * R];
    for (let i = 0; i < 3; i++) { const l = leg(i); P.cyl(M.metal, [l[0], base, l[1]], [l[0], topY, l[1]], 0.04, 0.04, 5, false); }
    for (let y = base + 0.5; y < topY; y += 1.5) for (let i = 0; i < 3; i++) { const a = leg(i), b = leg((i + 1) % 3); P.cyl(M.metal, [a[0], y, a[1]], [b[0], y, b[1]], 0.022, 0.022, 4, false); }
    for (let y = base + 0.5; y + 1.5 < topY; y += 3.0) for (let i = 0; i < 3; i++) { const a = leg(i), b = leg((i + 1) % 3); P.cyl(M.metal, [a[0], y, a[1]], [b[0], y + 1.5, b[1]], 0.018, 0.018, 4, false); }
    for (let i = 0; i < 3; i++) { const a = i * 2.0944 + 1.2; P.cyl(M.metal, [Math.cos(a) * 0.3, topY - 4.5, Math.sin(a) * 0.3], [Math.cos(a) * 5.5, par + 3.0, Math.sin(a) * 5.5], 0.012, 0.012, 3, false); }
    for (let i = 0; i < 3; i++) { const a = i * 2.0944 + 0.2; P.tbox(M.white, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.26, 0.12, topY - 3.0, topY - 1.6, a, '', 1); }
    P.cyl(M.metal, [0, topY, 0], [0, topY + 1.4, 0], 0.025, 0.02, 4, true);
  });

  // ---------------------------------------------------------------------------------------------- the two annexes of the ground floor: the glazed NORTH HALL under its flat roof (w200731329, photo y01) and the WEST PAVILION (w200731324, y05 y06)
  {
    const yR = F + 3.1, wz = -(hz - gi);                                       // roof underside / the recessed wall plane of the north side
    const N = ANNEX_N, W = ANNEX_W, nb = 6, bw = (N.x1 - N.x0 - 0.8) / nb, zf = N.z0 + 0.5, x0 = N.x0 + 0.4;
    // north hall: roof plate (grey metal, 0.15 m) from the building to the front, white fascia, glass front in bays with white posts and X braces, solid east end
    P.box(M.metal, N.x0, N.x1, yR, yR + 0.16, N.z0, wz + 1.0, 'b', 2);
    P.quad(M.soffit, [N.x0, yR, N.z0], [N.x1, yR, N.z0], [N.x1, yR, wz + 1.0], [N.x0, yR, wz + 1.0], [0, -1, 0], [[N.x0 / 2.2, N.z0 / 2.2], [N.x1 / 2.2, N.z0 / 2.2], [N.x1 / 2.2, (wz + 1.0) / 2.2], [N.x0 / 2.2, (wz + 1.0) / 2.2]]);
    P.box(M.white, N.x0, N.x1, yR - 0.22, yR, N.z0, N.z0 + 0.14, 'kb', 1);
    P.quad(M.glassGround, [x0, F, zf], [x0 + nb * bw, F, zf], [x0 + nb * bw, yR - 0.05, zf], [x0, yR - 0.05, zf], [0, 0, -1], [[nb, 0], [0, 0], [0, 1], [nb, 1]]);
    for (let i = 0; i <= nb; i++) { const x = x0 + i * bw; P.box(M.white, x - 0.07, x + 0.07, F, yR, zf - 0.07, zf + 0.07, '', 1); if (i < nb) { P.cyl(M.white, [x, F + 0.1, zf - 0.08], [x + bw, yR - 0.1, zf - 0.08], 0.035, 0.035, 4, false); P.cyl(M.white, [x + bw, F + 0.1, zf - 0.08], [x, yR - 0.1, zf - 0.08], 0.035, 0.035, 4, false); } }
    P.quad(M.wallSolid, [N.x1 - 0.02, F, N.z0 + 0.05], [N.x1 - 0.02, F, wz + 1.0], [N.x1 - 0.02, yR, wz + 1.0], [N.x1 - 0.02, yR, N.z0 + 0.05], [1, 0, 0], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    // west pavilion: roof plate, glass on its west side and both ends (closed club: no door is drawn)
    const wx = -(hx - gi);
    P.box(M.metal, W.x0, wx + 1.0, yR, yR + 0.16, W.z0, W.z1, 'b', 2);
    P.quad(M.soffit, [W.x0, yR, W.z0], [wx + 1.0, yR, W.z0], [wx + 1.0, yR, W.z1], [W.x0, yR, W.z1], [0, -1, 0], [[W.x0 / 2.2, W.z0 / 2.2], [(wx + 1) / 2.2, W.z0 / 2.2], [(wx + 1) / 2.2, W.z1 / 2.2], [W.x0 / 2.2, W.z1 / 2.2]]);
    const wb = 4, wbw = (W.z1 - W.z0 - 0.8) / wb, xf = W.x0 + 0.5, z0 = W.z0 + 0.4;
    P.quad(M.glassGround, [xf, F, z0 + wb * wbw], [xf, F, z0], [xf, yR - 0.05, z0], [xf, yR - 0.05, z0 + wb * wbw], [-1, 0, 0], [[wb, 0], [0, 0], [0, 1], [wb, 1]]);
    for (let i = 0; i <= wb; i++) { const z = z0 + i * wbw; P.box(M.white, xf - 0.07, xf + 0.07, F, yR, z - 0.07, z + 0.07, '', 1); }
    P.quad(M.glassGround, [xf, F, W.z0 + 0.05], [wx + 0.5, F, W.z0 + 0.05], [wx + 0.5, yR - 0.05, W.z0 + 0.05], [xf, yR - 0.05, W.z0 + 0.05], [0, 0, -1], [[0, 0], [1.4, 0], [1.4, 1], [0, 1]]);
    P.quad(M.glassGround, [wx + 0.5, F, W.z1 - 0.05], [xf, F, W.z1 - 0.05], [xf, yR - 0.05, W.z1 - 0.05], [wx + 0.5, yR - 0.05, W.z1 - 0.05], [0, 0, 1], [[1.4, 0], [0, 0], [0, 1], [1.4, 1]]);
  }

  // ---------------------------------------------------------------------------------------------- white furniture of the west terrace (under the slab and on the terrace)
  P.ranged(140, () => {
    P.push(0, 0, 0, -Math.PI / 2);
    const chair = (x, z, rot) => { P.push(x, F, z, rot); P.box(M.white, -0.22, 0.22, 0.42, 0.47, -0.22, 0.22, 'b', 1); for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) P.box(M.white, lx - 0.02, lx + 0.02, 0, 0.42, lz - 0.02, lz + 0.02, 'tb', 1); P.box(M.white, -0.22, 0.22, 0.47, 0.95, -0.24, -0.2, 'b', 1); P.pop(); };
    for (const u of [-1.5, 2, 5.5, 9, 12.5, 16]) {
      const z = hx - 1.25;
      P.box(M.white, u - 0.4, u + 0.4, F + 0.68, F + 0.73, z - 0.4, z + 0.4, 'b', 1); P.box(M.white, u - 0.03, u + 0.03, F, F + 0.68, z - 0.03, z + 0.03, 'tb', 1);
      chair(u - 0.7, z, Math.PI / 2); chair(u + 0.7, z, -Math.PI / 2);
    }
    P.pop();
  });
  // ---------------------------------------------------------------------------------------------- the white concrete bowl-planters with a globe lamp and the blue slat benches of the podium (photos y05 y07)
  const planters = (shared.planters = []), benches = (shared.benches = []);
  P.ranged(160, () => {
    const planter = (x, z, y) => { P.col(M.white, x, z, y, y + 0.46, 0.5, 0.44, 12, true); P.col(M.white, x, z, y + 0.46, y + 0.54, 0.54, 0.54, 12, true); P.col(M.metal, x, z, y + 0.54, y + 0.7, 0.07, 0.07, 6, true); P.col(M.white, x, z, y + 0.7, y + 0.95, 0.19, 0.12, 8, true); planters.push({ x, z }); };
    for (const sx of [-1, 1]) { planter(sx * 6.6, A.z1 - 0.6, F); planter(sx * 6.6, B.z1 - 0.7, apron); }
    planter(A.x1 - 0.6, A.z1 - 0.6, F); planter(A.x0 + 0.6, A.z1 - 0.6, F); planter(A.x1 - 0.6, A.z0 + 0.6, F); planter(A.x1 - 0.6, 3.5, F); planter(A.x1 - 0.6, -7.5, F);
    const bench = (x, z, rot) => { P.push(x, F, z, rot); P.box(M.timber, -0.9, 0.9, 0.42, 0.48, -0.22, 0.22, '', 1); P.box(M.timber, -0.9, 0.9, 0.58, 0.9, -0.26, -0.21, '', 1); for (const sx of [-0.8, 0.8]) P.box(M.blue, sx - 0.04, sx + 0.04, 0, 0.9, -0.28, 0.24, '', 1); P.pop(); benches.push({ x, z, rot }); };
    bench(-11, A.z1 - 1.0, 0); bench(11, A.z1 - 1.0, 0); bench(A.x1 - 1.0, -14, Math.PI / 2); bench(A.x1 - 1.0, 9, Math.PI / 2);
  });
  P.pop();
  void H;
}
