// Geometric vocabulary for this specific Russian Revival church: voussoir
// arches, octagonal open belfry, fish-scale tents and the two-tone onion dome.
import * as THREE from 'three';

export function arch(P, mat, x, spring, r, band, z, seg = 18) {
  for (let i = 0; i < seg; i++) {
    const a = Math.PI * i / seg, b = Math.PI * (i + 1) / seg;
    P.quad(mat, [x + Math.cos(a) * r, spring + Math.sin(a) * r, z], [x + Math.cos(b) * r, spring + Math.sin(b) * r, z], [x + Math.cos(b) * (r + band), spring + Math.sin(b) * (r + band), z], [x + Math.cos(a) * (r + band), spring + Math.sin(a) * (r + band), z], [0, 0, 1]);
  }
}

export function archedPane(P, M, x, y, w, h, z, ornament = true) {
  const r = w / 2, spring = y + h - r, pts = [[x - r, y], [x + r, y]];
  for (let i = 0; i <= 16; i++) { const a = i * Math.PI / 16; pts.push([x + Math.cos(a) * r, spring + Math.sin(a) * r]); }
  P.vpoly(M.glass, pts, z, 1);
  arch(P, M.stone, x, spring, r + 0.03, 0.10, z + 0.045);
  for (const s of [-1, 1]) P.box(M.stone, x + s * r - 0.045, x + s * r + 0.045, y, spring, z + 0.04, z + 0.09, 'bk');
  P.box(M.stone, x - 0.025, x + 0.025, y + 0.04, spring + r - 0.04, z + 0.05, z + 0.075, 'bk');
  for (let k = 1; k < h / 0.8; k++) P.box(M.stone, x - r + 0.06, x + r - 0.06, y + k * 0.76, y + k * 0.76 + 0.04, z + 0.05, z + 0.075, 'bk');
  if (!ornament) return;
  for (const [off, width, mat] of [[0.18, 0.16, M.darkBrick], [0.39, 0.18, M.lightBrick], [0.62, 0.13, M.trim]]) {
    arch(P, mat, x, spring, r + off, width, z + 0.11 + off * 0.035);
    for (const s of [-1, 1]) P.box(mat, x + s * (r + off + width / 2) - width / 2, x + s * (r + off + width / 2) + width / 2, y - 0.15, spring, z + 0.08, z + 0.15, 'bk');
  }
  P.box(M.lightBrick, x - r - 0.9, x + r + 0.9, y - 0.28, y - 0.05, z + 0.05, z + 0.26, 'b');
}

export function iconPanel(P, M, x, y, w, h, z, number = 0) {
  P.box(M.stone, x - w / 2 - 0.12, x + w / 2 + 0.12, y - 0.12, y + h + 0.12, z, z + 0.11, 'bk');
  P.quad(M.mosaic, [x - w / 2, y, z + 0.13], [x + w / 2, y, z + 0.13], [x + w / 2, y + h, z + 0.13], [x - w / 2, y + h, z + 0.13], [0, 0, 1], [[number / 4, 0], [(number + 1) / 4, 0], [(number + 1) / 4, 1], [number / 4, 1]]);
}

export function cross(P, M, x, y, z, h = 2.1) {
  P.cyl(M.goldDark, [x, y, z], [x, y + h, z], 0.065, 0.065, 6);
  P.cyl(M.gold, [x - h * 0.31, y + h * 0.67, z], [x + h * 0.31, y + h * 0.67, z], 0.055, 0.055, 6);
  P.cyl(M.gold, [x - h * 0.19, y + h * 0.9, z], [x + h * 0.19, y + h * 0.9, z], 0.04, 0.04, 5);
  P.cyl(M.gold, [x - h * 0.2, y + h * 0.29, z], [x + h * 0.2, y + h * 0.18, z], 0.045, 0.045, 5);
  for (const [u, v] of [[0, 1], [-0.31, 0.67], [0.31, 0.67]]) P.geo(M.goldLight, new THREE.SphereGeometry(0.10, 6, 4), x + h * u, y + h * v, z);
}

export function onion(P, M, x, z, y, r = 0.7, h = 1.7, material = M.slate) {
  const profile = [[0, 0.65], [0.12, 0.82], [0.35, 1], [0.56, 0.94], [0.72, 0.61], [1, 0.03]];
  for (let j = 0; j + 1 < profile.length; j++) P.cyl(material, [x, y + profile[j][0] * h, z], [x, y + profile[j + 1][0] * h, z], profile[j][1] * r, profile[j + 1][1] * r, 20, false);
  P.cyl(M.goldDark, [x, y + h, z], [x, y + h + 0.18, z], 0.12, 0.07, 8);
  cross(P, M, x, y + h + 0.2, z, r < 0.8 ? 1.35 : 2.2);
}

export function tent(P, M, x, z, y0, y1, r) {
  P.prism(M.darkBrick, x, z, r * 1.13, 8, y0 - 0.35, y0, Math.PI / 8);
  P.cyl(M.slate, [x, y0, z], [x, y1, z], r, 0.3, 8);
  // Lozenge plate courses and eight standing seams, all bounded near detail.
  P.ranged(450, () => {
    for (let j = 1; j < 19; j++) {
      const y = y0 + (y1 - y0) * j / 19, rr = r * (1 - j / 19) + 0.3 * j / 19;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, b = (i + 1) * Math.PI / 4;
        P.cyl(M.seam, [x + rr * Math.cos(a), y, z + rr * Math.sin(a)], [x + rr * Math.cos(b), y, z + rr * Math.sin(b)], 0.026, 0.026, 4, false);
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      P.cyl(M.seam, [x + r * Math.cos(a), y0, z + r * Math.sin(a)], [x + 0.3 * Math.cos(a), y1, z + 0.3 * Math.sin(a)], 0.055, 0.055, 4, false);
    }
  });
  P.cyl(M.slate, [x, y1, z], [x, y1 + 0.9, z], 0.45, 0.35, 12);
}

// A true open arch panel, used by each octagonal belfry face. Backing panes
// are absent, so the bells and sky show through both tiers from the river.
export function openArch(P, M, width, h, r, y, z) {
  const sh = new THREE.Shape(); sh.moveTo(-width / 2, y); sh.lineTo(width / 2, y); sh.lineTo(width / 2, y + h); sh.lineTo(-width / 2, y + h); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(-r, y); hole.lineTo(-r, y + h - r - 0.4); hole.absarc(0, y + h - r - 0.4, r, Math.PI, 0, true); hole.lineTo(r, y); hole.closePath(); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 12 });
  P.geo(M.brick, g, 0, 0, z - 0.3); g.dispose();
  arch(P, M.lightBrick, 0, y + h - r - 0.4, r + 0.04, 0.14, z + 0.04);
}
