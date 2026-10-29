// Provenance: copied verbatim from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/cutting.js), for the Western High-Speed Diameter of the Morskoy / Gavan / Dekabristov areas (docs/gdm-B.md).
// bridges/cutting.js - PURE DATA + pure maths (imports only the pure-data sites-vo2.js; runs in node and in the page): the OPEN CUTTING of the at-grade Western High-Speed Diameter on Vasilievsky Island, third pass
// (docs/research/vo-bridges-wave3.md section 3).  The real motorway runs between the Smolenka-mouth tunnel portals and the first viaduct station in an open cutting with grass slopes (OSM embankment ways
// w350477973 / w350477975 at the portals, w303684563 / w303684565 along the cutting); our ground is FLAT (a module cannot dig it: layout.GROUND_HOLES = the metro shafts), so the carriageways lie flush and the
// cutting is drawn as what a driver sees of it: GRASS EMBANKMENTS (an inner slope, a crest, an outer slope) on both outer sides of the pair of carriageways, solid where they are higher than 0.6 m, fading out
// (the height scales to zero) toward the portals, the viaduct, and the three crossings (the Mikhmanskaya street deck and the two park footbridges, which stay open at ground level).
// stations(k): the smoothed centre line of carriageway k ('W' / 'E') cut into 6 m stations with tangents; the same list that whsd-ground.js draws the asphalt on (it imports it from here).
// bank(): the outline rings (PAVED_RINGS of groups.js: no trunks, hedges, beds or grass tufts of the environment on the embankments).
// [E] = estimate: height 2.4 m, slopes 1 : 2.3 and 1 : 1.9 (the cutting depth of the real ZSD is 4 - 6 m [?]).
import { WHSD } from './sites-vo2.js';

/** Chaikin corner cutting (keeps the end points) so that the coarse OSM polyline reads as a smooth bend */
export function smooth(pts, rounds = 2) {
  let p = pts.map((q) => q.slice());
  for (let r = 0; r < rounds; r++) {
    const o = [p[0]];
    for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    o.push(p[p.length - 1]); p = o;
  }
  return p;
}

/** the 6 m stations of carriageway k ('W' | 'E'): { k, so (+1 W, -1 E: the outer side lies at +so * normal), st: [{ x, z, s, tx, tz, nx, nz }] } */
export function stations(k) {
  const G = WHSD.ground, pts = smooth(G[k]), so = k === 'W' ? 1 : -1, st = [];
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz), n = Math.max(1, Math.round(l / 6));
    for (let j = 0; j < n; j++) { const t = j / n; st.push({ x: pts[i][0] + dx * t, z: pts[i][1] + dz * t, s: s + l * t }); }
    s += l;
  }
  st.push({ x: pts[pts.length - 1][0], z: pts[pts.length - 1][1], s });
  for (let i = 0; i < st.length; i++) {
    const a = st[Math.max(0, i - 1)], b = st[Math.min(st.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    st[i].tx = dx / l; st[i].tz = dz / l; st[i].nx = -st[i].tz; st[i].nz = st[i].tx;
  }
  return { k, so, st };
}

/** embankment profile (q = lateral distance from the carriageway centre line, outward): the inner foot just outside the W-beam, the crest, the outer foot */
export const CUT = { q0: WHSD.hw + 0.25, H: 2.4, runIn: 5.6, crest: 1.1, runOut: 4.6, solidH: 0.6, endTaper: 70, portalTaper: 55, crossTaper: 26, crossClear: 8 };
CUT.q1 = CUT.q0 + CUT.runIn; CUT.q2 = CUT.q1 + CUT.crest; CUT.q3 = CUT.q2 + CUT.runOut;

/** distance from (x, z) to the nearest crossing of the corridor (the street deck z range of WHSD.ground.gap and the two oriented footbridge decks), 0 under one */
export function crossDist(x, z) {
  const G = WHSD.ground; let d = Math.max(G.gap[0] - z, z - G.gap[1], 0);
  for (const r of G.decks || []) {
    const dx = x - r.c[0], dz = z - r.c[1], t = dx * r.dir[0] + dz * r.dir[1], w = -dx * r.dir[1] + dz * r.dir[0];
    d = Math.min(d, Math.hypot(Math.max(r.t[0] - t, t - r.t[1], 0), Math.max(r.w[0] - w, w - r.w[1], 0)));
  }
  return d;
}
const sstep = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
/** the height factor 0 .. 1 of the embankment at station i of a carriageway (fades toward the portals, the viaduct and the crossings) */
export function fade(stn, i) {
  const st = stn.st, a = st[i], S = st[st.length - 1].s;
  return sstep(a.s / CUT.portalTaper - 0.4) * sstep((S - a.s) / CUT.endTaper) * sstep((crossDist(a.x, a.z) - CUT.crossClear) / CUT.crossTaper);
}

/** the outline of the embankment of one side of the stretch as a ring per run of stations with a factor above 0.05 (flat [x, z, ...]) */
export function bank() {
  const rings = [];
  for (const k of ['W', 'E']) {
    const stn = stations(k), st = stn.st; let run = [];
    const flush = () => {
      if (run.length >= 3) {
        const inner = [], outer = [];
        for (const i of run) { const a = st[i]; inner.push([a.x + a.nx * stn.so * (CUT.q0 - 0.3), a.z + a.nz * stn.so * (CUT.q0 - 0.3)]); outer.push([a.x + a.nx * stn.so * (CUT.q3 + 0.5), a.z + a.nz * stn.so * (CUT.q3 + 0.5)]); }
        const ring = inner.concat(outer.reverse()).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
        rings.push({ id: 'cut-' + k + '-' + rings.length, ring });
      }
      run = [];
    };
    for (let i = 0; i < st.length; i++) { if (fade(stn, i) > 0.05) { run.push(i); } else flush(); }
    flush();
  }
  return rings;
}
