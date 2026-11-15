"""Blender follow-up to prepare-variants.py, using its live imported object names.
Repairs the two approved variants. Source meshes/actions are retained in memory
so rerunning this pass does not accumulate edits. Exports only the two choices.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import io_scene_gltf2

OUT = r'D:\git2\n4spb\experiments\character-polygon\assets'
girl = bpy.data.objects['Armature.001']
roots = [bpy.data.objects['Sketchfab_model.006'], bpy.data.objects['Sketchfab_model.007']]
for root in roots: root.location.x = 0

def source_mesh(obj):
    key = 'polygon_repair_source'
    if key not in obj:
        backup = obj.data.copy(); backup.name = obj.name + '_repair_source'
        backup.use_fake_user = True; obj[key] = backup.name
    obj.data = bpy.data.meshes[obj[key]].copy()

def use_action(rig, action, frame=0):
    for t in rig.animation_data.nla_tracks: t.mute = True
    rig.animation_data.action = action
    bpy.context.scene.frame_set(frame); bpy.context.view_layer.update()

def original_action(track):
    key = 'PolygonRepairSource_' + track.name
    action = bpy.data.actions.get(key)
    if action is None:
        action = track.strips[0].action.copy(); action.name = key; action.use_fake_user = True
    return action

tracks = {t.name:t for t in girl.animation_data.nla_tracks}
sources = {name:original_action(track) for name,track in tracks.items()}

# Bake an anatomically fitted two-bone arm swing. Hand targets stay outside
# the torso; the elbow bend plane points outwards instead of across the chest.
def aim(bone, end):
    world = girl.matrix_world @ bone.matrix
    head = world.translation
    axis = girl.matrix_world.to_3x3() @ (bone.tail - bone.head)
    delta = axis.normalized().rotation_difference((end-head).normalized())
    world = Matrix.LocRotScale(head, delta @ world.to_quaternion(), world.to_scale())
    bone.matrix = girl.matrix_world.inverted() @ world
    bpy.context.view_layer.update()

for name in ['Walk','Run']:
    source = sources[name]; last = round(source.frame_range[1]); snapshots = []
    for frame in range(last+1):
        use_action(girl,source,frame)
        phase = frame / last * math.tau
        for side,sign in [('L',1),('R',-1)]:
            upper = girl.pose.bones['upperArm.'+side+'_Armature']
            lower = girl.pose.bones['lowerArm.'+side+'_Armature']
            a = girl.matrix_world @ upper.head
            b = girl.matrix_world @ lower.head
            c = girl.matrix_world @ lower.tail
            l1=(b-a).length; l2=(c-b).length
            swing=math.sin(phase)*sign
            running=name=='Run'
            hand=Vector((sign*(.27 if running else .26), a.y-.09+swing*(.19 if running else .16), a.z-(.22 if running else .385)+.035*math.cos(phase)))
            direction=(hand-a).normalized(); distance=min((hand-a).length,l1+l2-.008)
            hand=a+direction*distance
            along=(l1*l1-l2*l2+distance*distance)/(2*distance)
            height=math.sqrt(max(0,l1*l1-along*along))
            pole=Vector((sign*.4,.45,-1)); pole=(pole-direction*pole.dot(direction)).normalized()
            elbow=a+direction*along+pole*height
            aim(upper,elbow); aim(lower,hand)
            for part in ['hand1','hand2','finger1','finger2']:
                girl.pose.bones[part+'.'+side+'_Armature'].matrix_basis=Matrix.Identity(4)
            bpy.context.view_layer.update()
            forearm=(girl.matrix_world.to_3x3()@(lower.tail-lower.head)).normalized()
            for part in ['hand1','hand2']:
                bone=girl.pose.bones[part+'.'+side+'_Armature']
                aim(bone,girl.matrix_world@bone.head+forearm*.1)
        snapshots.append({b.name:b.matrix_basis.copy() for b in girl.pose.bones})
    repaired=bpy.data.actions.new('PolygonClearance_'+name)
    girl.animation_data.action=repaired
    for frame,pose in enumerate(snapshots):
        for bone in girl.pose.bones:
            bone.matrix_basis=pose[bone.name]; bone.rotation_mode='QUATERNION'
            for channel in ['location','rotation_quaternion','scale']:bone.keyframe_insert(channel,frame=frame)
    tracks[name].strips[0].action=repaired
    print('Rebuilt arm clearance:',name,last+1,'frames')

use_action(girl,sources['Idle'])

# Weld the imported split vertices, give the hem more leg clearance, and use
# the same symmetric thigh blend around each skirt ring. Independently weighted
# front/back panels previously pulled apart and let the thighs cut through.
dress=bpy.data.objects['dress_0.001']; source_mesh(dress)
bm=bmesh.new(); bm.from_mesh(dress.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(dress.data);bm.free()
inv=dress.matrix_world.inverted()
belt=bpy.data.objects['dress_1.001']
belt_ring=[v for v in belt.data.vertices if abs((belt.matrix_world@v.co).z-1.026)<.002]
for vertex in dress.data.vertices:
    p=dress.matrix_world@vertex.co
    if abs(p.z-1.026)<.002:
        # The two materials share exactly the same seam positions AND weights.
        # Overlapping differently weighted panels causes flickering black slivers.
        match=min(belt_ring,key=lambda v:((belt.matrix_world@v.co)-p).length)
        vertex.co=inv@(belt.matrix_world@match.co)
        for group in dress.vertex_groups:group.remove([vertex.index])
        for weight in match.groups:
            dress.vertex_groups[belt.vertex_groups[weight.group].name].add([vertex.index],weight.weight,'REPLACE')
        continue
    if p.z<1.03:
        amount=max(0,min(1,(1.026-p.z)/.246))
        p.x*=.98+.22*amount; p.y=.045+(p.y-.045)*(.98+.92*amount)
        vertex.co=inv@p
        for group in dress.vertex_groups:group.remove([vertex.index])
        thigh=.30*amount
        for name,weight in [('lowerBody_Armature',1-2*thigh),('upperLeg.L_Armature',thigh),('upperLeg.R_Armature',thigh)]:
            if weight: dress.vertex_groups[name].add([vertex.index],weight,'REPLACE')
for old in list(dress.modifiers):
    if old.name=='Polygon fabric thickness':dress.modifiers.remove(old)
solid=dress.modifiers.new('Polygon fabric thickness','SOLIDIFY')
solid.thickness=.0035/dress.matrix_world.to_scale().x;solid.offset=-1

# Fit small eye details against the evaluated face, rather than guessed depth.
skin=bpy.data.objects['girl_0.001'];ev=skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
tree=BVHTree.FromPolygons([ev.matrix_world@v.co for v in ev.data.vertices],[p.vertices[:] for p in ev.data.polygons])
for eye in [o for o in roots[0].children_recursive if o.name.startswith('Eye')]:
    source_mesh(eye)
    points=[eye.matrix_world@v.co for v in eye.data.vertices];center=sum(points,Vector())/len(points)
    hit,normal,_,_=tree.ray_cast(Vector((center.x,-1,center.z)),Vector((0,1,0)))
    assert hit is not None,'Eye must intersect face'
    inverse=eye.matrix_world.inverted()
    for vertex,point in zip(eye.data.vertices,points):
        delta=point-center
        vertex.co=inverse@(hit+Vector((delta.x*.72,delta.y*.23+.0003,delta.z*.78)))
    print('Eye fitted',eye.name,tuple(round(v,4) for v in hit))

# Beard and eyes use the same black swatch. Remap only the lower-face polygons
# onto the existing skin swatch, preserving the hair, eyebrows and eyes.
man=bpy.data.objects['Object_61.001'];source_mesh(man)
rig=next(o for o in roots[1].children_recursive if o.type=='ARMATURE')
use_action(rig,next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='Idle'))
ev=man.evaluated_get(bpy.context.evaluated_depsgraph_get());points=[ev.matrix_world@v.co for v in ev.data.vertices]
tex=next(n.image for n in man.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE')
pixels=list(tex.pixels);w,h=tex.size;uvs=man.data.uv_layers.active.data
def swatch(poly):
    uv=sum((uvs[l].uv for l in poly.loop_indices),Vector((0,0)))/len(poly.loop_indices)
    x=min(w-1,max(0,int(uv.x*w)));y=min(h-1,max(0,int(uv.y*h)))
    return uv,pixels[(y*w+x)*4:(y*w+x)*4+3]
skin_uv=next(swatch(p)[0] for p in man.data.polygons if swatch(p)[1][0]>.85 and .65<swatch(p)[1][1]<.8)
count=0
for poly in man.data.polygons:
    center=sum((points[v] for v in poly.vertices),Vector())/len(poly.vertices)
    _,color=swatch(poly)
    if 1.52<center.z<1.66 and max(color)<.01:
        for loop in poly.loop_indices:uvs[loop].uv=skin_uv
        count+=1
print('Removed beard swatch from',count,'faces')

fmt=io_scene_gltf2.get_format_items(bpy.context.scene,bpy.context)[0][0]
for root,filename in zip(roots,['woman-beret.glb','man-jacket.glb']):
    rig=next(o for o in root.children_recursive if o.type=='ARMATURE')
    rig.animation_data.action=None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [root]+list(root.children_recursive):obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,filename),export_format=fmt,use_selection=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_copyright='Base character by Razvan Savescu (CC BY 4.0); supplemental motion by Kobi (CC BY 4.0); see CREDITS.md')
    use_action(rig,next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='Idle'))
roots[1].location.x=2
print('Exported repaired approved characters')
