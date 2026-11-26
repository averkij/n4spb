"""Build the Admiralty ship vane and Aurora bower anchors in Blender.

Run from the repository with blender -b -P tools/model-maritime-details.py.
Only local geometry is exported. Both landmarks keep their normal toon materials.

Ship reference (2016, with the fretwork and the mounting crown visible):
https://commons.wikimedia.org/wiki/File:The_ship_on_the_Admirality_on_the_steeple_of_Admirality,_St._Petersburg.jpg
1977 restoration photograph:
https://spbvedomosti.ru/news/nasledie/operatsiya-shpil-kak-restavrirovali-korablik-na-admiralteystve/
Anchor faces, eye, retaining stock and flukes:
https://commons.wikimedia.org/wiki/File:Cruiser_Aurora_anchors_(4082720660).jpg
"""
import math
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

WORLD = Path(__file__).resolve().parents[1] / "src" / "world"
parts = []


def section(name, outlines):
    """Loft consecutive equal-sized loops. Coordinates are in Blender's Z-up frame."""
    n = len(outlines[0])
    verts = [p for ring in outlines for p in ring]
    faces = [tuple(range(n))]
    for row in range(len(outlines) - 1):
        start = row * n
        for i in range(n):
            j = (i + 1) % n
            faces.append((start + i, start + j, start + j + n, start + i + n))
    faces.append(tuple(range(len(verts) - n, len(verts))))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    parts.append(mesh)


def rod(name, a, b, radius, sides=6):
    axis = (Vector(b) - Vector(a)).normalized()
    u = axis.orthogonal().normalized()
    v = axis.cross(u)
    section(name, [[Vector(p) + radius * (u * math.cos(i * math.tau/sides)
                         + v * math.sin(i * math.tau/sides)) for i in range(sides)] for p in (a, b)])


def plate(name, points, thickness, depth=0):
    section(name, [[(x, depth + offset, z) for x, z in points]
                   for offset in (-thickness/2, thickness/2)])


def vane():
    # Copper broadside is cut through both rows of gun ports. Build the metal
    # around them, following the raised stern and the upturned bow.
    deck = [(-.86,.54),(-.64,.47),(-.41,.43),(-.18,.42),(.05,.42),(.28,.44),(.51,.49),(.70,.55)]
    for (a, ya), (b, yb) in zip(deck, deck[1:]):
        def pt(t, v):
            return (a+(b-a)*t, ya+(yb-ya)*t+v)
        for row in range(2):
            low = -.18 + row*.09
            for u0, u1, v0, v1 in [(0,.33,0,.09),(.67,1,0,.09),(.33,.67,0,.021),(.33,.67,.068,.09)]:
                plate("pierced gun deck", [pt(u0,low+v0), pt(u1,low+v0), pt(u1,low+v1), pt(u0,low+v1)], .025)
    plate("keel", [(x,y-.18) for x,y in deck] + [(.60,.25),(.35,.17),(-.31,.15),(-.75,.22),(-.86,.31)], .044)
    plate("stem", [(.70,.37),(.70,.55),(.98,.76),(.88,.55)], .025)
    rod("bowsprit", (.67,0,.51), (1.06,0,.86), .015)
    for x, base, height, width in [(-.62,.47,1.12,.19),(-.13,.42,1.58,.31),(.43,.47,1.40,.26)]:
        top = x-.043
        rod("mast", (x,0,base), (top,0,height), .015)
        # Cut sheet sails bow in profile and cast a shadow on their own mast.
        for frac, size in [(0.58,1),(0.84,.69)]:
            high = base + (height-base)*frac
            low = high - (height-base)*.235
            w = width*size
            rod("yard", (x-w,-.023,high), (x+w,-.023,high+.015), .013)
            section("filled sail", [[(x-w*k, depth-.008, z),(x+w*k,depth-.008,z+.016),
                                    (x+w*k,depth+.008,z+.016),(x-w*k,depth+.008,z)]
                                   for z,depth,k in [(low,.006,.82),((low+high)/2,-.053,.94),(high,-.024,1)]])
        for sign in [-1,1]:
            rod("shroud", (x+sign*width,0,base), (top,0,height-.05), .008, 4)
    rod("forestay", (.39,0,1.36), (1.04,0,.85), .009, 4)
    rod("stay", (-.17,0,1.55), (.40,0,.69), .009, 4)
    rod("spindle", (0,0,-.12), (0,0,.27), .037)
    for i in range(8):
        a = i*math.tau/8
        c,s = math.cos(a),math.sin(a)
        path = [(0.11,-.042),(.145,.012),(.12,.072),(.045,.115)]
        for (r,z),(q,h) in zip(path,path[1:]):
            rod("crown arch",(r*c,r*s,z),(q*c,q*s,h),.012,4)
        b = (i+1)*math.tau/8
        rod("coronet",(.11*c,.11*s,-.042),(.11*math.cos(b),.11*math.sin(b),-.042),.024,6)


def anchor():
    # Local origin is the crown. -Y faces away from the hull. The flukes turn
    # back towards the ship and wrap around a common pivot at the foot of the shank.
    def oval(z, rx, ry, at=0):
        return [(rx*math.cos(i*math.tau/8),at+ry*math.sin(i*math.tau/8),z) for i in range(8)]
    section("forged shank",[oval(.22,.17,.095),oval(.60,.14,.10),
                            oval(2.77,.105,.074),oval(3.08,.125,.079)])
    plate("crown", [(-.69,.40),(-.43,.08),(-.22,0),(.23,0),(.46,.10),(.70,.40),(.65,.50),(-.64,.50)], .31)
    plate("stock", [(-.92,2.57),(-.90,2.64),(-.31,2.43),(.31,2.43),(.90,2.64),(.92,2.57),
                    (.32,2.29),(-.31,2.29)], .15, -.04)
    for side in (-1,1):
        # Each lip has a raised central arris, giving the fluke a visible
        # ridge and thickness even at a shallow angle to the quay.
        sections = [(.38,.37,.35,0),(.57,.59,.41,-.035),(.67,.95,.34,-.095),
                    (.70,1.22,.23,-.13),(.70,1.43,.035,-.16)]
        rings = []
        for x,z,w,y in sections:
            rings.append([(side*x-w/2,y,z),(side*x,y-.14,z),(side*x+w/2,y,z),(side*x,y+.065,z)])
        section("palmed fluke",rings)
    rod("pivot",(-.24,-.05,.30),(.24,-.05,.30),.115,8)
    # Loft a closed elliptical ring using beveled paths; unlike a filled oval,
    # the lifting eye has an aperture which reads against the grey plating.
    for i in range(14):
        def eye(j):
            a=j*math.tau/14
            return (.19*math.cos(a),-.015,3.22+.255*math.sin(a))
        rod("lifting eye",eye(i),eye(i+1),.047)


def export(path, name):
    # Propagate Blender face normals as sharp boundaries across folds, then
    # share the remaining vertices. Positions are in millimetres to keep the
    # static JS data small; no asset fetch and no runtime modelling operations.
    pos, idx, lookup = [], [], {}
    for mesh in parts:
        for poly in mesh.polygons:
            normal = tuple(round(x,3) for x in poly.normal)
            for vertex in poly.vertices:
                x,y,z = mesh.vertices[vertex].co
                p = tuple(round(v*1000) for v in (x,z,-y))
                key = (p,normal)
                if key not in lookup:
                    lookup[key] = len(pos)//3
                    pos.extend(p)
                idx.append(lookup[key])
        bpy.data.meshes.remove(mesh)
    parts.clear()
    def lines(values):
        return "\n".join("  "+",".join(map(str,values[i:i+36]))+"," for i in range(0,len(values),36))
    template = """// Generated by tools/model-maritime-details.py (Blender). Positions in mm, Y up.
import * as THREE from 'three';

const positions = [
%s
];
const indices = [
%s
];

export function %s() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.scale(0.001, 0.001, 0.001);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
"""
    path.write_text(template % (lines(pos), lines(idx), name),encoding="utf-8", newline="\n")
    print(path.name, len(pos)//3, "vertices", len(idx)//3, "triangles")


vane()
export(WORLD/"landmarksH"/"ship-vane.js","shipVaneGeometry")
anchor()
export(WORLD/"landmarksAurora"/"bower-anchor.js","bowerAnchorGeometry")
