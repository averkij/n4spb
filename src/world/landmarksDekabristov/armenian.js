// landmarksDekabristov/armenian.js - the SMOLENSKY ARMENIAN CEMETERY (Смоленское армяно-григорианское кладбище, GREEN r7738341, 11 235 m2, Kamskaya st.): the grounds of site.js round the church of the Resurrection
// (the church itself is landmarksVOStatues, group vo-church-armenian: this part draws nothing of it and keeps the graves 15 m clear): the closed fence w29044231 (494 m) in breakable bays with its gates, the 13 walkways laid
// as ribbons (paving, asphalt for the service lane), a lighter mown lawn round the church, the trees and the grave field (type mix of the zone A near the church).  The OSM data names no grave and no monument here.
// Solid on purpose: the graves (granite monuments), the trunks.  Breakable: the fence.
import { buildSite } from './site.js';
import { armenianSite, ARMENIAN_CHURCH } from './sites.js';

export async function build(K) {
  const S = armenianSite(); if (!S) { console.warn('[landmarksDekabristov] armenian: the GREEN polygon r7738341 is missing'); return; }
  const pl = buildSite(K, S);
  K.svc.photoSpots.push({ x: ARMENIAN_CHURCH.x + 11, z: ARMENIAN_CHURCH.z + 14, yaw: 38, name: 'Армянское кладбище · Armenian cemetery' });
  return pl;
}
