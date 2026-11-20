// Describe a TrackTakTak measurements export without inferring missing inputs.
// Usage: node tools/kart-telemetry-reference.mjs <measurements.json>
import fs from 'node:fs';
const file = process.argv[2];
if (!file) throw Error('Pass the TrackTakTak measurements.json export');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const laps = [...data.laps].sort((a,b) => a.duration_s - b.duration_s).slice(0,20);
const quantile = (a,p) => { const v=[...a].sort((a,b)=>a-b); return v.length ? v[Math.floor((v.length-1)*p)] : null; };
const bins = Array.from({length:6},(_,i)=>({speed_kmh:[15+i*10,25+i*10], samples:0, lateral_g:[],radius_m:[]}));
for (const lap of laps) {
  const c=lap.raw_channels, t=lap.raw_sample_time_s;
  for(let i=1;i<t.length-1;i++) {
    if(t[i]-t[i-1]>.25 || t[i+1]-t[i]>.25)continue;
    const v=c.speed_kmh[i], ay=c.lateral_mps2_smoothed[i], k=c.curvature_per_m_smoothed[i];
    if(![v,ay,k].every(Number.isFinite) || Math.abs(ay)<.3*9.81 || Math.abs(k)<.005)continue;
    const bin=bins.find(b=>v>=b.speed_kmh[0] && v<b.speed_kmh[1]);
    if(!bin)continue;
    bin.samples++; bin.lateral_g.push(Math.abs(ay)/9.81); bin.radius_m.push(1/Math.abs(k));
  }
}
console.log(JSON.stringify({source:data.source, selected_laps:laps.map(l=>l.lap_number),
  limitations:'GPS trajectory only; no steering, pedals or body heading. Radius-vs-speed is observed driving, not an understeer coefficient or a rear-slip measurement.',
  filters:'20 fastest laps, smoothed channels, adjacent intervals <=0.25s, |ay|>=0.3g, |curvature|>=0.005/m',
  bins:bins.map(b=>({speed_kmh:b.speed_kmh,samples:b.samples,lateral_g_p50:quantile(b.lateral_g,.5),lateral_g_p95:quantile(b.lateral_g,.95),radius_m_p10:quantile(b.radius_m,.1),radius_m_p50:quantile(b.radius_m,.5)}))},null,2));
