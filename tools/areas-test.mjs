// CPU test of the area system (docs/AREAS.md): the registry against the real area modules, data facades and pages. node tools/areas-test.mjs [--area <id>]
// What it proves today (milestone M1): every registry row names an existing page whose <html data-area> equals the id, its bake directory is the one the area module declares, its play rectangles
// are exactly the data facade's PLAY_RECTS, every module of the area's module list has a file, the module list of the strip equals src/main.js MODULES, and the gates reference known areas.
// Areas other than the strip are loaded through the same import-map remap the page uses (tools/area.mjs).
// M3 adds: the GATE GEOMETRY of every non-dev gate (tools/lib/gate-geometry.mjs: the segment lies on the border of the origin play union on both sides, inward points into the area, a point at depth
// `zone` is inside, the arrival rectangle lies 25 m inside the destination play union, the reverse gate leads back and its zone stays clear of the arrival grid, the arrival grid - 25 m steps x walk / fly / car x
// both headings - is resolved by handoff.resolveArrival with the DESTINATION layout and 100 percent valid, and the band-parity hook tools/band-parity.mjs `bandParity({ gate, root, REGISTRY })`
// when the data task provides it); synthetic gate fixtures exercise every one of those checks (and every way they must fail) even while no real gate exists; the generated area pages
// (tools/gen-area-html.mjs: fixtures, the page.json files, and for a real area the page on disk); the shape of each area module's TEST.
// Since the world-map re-cut (docs/AREAS.md sections 13 and 14) it also knows the live areas: the template of every generated page is strip.html (index.html is the generated page of 'palace'), the gates of kind 'edge'
// (tools/lib/edge-geometry.mjs: the row, the reverse pair, the overlap of the territories, the lens of the boundary - how much of it hops, the dead strips, the bounce-back risk - and the arrival at the working points
// in the destination layout, in a child), the shape of every territory (no hole, no corner-only island), the live pair (an edge gate each way, none from a live area to a parked one, the shared station rectangle ST),
// the page.json / generated page of every real area, the TEST export of every area module.
// M5 adds the BAND LANDMARK parity of every non-dev gate with the strip on one side (tools/band-parity.mjs bandLandmarks; the claims of both areas come from tools/lib/claims-dump.mjs, run as
// `node tools/area.mjs <area> tools/lib/claims-dump.mjs`): every landmark claim of the strip whose record lies in the band must be claimed in the other area, by id and sub-group key, by a module that is in that
// area's MODULES and owns the sub-group; synthetic fixtures cover a missing claim, an owner outside MODULES, an id nobody claims, a wrong key, a lost part and a vacuous band.
//   node tools/areas-test.mjs [--area <id>]        a gate whose destination is another area runs its arrival grid in a child: node tools/area.mjs <to> tools/areas-test.mjs --arrival-only <gate>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRY, GATES, SCHEMA } from '../src/areas/registry.js';
import { mainModules } from './modules-list.mjs';
import * as GG from './lib/gate-geometry.mjs';
import * as EG from './lib/edge-geometry.mjs';
import { testShapeProblems, stripTest, resolveTest } from './lib/area-test-data.mjs';
import { generatePage, generateFor, validatePage, pageJsonFile } from './gen-area-html.mjs';
import { resolveArea } from './lib/area-page.mjs';
import { landmarkBandProblems, bandLandmarks, bandRects, PLAN_BAND_IDS } from './band-parity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0, passes = 0;
const check = (name, fn) => { try { fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 8).join('\n       ')); } };
const only = process.argv.includes('--area') ? process.argv[process.argv.indexOf('--area') + 1] : null;
const hereArea = process.env.AREA || 'strip';      // the area whose layout.js this process loads (tools/area.mjs sets AREA)
const layoutUrl = pathToFileURL(path.join(root, 'src/world/layout.js')).href;

// child mode: print the arrival grid of ONE gate for the layout of THIS process's area (the destination of the gate)
if (process.argv.includes('--arrival-only')) {
  const g = GATES.find((x) => x.id === process.argv[process.argv.indexOf('--arrival-only') + 1]);
  if (!g || g.to !== hereArea) { console.error(`arrival-only: gate ${g && g.id} does not lead to ${hereArea}`); process.exit(2); }
  const L = await import(layoutUrl);
  console.log('ARRIVAL_GRID ' + JSON.stringify(g.kind === 'edge' ? EG.edgeArrival(EG.edgeLens(REGISTRY[g.from].play, REGISTRY[g.to].play, { backMax: 0 }).points, L) : GG.arrivalGrid(g, L)));
  process.exit(0);
}

check('registry schema is 1 and ids are unique and match their keys', () => {
  assert.equal(SCHEMA, 1);
  for (const [k, a] of Object.entries(REGISTRY)) assert.equal(a.id, k, `row ${k}`);
});
for (const a of Object.values(REGISTRY)) {
  if (only && a.id !== only) continue;
  console.log(`area ${a.id}${a.status === 'planned' ? ' (planned: its files do not exist yet)' : ''}:`);
  if (a.status === 'planned') {
    check('planned area: well-formed play rectangles that do not overlap each other, in a sensible total area', () => {
      assert(a.play.length >= 1);
      for (const r of a.play) { assert(r.x1 > r.x0 && r.z1 > r.z0, 'rect ' + r.name); assert(Math.abs(r.x0) < 20000 && Math.abs(r.z0) < 20000); }
      for (let i = 0; i < a.play.length; i++) for (let j = i + 1; j < a.play.length; j++) { const p = a.play[i], q = a.play[j]; assert(!(p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1), `${p.name} overlaps ${q.name}`); }
      const km2 = a.play.reduce((s, r) => s + (r.x1 - r.x0) * (r.z1 - r.z0), 0) / 1e6; assert(km2 > 0.5 && km2 < 5.5, km2.toFixed(3) + ' km2');
    });
    continue;
  }
  check('page exists and names its area (<html data-area>)', () => {
    const f = path.join(root, a.page); assert(fs.existsSync(f), a.page + ' is missing');
    const html = fs.readFileSync(f, 'utf8'); const m = /<html[^>]*\sdata-area="([^"]+)"/.exec(html);
    assert(m, a.page + ' has no data-area'); assert.equal(m[1], a.id);
  });
  check('bake directory is a path under assets/ with a trailing slash', () => { assert(/^[a-z0-9/_-]+\/$/.test(a.bake), a.bake); assert(!a.bake.startsWith('/')); });
  check('remap keys exist as files and so do their targets', () => {
    for (const [k, v] of Object.entries(a.remap || {})) { assert(fs.existsSync(path.join(root, k)), 'remap key ' + k); assert(fs.existsSync(path.join(root, v)), 'remap target ' + v); }
  });
  // the area's own modules are read through the remap the page uses
  let A, C;
  try {
    if (a.id === 'strip') { A = await import(pathToFileURL(path.join(root, 'src/world/area.js')).href); C = await import(pathToFileURL(path.join(root, 'src/world/data/city.js')).href); }
    else { const { areaModules } = await import('./lib/area-hooks.mjs'); ({ A, C } = await areaModules(root, a)); }
  } catch (e) { check('area modules load', () => { throw e; }); continue; }
  check('area module ID and BAKE_DIR agree with the registry', () => { assert.equal(A.ID, a.id); assert.equal(A.BAKE_DIR, a.bake); assert.equal(!!A.REQUIRE_BAKE, !!a.requireBake); });
  check('play rectangles equal the data facade PLAY_RECTS (names and numbers)', () => {
    assert.equal(a.play.length, C.PLAY_RECTS.length);
    a.play.forEach((r, i) => { const f = C.PLAY_RECTS[i]; assert.deepEqual([r.x0, r.x1, r.z0, r.z1], [f.x0, f.x1, f.z0, f.z1], `rect ${i} ${r.name}`); assert.equal(r.name, C.RECT_NAMES[i], `name ${i}`); });
  });
  check('territory: well-formed rectangles, ONE edge-connected piece (no corner-only island), no enclosed hole (no invisible wall inside the area)', () => { const pr = EG.territoryProblems(a.play); assert.equal(pr.length, 0, pr.join('\n       ')); });
  check('every module of the area exists', () => {
    const list = a.id === 'strip' ? mainModules() : A.MODULES; assert(Array.isArray(list) && list.length >= 5, 'module list');
    for (const m of list) assert(fs.existsSync(path.join(root, 'src/world', m + '.js')), 'src/world/' + m + '.js is missing');
    assert.equal(new Set(list).size, list.length, 'duplicate module');
    if (a.id === 'strip') assert(!A.MODULES, 'the strip keeps its module list in src/main.js MODULES');
  });
  check('area TEST (the expectations of layout-test / landmarks-groups-check) has the documented shape', () => {
    if (a.id === 'strip' && !A.TEST) return;      // the strip's expectations are the fallback in tools/lib/area-test-data.mjs
    assert(A.TEST, `src/areas/${a.id}/area.js must export TEST`);
    const pr = testShapeProblems(A.TEST); assert.equal(pr.length, 0, pr.join('; '));
  });
  check(a.parked ? 'page.json help line names every digit view of TEST.viewKeys (the keyboard help follows VIEWS)' : 'page.json help line of a live area: movement keys and R (respawn), no digit key (the place teleports are off, docs/AREAS.md 13.5)', () => {
    const pj = pageJsonFile(root, a.id); if (a.id === 'strip' || !fs.existsSync(pj)) return;
    const help = JSON.parse(fs.readFileSync(pj, 'utf8')).help.walk;
    if (!a.parked) {
      assert(help.includes('<kbd>R</kbd>') && help.includes('<kbd>WASD</kbd>'), `help.walk of src/areas/${a.id}/page.json names no <kbd>WASD</kbd> / <kbd>R</kbd>`);
      assert(!/<kbd>\d<\/kbd>/.test(help), `help.walk of src/areas/${a.id}/page.json names a digit key although the view keys are off (?teleports=1 only)`); return;
    }
    for (const k of A.TEST?.viewKeys || []) { const m = /^Digit(\d)$/.exec(k); if (m) assert(help.includes(`<kbd>${m[1]}</kbd>`), `help.walk of src/areas/${a.id}/page.json has no <kbd>${m[1]}</kbd> for the view ${k}`); }
  });
  check('area tables have the shape the engine reads', () => {
    for (const k of ['NAMES', 'SQUARE', 'OBELISK', 'STATION', 'GROUPS']) assert(A[k] && typeof A[k] === 'object', k);
    for (const k of ['makeAreas', 'makeViews']) assert.equal(typeof A[k], 'function', k);
  });
}
const isDoor = (g) => g.kind === 'door', isEdge = (g) => g.kind === 'edge';
check('gates connect known areas and are unique', () => {
  const ids = new Set(); for (const g of GATES) { assert(REGISTRY[g.from] && REGISTRY[g.to], `gate ${g.id}: unknown area`); assert(!ids.has(g.id), 'duplicate gate ' + g.id); ids.add(g.id); if (!g.dev) assert.notEqual(g.from, g.to, `gate ${g.id}: a real gate leads to ANOTHER area (only a dev gate loops back)`); }
  for (const g of GATES) {
    assert(g.kind === undefined || g.kind === 'door' || g.kind === 'edge', `gate ${g.id}: unknown kind ${g.kind}`);
    if (isDoor(g) || isEdge(g)) continue;      // (a door and an edge gate have no border segment: their own checks follow)
    const len = Math.hypot(g.inward[0], g.inward[1]); assert(Math.abs(len - 1) < 1e-9, `gate ${g.id}: inward is not a unit vector`); assert(g.zone >= 20 && g.zone <= 200, `gate ${g.id}: zone ${g.zone}`); assert(g.arrive.x1 > g.arrive.x0 && g.arrive.z1 > g.arrive.z0, `gate ${g.id}: arrive rect`); if (g.reverse) assert(GATES.some((r) => r.id === g.reverse && r.from === g.to && r.to === g.from), `gate ${g.id}: reverse ${g.reverse} does not lead back`);
  }
});
// a door gate (M7: a ctx.interact item at a door, no border segment): the shape of the row, the door point inside the origin play union, the arrival pose a copy of the destination's VIEWS row
const num = (v) => typeof v === 'number' && Number.isFinite(v);
for (const g of GATES.filter(isDoor)) {
  check(`door ${g.id} (${g.from} -> ${g.to}): the row has at / r / pose / view / prompt and no border fields; the door point lies in the origin play union; reverse is null`, () => {
    assert(num(g.at?.x) && num(g.at?.z), 'at'); assert(num(g.r) && g.r >= 2 && g.r <= 10, 'r ' + g.r);
    for (const k of ['x', 'z', 'yaw', 'pitch']) assert(num(g.pose?.[k]), 'pose.' + k);
    for (const k of ['seg', 'inward', 'zone', 'arrive']) assert(g[k] === undefined, `a door has no ${k}`);
    assert(typeof g.view === 'string' && g.view, 'view'); assert.equal(g.reverse, null, 'reverse');
    for (const k of ['label', 'labelEn', 'title', 'sights', 'scene', 'fine']) assert(typeof g.prompt?.[k] === 'string' && g.prompt[k].length > 3, 'prompt.' + k);
    assert(GG.inUnion(REGISTRY[g.from].play, g.at.x, g.at.z, 0), `the door point (${g.at.x}, ${g.at.z}) is outside the play union of ${g.from}`);
    assert(GG.inUnion(REGISTRY[g.to].play, g.pose.x, g.pose.z, 25), `the arrival pose (${g.pose.x}, ${g.pose.z}) is not 25 m inside the play union of ${g.to}`);
  });
  let v = null, vErr = null;
  try {      // (this process runs as the strip, so the strip's area module is its real file; another area's comes through the registry remap)
    const A = g.to === 'strip' ? await import(pathToFileURL(path.join(root, 'src/world/area.js')).href) : (await (await import('./lib/area-hooks.mjs')).areaModules(root, REGISTRY[g.to])).A;
    const { yawToward } = await import(layoutUrl);
    v = A.makeViews({ yawToward }).VIEWS.find((q) => q.key === g.view) || null;
  } catch (e) { vErr = e; }
  check(`door ${g.id}: the arrival pose is the VIEWS row ${g.view} of ${g.to} (x, z, pitch exact, yaw within 0.01 degrees)`, () => {
    if (vErr) throw vErr; assert(v, `no VIEWS row ${g.view} in ${g.to}`);
    assert.equal(g.pose.x, v.x); assert.equal(g.pose.z, v.z); assert.equal(g.pose.pitch, v.pitch); assert(Math.abs(g.pose.yaw - v.yaw) < 0.01, `yaw ${g.pose.yaw} vs ${v.yaw}`);
  });
}
// an EDGE gate (docs/AREAS.md 14, tools/lib/edge-geometry.mjs): no segment, no arrival rectangle. The shape of the row, the reverse pair, the territories overlap, enough of the boundary of FROM hops to TO (the lens)
for (const g of GATES.filter(isEdge)) {
  const lens = EG.edgeLens(REGISTRY[g.from].play, REGISTRY[g.to].play, { backMax: 300 });
  check(`edge ${g.id} (${g.from} -> ${g.to}): the row has no border fields, the reverse leads back, the territories overlap, the boundary hops (>= 1000 m) and has no dead strip over 300 m`, () => {
    const pr = EG.edgeProblems(g, { fromRects: REGISTRY[g.from].play, toRects: REGISTRY[g.to].play, reverse: GATES.find((r) => r.id === g.reverse) }); assert.equal(pr.length, 0, pr.join('\n       '));
  });
  check(`edge ${g.id}: the bounce-back risk is small (at most 10 percent of the hopping boundary has a point of ${g.to} within 100 m of the landing where the reverse gate would fire)`, () => {
    const near = lens.back.filter((d) => d < 100).length; assert(near <= 0.1 * lens.points.length, `${near * lens.step} of ${lens.works} m`);
  });
  const near = lens.back.filter((d) => d < 100).length, w = lens.strips[0];
  console.log(`       lens ${g.from} -> ${g.to}: boundary ${lens.boundary} m = hops ${lens.works} + dead ${lens.dead} + world edge ${lens.world}; worst dead strip ${w ? `${w.len} m (${w.rect}.${w.side}, near ${w.at})` : 'none'}; landing within 100 m of the reverse trigger: ${near * lens.step} m`);
}
{
  const live = Object.values(REGISTRY).filter((a) => a.status !== 'planned' && !a.parked);
  check(`the live areas (${live.map((a) => a.id).join(', ')}): an edge gate each way for every pair, no gate leads from a live area to a parked one, the station rectangle ST is the same in all`, () => {
    for (const a of live) for (const b of live) if (a !== b) assert(GATES.some((g) => isEdge(g) && g.from === a.id && g.to === b.id), `no edge gate ${a.id} -> ${b.id}`);
    for (const g of GATES) if (!g.dev && live.some((a) => a.id === g.from)) assert(!REGISTRY[g.to].parked, `gate ${g.id} leads from the live ${g.from} to the parked ${g.to}`);
    // the Moscow station complex ST is the same rectangle in every live area that carries it; an area WITHOUT the station (Admiralty-Haymarket, docs/AREAS.md 15.2) has no ST and its territory must not reach the complex
    const st = live.map((a) => a.play.find((r) => r.name === 'ST')).filter(Boolean); assert(st.length >= 1, 'no live area carries the ST rectangle');
    for (const r of st) assert.deepEqual([r.x0, r.x1, r.z0, r.z1], [st[0].x0, st[0].x1, st[0].z0, st[0].z1], 'ST differs between the live areas');
    for (const a of live) if (!a.play.some((r) => r.name === 'ST')) assert(!a.play.some((r) => r.x1 > st[0].x0 && r.x0 < st[0].x1 && r.z1 > st[0].z0 && r.z0 < st[0].z1), `${a.id} has no ST rectangle but its territory reaches the station complex`);
  });
}

// ---------------------------------------------------------------------------------------------- the generated area pages (tools/gen-area-html.mjs)
console.log('area pages (generator fixtures, page.json data, pages on disk):');
const stripHtml = fs.readFileSync(path.join(root, 'strip.html'), 'utf8').replaceAll('\r\n', '\n');
const FIX_ROW = { id: 'fix', page: 'fix.html', approxMB: 20, remap: { 'src/world/data/city.js': 'src/areas/fix/data/city.js', 'src/world/area.js': 'src/areas/fix/area.js' } };
const FIX_PAGE = {
  schema: 1, title: 'Fixture area · Saint Petersburg', appTitle: 'Fix', canvasLabel: 'A fixture area: 3D scene', intro: { kicker: 'Fixture walk', title: 'Fixture title' },
  heavy: { ramGB: 2, ru: 'Heavy scene (ru slot): ~{mb} MB, ~{ram} GB', en: 'Heavy scene (en slot): ~{mb} MB, ~{ram} GB' },
  places: { title: '1-2: the first two fixture places, tooltip of the list' },
  help: { walk: '<kbd>1</kbd> One <kbd>2</kbd> Two', air: '<kbd>W</kbd> Fly where you look' },
  sights: ['one-sight', 'two-sight'],
  facts: Array.from({ length: 9 }, (_, i) => [`Fact number ${i} with 'single' and "double" quotes, a backslash \\ and a dollar $\{x} in it.`, ...(i % 3 === 0 ? ['one-sight'] : [])]),
};
const idsOf = (h) => [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const classesOf = (h) => [...h.matchAll(/\sclass="([^"]+)"/g)].map((m) => m[1]);
const scriptOpeners = (h) => [...h.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
check('generator fixture: a valid page.json validates, a short fact list / a "<" in a fact / an unknown sight do not', () => {
  assert.deepEqual(validatePage(FIX_PAGE), []);
  assert(validatePage({ ...FIX_PAGE, facts: FIX_PAGE.facts.slice(0, 3) }).length);
  assert(validatePage({ ...FIX_PAGE, facts: [...FIX_PAGE.facts, ['A fact that contains <b>markup</b> must be refused by the validator.']] }).length);
  assert(validatePage({ ...FIX_PAGE, facts: [...FIX_PAGE.facts, ['A fact about a sight that is not listed in the sights.', 'nope']] }).length);
  assert(validatePage({ ...FIX_PAGE, help: { ...FIX_PAGE.help, walk: '<b>1</b> not a kbd tag in this help line' } }).length);
});
{
  const out = generatePage(stripHtml, FIX_ROW, FIX_PAGE);
  check('generator fixture: <html data-area>, the import map (remap first, three kept), the texts', () => {
    assert(/<html[^>]*\sdata-area="fix"/.test(out));
    const imports = JSON.parse(/<script type="importmap">\s*([\s\S]*?)\s*<\/script>/.exec(out)[1]).imports;
    assert.deepEqual(Object.keys(imports), ['./src/world/data/city.js', './src/world/area.js', 'three', 'three/addons/']);
    assert.equal(imports['./src/world/area.js'], './src/areas/fix/area.js');
    assert(out.includes('<title>Fixture area · Saint Petersburg</title>') && out.includes('content="Fix"') && out.includes('Fixture walk') && out.includes('Fixture title'));
    assert(!out.includes('Nevsky Prospekt, Saint Petersburg: 3D scene'), 'the strip canvas label is still there');
    assert(out.includes('~20 MB, ~2 GB') && out.includes('~20 MB') && !out.includes('~51 MB'), 'the heavy-scene note takes the registry MB and the page.json RAM');
    assert(!out.includes('\r'));
  });
  check('generator fixture: every id, class and script of strip.html is kept (the engine finds all it needs)', () => {
    assert.deepEqual(idsOf(out), idsOf(stripHtml));
    assert.deepEqual(classesOf(out), classesOf(stripHtml));
    assert.deepEqual(scriptOpeners(out), scriptOpeners(stripHtml));
    assert(out.includes('<script type="module" src="./src/main.js"></script>'));
  });
  check('generator fixture: SIGHTS and FACTS are the page.json data, quoted so that the script parses', () => {
    const sights = new Function('return ' + /const SIGHTS = (\[[^\n]*?\]);/.exec(out)[1])();
    const facts = new Function('return ' + /const FACTS = (\[[\s\S]*?\n {4}\]);/.exec(out)[1])();
    assert.deepEqual(sights, FIX_PAGE.sights); assert.deepEqual(facts, FIX_PAGE.facts);
    const script = [...out.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('const FACTS'));
    new Function(script);      // parses (not run)
  });
  check('generator fixture: no splash pictures -> the splash does not request assets/splash/undefined.jpg', () => {
    const e = generatePage(stripHtml, FIX_ROW, { ...FIX_PAGE, sights: [], facts: FIX_PAGE.facts.map((f) => [f[0]]) });
    assert(e.includes('const SIGHTS = [];') && e.includes('if (sight || SIGHTS.length) document.getElementById'));
    assert(!generatePage(stripHtml, FIX_ROW, FIX_PAGE).includes('if (sight || SIGHTS.length)'));
  });
  check('generator fixture: an anchor that moved in strip.html stops the generator (it never writes a half-replaced page)', () => {
    assert.throws(() => generatePage(stripHtml.replace('<div class="kicker">', '<div class="kicker2">'), FIX_ROW, FIX_PAGE), /anchor "intro kicker"/);
    assert.throws(() => generatePage(stripHtml.replace('<h1 class="title" id="stname">', '<h1 class="title" id="stname2">'), FIX_ROW, FIX_PAGE), /anchor "intro title"/);
  });
}
check('generator CLI on a throw-away root: writes the page, --check passes, a changed or missing page fails it, strip / unknown areas and a planned row without --force-planned are refused', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-area-'));
  try {
    fs.copyFileSync(path.join(root, 'strip.html'), path.join(tmp, 'strip.html'));
    for (const r of Object.values(REGISTRY)) if (r.id !== 'strip' && r.status !== 'planned' && fs.existsSync(pageJsonFile(root, r.id))) { fs.mkdirSync(path.dirname(pageJsonFile(tmp, r.id)), { recursive: true }); fs.copyFileSync(pageJsonFile(root, r.id), pageJsonFile(tmp, r.id)); }      // every real area: `no --area` generates them all
    fs.cpSync(path.join(root, 'assets/splash'), path.join(tmp, 'assets/splash'), { recursive: true });      // (the validator wants a splash picture per sight)
    const real = path.join(root, 'tools/gen-area-html.mjs');
    const run = (tool, ...a) => spawnSync(process.execPath, [tool, '--root', tmp, ...a], { encoding: 'utf8' });
    // the north row is a real area since M3: a copy of the tool whose registry still marks it `planned` exercises the --force-planned branch
    const ptool = path.join(tmp, 'ptool'); fs.mkdirSync(path.join(ptool, 'tools'), { recursive: true }); fs.mkdirSync(path.join(ptool, 'src/areas'), { recursive: true });
    fs.copyFileSync(real, path.join(ptool, 'tools/gen-area-html.mjs'));
    const reg = fs.readFileSync(path.join(root, 'src/areas/registry.js'), 'utf8'), planned = reg.replace("bake: 'baked/north/', requireBake: true,", "bake: 'baked/north/', requireBake: true, status: 'planned',");
    assert.notEqual(planned, reg, 'the north row of the registry changed shape: update this fixture'); fs.writeFileSync(path.join(ptool, 'src/areas/registry.js'), planned);
    const pl = path.join(ptool, 'tools/gen-area-html.mjs');
    assert.equal(run(pl, '--area', 'north').status, 2, 'a planned area needs --force-planned');
    assert.equal(run(pl, '--area', 'north', '--force-planned', '--check').status, 1, '--check without a page must fail');
    assert.equal(run(pl, '--area', 'north', '--force-planned').status, 0);
    fs.rmSync(path.join(tmp, 'north.html'));
    assert.equal(run(real, '--area', 'strip').status, 2, 'the strip page is strip.html (the template of every generated page)');
    assert.equal(run(real, '--area', 'nope').status, 2);
    assert.equal(run(real, '--area', 'north', '--check').status, 1, '--check without a page must fail');
    assert.equal(run(real, '--area', 'north').status, 0, 'a real area needs no --force-planned');
    assert(fs.existsSync(path.join(tmp, 'north.html')));
    assert.equal(run(real, '--area', 'north', '--check').status, 0);
    assert.equal(run(real).status, 0, 'no --area: every real area except the strip');
    for (const r of Object.values(REGISTRY)) if (r.id !== 'strip' && r.status !== 'planned') assert(fs.existsSync(path.join(tmp, r.page)), `${r.page} (area ${r.id}) was not generated`);      // index.html is the page of palace
    fs.appendFileSync(path.join(tmp, 'north.html'), '<!-- hand edit -->\n');
    const stale = run(real, '--area', 'north', '--check');
    assert.equal(stale.status, 1); assert(/STALE/.test(stale.stdout), stale.stdout);
    fs.writeFileSync(path.join(tmp, 'north.html'), fs.readFileSync(path.join(tmp, 'north.html'), 'utf8').replace(/<!-- hand edit -->\n/, '').replaceAll('\n', '\r\n'));
    assert.equal(run(real, '--area', 'north', '--check').status, 0, 'CRLF checkouts (Windows autocrlf) compare equal');
    assert.equal(fs.readFileSync(path.join(root, 'strip.html'), 'utf8').replaceAll('\r\n', '\n'), stripHtml, 'strip.html is never touched');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
for (const row of Object.values(REGISTRY)) {
  if (row.id === 'strip' || (only && row.id !== only)) continue;
  const pj = pageJsonFile(root, row.id), pageFile = path.join(root, row.page);
  if (row.status !== 'planned') check(`area ${row.id}: src/areas/${row.id}/page.json and ${row.page} exist`, () => { assert(fs.existsSync(pj), 'page.json missing'); assert(fs.existsSync(pageFile), row.page + ' missing: node tools/gen-area-html.mjs --area ' + row.id); });
  if (!fs.existsSync(pj)) continue;
  check(`area ${row.id}: page.json is valid (every sight has a splash picture, true to the schema of tools/gen-area-html.mjs)`, () => {
    const pr = validatePage(JSON.parse(fs.readFileSync(pj, 'utf8')), { id: row.id, splashDir: path.join(root, 'assets/splash') }); assert.equal(pr.length, 0, pr.join('\n       '));
  });
  if (fs.existsSync(pageFile)) check(`area ${row.id}: ${row.page} on disk equals the generated page`, () => {
    assert.equal(fs.readFileSync(pageFile, 'utf8').replaceAll('\r\n', '\n'), generateFor(root, row), `${row.page} is stale: node tools/gen-area-html.mjs --area ${row.id}${row.status === 'planned' ? ' --force-planned' : ''}`);
  });
}
check('page selection of the browser tools (--area / --page): the strip (strip.html) by default, index.html is the palace page, a registered page, conflicts and strangers refused', () => {
  assert.equal(resolveArea({}, root).page, 'strip.html'); assert.equal(resolveArea({}, root).id, 'strip');
  assert.equal(resolveArea({ page: 'strip.html' }, root).id, 'strip');
  assert.equal(resolveArea({ page: 'index.html' }, root).id, 'palace'); assert.equal(resolveArea({ area: 'palace' }, root).page, 'index.html');
  assert.equal(resolveArea({ area: 'smolny' }, root).page, 'smolny.html'); assert.equal(resolveArea({ page: 'smolny.html' }, root).id, 'smolny');
  assert.throws(() => resolveArea({ area: 'smolny', page: 'index.html' }, root), /belongs to area "palace"/);
  assert.equal(resolveArea({ area: '1', page: '1' }, root).id, 'strip');      // a flag without a value is absent
  if (fs.existsSync(path.join(root, REGISTRY.north.page))) { const r = resolveArea({ area: 'north' }, root); assert.equal(r.page, 'north.html'); assert.equal(resolveArea({ page: 'north.html' }, root).id, 'north'); assert.throws(() => resolveArea({ area: 'north', page: 'index.html' }, root), /belongs to area/); }
  assert.throws(() => resolveArea({ area: 'nope' }, root), /unknown area/);
  assert.throws(() => resolveArea({ page: '../index.html' }, root), /site root/);
  assert.throws(() => resolveArea({ page: 'missing.html' }, root), /does not exist/);
});
check('TEST contract fixtures (what layout-test / landmarks-groups-check read from an area module): the strip fallback validates, tuples and bare ids normalise, broken objects are refused', () => {
  const fakeL = { OBELISK: { x: 1, z: 2 }, STATION: { x: 3, z: 4 }, SQUARE: { x: 5, z: 6 }, GROUPS: { landmarksA: [], landmarksB: [] } };
  assert.deepEqual(testShapeProblems(stripTest(fakeL)), []);
  const good = { claimed: ['r1', { id: 'r2', by: 'm', group: 'g' }], viewKeys: ['Digit1', 'Place.x'], mustHaveAreas: [[1, 2, 'abc'], { x: 3, z: 4, has: 'd' }] };
  assert.deepEqual(testShapeProblems(good), []);
  const r = resolveTest({ ID: 'fix', TEST: good }, fakeL);
  assert.deepEqual(r.claimed, [{ id: 'r1' }, { id: 'r2', by: 'm', group: 'g' }]); assert.deepEqual(r.mustHaveAreas[0], { x: 1, z: 2, has: 'abc' }); assert.deepEqual(r.kept, ['landmarksA', 'landmarksB']);
  assert.deepEqual(resolveTest({ ID: 'fix', TEST: { ...good, kept: ['k'] } }, fakeL).kept, ['k']); assert.deepEqual(resolveTest({ ID: 'fix', KEPT: ['kk'], TEST: good }, fakeL).kept, ['kk']);
  assert(testShapeProblems({ ...good, viewKeys: [] }).length && testShapeProblems({ ...good, viewKeys: ['a', 'a'] }).length && testShapeProblems({ ...good, claimed: [5] }).length && testShapeProblems({ ...good, mustHaveAreas: [[1, 2]] }).length);
  assert(testShapeProblems({ ...good, nearestRoad: { at: [1], names: [] } }).length && testShapeProblems({ ...good, roadsNear: { at: [1, 2], r: 0, min: 1 } }).length && testShapeProblems({ ...good, riverBed: [] }).length);
  assert.throws(() => resolveTest({ ID: 'fix' }, fakeL), /exports no TEST/); assert.throws(() => resolveTest({ ID: 'fix', TEST: { claimed: [] } }, fakeL), /malformed/);
});

// ---------------------------------------------------------------------------------------------- the texts of the boot guard follow the page (M7 polish, docs/AREAS.md 11.1)
console.log('boot-guard texts per area (the size, the card title and the way back follow the page; the strip keeps its text):');
{
  const BG = await import(pathToFileURL(path.join(root, 'src/core/boot-guard.js')).href), GT = await import(pathToFileURL(path.join(root, 'src/core/gates.js')).href);
  const unesc = (s) => s.replaceAll('&quot;', '"').replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
  /** the part of the DOM that pageSizes reads, over the text of a page: every <span class="tk" ...>...</span> */
  const docOf = (html) => ({ querySelectorAll: () => [...html.matchAll(/<span class="tk"([^>]*)>([^<]*)<\/span>/g)].map((m) => ({ textContent: unesc(m[2]), getAttribute: (k) => { const a = new RegExp(`\\s${k}="([^"]*)"`).exec(m[1]); return a ? unesc(a[1]) : null; } })) });
  const STRIP_TITLE = 'Прогулка по Невскому · Before you start';
  check('the strip: strip.html carries no data-card-title, pageSizes gives 51 MB / 1 GB and the strip\'s card title byte for byte, equal to the registry row', () => {
    assert(!/data-card-title/.test(stripHtml), 'strip.html must stay as it was'); const s = BG.pageSizes(docOf(stripHtml));
    assert.deepEqual(s, { mb: 51, gb: 1, title: STRIP_TITLE }); assert.equal(BG.STRIP_CARD_TITLE, STRIP_TITLE); assert.equal(REGISTRY.strip.approxMB, s.mb, 'registry strip approxMB vs the page note');
    assert.deepEqual(BG.pageSizes({ querySelectorAll: () => [] }), s, 'a page without a note falls back to the strip numbers and text');
  });
  for (const row of Object.values(REGISTRY)) {
    if (row.id === 'strip' || row.status === 'planned' || (only && row.id !== only)) continue;
    check(`area ${row.id}: ${row.page} says the registry's ${row.approxMB} MB and its own card title (the intro kicker up to the colon, not the strip's)`, () => {
      const html = fs.readFileSync(path.join(root, row.page), 'utf8').replaceAll('\r\n', '\n'), page = JSON.parse(fs.readFileSync(pageJsonFile(root, row.id), 'utf8')), s = BG.pageSizes(docOf(html));
      assert.equal(s.mb, row.approxMB); assert.equal(s.gb, page.heavy.ramGB); assert.equal(s.title, `${page.intro.kicker.split(':')[0].trim()} · Before you start`); assert.notEqual(s.title, STRIP_TITLE);
    });
  }
  check('every door gate that names a size says the registry\'s MB of its destination (Russian and English)', () => {
    for (const g of GATES.filter((q) => q.kind === 'door' && q.prompt)) {
      const mb = REGISTRY[g.to].approxMB, ru = /около\s+(\d+)\s+МБ/.exec(g.prompt.scene), en = /about\s+(\d+)\s+MB/.exec(g.prompt.scene);
      assert(ru && en, `${g.id}: the scene line names no size`); assert.equal(Number(ru[1]), mb, `${g.id} Russian`); assert.equal(Number(en[1]), mb, `${g.id} English`);
    }
    for (const a of Object.values(REGISTRY)) if (a.status !== 'planned') assert(GT.promptTexts(a.id).scene.includes(`${a.approxMB} МБ`) && GT.promptTexts(a.id).scene.includes(`${a.approxMB} MB`), a.id);
  });
  check('generator fixture: the heavy note carries data-card-title (the kicker up to the colon + the English half); a kicker without a colon is taken whole; the markup stays valid for pageSizes', () => {
    const FP = { ...FIX_PAGE, heavy: { ramGB: 2, ru: 'Тяжёлая сцена: ~{mb} МБ и ~{ram} ГБ памяти', en: 'Heavy scene: ~{mb} MB and ~{ram} GB' } };      // (the Russian note is what pageSizes reads)
    const out = generatePage(stripHtml, FIX_ROW, { ...FP, intro: { kicker: 'Fixture walk: a place and "another" one', title: 'T' } });
    assert(out.includes('<span class="tk" data-card-title="Fixture walk · Before you start">'), 'attribute'); assert.deepEqual(BG.pageSizes(docOf(out)), { mb: 20, gb: 2, title: 'Fixture walk · Before you start' });
    const whole = generatePage(stripHtml, FIX_ROW, { ...FP, intro: { kicker: 'Quote " & <b> kicker', title: 'T' } }); assert.equal(BG.pageSizes(docOf(whole)).title, 'Quote " & <b> kicker · Before you start', 'escaped in the attribute, read back whole');
    assert.equal(whole.split('data-card-title').length, 2, 'once');
  });
  // a small DOM for the card (ids searched through the tree; .after / .append / .remove / listeners)
  const mkDom = ({ withIntro = false } = {}) => {
    const mk = (tag) => { const e = { tag, children: [], parent: null, className: '', textContent: '', _id: '', style: {}, listeners: {}, attrs: {},
      get id() { return this._id; }, set id(v) { this._id = v; },
      append(...k) { for (const c of k) { c.parent = this; this.children.push(c); } }, appendChild(c) { this.append(c); return c; }, replaceChildren() { this.children = []; },
      after(n) { const i = this.parent.children.indexOf(this); n.parent = this.parent; this.parent.children.splice(i + 1, 0, n); }, remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); },
      setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
      querySelector(sel) { return find(this, sel); } }; return e; };
    const find = (root, sel) => { let hit = null; const cls = sel.startsWith('.') ? sel.slice(1) : null; (function walk(n) { if (hit) return; for (const c of n.children) { if (cls ? c.className.split(' ').includes(cls) : false) { hit = c; return; } walk(c); } })(root); return hit; };
    const body = mk('body'); body.classList = { contains: () => false }; const head = mk('head');
    const byId = (n, id) => { for (const c of n.children) { if (c._id === id) return c; const r = byId(c, id); if (r) return r; } return null; };
    const doc = { body, head, createElement: mk, getElementById: (id) => byId(body, id), querySelectorAll: () => [], querySelector(sel) { return sel === '#intro .card' ? (doc._card || null) : null; } };
    if (withIntro) { const intro = mk('div'); intro.id = 'intro'; const card = mk('div'); card.className = 'card'; const row = mk('div'); row.className = 'row'; card.append(row); intro.append(card); body.append(intro); doc._card = card; }
    return doc;
  };
  const mkWin = (replaced) => ({ addEventListener() {}, location: { origin: 'http://h', href: 'http://h/x.html', replace: (u) => replaced.push(u), reload() {} }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, localStorage: { getItem: () => null, setItem() {} }, screen: { width: 400, height: 800 }, navigator: {}, dispatchEvent() {}, CustomEvent: class {} });
  const phoneCardTitle = (html) => {
    const doc = mkDom(); doc.querySelectorAll = docOf(html).querySelectorAll; const g = BG.installBootGuard({ canvas: null, params: new URLSearchParams('guard=0'), isTouch: true, qName: 'performance', win: mkWin([]), doc }); g.gate();
    const card = doc.getElementById('fatal'); const h2 = card && card.children[0].children[0]; return { title: h2 && h2.textContent, paragraph: card && card.children[0].children[1].textContent };
  };
  check('the phone\'s pre-start card: the strip shows its own title and 51 MB (as before), the North its own title and 36 MB', () => {
    const s = phoneCardTitle(stripHtml); assert.equal(s.title, STRIP_TITLE); assert(s.paragraph.includes('около 51 МБ'), s.paragraph);
    const html = fs.readFileSync(path.join(root, 'north.html'), 'utf8').replaceAll('\r\n', '\n'), n = phoneCardTitle(html);
    assert.equal(n.title, 'Прогулка по северу города · Before you start'); assert(n.paragraph.includes('около 36 МБ'), n.paragraph);
  });
  check('backLink: the origin page at the pose he left from, the quality tier kept; no origin, an unknown origin ("constructor") or no return pose gives none', () => {
    const ret = { x: 458, z: -1350, yaw: -90, pitch: 0 }, b = GT.backLink({ from: 'north', ret }, { qName: 'performance', base: 'http://h/index.html?x=1' });
    assert.equal(b.url, 'http://h/north.html?cam=458%2C-1350%2C-90%2C0&q=performance'); assert.equal(b.text, `Вернуться: ${REGISTRY.north.title} · Back to ${REGISTRY.north.titleEn}`);
    assert.equal(GT.backLink({ from: 'constructor', ret }), null); assert.equal(GT.backLink({ from: 'north', ret: null }), null); assert.equal(GT.backLink(null), null); assert.equal(GT.backLink({ from: 5, ret }), null);
  });
  check('arrivalLink: the arrival card gets ONE link «Вернуться: … · Back to …» under the Continue row to guard.back.url; a click replaces the page; nothing without a back, a card or on a second call', () => {
    const replaced = [], doc = mkDom({ withIntro: true }), g = BG.installBootGuard({ canvas: null, params: new URLSearchParams('guard=0'), isTouch: false, qName: 'performance', win: mkWin(replaced), doc });
    assert.equal(g.arrivalLink(), null, 'no guard.back yet'); g.back = GT.backLink({ from: 'north', ret: { x: 458, z: -1350, yaw: -90, pitch: 0 } }, { qName: 'performance', base: 'http://h/index.html' });
    const a = g.arrivalLink(); assert(a && a.id === 'backlink'); assert.equal(a.href, g.back.url); assert.equal(a.textContent, 'Вернуться: Север · Back to North');
    const kids = doc._card.children; assert.equal(kids[0].className, 'row'); assert.equal(kids[1], a, 'right after the row'); assert.equal(g.arrivalLink(), null, 'a second call adds nothing');
    let prevented = false; a.listeners.click[0]({ preventDefault() { prevented = true; } }); assert(prevented); assert.deepEqual(replaced, [g.back.url]);
    const bare = BG.installBootGuard({ canvas: null, params: new URLSearchParams('guard=0'), win: mkWin([]), doc: mkDom() }); bare.back = g.back; assert.equal(bare.arrivalLink(), null, 'a page without the intro card');
  });
}

// ---------------------------------------------------------------------------------------------- gate geometry (tools/lib/gate-geometry.mjs)
console.log('gate geometry fixtures (the checks must pass a good synthetic gate pair and catch every way a gate can be wrong):');
const R = (x0, x1, z0, z1) => ({ x0, x1, z0, z1 });
const FA = [R(0, 1000, 0, 1000)], FB = [R(0, 1000, -1000, 0)];      // area A lies south of area B; they share the border z = 0
const fa = { id: 'fa', from: 'A', to: 'B', seg: [[100, 0], [900, 0]], inward: [0, 1], zone: 30, arrive: R(150, 850, -300, -100), reverse: 'fb' };
const fb = { id: 'fb', from: 'B', to: 'A', seg: [[100, 0], [900, 0]], inward: [0, -1], zone: 30, arrive: R(150, 850, 100, 300), reverse: 'fa' };
const probsOf = (g, rev = g.from === 'A' ? fb : fa) => GG.gateProblems(g, { fromRects: g.from === 'A' ? FA : FB, toRects: g.from === 'A' ? FB : FA, reverse: rev });
const fixtureFails = (name, g, rev, re) => check(`fixture: ${name} is caught`, () => { const p = probsOf(g, rev).join('\n'); assert(re.test(p), p || '(no problem reported)'); });
check('fixture: a good gate pair has no problem on either side (0.5 m inward inside, 0.5 m outward outside, depth `zone` inside, arrival 25 m inside, reverse clear)', () => { assert.deepEqual(probsOf(fa), []); assert.deepEqual(probsOf(fb), []); });
check('fixture: GG.inUnion honours the inset against the boundary of the UNION, not of one rectangle', () => {
  const two = [R(0, 100, 0, 100), R(100, 200, 0, 100)];      // two rectangles sharing x = 100: (100, 50) is 50 m inside the union, 0 m inside either rectangle
  assert(GG.inUnion(two, 100, 50, 25)); assert(!GG.inUnion(two, 10, 50, 25)); assert(!GG.inUnion(two, 250, 50)); assert(GG.inUnion(two, 150, 50, 25));
});
fixtureFails('a segment 5 m inside the area (not on its border)', { ...fa, seg: [[100, 5], [900, 5]] }, fb, /must lie on the border/);
fixtureFails('a segment beside the area (outside it)', { ...fa, seg: [[1100, 0], [1300, 0]] }, fb, /must lie on the border/);
fixtureFails('an inward vector that points out of the area', { ...fa, inward: [0, -1] }, fb, /must lie on the border/);
fixtureFails('an inward vector that is not a unit vector', { ...fa, inward: [0, 2] }, fb, /unit vector/);
fixtureFails('an inward vector that is not normal to the segment', { ...fa, inward: [0.6, 0.8] }, fb, /perpendicular/);
fixtureFails('a zone deeper than the area', { ...fa, zone: 1200 }, fb, /depth 1200/);
fixtureFails('an arrival rectangle outside the destination', { ...fa, arrive: R(150, 850, 100, 300) }, fb, /not 25 m inside the destination/);
fixtureFails('an arrival rectangle closer than 25 m to the destination border', { ...fa, arrive: R(150, 850, -300, -10) }, fb, /not 25 m inside the destination/);
fixtureFails('a reverse gate that does not lead back', fa, { ...fb, to: 'B' }, /does not lead back/);
fixtureFails('a reverse gate that does not name this gate', fa, { ...fb, reverse: 'zz' }, /names zz/);
fixtureFails('a missing reverse gate', fa, null, /does not exist/);
fixtureFails('an arrival grid inside the reverse gate zone + 50 m', { ...fa, arrive: R(150, 850, -120, -30) }, fb, /reverse gate fb/);
check('fixture: an arrival grid inside the reverse zone depth but outside its lateral range is fine', () => assert.deepEqual(probsOf({ ...fa, arrive: R(920, 970, -120, -30) }), []));
{
  const fake = (rects, { river = [], buildings = [], hero = { x: 500, z: -500, yaw: 0, pitch: 0 } } = {}) => {
    const hit = (list, x, z, m = 0) => list.some((r) => GG.inRect(r, x, z, -m)), road = (t) => { const f = ((t % 50) + 50) % 50; return Math.min(f, 50 - f) <= 4; };
    return {
      HERO: hero, inPlay: (x, z, m = 0) => GG.inUnion(rects, x, z, m), insideBuilding: (x, z, m = 0) => hit(buildings, x, z, m), inRiver: (x, z) => hit(river, x, z),
      roadsNear: (x, z) => [...(road(z) ? [{ gap: 0, tx: 1, tz: 0 }] : []), ...(road(x) ? [{ gap: 0, tx: 0, tz: 1 }] : [])],      // a 50 m grid of 8 m wide streets
    };
  };
  const good = GG.arrivalGrid(fa, fake(FB, { buildings: [R(300, 340, -250, -210), R(600, 700, -180, -120)], river: [R(0, 120, -1000, -900)] }));
  check(`fixture: the arrival grid (${good.total} resolutions) is 100 % valid, walk / fly / car, both headings, and the buildings really exercise the ring search`, () => {
    assert.equal(good.total, GG.gridPoints(fa.arrive).length * 6); assert.equal(good.badCount, 0, good.bad.join('\n')); assert.equal(good.hero, 0); assert(good.ring > 0 && good.direct > 0, JSON.stringify(good));
  });
  const bad = GG.arrivalGrid(fa, fake(FB, { river: [R(0, 1000, -400, -90)] }));
  check('fixture: an arrival rectangle in the river is VALID (the world rule: water is walkable, the probe does not block it; docs/AREAS.md 13.7)', () => { assert.equal(bad.badCount, 0, bad.bad[0]); assert.equal(bad.hero, 0); });
  const noRoad = GG.arrivalGrid(fa, { ...fake(FB), roadsNear: () => [] });
  check('fixture: a car arrival needs a drivable lane (an area without roads fails the car grid, not the walk grid)', () => { assert(noRoad.badCount > 0 && noRoad.badCount <= noRoad.total / 3 + 1, JSON.stringify([noRoad.badCount, noRoad.total])); assert(/car/.test(noRoad.bad[0])); });
}

// ---------------------------------------------------------------------------------------------- edge gates and territories (tools/lib/edge-geometry.mjs)
console.log('edge gate and territory fixtures (the checks must pass a good pair of territories and catch every way an edge gate or a territory can be wrong):');
{
  const TA = [R(0, 1000, 0, 1000)], TB = [R(500, 1500, 0, 1000)];      // they overlap by 500 m (x 500 .. 1000); A's east edge hops to B
  const ea = { id: 'ea', kind: 'edge', from: 'A', to: 'B', zone: 40, reverse: 'eb' }, eb = { id: 'eb', kind: 'edge', from: 'B', to: 'A', zone: 40, reverse: 'ea' };
  const ep = (g, rev, F = TA, T = TB, o = { worksMin: 500 }) => EG.edgeProblems(g, { fromRects: F, toRects: T, reverse: rev }, o);
  const edgeFails = (name, p, re) => check(`fixture: ${name} is caught`, () => { const t = p.join('\n'); assert(re.test(t), t || '(no problem reported)'); });
  check('fixture: a good edge pair (500 m overlap) has no problem on either side; the lens: the east edge hops from z 50 to 950 (about 900 m), the rest is world edge or a short dead run, the bounce-back landing is 100+ m from the reverse trigger', () => {
    assert.deepEqual(ep(ea, eb), []); assert.deepEqual(ep(eb, ea, TB, TA), []);
    const L = EG.edgeLens(TA, TB); assert(L.works >= 880 && L.works <= 960, L.works); assert.equal(L.boundary, L.works + L.dead + L.world); assert(L.world >= 2000 && L.strips.length >= 1 && L.strips[0].len <= 300, JSON.stringify([L.world, L.strips[0]]));
    assert(L.back.every((d) => d >= 100), L.back.join());
  });
  check('fixture: edgeDirAt follows the game rule (60 m inside the destination, outside the origin: the east probe works at (990, 500), nothing at (10, 500) or (990, 30))', () => {
    assert(EG.edgeDirAt(TA, TB, 990, 500) >= 0); assert.equal(EG.edgeDirAt(TA, TB, 10, 500), -1); assert.equal(EG.edgeDirAt(TA, TB, 990, 30), -1);
    assert.equal(EG.edgeDirAt(TA, TB, 990, 500, { edgeIn: 600 }), -1, 'a deeper margin than the destination offers');
  });
  edgeFails('a missing reverse gate', ep(ea, null), /does not exist/);
  edgeFails('a reverse gate that does not lead back', ep(ea, { ...eb, to: 'B' }), /does not lead back/);
  edgeFails('a reverse gate that names another gate', ep(ea, { ...eb, reverse: 'zz' }), /names zz/);
  edgeFails('a reverse gate that is a border gate', ep(ea, { ...eb, kind: undefined }), /not an edge gate/);
  edgeFails('an edge gate without a reverse', ep({ ...ea, reverse: null }, null), /needs its reverse/);
  edgeFails('border fields on an edge row', ep({ ...ea, seg: [[0, 0], [1, 1]], arrive: R(0, 1, 0, 1) }, eb), /no seg[\s\S]*no arrive/);
  edgeFails('a zone of 5 m', ep({ ...ea, zone: 5 }, eb), /zone 5/);
  edgeFails('territories that do not overlap', ep(ea, eb, TA, [R(2000, 3000, 0, 1000)]), /do not overlap/);
  edgeFails('an overlap too thin for the 60 m rule (the destination ends 50 m past the border: no probe lands 60 m inside)', ep(ea, eb, TA, [R(900, 1050, 0, 1000)]), /only 0 m of the boundary/);
  edgeFails('a dead strip over the limit (ground of the destination behind a wall that does not hop)', ep(ea, eb, TA, TB, { worksMin: 500, deadMax: 100 }), /dead boundary strip of \d+ m/);
  edgeFails('an empty territory', ep(ea, eb, [], TB), /territory is empty/);
  const T0 = (rs) => EG.territoryProblems(rs);
  check('fixture: territoryProblems accepts a plain union (two rectangles sharing an edge) and catches a hole, a corner-only island, a separate piece and an inverted rectangle', () => {
    assert.deepEqual(T0([R(0, 100, 0, 100), R(100, 200, 0, 100)]), []);
    const ring = [R(0, 100, 0, 100), R(100, 200, 0, 100), R(200, 300, 0, 100), R(0, 100, 100, 200), R(200, 300, 100, 200), R(0, 100, 200, 300), R(100, 200, 200, 300), R(200, 300, 200, 300)];
    assert(/hole in the territory \(x 100\.\.200, z 100\.\.200, 10000 m2\)/.test(T0(ring).join()), T0(ring).join());
    assert(/joined only at a corner/.test(T0([R(0, 100, 0, 100), R(100, 200, 100, 200)]).join()));
    assert(/joined only at a corner or not at all \(x 500\.\.600/.test(T0([R(0, 100, 0, 100), R(500, 600, 0, 100)]).join()));
    assert(/empty or inverted/.test(T0([R(0, 100, 0, 100), R(50, 20, 0, 10)]).join()));
  });
  {
    const stub = (o = {}) => ({ HERO: { x: 0, z: 0, yaw: 0, pitch: 0 }, inPlay: () => true, insideBuilding: () => false, inRiver: () => false, roadsNear: () => [{ gap: 0, tx: 1, tz: 0 }], ...o });
    const pts = [{ x: 100, z: 100, k: 2 }, { x: 200, z: 100, k: 3 }];
    check('fixture: the edge arrival is direct on dry ground for walk / fly / car (a car along its lane, both senses), and water is no wall (the probe does not block it: wet resolutions are all direct)', () => {
      const ok = EG.edgeArrival(pts, stub()); assert.equal(ok.total, 2 * 4); assert.equal(ok.direct, 8); assert.equal(ok.badCount, 0); assert.deepEqual(ok.wet, { total: 0, bad: 0 });
      const wet = EG.edgeArrival(pts, stub({ inRiver: () => true })); assert.equal(wet.wet.total, 8); assert.equal(wet.wet.bad, 0); assert.equal(wet.hero, 0);
      const noRoad = EG.edgeArrival(pts, stub({ roadsNear: () => [] })); assert.equal(noRoad.total, 4, 'a car is not tried where there is no lane'); assert.equal(noRoad.badCount, 0);
      const bld = EG.edgeArrival(pts, stub({ insideBuilding: () => true })); assert(bld.badCount === bld.total && /building|HERO/.test(bld.bad[0]), bld.bad[0]);
    });
  }
}

// ---------------------------------------------------------------------------------------------- band landmark parity (tools/band-parity.mjs landmarkBandProblems, tools/lib/claims-dump.mjs)
console.log('band landmark parity fixtures (a landmark of the strip in the band must be built by a module of the other area):');
{
  const BAND = [R(-420, 835, -405, -205)];
  const row = (id, module, group, cx, cz, o = {}) => ({ id, module, group, via: 'id', present: true, cx, cz, inModules: true, owns: true, owned: true, ...o });
  const SRC_ROWS = [
    row('wLib', 'landmarksD', 'library', -334, -311), row('wPod', 'landmarksNorth', 'north-podpisnye', -204, -267),
    row('wC1', 'landmarksNorth', 'north-corridor-houses', 183, -356), row('wC2', 'landmarksNorth', 'north-corridor-houses', 537, -283),
    row('wHall', 'landmarksOktyabrsky', 'oktyabrsky-hall', 798, -347), row('wHallPart', 'landmarksOktyabrsky', 'oktyabrsky-hall', 803, -344, { via: 'parent', parent: 'wHall' }),
    row('wFar', 'landmarksNorth', 'north-corridor-houses', 142, -54),            // outside the band (31 m south of it): not required in the other area
    row('wKaz', 'landmarksF', 'kazan-cathedral', -1568, -186),                   // far outside
    row('wBlock', 'landmarksX', 'unowned-group', 0, -300, { owned: false, owns: false }),      // claimed in the strip but not built by a module there (the generic city draws it): not required
  ];
  const IDS = ['wLib', 'wPod', 'wC1', 'wC2', 'wHall', 'wHallPart'];
  const SRC = { area: 'strip', modules: ['landmarksD', 'landmarksNorth', 'landmarksOktyabrsky'], rows: SRC_ROWS };
  // a good destination: the same ids and sub-group keys, the North's own module name for the corridor (landmarksNorthFull), the concert hall part through its parent
  const DST_ROWS = [
    row('wLib', 'landmarksD', 'library', -334, -311), row('wPod', 'landmarksNorthFull', 'north-podpisnye', -204, -267),
    row('wC1', 'landmarksNorthFull', 'north-corridor-houses', 183, -356), row('wC2', 'landmarksNorthFull', 'north-corridor-houses', 537, -283),
    row('wHall', 'landmarksOktyabrsky', 'oktyabrsky-hall', 798, -347), row('wHallPart', 'landmarksOktyabrsky', 'oktyabrsky-hall', 803, -344, { via: 'parent', parent: 'wHall' }),
  ];
  const dst = (rows) => ({ area: 'north', modules: ['landmarksNorthFull', 'landmarksD', 'landmarksOktyabrsky'], rows });
  const run = (rows, extra = {}) => landmarkBandProblems({ source: SRC, dest: dst(rows), band: BAND, expect: IDS, ...extra });
  const landmarkFails = (name, rows, re, extra) => check(`fixture: ${name} is caught`, () => { const p = run(rows, extra).join('\n'); assert(re.test(p), p || '(no problem reported)'); });
  check('fixture: a good destination (same ids and sub-group keys, a different module name for the corridor, an id outside the band missing, a source claim nobody builds ignored) has no problem', () => assert.deepEqual(run(DST_ROWS), []));
  landmarkFails('a claim of the band that the destination does not list (wC2 missing from a sub-group that has its other id)', DST_ROWS.filter((r) => r.id !== 'wC2'), /wC2 \(strip landmarksNorth \/ north-corridor-houses, inside the band\) is claimed by no sub-group of north: the module that should own it is landmarksNorthFull \(the north copy of landmarksNorth\)/);
  check('fixture: ... and it names only the missing id, not the ones the destination has', () => assert(!/wC1/.test(run(DST_ROWS.filter((r) => r.id !== 'wC2')).join('\n'))));
  landmarkFails('a whole sub-group claimed by no one in the destination (the corridor houses and Podpisnye)', DST_ROWS.filter((r) => !/^north-/.test(r.group)), /wPod[\s\S]*claimed by no sub-group[\s\S]*landmarksNorthFull[\s\S]*wC1, wC2[\s\S]*claimed by no sub-group/);
  landmarkFails('the owner module is not in the MODULES of the destination', DST_ROWS.map((r) => (r.module === 'landmarksNorthFull' ? { ...r, inModules: false, owned: false } : r)), /wPod \(landmarksNorthFull\)[\s\S]*wC1 \(landmarksNorthFull\), wC2 \(landmarksNorthFull\)[\s\S]*not in the MODULES of src\/areas\/north\/area\.js[\s\S]*should be landmarksNorthFull/);
  landmarkFails('the module is in the list but does not own the sub-group', DST_ROWS.map((r) => (r.id === 'wHall' ? { ...r, owns: false, owned: false } : r)), /wHall \(landmarksOktyabrsky\)[\s\S]*does not own the sub-group "oktyabrsky-hall"/);
  landmarkFails('the same id under another sub-group key', DST_ROWS.map((r) => (r.id === 'wLib' ? { ...r, group: 'national-library' } : r)), /wLib \(north: sub-group "national-library" of landmarksD\)[\s\S]*another sub-group key than "library"/);
  landmarkFails('a part that the destination does not resolve through its parent', DST_ROWS.filter((r) => r.id !== 'wHallPart'), /wHallPart \(strip landmarksOktyabrsky \/ oktyabrsky-hall, inside the band\) is claimed by no sub-group/);
  landmarkFails('a claimed id without a record in the data of the destination', DST_ROWS.map((r) => (r.id === 'wPod' ? { ...r, present: false } : r)), /wPod \(landmarksNorthFull\)[\s\S]*no record with that id in its data facade/);
  landmarkFails('another id in the same sub-group does not stand in for the missing one (the SOURCE claim decides, id by id)', DST_ROWS.filter((r) => r.id !== 'wLib').concat([row('wLib2', 'landmarksD', 'library', -334, -311)]), /wLib \(strip landmarksD \/ library/);
  landmarkFails('a pinned plan id that the strip no longer claims in the band (a drifted dump)', DST_ROWS, /wGone[\s\S]*update PLAN_BAND_IDS/, { expect: [...IDS, 'wGone'] });
  check('fixture: nothing to compare is a failure, not a pass (no band; no owned claim of the strip inside it)', () => {
    assert(/do not overlap/.test(landmarkBandProblems({ source: SRC, dest: dst(DST_ROWS), band: [], expect: IDS }).join()));
    assert(/nothing to compare/.test(landmarkBandProblems({ source: { ...SRC, rows: SRC_ROWS.filter((r) => !inBandRow(r)) }, dest: dst(DST_ROWS), band: BAND, expect: IDS }).join()));
    assert(/nothing to compare/.test(landmarkBandProblems({ source: { ...SRC, rows: SRC_ROWS.map((r) => ({ ...r, owned: false })) }, dest: dst(DST_ROWS), band: BAND, expect: IDS }).join()));
  });
  check('fixture: the band is the intersection of the play rectangles (strip x north = x -420 .. 835, z -405 .. -205; two disjoint areas have none; touching edges are no band)', () => {
    assert.deepEqual(bandRects(REGISTRY.strip.play, REGISTRY.north.play), BAND);
    assert.deepEqual(bandRects([R(0, 10, 0, 10)], [R(20, 30, 0, 10)]), []);
    assert.deepEqual(bandRects([R(0, 10, 0, 10)], [R(10, 30, 0, 10)]), []);
    assert.deepEqual(bandRects([R(0, 10, 0, 10), R(10, 20, 0, 10)], [R(5, 15, 5, 8)]), [R(5, 10, 5, 8), R(10, 15, 5, 8)]);
  });
  check(`fixture: the plan's ${PLAN_BAND_IDS.length} band landmark ids are all distinct and look like OSM ids`, () => { assert.equal(new Set(PLAN_BAND_IDS).size, PLAN_BAND_IDS.length); for (const id of PLAN_BAND_IDS) assert(/^[nwr]\d+$/.test(id), id); });
  function inBandRow(r) { return BAND.some((b) => r.cx >= b.x0 && r.cx <= b.x1 && r.cz >= b.z0 && r.cz <= b.z1); }
}

// ---------------------------------------------------------------------------------------------- gate geometry of the real gates
console.log('gates (non-dev border gates; the dev gate g0 loops back to the same page and has no border; a door gate and an edge gate have no border geometry: their rows are checked above):');
const realGates = GATES.filter((g) => !g.dev && !isDoor(g) && !isEdge(g) && (!only || g.from === only || g.to === only));
if (!realGates.length) console.log('  (no real gate in the registry yet: the checks above ran on the fixtures)');
const bandFile = path.join(root, 'tools/band-parity.mjs');
for (const g of realGates) {
  const from = REGISTRY[g.from], to = REGISTRY[g.to];
  check(`gate ${g.id} (${g.from} -> ${g.to}): border, inward, depth, arrival rectangle, reverse gate`, () => {
    const pr = GG.gateProblems(g, { fromRects: from.play, toRects: to.play, reverse: GATES.find((r) => r.id === g.reverse) }); assert.equal(pr.length, 0, pr.join('\n       '));
  });
  let grid = null, gridError = null;
  try {
    if (g.to === hereArea) grid = GG.arrivalGrid(g, await import(layoutUrl));
    else {
      const env = { ...process.env }; delete env.AREA;      // the child sets it itself
      const r = spawnSync(process.execPath, [path.join(root, 'tools/area.mjs'), g.to, path.join(root, 'tools/areas-test.mjs'), '--arrival-only', g.id], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
      const line = String(r.stdout || '').split('\n').find((l) => l.startsWith('ARRIVAL_GRID '));
      if (!line) throw new Error(`the arrival-grid child for ${g.to} printed nothing (exit ${r.status}): ${String(r.stderr || r.stdout).slice(0, 400)}`);
      grid = JSON.parse(line.slice(13));
    }
  } catch (e) { gridError = e; }
  check(`gate ${g.id}: arrival grid in ${g.to} (25 m steps x walk / fly / car x both headings)${grid ? `: ${grid.total} resolutions, ${grid.direct} direct, ${grid.ring} ring, ${grid.hero} hero` : ''} 100 % valid`, () => {
    if (gridError) throw gridError; assert.equal(grid.badCount, 0, `${grid.badCount} of ${grid.total} invalid:\n       ` + grid.bad.join('\n       '));
  });
  if (fs.existsSync(bandFile)) {
    // the data task's band parity hook: bandParity({ gate, root, REGISTRY }) -> a list of problems (or nothing)
    let bp = null, bpError = null;
    try { const m = await import(pathToFileURL(bandFile).href); if (typeof m.bandParity === 'function') bp = (await m.bandParity({ gate: g, root, REGISTRY })) || []; } catch (e) { bpError = e; }
    if (bp || bpError) check(`gate ${g.id}: band parity (tools/band-parity.mjs)`, () => { if (bpError) throw bpError; assert.equal(bp.length, 0, bp.slice(0, 6).join('\n       ')); });
  }
  // the landmark parity of the band (M5): every landmark of the strip that stands in the band is built by a module of the other area (claims: tools/lib/claims-dump.mjs, in a child per area)
  if (g.from === 'strip' || g.to === 'strip') {
    let lp = null, lpError = null;
    try { lp = await bandLandmarks({ gate: g, root, REGISTRY }); } catch (e) { lpError = e; }
    check(`gate ${g.id}: band landmarks (every landmark claim of the strip inside the band is built by a module of ${g.from === 'strip' ? g.to : g.from}; tools/band-parity.mjs)`, () => { if (lpError) throw lpError; assert(lp.length === 0, lp.slice(0, 8).join('\n       ')); });
  }
}

// the arrival of an edge hop: he lands at the same x, z, yaw; resolved with the DESTINATION layout at every working point of the lens (walk / fly / car along its lane), in a child like the border grids
console.log('edge gates (the arrival at the working points of the boundary, in the destination layout):');
for (const g of GATES.filter((q) => isEdge(q) && (!only || q.from === only || q.to === only))) {
  let grid = null, gridError = null;
  try {
    if (g.to === hereArea) grid = EG.edgeArrival(EG.edgeLens(REGISTRY[g.from].play, REGISTRY[g.to].play, { backMax: 0 }).points, await import(layoutUrl));
    else {
      const env = { ...process.env }; delete env.AREA;
      const r = spawnSync(process.execPath, [path.join(root, 'tools/area.mjs'), g.to, path.join(root, 'tools/areas-test.mjs'), '--arrival-only', g.id], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
      const line = String(r.stdout || '').split('\n').find((l) => l.startsWith('ARRIVAL_GRID '));
      if (!line) throw new Error(`the arrival child for ${g.to} printed nothing (exit ${r.status}): ${String(r.stderr || r.stdout).slice(0, 400)}`);
      grid = JSON.parse(line.slice(13));
    }
  } catch (e) { gridError = e; }
  check(`edge ${g.id}: arrival in ${g.to} on dry ground${grid ? `: ${grid.total - grid.wet.total} resolutions, ${grid.direct} direct, ${grid.ring} ring, ${grid.hero} hero (all modes)` : ''}: walk / fly / car valid (no HERO fall-back)`, () => {
    if (gridError) throw gridError; const bad = grid.badCount - grid.wet.bad; assert.equal(bad, 0, `${bad} dry resolutions invalid:\n       ` + grid.bad.filter((m) => !/in water/.test(m)).join('\n       '));
  });
  check(`edge ${g.id}: arrival in ${g.to} in water (${grid ? grid.wet.total : '?'} resolutions): water is walkable, a hop into it must not fall back to the HERO (world rules; src/core/handoff.js makeProbe.blocked)`, () => {
    if (gridError) throw gridError; assert.equal(grid.wet.bad, 0, `${grid.wet.bad} of ${grid.wet.total} invalid:\n       ` + grid.bad.filter((m) => /in water/.test(m)).join('\n       '));
  });
}

console.log(`areas-test: ${passes} passed, ${fails} failed`);
console.log(fails ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fails ? 1 : 0);
