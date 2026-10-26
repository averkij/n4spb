// landmarksAcademy/court-ring.js - fallback outline of the round court (a regular 20-gon of circumradius R) when the baked polygon is missing.
export const ring = (n, R) => Array.from({ length: n }, (_, i) => [Math.sin((i / n) * Math.PI * 2 + 0.122) * R, Math.cos((i / n) * Math.PI * 2 + 0.122) * R]);
