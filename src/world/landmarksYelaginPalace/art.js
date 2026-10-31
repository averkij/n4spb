// landmarksYelaginPalace/art.js - the canvas paintings of the module (dossier docs/research/yelagin-palace-2026.md sections 5.4, 8, 12; photos pal_01 pal_05 pal_06 pal_20 pal_27 lion_05 lion_08).
//   plaster  neutral stucco (multiplied by the wall colour: pale blue-grey);  ashlar  grey-beige limestone courses of the podium / cheek blocks (tile 1.8 x 1.8 m: four courses of 0.45 m, blocks 0.9-1.4 m);
//   flags  granite flagstones of the terrace and the landing (tile 2.4 m);  steps  worn granite tread (tile 1 m);  setts  grey-pink cobbles of the carriage ramps (tile 1.5 m, running bond);
//   zinc  silver-grey standing-seam roof (tile 1.2 x 1.2 m, seams every 0.6 m);  dome  one radial panel seam per segment (u = around);
//   winArch / winDoor / winSq  window sheets (u 0..1 over the opening) with natural-wood frames (#b07a3a) and glazing bars over dark glass;
//   lattice  the white cast-iron balustrade of the terrace (alpha; one bay = 1.8 x 1.0 m: ring chain on top, crossed bars with rosettes, palmette band below);  lunette  the blind half-moon with a palmette fan (alpha decal);
//   festoon  the frieze of garlands of the rotunda (tile 2.4 m wide);  grass-free: lawn, trees, paths belong to the environment.
// Every key starts with 'lmyepal-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  wall: '#d9dfe8', wallShade: '#cdd3dc', white: '#f1f0ea', whiteDim: '#e6e5df', limestone: '#a9a597', granite: '#9c9a92', cobble: '#9a8e88', zinc: '#bcc4c9', dome: '#d6dde2', woodWin: '#b07a3a',
  doorWood: '#b88a52', iron: '#eeede9', ironDark: '#6f7780', lantern: '#1d2226', glass: '#2c353d', sphere: '#cfcbc0', vase: '#d9d6cc', flower: '#c8607a', soil: '#4f4034', roofEdge: '#8d969c',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmyepal-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(7101);
    g.fillStyle = '#f5f5f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '205,208,214' : '255,255,255'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const x = r() * w; g.fillStyle = `rgba(110,118,132,${0.02 + r() * 0.025})`; g.fillRect(x, 0, 3 + r() * 7, h); }
    speckle(g, w, h, 7102, 600, 0.06, 2);
  }, 'plaster');

  A.ashlar = D(256, 256, (g, w, h) => {                       // four courses of 0.45 m in a 1.8 m tile, blocks 0.9 .. 1.4 m, grey-beige travertine-like with horizontal veining
    const r = R(7111), ch = h / 4;
    g.fillStyle = '#dedcd4'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      let x = -((k * 61) % 90);
      while (x < w) {
        const bw = 80 + ((k * 7 + Math.floor(x)) % 3) * 22, v = 0.9 + r() * 0.16;
        g.fillStyle = `rgb(${222 * v | 0},${219 * v | 0},${209 * v | 0})`; g.fillRect(x + 1.5, k * ch + 1.5, bw - 3, ch - 3);
        for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(120,110,90,${0.06 + r() * 0.1})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 18 + r() * 50, 1.5); }
        g.fillStyle = 'rgba(80,72,60,0.55)'; g.fillRect(x, k * ch, 2.5, ch);
        x += bw;
      }
      g.fillStyle = 'rgba(80,72,60,0.6)'; g.fillRect(0, k * ch, w, 3);
    }
    for (let i = 0; i < 14; i++) { const x = r() * w; g.fillStyle = `rgba(70,76,70,${0.05 + r() * 0.07})`; g.fillRect(x, 0, 4 + r() * 9, h); }       // damp streaks
    speckle(g, w, h, 7112, 700, 0.07, 3);
  }, 'ashlar');

  A.flags = D(256, 256, (g, w, h) => {                        // granite flags 1.2 x 0.8 m in a 2.4 m tile
    const r = R(7121);
    g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) for (let c = -1; c < 3; c++) {
      const x = c * 128 + (k % 2) * 64 + r() * 3, y = k * (h / 3), v = 0.9 + r() * 0.18;
      g.fillStyle = `rgb(${216 * v | 0},${213 * v | 0},${205 * v | 0})`; g.fillRect(x + 1.5, y + 1.5, 125, h / 3 - 3);
    }
    g.strokeStyle = 'rgba(80,76,70,0.5)'; g.lineWidth = 2.5;
    for (let k = 0; k <= 3; k++) { g.beginPath(); g.moveTo(0, k * (h / 3)); g.lineTo(w, k * (h / 3)); g.stroke(); }
    for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) { const x = c * 128 + (k % 2) * 64; g.beginPath(); g.moveTo(x, k * (h / 3)); g.lineTo(x, (k + 1) * (h / 3)); g.stroke(); }
    speckle(g, w, h, 7122, 900, 0.09, 2.5);
  }, 'flags');

  A.steps = D(256, 128, (g, w, h) => {                        // a worn tread (u along the step 1 m, v across 0.5 m): light granite with darker worn edge
    const r = R(7131);
    g.fillStyle = '#d6d3cb'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,146,138' : '250,248,240'},${0.1 + r() * 0.14})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 5 + r() * 14, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(70,66,60,0.35)'; g.fillRect(0, 0, w, 4); g.fillStyle = 'rgba(70,66,60,0.25)'; g.fillRect(0, h - 5, w, 5);
    speckle(g, w, h, 7132, 500, 0.08, 2);
  }, 'steps');

  A.setts = D(256, 256, (g, w, h) => {                        // rectangular cobbles 0.2 x 0.1 m in running bond, grey with a pink cast (tile 1.5 m: 8 x 15)
    const r = R(7141), bw = 34, bh = 17;
    g.fillStyle = '#77726f'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 15; j++) for (let i = -1; i < 8; i++) {
      const v = 0.9 + r() * 0.16, x = i * bw + (j % 2) * bw / 2, y = j * bh;
      g.fillStyle = `rgb(${(160 + (r() - 0.5) * 8) * v | 0},${(153 + (r() - 0.5) * 6) * v | 0},${(150 + (r() - 0.5) * 6) * v | 0})`; g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
    speckle(g, w, h, 7142, 400, 0.05, 2);
  }, 'setts');

  A.zinc = D(256, 256, (g, w, h) => {                         // standing seams every 0.6 m (tile 1.2 m: two seams), sheets slightly different in tone
    const r = R(7151);
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x = i * 128, v = 0.94 + r() * 0.1; g.fillStyle = `rgba(${215 * v | 0},${222 * v | 0},${228 * v | 0},0.5)`; g.fillRect(x, 0, 128, h);
      g.fillStyle = 'rgba(70,78,88,0.45)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 4, 0, 3, h); g.fillStyle = 'rgba(70,78,88,0.2)'; g.fillRect(x + 7, 0, 3, h);
    }
    for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(80,88,98,0.14)'; g.fillRect(0, k * (h / 3) + r() * 20, w, 2); }
    speckle(g, w, h, 7152, 260, 0.06, 2);
  }, 'zinc');
  A.dome = D(512, 64, (g, w, h) => {                          // 32 radial panels: u around the dome, v up the profile
    const r = R(7155), n = 32, pw = w / n;
    for (let i = 0; i < n; i++) {
      const v = 0.93 + r() * 0.1; g.fillStyle = `rgb(${232 * v | 0},${237 * v | 0},${242 * v | 0})`; g.fillRect(i * pw, 0, pw, h);
      g.fillStyle = 'rgba(70,78,88,0.5)'; g.fillRect(i * pw, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(i * pw + 2, 0, 2, h);
    }
  }, 'dome');

  // ------------------------------------------------------------------------------------------ windows
  const glassBase = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a4652'); gr.addColorStop(0.5, '#27303a'); gr.addColorStop(1, '#46535f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,175,195,0.2)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
    g.fillStyle = 'rgba(235,235,230,0.22)'; g.fillRect(w * 0.1, h * 0.04, w * 0.8, h * 0.18);                    // a white curtain gathered at the top
  };
  const wood = (g, w, h, lw, bars) => {
    g.strokeStyle = C.woodWin; g.lineWidth = lw;
    g.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    for (const b of bars) { g.beginPath(); g.moveTo(b[0] * w, b[1] * h); g.lineTo(b[2] * w, b[3] * h); g.stroke(); }
  };
  /** square upper window (1.3 x 2.0 m): two leaves with a transom, brown frame */
  A.winSq = D(128, 192, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = C.woodWin; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.3); g.lineTo(w, h * 0.3); g.stroke();
    g.strokeStyle = 'rgba(176,122,58,0.6)'; g.lineWidth = 2; for (const t of [0.5, 0.7, 0.85]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
  }, 'winSq');
  /** arched ground-floor French window (2.0 x 3.6 m incl. the half-round fanlight at the top 1.0 m): u 0..1, v 0..1 */
  A.winArch = D(128, 230, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = C.woodWin; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7);
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h * 0.28); g.lineTo(w / 2, h); g.stroke();
    g.beginPath(); g.moveTo(0, h * 0.28); g.lineTo(w, h * 0.28); g.stroke();                                   // the fanlight springs here
    g.lineWidth = 3; for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; g.beginPath(); g.moveTo(w / 2, h * 0.28); g.lineTo(w / 2 + Math.cos(a) * w * 0.7, h * 0.28 - Math.sin(a) * h * 0.4); g.stroke(); }
    g.lineWidth = 3; for (const t of [0.5, 0.72]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
  }, 'winArch');
  /** the glazed double door (axis of the rotunda and the west front): taller leaves, glazing in six panes each */
  A.winDoor = D(128, 230, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = C.doorWood; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.28); g.lineTo(w / 2, h); g.moveTo(0, h * 0.28); g.lineTo(w, h * 0.28); g.stroke();
    g.lineWidth = 3.5; for (const t of [0.46, 0.64, 0.82]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
    g.fillStyle = C.doorWood; g.fillRect(0, h * 0.9, w, h * 0.1);                                                  // kick panel
    g.lineWidth = 3; for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; g.beginPath(); g.moveTo(w / 2, h * 0.28); g.lineTo(w / 2 + Math.cos(a) * w * 0.7, h * 0.28 - Math.sin(a) * h * 0.4); g.stroke(); }
  }, 'winDoor');
  /** a small square attic window (1.3 x 1.9): one leaf pair */
  A.winAttic = D(96, 144, (g, w, h) => { glassBase(g, w, h); g.strokeStyle = C.woodWin; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.35); g.lineTo(w, h * 0.35); g.stroke(); }, 'winAttic');

  // ------------------------------------------------------------------------------------------ ironwork (alpha cut-outs)
  /** the terrace balustrade: one bay 1.8 x 1.0 m (u 0..1 x v 0..1; the posts are geometry): top rail with a ring chain, X bars with rosettes, a palmette band at the foot */
  A.lattice = D(512, 280, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'round';
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.moveTo(0, h - 8); g.lineTo(w, h - 8); g.stroke();              // top and bottom rails
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 58); g.lineTo(w, 58); g.stroke();
    g.lineWidth = 6; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(21 + i * 42.5, 36, 14, 0, TAU); g.stroke(); }                   // chain of rings between the rails
    const nx = 3, bw = w / nx;
    for (let k = 0; k < nx; k++) {                                                                                                   // X bars
      const x0 = k * bw + 8, x1 = (k + 1) * bw - 8;
      g.lineWidth = 6; g.beginPath(); g.moveTo(x0, 66); g.lineTo(x1, h - 70); g.moveTo(x1, 66); g.lineTo(x0, h - 70); g.stroke();
      const cx = (x0 + x1) / 2, cy = (66 + h - 70) / 2; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
      g.lineWidth = 5; g.beginPath(); g.moveTo(k * bw, 58); g.lineTo(k * bw, h - 8); g.stroke();
    }
    g.lineWidth = 5; g.beginPath(); g.moveTo(w - 2, 58); g.lineTo(w - 2, h - 8); g.stroke();
    for (let i = 0; i < 12; i++) {                                                                                                   // palmette band
      const x = 21 + i * 42.5; g.lineWidth = 4;
      for (let t = -2; t <= 2; t++) { g.beginPath(); g.moveTo(x, h - 12); g.lineTo(x + t * 8, h - 52 + Math.abs(t) * 6); g.stroke(); }
      g.beginPath(); g.arc(x, h - 12, 6, 0, TAU); g.fill();
    }
  }, 'lattice');
  /** the planter lattice (stone-white trellis): diamonds */
  A.trellis = D(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.strokeStyle = '#ffffff'; g.lineWidth = 4;
    for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x + h - 12, h - 6); g.moveTo(x + h - 12, 6); g.lineTo(x, h - 6); g.stroke(); }
  }, 'trellis');
  /** a Rossi lantern-post panel is geometry; this is the blind half-moon with a palmette fan (alpha decal over the wall; u 0..1 over 2.2 m, v 0..1 over 1.15 m) */
  A.lunette = D(256, 140, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(244,243,238,1)'; g.strokeStyle = 'rgba(244,243,238,1)';
    g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.9); g.arc(w / 2, h * 0.9, w / 2, Math.PI, 0, false); g.lineTo(w, h); g.closePath(); g.fill();
    g.fillStyle = 'rgba(176,184,196,0.9)'; g.beginPath(); g.moveTo(8, h); g.arc(w / 2, h * 0.9, w / 2 - 8, Math.PI, 0, false); g.lineTo(w - 8, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(244,243,238,1)'; g.lineWidth = 5;
    const cx = w / 2, cy = h * 0.9, n = 15;
    for (let i = 0; i < n; i++) { const a = Math.PI * (i + 0.5) / n; g.beginPath(); g.moveTo(cx + Math.cos(a) * 14, cy - Math.sin(a) * 14); g.lineTo(cx + Math.cos(a) * (w / 2 - 20), cy - Math.sin(a) * (w / 2 - 20)); g.stroke(); g.beginPath(); g.arc(cx + Math.cos(a) * (w / 2 - 24), cy - Math.sin(a) * (w / 2 - 24), 6, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(244,243,238,1)'; g.fillRect(0, h - 10, w, 10);
  }, 'lunette');
  /** the frieze of garlands of the rotunda: swags between rosettes (tile 2.4 m x 0.8 m) */
  A.festoon = D(256, 90, (g, w, h) => {
    g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(140,146,156,0.35)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    g.strokeStyle = 'rgba(120,126,136,0.85)'; g.fillStyle = 'rgba(250,250,246,1)';
    for (let k = 0; k < 2; k++) {
      const x0 = k * 128 + 14, x1 = (k + 1) * 128 - 14;
      g.lineWidth = 9; g.beginPath(); g.moveTo(x0, 14); g.quadraticCurveTo((x0 + x1) / 2, h * 1.05, x1, 14); g.stroke();
      g.lineWidth = 6; g.strokeStyle = 'rgba(250,250,246,1)'; g.beginPath(); g.moveTo(x0, 14); g.quadraticCurveTo((x0 + x1) / 2, h * 1.05, x1, 14); g.stroke(); g.strokeStyle = 'rgba(120,126,136,0.85)';
      g.beginPath(); g.arc(k * 128 + 128, 16, 10, 0, TAU); g.fill(); g.lineWidth = 2; g.stroke();
    }
  }, 'festoon');

  /** the lamp-post glass (emissive lantern pane) is a flat colour; the stair lamp pedestal rosette: a small relief plate */
  A.rosette = D(64, 64, (g, w, h) => {
    g.fillStyle = '#c8cbd0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6f7780'; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#e4e6ea'; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.moveTo(32, 32); g.arc(32, 32, i % 2 ? 14 : 20, a, a + TAU / 12); } g.fill();
    g.fillStyle = '#7d858e'; g.beginPath(); g.arc(32, 32, 6, 0, TAU); g.fill();
  }, 'rosette');
  /** the inscription on the lion plinths: ИЗДЕЛИЕ С. П. КАЗЕННАГО ЛИТЕЙНАГО ЗАВОДА 1822 Г. (alpha decal, three lines) */
  A.plinthText = D(512, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(70,66,60,0.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'ИЗДЕЛИЕ', w / 2, h * 0.17, w * 0.3, 26, tex.FONTS.serif, 500);
    tex.fitText(g, 'С. П. КАЗЕННАГО ЛИТЕЙНАГО ЗАВОДА', w / 2, h * 0.5, w * 0.92, 30, tex.FONTS.serif, 500);
    tex.fitText(g, '1822 Г.', w / 2, h * 0.84, w * 0.2, 26, tex.FONTS.serif, 500);
  }, 'plinthText');
  return A;
}
