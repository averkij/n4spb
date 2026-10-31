// Clip a 3D polygon to a horizontal height band. Audit callers must measure a
// leaning structure where the vehicle is, rather than project its whole shaft.
export function clipHeightBand(vertices, low, high) {
  let out = vertices;
  for (const [height, above] of [[low, true], [high, false]]) {
    const input = out; out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const a = input[(i + input.length - 1) % input.length], b = input[i];
      const aIn = above ? a[1] >= height : a[1] <= height;
      const bIn = above ? b[1] >= height : b[1] <= height;
      if (aIn !== bIn) {
        const t = (height - a[1]) / (b[1] - a[1]);
        out.push([a[0] + (b[0] - a[0]) * t, height, a[2] + (b[2] - a[2]) * t]);
      }
      if (bIn) out.push(b);
    }
  }
  return out;
}
