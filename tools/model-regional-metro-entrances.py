"""Author the architectural sections of the regional station fronts in Blender.
Run with blender -b --factory-startup -P tools/model-regional-metro-entrances.py.
Meshes use local +Z toward the pavement in the game. Coordinates export in mm.
"""
import json
import math
from pathlib import Path

import bmesh
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
parts = {}


def mesh(name, points, faces):
    data = bpy.data.meshes.new(name)
    data.from_pydata([(x, -z, y) for x, y, z in points], [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    parts.setdefault(name, []).append(data)


def section(name, polygon, back, front):
    n = len(polygon)
    points = [(x, y, z) for z in (back, front) for x, y in polygon]
    faces = [list(range(n)), list(range(n, 2*n))]
    faces += [[i, (i+1) % n, (i+1) % n + n, i+n] for i in range(n)]
    mesh(name, points, faces)


def lathe(name, rings, sides):
    def point(r, y, i):
        a = (i+.5) * 2*math.pi/sides
        return r*math.cos(a), y, r*math.sin(a)
    points = [point(r,y,i) for r,y in rings for i in range(sides)]
    faces = [list(range(sides)), list(range(len(points)-sides,len(points)))]
    for k in range(len(rings)-1):
        for i in range(sides):
            a = k*sides+i
            b = k*sides+(i+1) % sides
            faces.append([a,b,b+sides,a+sides])
    mesh(name,points,faces)


# Each voussoir has its own bevel and two radial reveals at its joints.
for i in range(19):
    a = math.pi*(i+.028)/19
    b = math.pi*(i+.972)/19
    key = i == 9
    pts = [(r*math.cos(t), r*math.sin(t)) for t,r in
           [(a,1.0),(a,1.145 if key else 1.10),(b,1.145 if key else 1.10),(b,1.0)]]
    section("voussoirs",pts,-.095,.145 if key else .10)
# Three-dimensional radial tracery in the arched transom, glass is separate.
for i in range(1,10):
    a = i*math.pi/10
    ux,uy=math.cos(a),math.sin(a)
    t=.013
    section("fanlight",[(r*ux-s*t*uy,r*uy+s*t*ux) for r,s in
                        [(.025,-1),(.978,-1),(.978,1),(.025,1)]],.006,.046)
for i in range(24):
    a,b=i*math.pi/24,(i+1)*math.pi/24
    section("fanlight",[(r*math.cos(t),r*math.sin(t)) for t,r in
                        [(a,.53),(a,.555),(b,.555),(b,.53)]],.004,.050)
section("fan-glass",[(math.cos(i*math.pi/32),math.sin(i*math.pi/32)) for i in range(33)],-.055,-.018)
# The flared concrete capitals at Moskovskie Vorota; fluting follows the changing section.
lathe("flare",[(.21,0),(.225,.035),(.19,.12),(.20,.61),(.29,.78),(.51,.94),(.56,.975),(.56,1)],16)
# Cast cornice with two fillets, a projecting cyma and a sloping drip edge.
profile=[(-.32,0),(.12,0),(.13,.09),(.24,.11),(.29,.18),(.36,.23),(.38,.27),(.45,.28),(.46,.34),(-.32,.34)]
n=len(profile)
mesh("cornice",[(x,y,z) for x in (-.5,.5) for z,y in profile],
     [list(range(n)),list(range(n,n*2))]+[[i,(i+1)%n,(i+1)%n+n,i+n] for i in range(n)])
# Pionerskaya: the folds continue to the soffit; the V-shaped lip can be seen from below.
section("fold",[(-.5,.08),(0,.44),(.5,.08),(.5,0),(0,.33),(-.5,0)],-.24,1.0)
# A shallow tiered cupola with a drum, pronounced ribs and an upper lantern.
lathe("dome",[(1,0),(1,.045),(.96,.055),(.96,.19),(.91,.205),(.89,.28),
              (.82,.42),(.68,.57),(.49,.70),(.27,.80),(.12,.835),(.10,.86),(.065,.89),(.03,.895)],40)
# Pressed metal rib panels of the curved Chernaya Rechka frontage.
section("rib",[(-.05,0),(.05,0),(.042,.87),(0,1),(-.042,.87)],-.02,.12)

packed={}
for name, meshes in parts.items():
    vertices, indices=[],[]
    for data in meshes:
        offset=len(vertices)//3
        vertices.extend(round(k*1000) for v in data.vertices for k in (v.co.x,v.co.z,-v.co.y))
        data.calc_loop_triangles()
        indices.extend(offset+i for tri in data.loop_triangles for i in tri.vertices)
    packed[name]=[vertices,indices]
target=Path(__file__).resolve().parents[1]/"src/world/metro/regional-architecture-mesh.js"
target.write_text("// Authored in Blender with tools/model-regional-metro-entrances.py.\nexport const architecture = "+
                  json.dumps(packed,separators=(",",":"))+";\n",encoding="utf-8")
print("REGIONAL ARCHITECTURE",len(packed),"meshes,",sum(len(i)//3 for _,i in packed.values()),"triangles")
