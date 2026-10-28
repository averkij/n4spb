// Enterable ground-floor summer fair in the Sevkabel main hall.
// Reference 007/008: green steel columns, exposed beams, concrete floors and
// yellow seating; stall/aisle layout is authored, not a dated tenant floorplan.
// Ground is continuous, the three public entrances lead to a 10 m central aisle.
import { H } from './frame.js';
import { FACE } from './hall.js';
import { HALL_DOORS } from './access.js';
import { sign, tile, goods, visitor, solid, table, festoon, buildBulbs, knockCaptured } from './culture-kit.js';
// n4spb (docs/AREAS.md 13, 15.v): the market stalls, the gallery partitions, the workshop counter and its stools, the sofas, the café tables and counter and the programme board are knock records
// (knockCaptured: the same drawing, captured into the record's own geometry); the steel columns of the hall are structures

export function build(K) {
  const { ctx, P, M, svc } = K;
  P.push(H.x, 0, H.z, H.rot);
  shell(K); structure(K); stalls(K); corners(K); entrances(K);
  P.pop(); buildBulbs(K);
  ctx.zones?.add({
    id: 'sevkabel-fair',
    test: (x, y, z) => { const p = H.M(x, z); return Math.abs(p.u) < 78.3 && Math.abs(p.v) < 24.7 && y > -.3 && y < 9.9; },
    indoor: {
      name: 'Ярмарка в Севкабель Порту', sun: 0,
      key: { color: '#ffe6c4', intensity: 1.35, dir: [.3, .8, .4] },
      ambient: { color: '#ede4d4', ground: '#c2b6a1', intensity: 1.85 },
      fog: { color: '#ada89d', density: .002 }, sky: false, shadows: false,
      far: 320, bloom: { bloom: .28, glow: .16, threshold: 1.0 }, exposure: 1,
    },
  });
  svc.fair = { stalls: 24, entrances: HALL_DOORS.map(d => d.id), aisleWidth: 10, workshop: H.W(59, -18), gallery: H.W(-59, 17) };
  // Informational activities use existing E/panel controls; there is no city-wide
  // polling callback, purchase flow or scripted pedestrian simulation.
  const activity = (id, lx, lz, label, title, text) => {
    const p = H.W(lx, lz);
    ctx.interact?.add({ id, x: p.x, y: 1.0, z: p.z, radius: 2.8, label,
      onUse: () => ctx.ui?.panel(`<p>${text}</p>`, { title, closeLabel: 'Вернуться на ярмарку' }) });
  };
  activity('sevkabel-fair-programme', -69, -6.8, 'Посмотреть программу ярмарки', 'Ярмарка в Порту', 'Керамика, авторские принты, книги и зины, винтаж, украшения и цветы. В мастерской — стол для лепки, в галерее — работы петербургских художников. Пройдите по центральной аллее: выход к причалу находится в другом конце зала.');
  activity('sevkabel-fair-workshop', 58, -15, 'Узнать о мастерской', 'Открытая мастерская', 'Здесь делают керамику вручную: на столе глина, инструменты и готовые чашки. Можно рассмотреть работы и познакомиться с мастерами.');
}

function shell(K) {
  const { P, M, ctx } = K;
  // The external facades face outwards. Draw a separate inward lining, with
  // exactly the same door holes. Never seal a visible doorway from the inside.
  for (const [name, face] of Object.entries(FACE)) {
    const door = HALL_DOORS.find(d => d.face === name), cuts = door ? [[0, door.u0], [door.u1, face.len]] : [[0, face.len]];
    const quad = (u0, u1, y0, y1, mat) => {
      const a = face.pt(u0, -.48), b = face.pt(u1, -.48);
      P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [-face.n[0], 0, -face.n[1]], [[u0 / 3.6, y0 / 3.6], [u1 / 3.6, y0 / 3.6], [u1 / 3.6, y1 / 3.6], [u0 / 3.6, y1 / 3.6]]);
    };
    for (const [a, b] of cuts) quad(a, b, .05, 3.3, M.concPaint);
    quad(0, face.len, 3.3, 9.98, name === 'R' ? M.rustWin : name === 'NW' || name === 'SE' ? M.darkWin : M.concPaint);
    for (const [a, b] of cuts) quad(a, b, .05, .35, M.cultureTeal);
  }
  P.box(M.cultureFloor, -78.1, 78.1, .025, .08, -24.5, 24.5, 'b', 6);
  H.walk(ctx.physics, 0, 0, 156.2, 49, .08, .025);
  // Real hall has another floor at 10.5 m. Keep the usable ground floor capped.
  P.box(M.concSoffit, -78.1, 78.1, 10.0, 10.35, -24.5, 24.5, 't');
}

function structure(K) {
  const { P, M } = K;
  for (const x of [-64, -40, -16, 16, 40, 64]) {
    for (const z of [-19, 19]) {
      P.box(M.cultureTeal, x - .22, x + .22, .08, 9.85, z - .22, z + .22, 'b');
      P.box(M.steelGrey, x - .36, x + .36, .08, .18, z - .36, z + .36, 'b');
      solid(K, x, z, .5, .5, 9.8, 0, .08);
    }
    P.box(M.cultureTeal, x - .16, x + .16, 9.45, 9.97, -24.4, 24.4, 'b');
    for (const z of [-12, 0, 12]) {
      P.col(M.black, x, z, 7.0, 9.5, .025, .025, 5);
      P.cyl(M.steelGrey, [x, 6.8, z], [x, 7.05, z], .42, .18, 10, false);
      P.col(M.cultureLight, x, z, 6.77, 6.81, .36, .36, 10);
    }
  }
  for (const z of [-19, 19]) P.box(M.cultureTeal, -78, 78, 9.1, 9.5, z - .13, z + .13, 'b');
  for (const x of [-57, -33, 0, 33, 57]) festoon(K, [x, 5.2, -18], [x, 5.2, 18], .55);
}

function stalls(K) {
  const { P, M, svc } = K, names = ['КЕРАМИКА', 'КНИГИ И ЗИНЫ', 'ПРИНТЫ', 'ВИНТАЖ', 'УКРАШЕНИЯ', 'ЦВЕТЫ'];
  const xs = [-62, -52, -42, -32, -22, -12, 12, 22, 32, 42, 52, 62];
  let index = 0;
  for (const side of [-1, 1]) for (const x of xs) {
    const z = side * 11, rot = side < 0 ? 0 : Math.PI, kind = index % 6;
    const w0 = H.W(x, z);
    K.extraTris += knockCaptured(K, 'lmsevka-stalls', { x: w0.x, z: w0.z, rotY: H.rot + rot }, (K2) => {
    const P = K2.P;
    P.push(x, .08, z, rot);
    P.box(M.slats, -2.7, 2.7, 0, .9, 0, .85, 'b');
    P.box(M.larchDark, -2.85, 2.85, .9, 1.0, -.15, 1.0, 'b');
    for (const dx of [-2.65, 2.65]) P.col(M.black, dx, -.9, 0, 2.8, .045, .045, 5);
    P.box(kind % 2 ? M.cultureRose : M.cultureTeal, -2.85, 2.85, 2.65, 2.78, -1.3, 1.25, 'b');
    P.box(M.plaster, -2.7, 2.7, 1.0, 2.65, -1.2, -1.12, 'b');
    sign(K2, names[kind], 0, 2.35, 1.29, 3.3, .55, 'sevkabel-stall-' + index);
    goods(P, M, kind, 0, 1.01, .25);
    if (kind !== 3) {
      P.box(M.larchDark, -2.2, 2.2, 1.65, 1.73, -1.08, -.55, 'b');
      if (kind === 2) { for (const dx of [-1.4, 0, 1.4]) tile(P, M, 22 + Math.round(dx + 1.4), dx, 2.13, -1.05, .65, .7); }
      else for (const dx of [-1.5, -.5, .5, 1.5]) {
        if (kind === 1) P.box(M.cultureTeal, dx - .13, dx + .13, 1.73, 2.08, -.96, -.62, 'b');
        else P.col(kind % 2 ? M.cultureRose : M.cultureTeal, dx, -.78, 1.73, 2.06, .11, .14, 8, false);
      }
    }
    if (kind === 3) {
      for (const dx of [-1.9, 1.9]) P.col(M.black, dx, -2.5, 0, 2.15, .035, .035, 5);
      P.cyl(M.black, [-1.9, 2.15, -2.5], [1.9, 2.15, -2.5], .035, .035, 5);
      for (let j = 0; j < 5; j++) {
        const dx = -1.4 + j * .7;
        P.box(j % 2 ? M.cultureRose : M.cultureTeal, dx - .22, dx + .22, 1.2, 1.95, -2.54, -2.45, 'b');
        P.cyl(M.larch, [dx, 2.1, -2.5], [dx - .3, 1.92, -2.5], .018, .018, 4);
        P.cyl(M.larch, [dx, 2.1, -2.5], [dx + .3, 1.92, -2.5], .018, .018, 4);
      }
    }
    visitor(P, M, .5, -.65, 0, index);
    P.pop();
    return [solid(K, x, z, 5.7, 2.6, 2.8, rot, .08), kind === 3 ? solid(K, x, z + side * 2.5, 4, .45, 2.2, rot, .08) : null].filter(Boolean);
    }, { kind: 'booth', mass: 800, h: 2.8, w: 5.7, d: 2.6, anchored: 12, hitK: 0.5, metal: false, minDv: 0 }, 200);
    // Browsers stand in front of a counter, beyond the uninterrupted main aisle.
    if (index % 4 === 0) visitor(P, M, x + 1, z - side * 2.8, side < 0 ? Math.PI : 0, index + 1);
    (svc.marketStalls ||= []).push({ id: 'sevkabel-stall-' + index, name: names[kind], ...H.W(x, z) });
    index++;
  }
}

function corners(K) {
  const { P, M } = K;
  // Gallery: partitions with actual pictures and a reading bench, away from exits.
  for (const x of [-61, -55, -49]) {
    const w1 = H.W(x, 21.8);
    K.extraTris += knockCaptured(K, 'lmsevka-partitions', { x: w1.x, z: w1.z, rotY: H.rot }, (K2) => {
      const P = K2.P;
      P.box(M.larchDark, x - 2.3, x + 2.3, .08, 3.0, 21.8, 22.0, 'b');
      P.box(M.plaster, x - 2.2, x + 2.2, .25, 2.9, 21.68, 21.78, 'b');
      P.push(x, 0, 21.64, Math.PI); tile(P, M, 23 + Math.floor((x + 61) / 6), 0, 1.65, .03, 2.7, 1.45); P.pop();
      return solid(K, x, 21.8, 4.6, .4, 3.0);
    }, { kind: 'sign', mass: 150, h: 3.0, w: 4.6, d: 0.4, anchored: 10, hitK: 0.3, metal: false, minDv: 0 }, 200);
  }
  P.push(-60, 0, 18, Math.PI); sign(K, 'ГАЛЕРЕЯ', 0, 3.1, 0, 3.4, .6); P.pop();
  // Pottery workshop with stools, clay, tools and a resident demonstrator.
  {      // the workshop counter with its stools, clay pots and tools: one knock record (the counter box and the five stool cylinders are its colliders)
    const w2 = H.W(57, -19.4);
    K.extraTris += knockCaptured(K, 'lmsevka-workshop', { x: w2.x, z: w2.z, rotY: H.rot }, (K2) => {
      const P = K2.P, items = [];
      P.box(M.larch, 49, 65, .86, .95, -20, -18.8, 'b');
      for (const x of [50, 54, 58, 62, 64]) {
        P.col(M.larchDark, x, -17.8, .08, .48, .22, .22, 8);
        items.push(H.cyl(K.ctx.physics, x, -17.8, .24, .08, .48));
        P.col(M.copper, x, -19.3, .95, 1.13, .16, .12, 8);
        P.cyl(M.larchDark, [x + .25, .97, -19.1], [x + .48, .97, -19.4], .015, .015, 4);
      }
      items.push(solid(K, 57, -19.4, 16, 1.2, .95));
      return items.filter(Boolean);
    }, { kind: 'table', mass: 500, h: 0.95, w: 16, d: 1.2, anchored: 10, hitK: 0.4, metal: false, minDv: 0 }, 200);
  }
  visitor(P, M, 57, -21.5, 0, 1); visitor(P, M, 53.8, -17.8, Math.PI, 2, true);
  P.push(57, 0, -22.9); sign(K, 'МАСТЕРСКАЯ', 0, 2.6, 0, 4, .7); P.pop();
  // Indoor coffee/rest area: yellow sofas and communal tables.
  for (const x of [-58, 55]) {
    const w3 = H.W(x, -21.4);
    K.extraTris += knockCaptured(K, 'lmsevka-sofas', { x: w3.x, z: w3.z, rotY: H.rot }, (K2) => {
      const P = K2.P;
      P.box(M.yellowSteel, x - 3, x + 3, .08, .48, -22, -20.8, 'b');
      P.box(M.yellowSteel, x - 3, x + 3, .48, 1.15, -22, -21.85, 'b');
      return solid(K, x, -21.4, 6, 1.2, 1.15);
    }, { kind: 'bench', mass: 200, h: 1.15, w: 6, d: 1.2, anchored: 10, hitK: 0.3, metal: false, minDv: 0 }, 200);
  }
  for (const x of [-68, 68]) {
    const w4 = H.W(x, 13);
    K.extraTris += knockCaptured(K, 'lmsevka-hall-tables', { x: w4.x, z: w4.z, rotY: H.rot }, (K2) => { table(K2.P, M, x, 13, true); return solid(K, x, 13, 2.2, 1.8, .82); },
      { kind: 'table', mass: 90, h: 0.85, w: 2.2, d: 1.8, hitK: 0.25, metal: false, minDv: 0 }, 200);
  }
  {      // the coffee counter (6 x 2 m, goods on it)
    const w5 = H.W(-68, -16);
    K.extraTris += knockCaptured(K, 'lmsevka-coffee', { x: w5.x, z: w5.z, rotY: H.rot }, (K2) => {
      const P = K2.P;
      P.push(-68, 0, -16); P.box(M.cultureTeal, -3, 3, .08, 1.1, -1, 1, 'b');
      sign(K2, 'КОФЕ', 0, 2.5, 1.1, 3, .65); goods(P, M, 0, 0, 1.11, .3); P.pop();
      return solid(K, -68, -16, 6, 2, 1.1);
    }, { kind: 'booth', mass: 400, h: 1.1, w: 6, d: 2, anchored: 10, hitK: 0.4, metal: false, minDv: 0 }, 200);
    visitor(P, M, -68, -18, 0, 3);
  }
}

function entrances(K) {
  const { P, M, svc } = K;
  for (const d of HALL_DOORS) {
    const face = FACE[d.face], u = (d.u0 + d.u1) / 2, q = face.pt(u, .07), n = face.n;
    const rot = Math.atan2(n[0], n[1]);
    P.push(q[0], 0, q[1], rot);
    sign(K, 'ВХОД НА ЯРМАРКУ', 0, 3.8, .08, d.u1 - d.u0, .72, 'r8702908');
    for (const x of [-(d.u1 - d.u0) / 2, (d.u1 - d.u0) / 2]) P.box(M.black, x - .07, x + .07, .08, d.h, -.55, -.25, 'b');
    P.box(M.black, -(d.u1 - d.u0) / 2, (d.u1 - d.u0) / 2, d.h - .1, d.h, -.55, -.25, 'b');
    // Inside-facing exit sign, placed above the open path.
    P.push(0, 0, -.7, Math.PI); sign(K, 'ВЫХОД', 0, 2.9, .04, 1.5, .4, 'r8702908'); P.pop();
    P.pop();
    const w = H.W(q[0], q[1]); svc.entrances.push({ id: d.id, name: 'Ярмарка в главном корпусе', x: w.x, z: w.z, rotY: H.rot + rot, open: true });
  }
  // A readable freestanding programme board close to NW lobby, off its path.
  {
    const w6 = H.W(-69, -9.5);
    K.extraTris += knockCaptured(K, 'lmsevka-board', { x: w6.x, z: w6.z, rotY: H.rot }, (K2) => {
      const P = K2.P;
      P.push(-69, 0, -9.5); P.box(M.larchDark, -.85, .85, .08, 2.1, -.08, .08, 'b');
      sign(K2, 'АФИША', 0, 1.5, .12, 1.5, .8); P.pop(); return solid(K, -69, -9.5, 1.7, .2, 2.1);
    }, { kind: 'sign', mass: 40, h: 2.1, w: 1.7, d: 0.2, anchored: 8, hitK: 0.2, metal: false, minDv: 0 }, 200);
  }
  // Cross-aisle overhead signs do not require support poles in walking paths.
  for (const x of [-60, 0, 60]) {
    P.push(x, 0, 0, -Math.PI / 2); sign(K, 'ЯРМАРКА В ПОРТУ', 0, 4.1, .03, 6.5, .95); P.pop();
  }
}
