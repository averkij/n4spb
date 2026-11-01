import * as THREE from 'three';
import { Parts, ringEdges, onEdge, band } from '../landmarksD/kit.js';
import { MeshBuilder, addPrism, addPolyColliders } from '../lib/massing.js';
import { registerLOD } from '../../core/spatial.js';
import { makeLabels } from '../streets/labels.js';

// Source: 102_3d_piter landmarksMoskovsky, adapted to current batching and labels.
// Immutable geometry uses the maintained collector and bounded detail ranges.
export function makeKit(ctx, root, svc) {
  ctx.services.labels ||= makeLabels();
  const mats = Object.fromEntries(Object.entries({ stone:'#b6b09f', trim:'#e2ded1', shade:'#999585', granite:'#857f77', dark:'#343c40', roof:'#929ca0', bronze:'#394a40', pink:'#d88380', palace:'#dcaa8b', gold:'#b5a26d' }).map(([k,v])=>[k,ctx.mat.toon(v,{paint:.025})]));
  const tex=ctx.tex.draw(256,256,(g,w,h)=>{
    g.fillStyle='#3e505a';g.fillRect(0,0,w,h);
    g.fillStyle='#6d8795';g.fillRect(12,10,232,85);
    g.fillStyle='#a6b4b7';g.fillRect(17,14,4,230);
    g.fillStyle='#c8cac0';for(const x of [0,125,248])g.fillRect(x,0,8,h);for(const y of [0,120,250])g.fillRect(0,y,w,7);
  },{key:'moskovskaya-window'});
  mats.window=ctx.mat.toon('#ffffff',{map:tex,paint:0});
  const K={ctx,root,svc,mats,P:new Parts(),body:new Parts(),detail:new Parts(),decals:new Set()};
  K.begin=()=>{K.body=new Parts();K.detail=new Parts();K.P=K.body;};
  K.use=(detail=false)=>{K.P=detail?K.detail:K.body;return K.P;};
  K.flush=(name)=>{
    const before=svc.triangles;
    for(const [P,far] of [[K.body,2600],[K.detail,380]])for(const m of P.build(root,{name:`moskovsky-${name}`})){
      if(m.material===mats.window||K.decals.has(m.material))ctx.noOutline(m);
      m.updateMatrixWorld(true);registerLOD(m,far);
    }
    svc.triangles+=K.body.tris+K.detail.tris;svc.parts[name]={triangles:svc.triangles-before};
  };
  K.frame=(edge,fn)=>onEdge(K.P,edge,fn);
  K.window=(x,y,w,h,{pointed=false,round=false}={})=>{
    const P=K.P,M=mats;
    if(pointed){const s=new THREE.Shape();s.moveTo(x-w/2,y);s.lineTo(x+w/2,y);s.lineTo(x+w/2,y+h*.7);s.lineTo(x,y+h);s.lineTo(x-w/2,y+h*.7);s.closePath();P.extrude(M.trim,s,.025,.13,1,2);
      const t=new THREE.Shape();t.moveTo(x-w/2+.18,y+.12);t.lineTo(x+w/2-.18,y+.12);t.lineTo(x+w/2-.18,y+h*.69);t.lineTo(x,y+h-.25);t.lineTo(x-w/2+.18,y+h*.69);t.closePath();P.extrude(M.dark,t,.17,.025,1,2);
    }else if(round){P.geo(M.trim,new THREE.TorusGeometry(w/2,.16,5,24),x,y+h/2,.14);P.geo(M.dark,new THREE.CircleGeometry(w/2-.13,24),x,y+h/2,.08);}
    else {P.box(M.trim,x-w/2-.13,x+w/2+.13,y-.12,y+h+.12,.025,.13);P.quad(M.window,[x-w/2,y,.16],[x+w/2,y,.16],[x+w/2,y+h,.16],[x-w/2,y+h,.16],[0,0,1]);}
  };
  K.shell=(rec,h,mat)=>{
    for(const p of rec.polys){const b=new MeshBuilder(),r=new MeshBuilder();addPrism(b,r,p,rec.minH||0,h,{bay:3.6,floor:3.6});K.body.geo(mat,b.build());K.body.geo(mats.roof,r.build());addPolyColliders(ctx,p,rec.minH||0,h);}
    return rec.polys.flatMap(p=>ringEdges(p,.1));
  };
  K.cornice=(edges,h,mat=mats.trim)=>band(K.body,edges,h,h+.32,.28,{front:mat,top:mat,under:mats.shade});
  K.label=(id,text,x,y,z,w,h,rotY=0,colors={})=>{
    const n=[Math.sin(rotY),Math.cos(rotY)];
    if(ctx.services.labels&&!ctx.services.labels.reserve(id,x,y,z,w,h,...n,'landmark'))return;
    const t=ctx.tex.sign({text,bg:colors.bg||'#343c40',fg:colors.fg||'#e2ded1',w:1024,h:128,font:'serif'}),mat=ctx.mat.decal('#ffffff',{map:t});K.decals.add(mat);
    K.detail.push(x,y,z,rotY);K.detail.quad(mat,[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],[0,0,1]);K.detail.pop();
  };
  return K;
}

export function roadClear(ctx,x,z,r=0){
  const net=ctx.services.streets?.net;
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]])if(net?net.cover(x+dx,z+dz,{})>=-.5:ctx.L.isOnRoad(x+dx,z+dz,.5))return false;
  return true;
}

export function boxClear(ctx,x,z,w,d,rot){
  const net=ctx.services.streets?.net,c=Math.cos(rot),s=Math.sin(rot);
  for(const u of [-w/2,0,w/2])for(const v of [-d/2,0,d/2]){
    const wx=x+c*u+s*v,wz=z-s*u+c*v;
    if(net?net.cover(wx,wz,{})>=-.5:ctx.L.isOnRoad(wx,wz,.5))return false;
  }
  return true;
}
