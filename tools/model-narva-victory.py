"""Build Victory and the chariot of the Narva Gate in Blender, metres, facing +Z in game."""
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


parts = []


def solid(name, rings, circular=False):
    """Loft across closed profiles, optionally closing the sweep itself (wheel rims)."""
    n = len(rings[0])
    verts = [(x, -z, y) for row in rings for x, y, z in row]
    faces = []
    for i in range(len(rings) if circular else len(rings)-1):
        a, b = i*n, ((i+1) % len(rings))*n
        for j in range(n):
            k = (j+1) % n
            faces.append((a+j, a+k, b+k, b+j))
    if not circular:
        faces += [tuple(reversed(range(n))), tuple(range(len(verts)-n, len(verts)))]
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    parts.append(data)


def line(name, points, n=6, loop=False):
    rows = []
    for i,(x,y,z,r) in enumerate(points):
        prev = points[(i-1) % len(points) if loop else max(0,i-1)]
        nxt = points[(i+1) % len(points) if loop else min(len(points)-1,i+1)]
        v = (Vector(nxt[:3])-Vector(prev[:3])).normalized()
        # Wheel profiles lie in the YZ plane. Foliage and limbs do not
        # need a transported frame beyond each short tapered element.
        axis = (1,0,0) if abs(v.x) < .86 else (0,0,1)
        a = v.cross(Vector(axis)).normalized()
        b = v.cross(a)
        rows.append([Vector((x,y,z)) + r*(a*math.cos(t*math.tau/n)+b*math.sin(t*math.tau/n)) for t in range(n)])
    solid(name,rows,loop)


def body(name, stations, n=12, flute=0):
    rows = []
    for x,y,z,rx,rz,twist in stations:
        row = []
        for i in range(n):
            a = i*math.tau/n
            f = 1+flute*math.cos(8*a)
            row.append((x+rx*f*math.cos(a+twist),y,z+rz*f*math.sin(a+twist)))
        rows.append(row)
    solid(name,rows)


# Open at the rear; the raised, scalloped bronze rail follows the curved front.
shell = []
for i in range(23):
    a = -2.25+4.5*i/22
    x,z = 1.02*math.sin(a), 1.08*math.cos(a)
    top = 1.54 + .56*math.cos(a)
    shell.append([(x*.79,.69,z*.82), (x,.84,z), (x*1.1,top,z*1.1),
                  (x*1.01,top+.025,z*1.01), (x*.90,.92,z*.90)])
solid('curved chariot apron',shell)
body('car platform',[(0,.62,-.02,1.02,1.12,0),(0,.83,-.02,1.04,1.14,0)])
for side in (-1,1):
    for j in range(3):
        spread=.28+j*.25
        line('embossed front palmette',[(side*.07,1.09,1.12,.045),
             (side*spread*.75,1.38+j*.04,1.14-spread*.19,.080),
             (side*spread,1.72-j*.08,1.14-spread*.36,.018)],5)
line('apron beading',[(1.1*1.02*math.sin(a),1.56+.56*math.cos(a),1.1*1.08*math.cos(a),.062)
                      for a in [-2.25+i*4.5/22 for i in range(23)]])
for side in (-1,1):
    x=side*1.13
    line('wheel tyre',[(x,.90+.84*math.cos(i*math.tau/24),.84*math.sin(i*math.tau/24),.083) for i in range(24)],6,True)
    for i in range(10):
        a=i*math.tau/10
        line('cast spoke',[(x,.90,0,.071),(x,.90+.80*math.cos(a),.80*math.sin(a),.042)],5)
    line('hub',[(side*.94,.90,0,.14),(side*1.30,.90,0,.16)])
    line('trace pole',[(side*.60,1.04,.28,.090),(side*.61,.88,2.75,.105),(side*.66,1.04,4.03,.067)])

# Feet are hidden behind the apron. The diagonal raised knee turns the lower
# garment while the eight deeper skirt folds twist into the girdle.
body('wind-swept pleated chiton',[
    (.06,.84,-.12,.66,.57,0), (.06,1.18,-.15,.72,.57,.05), (.01,1.76,-.12,.62,.52,.19),
    (-.10,2.40,.12,.54,.50,.32),(-.12,2.91,.16,.54,.43,.41),(.01,3.47,0,.50,.42,.23),
    (.03,3.85,-.02,.34,.34,.17),(.03,4.15,-.06,.34,.32,.09)],32,.15)
body('draped bodice',[(.03,3.49,-.01,.43,.38,.2),(.01,3.91,0,.35,.31,0),
                      (.02,4.21,.02,.46,.34,.12),(.0,4.57,-.02,.67,.40,.17),(.02,4.74,-.08,.45,.29,0)],24,.056)
body('girdle',[(.02,3.83,0,.38,.335,0),(.02,3.94,0,.39,.34,0)],16)
# The chiton is pinned at the shoulder and falls diagonally over the forward
# knee. Ridges are embedded along the garment, tapering back into its pleats.
for j in range(3):
    line('pinned folds',[(.43-j*.05,4.65,-.01+j*.045,.036),(.28-j*.08,4.43,.30+j*.017,.075),
         (-.03-j*.05,4.19,.37,.079),(-.25-j*.033,4.05-j*.05,.24,.034)],5)
for j in range(3):
    line('hip to knee drape',[(-.30,3.86-j*.10,.18,.047),(-.13,3.57-j*.14,.36,.086),
         (.18,3.33-j*.13,.38,.095),(.39,3.10-j*.14,.27,.071),(.39,2.88-j*.09,.15,.025)],5)
line('neck',[(.01,4.59,-.01,.23),(.03,4.96,.02,.18)])
body('face',[(.04,4.88,.08,.18,.22,0),(.04,5.01,.09,.28,.29,0),(.02,5.34,.06,.32,.32,0),
             (.01,5.51,-.01,.28,.29,0),(0,5.59,-.03,.13,.16,0)])
body('bound hair',[(.02,4.99,-.16,.27,.19,0),(.0,5.30,-.09,.34,.31,0),
                   (.0,5.53,-.06,.30,.29,0),(.0,5.64,-.11,.16,.16,0)])
line('profile',[(.00,5.32,.34,.083),(-.015,5.16,.43,.069),(.0,5.12,.33,.065)])
body('hair knot',[(0,5.12,-.39,.11,.10,0),(0,5.31,-.40,.20,.17,0),(0,5.48,-.40,.12,.12,0)])
line('right arm to wreath',[(-.42,4.56,0,.21),(-.73,4.38,.10,.19),(-1.00,4.08,.22,.136),
                            (-1.21,4.14,.57,.12),(-1.31,4.18,.71,.145)])
line('left arm to palm',[(.44,4.57,0,.22),(.69,4.25,-.04,.17),(.80,3.97,.08,.13),
                         (.79,4.23,.37,.12),(.79,4.52,.47,.14)])

# The photograph shows an open V from the front, and large swept-back wings
# in profile. Each feather is a tapered, keeled closed volume.
for s in (-1,1):
    line('wing leading edge',[(s*.31,4.33,-.19,.17),(s*.58,5.08,-.46,.24),
                              (s*.96,5.90,-.86,.19),(s*1.47,6.81,-1.38,.105),(s*1.88,7.49,-1.78,.032)])
    for i in range(10):
        t=i/10
        root = Vector((s*(.34+.67*t),4.39+1.62*t,-.24-.71*t))
        end = Vector((s*(.57+1.29*t),4.70+2.88*t,-1.25-.73*t))
        mid = root.lerp(end,.54)
        row=[]
        for p,w in [(root,.079),(mid,.15), (root.lerp(end,.84),.107),(end,.012)]:
            row.append([p+Vector((s*w,0,-.19*w)),p+Vector((0,.22*w,.54*w)),
                        p+Vector((-s*w,0,.19*w)),p+Vector((0,-.22*w,-.54*w))])
        solid('flight feather',row)

line('laurel wreath',[(-1.31+.48*math.cos(t*math.tau/18),4.20+.10*math.sin(t*math.tau/18),
                       1.12+.43*math.sin(t*math.tau/18),.061) for t in range(18)],5,True)
for i in range(14):
    a=i*math.tau/14
    line('laurel sprays',[(-1.31+.47*math.cos(a),4.19,1.12+.42*math.sin(a),.04),
                          (-1.31+.53*math.cos(a+.09),4.27,1.12+.48*math.sin(a+.09),.073),
                          (-1.31+.59*math.cos(a+.20),4.30,1.12+.52*math.sin(a+.20),.015)],4)
line('palm stem',[(.77,3.89,.46,.052),(.79,4.52,.46,.075),(.88,5.26,.48,.054),(1.00,5.91,.42,.018)])
for i in range(8):
    f=i/8
    for s in (-1,1):
        x=.81+f*.15; y=4.33+1.32*f; z=.46
        line('palm leaflet',[(x,y,z,.037),(x+s*.19,y+.23,z,.082),(x+s*(.30-.14*f),y+.55,z-.05,.009)],4)

# Blender owns triangulation and consistent outward normals. The compact mesh
# can enter the existing Narva material/LOD batch synchronously during baking.
vertices, indices = [], []
for mesh in parts:
    start = len(vertices)//3
    for vert in mesh.vertices:
        x,y,z = vert.co
        vertices.extend(round(v*1000) for v in (x,z,-y))
    for face in mesh.polygons:
        indices.extend(start+i for i in face.vertices)


def array(data):
    return '\n'.join('  '+','.join(str(n) for n in data[i:i+27])+',' for i in range(0,len(data),27))


dest = Path(__file__).resolve().parents[1]/'src/world/landmarksNarva-victory.js'
dest.write_text("""// Generated by tools/model-narva-victory.py with Blender. Millimetres, Y up.
import * as THREE from 'three';
const positions = [
%s
];
const indices = [
%s
];
export function narvaVictoryGeometry() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.scale(.001, .001, .001);
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
""" % (array(vertices),array(indices)),encoding='utf-8',newline='\n')
print(dest.name, len(vertices)//3, 'vertices,', len(indices)//3, 'triangles')
