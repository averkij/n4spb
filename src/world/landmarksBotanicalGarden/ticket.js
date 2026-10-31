// landmarksBotanicalGarden/ticket.js - the TICKET PAVILION at the summer entrance of the garden (OSM w141816493 "Ботанический сад", shop=ticket, 5.4 x 3.3 m, one storey, roof=round, May-Aug 10-19;
// dossier 4.1 entrances; not photographed [?]): a cream stucco kiosk 2.8 m high with two ticket windows with a counter on the long front, a door in the east end, a granite plinth and a segmental
// (barrel) roof of grey-green sheet metal that overhangs 0.35 m.  The closed summer gate n1552314688 stands in the fence beside it (fence.js).  Frame TK: centre (-1832.5, -4016.6), +z = the long front (SSE).
import { Frame } from './frame.js';
import { holedWall, pane } from './facade.js';
import { rect } from './shell.js';
import { stage } from './shell.js';

export const TK = new Frame(-1832.5, -4016.6, 0.3229);
const HW = 2.7, HD = 1.6, WH = 2.8;

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  stage(K, 'kiosk', () => {
    P.push(TK.cx, 0, TK.cz, TK.rot);
    // the four walls: front (windows), back (blank), the two ends (door in the east end)
    const walls = [
      { x: -HW, z: HD, rot: 0, len: 2 * HW, holes: [{ x0: 0.55, x1: 1.95, y0: 1.0, y1: 2.15, mat: 'winI' }, { x0: 3.45, x1: 4.85, y0: 1.0, y1: 2.15, mat: 'winI' }, { x0: 2.5, x1: 2.9, y0: 1.2, y1: 1.7, mat: 'iron' }] },
      { x: HW, z: -HD, rot: Math.PI, len: 2 * HW, holes: [] },
      { x: -HW, z: -HD, rot: -Math.PI / 2, len: 2 * HD, holes: [] },
      { x: HW, z: HD, rot: Math.PI / 2, len: 2 * HD, holes: [{ x0: 0.7, x1: 1.9, y0: 0.1, y1: 2.25, mat: 'timber' }] },
    ];
    for (const w of walls) {
      P.push(w.x, 0, w.z, w.rot);
      holedWall(P, M.ochre, 0, w.len, 0.35, WH, w.holes, { depth: 0.25, uvs: 3, noEnds: true });
      for (const h of w.holes) pane(P, M[h.mat], h, 0.25);
      P.box(M.plinth, 0, w.len, 0, 0.4, -0.25, 0.05, 'k', 3);
      P.pop();
    }
    // the ticket counters: a shelf under each front window
    for (const x0 of [0.5, 3.4]) P.box(M.white, -HW + x0, -HW + x0 + 1.5, 0.98, 1.04, HD, HD + 0.28, 'b', 2);
    // the barrel roof: an ellipse arc over z, axis along x; overhang 0.35 on every side
    const ox = 0.35, zr = HD + 0.3, yb = WH, rise = 0.95, n = 12;
    const arc = (i) => { const t = -Math.PI / 2 + i * Math.PI / n; return [zr * Math.sin(t), yb + rise * Math.cos(t) - rise * 0.0]; };
    for (let i = 0; i < n; i++) {
      const a = arc(i), b = arc(i + 1), am = -Math.PI / 2 + (i + 0.5) * Math.PI / n;
      P.quad(M.zinc, [-HW - ox, a[1], a[0]], [HW + ox, a[1], a[0]], [HW + ox, b[1], b[0]], [-HW - ox, b[1], b[0]], [0, Math.cos(am) * zr * 0.5 + 0.4, Math.sin(am)], [[0, i / 3], [11 / 1.2, i / 3], [11 / 1.2, (i + 1) / 3], [0, (i + 1) / 3]]);
    }
    for (const s of [-1, 1]) P.fan(M.zinc, Array.from({ length: n + 1 }, (_, i) => { const q = arc(i); return [s * (HW + ox), q[1], q[0]]; }), [s, 0, 0], (p) => [p[2] / 1.2, p[1] / 1.2]);
    P.box(M.white, -HW - 0.02, HW + 0.02, WH - 0.12, WH + 0.04, -HD - 0.08, HD + 0.08, 'b', 3);
    P.pop();
  });
  stage(K, 'collider', () => { const p = TK.w(0, 0); ctx.physics.addBox(p[0], p[1], 2 * HW + 0.2, 2 * HD + 0.2, TK.rot, 0, 3.6); });
  const f = TK.w(0, 12);
  K.svc.entrances.push({ x: TK.w(HW + 1.6, 0)[0], z: TK.w(HW + 1.6, 0)[1], rotY: TK.rot + Math.PI / 2 * -1, bldg: 'w141816493' });
  K.svc.photoSpots.push({ x: f[0], z: f[1], yaw: Math.round(TK.rot * 180 / Math.PI), name: 'Ботанический сад: летний вход и билетный павильон' });
  K.svc.monuments.push({ id: 'w141816493', name: 'Билетный павильон Ботанического сада', x: TK.cx, z: TK.cz, h: 3.9 });
  void rect;
  if (K.errs && K.errs.length) throw new Error('ticket: ' + K.errs.join('\n'));
}
