// landmarksGavan/artFire.js - textures of the GAVAN FIRE RESERVE (Гаванская пожарная часть, 1906-07, F. A. Korzukhin; Ostoumova 21 / Maly pr. 76; docs/research/gavan.md section 9; photos refs/gavan 93-98, citywalls 1905 plans):
// a garage bay of 7.4 m (cream arcade band with a red round-arched door 5.0 x 4.6 m on the ground floor, salmon-terracotta brick above with two rectangular windows, a Lombard corbel frieze), a plain wall tile with
// barred windows for the courtyard sides, the tower arch, the rosette of the south gable.  Colours: brick #b7634f, cream #e7d79b, surrounds #ead9a0, doors #c23a28.  Keys 'lmgavan-'.
export function artFire(ctx, A, H) {
  const { D, R, speckle, TAU } = H;
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const BRICK = '#b7634f', CREAM = '#e7d79b', SURR = '#ead9a0', DOOR = '#c23a28';
  const brick = (g, x, y, w, h, seed) => { px(g, x, y, w, h, BRICK); const r = R(seed); for (let k = 0; k < h / 6; k++) { g.fillStyle = 'rgba(60,20,10,0.3)'; g.fillRect(x, y + k * 6, w, 1); for (let i = 0; i < w / 15; i++) { const v = r(); g.fillStyle = v < 0.3 ? 'rgba(255,210,180,0.1)' : v < 0.6 ? 'rgba(70,24,12,0.1)' : 'rgba(0,0,0,0)'; g.fillRect(x + i * 15 + (k % 2) * 7, y + k * 6 + 1, 14, 5); } } };
  // ------------------------------------------------------------------------------------------ the garage bay: 7.4 x 10.5 m, 24 px / m (178 x 252)
  A.fireBay = D(178, 252, (g, w, h) => {
    const m = 24, Y = (v) => h - v * m, cx = w / 2;
    px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9501, 140, 0.05);
    brick(g, 0, 0, w, Y(4.9), 9502);                                                                 // the first floor 4.9 .. 10.4 m (brick)
    px(g, 0, Y(5.05), w, 0.2 * m, SURR);                                                             // the string course
    // the arcade band: a moulded archivolt round the door, cream piers
    g.fillStyle = SURR; g.beginPath(); g.moveTo(cx - 3.1 * m, h); g.lineTo(cx + 3.1 * m, h); g.lineTo(cx + 3.1 * m, Y(2.7)); g.arc(cx, Y(2.7), 3.1 * m, 0, Math.PI, true); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,100,60,0.45)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, Y(2.7), 3.1 * m, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(cx, Y(2.7), 2.85 * m, Math.PI, 0); g.stroke();
    g.fillStyle = DOOR; g.beginPath(); g.moveTo(cx - 2.5 * m, h); g.lineTo(cx + 2.5 * m, h); g.lineTo(cx + 2.5 * m, Y(2.1)); g.arc(cx, Y(2.1), 2.5 * m, 0, Math.PI, true); g.closePath(); g.fill();   // 5.0 wide, crown 4.6 m
    g.fillStyle = 'rgba(40,10,6,0.55)'; for (const yy of [0.9, 1.9, 2.9]) g.fillRect(cx - 2.2 * m, Y(yy + 0.3), 4.4 * m, 0.12 * m);                         // slot lights / panel joints
    g.fillStyle = 'rgba(40,10,6,0.55)'; g.fillRect(cx - 1.5, Y(4.4), 3, 4.4 * m);
    g.fillStyle = '#1c1c1c'; for (const sx of [-1, 1]) { g.fillRect(cx + sx * 3.25 * m - 3, Y(3.4), 6, 0.5 * m); }                                       // black iron wall lamps between the arches
    // first floor: two rectangular windows with cream surrounds
    for (const sx of [-1, 1]) { const x = cx + sx * 1.9 * m; px(g, x - 0.95 * m, Y(9.4), 1.9 * m, 2.5 * m, SURR); px(g, x - 0.75 * m, Y(9.0), 1.5 * m, 1.9 * m, '#2d363a'); g.fillStyle = SURR; g.fillRect(x - 1, Y(9.0), 2, 1.9 * m); g.fillRect(x - 0.75 * m, Y(8.2), 1.5 * m, 2); }
    // the Lombard corbel frieze under the parapet: small round arches on corbels, 0.5 m high
    px(g, 0, Y(10.45), w, 0.55 * m, CREAM); for (let i = 0; i < 18; i++) { g.fillStyle = BRICK; g.beginPath(); g.arc(i * w / 18 + w / 36, Y(10.0), w / 44, Math.PI, 0); g.fill(); }
  }, 'fireBay');
  A.fireWall = D(128, 256, (g, w, h) => {                                                            // a plain wall tile 3.5 x 10.5 m (36 px / m): barred window below, a window above, the frieze
    const m = w / 3.5, Y = (v) => h - v * m * 0.99;
    px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9511, 120, 0.05); brick(g, 0, 0, w, Y(4.9), 9512); px(g, 0, Y(5.05), w, 0.2 * m, SURR);
    px(g, w / 2 - 0.55 * m, Y(3.5), 1.1 * m, 1.9 * m, SURR); px(g, w / 2 - 0.4 * m, Y(3.3), 0.8 * m, 1.5 * m, '#3a4448'); g.fillStyle = '#c9c4ae'; for (let x = w / 2 - 0.4 * m; x < w / 2 + 0.4 * m; x += 6) g.fillRect(x, Y(3.3), 1.2, 1.5 * m);
    px(g, w / 2 - 0.85 * m, Y(8.9), 1.7 * m, 2.1 * m, SURR); px(g, w / 2 - 0.65 * m, Y(8.5), 1.3 * m, 1.7 * m, '#2d363a'); g.fillStyle = SURR; g.fillRect(w / 2 - 1, Y(8.5), 2, 1.7 * m);
    px(g, 0, Y(10.45), w, 0.55 * m, CREAM); for (let i = 0; i < 7; i++) { g.fillStyle = BRICK; g.beginPath(); g.arc(i * w / 7 + w / 14, Y(10.05), w / 24, Math.PI, 0); g.fill(); }
  }, 'fireWall');
  A.fireTowerArch = D(160, 200, (g, w, h) => {                                                       // the big round-arched door of the tower block (quad 4.4 x 5.5 m)
    const m = w / 4.4; px(g, 0, 0, w, h, CREAM); g.fillStyle = SURR; g.beginPath(); g.moveTo(0, h); g.lineTo(w, h); g.lineTo(w, h - 3.3 * m); g.arc(w / 2, h - 3.3 * m, 2.2 * m, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = DOOR; g.beginPath(); g.moveTo(w / 2 - 2.0 * m, h); g.lineTo(w / 2 + 2.0 * m, h); g.lineTo(w / 2 + 2.0 * m, h - 3.0 * m); g.arc(w / 2, h - 3.0 * m, 2.0 * m, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,10,6,0.5)'; g.fillRect(w / 2 - 1.5, h - 5 * m, 3, 5 * m);
  }, 'fireTowerArch');
  A.fireCream = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, CREAM); speckle(g, w, h, 9521, 150, 0.05); }, 'fireCream');
  A.fireBrick = D(256, 256, (g, w, h) => { brick(g, 0, 0, w, h, 9522); speckle(g, w, h, 9523, 200, 0.06); }, 'fireBrick');
  A.fireRose = D(128, 128, (g, w, h) => {                                                            // the ceramic rosette in the south gable (a green glazed panel with a coloured rosette)
    px(g, 0, 0, w, h, CREAM); px(g, 14, 14, w - 28, h - 28, '#3f7d5a'); const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillStyle = i % 2 ? '#e0b030' : '#c23a28'; g.beginPath(); g.ellipse(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 14, 8, a, 0, TAU); g.fill(); }
    g.fillStyle = '#f0e6c0'; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.fill();
  }, 'fireRose');
  A.fireWin = D(96, 160, (g, w, h) => {                                                              // a tall arched window of the south gable / the corner block gable (quad 1.5 x 2.5 m)
    px(g, 0, 0, w, h, CREAM); g.fillStyle = SURR; g.beginPath(); g.moveTo(4, h); g.lineTo(w - 4, h); g.lineTo(w - 4, h * 0.34); g.arc(w / 2, h * 0.34, w / 2 - 4, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = '#2d363a'; g.beginPath(); g.moveTo(14, h - 8); g.lineTo(w - 14, h - 8); g.lineTo(w - 14, h * 0.35); g.arc(w / 2, h * 0.35, w / 2 - 14, 0, Math.PI, true); g.closePath(); g.fill(); g.fillStyle = SURR; g.fillRect(w / 2 - 1, 18, 2, h - 26);
  }, 'fireWin');
  void TAU;
}
