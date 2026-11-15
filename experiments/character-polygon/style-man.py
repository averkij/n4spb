"""Run after repair-characters.py in the same Blender import session.
Give the approved man broader shoulders, straight-leg jeans and a baseball cap.
The pre-style mesh is kept in memory so rerunning does not accumulate scaling.
"""
import bpy, math, os
from mathutils import Vector, Matrix
import io_scene_gltf2

root=bpy.data.objects['Sketchfab_model.007'];rig=bpy.data.objects['Object_6.001']
man=bpy.data.objects['Object_61.001'];root.location.x=0
for track in rig.animation_data.nla_tracks:track.mute=True
idle=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='Idle')
rig.animation_data.action=idle;bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
if 'polygon_style_source' not in man:
    backup=man.data.copy();backup.name='Polygon man before cap and relaxed jeans';backup.use_fake_user=True
    man['polygon_style_source']=backup.name
man.data=bpy.data.meshes[man['polygon_style_source']].copy()
for obj in list(root.children_recursive):
    if obj.get('polygon_baseball_cap'):bpy.data.objects.remove(obj,do_unlink=True)

def material(name,hexcolor):
    mat=bpy.data.materials.get(name) or bpy.data.materials.new(name);mat.use_nodes=True
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    rgb=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)]
    node.inputs['Base Color'].default_value=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)
    node.inputs['Roughness'].default_value=.9
    return mat

denim=material('Straight-leg denim','40566b');man.data.materials.append(denim)
texture=next(n.image for n in man.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE')
pixels=list(texture.pixels);w,h=texture.size;uvs=man.data.uv_layers.active.data
pant_vertices=set()
for poly in man.data.polygons:
    uv=sum((uvs[l].uv for l in poly.loop_indices),Vector((0,0)))/len(poly.loop_indices)
    k=(min(h-1,int(uv.y*h))*w+min(w-1,int(uv.x*w)))*4;color=pixels[k:k+3]
    if .25<color[0]<.29 and .30<color[1]<.33:
        pant_vertices.update(poly.vertices);poly.material_index=len(man.data.materials)-1

# Reshape the neutral evaluated silhouette, then invert each vertex's blended
# skin matrix to keep the existing skeleton and all six clips intact.
mesh_to_arm=rig.matrix_world.inverted()@man.matrix_world
bone_matrices={b.name:b.matrix@b.bone.matrix_local.inverted() for b in rig.pose.bones}
clamp=lambda v:max(0,min(1,v))
for vertex in man.data.vertices:
    blend=Matrix(((0,0,0,0),)*4);total=0
    for group in vertex.groups:
        matrix=bone_matrices.get(man.vertex_groups[group.group].name)
        if matrix is not None:blend+=matrix*group.weight;total+=group.weight
    if not total:continue
    transform=rig.matrix_world@(blend*(1/total))@mesh_to_arm
    point=transform@vertex.co
    if vertex.index in pant_vertices:
        side='L' if point.x>0 else 'R'
        upper=rig.pose.bones['UpperLeg.'+side+('_044' if side=='L' else '_048')]
        lower=rig.pose.bones['LowerLeg.'+side+('_045' if side=='L' else '_049')]
        a,b,c=[rig.matrix_world@p for p in [upper.head,lower.head,lower.tail]]
        start,end=(a,b) if point.z>b.z else (b,c)
        t=clamp((start.z-point.z)/(start.z-end.z));center=start.lerp(end,t)
        ease=clamp((.88-point.z)/.6);loosen=clamp((.86-point.z)/.2)
        point.x=center.x+(point.x-center.x)*(1+(.24+.32*ease)*loosen)
        point.y=center.y+(point.y-center.y)*(1+(.18+.25*ease)*loosen)
    # Use one shared deformation at the shirt/waist boundary. Applying separate
    # material-specific scaling there would pull coincident seam vertices apart.
    strength=min(clamp((point.z-.85)/.25),clamp((1.64-point.z)/.15))
    point.x*=1+.18*strength
    point.y=.02+(point.y-.02)*(1+.06*strength)
    vertex.co=transform.inverted()@point

brown=material('Brown canvas cap','795032')
brim_mat=material('Brown cap visor','654127')
stitch=material('Cap panel stitching','92643e')

def attach(name,vertices,faces,mat):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj['polygon_baseball_cap']=True
    world=obj.matrix_world.copy();obj.parent=rig;obj.parent_type='BONE';obj.parent_bone='Head_024';obj.matrix_world=world
    return obj

segments=24;rings=7
def crown(t,a,offset=0):
    return ((.105+offset)*math.sin(t*math.pi/2)*math.cos(a),.018+(.123+offset)*math.sin(t*math.pi/2)*math.sin(a),1.735+(.114+offset)*math.cos(t*math.pi/2))
verts=[crown(j/rings,k*math.tau/segments) for j in range(rings+1) for k in range(segments)]
faces=[]
for j in range(rings):
    for k in range(segments):
        a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
attach('Brown baseball cap crown',verts,faces,brown)

# Thin, rounded, forward-facing bill, with a closed rim and darker underside.
verts=[];count=17
for layer in [0,1]:
    for outer in [False,True]:
        for k in range(count):
            a=k*math.pi/(count-1)
            x=(.12 if outer else .103)*math.cos(a)
            y=.018-(.242 if outer else .113)*math.sin(a)
            z=1.735-(.018 if outer else .002)*math.sin(a)-.005*abs(math.cos(a))-.004*layer
            verts.append((x,y,z))
faces=[]
for k in range(count-1):
    faces.extend([(k,k+1,count+k+1,count+k),(2*count+k,3*count+k,3*count+k+1,2*count+k+1),
                  (count+k,count+k+1,3*count+k+1,3*count+k),(k,2*count+k,2*count+k+1,k+1)])
faces.extend([(0,count,3*count,2*count),(count-1,3*count-1,4*count-1,2*count-1)])
attach('Brown baseball cap bill',verts,faces,brim_mat)

# Six restrained panel seams and a small top button make the silhouette read
# as a baseball cap rather than a beanie or a floating flat disc.
verts=[];faces=[]
for panel in range(6):
    first=len(verts);a=panel*math.tau/6
    for j in range(1,rings+1):
        for delta in [-.009,.009]:verts.append(crown(j/rings,a+delta,.0008))
    for j in range(rings-1):i=first+j*2;faces.append((i,i+1,i+3,i+2))
attach('Baseball cap seams',verts,faces,stitch)
verts=[(0,.018,1.855)]+[(.012*math.cos(k*math.tau/12),.018+.012*math.sin(k*math.tau/12),1.846) for k in range(12)]
attach('Baseball cap button',verts,[(0,1+k,1+(k+1)%12) for k in range(12)],brown)

rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT')
for obj in [root]+list(root.children_recursive):obj.select_set(True)
bpy.context.view_layer.objects.active=root
fmt=io_scene_gltf2.get_format_items(bpy.context.scene,bpy.context)[0][0]
bpy.ops.export_scene.gltf(filepath=r'D:\git2\n4spb\experiments\character-polygon\assets\man-jacket.glb',export_format=fmt,use_selection=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_copyright='Base character by Razvan Savescu (CC BY 4.0); supplemental motion by Kobi (CC BY 4.0); original cap and silhouette edits; see CREDITS.md')
rig.animation_data.action=idle;root.location.x=2;bpy.context.scene.frame_set(0)
print('Exported broader man with relaxed denim and brown baseball cap')
