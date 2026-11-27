"""Build the street-level Petersburg metro entrance kits in Blender.

    blender --background --factory-startup --python tools/model-central-metro-entrances.py

Blender meshes use metres. The export carries indexed millimetre positions and face
palette indices so the street module can batch the prototypes with the scene.
"""
import base64
import json
import math
import struct
from pathlib import Path

import bpy

OUT = Path(__file__).resolve().parents[1] / "src/world/metro/central-entrance-mesh.js"
bpy.ops.wm.read_factory_settings(use_empty=True)
PALETTE = {
    "limestone": "#e9d9ba", "cream": "#f1e7d8", "stone": "#ad9686",
    "granite": "#735b53", "graniteEdge": "#a88b7c", "tread": "#8d8178",
    "oak": "#a27041", "oakDark": "#593d2e", "kick": "#73503b", "brass": "#c3a363",
    "green": "#225448", "greenLight": "#477767", "aqua": "#9bcbc3",
    "silver": "#bdc4c3", "iron": "#465052", "black": "#333b39",
    "pane": "#66818a", "reflect": "#89a0a5", "warm": "#d5c5ae", "yellow": "#e9c64c",
}
materials = {}
for name, css in PALETTE.items():
    material = bpy.data.materials.new(name)
    rgb = tuple(int(css[i:i+2], 16)/255 for i in (1, 3, 5))
    material.diffuse_color = (*rgb, 1)
    materials[name] = material

class Model:
    def __init__(self, name):
        self.name = name
        self.verts, self.faces, self.colors = [], [], []
        self.leaf = None

    def solid(self, points, faces, color):
        base = len(self.verts)
        for x, y, z in points:
            if self.leaf:
                hx, hz, angle = self.leaf
                x, z = hx + x*math.cos(angle) + z*math.sin(angle), hz - x*math.sin(angle) + z*math.cos(angle)
            self.verts.append((x, -z, y))
        for face in faces:
            self.faces.append([base + i for i in face])
            self.colors.append(color)

    def box(self, x, y, z, width, height, depth, color):
        a, b, c = width/2, height/2, depth/2
        self.solid([(x+a*sx, y+b*sy, z+c*sz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)],
                   [[0,2,3,1],[4,5,7,6],[0,4,6,2],[1,3,7,5],[0,1,5,4],[2,6,7,3]], color)

    def arc(self, x, y, z, rx, ry, thickness, depth, color, start=0, stop=math.pi, count=18):
        points, faces = [], []
        for i in range(count+1):
            a = start + (stop-start)*i/count
            for dz in (-depth/2, depth/2):
                for delta in (0, thickness):
                    points.append((x+math.cos(a)*(rx+delta),y+math.sin(a)*(ry+delta),z+dz))
        for i in range(count):
            a=i*4
            faces.extend([[a+2,a+6,a+7,a+3],[a,a+1,a+5,a+4],[a,a+4,a+6,a+2],[a+1,a+3,a+7,a+5]])
        if stop-start < 2*math.pi-.001:
            faces.extend([[0,2,3,1],[count*4,count*4+1,count*4+3,count*4+2]])
        self.solid(points,[face[::-1] for face in faces],color)

    def finish(self):
        mesh=bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts, [], self.faces)
        mesh.update()
        for m in materials.values():
            mesh.materials.append(m)
        color_ids={name:i for i,name in enumerate(materials)}
        for p,col in zip(mesh.polygons,self.colors):
            p.material_index=color_ids[col]
        obj=bpy.data.objects.new(self.name,mesh)
        bpy.context.collection.objects.link(obj)
        mesh.calc_loop_triangles()
        positions, indices, colors=[], [], []
        lookup={}
        for triangle in mesh.loop_triangles:
            for v in triangle.vertices:
                co=mesh.vertices[v].co
                xyz=tuple(round(c*1000) for c in (co.x,co.z,-co.y))
                key=(xyz,triangle.material_index,tuple(round(n, 5) for n in triangle.normal))
                if key not in lookup:
                    lookup[key]=len(colors);positions.extend(xyz);colors.append(triangle.material_index)
                indices.append(lookup[key])
        def pack(fmt, a):
            return base64.b64encode(struct.pack("<"+fmt*len(a),*a)).decode("ascii")
        return [pack("h",positions),pack("H",indices),pack("B",colors)]

def leaf(m, x, span, direction, angle, wood=False, trim="silver", z=.14):
    # Pivot at the jamb. The opened centre leaf is rotated into the vestibule.
    m.leaf=(x,z,angle)
    mid=direction*span/2
    if wood:
        m.box(mid,1.25,0,span,2.42,.10,"oakDark")
        m.box(mid,1.25,.055,span-.07,2.32,.034,"oak")
        for y,h in ((.40,.47),(1.45,.70),(2.12,.50)):
            m.box(mid,y,.079,span-.18,h,.028,"kick")
            r=min(.18,span*.24)
            m.arc(mid,y,.101,r,r,.025,.036,"brass",0,math.tau,14)
            m.box(mid,y,.099,r*1.33,r*1.33,.014,"pane")
    else:
        for s in (-1,1):
            m.box(mid+s*(span/2-.026),1.22,0,.052,2.42,.065,trim)
        for y,h in ((.07,.1),(.92,.09),(2.42,.08)):
            m.box(mid,y,0,span,h,.075,trim)
        m.box(mid,1.23,-.028,span-.10,2.27,.025,"pane")
        m.box(mid,.20,.01,span-.11,.18,.032,trim)
    m.box(mid+direction*(span*.26),1.03,.105,.042,.37,.055,"brass" if wood else "silver")
    m.leaf=None

def ordinary_doors(m, wood=False, trim="silver", z=.10):
    # Stable 1.20 m clear through the centre even in the narrower 2.4 m openings.
    for side in (-1,1):
        leaf(m,side*1.61,.65,-side,0,wood,trim,z)
    leaf(m,-.96,.73,1,math.radians(78),wood,trim,z)

def arch_frame(m, color="cream", spring=2.66, ry=.78, width=.14):
    for s in (-1,1):
        m.box(s*(1.70+width/2),spring/2,.18,width,spring,.34,color)
        m.box(s*(1.70+width/2),spring,.20,width+.11,.11,.38,color)
    m.arc(0,spring,.18,1.70,ry,width,.34,color)

def rectangular_frame(m,color="silver",top=2.96):
    for s in (-1,1):
        m.box(s*1.64,top/2,.095,.11,top,.18,color)
    m.box(0,top,.10,3.41,.15,.20,color)

def landing(m):
    # Flush with the pedestrian surface; light leading edge catches winter light.
    m.box(0,.065,.23,3.43,.065,.74,"tread")
    m.box(0,.077,.59,3.43,.046,.045,"graniteEdge")

def model(name):
    m=Model(name)
    landing(m)
    if name in ("rotunda","vladimir"):
        ordinary_doors(m,True)
        mold="green" if name=="vladimir" else "limestone"
        for s in (-1,1):
            m.box(s*1.72,1.66,.15,.19,3.24,.35,mold)
            m.box(s*1.72,.20,.21,.29,.34,.43,mold)
            m.box(s*1.72,3.07,.22,.32,.14,.42,mold)
        if name=="rotunda":
            arch_frame(m,mold,2.79,.86)
            for i in range(-7,8):
                x=i*.204
                h=.8*math.sqrt(max(0,1-(x/1.64)**2))
                m.box(x,2.79+h/2,.18,.032,h,.052,"iron")
            for k in (2.88,3.06,3.24):
                w=3.28*math.sqrt(1-((k-2.79)/.86)**2)
                m.box(0,k,.17,w,.034,.06,"iron")
        else:
            for y,w,h,z in ((2.53,3.43,.15,.21),(2.95,3.45,.10,.18),(3.28,3.65,.24,.18),(3.45,3.88,.11,.24),(3.55,4.02,.09,.29)):
                m.box(0,y,z,w,h,.36,mold if y<3.4 else "greenLight")
            for i in range(-6,7):
                m.arc(i*.243,2.77,.14,.086,.12,.025,.045,mold,0,math.tau,10)
    elif name=="railway":
        rectangular_frame(m)
        ordinary_doors(m,trim="silver")
        for x in (-1.24,-.43,.43,1.24):
            m.box(x,2.74,.12,.755,.33,.045,"reflect")
        m.box(0,3.18,.15,3.57,.18,.43,"cream")
    elif name=="passage":
        # Current recessed glazing of Vladimirsky Passage, framed by dark granite.
        rectangular_frame(m,"iron",3.1)
        ordinary_doors(m,trim="iron")
        for i in range(-2,3):
            m.box(i*.64,2.77,.10,.58,.45,.05,"reflect")
            m.box(i*.64,2.77,.15,.035,.45,.042,"silver")
        m.box(0,3.21,.21,3.74,.17,.48,"stone")
        for s in (-1,1): m.box(s*1.81,1.58,.15,.25,3.16,.36,"granite")
    elif name in ("nevsky-atrium","marata","engelhardt","canal","gallery","admiral"):
        tint={"nevsky-atrium":"cream","marata":"limestone","engelhardt":"cream","canal":"cream","gallery":"limestone","admiral":"cream"}[name]
        arch_frame(m,tint,2.54,.91 if name in ("admiral","canal","engelhardt") else .68,.14)
        if name=="gallery":
            # The sliding leaves of the working strip station have their own mechanism.
            m.box(0,2.66,-.12,3.28,.17,.18,"iron")
            for s in (-1,1):
                m.box(s*1.54,1.29,-.12,.065,2.5,.1,"brass")
        else:
            trim="brass" if name in ("marata","nevsky-atrium") else "iron"
            ordinary_doors(m,trim=trim,z=-.25)
            for i in (-1,0,1):
                m.box(i*1.04,2.59,-.23,.98,.18,.05,"reflect")
            if name in ("nevsky-atrium","marata"):
                m.box(0,2.76,-.22,3.34,.075,.09,"brass")
            if name in ("engelhardt","canal"):
                for s in (-1,1):
                    m.box(s*1.84,1.73,.18,.17,3.4,.28,"aqua")
                    m.box(s*1.85,2.53,.27,.34,.15,.42,"cream")
            if name=="marata":
                for side in (-1, 1):
                    m.box(side*1.44,1.26,-.29,.08,2.50,.16,"brass")
                m.box(0,2.95,-.18,3.24,.13,.22,"limestone")
            if name=="canal":
                m.box(0,3.55,.21,3.90,.12,.36,"cream")
                for side in (-1, 1):
                    m.box(side*1.80,.21,.26,.35,.32,.42,"granite")
            if name=="admiral":
                for s in (-1,1):
                    m.box(s*1.48,.67,-.06,.053,.68,.053,"silver")
                    m.box(s*1.48,1.02,-.18,.055,.055,.54,"silver")
    return m.finish()

kinds=("rotunda","railway","nevsky-atrium","marata","vladimir","passage","admiral","gallery","engelhardt","canal")
data={key:model(key) for key in kinds}
OUT.write_text("// Generated in Blender by tools/model-central-metro-entrances.py.\n"
               +"export const portalPalette = "+json.dumps(list(PALETTE.values()),separators=(",",":"))+";\n"
               +"export const portalModels = "+json.dumps(data,separators=(",",":"))+";\n",
               encoding="utf-8",newline="\n")
print("Exported", len(data),"portal types to",OUT)
