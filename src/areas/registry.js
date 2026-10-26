// ============================================================================
//  AREA REGISTRY (docs/AREAS.md) - which areas exist, where their page and their bake live, and the gates between them. PURE DATA, no imports.
//  RUNTIME-ONLY: tools/baked-revision.mjs leaves this file out of the bake revision (RUNTIME_ONLY), so tuning a gate rectangle or a prompt text never makes the bake stale; because of that
//  nothing that builds the scene may import it (tools/runtime-only-lint.mjs: only src/main.js, via core/gates.js, does). The CPU tests (tools/areas-test.mjs) check every row against the
//  real data facade of the area, so a copied number cannot drift.
//  Street frame everywhere: metres, x east, z south (north = -z), yaw 0 = north, 90 = west.
// ============================================================================
export const SCHEMA = 1;

/** Staged release (docs/AREAS.md): false hides every gate (no chip, no prompt, no navigation); a runtime flag, so flipping it needs no re-bake. ?gates=0 / ?gates=1 override it per visit. */
export const GATES_ENABLED = true;

/**
 * id        the area module's ID (src/world/area.js, src/areas/<id>/area.js) and <html data-area>
 * page      the HTML page of the area, relative to the site root (the page next to index.html keeps the PWA scope)
 * bake      directory of its baked products under assets/ (trailing slash); the strip keeps the original path, so the deployed URL and every cached page keep working
 * requireBake  true: a missing or stale bake is an error card, never a procedural rebuild (set for areas that are reached by a hand-off)
 * remap     URL-like keys (relative to the site root) the page's import map points at this area's files; empty for the strip (its files are the defaults)
 * play      the play rectangles (a copy of the data facade's PLAY_RECTS; tools/areas-test.mjs compares)
 */
export const REGISTRY = {
  strip: {
    id: 'strip', page: 'strip.html', bake: 'baked/', requireBake: false, parked: true,
    title: 'Невский проспект', titleEn: 'Nevsky strip',
    sights: ['Московский вокзал', 'Невский проспект', 'Дворцовая площадь', 'Адмиралтейство'],
    approxMB: 51, remap: {}, dev: false,
    play: [
      { name: 'OLD', x0: -595, x1: 835, z0: -405, z1: 1060 },
      { name: 'W1', x0: -1750, x1: -595, z0: -1000, z1: 160 },
      { name: 'N1', x0: -595, x1: -420, z0: -1000, z1: -405 },
      { name: 'W2a', x0: -1950, x1: -1750, z0: -1300, z1: 170 },
      { name: 'W2b', x0: -2200, x1: -1950, z0: -1180, z1: 170 },
      { name: 'W2c', x0: -2450, x1: -2200, z0: -1010, z1: 170 },
      { name: 'W2d', x0: -2700, x1: -2450, z0: -800, z1: 240 },
      { name: 'W2e', x0: -2900, x1: -2700, z0: -620, z1: 240 },
      { name: 'SG', x0: -1000, x1: -600, z0: -1300, z1: -1000 },
    ],
  },
};

// The North (docs/AREAS.md section 4): Chernyshevskaya, Tauride Garden + Palace, Paradny, Smolny, Preobrazhenskaya, Muruzi, Suvorov, Kirochnaya, 3.947 km2. NA includes a one-sided 200 m band of
// the strip's territory (z -405 .. -205, x -420 .. 835), so an arrival from the strip lands on real, identical streets. (`status: 'planned'` marks a row whose files do not exist yet: the tools skip it;
// the North was planned until milestone M3 and is a real area since.) The remap of city/known-data.js gives the page the dossiers of ITS houses (docs/AREAS-DATA.md section 6).
REGISTRY.north = {
  id: 'north', page: 'north.html', bake: 'baked/north/', requireBake: true, parked: true,
  title: 'Север', titleEn: 'North',
  sights: ['Чернышевская', 'Таврический сад', 'Смольный', 'Спасо-Преображенский собор', 'Литейный проспект'],
  approxMB: 36, dev: false,
  remap: {
    'src/world/data/city.js': 'src/areas/north/data/city.js', 'src/world/area.js': 'src/areas/north/area.js',
    'src/world/city/known-data.js': 'src/areas/north/known-data.js',
  },
  play: [
    { name: 'NA', x0: -420, x1: 835, z0: -2000, z1: -205 },
    { name: 'NB', x0: 835, x1: 1550, z0: -2000, z1: -800 },
    { name: 'NC', x0: 1550, x1: 2650, z0: -2060, z1: -1300 },
  ],
};

// ---------------------------------------------------------------- the two areas of the world map (docs/AREAS.md section 13, maps/intro-draft.html)
// The start map of the app shows the real municipal districts; the first two scenes are re-cut to two of them. The play rectangles are the WALKABLE TERRITORY of the map (core + overlaps: border streets and one block
// across, shared junctions, bridges; docs/AREAS.md 12.1) rasterised in 80 m cells (a cell is in when 4 of 9 sample points are inside the outline) and merged into rectangles by tools/area-shape.mjs --k <map id> --js <area> (the map's area ids: 98 Palace-Liteyny,
// 96 Smolninskoye): the staircase along a diagonal street is the 80 m grid. The data of both comes straight from the source project (tools/area-data-cut.mjs --area <id>), the bake from tools/bake-scene.mjs --area <id>.
// The old two scenes, 'strip' and 'north' above, are PARKED (parked: true): their files stay (src/world, src/areas/north, assets/baked, assets/baked/north, strip.html, north.html) for the neighbour areas that are cut later,
// but no gate leads to them and the registry tools that walk "every live area" skip them.
REGISTRY.palace = {
  id: 'palace', page: 'index.html', bake: 'baked/palace/', requireBake: true,
  title: 'Дворцовый–Литейный', titleEn: 'Palace–Liteyny',
  sights: ['Эрмитаж и Зимний дворец', 'Дворцовая площадь', 'Спас на Крови', 'Русский музей', 'Михайловский замок', 'Летний сад', 'Невский проспект', 'Литейный проспект'],
  approxMB: 54, dev: false, mapId: 98,
  remap: {
    'src/world/data/city.js': 'src/areas/palace/data/city.js', 'src/world/area.js': 'src/areas/palace/area.js',
    'src/world/city/known-data.js': 'src/areas/palace/known-data.js',
  },
  play: [
      { name: 'P01', x0: -640, x1: 0, z0: -2400, z1: -2320 },
      { name: 'P02', x0: -800, x1: 400, z0: -2320, z1: -2240 },
      { name: 'P03', x0: -1040, x1: 880, z0: -2240, z1: -2160 },
      { name: 'P04', x0: -1440, x1: 880, z0: -2160, z1: -2080 },
      { name: 'P05', x0: -1520, x1: 800, z0: -2080, z1: -2000 },
      { name: 'P06', x0: -1600, x1: 480, z0: -2000, z1: -1920 },
      { name: 'P07', x0: -1760, x1: 480, z0: -1920, z1: -1840 },
      { name: 'P08', x0: -1760, x1: 880, z0: -1840, z1: -1760 },
      { name: 'P09', x0: -1920, x1: 880, z0: -1760, z1: -1680 },
      { name: 'P10', x0: -2080, x1: 880, z0: -1680, z1: -1600 },
      { name: 'P11', x0: -2160, x1: 880, z0: -1600, z1: -1520 },
      { name: 'P12', x0: -2240, x1: 880, z0: -1520, z1: -1440 },
      { name: 'P13', x0: -2320, x1: 880, z0: -1440, z1: -1360 },
      { name: 'P14', x0: -2480, x1: 880, z0: -1360, z1: -1280 },
      { name: 'P15', x0: -2480, x1: 720, z0: -1280, z1: -1120 },
      { name: 'P16', x0: -2560, x1: 640, z0: -1120, z1: -960 },
      { name: 'P17', x0: -2640, x1: 640, z0: -960, z1: -880 },
      { name: 'P18', x0: -2720, x1: 640, z0: -880, z1: -720 },
      { name: 'P19', x0: -2720, x1: -2560, z0: -720, z1: -640 },
      { name: 'P20', x0: -2480, x1: 640, z0: -720, z1: -560 },
      { name: 'P21', x0: -2560, x1: 640, z0: -560, z1: -480 },
      { name: 'P22', x0: -2480, x1: -2400, z0: -480, z1: -400 },
      { name: 'P23', x0: -2240, x1: 640, z0: -480, z1: -320 },
      { name: 'P24', x0: -2160, x1: 640, z0: -320, z1: -240 },
      { name: 'P25', x0: -1840, x1: 640, z0: -240, z1: -160 },
      { name: 'P26', x0: -1840, x1: -1600, z0: -160, z1: -80 },
      { name: 'P27', x0: -1360, x1: 640, z0: -160, z1: -80 },
      { name: 'P28', x0: -1760, x1: -1680, z0: -80, z1: 0 },
      { name: 'P29', x0: -1280, x1: -1120, z0: -80, z1: 0 },
      { name: 'P30', x0: -960, x1: 640, z0: -80, z1: 0 },
      { name: 'P31', x0: -1280, x1: -1200, z0: 0, z1: 80 },
      { name: 'P32', x0: -800, x1: 880, z0: 0, z1: 160 },
      { name: 'P33', x0: -800, x1: -560, z0: 160, z1: 240 },
      { name: 'P34', x0: -320, x1: -240, z0: 160, z1: 240 },
      { name: 'P35', x0: 80, x1: 720, z0: 160, z1: 320 },
      { name: 'P36', x0: 80, x1: 800, z0: 320, z1: 400 },
      { name: 'P37', x0: 160, x1: 240, z0: 400, z1: 480 },
      { name: 'P38', x0: 480, x1: 800, z0: 400, z1: 480 },
      { name: 'P39', x0: 480, x1: 720, z0: 480, z1: 560 },
      { name: 'ST', x0: 400, x1: 835, z0: 160, z1: 1060 },      // the Moscow station complex (building, platforms, tracks, throat: the strip's own extent) belongs to both areas whole: the rail module needs complete platforms
  ],
};
REGISTRY.smolny = {
  id: 'smolny', page: 'smolny.html', bake: 'baked/smolny/', requireBake: true,
  title: 'Смольнинское', titleEn: 'Smolninskoye',
  sights: ['Смольный собор', 'Таврический сад и дворец', 'Московский вокзал', 'площадь Восстания', 'Суворовский музей', 'Чернышевская', 'Лиговский проспект'],
  approxMB: 51, dev: false, mapId: 96,
  remap: {
    'src/world/data/city.js': 'src/areas/smolny/data/city.js', 'src/world/area.js': 'src/areas/smolny/area.js',
    'src/world/city/known-data.js': 'src/areas/smolny/known-data.js',
  },
  play: [
      { name: 'S01', x0: 1840, x1: 2320, z0: -3040, z1: -2960 },
      { name: 'S02', x0: 1680, x1: 2560, z0: -2960, z1: -2880 },
      { name: 'S03', x0: 1680, x1: 2720, z0: -2880, z1: -2800 },
      { name: 'S04', x0: 1600, x1: 2880, z0: -2800, z1: -2720 },
      { name: 'S05', x0: 1520, x1: 2960, z0: -2720, z1: -2640 },
      { name: 'S06', x0: 1440, x1: 2960, z0: -2640, z1: -2560 },
      { name: 'S07', x0: 1360, x1: 3040, z0: -2560, z1: -2480 },
      { name: 'S08', x0: 1280, x1: 3040, z0: -2480, z1: -2400 },
      { name: 'S09', x0: 1040, x1: 3120, z0: -2400, z1: -2320 },
      { name: 'S10', x0: 240, x1: 320, z0: -2320, z1: -2240 },
      { name: 'S11', x0: 800, x1: 3120, z0: -2320, z1: -2240 },
      { name: 'S12', x0: 240, x1: 3120, z0: -2240, z1: -2080 },
      { name: 'S13', x0: 240, x1: 3040, z0: -2080, z1: -2000 },
      { name: 'S14', x0: 400, x1: 3040, z0: -2000, z1: -1840 },
      { name: 'S15', x0: 80, x1: 3040, z0: -1840, z1: -1600 },
      { name: 'S16', x0: 80, x1: 3120, z0: -1600, z1: -1520 },
      { name: 'S17', x0: 80, x1: 3040, z0: -1520, z1: -1440 },
      { name: 'S18', x0: 0, x1: 2960, z0: -1440, z1: -1360 },
      { name: 'S19', x0: 240, x1: 2960, z0: -1360, z1: -1200 },
      { name: 'S20', x0: 240, x1: 3040, z0: -1200, z1: -1120 },
      { name: 'S21', x0: 240, x1: 2960, z0: -1120, z1: -800 },
      { name: 'S22', x0: 400, x1: 2880, z0: -800, z1: -640 },
      { name: 'S23', x0: 240, x1: 2880, z0: -640, z1: -400 },
      { name: 'S24', x0: 240, x1: 2800, z0: -400, z1: -160 },
      { name: 'S25', x0: 240, x1: 2720, z0: -160, z1: -80 },
      { name: 'S26', x0: 160, x1: 2720, z0: -80, z1: 80 },
      { name: 'S27', x0: 240, x1: 2720, z0: 80, z1: 160 },
      { name: 'S28', x0: 240, x1: 2640, z0: 160, z1: 320 },
      { name: 'S29', x0: 160, x1: 2560, z0: 320, z1: 400 },
      { name: 'S30', x0: 160, x1: 240, z0: 400, z1: 480 },
      { name: 'S31', x0: 480, x1: 2560, z0: 400, z1: 480 },
      { name: 'S32', x0: 480, x1: 800, z0: 480, z1: 560 },
      { name: 'S33', x0: 1040, x1: 2640, z0: 480, z1: 560 },
      { name: 'S34', x0: 560, x1: 720, z0: 560, z1: 640 },
      { name: 'S35', x0: 1040, x1: 2880, z0: 560, z1: 640 },
      { name: 'S36', x0: 1280, x1: 2800, z0: 640, z1: 720 },
      { name: 'S37', x0: 1360, x1: 2720, z0: 720, z1: 800 },
      { name: 'S38', x0: 1520, x1: 2720, z0: 800, z1: 1040 },
      { name: 'S39', x0: 1520, x1: 2640, z0: 1040, z1: 1120 },
      { name: 'S40', x0: 1600, x1: 2000, z0: 1120, z1: 1200 },
      { name: 'ST', x0: 400, x1: 835, z0: 160, z1: 1060 },      // the Moscow station complex (building, platforms, tracks, throat: the strip's own extent) belongs to both areas whole: the rail module needs complete platforms
  ],
};
// The third live area (docs/AREAS.md 15.x, map area 97): the Vladimirsky and Ligovka districts south of Nevsky - Vladimirsky Prospekt with the cathedral and the Tolstoy House, Dostoevskaya, Ligovsky Prospekt, the Obvodny canal,
// the Alexander Nevsky Lavra and Square - with the Moscow station complex whole (rectangle ST). The cut of tools/area-shape.mjs --k 97 --js vladimirsky (land outline plus water zones, 48 rectangles, 8.63 km2) and ST.
REGISTRY.vladimirsky = {
  id: 'vladimirsky', page: 'vladimirsky.html', bake: 'baked/vladimirsky/', requireBake: true,
  title: 'Владимирский–Лиговка', titleEn: 'Vladimirsky–Ligovka',
  sights: ['Владимирский собор', 'Толстовский дом', 'Достоевская', 'Московский вокзал', 'площадь Восстания', 'Лиговский проспект', 'Александро-Невская лавра', 'Александринский театр'],
  approxMB: 62, dev: false, mapId: 97,
  remap: {
    'src/world/data/city.js': 'src/areas/vladimirsky/data/city.js', 'src/world/area.js': 'src/areas/vladimirsky/area.js',
    'src/world/city/known-data.js': 'src/areas/vladimirsky/known-data.js',
  },
  play: [
      { name: 'V01', x0: -320, x1: -240, z0: -480, z1: -400 },
      { name: 'V02', x0: -880, x1: -800, z0: -400, z1: -320 },
      { name: 'V03', x0: -400, x1: -80, z0: -400, z1: -320 },
      { name: 'V04', x0: -880, x1: 480, z0: -320, z1: -240 },
      { name: 'V05', x0: -800, x1: 480, z0: -240, z1: -160 },
      { name: 'V06', x0: -720, x1: 480, z0: -160, z1: -80 },
      { name: 'V07', x0: -720, x1: 560, z0: -80, z1: 0 },
      { name: 'V08', x0: -960, x1: 880, z0: 0, z1: 80 },
      { name: 'V09', x0: -1040, x1: 1040, z0: 80, z1: 160 },
      { name: 'V10', x0: -1200, x1: 1040, z0: 160, z1: 240 },
      { name: 'V11', x0: -1280, x1: 1200, z0: 240, z1: 320 },
      { name: 'V12', x0: -1360, x1: 1200, z0: 320, z1: 400 },
      { name: 'V13', x0: 2320, x1: 2400, z0: 320, z1: 400 },
      { name: 'V14', x0: -1360, x1: 1280, z0: 400, z1: 480 },
      { name: 'V15', x0: 2240, x1: 2480, z0: 400, z1: 480 },
      { name: 'V16', x0: -1440, x1: 1440, z0: 480, z1: 560 },
      { name: 'V17', x0: 2160, x1: 2640, z0: 480, z1: 560 },
      { name: 'V18', x0: -1440, x1: 1840, z0: 560, z1: 720 },
      { name: 'V19', x0: 2160, x1: 2880, z0: 560, z1: 640 },
      { name: 'V20', x0: 2160, x1: 2800, z0: 640, z1: 800 },
      { name: 'V21', x0: -1440, x1: 2000, z0: 720, z1: 800 },
      { name: 'V22', x0: -1440, x1: 2800, z0: 800, z1: 880 },
      { name: 'V23', x0: -1200, x1: 2880, z0: 880, z1: 960 },
      { name: 'V24', x0: -1200, x1: 2960, z0: 960, z1: 1040 },
      { name: 'V25', x0: -1120, x1: 2960, z0: 1040, z1: 1280 },
      { name: 'V26', x0: -1120, x1: 3040, z0: 1280, z1: 1360 },
      { name: 'V27', x0: -1040, x1: 3040, z0: 1360, z1: 1520 },
      { name: 'V28', x0: -960, x1: 3040, z0: 1520, z1: 1680 },
      { name: 'V29', x0: -960, x1: 2320, z0: 1680, z1: 1760 },
      { name: 'V30', x0: 2480, x1: 2720, z0: 1680, z1: 1760 },
      { name: 'V31', x0: 2880, x1: 3040, z0: 1680, z1: 1760 },
      { name: 'V32', x0: -1040, x1: 2320, z0: 1760, z1: 1840 },
      { name: 'V33', x0: 2480, x1: 2640, z0: 1760, z1: 1920 },
      { name: 'V34', x0: -1040, x1: 2240, z0: 1840, z1: 1920 },
      { name: 'V35', x0: -1120, x1: 1680, z0: 1920, z1: 2000 },
      { name: 'V36', x0: 1840, x1: 2160, z0: 1920, z1: 2000 },
      { name: 'V37', x0: -1040, x1: 1680, z0: 2000, z1: 2160 },
      { name: 'V38', x0: -1120, x1: -480, z0: 2160, z1: 2240 },
      { name: 'V39', x0: -320, x1: 1600, z0: 2160, z1: 2240 },
      { name: 'V40', x0: -1120, x1: -560, z0: 2240, z1: 2320 },
      { name: 'V41', x0: -80, x1: 1520, z0: 2240, z1: 2320 },
      { name: 'V42', x0: -1280, x1: -560, z0: 2320, z1: 2400 },
      { name: 'V43', x0: 160, x1: 1120, z0: 2320, z1: 2400 },
      { name: 'V44', x0: 1360, x1: 1440, z0: 2320, z1: 2400 },
      { name: 'V45', x0: -1280, x1: -640, z0: 2400, z1: 2480 },
      { name: 'V46', x0: 480, x1: 1040, z0: 2400, z1: 2480 },
      { name: 'V47', x0: -1200, x1: -720, z0: 2480, z1: 2560 },
      { name: 'V48', x0: -1200, x1: -800, z0: 2560, z1: 2640 },
      { name: 'ST', x0: 400, x1: 835, z0: 160, z1: 1060 },      // the Moscow station complex (building, platforms, tracks, throat: the strip's own extent) belongs to all live areas whole: the rail module needs complete platforms (inside the outline already; the row keeps the pinned rectangle of palace / smolny)
  ],
};

// Admiralty-Haymarket (docs/AREAS.md 15.2): map area 46, the merge of the Admiralteysky and Sennoy districts and the 78th okrug; no railway station (one purple Zhiguli at the spawn, 13.4).
REGISTRY.admiralty = {
  id: 'admiralty', page: 'admiralty.html', bake: 'baked/admiralty/', requireBake: true,
  title: 'Адмиралтейский–Сенной', titleEn: 'Admiralty–Haymarket',
  sights: ['Адмиралтейство', 'Исаакиевский собор', 'Медный всадник', 'Казанский собор', 'Мариинский театр', 'Новая Голландия', 'Никольский морской собор', 'Юсуповский дворец', 'Сенная площадь'],
  approxMB: 60, dev: false, mapId: 46,
  remap: {
    'src/world/data/city.js': 'src/areas/admiralty/data/city.js', 'src/world/area.js': 'src/areas/admiralty/area.js',
    'src/world/city/known-data.js': 'src/areas/admiralty/known-data.js',
  },
  play: [
      { name: 'A01', x0: -2000, x1: -1840, z0: -1440, z1: -1360 },
      { name: 'A02', x0: -2400, x1: -1920, z0: -1360, z1: -1280 },
      { name: 'A03', x0: -2480, x1: -1920, z0: -1280, z1: -1120 },
      { name: 'A04', x0: -2560, x1: -2000, z0: -1120, z1: -960 },
      { name: 'A05', x0: -2640, x1: -1920, z0: -960, z1: -880 },
      { name: 'A06', x0: -2800, x1: -1920, z0: -880, z1: -800 },
      { name: 'A07', x0: -2880, x1: -2080, z0: -800, z1: -720 },
      { name: 'A08', x0: -3040, x1: -2080, z0: -720, z1: -640 },
      { name: 'A09', x0: -1520, x1: -1440, z0: -720, z1: -640 },
      { name: 'A10', x0: -3200, x1: -1360, z0: -640, z1: -560 },
      { name: 'A11', x0: -3440, x1: -1360, z0: -560, z1: -480 },
      { name: 'A12', x0: -3600, x1: -1120, z0: -480, z1: -400 },
      { name: 'A13', x0: -400, x1: -240, z0: -480, z1: -400 },
      { name: 'A14', x0: -3760, x1: -880, z0: -400, z1: -320 },
      { name: 'A15', x0: -400, x1: -160, z0: -400, z1: -320 },
      { name: 'A16', x0: -3920, x1: -240, z0: -320, z1: -240 },
      { name: 'A17', x0: -4000, x1: -240, z0: -240, z1: -160 },
      { name: 'A18', x0: -4160, x1: -240, z0: -160, z1: -80 },
      { name: 'A19', x0: -4240, x1: -320, z0: -80, z1: 160 },
      { name: 'A20', x0: -4240, x1: -400, z0: 160, z1: 240 },
      { name: 'A21', x0: -4160, x1: -400, z0: 240, z1: 400 },
      { name: 'A22', x0: -4080, x1: -480, z0: 400, z1: 480 },
      { name: 'A23', x0: -3840, x1: -480, z0: 480, z1: 640 },
      { name: 'A24', x0: -3760, x1: -560, z0: 640, z1: 720 },
      { name: 'A25', x0: -3760, x1: -640, z0: 720, z1: 800 },
      { name: 'A26', x0: -3600, x1: -3520, z0: 800, z1: 880 },
      { name: 'A27', x0: -3360, x1: -800, z0: 800, z1: 880 },
      { name: 'A28', x0: -3280, x1: -800, z0: 880, z1: 960 },
      { name: 'A29', x0: -3280, x1: -960, z0: 960, z1: 1040 },
      { name: 'A30', x0: -3280, x1: -1280, z0: 1040, z1: 1120 },
      { name: 'A31', x0: -1120, x1: -1040, z0: 1040, z1: 1120 },
      { name: 'A32', x0: -3200, x1: -1280, z0: 1120, z1: 1200 },
      { name: 'A33', x0: -3120, x1: -1280, z0: 1200, z1: 1280 },
      { name: 'A34', x0: -3120, x1: -1440, z0: 1280, z1: 1360 },
      { name: 'A35', x0: -3040, x1: -1440, z0: 1360, z1: 1440 },
      { name: 'A36', x0: -3040, x1: -1520, z0: 1440, z1: 1520 },
      { name: 'A37', x0: -3040, x1: -1600, z0: 1520, z1: 1600 },
      { name: 'A38', x0: -2880, x1: -1760, z0: 1600, z1: 1680 },
      { name: 'A39', x0: -2880, x1: -1840, z0: 1680, z1: 1760 },
      { name: 'A40', x0: -3040, x1: -2240, z0: 1760, z1: 1840 },
      { name: 'A41', x0: -3200, x1: -2640, z0: 1840, z1: 1920 },
      { name: 'A42', x0: -3360, x1: -2640, z0: 1920, z1: 2000 },
      { name: 'A43', x0: -3280, x1: -3040, z0: 2000, z1: 2080 },
  ],
};

/**
 * Gates between areas: { id, from, to, seg: [[x,z],[x,z]] (the border segment in the FROM area), inward: [nx,nz] (unit vector pointing from the border into the FROM area), zone (m: depth of the
 * prompt zone, walking), arrive: { x0, x1, z0, z1 } (where the player may land in the TO area), reverse (id of the gate back) }.
 * A DOOR gate (kind: 'door', milestone M7) is not a stretch of the border but a ctx.interact item (E / USE) for a walker: { id, kind: 'door', from, to, at: { x, z } (the door point in the FROM area),
 * r (m: the use radius), pose: { x, z, yaw, pitch } (the arrival pose in the TO area, on foot; `view` names the VIEWS row of the TO area it copies, tools/areas-test.mjs pins it), prompt (its texts:
 * label / labelEn of the chip, title / sights / scene / fine of the question), reverse: null }. The gate machine ignores doors (no chip, no zone, no arrival rectangle); core/gates.js registers them.
 * An EDGE gate (kind: 'edge', docs/AREAS.md "Seamless hand-off") is a border between two TERRITORIES (REGISTRY[id].play, a union of rectangles) that overlap by about one block: { id, kind: 'edge', from, to, zone (m, optional:
 * how far ahead of a walker the probe point lies, default 40; a vehicle or flyer uses the speed-dependent depth), reverse (id of the gate back) }. It triggers when the player is inside FROM's territory and the point
 * p + depth * dir (8 directions, every 45 degrees) is outside FROM's but inside TO's by at least 60 m, and he moves toward it (or stands within 8 m of the edge). No segment, no arrival rectangle: he lands at the same x, z, yaw.
 */
export const GATES = [
  // g1 / g2 - the strip and the North share one border, the line z = -405 .. -205 across Liteyny (x -420 .. 835). The strip ends at z = -405 (its OLD rectangle); the North holds the strip's 200 m band
  // z -405 .. -205 as its own territory again (identical streets and buildings, tools/band-parity.mjs), so a crossing lands in the middle of a street that exists on both sides and the ping-pong margin
  // is 100+ m: g1 arrives in the North between z -460 and -310 (the band and the first 55 m beyond it; 105+ m north of g2's border), g2 arrives in the strip at z -300 .. -230 (inside the strip, 175+ m south of g1's border).
  // The arrival rectangles are the planned ones (x -350 .. 805) trimmed to what the 25 m arrival grid of tools/areas-test.mjs resolves 100 % (walk / fly / car x both headings): the Fontanka water spans x -434 .. -379 in the band
  // and the library block x -350 .. -250 has no north-south lane for a car (a car must land on a lane within 30 degrees of its heading, and the ring search stays inside the rectangle), so x starts at -225; g1 stops at x 755 and
  // z -310 (no lane at (775 .. 805, -345 .. -300), (-25, -300), (0, -345)) and starts at z -460 (no lane at (-100 .. 805, -520 .. -470)); g2 ends at z -230 (no lane at (375 .. 400, -220)). A walker or a car that leaves the
  // strip at a spot outside the rectangle lands at the nearest point of it (the departure x is clamped, so a crossing on the Fontanka quay at x -370 lands 145 m east of it).
  { id: 'g1', from: 'strip', to: 'north', seg: [[-420, -405], [835, -405]], inward: [0, 1], zone: 30, arrive: { x0: -225, x1: 755, z0: -460, z1: -310 }, reverse: 'g2' },
  { id: 'g2', from: 'north', to: 'strip', seg: [[-420, -205], [835, -205]], inward: [0, -1], zone: 30, arrive: { x0: -225, x1: 805, z0: -300, z1: -230 }, reverse: 'g1' },
  // e1 / e2 - the edge gates between the first two live areas (docs/AREAS.md sections 13 and 14; the whole graph: e3 .. e10 below): the territories overlap by about one block (Ligovsky, Nevsky / Vosstaniya, Liteyny / Chernyshevskaya), and the player
  // who walks out of one territory into the core of the other is carried over without a question (freeze, blur, progress bar). No segment and no arrival rectangle: he lands at the same x, z, yaw.
  { id: 'e1', kind: 'edge', from: 'palace', to: 'smolny', zone: 40, reverse: 'e2' },
  { id: 'e2', kind: 'edge', from: 'smolny', to: 'palace', zone: 40, reverse: 'e1' },
  // e3 .. e10 - the four-area graph (docs/AREAS.md 15.y): an edge gate each way for EVERY pair of live areas whose territories (REGISTRY[id].play) overlap, none for a pair that does not. Computed from the rectangles
  // (km2 of overlap): palace-smolny 2.09 (e1/e2), palace-admiralty 1.44 (e3/e4), palace-vladimirsky 1.87 (e5/e6), smolny-vladimirsky 2.32 (e7/e8), admiralty-vladimirsky 0.98 (e9/e10); admiralty-smolny 0.00: the two have
  // no common ground, so there is NO gate between them (tools/areas-test.mjs checks the rule both ways: a gate for every overlapping pair, none for a pair that does not overlap).
  // Where three territories overlap (the Moscow station complex ST lies in palace, smolny and vladimirsky) the gate machine takes the first row of the FROM area that triggers, in registry order.
  { id: 'e3', kind: 'edge', from: 'palace', to: 'admiralty', zone: 40, reverse: 'e4' },
  { id: 'e4', kind: 'edge', from: 'admiralty', to: 'palace', zone: 40, reverse: 'e3' },
  { id: 'e5', kind: 'edge', from: 'palace', to: 'vladimirsky', zone: 40, reverse: 'e6' },
  { id: 'e6', kind: 'edge', from: 'vladimirsky', to: 'palace', zone: 40, reverse: 'e5' },
  { id: 'e7', kind: 'edge', from: 'smolny', to: 'vladimirsky', zone: 40, reverse: 'e8' },
  { id: 'e8', kind: 'edge', from: 'vladimirsky', to: 'smolny', zone: 40, reverse: 'e7' },
  { id: 'e9', kind: 'edge', from: 'admiralty', to: 'vladimirsky', zone: 40, reverse: 'e10' },
  { id: 'e10', kind: 'edge', from: 'vladimirsky', to: 'admiralty', zone: 40, reverse: 'e9' },
  // g0 - the dev loop (?devgates=1): a gate across the Nevsky approach to Vosstaniya Square (a vertical segment at x = 470, the strip east of it is the "own area") that leads back to the SAME page at
  // the same pose. It exercises the whole hand-off (prompt, preflight, veil, navigation, arrival, memory) before a second area exists, and stays as a test fixture afterwards.
  { id: 'g0', dev: true, from: 'strip', to: 'strip', seg: [[470, 100], [470, 240]], inward: [1, 0], zone: 30, arrive: { x0: 440, x1: 700, z0: 80, z1: 260 }, reverse: 'g0' },
  // g3 - the metro door (milestone M7, plan 3.3): the North has no metro hall in v1, so the door of the Chernyshevskaya vestibule (w22999175; `at` is the middle of its west front, the edge
  // (460.9, -1340.1) - (461.2, -1360.2), where its six doors are) stands in for the 1,560 m / 122 s ride of line 1 to Ploshchad Vosstaniya: a walker within 4 m presses E, the question names the
  // metro and the page load, and the strip page boots at its VIEWS 'AltDigit1' pose (the rotunda of the Ploshchad Vosstaniya metro; the numbers are that row's, tools/areas-test.mjs pins them),
  // ON FOOT (no car hold: the car stays at the vestibule). No reverse door: the strip's Chernyshevskaya is a closed generic terminus (src/world/data/metro.js); the way back is the border gate g1.
  { id: 'g3', kind: 'door', from: 'north', to: 'strip', at: { x: 461.05, z: -1350.15 }, r: 4, pose: { x: 534, z: 125, yaw: 28.61, pitch: 10 }, view: 'AltDigit1', reverse: null,
    prompt: {
      label: 'Метро: одна остановка до «Площади Восстания»', labelEn: 'Metro: one stop to Ploshchad Vosstaniya (the Nevsky strip)',
      title: 'Метро «Чернышевская» → «Площадь Восстания» · Metro: Chernyshevskaya → Ploshchad Vosstaniya',
      sights: 'Одна остановка по первой линии, 1 560 м, около двух минут · One stop on line 1, 1,560 m, about two minutes',
      scene: 'Невский проспект — отдельная сцена, около 51 МБ, 25–40 с; страница перезагрузится, и вы выйдете из метро у ротонды на площади Восстания · The Nevsky strip is a separate scene, about 51 MB, 25–40 s; the page reloads and you come out of the metro at the rotunda on Vosstaniya Square',
      fine: 'Пешком: машина останется здесь; время суток и звук поедут с вами · On foot: the car stays here; time of day and sound come along',
    } },
];
