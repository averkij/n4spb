// A PNG of some areas of the rebuilt map with the Ligovsky prospekt and the cut line of the 'carve' edit (through Edge, puppeteer-core from the repo's node_modules).
//   node plot-areas.mjs 42,43,45,6,90 out.png [intro-data.json]
// Areas are the k of intro-data.json (the district index, = the registry mapId of the live areas). Dashed red = the centerline used by the carve edit, black = the street's own ways (raw/).
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { here, raw } from './lib.mjs';

const ids = (process.argv[2] || '').split(',').map(Number);
const outPng = process.argv[3] || 'plot.png';
const D = JSON.parse(fs.readFileSync(process.argv[4] || path.join(here, 'intro-data.json'), 'utf8'));
const areas = ids.map((k) => D.areas[k]).filter(Boolean);
const streets = [];
for (const f of ['main_roads', 'secondary', 'tertiary']) for (const e of raw(f).elements || []) if (e.tags && e.tags.name === 'Лиговский проспект' && e.geometry) streets.push(e.geometry.map((g) => [g.lon, g.lat]));
const cut = ((D.edits && D.edits.carve) || []).flatMap((c) => c.cut);
const b = [1e9, 1e9, -1e9, -1e9];
for (const a of areas) for (const r of a.outer) for (const p of r) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }
const c = Math.cos(59.95 * Math.PI / 180), W = 1500, sc = W / ((b[2] - b[0]) * c), H = Math.round((b[3] - b[1]) * sc) + 20;
const X = (p) => ((p[0] - b[0]) * c * sc).toFixed(1), Y = (p) => ((b[3] - p[1]) * sc + 10).toFixed(1);
const cols = ['#e66', '#6a6', '#66e', '#ca4', '#a6c', '#4cc', '#c84', '#888', '#d6a', '#6bd'];
const pts = (r) => r.map((p) => X(p) + ',' + Y(p)).join(' ');
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:#fff">`;
areas.forEach((a, i) => { svg += `<path d="${a.outer.concat(a.inner).map((r) => 'M' + pts(r) + 'Z').join(' ')}" fill="${cols[i % cols.length]}" fill-opacity=".35" stroke="${cols[i % cols.length]}" stroke-width="2" fill-rule="evenodd"/>`; });
for (const s of streets) svg += `<polyline points="${pts(s)}" fill="none" stroke="#000" stroke-width="1.5"/>`;
for (const l of cut) svg += `<polyline points="${pts(l)}" fill="none" stroke="#d00" stroke-width="2" stroke-dasharray="8 5"/>`;
areas.forEach((a) => { const lp = a.label; svg += `<text x="${X(lp)}" y="${Y(lp)}" font-size="20" text-anchor="middle" fill="#000" stroke="#fff" stroke-width="4" paint-order="stroke">${a.k} ${a.ru} (${a.km2} km2)</text>`; });
svg += '</svg>';
const html = path.join(here, 'plot-areas.tmp.html');
fs.writeFileSync(html, '<html><body style="margin:0">' + svg + '</body></html>');
const br = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox'] });
const pg = await br.newPage(); await pg.setViewport({ width: W, height: H });
await pg.goto('file:///' + html.replace(/\\/g, '/')); await pg.screenshot({ path: outPng }); await br.close();
fs.unlinkSync(html);
console.log('ok', areas.length, 'areas,', streets.length, 'street ways, bbox', b.map((v) => v.toFixed(4)).join(' '), '->', outPng);
