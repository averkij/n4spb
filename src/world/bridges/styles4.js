// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/styles4.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/styles4.js - what makes the Smolenka bridges of Vasilievsky Island recognisable, drawn on top of the generic arch of arch.js (docs/research/vo-bridges-wave1.md, photos refs/bridges u01 u02 u03 s01):
//   uralsky    Уральский мост (1973-74): a flat RC frame with pink granite faces, a black bar railing between granite parapet blocks, four tall pale granite obelisks on tumbas, each carrying a gilded
//              sailing ship (bare vane, no pennant), a granite stair beside the downstream wing at the Vasilievsky bank
//   smolensky  Смоленский мост (1959-61): a granite-faced arch (R 19.28 m), a black cast railing between granite parapet blocks, four art-cast torcheres with arrow-bracket lanterns on granite tumbas
// NO flags / flagpoles (user rule).
import { cornerBlocks } from './styles2.js';
import { obeliskShip, torchereSmol } from './sculpt5.js';

const frame = (B, P, fn) => { P.push(B.f.cx, 0, B.f.cz, -B.T); try { fn(); } finally { P.pop(); } };

const uralsky = (e, B) => {
  const { P, M } = e;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'plainrods', '#1e2224', { postMat: M.ironBlack, postW: 0.16, h: 1.0 });
      for (const [u0, u1] of [[a - 4.8, a - 1.9], [b + 1.9, b + 4.8]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      B.faceCollider(sg, a - 5.0, b + 5.0, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.5, 1.5, 0.35, (u, top, v) => obeliskShip(P, M, u, top - 0.35, v, 0, { h: 9.2 }));
  });
};

const smolensky = (e, B) => {
  const { P, M } = e;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'scroll', '#1e2224', { postMat: M.ironBlack, postW: 0.18 });
      for (const [u0, u1] of [[a - 4.0, a - 1.6], [b + 1.6, b + 4.0]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      B.faceCollider(sg, a - 4.2, b + 4.2, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.0, 1.0, 1.0, (u, top, v, sg, ts) => torchereSmol(P, M, u, top, v, ts > 0 ? 0 : Math.PI, { h: 5.4 }));
  });
};

export const STYLES4 = { uralsky, smolensky };
