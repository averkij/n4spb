"""Run in the live Blender authoring scene after importing the three credited models.
Adds rigid head accessories and bakes pose-relative animation transfers to each rig.
Updates the three imported rigs and generated accessories; unrelated scene objects stay intact.
"""
import bpy, math, os
from mathutils import Vector, Matrix, Quaternion
import io_scene_gltf2

OUT = r'D:\git2\n4spb\experiments\character-polygon\assets'
roots = [bpy.data.objects[n] for n in ['Sketchfab_model.005', 'Sketchfab_model.006', 'Sketchfab_model.007']]
rigs = [next(o for o in r.children_recursive if o.type == 'ARMATURE') for r in roots]
kobi = bpy.data.objects['GLTF_created_0']
for root in roots: root.location.x = 0
for obj in list(bpy.data.objects):
    if obj.get('polygon_variant_generated'): bpy.data.objects.remove(obj, do_unlink=True)

def pose_snapshot(rig): return {b.name:b.matrix_basis.copy() for b in rig.pose.bones}
def restore(rig, pose):
    for b in rig.pose.bones: b.matrix_basis = pose[b.name]
    bpy.context.view_layer.update()
def select_action(rig, action, frame=0):
    rig.animation_data_create()
    for track in rig.animation_data.nla_tracks: track.mute = True
    rig.animation_data.action = action
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()

def bake_native(rig, action, bind, name):
    # Imported glTF clips omit channels that never change. Bake those static
    # offsets too so a previous sitting/jump action cannot leak into locomotion.
    samples=[]
    select_action(rig,action)
    first,last=map(lambda n:round(n),action.frame_range)
    for frame in range(first,last+1):
        restore(rig,bind);bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
        samples.append(pose_snapshot(rig))
    baked=bpy.data.actions.new('Polygon_Full_'+rig.name+'_'+name)
    rig.animation_data.action=baked
    for frame,pose in enumerate(samples):
        restore(rig,pose)
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION'
            b.keyframe_insert('rotation_quaternion',frame=frame)
            b.keyframe_insert('location',frame=frame)
            b.keyframe_insert('scale',frame=frame)
    rig.animation_data.action=None;restore(rig,bind)
    return baked

# Sources retain their original neutral references, independent of target poses.
white = rigs[0]
original_white = {t.name.split('.')[0]:t.strips[0].action for t in white.animation_data.nla_tracks}
white_bind=pose_snapshot(white)
white_actions = {name:bake_native(white,original_white[name],white_bind,name) for name in ['Idle','Walk','Run']}
girl_walk = bake_native(rigs[1],rigs[1].animation_data.nla_tracks[0].strips[0].action,pose_snapshot(rigs[1]),'Walk')
select_action(white, white_actions['Idle'])
white_neutral = pose_snapshot(white)
select_action(kobi, bpy.data.actions['HumanArmature|Man_Idle'])
kobi_neutral = pose_snapshot(kobi)
# Female rest pose has arms naturally down. Preserve the jacket model's authored relaxed pose.
rigs[1].animation_data.action = None
for t in rigs[1].animation_data.nla_tracks: t.mute = True
for b in rigs[1].pose.bones: b.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
neutrals = [white_neutral, pose_snapshot(rigs[1]), pose_snapshot(rigs[2])]

white_map = {'hips':'lowerBody_01','spine':'middleBody_02','chest':'Chest_03','neck':'neck_023','head':'head_024'}
girl_map = {'hips':'lowerBody_Armature','spine':'middleBody_Armature','chest':'chest_Armature','neck':'neck_Armature','head':'head_Armature'}
jacket_map = {'hips':'Hips_01','spine':'Spine_02','chest':'Chest_03','neck':'Neck_023','head':'Head_024'}
kobi_map = {'hips':'Hips_6','spine':'Abdomen_7','chest':'Torso_8','neck':'Neck_9','head':'Head_10'}
for side, nums in [('L',[5,6,7,0,44,45,46]),('R',[25,26,27,28,48,49,50])]:
    for role, stem, num in zip(['shoulder','arm','forearm','hand','thigh','shin','foot'],['shoulder','upperArm','lowerArm','hand','upperLeg','lowerLeg','foot'],nums): white_map[side+role] = f'{side}.{stem}_0{num}' if num else f'{side}.{stem}_00'
    for role, stem in zip(['shoulder','arm','forearm','hand','thigh','shin','foot'],['shoulder','upperArm','lowerArm','hand1','upperLeg','lowerLeg','upperFoot']): girl_map[side+role] = f'{stem}.{side}_Armature'
for side, nums in [('L',[5,0,6,7,44,45,46]),('R',[25,26,27,28,48,49,50])]:
    for role, stem, num in zip(['shoulder','arm','forearm','hand','thigh','shin','foot'],['Shoulder','UpperArm','LowerArm','Hand','UpperLeg','LowerLeg','Foot'],nums): jacket_map[side+role] = f'{stem}.{side}_0{num}' if num else f'{stem}.{side}_00'
for side, nums in [('L',[12,13,14,15,32,33,3]),('R',[22,23,24,25,35,36,40])]:
    for role, stem, num in zip(['shoulder','arm','forearm','hand','thigh','shin','foot'],['Shoulder','UpperArm','LowerArm','Palm','UpperLeg','LowerLeg','Foot'],nums): kobi_map[side+role] = f'{stem}.{side}_{num}'
maps = [white_map,girl_map,jacket_map]
for rig, mapping in [(white,white_map),(rigs[1],girl_map),(rigs[2],jacket_map),(kobi,kobi_map)]:
    for name in mapping.values(): assert name in rig.pose.bones, (rig.name,name)

def transfer(source, source_map, source_neutral, source_action, target, target_map, neutral, name):
    source.animation_data.action = None; restore(source,source_neutral)
    base_source = {role:(source.matrix_world @ source.pose.bones[n].matrix).copy() for role,n in source_map.items()}
    target.animation_data_create(); target.animation_data.action = None; restore(target,neutral)
    base_target = {role:(target.matrix_world @ target.pose.bones[n].matrix).copy() for role,n in target_map.items()}
    target_local_hips = target.pose.bones[target_map['hips']].matrix.translation.copy()
    order = sorted(target_map, key=lambda role:len(target.pose.bones[target_map[role]].parent_recursive))
    action = bpy.data.actions.new('Polygon_'+target.name+'_'+name)
    target.animation_data.action = action
    source.animation_data.action = source_action
    first,last = map(int,source_action.frame_range)
    inv = target.matrix_world.inverted(); invq = target.matrix_world.to_quaternion().inverted()
    height_ratio = .96 if target == rigs[1] else 1
    for frame in range(first,last+1):
        bpy.context.scene.frame_set(frame); restore(target,neutral)
        for role in order:
            sb = source.pose.bones[source_map[role]]; tb = target.pose.bones[target_map[role]]
            sw = source.matrix_world @ sb.matrix
            delta = sw.to_quaternion() @ base_source[role].to_quaternion().inverted()
            rotation = invq @ delta @ base_target[role].to_quaternion()
            location = tb.matrix.translation.copy()
            if role=='hips':
                displacement = sw.translation-base_source[role].translation
                # Motion clips are in-place; only vertical bob belongs in the visual rig.
                displacement.x=0; displacement.y=0
                location = target_local_hips + inv.to_3x3() @ (displacement*height_ratio)
            tb.matrix = Matrix.LocRotScale(location, rotation, tb.matrix.to_scale())
            bpy.context.view_layer.update()
        for b in target.pose.bones:
            b.rotation_mode='QUATERNION'
            b.keyframe_insert('rotation_quaternion',frame=frame-first)
            b.keyframe_insert('location',frame=frame-first)
            b.keyframe_insert('scale',frame=frame-first)
    target.animation_data.action=None
    return action

# Retain source locomotion where supplied; bake missing clips onto each target's anatomy.
clips = [dict((n,white_actions[n]) for n in ['Idle','Walk','Run']), {'Walk':girl_walk}, {}]
for i in [1,2]:
    for name in ['Idle','Walk','Run']:
        if name in clips[i]: continue
        clips[i][name]=transfer(white,white_map,white_neutral,white_actions[name],rigs[i],maps[i],neutrals[i],name)
for i in range(3):
    for name in ['Jump','RunningJump','Sitting']:
        clips[i][name]=transfer(kobi,kobi_map,kobi_neutral,bpy.data.actions['HumanArmature|Man_'+name],rigs[i],maps[i],neutrals[i],name)

def material(name,hexcolor):
    m=bpy.data.materials.new(name);m.use_nodes=True
    node=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    rgb=[int(hexcolor[j:j+2],16)/255 for j in (0,2,4)]
    node.inputs['Base Color'].default_value=tuple(((v+.055)/1.055)**2.4 if v>.04045 else v/12.92 for v in rgb)+(1,)
    node.inputs['Roughness'].default_value=.85
    return m
red=material('Beret wool - burgundy red','b62f42'); dark=material('Face details','342a27'); brown=material('Chestnut hair','50382b')
def attach_mesh(name,vertices,faces,mat,rig,head):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj['polygon_variant_generated']=True
    world=obj.matrix_world.copy();obj.parent=rig;obj.parent_type='BONE';obj.parent_bone=head;obj.matrix_world=world
    return obj
def dome(name,center,radii,mat,rig,head,tilt=0):
    verts=[];faces=[];rings=6;segments=20
    for j in range(rings+1):
        phi=(j/rings)*math.pi
        for k in range(segments):
            a=k*2*math.pi/segments
            x=radii[0]*math.sin(phi)*math.cos(a);y=radii[1]*math.sin(phi)*math.sin(a);z=radii[2]*math.cos(phi)
            verts.append((center[0]+x,center[1]+y,center[2]+z+tilt*x))
    for j in range(rings):
        for k in range(segments):
            a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
    return attach_mesh(name,verts,faces,mat,rig,head)

for i,rig in enumerate(rigs):
    for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
    select_action(rig, clips[i]['Idle'],0)
    root=roots[i];bpy.context.view_layer.update()
    coords=[o.matrix_world@Vector(v) for o in root.children_recursive if o.type=='MESH' for v in o.bound_box]
    root.location.z-=min(v.z for v in coords);bpy.context.view_layer.update()
    # Add understated facial features to the intentionally faceless low-poly originals.
    if i<2:
        headworld=rig.matrix_world@rig.pose.bones[maps[i]['head']].head
        z=1.69 if i==0 else 1.61
        for x in [-.034,.034]:dome('Eye', (x,-.074 if i==0 else -.039,z),(.009,.006,.009),dark,rig,maps[i]['head'])
    if i==0:
        # A fitted scalp with a lower rear hairline, rather than a flat cap.
        vertices=[];faces=[];segments=24
        for j in range(6):
            t=j/5
            for k in range(segments):
                a=k*2*math.pi/segments
                rim=1.735-.075*max(0,math.sin(a))
                radius=math.sin(t*math.pi/2)
                vertices.append((.096*radius*math.cos(a),.008+.112*radius*math.sin(a),rim+(1.843-rim)*math.cos(t*math.pi/2)))
        for j in range(5):
            for k in range(segments):
                a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
        attach_mesh('Short chestnut hair',vertices,faces,brown,rig,maps[i]['head'])
    if i==1:
        dome('Red beret crown',(.022,.055,1.739),(.151,.132,.052),red,rig,maps[i]['head'],.19)
        dome('Red beret band',(.0,.055,1.705),(.101,.092,.018),red,rig,maps[i]['head'],.1)
        dome('Beret stalk',(.025,.06,1.79),(.009,.009,.02),red,rig,maps[i]['head'])
    rig.animation_data.action=None
    for name,action in clips[i].items():
        t=rig.animation_data.nla_tracks.new();t.name=name;t.mute=True
        t.strips.new(name,0,action)
    restore(rig,neutrals[i])
    select_action(rig,clips[i]['Idle'],0)

os.makedirs(OUT,exist_ok=True)
fmt=io_scene_gltf2.get_format_items(bpy.context.scene,bpy.context)[0][0]
for i,filename in [(1,'woman-beret.glb'),(2,'man-jacket.glb')]:
    root=roots[i];rig=rigs[i];rig.animation_data.action=None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [root]+list(root.children_recursive):
        if obj.type!='CAMERA':obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,filename),export_format=fmt,use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_copyright='Base character by razvansavescu (CC BY 4.0); supplemental motion by Kobi (CC BY 4.0); see CREDITS.md')
    print('EXPORTED',filename,os.path.getsize(os.path.join(OUT,filename)))
    select_action(rig,clips[i]['Idle'],0)
    root.location.x=(i-1)*2
bpy.context.view_layer.update()
