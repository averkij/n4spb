// landmarksA/tex.js - canvas textures of the station module (windows, arch windows, clock dial, roof lettering, signs, floor / ceiling patterns).
// Every texture is cached by key through ctx.tex.draw; <= 1024 px.  Photos: SP/refs/station 02, 05, 10, 82 (facade, windows, dial), 20, 45 (hall).
import { C } from './common.js';

const FONT = '"Noto Serif", "Times New Roman", serif';

/** one first-floor window (0.95 x 2.5 m): dark brown frame, 2 x 5 panes, sky-blue glass with a lighter upper pane row. size 64 x 160 */
export function windowTex(ctx, lit = false) {
  return ctx.tex.draw(64, 160, (g, w, h) => {
    g.fillStyle = lit ? '#000' : C.frame; g.fillRect(0, 0, w, h);
    const cols = 2, rows = 5, bx = 5, by = 5, gap = 3;
    const pw = (w - 2 * bx - (cols - 1) * gap) / cols, ph = (h - 2 * by - (rows - 1) * gap) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = bx + c * (pw + gap), y = by + r * (ph + gap);
      const gr = g.createLinearGradient(0, y, 0, y + ph); if (lit) { gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#f0b459'); } else { gr.addColorStop(0, r < 2 ? '#5b7189' : '#3a4a5c'); gr.addColorStop(1, r < 2 ? '#3e5066' : '#2a3544'); }
      g.fillStyle = gr; g.fillRect(x, y, pw, ph);
      if (!lit) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 1, y + 1, pw * 0.35, ph - 2); }
    }
  }, { key: lit ? 'st_win_lit' : 'st_win' });
}

/**
 * The ground-floor arch of the central block: lunette plaster, two arched windows separated by a white colonnette, a round oculus above.
 * Plate size 3.95 x 5.325 m (bottom = y 1.0, straight part 3.35 m, crown 5.325).  Texture 256 x 345.
 */
export function archWinTex(ctx, lit = false) {
  const PPM = 64.8;
  return ctx.tex.draw(256, 345, (g, w, h) => {
    const X = (m) => w / 2 + m * PPM, Y = (m) => h - m * PPM;
    g.fillStyle = lit ? '#000' : '#d6b678'; g.fillRect(0, 0, w, h);
    // two arched windows
    for (const s of [-1, 1]) {
      const cx = s * 0.78, hw = 0.66, top = 3.55;
      g.beginPath(); g.moveTo(X(cx - hw), Y(0)); g.lineTo(X(cx - hw), Y(top)); g.arc(X(cx), Y(top), hw * PPM, Math.PI, 0, false); g.lineTo(X(cx + hw), Y(0)); g.closePath();
      g.fillStyle = lit ? '#000' : C.frame; g.fill();
      const iw = hw - 0.09;
      g.beginPath(); g.moveTo(X(cx - iw), Y(0.05)); g.lineTo(X(cx - iw), Y(top)); g.arc(X(cx), Y(top), iw * PPM, Math.PI, 0, false); g.lineTo(X(cx + iw), Y(0.05)); g.closePath();
      const gr = g.createLinearGradient(0, Y(top + hw), 0, Y(0)); if (lit) { gr.addColorStop(0, '#ffe6ac'); gr.addColorStop(1, '#f2b65c'); } else { gr.addColorStop(0, '#6a8099'); gr.addColorStop(0.5, '#41546a'); gr.addColorStop(1, '#2d3a49'); }
      g.fillStyle = gr; g.fill();
      // muntins
      g.strokeStyle = lit ? '#2a1a05' : C.frame; g.lineWidth = 3;
      for (const yy of [0.9, 1.8, 2.7]) { g.beginPath(); g.moveTo(X(cx - iw), Y(yy)); g.lineTo(X(cx + iw), Y(yy)); g.stroke(); }
      g.beginPath(); g.moveTo(X(cx), Y(0.05)); g.lineTo(X(cx), Y(top + iw)); g.stroke();
      g.beginPath(); g.arc(X(cx), Y(top), iw * 0.6 * PPM, Math.PI, 0, false); g.stroke();
    }
    // colonnette
    g.fillStyle = lit ? '#000' : C.trim; g.fillRect(X(-0.09), Y(3.45), 0.18 * PPM, 3.45 * PPM);
    g.fillRect(X(-0.14), Y(3.62), 0.28 * PPM, 0.17 * PPM);
    // oculus
    g.beginPath(); g.arc(X(0), Y(4.62), 0.4 * PPM, 0, Math.PI * 2); g.fillStyle = lit ? '#000' : C.trim; g.fill();
    g.beginPath(); g.arc(X(0), Y(4.62), 0.3 * PPM, 0, Math.PI * 2); g.fillStyle = lit ? '#ffd890' : '#34465a'; g.fill();
    g.strokeStyle = C.frame; g.lineWidth = 2; g.beginPath(); g.moveTo(X(-0.3), Y(4.62)); g.lineTo(X(0.3), Y(4.62)); g.moveTo(X(0), Y(4.32)); g.lineTo(X(0), Y(4.92)); g.stroke();
  }, { key: lit ? 'st_arch_lit' : 'st_arch' });
}

/** clock dial (square canvas, circle inside): white face, black Roman numerals, minute ticks, dark rim */
export function dialTex(ctx, lit = false) {
  return ctx.tex.draw(512, 512, (g, w, h) => {
    const c = w / 2;
    g.fillStyle = lit ? '#000' : '#26262a'; g.fillRect(0, 0, w, h);
    g.beginPath(); g.arc(c, c, c * 0.93, 0, Math.PI * 2); g.fillStyle = lit ? '#ffe7b4' : '#f4f2e8'; g.fill();
    g.strokeStyle = '#1c1c20'; g.lineWidth = 3;
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = c * (big ? 0.78 : 0.84), r1 = c * 0.88;
      g.lineWidth = big ? 5 : 2; g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.stroke();
    }
    g.fillStyle = '#16161a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = g.fillStyle; g.lineWidth = 3;
    for (const radius of [0.88, 0.54]) { g.beginPath(); g.arc(c, c, c * radius, 0, Math.PI * 2); g.stroke(); }
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    g.font = `700 ${w * 0.142}px ${FONT}`;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = c * 0.70; g.save(); g.translate(c + Math.sin(a) * r, c - Math.cos(a) * r); g.rotate(a); g.fillText(R[i], 0, 0); g.restore(); }
  }, { key: lit ? 'st_dial_lit' : 'st_dial' });
}

/** white roof letters on transparent ground; `text` placed with `letters` evenly over the width (pitch from the plane width) */
export function lettersTex(ctx, text, key, w = 1024, h = 128, fg = '#eef0f2') {
  return ctx.tex.draw(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const n = [...text].length, pitch = w / n;
    const size = h * 0.92; g.font = `700 ${size}px ${'"Noto Sans", "Segoe UI", Arial, sans-serif'}`;
    g.lineJoin = 'round'; g.lineWidth = Math.max(4, h * 0.07); g.strokeStyle = '#46566b';
    [...text].forEach((ch, i) => { g.strokeText(ch, pitch * (i + 0.5), h * 0.93); g.fillText(ch, pitch * (i + 0.5), h * 0.93); });
  }, { key, anisotropy: 8 });
}

/** a lit / plain rectangular sign: opts as ctx.tex.sign */
export function signTex(ctx, o) { return ctx.tex.sign(o); }
