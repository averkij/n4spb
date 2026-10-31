// landmarksYelaginSpits/mats.js - the materials of the spit terrace (all through ctx.mat / ctx.tex, every key starts with 'lmYS-'): 7 materials, 3 canvas textures.
//   wall      the light pink granite of the wall face (photos spit 22-24: five courses of large blocks 1.0-1.4 m long, darker weep streaks, a damp band at the waterline); tile 6.0 x 3.85 m = five courses
//             of 0.77 m (v = (y - FOOT) / 3.85, so the rows meet the courses of wall.js)
//   granite   the greyer pink-brown granite of plinths, parapet, returns, curbs, steps and benches (photos spit 01, 09-12, 17); tile 3 x 3 m, courses of 0.5 m
//   cap       the red-brown cap course under the lion slab (#7b5148)
//   lime      the white limestone of the slab, the balls and the lions (#e6e2d8: the lions are whitewashed, photos 13-15, 27-28)
//   gravel    the sand-gravel plaza (#c9b5a2 dry: photos spit 3, 12, 17, 18); tile 3 m
//   hedge     the clipped hedge strip of the wings (photo 22-23)
//   lionDark  the eyes / nostrils of the lions (kit key 'dark')
// Every figure material of the kit is NOT used: the lions are whitewashed limestone, a flat toon colour with the slab.
const rngOf = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

export function makeMats(ctx) {
  const T = ctx.mat.toon;
  const wallTex = ctx.tex.draw(1024, 640, (g, w, h) => {
    const r = rngOf(4711), rows = 5, rh = h / rows, tones = ['#c9b4a6', '#c2ab9d', '#cdb9ab', '#bba496', '#c6b0a1', '#c0ae9f', '#b9a597'];
    g.fillStyle = '#b9a597'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      // blocks of one course: the widths add up to exactly w and the first block wraps over the seam, so the tile repeats without any seam line
      const ws = []; let sum = 0; while (sum < w - 150) { const bw = 170 + r() * 70; ws.push(bw); sum += bw; }
      const sc = w / sum; let x = -r() * ws[0] * sc;
      for (const bw0 of ws) {
        const bw = bw0 * sc, c = tones[Math.floor(r() * tones.length)], v = 0.94 + r() * 0.12, weep = r() < 0.4 ? [r() * bw, (r() - 0.5) * 14, 0.12 + r() * 0.14, 1.5 + r() * 2.5] : null;
        for (const dx of x < 0 ? [0, w] : [0]) {
          const X = x + dx;
          g.fillStyle = c; g.fillRect(X + 1.5, j * rh + 1.5, bw - 3, rh - 3);
          g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.55})`; g.fillRect(X + 1.5, j * rh + 1.5, bw - 3, rh - 3);
          if (weep) { g.strokeStyle = `rgba(150,110,100,${weep[2]})`; g.lineWidth = weep[3]; g.beginPath(); g.moveTo(X + weep[0], j * rh + 4); g.lineTo(X + weep[0] + weep[1], (j + 1) * rh - 4); g.stroke(); }
        }
        x += bw;
      }
    }
    g.strokeStyle = 'rgba(70,58,52,0.62)'; g.lineWidth = 3; for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * rh); g.lineTo(w, j * rh); g.stroke(); }
    // the canvas y axis runs DOWN, texture v runs UP: v = 0 is the bottom row (the waterline), so the damp band sits at the canvas bottom
    for (let i = 0; i < 30; i++) { const x = r() * w, len = 60 + r() * 220, wd = 3 + r() * 8, gr = g.createLinearGradient(0, 0, 0, len); gr.addColorStop(0, `rgba(64,58,54,${0.14 + r() * 0.16})`); gr.addColorStop(1, 'rgba(64,58,54,0)'); g.fillStyle = gr; g.fillRect(x, 0, wd, len); if (x + wd > w) g.fillRect(x - w, 0, wd, len); }
    const damp = g.createLinearGradient(0, h - 70, 0, h); damp.addColorStop(0, 'rgba(40,52,44,0)'); damp.addColorStop(0.5, 'rgba(36,50,42,0.5)'); damp.addColorStop(1, 'rgba(24,36,32,0.8)'); g.fillStyle = damp; g.fillRect(0, h - 70, w, 70);
  }, { key: 'lmYS-wall', repeat: [1, 1], anisotropy: 8 });
  const graniteTex = ctx.tex.draw(512, 512, (g, w, h) => {
    const r = rngOf(917), rows = 6, rh = h / rows, tones = ['#ae9f97', '#a79890', '#b5a69e', '#a99a91', '#b1a29a', '#a39489'];
    g.fillStyle = '#a99a91'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      let x = -r() * 120;
      while (x < w) {
        const bw = 150 + r() * 130, c = tones[Math.floor(r() * tones.length)];
        g.fillStyle = c; g.fillRect(x + 1.2, j * rh + 1.2, bw - 2.4, rh - 2.4);
        for (let i = 0; i < 6; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,215,0.10)' : 'rgba(60,40,36,0.10)'; g.fillRect(x + r() * bw, j * rh + r() * rh, 3 + r() * 9, 3 + r() * 8); }
        x += bw;
      }
    }
    g.strokeStyle = 'rgba(52,44,40,0.6)'; g.lineWidth = 2.4; for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * rh); g.lineTo(w, j * rh); g.stroke(); }
  }, { key: 'lmYS-granite', repeat: [1, 1], anisotropy: 4 });
  const gravelTex = ctx.tex.draw(256, 256, (g, w, h) => {
    const r = rngOf(31337);
    g.fillStyle = '#c9b5a2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { const c = r(); g.fillStyle = c < 0.4 ? 'rgba(150,126,108,0.28)' : c < 0.75 ? 'rgba(236,222,206,0.30)' : 'rgba(110,92,80,0.22)'; g.beginPath(); g.arc(r() * w, r() * h, 0.5 + r() * 1.5, 0, 6.3); g.fill(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(176,150,128,0.18)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 22, 5 + r() * 10, r() * 3, 0, 6.3); g.fill(); }
  }, { key: 'lmYS-gravel', repeat: [1, 1] });
  const hedgeTex = ctx.tex.draw(128, 128, (g, w, h) => {
    const r = rngOf(2718), tones = ['#3d7438', '#468240', '#356a33', '#4f8c46', '#2f5f2e'];
    g.fillStyle = '#3f7a3b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rad = 3 + r() * 6; g.fillStyle = tones[Math.floor(r() * tones.length)]; for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) { g.beginPath(); g.arc(x + dx, y + dy, rad, 0, 6.3); g.fill(); } }
  }, { key: 'lmYS-hedge', repeat: [1, 1] });
  return {
    wall: T('#ffffff', { map: wallTex, name: 'lmYS-wall', paint: 0.03 }),
    granite: T('#ffffff', { map: graniteTex, name: 'lmYS-granite', paint: 0.03 }),
    cap: T('#7b5148', { name: 'lmYS-cap', paint: 0.04 }),
    lime: T('#e6e2d8', { name: 'lmYS-lime', paint: 0.03 }),
    gravel: T('#ffffff', { map: gravelTex, name: 'lmYS-gravel', paint: 0.05, polygonOffset: -1 }),
    hedge: T('#ffffff', { map: hedgeTex, name: 'lmYS-hedge', paint: 0.06 }),
    lionDark: T('#2a2724', { name: 'lmYS-lionDark' }),
  };
}
