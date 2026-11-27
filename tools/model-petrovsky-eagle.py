"""Build the cast-lead eagle on the Peter Gate. Run with blender -b -P tools/model-petrovsky-eagle.py."""
import math
from pathlib import Path
import bmesh
import bpy


# The drawing plane follows the frontal photograph in docs/research/winter-kronverk.md.
# Every unit on the drawing is 1/127 m. Positive depth projects from the portal.
destination = Path(__file__).resolve().parents[1] / "src/world/landmarksFortress/petrovsky-eagle.js"
palette = ["#293039", "#3b434b", "#515c65", "#bd812b", "#edb74e", "#bd2d4b", "#d7d6cf"]
lead, plumage, ridge, gold, gilt, carmine, silver = range(len(palette))
meshes = []


def mesh(name, vertices, faces, color):
    data = bpy.data.meshes.new(name)
    data.from_pydata([((x-369)/127, -d/127, (285-y)/127) for x, y, d in vertices], [], faces)
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    data.update()
    meshes.append((data, color))


def loft(name, rings, color):
    count = len(rings[0])
    verts = [v for ring in rings for v in ring]
    faces = [tuple(reversed(range(count))), tuple(range(len(verts)-count, len(verts)))]
    for layer in range(len(rings)-1):
        for i in range(count):
            j = (i+1) % count
            a = layer*count
            faces.append((a+i, a+j, a+count+j, a+count+i))
    mesh(name, verts, faces, color)


def tablet(name, outline, d, thickness, color):
    loft(name, [[(x,y,z) for x,y in outline] for z in (d, d+thickness)], color)


def roundel(name, x, y, w, h, depth, convex, color, segments=10):
    rings = []
    for scale, dz in [(0.9,-2), (1,0), (.76,.72*convex), (.25,convex)]:
        rings.append([(x+w*scale*math.cos(i*math.tau/segments),
                       y+h*scale*math.sin(i*math.tau/segments), depth+dz) for i in range(segments)])
    loft(name, rings, color)


def bead(name, path, color, thickness=.48):
    """Loft along a curved centreline. Rows contain drawing x/y, relief, half-width."""
    rings = []
    for i,(x,y,d,w) in enumerate(path):
        prev, nxt = path[max(0,i-1)], path[min(len(path)-1,i+1)]
        vx, vy = nxt[0]-prev[0], nxt[1]-prev[1]
        norm = math.hypot(vx,vy)
        rings.append([(x-vy/norm*w*math.cos(a*math.tau/5),
                       y+vx/norm*w*math.cos(a*math.tau/5),
                       d+w*thickness*math.sin(a*math.tau/5)) for a in range(5)])
    loft(name, rings, color)


def cross(x,y,scale,d):
    bead("finial stem", [(x,y-6*scale,d,1.5*scale),(x,y+7*scale,d,1.7*scale)], gilt)
    bead("finial arms", [(x-5*scale,y-1*scale,d,1.6*scale),(x+5*scale,y-1*scale,d,1.6*scale)], gilt)


def crown(x,y,s):
    # Five fluted upright plates with pierced spaces. The centre crown hangs above the necks.
    def arc(points):
        return [(x+s*dx,y+s*dy,17+s*dz,s*w) for dx,dy,dz,w in points]
    for k in (-1,1):
        bead("outer crown leaf",arc([(k*13,0,0,2.4),(k*21,-8,1,4.2),(k*22,-15,2,3.6),(k*19,-20,1,1.3)]),gold)
        bead("inner arch",arc([(k*10,0,2,3.2),(k*13,-13,4,3.1),(k*15,-22,3,1.6)]),gilt)
    bead("crown rib",arc([(0,0,1,2.8),(0,-12,4,4),(0,-24,3,2.3)]),gilt)
    bead("crown band",arc([(-16,1,4,3.8),(-8,0,6,3.7),(0,-.6,6,3.7),(8,0,6,3.7),(16,1,4,3.8)]),gold)
    for dx in (-9,0,9):
        roundel("band jewel",x+dx*s,y,1.55*s,1.55*s,18+9*s,1.3*s,gilt,7)
    cross(x,y-31*s,s,20)


for side in (1,-1):
    def mirrored(points):
        return [(369+(x-369)*side,y,*rest) for x,y,*rest in points]
    def feather(name,points,color=plumage):
        bead(name,mirrored(points),color)
    tablet("wing ground",mirrored([(335,286),(306,267),(285,238),(272,221),(245,212),
        (215,207),(180,199),(179,211),(206,237),(190,248),(189,263),(206,270),
        (195,291),(209,298),(205,316),(221,319),(217,342),(236,334),
        (260,344),(281,366),(304,389),(335,383),(345,334)]),4,5,lead)
    # The outermost primary sweeps upwards. The lower feathers progressively hook downward.
    wing = [
        [(291,258,9,8),(256,241,10,13),(206,226,11,13),(168,204,10,10),(148,188,8,3)],
        [(289,268,10,10),(249,258,12,16),(210,254,12,13),(172,249,10,11),(151,241,8,3)],
        [(283,284,11,11),(251,283,13,15),(215,285,12,13),(186,293,11,9),(170,291,8,3)],
        [(285,300,12,10),(258,303,13,14),(233,313,12,12),(202,323,10,8),(189,319,8,3)],
        [(289,316,12,9),(266,320,14,13),(245,332,13,11),(221,351,11,8),(211,349,9,3)],
    ]
    for i, row in enumerate(wing):
        feather("primary feather",[(x,y,d,w*(1.12 if i else 1)) for x,y,d,w in row],plumage if i%2==0 else lead)
        feather("primary quill",[(x,y-2,d+w*.39,max(1,w*.12)) for x,y,d,w in row],ridge)
    feather("fold of wing",[(310,279,12,7),(292,267,17,13),(280,242,18,13),
                            (261,230,17,13),(239,225,16,11),(216,217,14,3)],plumage)
    # Three rows of overlapping coverts terminate in a scalloped edge at the shoulder.
    for i in range(4):
        for j in range(3):
            x,y=302-j*15+i*2,262+i*17-j*8
            feather("overlapping covert",[(x,y,15,4),(x-11,y-5,16,7),(x-21,y-9,15,6),(x-30,y-15,13,1)],plumage if (i+j)%2 else ridge)
    feather("neck",[(349,280,13,18),(339,242,15,17),(325,207,15,14),(297,181,16,14),(262,174,15,13),(243,178,15,9)],plumage)
    roundel("cheek",369+(251-369)*side,176,13,7.3,15,5,plumage)
    for i in range(5):
        x,y=341-i*5,236-i*9
        feather("neck hackle",[(x-6,y-4,17,3),(x,y,20,6),(x+10,y+12,16,1)],ridge)
    feather("brow",[(271,166,19,4),(259,166,22,7),(244,169,20,6),(235,176,18,2)],lead)
    tablet("hooked gilt beak",mirrored([(248,176),(237,179),(229,184),(225,192),(226,206),
        (230,196),(235,190),(246,188),(259,183),(260,180)]),17,5,gilt)
    feather("lower beak",[(255,184,20,2),(246,190,22,3),(239,199,20,1)],gold)
    x=369+(253-369)*side
    roundel("eye",x,175,2.6,2.3,23,1.5,gilt,8)
    roundel("pupil",x+.3*side,175,1.3,1.2,25,1,lead,6)
    feather("thigh",[(325,317,12,12),(303,336,17,24),(291,360,17,19),(315,393,14,11),(326,402,12,4)],plumage)
    for i in range(3):
        x,y=292+i*6,346+i*9
        feather("leg plume",[(x-5,y-5,19,3),(x+1,y+3,26,7),(x+10,y+12,20,1)],ridge)
    feather("gilt talon",[(330,403,14,4),(312,404,15,5),(282,399,18,4),(258,396,19,3)],gilt)
    feather("outer rectrix",[(354,347,8,5),(346,401,13,10),(329,433,14,10),(312,454,13,8),(311,468,11,7),(327,483,8,2)],plumage)
    feather("inner rectrix",[(362,358,12,8),(355,406,15,13),(344,433,16,11),(326,445,15,8),(314,454,14,3)],ridge)
    feather("tail coverts",[(364,381,14,9),(360,412,18,11),(351,440,19,9),(340,451,17,5),(323,458,13,2)],plumage)
    crown(369+(250-369)*side,161,1)

bead("central tail plume",[(369,356,13,8),(369,403,17,16),(369,442,15,15),
                          (369,476,14,17),(369,492,12,10),(368,497,9,2)],plumage)
roundel("breast",369,311,54,74,14,18,plumage)
shield=[(369,237),(379,233),(387,243),(399,244),(419,258),(413,274),(411,299),
        (414,318),(404,335),(388,343),(375,345),(369,359),(360,346),(337,340),
        (325,331),(319,315),(321,295),(319,277),(314,260),(329,251),(341,242),(352,244),(360,233)]
tablet("gilded shield rim",shield,29,7,gilt)
tablet("enamel field",[(369+(x-369)*.86,294+(y-294)*.84) for x,y in shield],36,3,carmine)
# Silver rider and rearing horse in the red escutcheon.
tablet("horse",[(345,299),(349,295),(358,294),(371,298),(378,291),(380,282),(385,282),
                (391,291),(393,299),(388,301),(384,296),(380,307),(373,314),
                (357,313),(350,307),(344,309),(341,317),(337,322),(337,314)],39,3,silver)
for leg in [[(352,307),(350,318),(355,325)],[(365,311),(369,319),(375,321)],[(378,305),(386,309),(389,318)]]:
    bead("horse leg",[(x,y,42,1.7) for x,y in leg],silver)
bead("horse tail",[(349,300,42,2),(344,296,42,3),(339,299,42,2),(336,306,42,.9)],silver)
tablet("rider cloak",[(359,275),(368,278),(374,292),(369,298),(363,291),(357,293),(352,291)],42,2,silver)
roundel("rider head",362,272,4.1,5,43,2,silver,8)
bead("lance",[(345,264,46,.95),(381,325,46,1.15)],gilt)
crown(369,143,2.24)

# Independent regalia ensure the asymmetry of the original reads from street level.
bead("sceptre",[(265,416,22,2),(252,394,23,4),(237,364,22,3),(222,342,22,6),
                (208,315,23,4),(194,289,22,2),(181,260,21,1.6)],gilt)
for x,y,r in [(256,403,5),(246,383,5),(238,368,5),(204,307,5),(195,286,8)]:
    roundel("sceptre turning",x,y,r,r*.7,23,4,gold)
cross(181,263,.87,24)
roundel("orb",488,365,26,25,18,16,gilt)
bead("equatorial band",[(464,364,22,2),(474,366,32,2),(488,367,35,2.5),(504,366,31,2),(513,364,22,2)],gold)
bead("orb half-meridian",[(488,342,22,2),(488,350,32,2),(488,365,35,2),(488,386,23,2)],gold)
cross(488,330,1.6,22)
for x,y in [(252,396),(486,391)]:
    for i in range(3):
        bead("claw",[(x+i*3-5,y,22,2),(x+i*4-5,y-4,26,2),(x+i*5-3,y-7,24,.8)],gold)


def write_asset():
    positions, indices, group_ends = [], [], []
    for color in range(len(palette)):
        for data, slot in meshes:
            if color != slot:
                continue
            # Omit rear-facing facets embedded in the relief or hidden against the stone.
            # Keep the side facets to preserve the cast silhouette when approaching the gate.
            vertices = {}
            for tri in data.polygons:
                if tri.normal.y > .35:
                    continue
                for idx in tri.vertices:
                    if idx not in vertices:
                        vertices[idx] = len(positions)//3
                        x,y,z = data.vertices[idx].co
                        positions.extend(round(p*1000) for p in (x,z,-y))
                    indices.append(vertices[idx])
        group_ends.append(len(positions)//3)
    def lines(values):
        return "\n".join("  "+",".join(map(str, values[i:i+30]))+"," for i in range(0,len(values),30))
    src = """// Generated by tools/model-petrovsky-eagle.py with Blender. Positions in mm, Y up.
import * as THREE from 'three';
const positions = [
%s
];
const indices = [
%s
];
const palette = %s;
const ends = %s;

export function petrovskyEagleGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.scale(.001, .001, .001);
  const colors = new Float32Array(positions.length);
  let start = 0;
  palette.forEach((hex, i) => {
    const color = new THREE.Color(hex);
    for (let j = start; j < ends[i]; j++) color.toArray(colors, j * 3);
    start = ends[i];
  });
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
"""
    destination.write_text(src % (lines(positions),lines(indices),palette,group_ends),encoding="utf-8",newline="\n")
    print(destination.name, len(positions)//3, "vertices,",len(indices)//3,"triangles")


write_asset()
