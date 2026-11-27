"""Blender relief for the Moscow Gate frieze. Run blender -b -P this-file.

The museum's elevation and restoration photographs are listed in
docs/research/moskovskaya-winter.md. Local drawing coordinates are metres,
with the front of the copper relief facing +Z in the game.
"""
from pathlib import Path
from math import sin, cos, tau

import bpy
import bmesh
from mathutils import Vector


verts, faces = [], []


def rings(rows):
    start, n = len(verts), len(rows[0])
    for row in rows:
        verts.extend((x, -depth, height) for x, height, depth in row)
    faces.append(tuple(start + i for i in range(n)))
    for k in range(len(rows)-1):
        for i in range(n):
            a = start + k*n+i
            b = start + k*n+(i+1)%n
            faces.append((a,b,b+n,a+n))
    faces.append(tuple(start+(len(rows)-1)*n+i for i in range(n)))


def turned(profile, n=10):
    rings([[(x+w*cos(tau*i/n), y, z+d*sin(tau*i/n)) for i in range(n)]
           for x,y,z,w,d in profile])


def embossed(outline, depth, bulge):
    # Rolled edges of beaten copper. The bevel creates a legible highlight
    # even when the figure and the entire frieze carry the same green paint.
    cx=sum(x for x,y in outline)/len(outline)
    cy=sum(y for x,y in outline)/len(outline)
    rings([[(cx+(x-cx)*s,cy+(y-cy)*s,z) for x,y in outline]
           for s,z in [(1,depth),(.92,depth+bulge*.67),(.76,depth+bulge)]])


# Draped chiton gathered above the advancing knee. Vary the circumference
# and phase down the robe to produce deep oblique folds and an irregular hem.
rows=[]
for x,y,w,d,phase,pleat in [
    (-.09,.10,.39,.20,.05,.23),(-.05,.27,.43,.23,.19,.21),
    (.05,.78,.35,.19,.50,.17),(.10,1.18,.22,.17,.72,.12),
    (.04,1.36,.27,.18,.86,.09),(.00,1.70,.30,.17,.96,.05),
    (.00,1.81,.15,.11,1,.02)]:
    row=[]
    for i in range(28):
        a=tau*i/28
        r=1+pleat*cos(7*(a+phase))
        row.append((x+w*r*cos(a),y+(.045*sin(3*a) if y<.4 else 0),.24+d*r*sin(a)))
    rows.append(row)
rings(rows)
turned([(.01,1.76,.23,.10,.10),(.01,1.90,.23,.11,.10)])
turned([(.01,1.86,.24,.07,.09),(.03,1.93,.27,.14,.12),
        (.03,2.10,.26,.16,.14),(.02,2.18,.24,.13,.11),(.01,2.21,.23,.045,.06)])
embossed([(-.11,1.98),(.08,2.07),(.20,2.06),(.15,2.19),(.04,2.23),(-.12,2.19),(-.18,2.09)],.31,.08)
# One feathered wing spreads back and down, the other is foreshortened behind the shield.
for side, span in [(-1,1),(1,.78)]:
    def wing(poly,d,b):
        embossed([(side*x*span,y) for x,y in poly],d,b)
    wing([(.08,1.62),(.21,1.99),(.47,2.23),(.65,2.19),
          (.79,1.91),(.77,1.42),(.63,.91),(.35,1.24)],.09,.12)
    for k in range(6):
        x=.21+k*.09; y=1.92+.055*sin(k*.8)
        wing([(x-.08,y),(x+.055,y+.09),(x+.13,y-.20),
              (x+.15,y-.36-k*.084),(x+.02,y-.24)],.19,.055)
# One forearm reaches across the torso and lifts the heraldic shield at its rim.
turned([(-.15,1.39,.34,.09,.10),(-.24,1.60,.35,.135,.11),(-.22,1.76,.28,.12,.10)],8)
turned([(-.15,1.36,.35,.10,.09),(.08,1.45,.42,.12,.095),(.36,1.57,.46,.08,.07)],8)
embossed([(.26,1.66),(.38,1.99),(.68,2.05),(.89,1.82),(.76,1.44),(.45,1.30)],.28,.13)
embossed([(.36,1.66),(.44,1.93),(.65,1.97),(.78,1.81),(.69,1.51),(.46,1.42)],.415,.035)
embossed([(.48,1.80),(.59,1.76),(.63,1.87),(.70,1.82),(.65,1.72),(.68,1.59),
          (.60,1.64),(.54,1.56),(.54,1.69),(.44,1.72)],.454,.04)

data=bpy.data.meshes.new("Winged genius")
data.from_pydata(verts,[],faces)
bm=bmesh.new()
bm.from_mesh(data)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bmesh.ops.triangulate(bm,faces=list(bm.faces))
bm.to_mesh(data)
bm.free()
points=[str(round(v*1000)) for p in data.vertices for v in (p.co.x,p.co.z,-p.co.y)]
indices=[str(i) for p in data.polygons for i in p.vertices]
out=Path(__file__).resolve().parents[1]/"src/world/landmarksMoskovsky/genius-mesh.js"
out.write_text("// Generated in Blender by tools/model-moskovsky-gate-genius.py (mm, Y up).\n"
               +"export const GENIUS_MM = ["+",".join(points)+"];\n"
               +"export const GENIUS_TRI = ["+",".join(indices)+"];\n",encoding="utf8")
print("Winged genius",len(data.vertices),"vertices;",len(data.polygons),"triangles")
