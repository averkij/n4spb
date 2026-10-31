// landmarksKamennyDachasEast/sphinx.js - the two bronze SPHINXES of the pier of the Oldenburg dacha (Пристань со сфинксами, cast 1830s; photos S01 S02 S03 S04 of docs/research/kamenny-2026.md): a couchant lioness with the
// front paws stretched forward, the striped nemes headcloth with two ribbed lappets over the chest, a broad collar, a gilt-bronze fillet on the brow and a tall curved bronze plume (the uraeus feather) standing from the
// fillet.  Bronze green #2f6a5a, the fillet / plume bronze #a98a4a.  The figure is modelled at the proportions of the Academy sphinx (landmarksAcademy/sphinx.js, copied and re-dressed: no double crown, no beard stump)
// at unit scale (5.2 m long); the pier places it at scale 0.4 (2.1 m long, 1.0 m to the top of the headcloth, 1.35 m to the tip of the plume) on a 1.15 m granite pedestal.
// Figure frame: +z = forward (the way it looks, toward the water), y up, +x = its left; the origin is the top of the pedestal.
import { Sculpt, cached, face } from '../lib/figures.js';

export const sphinxFig = (detail = 0.6) => cached('lmkde-sphinx' + detail, () => {
  const S = new Sculpt({ detail, patina: false }), sg = (n) => S.seg(n);
  // ---- body: the trunk lying on the plinth, chest forward
  S.tube('main', [[0, 0.55, -2.45], [0, 0.85, -1.7], [0, 1.0, -0.6], [0, 1.1, 0.35], [0, 1.1, 0.95]], [[0.62, 0.55], [0.8, 0.72], [0.9, 0.8], [0.92, 0.82], [0.8, 0.72]], { seg: sg(18), per: 6 });
  S.blob('main', [0, 1.0, 0.55], [0.92, 0.72, 0.8], { w: sg(16), h: sg(10) });                               // the chest
  for (const s of [1, -1]) {                                                                                  // haunches and the folded hind legs
    S.blob('main', [s * 0.78, 0.62, -1.75], [0.5, 0.58, 0.85], { w: sg(14), h: sg(9) });
    S.tube('main', [[s * 0.78, 0.28, -1.0], [s * 0.78, 0.2, -0.2], [s * 0.74, 0.17, 0.35]], [[0.26, 0.2], [0.22, 0.18], [0.19, 0.16]], { seg: sg(10), per: 4 });
    S.blob('main', [s * 0.74, 0.17, 0.52], [0.23, 0.16, 0.3], { w: 8, h: 6 });
  }
  for (const s of [1, -1]) {                                                                                  // front legs and paws, stretched forward
    S.tube('main', [[s * 0.55, 0.85, 0.7], [s * 0.52, 0.45, 1.25], [s * 0.52, 0.22, 1.95], [s * 0.52, 0.19, 2.4]], [[0.3, 0.25], [0.26, 0.22], [0.22, 0.18], [0.2, 0.15]], { seg: sg(12), per: 5 });
    S.blob('main', [s * 0.52, 0.19, 2.5], [0.27, 0.17, 0.3], { w: 10, h: 7 });
    for (const dx of [-0.15, 0, 0.15]) S.blob('main', [s * 0.52 + dx, 0.13, 2.72], [0.052, 0.06, 0.1], { w: 5, h: 4 });
  }
  S.tube('main', [[0, 0.95, -2.5], [-0.35, 0.6, -2.75], [-0.95, 0.28, -2.3], [-1.15, 0.2, -1.5], [-0.95, 0.15, -1.0]], [[0.1, 0.1], [0.09, 0.09], [0.085, 0.085], [0.08, 0.08], [0.1, 0.1]], { seg: 6, per: 4 });   // the tail curled round the right thigh
  S.blob('main', [-0.95, 0.15, -0.95], [0.12, 0.1, 0.15], { w: 6, h: 5 });
  // ---- the neck, the head (human, calm), the nemes: a cap over the skull, two ribbed lappets in front of the shoulders, the flare behind
  S.tube('main', [[0, 1.0, 0.85], [0, 1.45, 1.1], [0, 1.85, 1.38]], [[0.56, 0.56], [0.45, 0.47], [0.4, 0.43]], { seg: sg(16), per: 4 });
  const K = 4.6, FC = [0, 2.05, 1.5], F = { c: FC, x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  face(S, F, { scale: K, hair: 'cap', mouth: 'closed', age: 0.15, brow: 0.45, jaw: 0.85, seed: 5, detail: Math.min(1, detail + 0.2) });
  S.tube('main', [[0, 2.78, 1.05], [0, 2.4, 0.98], [0, 1.95, 0.92], [0, 1.4, 0.82]], [[0.42, 0.2], [0.55, 0.3], [0.64, 0.36], [0.72, 0.4]], { seg: sg(18), per: 4, cap: true });   // the flare behind the head
  for (const s of [1, -1]) {
    S.tube('main', [[s * 0.43, 2.22, 1.3], [s * 0.5, 1.85, 1.36], [s * 0.54, 1.5, 1.46], [s * 0.5, 1.15, 1.62]], [[0.075, 0.2], [0.075, 0.21], [0.075, 0.21], [0.07, 0.19]], { seg: sg(10), per: 4, ref: [0, 0, 1] });   // the lappet
    for (let k = 0; k < 7; k++) { const t = k / 6, y = 2.1 - t * 0.95, x = s * (0.46 + t * 0.06), z = 1.34 + t * 0.26; S.tube('dark', [[x - 0.14, y, z + 0.075], [x + 0.14, y, z + 0.075]], [[0.012, 0.012]], { seg: 4, per: 2, cap: false }); }   // the ribs of the headcloth
  }
  for (const [y, w] of [[1.36, 0.36], [1.22, 0.4]]) {                                                         // the broad collar: two arcs lying on the chest between the lappets
    const pts = []; for (let i = 0; i <= 8; i++) { const x = -w + 2 * w * i / 8, q = 1 - (x / 0.92) ** 2 - ((y - 1.0) / 0.72) ** 2; pts.push([x, y - 0.1 * (1 - (x / w) ** 2), 0.55 + 0.8 * Math.sqrt(Math.max(0.04, q)) + 0.025]); }
    S.tube('accent', pts, [[0.035, 0.035]], { seg: 6, per: 2, cap: false });
  }
  // ---- the gilt-bronze fillet on the brow and the plume (S04): a band round the skull, a tall leaf-shaped feather curving back at the tip
  { const ring = []; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; ring.push([Math.sin(a) * 0.5, 2.43 + (Math.cos(a) > 0 ? -0.02 : 0.06) , 1.28 + Math.cos(a) * 0.6]); } S.tube('accent', ring, [[0.045, 0.045]], { closed: true, seg: 5, rings: 22 }); }
  S.tube('accent', [[0, 2.43, 1.84], [0, 2.8, 1.78], [0, 3.2, 1.62], [0, 3.55, 1.34], [0, 3.72, 1.1]], [[0.05, 0.1], [0.095, 0.22], [0.105, 0.27], [0.07, 0.17], [0.015, 0.04]], { seg: sg(10), per: 4, cap: true });
  S.blob('accent', [0, 2.5, 1.86], [0.07, 0.07, 0.06], { w: 6, h: 5 });                                          // the uraeus knob at the root of the plume
  return S.finish({});
});
