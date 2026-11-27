// A snow tile is part of the material captured by the static colour atlas.
// Preserve each surface's offset so paths, raised beds and lawns keep their layering.
export function snowGarden(ctx, materials, lawns, walks) {
  if (ctx.season !== 'winter') return;
  for (const [keys, packed] of [[lawns, false], [walks, true]]) {
    if (!keys.length) continue;
    const name = packed ? 'packed-garden-snow' : 'fresh-garden-snow';
    const map = ctx.tex.draw(128, 128, (g, w, h) => {
      const random = ctx.rng(name);
      g.fillStyle = packed ? '#c4c8c8' : '#e1e6e7';
      g.fillRect(0, 0, w, h);
      const grains = packed ? ['#d1d4d3','#b7b9b8','#c0b9b2','#9e8f86'] : ['#d8e0e3','#edf1f1','#ced8dd'];
      for (let i = 0; i < 1000; i++) {
        g.fillStyle = grains[i % grains.length];
        g.fillRect(random()*w, random()*h, 0.5 + random()*1.6, 0.5 + random()*1.1);
      }
    }, { key: name, repeat: [1, 1] });
    for (const key of keys) {
      materials[key] = ctx.mat.toon('#ffffff', {
        name, map, paint: 0.06, polygonOffset: materials[key].polygonOffsetFactor,
      });
    }
  }
}
