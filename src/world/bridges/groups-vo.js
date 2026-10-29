// bridges/groups-vo.js - PURE DATA: the sub-groups (claims) of the bridges of Vasilievsky-Okrug 7 that the strip's groups.js does not carry, copied from 102_3d_piter commit 0568f7af (bridges/groups.js): the two long bridges over
// the Malaya Neva (Birzhevoy, Tuchkov: bridges/long.js), the Smolenka bridges drawn by the generic arch machinery (Uralsky, Smolensky: sites-vo.js VO_SITES + styles4.js; Nalichny: sites-vo2.js + styles5.js) and the Novo-Andreevsky
// footbridge (foot3.js). The area module of Vasilyevsky-Okrug 7 appends them to its GROUPS.bridges (with the Palace Bridge and, from bridges/groups-sw.js, the Blagoveshchensky Bridge). The other areas do not list them.
// The stair pits of Nalichny (the wide corner stairs, bridges/pits.js) hand their water rings, keep-outs and paved rings over through src/areas/vasilyevsky/rings.js (WATER_RINGS / KEEP_OUT / PAVED_RINGS below);
// the pits of the bridges outside the territory (Korablestroiteley, the 3rd / 4th Smolensky bridges) are not handed over.
import { WATER_RINGS as PIT_WATER, KEEP_OUT as PIT_KEEP, PAVED_RINGS as PIT_PAVED } from './pits.js';

/** n4spb: the pit rings of the bridges whose pit ids start with one of `prefixes` ('nalichny-', 'korablestroiteley-', 'smol3-' ...): an area hands over only the pits of the bridges it builds (a ring of a pit whose flight is not drawn would be a hole of water
 *  in the street). { WATER_RINGS, KEEP_OUT, PAVED_RINGS } in the format of src/areas/<id>/rings.js. Vasilyevsky and the other old areas keep the Nalichny pits only (the constants below); bridges/groups-mo.js uses it for the new areas. */
export const pitsOf = (prefixes) => {
  const mine = (p) => prefixes.some((x) => p.id.startsWith(x));
  return { WATER_RINGS: PIT_WATER.filter(mine), KEEP_OUT: PIT_KEEP.filter(mine), PAVED_RINGS: PIT_PAVED.filter(mine).map((p) => p.ring) };
};
const NAL = pitsOf(['nalichny-']);
export const WATER_RINGS = NAL.WATER_RINGS;
export const KEEP_OUT = NAL.KEEP_OUT;
export const PAVED_RINGS = NAL.PAVED_RINGS;

export const GROUPS_VO = [
  { key: 'birzhevoy', name: 'Биржевой мост', nameEn: 'Exchange (Birzhevoy) Bridge', ids: [], osm: ['r4074054', 'w362785969', 'w362785970', 'w102582397', 'w128494897'], at: [-2679, -1545], note: 'five flat green welded arches on pink granite piers, trident railing, bascule shown closed' },
  { key: 'tuchkov', name: 'Тучков мост', nameEn: 'Tuchkov Bridge', ids: [], osm: ['r4074067', 'w305504281', 'w305509466', 'w305504282', 'w305509467', 'w305504283', 'w305504284'], at: [-3677, -1843], note: 'three spans, grey haunched girders, round-tower granite piers with pavilions, tram tracks' },
  { key: 'uralsky', name: 'Уральский мост', nameEn: 'Uralsky Bridge (Smolenka)', ids: [], osm: ['r5574842', 'w416041214', 'w416041215', 'w416044686', 'w374751454'], at: [-4627, -1827], note: 'RC frame with pink granite faces, four pale obelisks with gilded ships, black railing' },
  { key: 'smolensky', name: 'Смоленский мост', nameEn: 'Smolensky Bridge (Smolenka)', ids: [], osm: ['r5574843', 'w1116293207', 'w1116293210', 'w374751459', 'w374751460'], at: [-5287, -1646], note: 'granite-faced RC arch, four art-cast torcheres with arrow-bracket lanterns' },
  { key: 'nalichny', name: 'Наличный мост', nameEn: 'Nalichny Bridge (Smolenka)', ids: [], osm: ['r5574920', 'w374756503', 'w374756505', 'w374756494', 'w374756501', 'w374756496', 'w374756497', 'w1079781304', 'w1079781308', 'w1161949776', 'w1540847454', 'w1540847455', 'w1102801990'], at: [-6702, -1708], note: 'granite-faced RC frame, 6 lanes + 2 tram tracks, four granite obelisks, black hexagon lattice railing, four wide corner stairs (the OSM steps w1161949776 / w1540847454 / w1540847455 / w1102801990 are replaced by the flights of stairs.js)' },
  { key: 'novo-andreevsky', name: 'Ново-Андреевский мост', nameEn: 'Novo-Andreevsky Bridge (footbridge)', ids: [], osm: ['w386219560', 'w54858344'], at: [-6328, -1605], note: 'grey steel arched plate girders, forged chain railing, four torcheres' },
];
