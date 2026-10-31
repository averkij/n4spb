// landmarksYelaginRossi/island.js - the SMALL ISLAND PAVILION ("Павильон на острове", late 18th - early 19th c.; federal heritage 7810363024; Wikidata Q136065240; address "Елагин остров, 4АЖ") on the west
// islet of the 3rd Southern pond.  It IS in OSM: the unnamed building w181430159 "4 литАЖ" (34 m2, a 6.1 x 5.5 m roof outline at (-5339.9,-5112.3), 20 deg off the east axis); the dossier's "not in OSM" was
// wrong (the researcher's geotag (-5480,-5154) is the pond tip, Wikidata P625 (-5343.1,-5115.7) lies 5 m SW of the outline).  Photos refs/yelagin-park-2026/rossi 13-15.
// A tall white open "gate": four square piers (0.95 m, 4.3 m above grey stone base courses), square capitals with an abacus, an architrave on all four sides with a Greek-key band and a small dentil cornice,
// a plain attic block and a low hipped roof of pale painted sheet metal with a broad overhang (roof 6.0 x 5.5 m as the OSM outline).  Scale from the photos: piers 5 : 1, roof = 6.2 pier widths -> about 8.7 m
// in all.  The islet is not reachable on foot (only the piers are solid).
import { ISLAND, toWorld } from './frame.js';

const PW = 0.95, CU = 1.85, CV = 1.6, FL = 0.15, BASE = 0.5, SHAFT_TOP = 4.95, CAPH = 0.55, YARCH = SHAFT_TOP + CAPH, ARCH = 0.55, YCOR = YARCH + ARCH, YATT = YCOR + 0.38, YEAVE = YATT + 1.35;

export function island(ctx, P, M, svc) {
  P.push(ISLAND.x, 0, ISLAND.z, ISLAND.rotY);
  P.far = 700;
  const ou = CU + PW / 2, ov = CV + PW / 2;                                                          // outer faces of the piers
  P.box(M.granite, -ou - 0.5, ou + 0.5, 0, FL, -ov - 0.5, ov + 0.5, 'b', 1);                          // the slab the pavilion stands on
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * CU, z = sz * CV;
    P.box(M.ashlar, x - PW / 2 - 0.06, x + PW / 2 + 0.06, FL, FL + BASE, z - PW / 2 - 0.06, z + PW / 2 + 0.06, 'b', 1);           // base courses
    P.box(M.white, x - PW / 2, x + PW / 2, FL + BASE, SHAFT_TOP, z - PW / 2, z + PW / 2, 'b', 4);                                // the pier
    P.box(M.white, x - PW / 2 - 0.06, x + PW / 2 + 0.06, SHAFT_TOP, SHAFT_TOP + 0.25, z - PW / 2 - 0.06, z + PW / 2 + 0.06, 'b', 4);        // neck block
    P.box(M.white, x - PW / 2 - 0.16, x + PW / 2 + 0.16, SHAFT_TOP + 0.25, YARCH, z - PW / 2 - 0.16, z + PW / 2 + 0.16, 'b', 4);         // abacus
  }
  // the architrave on the four sides, thickness 0.75 m (its bottom face is the ceiling of the open room)
  const t = 0.75, au = ou + 0.1, av = ov + 0.1;
  P.box(M.white, -au, au, YARCH, YCOR, av - t, av, 'b', 4); P.box(M.white, -au, au, YARCH, YCOR, -av, -av + t, 'b', 4);
  P.box(M.white, -au, -au + t, YARCH, YCOR, -av + t, av - t, 'b', 4); P.box(M.white, au - t, au, YARCH, YCOR, -av + t, av - t, 'b', 4);
  P.quad(M.white, [-au + t, YARCH, -av + t], [au - t, YARCH, -av + t], [au - t, YARCH, av - t], [-au + t, YARCH, av - t], [0, -1, 0]);
  // the Greek key band between the piers on the four faces (decal), dentils under the corona
  P.ranged(300, () => {
    for (const [rot, half, o] of [[0, CU, av], [Math.PI, CU, av], [Math.PI / 2, CV, au], [-Math.PI / 2, CV, au]]) {
      P.push(0, 0, 0, rot);
      const w = half - PW / 2 - 0.18;
      P.quad(M.relief, [-w, YARCH + 0.06, o + 0.012], [w, YARCH + 0.06, o + 0.012], [w, YCOR - 0.06, o + 0.012], [-w, YCOR - 0.06, o + 0.012], [0, 0, 1], M.meanderUV(2 * w));
      const n = Math.round(2 * (half + PW / 2) / 0.3);
      for (let k = 0; k < n; k++) { const x0 = -(half + PW / 2) + 0.1 + k * (2 * (half + PW / 2) - 0.2) / n; P.box(M.white, x0, x0 + 0.13, YCOR, YCOR + 0.14, o, o + 0.07, 'bk', 1); }
      P.pop();
    }
  });
  // cornice, attic, hipped roof
  P.box(M.white, -au, au, YCOR, YCOR + 0.14, -av, av, 'b', 4);
  P.box(M.white, -au - 0.22, au + 0.22, YCOR + 0.14, YATT, -av - 0.22, av + 0.22, 'b', 4);
  P.box(M.white, -au + 0.35, au - 0.35, YATT, YEAVE, -av + 0.35, av - 0.35, 'b', 4);
  const eu = au + 0.55 + 0.12, ev = av + 0.55 + 0.12, ap = [0, YEAVE + 0.8, 0];
  P.box(M.white, -eu, eu, YEAVE, YEAVE + 0.12, -ev, ev, 't', 4);                                    // the fascia slab under the roof
  const eaves = [[-eu, YEAVE + 0.12, ev], [eu, YEAVE + 0.12, ev], [eu, YEAVE + 0.12, -ev], [-eu, YEAVE + 0.12, -ev]];
  for (let i = 0; i < 4; i++) {
    const a = eaves[i], b = eaves[(i + 1) % 4], mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, run = Math.hypot(mx, mz) || 1, rise = ap[1] - a[1];
    P.fan(M.roofLight, [a, b, ap], [mx / run * rise, run, mz / run * rise], (p) => [p[0] / 2, p[2] / 2 + p[1]]);        // the true slope normal (it was tilted 51 deg instead of 15 deg)
  }
  P.pop();
  const ph = ctx.physics;
  if (ph) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [x, z] = toWorld(ISLAND, sx * CU, sz * CV); ph.addBox(x, z, PW + 0.1, PW + 0.1, ISLAND.rotY, 0, YEAVE + 1); }
  const [mx, mz] = toWorld(ISLAND, 0, 0);
  svc.monuments.push({ id: ISLAND.id, name: 'Павильон на острове (Елагин остров, 4АЖ)', x: mx, z: mz, h: YEAVE + 0.9 });
}
