// landmarksMariinsky/reliefs.js - white stucco relief textures (alpha cut-outs) for the cartouches, trophy panels, friezes and garlands of the Nevsky houses.
// Drawn in light stucco (#f3eee2) with a soft shade offset so that they read as relief on a yellow / pink wall.  No flags or banners (user rule): trophies show shields, helmets,
// crossed swords, spears and cannon barrels only.
const W = '#f3eee2', S = '#c4baa6';

const shadow = (g, fn) => { g.save(); g.translate(3, 3); g.fillStyle = S; g.strokeStyle = S; fn(); g.restore(); g.fillStyle = W; g.strokeStyle = W; fn(); };

export function makeReliefs(K) {
  const tex = K.ctx.tex, T = K.ctx.mat.toon;
  const mk = (key, w, h, fn) => {
    const map = tex.draw(w, h, (g) => { g.clearRect(0, 0, w, h); fn(g, w, h); }, { key: 'lmM-rel-' + key, repeat: [1, 1] });
    const m = T('#ffffff', { map, alphaTest: 0.45, side: 'double', name: 'lmM-rel-' + key });
    K.decalMats.add(m); return m;
  };
  const R = {};
  /** military trophy: round shield, crossed swords and spears, helmet on top, laurel sprigs (square 256) */
  R.trophy = mk('trophy', 256, 256, (g) => {
    shadow(g, () => {
      g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(40, 40); g.lineTo(216, 216); g.moveTo(216, 40); g.lineTo(40, 216); g.stroke();             // crossed swords
      g.lineWidth = 6; g.beginPath(); g.moveTo(128, 18); g.lineTo(128, 238); g.stroke();                                // spear
      g.beginPath(); g.moveTo(128, 6); g.lineTo(118, 30); g.lineTo(138, 30); g.closePath(); g.fill();                    // spear head
      g.beginPath(); g.arc(128, 132, 56, 0, Math.PI * 2); g.fill();                                                     // shield
      g.beginPath(); g.arc(128, 70, 26, Math.PI, 0); g.lineTo(154, 92); g.lineTo(102, 92); g.closePath(); g.fill();     // helmet
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(52 + i * 6, 214 - i * 24, 18, 7, -0.9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(204 - i * 6, 214 - i * 24, 18, 7, 0.9, 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = S; g.beginPath(); g.arc(128, 132, 38, 0, Math.PI * 2); g.fill(); g.fillStyle = W; g.beginPath(); g.arc(128, 132, 26, 0, Math.PI * 2); g.fill();
  });
  /** long frieze panel: a laurel garland with ribbons and rosettes (2 : 1 strip, 512 x 128) */
  R.frieze = mk('frieze', 512, 128, (g) => {
    shadow(g, () => {
      g.lineWidth = 5;
      g.beginPath(); for (let x = 0; x <= 512; x += 8) { const y = 64 + Math.sin(x / 512 * Math.PI * 6) * 26; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
      for (let i = 0; i < 24; i++) { const x = i * 21.5 + 6, y = 64 + Math.sin(x / 512 * Math.PI * 6) * 26; g.beginPath(); g.ellipse(x, y - 8, 11, 5, -0.5 + (i % 2) * 1.0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(x, y + 8, 11, 5, 0.5 - (i % 2) * 1.0, 0, Math.PI * 2); g.fill(); }
      for (const cx of [64, 192, 320, 448]) { g.beginPath(); g.arc(cx, 64 + Math.sin(cx / 512 * Math.PI * 6) * 26, 15, 0, Math.PI * 2); g.fill(); }
    });
  });
  /** oval cartouche with a shield and acanthus scrolls (256 x 256): window pediments, keystones */
  R.cartouche = mk('cartouche', 256, 256, (g) => {
    shadow(g, () => {
      g.beginPath(); g.ellipse(128, 128, 54, 70, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 12; g.beginPath(); g.ellipse(128, 128, 82, 100, 0, 0, Math.PI * 2); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(128 + s * 100, 90, 24, 12, s * 0.9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(128 + s * 100, 170, 24, 12, -s * 0.9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(128 + s * 112, 128, 14, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.ellipse(128, 24, 30, 14, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(128, 232, 30, 14, 0, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = S; g.beginPath(); g.ellipse(128, 128, 36, 50, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = W; g.beginPath(); g.ellipse(128, 128, 24, 36, 0, 0, Math.PI * 2); g.fill();
  });
  /** scroll with a shell (hood ornament over a window, 256 x 128) */
  R.shell = mk('shell', 256, 128, (g) => {
    shadow(g, () => {
      g.beginPath(); g.moveTo(128, 8); for (let i = 0; i <= 16; i++) { const a = Math.PI - i / 16 * Math.PI; g.lineTo(128 + Math.cos(a) * 70, 100 - Math.sin(a) * 84); } g.closePath(); g.fill();
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(128 + s * 98, 70, 28, 13, s * 0.7, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(128 + s * 124, 98, 10, 0, Math.PI * 2); g.fill(); }
      g.fillRect(40, 108, 176, 12);
    });
    g.strokeStyle = S; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const a = Math.PI - (i + 0.5) / 7 * Math.PI; g.beginPath(); g.moveTo(128, 100); g.lineTo(128 + Math.cos(a) * 66, 100 - Math.sin(a) * 80); g.stroke(); }
  });
  /** capital / bracket: acanthus tuft (128 x 128), for pilaster tops and consoles */
  R.acanthus = mk('acanthus', 128, 128, (g) => {
    shadow(g, () => {
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(64 + i * 14, 70 - Math.abs(i) * 4, 9, 40 - Math.abs(i) * 6, i * 0.18, 0, Math.PI * 2); g.fill(); }
      g.fillRect(8, 104, 112, 12);
    });
  });
  /** coat of arms medallion for a pediment (256 x 256): shield + crown + palm branches (generic, not a flag) */
  R.coat = mk('coat', 256, 256, (g) => {
    shadow(g, () => {
      g.beginPath(); g.moveTo(80, 90); g.lineTo(176, 90); g.lineTo(176, 150); g.quadraticCurveTo(176, 210, 128, 232); g.quadraticCurveTo(80, 210, 80, 150); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(88, 80); g.lineTo(88, 44); g.lineTo(108, 62); g.lineTo(128, 30); g.lineTo(148, 62); g.lineTo(168, 44); g.lineTo(168, 80); g.closePath(); g.fill();
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(128 + s * (62 + i * 4), 214 - i * 24, 17, 6, s * (0.9 + i * 0.05), 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = S; g.fillRect(100, 110, 56, 8); g.fillRect(100, 134, 56, 8); g.fillRect(124, 110, 8, 70);
  });
  /** a plain sunk panel border (rectangle frame) used as a stucco panel (128 x 128, stretched) */
  R.panel = mk('panel', 128, 128, (g) => {
    g.fillStyle = W; g.fillRect(0, 0, 128, 128); g.clearRect(10, 10, 108, 108); g.fillStyle = S; g.fillRect(10, 10, 108, 5); g.fillRect(10, 10, 5, 108);
  });
  /** mascaron: a bearded / leafy face in a keystone panel (the masks over the arched windows of the Mariinsky portico, 128 x 128) */
  R.mascaron = mk('mascaron', 128, 128, (g) => {
    shadow(g, () => {
      g.beginPath(); g.ellipse(64, 60, 22, 28, 0, 0, Math.PI * 2); g.fill();                                           // face
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 34, 40, 20, 9, s * 0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(64 + s * 40, 62, 18, 8, s * 0.2, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(64 + s * 34, 86, 18, 8, -s * 0.5, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.ellipse(64, 20, 26, 10, 0, 0, Math.PI * 2); g.fill();                                           // hair crown
      g.beginPath(); g.ellipse(64, 100, 14, 16, 0, 0, Math.PI * 2); g.fill();                                          // beard
    });
    g.fillStyle = S; g.beginPath(); g.ellipse(54, 54, 5, 3, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(74, 54, 5, 3, 0, 0, Math.PI * 2); g.fill(); g.fillRect(60, 62, 8, 14); g.fillRect(56, 82, 16, 4);
  });
  /** round medallion with a rosette (frieze above the columns, 128 x 128) */
  R.medallion = mk('medallion', 128, 128, (g) => {
    shadow(g, () => {
      g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.ellipse(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, 8, 4, a, 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = S; g.beginPath(); g.arc(64, 64, 20, 0, Math.PI * 2); g.fill(); g.fillStyle = W; g.beginPath(); g.arc(64, 64, 9, 0, Math.PI * 2); g.fill();
  });
  /** lyre with laurel (a stucco trophy of the Conservatory pediment, 256 x 256) */
  R.lyre = mk('lyre', 256, 256, (g) => {
    shadow(g, () => {
      g.lineWidth = 12; g.lineCap = 'round';
      g.beginPath(); g.moveTo(88, 40); g.bezierCurveTo(40, 70, 60, 170, 110, 200); g.moveTo(168, 40); g.bezierCurveTo(216, 70, 196, 170, 146, 200); g.stroke();
      g.lineWidth = 5; for (let i = 0; i < 6; i++) { const x = 98 + i * 12; g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 196); g.stroke(); }
      g.beginPath(); g.moveTo(88, 40); g.lineTo(168, 40); g.stroke();
      for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(46 + i * 5, 228 - i * 22, 16, 6, -0.9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(210 - i * 5, 228 - i * 22, 16, 6, 0.9, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.ellipse(128, 214, 24, 12, 0, 0, Math.PI * 2); g.fill();
    });
  });
  return R;
}
