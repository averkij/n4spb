// bridges/kamenny/mats.js - the few materials of the Kamenny Island bridges that bridges/mats.js does not have; everything else is shared (K inherits every key of M).
//   fasKam      pale blue-grey painted steel of the Kamennoostrovsky / Ushakovsky girders (photos 07 08: #8fa3ae in shade, near white in the sun)           #aab6bd
//   graniteUsh  the rusticated pale grey-beige granite of the Ushakovsky arcades and bastions (photos 16 19 21 24: courses 0.55 m)                       #bcb09c
//   parapetUsh  its parapet blocks                                                                                                                        #b8ad9b
//   colGreen    shared (mats.js): fluted dark green cast-iron columns; bronze = bronzeTroitsky
//   parkIron    black cast iron of the park lamps / railings of the small bridges (shared M.iron)
//   concreteKam weathered grey concrete of the small bridges' slabs and wings                                                                           #aaa9a2
//   white railing paint of the 14th bridge, the ring-medallion black of the 6th and the rope-loop green-ochre of the Bolshoy canal bridges come through the rail materials (hex per bridge)
export function makeKamMats(ctx, M) {
  const T = ctx.mat.toon, K = Object.create(M);
  const gm = (name, hex) => T(hex, { map: M.texGranite, paint: 0.05, name: 'brg-' + name });
  K.fasKam = T('#aab6bd', { paint: 0.05, name: 'brg-fas-kam' });
  K.graniteUsh = gm('granite-ush', '#bcb09c');
  K.parapetUsh = T('#b8ad9b', { map: M.texParapet, paint: 0.06, name: 'brg-parapet-ush' });
  K.concreteKam = T('#aaa9a2', { paint: 0.06, name: 'brg-concrete-kam' });
  K.slabEdge = T('#b9b8b0', { paint: 0.05, name: 'brg-slab-edge' });
  return K;
}
