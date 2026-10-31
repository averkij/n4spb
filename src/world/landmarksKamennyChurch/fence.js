// landmarksKamennyChurch/fence.js - the chain fence round the church (photos C08 / C10 / C15: round pale granite posts about 0.85 m high with a black chain hanging between them, a low strip of limestone
// slabs at the foot of the plinth).  The fence is a U in the church frame CH: along the north side (mx -12.8), across the front (mz 14.2, with the opening to the porch platform of church.js) and along the south
// side (mx +12.8); the east end (the altar side) is open to the paved service way w128448246.  Posts every <= 3.2 m, the chain sags 0.14 m; colliders: a thin box along every span (0..0.75 m), posts are solid.
// Services: svc.lamps stays empty (the church has no lamps of its own); the chain posts are listed in svc.posts for the props owner.
import { CH } from './frame.js';
import { ball } from './geo.js';
import { lineColliders } from './util.js';

const POST_H = 0.85, CHAIN_Y = 0.66, SAG = 0.14;

export function build(K) {
  const { ctx, M, P, N, svc } = K, ph = ctx.physics;
  P.push(CH.ox, 0, CH.oz, CH.rot); N.push(CH.ox, 0, CH.oz, CH.rot);
  const runs = [
    [[-12.8, -3.0], [-12.8, 14.2], [-5.6, 14.2]],
    [[5.6, 14.2], [12.8, 14.2], [12.8, -3.0]],
  ];
  for (const run of runs) {
    // posts: every segment is divided into equal spans of <= 3.2 m
    const posts = [run[0]];
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i], b = run[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3.2);
      for (let k = 1; k <= n; k++) posts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    for (const [x, z] of posts) {
      P.col(M.stone, x, z, 0, POST_H, 0.15, 0.13, 10, true); ball(P, M.stone, x, POST_H, z, 0.14, 8);
      N.col(M.iron, x, z, POST_H + 0.1, POST_H + 0.14, 0.05, 0.05, 6);                                    // the little iron ring cap at the top
      const w = CH.W(x, z); (svc.posts ||= []).push({ x: w.x, z: w.z });
      CH.cyl(ph, x, z, 0.16, 0, POST_H);
    }
    for (let i = 0; i + 1 < posts.length; i++) {
      const a = posts[i], b = posts[i + 1], seg = 6, pts = [];
      for (let k = 0; k <= seg; k++) { const t = k / seg, s = 4 * t * (1 - t); pts.push([a[0] + (b[0] - a[0]) * t, CHAIN_Y - SAG * s, a[1] + (b[1] - a[1]) * t]); }
      for (let k = 0; k < seg; k++) N.cyl(M.iron, pts[k], pts[k + 1], 0.02, 0.02, 4, false);
    }
    lineColliders(CH, ph, posts, 0.1, 0, 0.75);
  }
  P.pop(); N.pop();
}
