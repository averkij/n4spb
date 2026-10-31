// landmarksYelaginKitchen/groups.js - the layout.GROUPS sub-groups of module landmarksYelaginKitchen (pure data, no imports: layout.js merges them).  Claim only what the module really draws
// (dossier docs/research/yelagin-palace-2026.md section 10 module 2).  NOT claimed: the palace (landmarksYelaginPalace), the Stable / Orangery / service houses (landmarksYelaginServices), the gate node n6923559515 at the
// portico (no gate is drawn there: the portico is open in the photos), the footways that lead to the portico (w739448362) and run north of the block (w231033012, w233508888: they stay with streets).
const ON = ['yelagin-kitchen'];

const ALL = [
  { key: 'yelagin-kitchen', name: 'Кухонный корпус Елагина дворца', nameEn: 'Yelagin Kitchen block (Rossi 1818-22): half drum with the 14 Pimenov statues in niches, south and north Doric porticos, white iron fences and gates of the Kitchen yard',
    ids: ['r1444351'],
    osm: ['n6905536550', 'n6905536551', 'n6905536552', 'n6905536553', 'n6905536554', 'n6905536555', 'n6905536556', 'n6905536557', 'n6905536558', 'n6905536559', 'n6905536560', 'n6905536561', 'n6905536562', 'n4353687690',
      'w736544130', 'w372618017', 'n1918525491', 'n6896052612', 'n11288670467', 'w739448361'],
    at: [-4628, -5286],
    note: 'relation r1444351 (outer w181423914, courtyard hole w100824009); the 14 statue nodes (Latona n4353687690 is a NICHE STATUE, not a fountain) are drawn as modelled figures with plates; the two fences and three gates of the yard are drawn white iron; the covered passage footway w739448361 lies inside the closed block (door painted shut)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js SIGHTS lists the modules that may export these; the lead adds landmarksYelaginKitchen there): ground the module paves itself, so that the generic environment plants
// no trunks, hedges, beds or grass tufts there.  Rings are world metres (x, z), computed from frame K (frame.js: W(u, w)): the open lawn in front of the south portico and the drum (photos kit_02, kit_10, kit_16: a mown lawn up to the path).
export const PAVED_RINGS = [
  { id: 'kitchen-front-lawn', ring: (() => {          // review fix: the first version was a thin crescent at R 45-60 and left R 30-45 (the whole lawn in front of the drum) to the trees.  Now: the sector -78..78 deg from the south axis between R 31.2 (the asphalt path) and R 55
    const cx = -4628.43, cz = -5298.68, th = 0.07455, cs = Math.cos(th), sn = Math.sin(th), out = [], inn = [];
    for (let d = -78; d <= 78.01; d += 6) { const a = d * Math.PI / 180; for (const [r, to] of [[55, out], [31.2, inn]]) { const u = r * Math.sin(a), w = r * Math.cos(a); to.push(Math.round((cx + u * cs + w * sn) * 10) / 10, Math.round((cz - u * sn + w * cs) * 10) / 10); } }
    const rev = []; for (let i = inn.length - 2; i >= 0; i -= 2) rev.push(inn[i], inn[i + 1]);
    return [...out, ...rev];
  })() },
  { id: 'kitchen-south-portico-forecourt', ring: [-4638.2, -5268.9, -4614.3, -5270.7, -4613.5, -5259.7, -4637.4, -5257.9] },
];
