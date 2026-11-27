"""Rebuild western Vasilievsky landmark details with Blender -b -P tools/model-west-details.py."""
from pathlib import Path
from math import cos, sin, pi, tau

import bpy
import bmesh
from mathutils import Vector


parts = {}


def loft(key, name, rows, loop=False):
    n = len(rows[0])
    vertices = [(x, -z, y) for row in rows for x, y, z in row]
    faces = []
    for i in range(len(rows) if loop else len(rows)-1):
        a, b = i*n, (i+1) % len(rows)*n
        for j in range(n):
            k = (j+1) % n
            faces.append((a+j,a+k,b+k,b+j))
    if not loop:
        faces += [tuple(reversed(range(n))), tuple(range(len(vertices)-n,len(vertices)))]
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    parts.setdefault(key, []).append(data)


def wire(key, name, path, count=6, loop=False, reference=None):
    rows=[]
    for i,(x,y,z,r) in enumerate(path):
        prev = path[(i-1)%len(path) if loop else max(0,i-1)]
        nxt = path[(i+1)%len(path) if loop else min(len(path)-1,i+1)]
        d = (Vector(nxt[:3])-Vector(prev[:3])).normalized()
        axis = reference or ((1,0,0) if abs(d.x)<.85 else (0,0,1))
        a = d.cross(Vector(axis)).normalized()
        b = d.cross(a)
        rows.append([Vector((x,y,z))+r*(a*cos(j*tau/count)+b*sin(j*tau/count)) for j in range(count)])
    loft(key,name,rows,loop)


def lathe(key,name,x,z,profile,n):
    loft(key,name,[[(x+r*cos(i*tau/n),h,z+r*sin(i*tau/n)) for i in range(n)] for h,r in profile])


# Box dormers penetrate the sloping sheet-metal roofs; their front faces
# are upright. Ovals have a projecting double moulding and a recessed grille.
profile=[(-.70,-.50),(.70,-.50),(.70,.29),(.54,.44),(.28,.52),(-.28,.52),(-.54,.44),(-.70,.29)]
loft('dormer','formed zinc dormer cheek',[[(x,y,z) for x,y in profile] for z in (-.60,.24)])
loft('dormer','rolled cap lip',[[(x*1.05,y*.26+.40,z) for x,y in profile] for z in (-.53,.31)])
oval=[(cos(i*tau/28),sin(i*tau/28)) for i in range(28)]
loft('dormerGlass','recessed oval',[[ (x*.49,y*.29,z) for x,y in oval] for z in (.241,.251)])
for rx,ry,depth,radius in [(.51,.311,.270,.053),(.455,.267,.275,.02)]:
    wire('dormerTrim','rolled oval bead',[(x*rx,y*ry,depth,radius) for x,y in oval],6,True,(0,0,1))
for x in [-.15,.15]:
    wire('dormerTrim','vertical glazing bar',[(x,-.233,.266,.016),(x,.233,.266,.016)],5)
wire('dormerTrim','glazing bar',[(-.45,0,.26,.016),(.45,0,.26,.016)],5)

# Agayan's bronze ship has a distinct rising prow behind the billowed surfaces
# and three broad sails superposed vertically in the frontal museum photograph.
stations=[(-.53,.015,.22,.04),(-.43,.095,.14,-.01),(-.24,.155,.10,-.07),(.16,.16,.11,-.08),
          (.36,.13,.17,-.02),(.50,.03,.29,.09)]
loft('fleetShip','hollowed hull',[[(x,y,z) for y,z in [(top,w),(bot+.03,w*.45),(bot,0),(bot+.03,-w*.45),
    (top,-w),(top+.015,-w*.78),(top-.042,0),(top+.015,w*.78)]] for x,w,top,bot in stations])
wire('fleetShip','curved prow stem',[(.34,.09,0,.042),(.48,.20,0,.049),(.51,.43,0,.039),(.45,.63,0,.026),(.34,.75,0,.012)])
wire('fleetShip','mainmast',[(-.12,.03,0,.04),(-.13,.46,0,.037),(-.18,1.08,0,.02)])
for bottom,width,height in [(.20,.245,.34),(.52,.210,.27),(.78,.161,.24)]:
    rows=[]
    for j in range(6):
        u=j/5; x=-.13-.045*u
        half=width*(1-.27*u); y=bottom+height*u
        front=[(x+t*half,y+.038*t*t,.042+.114*(1-t*t)+.12*sin(pi*u)) for t in [-1,-.5,0,.5,1]]
        rows.append(front+[(a,b,c-.026) for a,b,c in reversed(front)])
    loft('fleetShip','curled bronze sail',rows)
    wire('fleetShip','yard',[(-.14-width*.76,bottom+height,0.064,.017),(-.14+width*.76,bottom+height,0.064,.017)])
wire('fleetShip','forestay',[(-.18,1.02,0,.014),(.49,.27,0,.014)],5)

# The other emblem is a modern three-bladed screw. Each blade is twisted
# about its root and widens toward its rounded swept-back tip.
wire('fleetScrew','boss',[(0,0,-.10,.115),(0,0,.06,.16),(0,0,.18,.08)],12)
for i in range(3):
    a=i*tau/3
    rows=[]
    for r,w,sweep,z in [(.07,.053,0,.016),(.17,.097,.17,.042),(.32,.145,.38,.061),(.48,.11,.52,.072),(.53,.035,.61,.069)]:
        t=a+sweep; ux,uy=cos(t),sin(t);vx,vy=-uy,ux
        rows.append([(r*ux+v*w*vx,r*uy+v*w*vy,z+w*(v*.43+th)) for v,th in [(-1,0),(0,.42),(1,0),(0,-.26)]])
    loft('fleetScrew','pitched blade',rows)

# The existing octagonal drum supports the gold onion. The photo shows vertical
# sheet divisions, a narrow conical neck, a ball, and a pierced double-bar cross.
profile=[(0,.61),(.12,.71),(.27,.86),(.50,.99),(.76,1.02),(1.00,.95),(1.23,.81),
         (1.42,.62),(1.61,.37),(1.77,.19),(1.91,.105),(2.04,.082)]
lathe('xeniaGold','gold leaf onion',0,0,profile,36)
for i in range(12):
    a=i*tau/12
    wire('xeniaGold','folded vertical seam',[(r*cos(a),h,r*sin(a),.012) for h,r in profile],4)
lathe('xeniaGold','cross foot and ball',0,0,[(1.97,.1),(2.05,.15),(2.14,.175),(2.24,.13),(2.31,.075)],16)
cross='xeniaCross'
wire(cross,'upright',[(0,2.24,0,.062),(0,2.79,0,.065),(0,3.54,0,.052)],8)
for x,y,tilt in [(.413,3.03,0),(.235,3.38,0),(.25,2.63,-.36)]:
    wire(cross,'bar',[(-x,y-x*tilt,0,.050),(x,y+x*tilt,0,.050)],6)
for dx,dy in [(-.413,3.03),(.413,3.03),(-.235,3.38),(.235,3.38),(0,3.55)]:
    ax,ay=(1 if dx>0 else -1,0) if dx else (0,1)
    pts=[(dx+ax*.065+ax*.08*cos(a)-ay*.054*sin(a),dy+ay*.065+ay*.08*cos(a)+ax*.054*sin(a),0,.018) for a in (t*tau/10 for t in range(10))]
    wire(cross,'pierced finial',pts,5,True,(0,0,1))


def array(seq):
    return '\n'.join('  '+','.join(map(str,seq[i:i+30]))+',' for i in range(0,len(seq),30))


dest=Path(__file__).resolve().parents[1]/'src/world/west-landmark-details.js'
out=["// Generated by Blender via tools/model-west-details.py. Coordinates in millimetres, Y up.",
     "import * as THREE from 'three';", "const parts = {"]
for key,meshes in parts.items():
    vertices=[]; faces=[]
    for mesh in meshes:
        start=len(vertices)//3
        for v in mesh.vertices:
            x,y,z=v.co;vertices.extend(round(a*1000) for a in (x,z,-y))
        for p in mesh.polygons:faces.extend(start+j for j in p.vertices)
    out += [key+': [[',array(vertices),'], [',array(faces),']],']
    print(key,len(faces)//3,'triangles')
out.append("""};
const cache = new Map();
export function westDetail(key) {
  if (cache.has(key)) return cache.get(key);
  const [positions,indices] = parts[key], geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.scale(.001,.001,.001);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  cache.set(key,geometry);
  return geometry;
}
""")
dest.write_text('\n'.join(out),encoding='utf-8',newline='\n')
