// landmarksSeaTerminal/shed.js - the PORT SHED NW of the Sea Terminal (OSM w128448740, 683 m2, ring (-6539.4,601.2) (-6523,610.8) (-6541.2,641.8) (-6557.6,632.3): 19.0 x 36.0 m, long axis along the terminal's frame-T
// v axis): the generic city drew it as a yellow three-storey tenement with arched doors in the middle of the port yard; the Esri tile (stw_sat_site18) and photos a09 a13 show a low steel-framed shed with a BRIGHT BLUE
// pitched roof and pale grey walls.  Drawn here: walls 6.0 m, a shallow gable roof (ridge 8.2 m along the long axis), gable triangles, four grey roller doors on the long side facing the lot, a man door, a low eaves gutter line.
// Solid (four wall boxes).  Claimed together with the terminal (groups.js key sea-terminal).  Frame S: local a = along the first ring edge (bearing 120 deg), local b = along the long edge (bearing 210 deg).
import * as L from '../layout.js';

const ORG = [-6540.3, 621.5], ROT = -0.5287, HA = 9.5, HB = 18.0, EAVE = 6.0, RIDGE = 8.2;

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  // use the real ring when the baked record is there (centre and orientation), else the constants above
  let cx = ORG[0], cz = ORG[1], rot = ROT, ha = HA, hb = HB;
  try {
    const b = L.buildingById('w128448740');
    if (b && b.polys && b.polys[0] && b.polys[0].o.length === 8) {
      const o = b.polys[0].o, ex = o[2] - o[0], ez = o[3] - o[1], fx = o[4] - o[2], fz = o[5] - o[3];
      const la = Math.hypot(ex, ez), lb = Math.hypot(fx, fz);
      cx = (o[0] + o[2] + o[4] + o[6]) / 4; cz = (o[1] + o[3] + o[5] + o[7]) / 4; rot = Math.atan2(-ez / la, ex / la); ha = la / 2; hb = lb / 2;
    }
  } catch (e) { /* constants */ }
  P.push(cx, 0, cz, rot);
  try {
    const q = (p0, p1, p2, p3, n, mat = M.shedWall) => P.quad(mat, p0, p1, p2, p3, n);
    // four walls (outside faces), the long sides are +-a (b runs along them), the gable ends +-b
    q([-ha, 0, hb], [-ha, 0, -hb], [-ha, EAVE, -hb], [-ha, EAVE, hb], [-1, 0, 0]);
    q([ha, 0, -hb], [ha, 0, hb], [ha, EAVE, hb], [ha, EAVE, -hb], [1, 0, 0]);
    q([ha, 0, hb], [-ha, 0, hb], [-ha, EAVE, hb], [ha, EAVE, hb], [0, 0, 1]);
    q([-ha, 0, -hb], [ha, 0, -hb], [ha, EAVE, -hb], [-ha, EAVE, -hb], [0, 0, -1]);
    // the gable triangles and the two roof planes (blue), a ridge cap
    P.fan(M.shedWall, [[-ha, EAVE, hb], [ha, EAVE, hb], [0, RIDGE, hb]], [0, 0, 1]);
    P.fan(M.shedWall, [[ha, EAVE, -hb], [-ha, EAVE, -hb], [0, RIDGE, -hb]], [0, 0, -1]);
    const ov = 0.35;
    P.quad(M.shedRoof, [-ha - ov, EAVE - 0.1, hb + ov], [-ha - ov, EAVE - 0.1, -hb - ov], [0, RIDGE, -hb - ov], [0, RIDGE, hb + ov], [-0.35, 1, 0]);
    P.quad(M.shedRoof, [ha + ov, EAVE - 0.1, -hb - ov], [ha + ov, EAVE - 0.1, hb + ov], [0, RIDGE, hb + ov], [0, RIDGE, -hb - ov], [0.35, 1, 0]);
    P.box(M.shedRoof, -0.15, 0.15, RIDGE, RIDGE + 0.12, -hb - ov, hb + ov, 'b', 1);
    // roller doors on the side facing the lot (+a = the SSE side toward the terminal? the lot lies NE of the terminal: the long side +a faces ESE): four 4.0 x 4.2 m doors, a man door
    for (const b of [-12, -4, 4, 12]) {
      const x = ha + 0.03; q([x, 0, b + 2], [x, 0, b - 2], [x, 4.2, b - 2], [x, 4.2, b + 2], [1, 0, 0], M.shedDoor);
      for (let k = 1; k < 7; k++) q([x + 0.01, 0.6 * k, b + 2], [x + 0.01, 0.6 * k, b - 2], [x + 0.01, 0.6 * k + 0.04, b - 2], [x + 0.01, 0.6 * k + 0.04, b + 2], [1, 0, 0], M.black);
    }
    q([ha + 0.03, 0, 16.2], [ha + 0.03, 0, 15.1], [ha + 0.03, 2.2, 15.1], [ha + 0.03, 2.2, 16.2], [1, 0, 0], M.glassDark);
    // a double door in the SSW gable end and a row of high windows along the west long side
    q([-1.5, 0, hb + 0.03], [1.5, 0, hb + 0.03], [1.5, 3.4, hb + 0.03], [-1.5, 3.4, hb + 0.03], [0, 0, 1], M.shedDoor);
    for (const b of [-13, -6, 1, 8, 15]) q([-ha - 0.03, 3.6, b - 1.2], [-ha - 0.03, 3.6, b + 1.2], [-ha - 0.03, 4.9, b + 1.2], [-ha - 0.03, 4.9, b - 1.2], [-1, 0, 0], M.glassDark);
    // the eaves gutters
    P.box(M.steel, -ha - 0.12, -ha + 0.05, EAVE - 0.18, EAVE - 0.02, -hb, hb, 'b', 1); P.box(M.steel, ha - 0.05, ha + 0.12, EAVE - 0.18, EAVE - 0.02, -hb, hb, 'b', 1);
  } finally { P.pop(); }
  // solid: four thin wall boxes round the footprint (the shed is closed port property)
  const ph = ctx.physics, C = Math.cos(rot), S = Math.sin(rot), w = (a, b) => ({ x: cx + C * a + S * b, z: cz - S * a + C * b });
  const box = (a, b, wd, dp) => { const p = w(a, b); ph.addBox(p.x, p.z, wd, dp, rot, 0, EAVE + 2.4); };
  box(-ha, 0, 0.5, 2 * hb); box(ha, 0, 0.5, 2 * hb); box(0, hb, 2 * ha, 0.5); box(0, -hb, 2 * ha, 0.5);
  box(0, 0, 2 * ha - 0.6, 2 * hb - 0.6);                                                     // nobody walks on the roof / inside
  K.svc.shed = { centre: [cx, cz], size: [2 * ha, 2 * hb] };
}
