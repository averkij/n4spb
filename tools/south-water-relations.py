"""Complete southern riverbank relations omitted by the tile fetch.

Only edits the explicitly named scratch raw directory. The OSM map API gives
parent relations with missing member geometry, and the inherited fetcher skips
river multipolygons; partial rings are discarded by the data baker.
"""
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit('usage: python tools/south-water-relations.py <scratch-data/osm-raw>')
raw = Path(sys.argv[1]).resolve()
water_file = raw / 'water.json'
if not water_file.is_file():
    raise SystemExit(f'No scratch water layer: {water_file}')
cache = raw / 'map-api'
cache.mkdir(exist_ok=True)
# Екатерингофка basin, and two stretches of Волковка (OSM relation IDs).
ids = (142563, 11787679, 3891234)
data = json.loads(water_file.read_text(encoding='utf8'))
by_id = {(e['type'], e['id']): i for i, e in enumerate(data['elements'])}
for ident in ids:
    target = cache / f'relation-{ident}-full.osm'
    if not target.exists():
        req = urllib.request.Request(f'https://api.openstreetmap.org/api/0.6/relation/{ident}/full', headers={'User-Agent': 'PiterCityResearch/1.0 (OSM data bake)'})
        with urllib.request.urlopen(req, timeout=120) as response:
            content = response.read()
        ET.fromstring(content)
        target.write_bytes(content)
    root = ET.parse(target).getroot()
    nodes = {int(e.get('id')): e for e in root.findall('node')}
    ways = {int(e.get('id')): e for e in root.findall('way')}
    relation = next((e for e in root.findall('relation') if int(e.get('id')) == ident), None)
    if relation is None:
        raise ValueError(f'missing relation {ident}')
    members = []
    for member in relation.findall('member'):
        kind, ref = member.get('type'), int(member.get('ref'))
        m = {'type': kind, 'ref': ref, 'role': member.get('role', '')}
        if kind == 'way':
            if ref not in ways:
                raise ValueError(f'relation {ident}: missing way {ref}')
            refs = [int(n.get('ref')) for n in ways[ref].findall('nd')]
            if any(n not in nodes for n in refs):
                raise ValueError(f'relation {ident}: missing nodes of way {ref}')
            m['geometry'] = [{'lat': float(nodes[n].get('lat')), 'lon': float(nodes[n].get('lon'))} for n in refs]
        elif kind == 'node' and ref in nodes:
            m.update(lat=float(nodes[ref].get('lat')), lon=float(nodes[ref].get('lon')))
        members.append(m)
    result = {'type': 'relation', 'id': ident, 'tags': {t.get('k'): t.get('v') for t in relation.findall('tag')}, 'members': members}
    old = by_id.get(('relation', ident))
    if old is None:
        data['elements'].append(result)
    else:
        data['elements'][old] = result
    print(f'relation {ident}: completed {len(members)} members')
tmp = water_file.with_suffix('.json.tmp')
tmp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
os.replace(tmp, water_file)
