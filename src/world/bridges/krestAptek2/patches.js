// bridges/krestAptek2/patches.js - the shore slits that stay open beside decks of the older bridges of this region (tools/environment-banks.mjs --strict-zones "OPEN EDGE IN A BRIDGE ZONE", 2026-10-14).
// Every bridge zone opens the environment's quay (no wall, no collider) for the width of the deck polygon + 2 m; the owner of the deck closes the shore beside the deck ends (long.js closeBank wings).  On a few
// of the Karpovka / Malaya Nevka decks the wing stops 0.5 - 4 m short of the quay wall (skewed banks, a bank that bends inside the opening) and a walker steps into the water through the slit.  The slits
// were measured with tools/bridges-krestovsky-aptekarsky-leaks.mjs (0.2 m grid: a walkable cell next to a drop cell with no collider between them) and are closed here with a short low granite parapet block
// + a 0.5 m collider box on the polyline of the leak (ends overlap the existing walls by ~0.7 m).  Owner of the decks: older rounds (bridges/long.js: Bolshoy Krestovsky, Lazarevsky; the Petrograd round:
// Aptekarsky, Barochny); this module only fills the gaps, it never replaces anything.
const SLITS = [
  { id: 'barochny-sw', pts: [[-3506.7, -4027.7], [-3506.7, -4025.2]], note: 'Barochny Bridge, south-west corner of the deck (the Karpovka wall ends 3 m before the wing)' },
  { id: 'aptekarsky-w', pts: [[-1110.5, -3910.3], [-1105.4, -3909.0]], note: 'Aptekarsky Bridge, north-west abutment (the diagonal wall stops short of the vertical one)' },
  { id: 'aptekarsky-e', pts: [[-1016.2, -3876.5], [-1010.6, -3875.6], [-1009.9, -3873.6]], note: 'Aptekarsky Bridge, south-east abutment' },
  { id: 'bkrest-w', pts: [[-3999.2, -3916.5], [-3999.9, -3915.2]], note: 'Bolshoy Krestovsky Bridge, west landing: a one-cell slit in the diagonal quay wall' },
  { id: 'bkrest-e', pts: [[-3907.0, -3820.9], [-3907.0, -3818.9]], note: 'Bolshoy Krestovsky Bridge, east landing: a one-cell slit between wing and quay wall' },
  { id: 'lazarev-n', pts: [[-4327.9, -3572.8], [-4325.7, -3572.8]], note: 'Lazarevsky Bridge, Krestovsky landing: a one-cell slit between the wing and the quay wall' },
  { id: 'barochny-se', pts: [[-3489.8, -4027.9], [-3489.7, -4025.1]], note: 'Barochny Bridge, south-east corner of the deck' },
  { id: 'pier-w', wood: true, pts: [[-5987.8, -3836.7], [-5979.6, -3835.8]], note: 'timber pier w1459136325: the shore west of the pier root (the quay opening of the zone, 8 m)' },
  { id: 'pier-e', wood: true, pts: [[-5976.5, -3836.3], [-5968.2, -3837.3]], note: 'timber pier w1459136325: the shore east of the pier root' },
  { id: 'tip-boardwalk', wood: true, pts: [[-7039.7, -5432.6], [-7038.4, -5431.0], [-7037.0, -5429.0]], note: 'west-tip boardwalk w1321576957: the outer corner of the bend over the inlet' },
];
export const KA_SLITS = SLITS;

/** drawn + collider closure of every slit: returns { tris, colliders } (P = the Parts of the module, ph = physics) */
export function buildSlits(env) {
  const { ctx, P, M } = env, L = ctx.L, yb = env.waterY - 0.2, out = { tris: 0, boxes: [], items: [] };
  const wet = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z));
  for (const sl of SLITS) {
    for (let k = 0; k + 1 < sl.pts.length; k++) {
      const [ax, az] = sl.pts[k], [bx, bz] = sl.pts[k + 1], len = Math.hypot(bx - ax, bz - az), th = Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2;
      // the water side: the side of the segment where the probe at 2 m is wet (v is +z of the local frame: world (x - v sin, z + v cos))
      const nx = -Math.sin(th), nz = Math.cos(th), sg = wet(mx + nx * 2, mz + nz * 2) ? 1 : wet(mx - nx * 2, mz - nz * 2) ? -1 : 1;
      P.push(mx, 0, mz, -th);
      if (sl.wood) { if (!M.bwBeam) M.bwBeam = ctx.mat.toon('#7a6448', { paint: 0.05, name: 'brg-bw-beam' }); P.box(M.bwBeam, -len / 2, len / 2, 0.05, 0.3, -0.12, 0.12, 'b', 1); P.box(M.bwBeam, -len / 2, len / 2, 0.8, 0.9, -0.05, 0.05, '', 1); for (let q = 0; q <= Math.max(1, Math.round(len / 2)); q++) { const u = -len / 2 + len * q / Math.max(1, Math.round(len / 2)); P.box(M.bwBeam, u - 0.05, u + 0.05, 0.05, 0.9, -0.05, 0.05, 'b', 1); } P.pop(); out.boxes.push([mx, mz, len + 0.1, 0.4, -th, -2, 1.25]); continue; }
      P.box(M.parapet, -len / 2, len / 2, 0.05, 0.55, -0.22, 0.22, 'b', 1.4);
      P.quad(M.granite, [-len / 2, yb, sg * 0.22], [len / 2, yb, sg * 0.22], [len / 2, 0.05, sg * 0.22], [-len / 2, 0.05, sg * 0.22], [0, 0, sg], [[0, yb / 2.2], [len / 2.2, yb / 2.2], [len / 2.2, 0.05 / 2.2], [0, 0.05 / 2.2]]);
      P.pop();
      out.boxes.push([mx, mz, len + 0.1, 0.5, -th, -2, 1.25]);
    }
    out.items.push(sl.id);
  }
  out.tris = P.tris;
  return out;
}
