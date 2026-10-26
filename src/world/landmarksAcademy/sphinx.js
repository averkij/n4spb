// landmarksAcademy/sphinx.js - the two EGYPTIAN SPHINXES (Amenhotep III, c. 1400 BC, pink Aswan granite) and the four bronze GRIFFINS of the pier: docs/research/academy.md 4.3, photos sq_127 sq_128
// sq_124 sq_136 sq_139 sq_074 cr_sq076..079 (sphinx), gr_008 gr_009 gr_013 cr_gr018 cr_gr007 (griffin).
//   SPHINX: a couchant lion 5.24 m long (paw tips to the haunch), 1.9 m wide, the front paws stretched forward with claws, the tail curled round the right thigh; a human head with a faint smile,
//   the striped nemes headcloth with two lappets over the chest, a broad collar, the stump of the ritual beard under the chin (the beard is broken off in both), the uraeus stump on the brow; the
//   double crown: a plain drum (the lower crown) with a notch, carrying the tall cone (the upper crown, its tip broken in a slanted fracture, a slab-like tab at the back).  Figure height 3.9 m (crown
//   tip) on a 0.6 m plinth; colour beige-tan with a pink cast #b8a38a (crown cone #c6b7b5).  Figure frame: +z = forward (the way it looks), y up, +x = its left; the origin is the top of the plinth.
//   GRIFFIN: an upright standing lion body (straight forelegs, paws side by side on a small block), the broad lion head turned about 60 deg to the side with the mouth open and a mane ruff, ONE
//   feathered wing raised and swept back flat; about 1.1 m to the top of the head; polished gold-brown head and chest, dark green-brown legs.
import { Sculpt, cached, V, face, lion, addWing } from '../lib/figures.js';

export const sphinxFig = () => cached('lmacade-sphinx', () => {
  const S = new Sculpt({ detail: 0.8, patina: false }), sg = (n) => S.seg(n);
  // ---- body: the lion's trunk lying on the plinth, chest forward
  S.tube('main', [[0, 0.55, -2.45], [0, 0.85, -1.7], [0, 1.0, -0.6], [0, 1.1, 0.35], [0, 1.1, 0.95]], [[0.62, 0.55], [0.8, 0.72], [0.9, 0.8], [0.92, 0.82], [0.8, 0.72]], { seg: sg(18), per: 6 });
  S.blob('main', [0, 1.0, 0.55], [0.92, 0.72, 0.8], { w: sg(16), h: sg(10) });                               // the chest
  // ---- the hind quarters: haunches and the folded hind legs
  for (const s of [1, -1]) {
    S.blob('main', [s * 0.78, 0.62, -1.75], [0.5, 0.58, 0.85], { w: sg(14), h: sg(9) });
    S.tube('main', [[s * 0.78, 0.28, -1.0], [s * 0.78, 0.2, -0.2], [s * 0.74, 0.17, 0.35]], [[0.26, 0.2], [0.22, 0.18], [0.19, 0.16]], { seg: sg(10), per: 4 });
    S.blob('main', [s * 0.74, 0.17, 0.52], [0.23, 0.16, 0.3], { w: 8, h: 6 });
  }
  // ---- front legs and paws (claws visible), stretched forward
  for (const s of [1, -1]) {
    S.tube('main', [[s * 0.55, 0.85, 0.7], [s * 0.52, 0.45, 1.25], [s * 0.52, 0.22, 1.95], [s * 0.52, 0.19, 2.4]], [[0.3, 0.25], [0.26, 0.22], [0.22, 0.18], [0.2, 0.15]], { seg: sg(12), per: 5 });
    S.blob('main', [s * 0.52, 0.19, 2.5], [0.27, 0.17, 0.3], { w: 10, h: 7 });
    for (const dx of [-0.15, 0, 0.15]) S.blob('main', [s * 0.52 + dx, 0.13, 2.72], [0.052, 0.06, 0.1], { w: 5, h: 4 });
  }
  // ---- the tail curled round the right thigh (the right side = -x)
  S.tube('main', [[0, 0.95, -2.5], [-0.35, 0.6, -2.75], [-0.95, 0.28, -2.3], [-1.15, 0.2, -1.5], [-0.95, 0.15, -1.0]], [[0.1, 0.1], [0.09, 0.09], [0.085, 0.085], [0.08, 0.08], [0.1, 0.1]], { seg: 6, per: 4 });
  S.blob('main', [-0.95, 0.15, -0.95], [0.12, 0.1, 0.15], { w: 6, h: 5 });
  // ---- the neck, the head (human, youthful, a faint smile, 1.1 m crown to chin), the nemes (a cap over the skull, two thick lappets in front of the shoulders, the flare behind), the collar on the chest
  //      (review-academy 2026-10-08: the first head had a flat 'tray' collar standing out of the chest, a stray uraeus dot off the forehead, planar lappets and a pencil-thin crown; all re-proportioned
  //       from cr_sq076 / cr_sq077 / cr_sq078: the red-crown drum is as wide as the whole head (r 0.47), the white cone is a short truncated tower with a slanted fracture)
  S.tube('main', [[0, 1.0, 0.85], [0, 1.45, 1.1], [0, 1.85, 1.38]], [[0.56, 0.56], [0.45, 0.47], [0.4, 0.43]], { seg: sg(16), per: 4 });
  const K = 4.6, FC = [0, 2.05, 1.5], F = { c: FC, x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  face(S, F, { scale: K, hair: 'cap', mouth: 'smile', age: 0.1, brow: 0.45, jaw: 0.85, seed: 3, detail: 0.85 });
  // surface helpers in the head frame: forehead / chin fronts from the kit head tables (Z_FRONT 0.074 at the brow, 0.044 at y -0.1)
  S.blob('main', [0, 1.43, FC[2] + 0.2 * 1.0 + 0.0], [0.075, 0.17, 0.075], { w: 7, h: 6 });                       // the beard stump hanging under the chin
  S.blob('dark', [0, FC[1] + 0.068 * K, FC[2] + 0.07 * K], [0.045, 0.12, 0.05], { dir: [0, 0.35, 1], w: 6, h: 6 });   // the uraeus stump on the brow, sitting ON the forehead
  S.tube('main', [[0, 2.78, 1.05], [0, 2.4, 0.98], [0, 1.95, 0.92], [0, 1.4, 0.82]], [[0.42, 0.2], [0.55, 0.3], [0.64, 0.36], [0.72, 0.4]], { seg: sg(18), per: 4, cap: true });   // the flare behind the head, widening to the shoulders
  for (const s of [1, -1]) {
    // the lappet: a thick broad strap (0.2 m wide half, 0.07 m thick) from behind the cheek down over the shoulder and onto the chest
    S.tube('main', [[s * 0.43, 2.22, 1.3], [s * 0.5, 1.85, 1.36], [s * 0.54, 1.5, 1.46], [s * 0.5, 1.15, 1.62]], [[0.075, 0.2], [0.075, 0.21], [0.075, 0.21], [0.07, 0.19]], { seg: sg(10), per: 4, ref: [0, 0, 1] });
    for (const dx of [-0.08, 0.08]) S.tube('dark', [[s * (0.5 + dx), 2.0, 1.45], [s * (0.55 + dx), 1.55, 1.53], [s * (0.52 + dx), 1.2, 1.68]], [[0.014, 0.014]], { seg: 4, per: 3, cap: false });   // the pleats
  }
  // the broad collar (usekh): two beaded arcs lying ON the chest surface between the lappets (chest ellipsoid centre (0, 1.0, 0.55), radii (0.92, 0.72, 0.8))
  for (const [y, w] of [[1.36, 0.36], [1.22, 0.4]]) {
    const pts = []; for (let i = 0; i <= 8; i++) { const x = -w + 2 * w * i / 8, q = 1 - (x / 0.92) ** 2 - ((y - 1.0) / 0.72) ** 2; pts.push([x, y - 0.1 * (1 - (x / w) ** 2), 0.55 + 0.8 * Math.sqrt(Math.max(0.04, q)) + 0.025]); }
    S.tube('dark', pts, [[0.035, 0.035]], { seg: 6, per: 2, cap: false });
  }
  // ---- the double crown: the lower red crown = a drum as wide as the head (flared a little at the top, an incised band), the upper white crown = a short truncated tower with a slanted
  //      fracture, a slab-like tab at its back
  const CZ = 1.2;
  S.tube('main', [[0, 2.5, CZ], [0, 2.87, CZ], [0, 3.25, CZ]], [[0.46, 0.46], [0.47, 0.47], [0.5, 0.5]], { seg: sg(24), per: 3, cap: false });
  { const lid = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; lid.push([Math.sin(a) * 0.5, 3.25, CZ + Math.cos(a) * 0.5]); } S.sheet('main', lid, 0.01); }   // the flat top of the drum (the tube has no cap)
  for (const y of [2.64, 3.02]) { const ring = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; ring.push([Math.sin(a) * (y < 2.8 ? 0.465 : 0.49), y, CZ + Math.cos(a) * (y < 2.8 ? 0.465 : 0.49)]); } S.tube('dark', ring, [[0.016, 0.016]], { closed: true, seg: 4, rings: 20 }); }
  S.tube('accent', [[0, 3.25, CZ], [0, 3.65, CZ], [0, 3.97, CZ]], [[0.37, 0.37], [0.3, 0.3], [0.21, 0.21]], { seg: sg(20), per: 4, cap: false });
  S.push(0, 3.97, CZ, 0.22, 0, 0.0);                                                                              // the fracture: a lid on the cone, tilted
  { const cap = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cap.push([Math.sin(a) * 0.215, 0, Math.cos(a) * 0.215]); } S.sheet('accent', cap, 0.012); }
  S.pop();
  S.blob('accent', [0, 3.55, CZ - 0.34], [0.08, 0.3, 0.1], { w: 6, h: 6 });                                       // the slab-like tab at the back of the cone
  return S.finish({});
});

/** the griffin on a bench end (faces +z; head turned toward `turn` = +1 left / -1 right); one wing raised */
export const griffinFig = (side) => cached('lmacade-griffin' + side, () => {
  const base = lion({ pose: 'sit', mane: 0.85, head: { turn: 1.0 * side, pitch: 0.0, open: 0.35 }, detail: 0.8, tail: 'curl' });
  const S = new Sculpt({ detail: 0.8 });
  for (const [k, g] of Object.entries(base.geos)) S.add(k, g);
  addWing(S, { root: [side * 0.2, 0.95, -0.1], side, pose: 'raised', span: 1.0, key: 'accent', boneKey: 'accent', tilt: [0.15, 0.4 * side, 0] });
  return S.finish({ ...base.info });
});
void V;
