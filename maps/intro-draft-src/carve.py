#!/usr/bin/env python3
"""Polygon helper of build-intro.mjs / check-edits.mjs (needs Python 3 + shapely >= 2: `pip install shapely`).

JSON on stdin, JSON on stdout (ASCII only), coordinates [lon, lat] in full double precision.
A "geometry" is the map's own ring form: {"outer": [ring, ...], "inner": [ring, ...]}, every ring closed (first == last);
the inner rings are the holes of the union of the outer rings (as in OSM multipolygon relations: they are not assigned to an outer ring).
Areas are computed in the same metric as lib.mjs (KX = 111320 cos 59.95 deg, KY = 110950 m per degree) and given in km2.

op "carve"  { op, west: ring, parts: [{name, geom}], target: geom|null }
    west   = a closed ring (the half-plane polygon on one side of the cut line);
    parts  = the districts to split: each gives "west" (the piece inside the ring) and "rest" (what is left);
    target = the area that receives the pieces: its geometry is unioned (shapely) with every west piece (null: no union).
    Result { cut (the cut edge: the ring of `west` where it runs inside the sources, polylines), parts: [{name, west, rest, westKm2, restKm2, srcKm2, westPieces, restPieces}], target: geom|null, targetKm2, targetOuter, targetHolesBefore, targetHolesAfter,
             overlapKm2 (the largest pairwise overlap among target, rests), gapKm2 (area that was in sources but is in no result), extraKm2 (area in the results that was in no source) }.
op "audit"  { op, areas: [{name, geom}], line: [[lon, lat], ...], gapM }
    Result { overlapKm2 (sum of pairwise intersections inside a 3 gapM strip of the line), gapKm2 (slivers up to 2 gapM wide between the areas, same strip), lineKm }.
"""
import json
import math
import sys

try:
    import shapely
    from shapely.geometry import Polygon, MultiPolygon, LineString
    from shapely.ops import unary_union, linemerge
    from shapely.geometry.polygon import orient
except ImportError as e:  # build-intro.mjs shows this message and fails
    sys.stderr.write('carve.py: shapely is missing (pip install shapely): %s\n' % e)
    sys.exit(3)

KX = 111320.0 * math.cos(59.95 * math.pi / 180.0)
KY = 110950.0
KM2 = KX * KY / 1e6  # km2 per square degree


def polys_of(g):
    """The polygonal parts of any shapely geometry, as a list of Polygons."""
    if g.is_empty:
        return []
    t = g.geom_type
    if t == 'Polygon':
        return [g]
    if t in ('MultiPolygon', 'GeometryCollection'):
        out = []
        for x in g.geoms:
            out += polys_of(x)
        return out
    return []


def solid(rings):
    """A valid polygonal geometry of a list of rings."""
    ps = []
    for r in rings:
        if len(r) < 4:
            continue
        p = Polygon(r)
        if not p.is_valid:
            p = shapely.make_valid(p)
        ps += polys_of(p)
    return unary_union(ps) if ps else Polygon()


def to_shape(geom):
    s = solid(geom['outer'])
    if geom.get('inner'):
        s = s.difference(solid(geom['inner']))
    return s


def from_shape(s):
    outer, inner = [], []
    for p in polys_of(s):
        p = orient(p, 1.0)  # exterior counter-clockwise, holes clockwise
        outer.append([list(c) for c in p.exterior.coords])
        for h in p.interiors:
            inner.append([list(c) for c in h.coords])
    return {'outer': outer, 'inner': inner}


def km2(s):
    return s.area * KM2


def holes(s):
    return sum(len(p.interiors) for p in polys_of(s))


def op_carve(req):
    west = Polygon(req['west'])
    if not west.is_valid:
        west = shapely.make_valid(west)
    # A street block uses the inside carriageway of a divided road. Absorb
    # only tiny enclosed strips between it and the old municipal centreline,
    # so moving the block cannot leave a road-shaped enclave behind.
    if req.get('absorbEnclavesM2') and req.get('target') is not None:
        target = to_shape(req['target'])
        combined = unary_union([target, west])
        additions = solid([list(h.coords) for p in polys_of(combined) for h in p.interiors]).difference(target)
        if km2(additions) * 1e6 > req['absorbEnclavesM2']:
            raise SystemExit('carve: enclosed strips exceed the configured area limit')
        west = unary_union([west, additions])
    res = {'parts': []}
    wests, rests, srcs = [], [], []
    for part in req['parts']:
        s = to_shape(part['geom'])
        w = s.intersection(west)
        r = s.difference(west)
        wests.append(w)
        rests.append(r)
        srcs.append(s)
        res['parts'].append({
            'name': part['name'], 'west': from_shape(w), 'rest': from_shape(r),
            'westKm2': km2(w), 'restKm2': km2(r), 'srcKm2': km2(s),
            'westPieces': len(polys_of(w)), 'restPieces': len(polys_of(r)),
        })
    tgt = req.get('target')
    results = list(rests)
    srcs_all = list(srcs)
    if tgt is not None:
        t0 = to_shape(tgt)
        t1 = unary_union([t0] + wests)
        res['target'] = from_shape(t1)
        res['targetKm2'] = km2(t1)
        res['targetOuter'] = len(polys_of(t1))
        res['targetHolesBefore'] = holes(t0)
        res['targetHolesAfter'] = holes(t1)
        results.append(t1)
        srcs_all.append(t0)
    else:
        res['target'] = None
    # the results must tile exactly what the sources covered
    # the cut edge: the line (the ring of the half-plane) where it runs inside the sources
    su0 = unary_union(srcs)
    cutg = west.boundary.intersection(su0)
    segs = []
    for x in getattr(cutg, 'geoms', [cutg]):
        if x.geom_type == 'LineString' and not x.is_empty:
            segs.append(x)
    merged = linemerge(segs) if segs else None
    res['cut'] = [[list(c) for c in ls.coords] for ls in (getattr(merged, 'geoms', [merged]) if merged is not None else [])]
    ru, su = unary_union(results), unary_union(srcs_all)
    res['gapKm2'] = km2(su.difference(ru))
    res['extraKm2'] = km2(ru.difference(su))
    ov = 0.0
    for i in range(len(results)):
        for j in range(i + 1, len(results)):
            ov = max(ov, km2(results[i].intersection(results[j])))
    res['overlapKm2'] = ov
    return res


def op_audit(req):
    from shapely.ops import transform
    def sc(x, y, z=None):  # degrees -> metres (the metric of lib.mjs), so buffers are round
        return (x * KX, y * KY)
    shapes = [transform(sc, to_shape(a['geom'])) for a in req['areas']]
    g = req.get('gapM', 20.0)
    line = transform(sc, LineString(req['line']))
    strip = line.buffer(3 * g)
    ov = 0.0
    for i in range(len(shapes)):
        for j in range(i + 1, len(shapes)):
            ov += shapes[i].intersection(shapes[j]).intersection(strip).area
    um = unary_union(shapes)
    gap = um.buffer(g).buffer(-g).difference(um).intersection(strip)  # slivers up to 2 g wide between the areas
    return {'overlapKm2': ov / 1e6, 'gapKm2': gap.area / 1e6, 'lineKm': line.length / 1000.0}


def main():
    req = json.loads(sys.stdin.buffer.read().decode('utf-8'))
    op = req['op']
    if op == 'carve':
        out = op_carve(req)
    elif op == 'audit':
        out = op_audit(req)
    elif op == 'version':
        out = {'shapely': shapely.__version__}
    elif op == 'streetBlock':
        from shapely.geometry import Point
        from shapely.ops import polygonize
        streets = [unary_union([LineString(line) for line in s['lines']]) for s in req['streets']]
        faces = [p for p in polygonize(unary_union(streets)) if p.contains(Point(req['seed']))]
        if len(faces) != 1:
            raise SystemExit('streetBlock: expected one enclosed face at seed, got ' + str(len(faces)))
        face = faces[0]
        if len(face.interiors) or any(face.boundary.intersection(s).length < 1e-6 for s in streets):
            raise SystemExit('streetBlock: face must have no holes and touch all named streets')
        out = {'ring': from_shape(face)['outer'][0], 'km2': km2(face)}
    else:
        raise SystemExit('carve.py: unknown op ' + str(op))
    sys.stdout.write(json.dumps(out, ensure_ascii=True))


if __name__ == '__main__':
    main()
