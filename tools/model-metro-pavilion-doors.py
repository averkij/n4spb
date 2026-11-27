"""Rebuild the Y-up door joinery from Blender. blender -b -P tools/model-metro-pavilion-doors.py"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
parts = {}


def cube(group, x, height, depth, width, tall, thick):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -depth, height))
    obj = bpy.context.object
    obj.scale = (width, thick, tall)
    parts.setdefault(group, []).append(obj)


def rod(group, a, b, radius):
    start, end = (Vector((p[0], -p[2], p[1])) for p in (a, b))
    axis = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=axis.length, location=(start + end) * .5)
    obj = bpy.context.object
    obj.rotation_euler = axis.to_track_quat("Z", "Y").to_euler()
    parts.setdefault(group, []).append(obj)


# Leaf coordinates from the hinge axis to the latch; 1.0 x 2.3 m nominal.
for x in (.043, .957):
    cube("frame", x, 1.15, 0, .086, 2.3, .084)
for y, h in [(.092, .184), (2.233, .134)]:
    cube("frame", .5, y, 0, .83, h, .084)
cube("glass", .5, 1.175, 0, .83, 1.986, .025)
for x in (.094, .906):
    cube("bead", x, 1.175, .020, .017, 1.98, .022)
for y in (.193, 2.161):
    cube("bead", .5, y, .020, .818, .019, .022)
for z in (-.05, .05):
    cube("kick", .5, .09, z, .76, .111, .013)
    # U-shaped pull, two short turned necks, circular escutcheons.
    side = 1 if z > 0 else -1
    for y in (.84, 1.44):
        rod("hardware", (.867,y,z*.7), (.867,y,z + side*.02), .046)
        rod("hardware", (.867,y,z), (.867,y,z + side*.093), .022)
    rod("hardware", (.867,.84,z + side*.095), (.867,1.44,z + side*.095), .024)
for y in (.31, 1.95):
    rod("hardware", (.022,y,.035), (.022,y+.13,.035), .024)
cube("hardware", .29, 2.195, .073, .25, .067, .052)
rod("hardware", (.29,2.23,.095), (.10,2.295,.101), .013)
# Joinery of the historical oak leaves: a raised bottom panel and glazing bars.
cube("panel", .5, .41, 0, .83, .48, .094)
for x in (.117, .883):
    cube("mould", x, .411, .061, .034, .43, .027)
for y in (.212, .611):
    cube("mould", .5, y, .061, .74, .027, .026)
cube("mould", .5, 1.424, 0, .046, 1.49, .084)
for y in (.67, 1.43):
    cube("mould", .5, y, 0, .83, .065, .084)
# Avtovo's ornate metal doors have three brass rings in each dark panel.
for y in (.48, 1.16, 1.85):
    bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=5,major_radius=.252,minor_radius=.027,
                                    location=(.5,-.068,y),rotation=(math.pi/2,0,0))
    parts.setdefault("ring",[]).append(bpy.context.object)
for x in (.20,.80):
    cube("ring", x,1.16,.064,.022,1.94,.025)
# Applied safety stripes of the contemporary all-glass leaves.
for y in (1.01, 1.49):
    cube("stripe", .5, y, 0, .808, .067, .035)
# Full-width granite sill. The bevelled nosing and three milled anti-slip strips are visible head-on.
profile = [(-.15, -.100), (.39,-.10), (.39,-.026), (.36,0), (-.15,0)]
vertices = [(x,-d,y) for x in (-.5,.5) for d,y in profile]
faces = [(4,3,2,1,0), (5,6,7,8,9)] + [(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]
mesh = bpy.data.meshes.new("dressed granite sill")
mesh.from_pydata(vertices,[],faces)
obj = bpy.data.objects.new("sill",mesh)
bpy.context.collection.objects.link(obj)
parts["sill"] = [obj]
for d in (.255,.284,.313):
    cube("groove", 0,.001,d,.96,.003,.009)

bpy.context.view_layer.update()
packed = {}
for group, objects in parts.items():
    positions, indices = [], []
    for obj in objects:
        mesh = obj.data
        mesh.calc_loop_triangles()
        offset = len(positions)//3
        for v in mesh.vertices:
            p = obj.matrix_world @ v.co
            positions.extend(round(1000*k) for k in (p.x,p.z,-p.y))
        for tri in mesh.loop_triangles:
            indices.extend(offset+i for i in tri.vertices)
    packed[group] = [positions,indices]
target = Path(__file__).resolve().parents[1]/"src/world/lib/metro-pavilion-joinery.js"
target.write_text("// Generated in Blender by tools/model-metro-pavilion-doors.py, millimetres.\nexport const JOINERY = "+json.dumps(packed,separators=(",",":"))+";\n",encoding="utf-8")
print(target, sum(len(v[1])//3 for v in packed.values()), "triangles")
