// landmarksTVTower/mats.js - the flat colours of the tower (all through ctx.mat.toon, every name starts with 'lmTV-'; the engine bakes them into vertex colours of ONE shared material, so the
// number of materials costs no draw calls).  Colours from the photos refs/aptekarsky/B3 68 69 70 (day, summer):
//   steel      the lattice: weathered white-grey enamel (#d9d8d1), the legs and the ties
//   steelDk    shadow side parts: grating, brackets, the dark steel of shoes and collars (#6d7276)
//   red        the red of the bracing and of the shaft bands (#c4402f), the same paint as the aviation marking of the mast
//   shaft      the white concrete of the shaft (#ece9e1)
//   shaftRed   red concrete bands (#bf3a2c)
//   pedestal   the cream stone block at the foot (#cdc5b3) and the brick-red shaft foot (#a9503a)
//   lantern    the grey-green steel of the lantern slabs (#8b958e), lighter rim (#a3aaa3)
//   glass      the dark teal glass of the lantern (#2f4a52) + the frames (#c9ccc4)
//   bronze     the cone under the spire (#8c6a3c)
//   cream      antenna panels of the spire (#e6c99b), orange block (#d4602d)
//   conc       foundation pads and fence plinth (#b5b1a6)
export function makeMats(ctx) {
  const T = (c, name, paint = 0.02) => ctx.mat.toon(c, { name: 'lmTV-' + name, paint });
  return {
    steel: T('#d9d8d1', 'steel'),
    steelDk: T('#6d7276', 'steelDk'),
    steelMid: T('#a9adaf', 'steelMid'),
    red: T('#c4402f', 'red'),
    redDk: T('#9c3427', 'redDk'),
    shaft: T('#ece9e1', 'shaft', 0.03),
    shaftRed: T('#c23b2d', 'shaftRed', 0.03),
    ped: T('#cdc5b3', 'ped', 0.04),
    pedRed: T('#a9503a', 'pedRed', 0.03),
    slab: T('#8b958e', 'slab', 0.03),
    slabLt: T('#a8afa8', 'slabLt', 0.03),
    glass: T('#2f4a52', 'glass', 0.0),
    frame: T('#c9ccc4', 'frame'),
    cream: T('#e6c99b', 'cream'),
    orange: T('#d4602d', 'orange'),
    bronze: T('#8c6a3c', 'bronze', 0.03),
    conc: T('#b5b1a6', 'conc', 0.04),
    port: T('#1f2a30', 'port', 0),
    fence: T('#aebcc4', 'fence'),
  };
}
