"""Rebuild the three groups of northwest sculptural details in Blender.
Run blender --background --factory-startup --python tools/model-northwest-details.py.
All dimensions use metres in the landmark frame. See docs/research/winter-northwest.md.
"""
from math import cos, sin, tau, pi
from pathlib import Path
import json

import bpy
import bmesh
from mathutils import Vector


class Sculpture:
    def __init__(self):
        self.verts = []
        self.faces = []

    def loft(self, rings, caps=True, closed=False):
        count = len(rings[0])
        offset = len(self.verts)
        self.verts.extend(v for ring in rings for v in ring)
        for j in range(len(rings) if closed else len(rings)-1):
            a = offset + count*j
            b = offset + count*((j+1) % len(rings))
            for i in range(count):
                n = (i+1) % count
                self.faces.append([a+i, a+n, b+n, b+i])
        if caps and not closed:
            self.faces.extend([list(range(offset, offset+count))[::-1],
                               list(range(len(self.verts)-count, len(self.verts)))])

    def lathe(self, profile, sides=32):
        self.loft([[(r*cos(i*tau/sides), y, r*sin(i*tau/sides)) for i in range(sides)]
                   for r, y in profile])

    def tube(self, line, radii, sides=6):
        line = [Vector(p) for p in line]
        rings = []
        for i, (p, radius) in enumerate(zip(line, radii)):
            along = (line[min(i+1,len(line)-1)] - line[max(i-1,0)]).normalized()
            ref = Vector((0,0,1)) if abs(along.z)<.85 else Vector((0,1,0))
            u = along.cross(ref).normalized()
            v = along.cross(u)
            rings.append([tuple(p+radius*(u*cos(j*tau/sides)+v*sin(j*tau/sides))) for j in range(sides)])
        self.loft(rings)

    def oval(self, x, y, z, rx, ry, rz):
        # Small but finite polar rings give the carved faces a flat chin and crown.
        self.loft([[(x+rx*cos(t)*cos(a*tau/10), y+ry*sin(t), z+rz*cos(t)*sin(a*tau/10))
                    for a in range(10)] for t in [-1.52,-.85,-.28,.35,.94,1.52]])

    def triangulate(self, name):
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata([(x,-z,y) for x,y,z in self.verts],[],self.faces)
        bm=bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bmesh.ops.triangulate(bm,faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        pts=[round(c*1000) for v in mesh.vertices for c in (v.co.x,v.co.z,-v.co.y)]
        faces=[i for p in mesh.polygons for i in p.vertices]
        bpy.data.meshes.remove(mesh)
        return [pts,faces]


def propeller():
    blade=Sculpture()
    for sign in [-1,1]:
        rings=[]
        # Trace the swept silhouette of the two stationary sculpture blades.
        for span, width, sweep, depth in [(.04,.056,0,.035),(.24,.085,.014,.042),
                                         (.54,.14,.04,.040),(.81,.115,.08,.027),(.94,.032,.094,.014)]:
            rings.append([(sign*(span*.83 + (sweep+width*cos(a*tau/10))*.56),
                           sign*(span*.56 - (sweep+width*cos(a*tau/10))*.83),
                           depth*sin(a*tau/10)+.025*cos(a*tau/10)*span) for a in range(10)])
        blade.loft(rings)
    hub=Sculpture()
    hub.loft([[(r*cos(a*tau/16),r*sin(a*tau/16),z) for a in range(16)]
              for r,z in [(.16,.04),(.17,-.03),(.14,-.1),(.06,-.16)]])
    for i in range(6):
        a=i*tau/6
        hub.oval(.087*cos(a),.087*sin(a),-.118,.021,.021,.018)
    return dict(blades=blade,hub=hub)


def lighthouse():
    stone=Sculpture()
    # Collar sections normalized to shaft radius. The curved corbels stand
    # apart, with visible dark slits between them underneath the projecting lip.
    stone.lathe([(1.0,0),(1.035,.028),(1.025,.081),(.97,.106)],32)
    for i in range(12):
        a=i*tau/12
        rings=[]
        for y,inner,outer,arc in [(.04,.89,1.02,.088),(.19,.885,1.055,.083),
                                    (.37,.885,1.13,.098),(.54,.91,1.23,.13)]:
            rings.append([(r*cos(a+ang),y,r*sin(a+ang)) for r,ang in
                          [(inner,-arc),(outer,-arc),(outer,arc),(inner,arc)]])
        stone.loft(rings)
    stone.lathe([(1.19,.50),(1.23,.53),(1.26,.58),(1.25,.61),(1.30,.65),(1.30,.715),(1.26,.736)],40)
    return dict(collar=stone)


def vase():
    urn=Sculpture()
    urn.lathe([(.27,0),(.29,.035),(.28,.085),(.19,.125),(.145,.18),(.105,.29),
               (.118,.38),(.18,.44),(.27,.52),(.36,.65),(.425,.82),(.45,.98),
               (.445,1.22),(.435,1.32),(.48,1.35),(.48,1.39),(.435,1.415),
               (.39,1.46),(.30,1.51),(.185,1.55),(.08,1.59),(.06,1.66),(.018,1.70)],40)
    for i in range(20):
        a=i*tau/20
        urn.tube([(r*cos(a+tilt),y,r*sin(a+tilt)) for r,y,tilt in
                  [(.195,.463,-.035),(.29,.55,-.027),(.371,.68,.01),(.424,.82,.038)]],
                 [.014,.026,.035,.009])
    for sign in [-1,1]:
        urn.tube([(sign*x,y,0) for x,y in [(.405,1.29),(.52,1.33),(.565,1.29),
                                           (.58,1.18),(.545,1.07),(.46,1.00)]],
                 [.044,.043,.04,.035,.035,.052],8)
        urn.oval(sign*.452,1.085,0,.075,.093,.064)
        urn.oval(sign*.506,1.079,0,.032,.046,.024)
        for j in range(-2,3):
            urn.tube([(sign*.477,1.05,j*.018),(sign*.475,.984,j*.020),(sign*.448,.94,j*.016)],
                     [.014,.016,.005],5)
    # Two shallow dancing figures on the plain frieze. Use the existing marble
    # material so relief comes from the real silhouettes and the light.
    for side in [-1,1]:
        z=side*.442
        urn.oval(0,1.23,z,.036,.048,.027)
        urn.oval(-.01,1.14,z,.05,.065,.028)
        urn.tube([(-.036,1.18,z),(-.085,1.22,z),(-.117,1.29,z*.98)],[.018,.012,.008])
        urn.tube([(.035,1.17,z),(.077,1.11,z),(.11,1.15,z*.98)],[.018,.013,.009])
        for i in range(-2,3):
            urn.tube([(-.01+i*.009,1.11,z),(-.019+i*.018,1.02,z),
                      (-.005+i*.031,.958,z*.99)],[.015,.019,.014],5)
    return dict(urn=urn)


def write_mesh(subpath, build):
    out=Path(__file__).resolve().parents[1]/'src/world'/subpath
    out.parent.mkdir(parents=True,exist_ok=True)
    packed={key:item.triangulate(key) for key,item in build().items()}
    out.write_text('// Generated by tools/model-northwest-details.py. Local millimetres, Y up.\n'
                   + 'export const detail = '+json.dumps(packed,separators=(',',':'))+';\n',encoding='utf8')
    print(subpath, sum(len(idx)//3 for pts,idx in packed.values()), 'triangles')


write_mesh('landmarksKomendantsky/propeller-mesh.js',propeller)
write_mesh('landmarksOkrug65/lighthouse-collar-mesh.js',lighthouse)
write_mesh('landmarksYelaginPalace/vase-mesh.js',vase)
