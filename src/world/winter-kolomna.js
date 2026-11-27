// Stachek, Kulibina and Repina squares, and the seasonal New Holland ice rink.
// Photographs, ice footprint and museum dimensions: docs/research/kolomna-winter.md.
import { buildHolidayRink } from './lib/holiday-rink.js';

export const KOLOMNA_SQUARES = [
  { id: 'stachek-square', tree: [-4307, 3544, 15], arches: [[-4313, 3528, .44], [-4325, 3534, .44]],
    orbs: [[-4315, 3542], [-4321, 3550]], snow: [-4305, 3536] },
  { id: 'kulibina-square', tree: [-3835, 1250, 11], arches: [[-3829, 1256, -.75]],
    orbs: [[-3841, 1246], [-3831, 1240]], huts: [[-3843, 1256, 2.1]], snow: [-3847, 1248] },
  { id: 'repina-square', tree: [-4026, 1687, 13], arches: [[-4036, 1679, -.54], [-4034, 1693, -.54]],
    orbs: [[-4020, 1677], [-4016, 1685]], huts: [[-4018, 1697, -2.35]] },
];

const rink = {
  pitch: 'w1011443504', cx: -3425.1, cz: 268.4, name: 'new-holland-rink', fixtures: 'holland',
  openings: [2, 10], rows: [-23, -14, -5, 4, 13, 22], yaw: .574,
};

export function buildKolomnaFestival(ctx, glow) {
  buildHolidayRink(ctx, glow, rink);
}
