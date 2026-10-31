// landmarksLETI/art.js - the canvas paintings of the module (dossier docs/research/aptekarsky-2026.md 4.3, 12; photos 63 (Corpus 1 SW gable, 2009), leti/01 02 (Corpus 1 west porch and SW corner, 2015),
// 60 62 64 (Corpus 5 red brick), 61 + leti/04 (Corpus 7 archive), leti/05 06 (the plaques of Popov and Vologdin)).  Every key starts with 'lmleti-' (the texture cache is scene-wide).
//   stripe    the facade of the 1899-1903 building: bands of pale pink brick (running bond, 0.78 m) alternating with smooth pistachio-green stone bands (0.42 m): tile 2.4 m = two periods
//   stucco    smooth pistachio stucco of pilasters, string courses, window surrounds, the cornice       rust   rock-faced pink-brown granite of the plinth (tile 2.4 m)
//   seam      standing-seam sheet roof (tile 1.2 m)        dome   the maroon copper domes (u around, 24 panels)     timber  dark brown exposed timber of the gablets and the lantern
//   winA / winB / winC / winS / winR   window sheets (u, v 0..1 over the opening): small ground-floor arch, tall upper arch (transom + fan), the tripartite hall window, the tower slit, a plain rectangle
//   clock     the dial of the clock gable (alpha-free disc on a square sheet)     bal   the roof parapet (alpha cut-out: squat piers + rails)    grille  the black fence grille (alpha)
//   brick5    the orange-red brick of Corpus 5 (tile 1.2 m)   brick7  the dark red brick of the archive building with its lighter courses (tile 1.2 m)   conc  grey concrete bands
//   clad      the pale cladding panels of the Corpus 5 entrance box        ribbon  ribbon windows of Corpus 5 (dark glass, white mullions, tile 3.6 x 1.8 m)
//   word      the plain wordmark sign of the Corpus 5 entrance (text only)   plaques  one atlas of the memorial plaques (Popov, Vologdin, the Lenin plate, "Korpus 7")
const TAU = Math.PI * 2;
/** the uv rectangle [[u0,v0],[u1,v0],[u1,v1],[u0,v1]] of tile i of the plaque atlas (4 x 4, row-major from the top left) */
export const plaqueUV = (i) => { const c = i % 4, r = Math.floor(i / 4), u0 = c / 4, u1 = (c + 1) / 4, v1 = 1 - r / 4, v0 = 1 - (r + 1) / 4; return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; };
export const COL = {
  pink: '#d6b4a8', green: '#bec59f', trim: '#cbccaa', trimDark: '#b0b68f', plinth: '#8a7268', zinc: '#a6aeb1', dome: '#8e4a4c', domeHi: '#a8695f', timber: '#5f3f2e',
  frame: '#9a5c2e', glassA: '#2d3944', glassB: '#4a5c6b', brick5: '#a64a34', brick7: '#8a3426', conc: '#9d9a93', clad: '#dcd7c9', wordBlue: '#233f86', iron: '#202426', bronze: '#4b4034',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1], o = {}) => tex.draw(w, h, fn, { key: 'lmleti-' + key, repeat, ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------ the striped facade (tile 2.4 m x 2.4 m, 256 px: 107 px / m)
  A.stripe = D(256, 256, (g, w, h) => {
    const r = R(8101), per = h / 2;                                              // two periods of 1.2 m
    for (let k = 0; k < 2; k++) {
      const y0 = k * per, pinkH = per * 0.65, greenH = per - pinkH;
      // pink brick band: 10 courses of 7.5 cm, running bond, brick 0.25 m = 27 px
      g.fillStyle = '#e9d9d1'; g.fillRect(0, y0, w, pinkH);
      const bh = pinkH / 10;
      for (let c = 0; c < 10; c++) {
        const off = (c % 2) * 13.5;
        for (let x = -27; x < w; x += 27) {
          const v = 0.93 + r() * 0.12, rr = (214 * v) | 0, gg = (180 * v) | 0, bb = (168 * v) | 0;
          g.fillStyle = `rgb(${rr},${gg},${bb})`; g.fillRect(x + off + 1, y0 + c * bh + 1, 25, bh - 1.6);
        }
      }
      // pistachio band: smooth cast stone with a faint tooling line and a soft shadow under the overhang of the pink band
      g.fillStyle = '#c3c9a5'; g.fillRect(0, y0 + pinkH, w, greenH);
      g.fillStyle = 'rgba(80,84,60,0.25)'; g.fillRect(0, y0 + pinkH, w, 3);
      g.fillStyle = 'rgba(255,255,235,0.35)'; g.fillRect(0, y0 + pinkH + greenH - 3, w, 2);
      for (let i = 0; i < 4; i++) { const x = r() * w; g.fillStyle = 'rgba(90,96,70,0.20)'; g.fillRect(x, y0 + pinkH + 4, 2, greenH - 8); }
    }
    speckle(g, w, h, 8102, 500, 0.05, 2);
  }, 'stripe');

  A.stucco = D(256, 256, (g, w, h) => {
    const r = R(8111);
    g.fillStyle = '#f2f3ea'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '190,196,168' : '255,255,250'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 5; i++) { const x = r() * w; g.fillStyle = `rgba(100,96,80,${0.025 + r() * 0.03})`; g.fillRect(x, 0, 2 + r() * 6, h); }
    speckle(g, w, h, 8112, 500, 0.05, 2);
  }, 'stucco');

  A.frieze = D(256, 256, (g, w, h) => {                                           // the cast frieze under the cornice (tile 2.4 m): the carved band sits at v = 0.229 .. 0.458 (canvas rows 0.542 h .. 0.771 h): three scroll-and-leaf units per tile
    const r = R(8171);
    g.fillStyle = '#f2f3ea'; g.fillRect(0, 0, w, h);
    const y0 = h * 0.542, y1 = h * 0.771, ym = (y0 + y1) / 2;
    g.fillStyle = 'rgba(70,74,50,0.22)'; g.fillRect(0, y0, w, 3); g.fillRect(0, y1 - 3, w, 3);
    for (let k = 0; k < 3; k++) {
      const x0 = k * w / 3, cw = w / 3;
      g.strokeStyle = 'rgba(70,74,50,0.5)'; g.lineWidth = 3; g.lineCap = 'round';
      for (const s of [-1, 1]) {
        const cx = x0 + cw / 2 + s * cw * 0.2;
        g.beginPath(); g.arc(cx, ym, 11, 0, TAU * 0.85); g.stroke();
        g.beginPath(); g.arc(cx + s * 5, ym + 1, 5, 0, TAU * 0.8); g.stroke();
        g.fillStyle = 'rgba(255,255,245,0.55)'; g.beginPath(); g.arc(cx - 2, ym - 4, 3, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(cx - s * 11, ym + 2); g.quadraticCurveTo(x0 + cw / 2 - s * 6, ym + 18, x0 + cw / 2, ym + 8); g.stroke();
      }
      g.fillStyle = 'rgba(70,74,50,0.45)'; g.beginPath(); g.ellipse(x0 + cw / 2, ym, 6, 10, 0, 0, TAU); g.fill();       // the central palmette
      g.strokeStyle = 'rgba(70,74,50,0.5)'; for (let q = -2; q <= 2; q++) { g.beginPath(); g.moveTo(x0 + cw / 2, ym - 4); g.lineTo(x0 + cw / 2 + q * 5, ym - 17); g.stroke(); }
    }
    for (let i = 0; i < 180; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(40,36,32,0.05)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, 'frieze');

  A.rust = D(256, 256, (g, w, h) => {                                             // rock-faced granite blocks: courses 0.45 m, blocks 0.6 .. 1.2 m; pink-brown with darker pits
    const r = R(8121), ch = h / 5;
    g.fillStyle = '#c8b0a4'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5; k++) {
      let x = -((k * 47) % 70);
      while (x < w) {
        const bw = 60 + ((k * 5 + Math.floor(x)) % 4) * 22, v = 0.88 + r() * 0.2;
        g.fillStyle = `rgb(${(176 * v) | 0},${(150 * v) | 0},${(140 * v) | 0})`; g.fillRect(x + 2, k * ch + 2, bw - 4, ch - 4);
        for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,52,46' : '240,220,210'},${0.2 + r() * 0.2})`; g.beginPath(); g.ellipse(x + 4 + r() * (bw - 8), k * ch + 4 + r() * (ch - 8), 2 + r() * 5, 1.5 + r() * 3, r() * 3, 0, TAU); g.fill(); }
        g.fillStyle = 'rgba(40,30,28,0.65)'; g.fillRect(x, k * ch, 3, ch);
        x += bw;
      }
      g.fillStyle = 'rgba(40,30,28,0.65)'; g.fillRect(0, k * ch, w, 3);
    }
    speckle(g, w, h, 8122, 700, 0.07, 3);
  }, 'rust');

  A.seam = D(256, 256, (g, w, h) => {                                             // tile 1.2 m: seams every 0.6 m, sheet joints every 1.2 m
    const r = R(8131);
    g.fillStyle = '#f0f2f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const x = i * w / 2; g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(x, 0, w / 2, h); g.fillStyle = 'rgba(0,0,0,0.36)'; g.fillRect(x - 1.5, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x + 2, 0, 2, h); }
    g.fillStyle = 'rgba(0,0,0,0.20)'; g.fillRect(0, h - 3, w, 3);
    speckle(g, w, h, 8132, 400, 0.05, 2.4);
  }, 'seam');

  A.dome = D(512, 128, (g, w, h) => {                                             // 24 radial panels around the dome (u), a lighter crown (v up)
    const r = R(8141), n = 24, pw = w / n;
    for (let i = 0; i < n; i++) {
      const v = 0.9 + r() * 0.16; g.fillStyle = `rgb(${(236 * v) | 0},${(214 * v) | 0},${(210 * v) | 0})`; g.fillRect(i * pw, 0, pw, h);
      g.fillStyle = 'rgba(40,16,16,0.5)'; g.fillRect(i * pw, 0, 2, h); g.fillStyle = 'rgba(255,230,220,0.35)'; g.fillRect(i * pw + 2, 0, 2, h);
    }
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0.22)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,225,215,0.22)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 'dome');

  A.timber = D(128, 128, (g, w, h) => {                                           // dark brown boards (tile 0.6 m): vertical grain
    const r = R(8151);
    g.fillStyle = '#e6dcd4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = i * w / 6, v = 0.9 + r() * 0.15; g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.5})`; g.fillRect(x, 0, w / 6, h); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + w / 6 - 2, 0, 2, h); }
    speckle(g, w, h, 8152, 160, 0.08, 2);
  }, 'timber');

  // ------------------------------------------------------------------------------------------ window sheets (u, v 0..1 over the opening; the painted frame is the sash, not the surround)
  const glass = (g, x, y, w, h, k = 1) => {
    const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h); gr.addColorStop(0, `rgb(${(74 * k) | 0},${(94 * k) | 0},${(112 * k) | 0})`); gr.addColorStop(0.45, `rgb(${(40 * k) | 0},${(54 * k) | 0},${(68 * k) | 0})`); gr.addColorStop(1, `rgb(${(58 * k) | 0},${(72 * k) | 0},${(86 * k) | 0})`);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(190,210,225,0.18)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.55, y); g.lineTo(x, y + h * 0.5); g.closePath(); g.fill();
  };
  const sash = (g, w, h, lw, vs, hs, arch = 0) => {                              // frame + vertical bars at fractions vs + transoms at fractions hs; arch = the fraction of the height taken by the round head
    g.strokeStyle = C.frame; g.lineWidth = lw; g.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    g.lineWidth = lw * 0.7;
    for (const f of vs) { g.beginPath(); g.moveTo(w * f, 0); g.lineTo(w * f, h); g.stroke(); }
    for (const f of hs) { g.beginPath(); g.moveTo(0, h * f); g.lineTo(w, h * f); g.stroke(); }
    if (arch > 0) {
      const cy = h * arch, n = 6; g.lineWidth = lw * 0.55;
      for (let i = 1; i < n; i++) { const a = Math.PI * i / n; g.beginPath(); g.moveTo(w / 2, cy); g.lineTo(w / 2 + Math.cos(a) * w / 2, cy - Math.sin(a) * cy); g.stroke(); }
      g.lineWidth = lw * 0.6; g.beginPath(); g.ellipse(w / 2, cy, w * 0.28, cy * 0.56, 0, Math.PI, 0); g.stroke();
    }
    g.lineWidth = lw * 0.28; g.strokeStyle = 'rgba(154,92,46,0.8)';                // fine muntins
    const nv = Math.max(2, Math.round(w / 22)), nh = Math.max(3, Math.round(h / 24));
    for (let i = 1; i < nv; i++) { g.beginPath(); g.moveTo(w * i / nv, h * arch); g.lineTo(w * i / nv, h); g.stroke(); }
    for (let i = 1; i < nh; i++) { const y = h * (arch + (1 - arch) * i / nh); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  };
  A.winA = D(128, 224, (g, w, h) => { glass(g, 0, 0, w, h, 1); sash(g, w, h, 10, [0.5], [0.34], 0.30); }, 'winA');                 // ground floor: a 1.6 x 3.0 m arch
  A.winB = D(128, 320, (g, w, h) => { glass(g, 0, 0, w, h, 0.95); sash(g, w, h, 9, [0.5], [0.22, 0.52], 0.24); }, 'winB');          // tall upper arch 2.1 x 5.0 m: a fan head, two transoms
  A.winC = D(256, 320, (g, w, h) => {                                                                                                  // the tripartite hall window: a central tall light and two lower side lights
    glass(g, 0, 0, w, h, 0.95);
    g.strokeStyle = C.frame; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.lineWidth = 11; g.beginPath(); g.moveTo(w * 0.31, h * 0.22); g.lineTo(w * 0.31, h); g.moveTo(w * 0.69, h * 0.22); g.lineTo(w * 0.69, h); g.stroke();
    g.lineWidth = 6; for (const f of [0.40, 0.62, 0.80]) { g.beginPath(); g.moveTo(0, h * f); g.lineTo(w, h * f); g.stroke(); }
    g.lineWidth = 3.5; for (const f of [0.155, 0.5, 0.845]) { const x = w * f; g.beginPath(); g.moveTo(x, h * 0.25); g.lineTo(x, h); g.stroke(); }
    g.lineWidth = 5; g.beginPath(); g.arc(w * 0.5, h * 0.3, w * 0.15, Math.PI, 0); g.stroke();
  }, 'winC');
  A.winS = D(32, 96, (g, w, h) => { glass(g, 0, 0, w, h, 0.9); g.strokeStyle = C.frame; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, h - 5); g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.4); g.lineTo(w, h * 0.4); g.stroke(); }, 'winS');
  A.door = D(128, 256, (g, w, h) => {                                             // the double door of the porch under an arched fanlight (u, v 0..1 over the arch opening 2.5 x 3.9 m)
    const r = R(8161);
    g.fillStyle = '#3b2a20'; g.fillRect(0, 0, w, h);
    const fh = h * 0.27;                                                          // fanlight: glass with fan bars
    glass(g, 6, 6, w - 12, fh, 0.8); g.strokeStyle = '#4a3326'; g.lineWidth = 3;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(w / 2, fh + 6); g.lineTo(w / 2 + Math.cos(Math.PI * i / 6) * w / 2, fh + 6 - Math.sin(Math.PI * i / 6) * fh); g.stroke(); }
    for (let k = 0; k < 2; k++) {                                                 // two leaves with two raised panels each
      const x0 = 8 + k * (w / 2 - 4), lw = w / 2 - 12;
      g.fillStyle = '#5a3d2b'; g.fillRect(x0, fh + 14, lw, h - fh - 22);
      for (const [y0, y1] of [[fh + 24, fh + (h - fh) * 0.46], [fh + (h - fh) * 0.52, h - 18]]) { g.fillStyle = '#4a3123'; g.fillRect(x0 + 6, y0, lw - 12, y1 - y0); g.strokeStyle = '#7a5a40'; g.lineWidth = 2; g.strokeRect(x0 + 6, y0, lw - 12, y1 - y0); }
    }
    g.fillStyle = '#c7a54c'; for (const x of [w / 2 - 9, w / 2 + 9]) g.fillRect(x - 2, h * 0.62, 4, 14);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,200,0.06)' : 'rgba(0,0,0,0.1)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 8 + r() * 24); }
  }, 'door');
  A.winR = D(128, 160, (g, w, h) => { glass(g, 0, 0, w, h, 1); sash(g, w, h, 9, [0.5], [0.3], 0); }, 'winR');
  A.winW = D(128, 160, (g, w, h) => {                                                                                                // a plain white-framed modern window (the red-brick corpora)
    glass(g, 0, 0, w, h, 1.05); g.strokeStyle = '#dcd8cc'; g.lineWidth = 9; g.strokeRect(4.5, 4.5, w - 9, h - 9);
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.28); g.lineTo(w, h * 0.28); g.stroke();
  }, 'winW');

  // ------------------------------------------------------------------------------------------ the clock dial (a 1.7 m square sheet: the disc 1.5 m)
  A.clock = D(256, 256, (g, w, h) => {
    g.fillStyle = '#c7c9a8'; g.fillRect(0, 0, w, h);                                     // the stone square behind the dial
    g.fillStyle = '#6b6a58'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, TAU); g.fill();
    g.fillStyle = '#f1efe4'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.43, 0, TAU); g.fill();
    g.strokeStyle = '#2a2a28'; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, c = Math.cos(a), s = Math.sin(a); g.lineWidth = i % 3 === 0 ? 7 : 4; g.beginPath(); g.moveTo(w / 2 + c * w * 0.34, h / 2 + s * h * 0.34); g.lineTo(w / 2 + c * w * 0.40, h / 2 + s * h * 0.40); g.stroke(); }
    g.lineWidth = 9; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(-2.2) * w * 0.20, h / 2 + Math.sin(-2.2) * h * 0.20); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(0.1) * w * 0.32, h / 2 + Math.sin(0.1) * h * 0.32); g.stroke();
    g.fillStyle = '#2a2a28'; g.beginPath(); g.arc(w / 2, h / 2, 7, 0, TAU); g.fill();
  }, 'clock');

  // ------------------------------------------------------------------------------------------ alpha cut-outs
  A.bal = D(256, 128, (g, w, h) => {                                              // the roof parapet (tile 2.0 m x 1.0 m): squat piers every 0.5 m between a base rail and a top rail
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    g.fillRect(0, h - 20, w, 20); g.fillRect(0, 6, w, 16);
    for (let i = 0; i < 4; i++) { const x = i * 64 + 14; g.fillRect(x, 20, 36, h - 38); g.fillRect(x - 5, 20, 46, 8); g.fillRect(x - 5, h - 32, 46, 12); }
  }, 'bal');
  A.grille = D(256, 128, (g, w, h) => {                                           // the black fence grille between the pale piers (tile 3.0 m x 1.5 m): bars every 0.12 m, rings on the middle rail, spear tips
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    for (let x = 5; x < w; x += 10) { g.fillRect(x - 1.5, 14, 3, h - 18); g.beginPath(); g.moveTo(x - 4, 14); g.lineTo(x, 3); g.lineTo(x + 4, 14); g.fill(); }
    g.fillRect(0, 22, w, 5); g.fillRect(0, h - 22, w, 5); g.lineWidth = 3.5;
    for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(11 + i * 21.3, 52, 9, 0, TAU); g.stroke(); }
  }, 'grille');

  // ------------------------------------------------------------------------------------------ the red-brick corpora
  const brick = (key, seed, base, tones, mortar, bw = 28, bhN = 16) => D(256, 256, (g, w, h) => {
    const r = R(seed), bh = h / bhN;
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    for (let c = 0; c < bhN; c++) {
      const off = (c % 2) * bw / 2;
      for (let x = -bw; x < w; x += bw) {
        const t = tones[(r() * tones.length) | 0], v = 0.9 + r() * 0.2;
        g.fillStyle = t; g.globalAlpha = 1; g.fillRect(x + off + 1, c * bh + 1, bw - 2, bh - 2);
        g.fillStyle = v > 1 ? 'rgba(255,230,210,' + (v - 1) * 0.9 + ')' : 'rgba(0,0,0,' + (1 - v) * 0.9 + ')'; g.fillRect(x + off + 1, c * bh + 1, bw - 2, bh - 2);
      }
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,230,0.10)' : 'rgba(30,10,10,0.14)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
    void base;
  }, key);
  A.brick5 = brick('brick5', 8201, C.brick5, ['#b04d36', '#a54430', '#b85a3e', '#9c3f2e', '#b24e38'], '#b9a79a');
  A.brick7 = brick('brick7', 8211, C.brick7, ['#8f3427', '#7c2a1f', '#9a3a2a', '#6f261c', '#85301f', '#a14630'], '#8e7a6a', 28, 16);
  A.conc = D(256, 256, (g, w, h) => {
    const r = R(8221);
    g.fillStyle = '#d8d6d0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,118,112' : '255,255,250'},${0.05 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 14, 2 + r() * 8, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(70,68,64,0.45)'; g.fillRect(0, h / 2 - 1.5, w, 3);
    speckle(g, w, h, 8222, 600, 0.07, 2);
  }, 'conc');
  A.clad = D(256, 256, (g, w, h) => {                                             // pale panels 0.6 x 1.2 m with joints (tile 2.4 m: 4 x 2)
    const r = R(8231);
    g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { const v = 0.95 + r() * 0.08; g.fillStyle = `rgb(${(226 * v) | 0},${(221 * v) | 0},${(207 * v) | 0})`; g.fillRect(i * 64 + 1.5, j * 128 + 1.5, 61, 125); }
    g.fillStyle = 'rgba(80,76,66,0.55)'; for (let i = 0; i <= 4; i++) g.fillRect(i * 64 - 1.5, 0, 3, h); for (let j = 0; j <= 2; j++) g.fillRect(0, j * 128 - 1.5, w, 3);
    speckle(g, w, h, 8232, 300, 0.05, 2);
  }, 'clad');
  A.ribbon = D(256, 128, (g, w, h) => {                                           // a ribbon window band (3.6 x 1.8 m): dark glass between white mullions every 1.2 m, a light sill band, a grey lintel
    g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, w, h);
    glass(g, 4, 10, w - 8, h - 30, 1);
    g.fillStyle = '#e4e1d6'; for (let i = 0; i <= 3; i++) g.fillRect(i * w / 3 - 3, 8, 6, h - 26);
    g.fillRect(0, 8, w, 4); g.fillRect(0, h - 22, w, 4);
    g.fillStyle = '#8f8c85'; g.fillRect(0, h - 18, w, 18);
  }, 'ribbon');

  // ------------------------------------------------------------------------------------------ Corpus 5 storey tiles (3.6 m wide x 3.3 m high = one storey, the floor line at the bottom of the tile; photos 60 62 64 B8)
  const brickRect = (g, x0, y0, w, h, r, bw, bh, tones = ['#b04d36', '#a54430', '#b85a3e', '#9c3f2e', '#b24e38'], mortar = '#b9a79a') => {
    g.fillStyle = mortar; g.fillRect(x0, y0, w, h);
    const rows = Math.ceil(h / bh);
    for (let c = 0; c < rows; c++) {
      const off = (c % 2) * bw / 2;
      for (let x = -bw; x < w; x += bw) {
        const t = tones[(r() * tones.length) | 0], v = 0.92 + r() * 0.16;
        const xx = Math.max(0, x + off), ww = Math.min(w, x + off + bw) - xx, yy = c * bh, hh = Math.min(bh, h - yy);
        if (ww <= 1 || hh <= 1) continue;
        g.fillStyle = t; g.fillRect(x0 + xx + 0.6, y0 + yy + 0.6, ww - 1.2, hh - 1.2);
        g.fillStyle = v > 1 ? 'rgba(255,230,210,' + (v - 1) * 0.9 + ')' : 'rgba(0,0,0,' + (1 - v) * 0.9 + ')'; g.fillRect(x0 + xx + 0.6, y0 + yy + 0.6, ww - 1.2, hh - 1.2);
      }
    }
  };
  const c5glass = (g, x, y, w, h) => { glass(g, x, y, w, h, 1.0); g.fillStyle = 'rgba(210,225,235,0.10)'; g.fillRect(x, y, w, h * 0.18); };
  A.c5A = D(512, 512, (g, w, h) => {                                              // wings with ribbon windows: spandrel, glass ribbon with pale mullions every 0.9 m, a grey lintel strip, the brick course band
    const r = R(8301), py = (m) => h - m / 3.3 * h, px = (m) => m / 3.6 * w;      // metres above the floor line / along the tile -> pixels
    brickRect(g, 0, 0, w, h, r, 18, 6.5);
    g.fillStyle = '#9d9a93'; g.fillRect(0, py(0.34), w, py(0) - py(0.34));                                // the grey concrete sill band
    c5glass(g, 0, py(1.88), w, py(0.34) - py(1.88));
    g.fillStyle = '#e1ded3'; for (let i = 0; i <= 4; i++) g.fillRect(px(i * 0.9) - 3.5, py(1.88), 7, py(0.34) - py(1.88));
    g.fillRect(0, py(0.34) - 4, w, 4); g.fillRect(0, py(1.88), w, 4);
    g.fillStyle = '#8d8a83'; g.fillRect(0, py(2.28), w, py(1.88) - py(2.28));                              // the grey lintel band
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, py(2.28), w, 3); g.fillRect(0, py(0.34) - 3, w, 3);
    speckle(g, w, h, 8302, 500, 0.06, 2.5);
  }, 'c5A');
  A.c5B = D(512, 512, (g, w, h) => {                                              // wings with punched window pairs between narrow brick strips (photos B8 / 62): 3 pairs per tile, white frames, grey sills and lintels
    const r = R(8311), py = (m) => h - m / 3.3 * h, px = (m) => m / 3.6 * w;
    brickRect(g, 0, 0, w, h, r, 18, 6.5);
    for (let i = 0; i < 3; i++) {
      const cx = 0.6 + i * 1.2;
      for (const dx of [-0.19, 0.19]) {
        const x0 = px(cx + dx - 0.15), ww = px(0.30), y0 = py(1.95), hh = py(0.65) - py(1.95);
        c5glass(g, x0, y0, ww, hh); g.strokeStyle = '#e1ded3'; g.lineWidth = 4.5; g.strokeRect(x0 + 2, y0 + 2, ww - 4, hh - 4);
        g.beginPath(); g.moveTo(x0, y0 + hh * 0.35); g.lineTo(x0 + ww, y0 + hh * 0.35); g.stroke();
      }
      g.fillStyle = '#9d9a93'; g.fillRect(px(cx - 0.42), py(0.65), px(0.84), py(0.5) - py(0.65)); g.fillRect(px(cx - 0.42), py(2.12), px(0.84), py(1.95) - py(2.12));
    }
    g.fillStyle = '#9d9a93'; g.fillRect(0, py(0.1), w, py(0) - py(0.1)); g.fillRect(0, py(3.3), w, py(3.2) - py(3.3));
    speckle(g, w, h, 8312, 500, 0.06, 2.5);
  }, 'c5B');
  A.c5S = D(256, 512, (g, w, h) => {                                              // a plain brick strip with a single tall slot window (round towers / pylons; tile 1.8 m x 3.3 m)
    const r = R(8321), py = (m) => h - m / 3.3 * h;
    brickRect(g, 0, 0, w, h, r, 18, 6.5);
    c5glass(g, w * 0.36, py(2.3), w * 0.28, py(0.9) - py(2.3)); g.strokeStyle = '#e1ded3'; g.lineWidth = 4; g.strokeRect(w * 0.36 + 2, py(2.3) + 2, w * 0.28 - 4, py(0.9) - py(2.3) - 4);
    g.fillStyle = '#9d9a93'; g.fillRect(w * 0.3, py(0.9), w * 0.4, 8); g.fillRect(w * 0.3, py(2.3) - 8, w * 0.4, 8);
    speckle(g, w, h, 8322, 300, 0.06, 2.5);
  }, 'c5S');
  A.c5T = D(512, 512, (g, w, h) => {                                              // the north tower of Corpus 5 (photos 62 / leti/14), tile 4.0 m x 3.3 m: a heavy brick pilaster (0.8 m, shaded edge), two bays of narrow slot windows with grey sills and lintels
    const r = R(8331), py = (m) => h - m / 3.3 * h, px = (m) => m / 4.0 * w;
    brickRect(g, 0, 0, w, h, r, 18, 6.5);
    g.fillStyle = 'rgba(70,24,16,0.22)'; g.fillRect(0, 0, px(0.8), h);                                       // the pilaster: a darker flank with a shadow line on its right
    g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(px(0.8), 0, 5, h); g.fillStyle = 'rgba(255,225,200,0.16)'; g.fillRect(0, 0, 4, h);
    for (const cx of [1.65, 3.05]) {
      const x0 = px(cx - 0.3), ww = px(0.6), y0 = py(2.35), hh = py(0.85) - py(2.35);
      c5glass(g, x0, y0, ww, hh); g.strokeStyle = '#e1ded3'; g.lineWidth = 4; g.strokeRect(x0 + 2, y0 + 2, ww - 4, hh - 4);
      g.beginPath(); g.moveTo(x0, y0 + hh * 0.3); g.lineTo(x0 + ww, y0 + hh * 0.3); g.stroke();
    }
    g.fillStyle = '#9d9a93'; g.fillRect(px(0.95), py(0.85), px(3.05), py(0.6) - py(0.85)); g.fillRect(px(0.95), py(2.6), px(3.05), py(2.35) - py(2.6));   // sill and lintel strips across the two bays
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px(0.95), py(0.6), px(3.05), 3); g.fillRect(px(0.95), py(2.35), px(3.05), 3);
    speckle(g, w, h, 8332, 500, 0.06, 2.5);
  }, 'c5T');
  A.c5glassDoor = D(256, 128, (g, w, h) => {                                      // the dark glass entrance front of Corpus 5: four door leaves, a transom, steel frames (tile 5.6 m x 3 m of the portal)
    glass(g, 0, 0, w, h, 0.85); g.strokeStyle = '#b9bcbd'; g.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { const x = i * w / 4; g.beginPath(); g.moveTo(Math.min(w - 2, Math.max(2, x)), 0); g.lineTo(Math.min(w - 2, Math.max(2, x)), h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h * 0.28); g.lineTo(w, h * 0.28); g.stroke();
    g.fillStyle = 'rgba(255,214,120,0.25)'; for (const f of [0.18, 0.82]) { g.beginPath(); g.arc(w * f, h * 0.55, 6, 0, TAU); g.fill(); }
    g.strokeRect(2, 2, w - 4, h - 4);
  }, 'c5glassDoor');

  // ------------------------------------------------------------------------------------------ Corpus 7 storey tile (3.6 m x 3.6 m; photos 04 61): dark red brick, two narrow windows with white sloped sills and brick lintels, a dentil frieze under the storey top
  A.c7 = D(512, 512, (g, w, h) => {
    const r = R(8401), py = (m) => h - m / 3.6 * h, px = (m) => m / 3.6 * w;
    brickRect(g, 0, 0, w, h, r, 18, 6.5, ['#8f3427', '#7c2a1f', '#9a3a2a', '#6f261c', '#85301f', '#a14630'], '#8e7a6a');
    for (const cx of [0.95, 2.65]) {
      const x0 = px(cx - 0.4), ww = px(0.8), y0 = py(2.5), hh = py(0.7) - py(2.5);
      g.fillStyle = '#6a2418'; g.fillRect(x0 - 5, y0 - 9, ww + 10, 10);                                   // the brick lintel (a darker course)
      glass(g, x0, y0, ww, hh, 0.95); g.strokeStyle = '#d8d3c6'; g.lineWidth = 5; g.strokeRect(x0 + 2.5, y0 + 2.5, ww - 5, hh - 5);
      g.beginPath(); g.moveTo(x0 + ww / 2, y0); g.lineTo(x0 + ww / 2, y0 + hh); g.moveTo(x0, y0 + hh * 0.3); g.lineTo(x0 + ww, y0 + hh * 0.3); g.stroke();
      g.fillStyle = '#dcd8cb'; g.fillRect(x0 - 6, py(0.7), ww + 12, 9); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 - 6, py(0.7) + 9, ww + 12, 3);
    }
    g.fillStyle = '#6f261c'; g.fillRect(0, py(3.6), w, py(3.18) - py(3.6));                                // the dentil frieze: dark band with pale dentils every 0.18 m
    g.fillStyle = '#a14630'; for (let x = 0; x < w; x += px(0.18)) g.fillRect(x + 2, py(3.52), px(0.09), py(3.28) - py(3.52));
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, py(3.18), w, 3);
    speckle(g, w, h, 8402, 500, 0.07, 2.5);
  }, 'c7');
  A.c7base = D(256, 256, (g, w, h) => {                                           // the semi-basement of Corpus 7: small barred windows in a darker, heavier brick (tile 3.6 m x 2.4 m)
    const r = R(8411);
    brickRect(g, 0, 0, w, h, r, 14, 5.5, ['#7a2c20', '#6f261c', '#85301f', '#5f2218'], '#8a7666');
    for (const cx of [0.28, 0.72]) { const x0 = w * cx - 16, y0 = h * 0.30; glass(g, x0, y0, 32, h * 0.38, 0.8); g.strokeStyle = '#26282a'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x0 + i * 8, y0); g.lineTo(x0 + i * 8, y0 + h * 0.38); g.stroke(); } g.fillStyle = '#d8d3c6'; g.fillRect(x0 - 5, y0 + h * 0.38, 42, 6); }
    speckle(g, w, h, 8412, 200, 0.07, 2.5);
  }, 'c7base');

  // ------------------------------------------------------------------------------------------ Corpus D: cream stucco professors' house [E] (tile 3.6 m x 3.6 m: a rusticated base course, a window axis, a cornice line)
  A.dwall = D(256, 256, (g, w, h) => {
    const r = R(8421);
    g.fillStyle = '#e9c690'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 30; g.fillStyle = `rgba(${r() < 0.5 ? '190,176,140' : '255,252,240'},${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * TAU, 0, TAU); g.fill(); }
    speckle(g, w, h, 8422, 400, 0.05, 2);
  }, 'dwall');
  A.drust = D(256, 256, (g, w, h) => {                                            // the rusticated ground floor: horizontal grooves every 0.6 m (tile 2.4 m), broken joints
    const r = R(8431);
    g.fillStyle = '#e0b97d'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(80,66,44,0.35)'; g.fillRect(0, k * h / 4, w, 3); g.fillStyle = 'rgba(255,250,235,0.35)'; g.fillRect(0, k * h / 4 + 3, w, 2); for (let x = (k % 2) * w / 4; x < w; x += w / 2) { g.fillStyle = 'rgba(80,66,44,0.3)'; g.fillRect(x, k * h / 4, 2, h / 4); } }
    speckle(g, w, h, 8432, 300, 0.05, 2);
  }, 'drust');

  // ------------------------------------------------------------------------------------------ plain wordmark of the Corpus 5 entrance (text only, no emblem)
  A.word = D(1024, 256, (g, w, h) => {                                             // letters only (alpha cut-out): the plain wordmark sits directly on the cladding of the portal band
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.wordBlue; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'СПбГЭТУ «ЛЭТИ»', w / 2, h * 0.36, w * 0.86, 124, tex.FONTS.sans, 700);
    tex.fitText(g, 'ПЕРВЫЙ ЭЛЕКТРОТЕХНИЧЕСКИЙ', w / 2, h * 0.72, w * 0.86, 60, tex.FONTS.sans, 600);
  }, 'word');

  // ------------------------------------------------------------------------------------------ the plaques (atlas 512 x 512: four plates of 256 x 256, v 0.5..1 top row, 0..0.5 bottom row)
  const plaque = (g, x, y, w, h, stone, lines, ink = '#2b2a28') => {
    g.fillStyle = stone; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + h - 6, w, 6); g.fillRect(x + w - 5, y, 5, h);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, w, 4); g.fillRect(x, y, 4, h);
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length, lh = (h - 28) / n;
    lines.forEach((ln, i) => tex.fitText(g, ln[0], x + w / 2, y + 14 + lh * (i + 0.5), w - 34, ln[1], tex.FONTS.serif, ln[2] || 600));
    g.fillStyle = '#26262a'; for (const [dx, dy] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x + dx, y + dy, 4, 0, TAU); g.fill(); }
  };
  A.plaques = D(1024, 1024, (g, w, h) => {                                       // 4 x 4 tiles of 256 px, tile (col, row) counted from the top left; plaqueUV(i) gives the uv rectangle of tile i = row * 4 + col
    g.fillStyle = '#9a9488'; g.fillRect(0, 0, w, h);
    const T = (i, ...a) => { const x = (i % 4) * 256, y = Math.floor(i / 4) * 256; plaque(g, x, y, 256, 256, ...a); };
    T(0, '#e4dfd0', [['ИЗОБРЕТАТЕЛЬ', 17], ['РАДИО', 17], ['ПРОФЕССОР', 17], ['АЛЕКСАНДР', 17], ['СТЕПАНОВИЧ', 17], ['ПОПОВ', 27, 700], ['в 1905 году был', 14], ['первым выборным', 14], ['директором', 14], ['этого института', 14]]);
    T(1, '#e4dfd0', [['Здесь', 15], ['с 1924 г. по 1953 г.', 14], ['работал', 15], ['выдающийся', 15], ['советский учёный,', 15], ['профессор', 15], ['ВАЛЕНТИН', 17], ['ПЕТРОВИЧ', 17], ['ВОЛОГДИН', 25, 700]]);
    T(2, '#6f6c68', [['В этом институте', 15], ['В. И. Ленин', 16, 700], ['в 1905-1907 гг.', 15], ['скрывался от', 14], ['полицейских властей', 14], ['царского правительства.', 14], ['Здесь он читал лекции', 13], ['по историческому', 13], ['материализму в социал-', 13], ['демократическом кружке', 13], ['студентов', 13]], '#e9e5da');
    T(3, '#6f6c68', [['Здесь в этом институте', 12], ['с 1907 по 1949 год', 12], ['работал крупнейший', 12], ['советский энергетик,', 12], ['участник разработки', 12], ['Ленинского плана ГОЭРЛО,', 11], ['автор проектов и', 12], ['руководитель строительства', 11], ['Волховской и Нижне-Свирской', 10], ['гидроэлектростанции,', 11], ['академик', 12], ['ГРАФТИО Г. О.', 16, 700], ['(1869-1949 гг.)', 12]], '#e9e5da');
    T(4, '#e1ddd1', [['КОРПУС', 30, 700], ['7', 96, 700]]);
    T(5, '#2e2b28', [['Александру', 24, 700], ['Степановичу', 24, 700], ['Попову', 30, 700]], '#d9c58a');
    T(6, '#2e2b28', [['Профессор', 22, 600], ['Валентин Петрович', 20, 700], ['ВОЛОГДИН', 28, 700], ['1881-1953', 22, 600]], '#d9c58a');
    T(7, '#3a3733', [['Памятник студентам', 17], ['и сотрудникам ЛЭТИ,', 17], ['погибшим во время', 17], ['войны', 22, 700]], '#d9c58a');
  }, 'plaques', [1, 1]);
  return A;
}
