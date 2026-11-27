"""Build three independent district details in Blender, in metres.
Run blender -b -P tools/model-southwest-landmarks.py from the repo.
References and the modelled architectural features are in winter-southwest.md.
"""
from pathlib import Path
from math import cos, sin, pi, tau
import bpy
import bmesh
from mathutils import Vector

root=Path(__file__).resolve().parents[1]/"src/world"
parts={}

def surface(name,rows,close_ends=True):
    n=len(rows[0])
    vertices=[(x,-d,y) for row in rows for x,y,d in row]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
           for j in range(len(rows)-1) for i in range(n)]
    if close_ends:faces.extend([tuple(reversed(range(n))),tuple(range((len(rows)-1)*n,len(rows)*n))])
    geo=bpy.data.meshes.new(name)
    geo.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(geo)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(geo);bm.free()
    parts.setdefault(name,[]).append(geo)

def lathe(name,rings,n=20):
    surface(name,[[(r*cos(tau*i/n),y,r*sin(tau*i/n)) for i in range(n)] for r,y in rings])

def bevel_poly(name,outline,depth,thickness,shrink=.9):
    cx=sum(x for x,y in outline)/len(outline);cy=sum(y for x,y in outline)/len(outline)
    surface(name,[[(cx+(x-cx)*s,cy+(y-cy)*s,z) for x,y in outline]
                  for s,z in [(shrink,depth),(1,depth+thickness*.2),(1,depth+thickness*.7),(shrink,depth+thickness)]])

def quad(name,x0,x1,y0,y1,z,d):
    bevel_poly(name,[(x0,y0),(x1,y0),(x1,y1),(x0,y1)],z,d,.95)

def tube(name,points,r,n=7):
    points=[Vector(v) for v in points];rows=[]
    for i,p in enumerate(points):
        a=(points[min(i+1,len(points)-1)]-points[max(i-1,0)]).normalized()
        b=a.cross(Vector((0,0,1)))
        if b.length<.01:b=a.cross(Vector((1,0,0)))
        b.normalize();c=a.cross(b)
        rows.append([p+r*(cos(tau*k/n)*b+sin(tau*k/n)*c) for k in range(n)])
    surface(name,rows)

def save(file):
    # No external asset load. Each district imports only its own quantised mesh.
    strs=["// Generated in Blender by tools/model-southwest-landmarks.py. Metres in 1/1000 units.",
          "import * as THREE from 'three';","const groups = {"]
    for k,items in parts.items():
        coords=[];indices=[]
        for g in items:
            first=len(coords)//3
            coords.extend(round(v*1000) for p in g.vertices for v in (p.co.x,p.co.z,-p.co.y))
            indices.extend(first+i for poly in g.polygons for i in poly.vertices)
        strs.append("  "+k+": [["+','.join(map(str,coords))+"],["+','.join(map(str,indices))+"]],")
    strs.extend(["};","export function modelParts() {",
                 "  return Object.entries(groups).map(([name,[coords,indices]]) => {",
                 "    const geo=new THREE.BufferGeometry();",
                 "    geo.setAttribute('position',new THREE.Float32BufferAttribute(coords.map(n=>n*.001),3));",
                 "    geo.setIndex(indices);geo.computeVertexNormals();return [name,geo];","  });","}"])
    (root/file).write_text('\n'.join(strs)+'\n',encoding='utf8')
    print(file,sum(len(m.polygons) for items in parts.values() for m in items),"triangles")
    parts.clear()

# The flared sound bow turns back up INSIDE the bell, leaving a genuine cavity.
lathe("metal",[(.032,.82),(.20,.79),(.31,.68),(.34,.45),(.40,.19),(.52,-.025),
               (.60,-.09),(.59,-.14),(.52,-.12),(.40,.04),(.31,.26),(.25,.62),(.025,.68)],24)
for y,r in [(.65,.322),(.60,.336),(.01,.499),(-.058,.564)]:
    lathe("band",[(r-.005,y+.017),(r+.012,y+.012),(r+.010,y-.010),(r-.008,y-.016)],24)
for x in [-.13,.13]:
    tube("metal",[(x-.082,.75,0),(x-.082,.90,0),(x-.025,.96,0),(x+.066,.93,0),(x+.084,.75,0)],.034)
quad("beam",-.53,.53,.92,1.05,-.074,.148)
tube("clapper",[(0,.61,0),(.016,.16,0),(.07,-.16,0)],.027)
lathe("clapper",[(.025,-.26),(.076,-.23),(.10,-.16),(.07,-.105),(.028,-.095)],12)
save("landmarksPortChurch/bell-model.js")

# Avtovo's mirrored rooftop cartouches. A raised shield sits between spreading
# laurel sprays. The centre and leaf folds rise above the dark roof silhouette.
bevel_poly("bronze",[(-.46,.44),(-.47,1.16),(-.25,1.28),(0,1.23),(.25,1.28),(.47,1.16),(.46,.44),(.26,.27),(0,.14),(-.26,.27)],.08,.13)
bevel_poly("edge",[(-.40,.48),(-.405,1.11),(0,1.18),(.405,1.11),(.40,.48),(0,.23)],.196,.04)
for side in [-1,1]:
    tube("bronze",[(0,.20,.13),(side*.36,.32,.13),(side*.70,.61,.13),(side*.94,1.04,.13),(side*.98,1.25,.13)],.048)
    for j in range(7):
        t=j/7; x=side*(.23+.74*t); y=.31+.80*t*t
        for outward in [True,False]:
            dx=side*(.23 if outward else -.07);dy=.17 if outward else .26
            bevel_poly("edge",[(x,y),(x+dx*.3-.058,y+dy*.46),(x+dx,y+dy),(x+dx*.45+.063,y+dy*.54)],.13,.042)
for i in range(5):
    a=pi/2+tau*i/5; b=a+pi/5;c=a+2*pi/5
    bevel_poly("bronze",[(0,.79),(.105*cos(a),.79+.105*sin(a)),(.25*cos(b),.79+.25*sin(b)),
                         (.105*cos(c),.79+.105*sin(c))],.238,.04)
save("landmarksAvtovo-trophy.js")

# Three glazing lights per oak leaf and the deep panel below, as seen beneath
# the canopy. The existing doors stay folded alongside the passable portals.
quad("oak",-.45,.45,0,2.94,-.03,.06)
for j in range(4):
    y=.17+j*.67
    quad("moulding",-.365,.365,y,y+.55,.025,.032)
    quad("glass" if j else "recess",-.30,.30,y+.055,y+.495,.057,.006)
    if j:
        quad("oak",-.011,.011,y+.055,y+.495,.064,.016)
        quad("oak",-.30,.30,y+.295,y+.315,.064,.016)
tube("brass",[(.34,.99,.059),(.34,.99,.137),(.34,1.23,.137),(.34,1.23,.059)],.017)
save("landmarksNarvsky/door-model.js")
