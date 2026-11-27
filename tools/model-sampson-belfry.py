"""Blender source for the crowns, blind dormers and bronze of Sampson's belfry.

Run blender -b -P tools/model-sampson-belfry.py. The largest bell measures
2.20 m across the mouth and 2.10 m high including the cast suspension ears.
See docs/research/sampson-winter.md for photographs and dimensions.
"""
import json
import math
from pathlib import Path

import bmesh
import bpy


def solid(name, vertices, faces, smooth=False):
    # Author in architectural x/up/depth, model and triangulate in Blender Z-up.
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x, -d, y) for x, y, d in vertices], [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return mesh, smooth


def lathe(name, profile, sides, smooth=True, phase=0):
    vertices, faces = [], []
    for r, y in profile:
        for i in range(sides):
            a = phase + math.tau*i/sides
            vertices.append((r*math.sin(a), y, r*math.cos(a)))
    # Close the profile through its wall, keeping the bell mouth hollow.
    for j in range(len(profile)):
        k = (j + 1) % len(profile)
        for i in range(sides):
            n = (i + 1) % sides
            faces.append((j*sides+i, j*sides+n, k*sides+n, k*sides+i))
    return solid(name, vertices, faces, smooth)


def press(name, outline, depths):
    n = len(outline)
    vertices = [(x, y, z) for z in depths for x, y in outline]
    faces = [tuple(range(n)), tuple(range(n, 2*n))]
    faces += [(i, (i+1) % n, n+(i+1) % n, n+i) for i in range(n)]
    return solid(name, vertices, faces)


def ear(phase):
    # Oval pierced bronze crown loop in the radial plane.
    verts, faces = [], []
    for i in range(14):
        a = math.tau*i/14
        for j in range(6):
            b = math.tau*j/6
            r = .23 + (.19 + .052*math.cos(b))*math.cos(a)
            t = .052 * math.sin(b)
            verts.append((r*math.cos(phase)-t*math.sin(phase),
                          1.86+(.185+.055*math.cos(b))*math.sin(a),
                          r*math.sin(phase)+t*math.cos(phase)))
    for i in range(14):
        for j in range(6):
            k = ((i+1) % 14)*6
            faces.append((i*6+j,i*6+(j+1)%6,k+(j+1)%6,k+j))
    return solid("cast crown loop", verts, faces, True)


def pack(parts):
    positions, indices = [], []
    for mesh, smooth in parts:
        lookup = {}
        for poly in mesh.polygons:
            for i in poly.vertices:
                key = i if smooth else (i, tuple(round(n, 4) for n in poly.normal))
                if key not in lookup:
                    lookup[key] = len(positions)//3
                    x, y, z = mesh.vertices[i].co
                    positions.extend(round(v*1000) for v in (x, z, -y))
                indices.append(lookup[key])
        bpy.data.meshes.remove(mesh)
    return [positions, indices]


# One original profile for four gables; one dormer repeated on each roof facet.
parts = {
    "pediment": [press("blue tympanum", [(-4.30,0),(4.30,0),(0,2.05)], (-1.40,0))],
    "cornice": [
        press("cornice drip", [(-4.48,-.13),(4.48,-.13),(4.48,.12),(-4.48,.12)], (-.38,.16)),
        press("raking cornice", [(-4.47,.08),(0,2.26),(4.47,.08),(4.32,-.10),(0,1.94),(-4.32,-.10)], (-.46,.17)),
    ],
    "tent": [lathe("faceted masonry tent", [(4.45,0),(4.32,.22),(.91,7.72),(.87,8.08),(.15,8.08),(.15,0)], 8, False, math.pi/8)],
    "drum": [lathe("lantern collar", [(.90,0),(1.01,.09),(1.01,.27),(.84,.31),(.74,1.24),(.86,1.30),(.86,1.41),(.14,1.41),(.14,0)],8,False,math.pi/8)],
    "cupola": [lathe("blue onion", [(.59,0),(.80,.12),(1.03,.52),(1.04,.77),(.91,1.03),(.57,1.25),(.23,1.50),(.11,1.69),(.08,.03)],24)],
    "dormer": [
        press("dormer casing", [(-.44,0),(.44,0),(.44,.87),(0,1.09),(-.44,.87)],(-.67,.03)),
        press("dormer pediment", [(-.52,.83),(0,1.14),(.52,.83),(.47,.76),(0,1.00),(-.47,.76)],(-.25,.13)),
    ],
    "recess": [press("blind recess", [(-.235,.08),(.235,.08),(.235,.66),(0,.80),(-.235,.66)], (.035,.048))],
    "bell": [lathe("great bell exterior and interior",
        [(1.095,.038),(1.10,.083),(1.082,.117),(1.04,.14),(1.048,.163),(.966,.197),(.872,.298),
         (.785,.46),(.730,.70),(.664,1.07),(.643,1.11),(.663,1.14),(.646,1.18),(.623,1.21),
         (.609,1.38),(.625,1.405),(.603,1.446),(.584,1.49),(.515,1.565),(.256,1.665),(.13,1.687),
         (.11,1.55),(.433,1.477),(.52,1.395),(.633,.76),(.736,.39),(.908,.13),(.997,.038)],32)]
        + [ear(i*math.pi/3) for i in range(6)],
    "clapper": [lathe("iron clapper",[(.065,1.53),(.065,.31),(.133,.24),(.16,.10),(.113,-.018),(.072,-.05),(.058,-.13),(.041,-.14),(.035,1.53)],16)],
    "smallBell": [lathe("lesser bells", [(1.10,.03),(1.10,.12),(.96,.19),(.78,.45),(.65,1.04),(.66,1.12),(.61,1.36),(.62,1.41),(.52,1.53),(.24,1.63),(.13,1.92),(.09,1.92),(.10,1.50),(.48,1.36),(.68,.48),(.97,.03)],14)],
}
data = {name: pack(meshes) for name, meshes in parts.items()}
dest = Path(__file__).resolve().parents[1]/"src/world/landmarksSampson/belfry-mesh.js"
dest.parent.mkdir(exist_ok=True)
dest.write_text("// Built by tools/model-sampson-belfry.py in Blender; local metres in millimetres.\n"
                +"export const belfryMesh = "+json.dumps(data,separators=(",", ":"))+";\n", encoding="utf-8", newline="\n")
print("Blender belfry prototype triangles:", {k:len(v[1])//3 for k,v in data.items()})
