// Small authored texture atlas: irregular brick coursing and stylised mosaic
// panels. These are drawings, not crops of reference photography or logos.
export function materials(ctx) {
  const brick = ctx.tex.draw(512, 512, g => {
    g.fillStyle = '#563f35'; g.fillRect(0, 0, 512, 512);
    const colours = ['#a75d45', '#a15a43', '#a45c46', '#ad634b', '#98543e'];
    for (let j = 0; j < 11; j++) for (let i = -1; i < 5; i++) {
      g.fillStyle = colours[((i + 5) * 7 + j * 3) % colours.length];
      g.fillRect(i * 128 + (j % 2) * 64 + 2, j * 46.55 + 2, 124, 42.55);
      g.fillStyle = 'rgba(220,156,113,.12)'; g.fillRect(i * 128 + (j % 2) * 64 + 4, j * 46.55 + 3, 121, 2);
    }
  }, { key: 'portchurch-brick', repeat: [1, 1] });
  const icon = ctx.tex.draw(512, 384, g => {
    g.fillStyle = '#bc9c53'; g.fillRect(0, 0, 512, 384);
    for (let p = 0; p < 4; p++) {
      const x = 64 + p * 128;
      g.fillStyle = '#d2b45e'; g.fillRect(p * 128 + 5, 4, 118, 376);
      g.strokeStyle = '#765a37'; g.lineWidth = 5; g.strokeRect(p * 128 + 9, 8, 110, 368);
      g.fillStyle = '#d6c889'; g.beginPath(); g.arc(x, 86, 36, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#78562d'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#82634c'; g.beginPath(); g.ellipse(x, 91, 18, 29, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = p % 2 ? '#596374' : '#425b72';
      g.beginPath(); g.moveTo(x - 19, 121); g.lineTo(x - 40, 325); g.lineTo(x + 40, 325); g.lineTo(x + 18, 121); g.closePath(); g.fill();
      g.fillStyle = '#9c7052'; g.fillRect(x - 39, 167, 17, 47); g.fillRect(x + 23, 166, 13, 48);
      g.strokeStyle = '#d2b460'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 13, 138); g.lineTo(x + 10, 310); g.stroke();
      g.strokeStyle = 'rgba(244,216,142,.35)'; g.lineWidth = 1;
      for (let u = p * 128; u < (p + 1) * 128; u += 6) { g.beginPath(); g.moveTo(u, 0); g.lineTo(u, 384); g.stroke(); }
      for (let y = 0; y < 384; y += 6) { g.beginPath(); g.moveTo(p * 128, y); g.lineTo((p + 1) * 128, y); g.stroke(); }
    }
  }, { key: 'portchurch-mosaic-panels' });
  return {
    brick: ctx.mat.toon('#ffffff', { map: brick, paint: 0.04 }),
    trim: ctx.mat.toon('#a55840'), darkBrick: ctx.mat.toon('#7d493a'), lightBrick: ctx.mat.toon('#c28661'),
    stone: ctx.mat.toon('#b6a184'), mortar: ctx.mat.toon('#7b6551'),
    slate: ctx.mat.toon('#59565f'), seam: ctx.mat.toon('#76696e'), silver: ctx.mat.toon('#bdc6c5'),
    gold: ctx.mat.toon('#d7ae50'), goldLight: ctx.mat.toon('#e1bd68'), goldDark: ctx.mat.toon('#a97831'),
    glass: ctx.mat.toon('#324848'), glassLight: ctx.mat.toon('#657d78'), dark: ctx.mat.toon('#283237'),
    tile: ctx.mat.toon('#7d9a88'), tileLight: ctx.mat.toon('#b5b29b'),
    mosaic: ctx.mat.toon('#ffffff', { map: icon, paint: 0 }),
  };
}
