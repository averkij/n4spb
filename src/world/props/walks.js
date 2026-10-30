// props/walks.js - furniture along the pavements and the garden paths, added to the OSM points of osm.js (densities follow docs/research/streets.md section 5 + 9: the centre is
// strict, sparse and clean - NO bench-lined pavements, bins sparse, nothing in the 2.5 m walking lane, no billboards at street level):
//   * Nevsky: a handful of timber-and-cast benches against the facade on the widest stretches only (the research found none; the brief asks for a few) + black cast-iron urns
//     against the wall every 120-220 m;
//   * side streets and main streets (Ligovsky, Liteyny, Vladimirsky, Suvorovsky, Marata ...): benches at 120-250 m, cast / cube / steel bins at 70-160 m, a few cable cabinets;
//   * Fontanka embankment: park benches at the granite parapet facing the water (back to the carriageway) every 60-120 m, urns at 90-160 m;
//   * gardens (GREEN park / grass with mapped footways): benches beside the paths facing them, every ~35-60 m, a bin per 80 m.
// Stations (state.pavementStations) carry the free span to the wall (eb) and to the carriageway (ek).
import { GREEN } from '../data/city.js';
import { faceRot, nearestWall, walk, streetClass } from './sites.js';
import { ringHas } from './kit.js';
import { inMergedStrip } from '../streets/furn.js';

// The occupancy raster can miss road corners and narrow service lanes. Check the
// whole bin footprint against the actual road geometry before placing it.
const binClear = (S, x, z) => {
  const net = S.ctx.services.streets?.net;
  if (!net) return true;
  for (const dx of [-0.35, 0, 0.35]) for (const dz of [-0.35, 0, 0.35]) {
    if (net.cover(x + dx, z + dz, {}) > -0.15) return false;
  }
  return true;
};

export function placeWalks(S) {
  const { W, R, F } = S;
  const sts = S.stations;
  const cnt = { bench: 0, bin: 0, quayBench: 0, garden: 0, cabinet: 0 };
  const BENCHES = ['benchPark', 'benchPark', 'benchParkL', 'benchParkD'];

  // ---- a bench against the facade (back to the wall) when the pavement is wide, else at the kerb side facing the walkway
  const benchAt = (st, type, o = {}) => {
    const len = type === 'benchParkL' ? 2.1 : type === 'benchGranite' ? 2.0 : 1.8, dep = 0.55;
    const wl = nearestWall(st.x - st.nx * st.eb, st.z - st.nz * st.eb, 2.5);
    if (!wl || Math.abs(wl.tx * st.tx + wl.tz * st.tz) < 0.85) return false;
    const px = wl.x + wl.nx * 0.34, pz = wl.z + wl.nz * 0.34, rot = faceRot(wl.nx, wl.nz);
    const fx = px + wl.nx * (dep / 2 + 0.05), fz = pz + wl.nz * (dep / 2 + 0.05);
    if (W.span(fx, fz, wl.nx, wl.nz, 10, F.ROAD | F.BLD | F.TREE | F.WATER) < (o.corridor ?? 2.9)) return false;      // the walking lane in front of it
    if (!W.fits(px, pz, len, dep, rot, { margin: 0.04, allow: F.BLD | F.LAWN }) || S.inDoorBox(px, pz, 0.4)) return false;
    if (S.placed.near(px, pz, len / 2 + 0.25, 'bench') || S.placed.near(px, pz, len / 2 + 1.2, 'cross') || S.placed.near(px, pz, len / 2 + 1.0, 'metro') || S.placed.near(px, pz, len / 2 + 1.0, 'stop') || S.placed.near(px, pz, len / 2 + 0.3, 'lamp')) return false;
    if (!S.placeBench(type, px, pz, rot, dep, len / 2)) return false;
    cnt.bench++;
    return true;
  };

  // ---- benches: side streets / main streets / Nevsky (few)
  const spacing = { nevsky: [320, 520], main: [150, 280], side: [110, 220], quay: [9e9, 9e9], canal: [9e9, 9e9], yard: [9e9, 9e9] };
  walk(sts, {
    first: (st) => R() * (spacing[streetClass(st)] || [150, 250])[1],
    gap: (st) => { const [a, b] = spacing[streetClass(st)] || [150, 250]; return a + R() * (b - a); },
    try: (st) => {
      const cls = streetClass(st);
      if (!W.inPlay(st.x, st.z, -5) || cls === 'quay' || cls === 'canal' || cls === 'yard' || S.inForecourt(st.x, st.z, 4)) return false;
      if (cls === 'nevsky' && st.eb < 5.2) return false;
      return benchAt(st, R() < 0.1 ? 'benchGranite' : BENCHES[Math.floor(R() * BENCHES.length)]);
    },
  });

  // ---- Fontanka embankment: benches at the parapet side facing the water, back to the carriageway
  const qw = S.stats.quayWhy = {};
  const qn = (k) => { qw[k] = (qw[k] || 0) + 1; return false; };
  walk(sts, {
    first: () => R() * 90, gap: (st) => (streetClass(st) === 'quay' ? 60 + R() * 70 : 170 + R() * 160),             // Fontanka: a bench every 60-130 m; the west embankments (OSM maps their few benches itself): 170-330 m
    try: (st) => {
      if ((streetClass(st) !== 'quay' && streetClass(st) !== 'canal') || !W.inPlay(st.x, st.z, -5)) return false;
      qn('stations');
      if (st.eb < 0.3) return qn('eb'); if (st.ek < 1.9) return qn('ek');
      if (!(W.at(st.x - st.nx * (st.eb + 0.4), st.z - st.nz * (st.eb + 0.4)) & F.WATER)) return qn('notwater');                 // the free span must end at the quay, not at a house
      const off = Math.max(0, st.eb - 0.31), px = st.x - st.nx * off, pz = st.z - st.nz * off, rot = faceRot(-st.nx, -st.nz);
      if (!W.fits(px, pz, 1.8, 0.55, rot, { margin: 0.03, allow: F.LAWN }) || S.placed.near(px, pz, 1.4) || S.inDoorBox(px, pz, 0.4)) return qn('fits');
      if (S.placed.near(px, pz, 2.5, 'cross') || S.placed.near(px, pz, 2.0, 'stop') || S.placed.near(px, pz, 3.0, 'metro')) return qn('reg');
      if (W.span(px + st.nx * 0.4, pz + st.nz * 0.4, st.nx, st.nz, 9, F.ROAD) < 2.2) return qn('lane');                          // keep a lane between the bench and the carriageway
      if (!S.placeBench('benchPark', px, pz, rot)) return false;
      cnt.bench++; cnt.quayBench++;
      return true;
    },
  });

  // ---- litter bins: Nevsky = black cast-iron urns at the facade, sparse; elsewhere at the kerb side
  const binSp = { nevsky: [130, 230], main: [75, 150], side: [90, 170], quay: [90, 170], canal: [120, 220], yard: [9e9, 9e9] };
  walk(sts, {
    first: (st) => R() * (binSp[streetClass(st)] || [90, 170])[1],
    gap: (st) => { const [a, b] = binSp[streetClass(st)] || [90, 170]; return a + R() * (b - a); },
    try: (st) => {
      if (!W.inPlay(st.x, st.z, -5) || S.inForecourt(st.x, st.z, 4)) return false;
      const cls = streetClass(st);
      let px, pz;
      if (cls === 'nevsky' && st.eb > 2.8) { const wl = nearestWall(st.x - st.nx * st.eb, st.z - st.nz * st.eb, 2.5); if (!wl) return false; px = wl.x + wl.nx * 0.4; pz = wl.z + wl.nz * 0.4; }
      else { const off = Math.min(st.ek, 8) - 0.85; if (off < 0.35) return false; px = st.x + st.nx * off; pz = st.z + st.nz * off; }
      if (!W.fits(px, pz, 0.5, 0.5, 0, { margin: 0.02, allow: F.LAWN | F.BLD }) || !binClear(S, px, pz) || S.placed.near(px, pz, 1.2) || S.inDoorBox(px, pz, 0.35) || S.placed.near(px, pz, 2.4, 'cross') || S.placed.near(px, pz, 2.4, 'metro')) return false;
      if (W.span(px + st.nx * 0.5, pz + st.nz * 0.5, st.nx, st.nz, 8, F.ROAD | F.WATER) < 0.5 && cls !== 'nevsky') { /* kerb-side bins stand at the kerb: fine */ }
      { const net = S.ctx.services.streets && S.ctx.services.streets.net; if (net && inMergedStrip(net, px, pz)) return false; }       // the strip between two carriageways closer than 7.5 m is no pavement (road integrity rules)
      const roll = R();
      S.add(cls === 'nevsky' || cls === 'quay' || cls === 'canal' ? 'binCast' : roll < 0.4 ? 'binCube' : roll < 0.7 ? 'binSteel' : 'binCast', px, pz, faceRot(-st.nx, -st.nz));
      S.svc.bins.push({ x: px, z: pz }); S.solidCyl(px, pz, 0.26, 0.9); S.occupy(px, pz, 0.6, 'bin');
      cnt.bin++; return true;
    },
  });

  // ---- cable cabinets against the walls of the side streets
  walk(sts, {
    first: () => R() * 300, gap: () => 300 + R() * 240,
    try: (st) => {
      const cls = streetClass(st);
      if (st.eb > 3.4 || !W.inPlay(st.x, st.z, -5) || cls === 'nevsky' || cls === 'quay' || cls === 'yard' || S.inForecourt(st.x, st.z, 4)) return false;
      const wl = nearestWall(st.x - st.nx * st.eb, st.z - st.nz * st.eb, 2.5);
      if (!wl || Math.abs(wl.tx * st.tx + wl.tz * st.tz) < 0.9) return false;
      const px = wl.x + wl.nx * 0.26, pz = wl.z + wl.nz * 0.26, rot = faceRot(wl.nx, wl.nz);
      if (!W.fits(px, pz, 0.7, 0.4, rot, { margin: 0.03, allow: F.BLD }) || S.placed.near(px, pz, 1.3) || S.inDoorBox(px, pz, 0.5)) return false;
      S.add('cabinet', px, pz, rot); S.box(px, pz, 0.66, 0.4, rot, 1.3, { r: 0.6, tag: 'cab' }); cnt.cabinet++;
      return true;
    },
  });

  // ---- gardens: benches beside the mapped footways inside parks / lawns, facing the path
  const gardens = GREEN.filter((g) => (g.kind === 'park' || g.kind === 'grass' || g.kind === 'recreation_ground') && !L_claimed(S, g.id)).flatMap((g) => g.polys.map((p) => ({ o: p.o, h: p.h, b: bbox(p.o) })));
  const inGarden = (x, z) => { for (const g of gardens) { if (x < g.b[0] || x > g.b[1] || z < g.b[2] || z > g.b[3]) continue; if (ringHas(g.o, x, z) && !g.h.some((h) => ringHas(h, x, z))) return true; } return false; };
  for (const p of (S.st && S.st.paths) || []) {
    const pts = p.pts; if (!pts || pts.length < 2 || (p.hw && p.hw === 'steps')) continue;
    let acc = 0, next = 12 + R() * 30, side = R() < 0.5 ? 1 : -1;
    for (let i = 0; i + 1 < pts.length; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], l = Math.hypot(bx - ax, bz - az); if (l < 0.5) continue;
      const tx = (bx - ax) / l, tz = (bz - az) / l;
      while (next - acc < l) {
        const s = next - acc, x = ax + tx * s, z = az + tz * s; next += 38 + R() * 30; side = -side;
        if (cnt.garden >= 70 || !W.inPlay(x, z, 2) || !inGarden(x, z) || S.inForecourt(x, z)) continue;
        const nx = -tz * side, nz = tx * side, off = (p.w || 2.4) / 2 + 0.55;
        const px = x + nx * off, pz = z + nz * off, rot = faceRot(-nx, -nz);                                         // faces the path
        if (!W.fits(px, pz, 1.8, 0.55, rot, { margin: 0.04, allow: F.LAWN }) || S.placed.near(px, pz, 1.8, 'bench')) continue;
        if (!S.placeBench(px < -595 ? 'benchWhite' : BENCHES[Math.floor(R() * BENCHES.length)], px, pz, rot)) continue;
        cnt.bench++; cnt.garden++;
        if (R() < 0.45) { const bx = px + (-nz) * 1.4, bz = pz + nx * 1.4; if (W.fits(bx, bz, 0.5, 0.5, 0, { allow: F.LAWN }) && binClear(S, bx, bz) && !S.placed.near(bx, bz, 0.8)) { S.add('binCast', bx, bz, 0); S.svc.bins.push({ x: bx, z: bz }); S.solidCyl(bx, bz, 0.26, 0.9); S.occupy(bx, bz, 0.6, 'bin'); cnt.bin++; } }
      }
      acc += l;
    }
  }
  S.stats.walks = { stations: sts.length, ...cnt };
}
const bbox = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
const L_claimed = (S, id) => !!S.L.claimedBy(id);
