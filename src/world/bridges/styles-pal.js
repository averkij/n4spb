// bridges/styles-pal.js - what makes the 2nd Engineer Bridge (the castle moat, bridges/sites-pal.js, docs/AREAS.md 15.z) recognisable, drawn on top of the generic arch of arch.js: a shallow grey-pink granite arch
// (look 'swan-upper'), the black cast-iron bar railing of its sister the 1st Engineer Bridge ('barsE') between granite posts, solid pink granite wing parapets beyond the railing, four granite corner posts at the heads.
// The Prachechny and Upper Swan bridges use the styles of the Mars Field reach (styles2.js 'arch3' / 'swan-upper').
import { cornerBlocks } from './styles2.js';

const frame = (B, P, fn) => { P.push(B.f.cx, 0, B.f.cz, -B.T); try { fn(); } finally { P.pop(); } };

const eng2 = (e, B) => {
  const { P, M, ctx } = e, post = ctx.mat.toon('#202428', { paint: 0.03, name: 'brg-t-#202428' });
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'barsE', '#202428', { postMat: post, postW: 0.16 });
      for (const [u0, u1] of [[a - 5.0, a - 0.95], [b + 0.95, b + 5.0]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      B.faceCollider(sg, a - 5.2, b + 5.2, 0.25, 0.6);
    }
    cornerBlocks(e, B, 0.9, 0.9, 1.2, null);
  });
};

export const STYLES_PAL = { eng2 };
