// landmarksGavan/artChurch.js - textures of the CHURCH OF THE MERCIFUL MOTHER OF GOD (docs/research/gavan.md section 10; photos refs/gavan 102 109 110 123; the 2022-25 RESTORED state): cream-white plaster walls with white relief
// bands and arched windows (three wall heights: 17.5 / 12 / 7 m, 16 px / m), the drum tile (cream with arched windows between colonnettes), the belfry arcade, silvery zinc scale (lozenge) domes, the gilded ribbed band, the
// portal, the grey corrugated hoarding with its object-passport board, the temporary wooden church (logs, dark metal tile, black-and-white chequered onion).  Keys 'lmgavan-'.
export function artChurch(ctx, A, H) {
  const { D, R, speckle, F, TAU } = H;
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const CREAM = '#efe4be', SHADE = '#d9ccb0', WHITE = '#f6f1e0', GLASS = '#3a4048';
  const arch = (g, cx, y, w, h, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(cx - w / 2, y); g.lineTo(cx + w / 2, y); g.lineTo(cx + w / 2, y - h + w / 2); g.arc(cx, y - h + w / 2, w / 2, 0, Math.PI, true); g.closePath(); g.fill(); };
  // ------------------------------------------------------------------------------------------ walls: one tile 4 m wide, H m tall (16 px / m), plinth 1 m, ornament bands, arched windows, the cornice with corbel arches
  const wallTex = (key, Hm, winY0, winH, bands) => D(64, Math.round(Hm * 16), (g, w, h) => {
    const m = 16, Y = (v) => h - v * m;
    px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9601 + Hm, 150, 0.05);
    px(g, 0, Y(1.0), w, 1.0 * m, '#9a958c'); px(g, 0, Y(1.05), w, 3, 'rgba(0,0,0,0.25)');
    for (const yb of bands) { px(g, 0, Y(yb + 0.8), w, 0.8 * m, WHITE); g.fillStyle = SHADE; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w / 8 + w / 16, Y(yb + 0.4), 3.5, 0, TAU); g.fill(); } px(g, 0, Y(yb + 0.82), w, 2, 'rgba(120,100,70,0.35)'); }
    arch(g, w / 2, Y(winY0), 1.7 * m, winH * m + 12, WHITE); arch(g, w / 2, Y(winY0) - 4, 1.0 * m, winH * m - 2, GLASS);
    g.fillStyle = WHITE; g.fillRect(w / 2 - 1, Y(winY0 + winH) + 4, 2, winH * m - 6); for (let k = 1; k < 5; k++) g.fillRect(w / 2 - 0.5 * m, Y(winY0) - 4 - (winH * m - 6) * k / 5, 1.0 * m, 1.4);
    px(g, 0, 0, w, 1.0 * m, WHITE); g.fillStyle = CREAM; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(i * w / 6 + w / 12, 1.0 * m, w / 14, 0, Math.PI); g.fill(); }     // the corbel-arch cornice
  }, key);
  A.churchWall17 = wallTex('churchWall17', 17.5, 9.0, 3.2, [5.0, 14.0]);
  A.churchWall12 = wallTex('churchWall12', 12.0, 4.6, 3.0, [3.2, 9.5]);
  A.churchWall7 = wallTex('churchWall7', 7.0, 2.2, 2.6, [4.6]);
  A.churchPlain = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9611, 180, 0.05); }, 'churchPlain');
  A.churchRelief = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, WHITE); g.strokeStyle = SHADE; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(i * w / 4 + w / 8, h / 2, w / 9, 0, TAU); g.stroke(); } }, 'churchRelief');
  // ------------------------------------------------------------------------------------------ drums: one bay (arched window between two colonnettes under an arcade), repeated N times round the drum
  const drumTex = (key, bayW, drumH) => D(96, Math.round(96 * drumH / bayW), (g, w, h) => {
    const m = w / bayW; px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9621 + drumH, 120, 0.05);
    px(g, 0, h - 1.1 * m, w, 1.1 * m, WHITE); px(g, 0, 0, w, 1.3 * m, WHITE);                                           // the ribbed base cornice and the sculpted cornice
    arch(g, w / 2, h - 1.3 * m, Math.min(1.9 * m, w * 0.62), drumH * m * 0.62, WHITE); arch(g, w / 2, h - 1.5 * m, Math.min(1.2 * m, w * 0.4), drumH * m * 0.56, GLASS);
    g.fillStyle = WHITE; g.fillRect(w / 2 - 1, h - 1.5 * m - drumH * m * 0.52, 2, drumH * m * 0.5); for (const sx of [0.07, 0.93]) g.fillRect(w * sx - 3, 1.3 * m, 6, h - 2.6 * m);   // colonnettes
    g.fillStyle = SHADE; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * (0.12 + i * 0.19), 1.0 * m, 4, 0, Math.PI); g.fill(); }
  }, key);
  A.drumCentral = drumTex('drumCentral', 2.6, 7.5);
  A.drumConch = drumTex('drumConch', 4.7, 6.4);
  A.belfry = D(96, 128, (g, w, h) => { px(g, 0, 0, w, h, CREAM); arch(g, w / 2, h - 10, w * 0.6, h * 0.6, WHITE); arch(g, w / 2, h - 14, w * 0.42, h * 0.54, '#1d2124'); px(g, 0, 0, w, 10, WHITE); px(g, 0, h - 8, w, 8, WHITE); }, 'belfry');
  // ------------------------------------------------------------------------------------------ the domes: silvery zinc lozenges (one tile = 1 m x 1 m, a 45-degree diamond grid) and the gilded ribbed band
  A.domeSilver = D(128, 128, (g, w, h) => {
    px(g, 0, 0, w, h, '#c3ccd5'); g.strokeStyle = 'rgba(120,135,150,0.55)'; g.lineWidth = 2;
    for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + h, h); g.stroke(); g.beginPath(); g.moveTo(i * 32 + h, 0); g.lineTo(i * 32, h); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) g.fillRect(i * 32 + 12 + (k % 2) * 16, k * 32 + 10, 10, 6);
  }, 'domeSilver');
  A.gildBand = D(128, 64, (g, w, h) => {
    px(g, 0, 0, w, h, '#d7a93a'); g.fillStyle = '#b98a22'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 8, h); g.lineTo(i * 16 + 16, 0); g.closePath(); g.fill(); } g.fillStyle = '#ecc65a'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  }, 'gildBand');
  A.gildScale = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, '#dcae3c'); g.strokeStyle = 'rgba(150,100,10,0.55)'; g.lineWidth = 2; for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + h, h); g.stroke(); g.beginPath(); g.moveTo(i * 32 + h, 0); g.lineTo(i * 32, h); g.stroke(); } }, 'gildScale');
  A.portalChurch = D(128, 256, (g, w, h) => {                                                                          // the recessed round-arched portal 3.2 x 6.5 m: archivolts, brown doors, the icon in the tympanum
    px(g, 0, 0, w, h, CREAM); const m = w / 3.2; arch(g, w / 2, h, 3.2 * m, 6.5 * m, WHITE); arch(g, w / 2, h, 2.6 * m, 6.0 * m, SHADE); arch(g, w / 2, h, 2.4 * m, 3.6 * m + 1.2 * m, '#4a3226');
    g.fillStyle = '#3f6fb0'; g.beginPath(); g.arc(w / 2, h - 3.6 * m - 0.6 * m, 1.0 * m, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = '#d7a93a'; g.beginPath(); g.arc(w / 2, h - 3.6 * m - 0.6 * m, 0.45 * m, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#2a1c12'; g.fillRect(w / 2 - 1, h - 3.6 * m, 2, 3.6 * m);
  }, 'portalChurch');
  // ------------------------------------------------------------------------------------------ the hoarding (grey corrugated sheets, 1 m tile) and its object-passport board
  A.hoarding = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, '#8d9399'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(40,46,52,0.22)'; g.fillRect(i * 16, 0, 8, h); } speckle(g, w, h, 9631, 140, 0.08); }, 'hoarding');
  A.passport = D(256, 180, (g, w, h) => {
    px(g, 0, 0, w, h, '#f4f4f4'); px(g, 0, 0, w, 26, '#2f5fa5'); g.fillStyle = '#fff'; g.font = `bold 16px ${F ? F.sans : 'sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ПАСПОРТ ОБЪЕКТА', w / 2, 14);
    g.fillStyle = '#8a97a6'; for (let k = 0; k < 7; k++) g.fillRect(14, 40 + k * 16, w - 28 - (k % 3) * 30, 6); px(g, w - 88, 40, 72, 60, '#cbd4de');
  }, 'passport');
  // ------------------------------------------------------------------------------------------ the temporary wooden church
  A.logs = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, '#c19a62'); const r = R(9641); for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(70,45,20,0.45)'; g.fillRect(0, k * 16, w, 2); g.fillStyle = `rgba(255,235,190,${0.08 + r() * 0.1})`; g.fillRect(0, k * 16 + 3, w, 6); } speckle(g, w, h, 9642, 140, 0.08); }, 'logs');
  A.metalTile = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, '#5e342c'); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(30,10,6,0.5)'; g.fillRect(0, k * 21, w, 2); g.fillStyle = 'rgba(255,200,170,0.12)'; g.fillRect(0, k * 21 + 2, w, 5); for (let i = 0; i < 6; i++) g.fillRect(i * 21 + (k % 2) * 10, k * 21, 1.5, 21); } }, 'metalTile');
  A.checker = D(64, 64, (g, w, h) => { px(g, 0, 0, w, h, '#f2f2f0'); g.fillStyle = '#16181a'; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) if ((i + k) % 2 === 0) g.fillRect(i * 16, k * 16, 16, 16); }, 'checker');
}
