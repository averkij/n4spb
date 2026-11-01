// Coastal mapped bridges: low eco-trail boardwalks, road overpasses and port
// WHSD viaducts. References: OSM 2026-10-31; Mostotrest Yacht Bridge;
// St Petersburg administration 2016/96074 (Sea Canal 52 m clearance).
// Static cell batching, bounded knockable rails, no per-frame work.
import * as THREE from 'three';
import { COASTAL_BRIDGES } from './coastalBridges/sites.js';
import { planCoastalDecks, deckAtTriangles } from './coastalBridges/deck-plan.js';
import { WHSD, whsdY } from './bridges/sites-vo2.js';
import { Parts } from './bridges/kit.js';
import { knockInstances } from './lib/knock-inst.js';
export const OWNS_GROUPS = true;

function groundRoadBlocker(net){
  if(!net)return()=>false;
  const skipSet=new Set(net.ways.filter(w=>w.bridge||w.skipDraw||w.pedestrianOnly||w.tramBed));
  const cells=new Map(),size=32;
  for(const f of net.fillets)if(f.ways.some(w=>!skipSet.has(w)))for(let x=Math.floor(f.box[0]/size);x<=Math.floor(f.box[1]/size);x++)for(let z=Math.floor(f.box[2]/size);z<=Math.floor(f.box[3]/size);z++){
    const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(f.poly);
  }
  return(x,z,radius)=>{
    const pad=radius+.5;
    if(net.cover(x,z,{skipSet,noFillets:true})>=-pad)return true;
    const seen=new Set();
    for(let cx=Math.floor((x-pad)/size);cx<=Math.floor((x+pad)/size);cx++)for(let cz=Math.floor((z-pad)/size);cz<=Math.floor((z+pad)/size);cz++)for(const p of cells.get(cx+','+cz)||[]){
      if(seen.has(p))continue;seen.add(p);let inside=false;
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const a=p[j],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],q=dx*dx+dz*dz,t=q?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/q)):0;
        if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<=pad)return true;
        if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
      }
      if(inside)return true;
    }
    return false;
  };
}

export function build(ctx) {
  const concrete = ctx.mat.toon('#a2a5a0',{name:'coastal-concrete'}), asphalt = ctx.mat.toon('#5a5e61',{name:'coastal-asphalt'}), steel = ctx.mat.toon('#526468',{name:'coastal-steel'}), stripe = ctx.mat.toon('#dad5bb',{name:'coastal-marking'});
  const P = new Parts(), root = new THREE.Group(); root.name = 'coastalBridges';
  const plan=planCoastalDecks(COASTAL_BRIDGES),segments=plan.segments,railSpots = [], railItems = [];
  const ph = ctx.physics;
  const groundBlocked=groundRoadBlocker(ctx.services.streets?.net);
  let supportsSkipped=0,railsSkipped=0;
  for (const b of COASTAL_BRIDGES) {
    const spans=segments.filter(s=>s.bridge===b);
    let at = 0;
    for (const s of spans) {
      // Small crossings stay near the street. Tall viaduct access slopes are
      // continued by their mapped adjoining bridge ways; no fake solid water.
      const x = (s.ax + s.bx) / 2, z = (s.az + s.bz) / 2, half = b.w / 2;
      // A mapped boardwalk approach can continue across a service-road mouth.
      // Its landing uses asphalt there (notably the Krestovsky Yacht Bridge
      // approach). Retain its shared ramp elevations to keep joints continuous.
      const groundLanding=b.foot&&Math.max(s.ya,s.yb)<=2.5&&[-.45,-.25,0,.25,.45].some(t=>groundBlocked(x+(s.bx-s.ax)*t,z+(s.bz-s.az)*t,half));
      s.groundLanding=groundLanding;
      const raised=(p,y)=>[p[0],p[1]+y,p[2]],between=(cap,u)=>cap.left.map((v,i)=>v+(cap.right[i]-v)*u);
      // The web and soffit are geometry, so navigation clearances use the same
      // depth as the walking ramp. WHSD retains its characteristic box girder.
      for (const side of [-1,1]) {
        const key=side===1?'right':'left',a=s.a[key],c=s.b[key],inner=side*Math.max(.1,half-2.5),u=(inner+half)/b.w;
        const ia=between(s.a,u),ic=between(s.b,u),nx=Math.cos(s.yaw)*side,nz=-Math.sin(s.yaw)*side;
        P.quad(concrete,raised(a,-.5),raised(c,-.5),raised(c,.025),raised(a,.025),[nx,0,nz]);
        P.quad(concrete,raised(a,-.5),raised(ia,-b.depth),raised(ic,-b.depth),raised(c,-.5),[nx,-1,nz]);
      }
      const bottom=Math.max(.1,half-2.5),ul=(half-bottom)/b.w,ur=(half+bottom)/b.w;
      P.quad(concrete,raised(between(s.a,ul),-b.depth),raised(between(s.a,ur),-b.depth),raised(between(s.b,ur),-b.depth),raised(between(s.b,ul),-b.depth),[0,-1,0]);
      if (!b.foot) for (const side of [-1,1]) {
        const u0=(side*(half-.3)-.05+half)/b.w,u1=(side*(half-.3)+.05+half)/b.w;
        P.quad(stripe,raised(between(s.a,u0),.055),raised(between(s.a,u1),.055),raised(between(s.b,u1),.055),raised(between(s.b,u0),.055),[0,1,0]);
      }
      // Discrete piers leave the navigation opening clear. A 150m support
      // spacing on the high harbour viaduct keeps the fairway open to boats.
      const spacing = b.whsd ? 150 : 80;
      const firstSupport=Math.ceil((at-spacing/2)/spacing)*spacing+spacing/2-at;
      if (b.y > 4) for (let d = firstSupport; d < s.len; d += spacing) {
        const px = s.ax + (s.bx - s.ax) * d / s.len, pz = s.az + (s.bz - s.az) * d / s.len;
        // Piers keep clear of actual ground asphalt, widened parking edges and
        // junction fillets by their whole footprint plus the0.5m scene margin.
        if(groundBlocked(px,pz,Math.hypot(1.2,1.5))||ctx.L?.insideBuilding(px,pz,Math.hypot(1.2,1.5))){supportsSkipped++;continue;}
        // The official168m central span has no pier in its fairway.
        if(b.seaCanal&&pz>3400&&pz<3710)continue;
        const top = s.ya + (s.yb - s.ya) * d / s.len - b.depth;
        if (top > 2) { P.push(px, 0, pz, s.yaw); P.box(concrete, -1.2, 1.2, -5, top, -1.5, 1.5); P.pop(); ph.addBox(px, pz, 2.4, 3, s.yaw, -5, top); }
      }
      // Equal subdivisions cover the whole edge with <=6.4m breakable panels.
      // Collider length, pitched visual and knock dimensions use the same span.
      for (const side of [-1, 1]) {
        const key=side===1?'right':'left',a=s.a[key],c=s.b[key],edgeLen=Math.hypot(c[0]-a[0],c[2]-a[2]),yaw=Math.atan2(c[0]-a[0],c[2]-a[2]);
        const panels=Math.max(1,Math.ceil(edgeLen/6.4)),panelLen=edgeLen/panels;
        for(let j=0;j<panels;j++){
        const t=(j+.5)/panels,px=a[0]+(c[0]-a[0])*t,pz=a[2]+(c[2]-a[2])*t,ry=a[1]+(c[1]-a[1])*t;
        const grade=(c[1]-a[1])/edgeLen,dy=Math.abs(grade)*panelLen/2;
        // Low bridge approaches leave an opening at crossing ground streets.
        if(ry-dy<=2.5&&(groundBlocked(px,pz,Math.hypot(.06,panelLen/2))||ctx.L?.insideBuilding(px,pz,Math.hypot(.06,panelLen/2)))){railsSkipped++;continue;}
        railSpots.push({ x: px, y: ry + .04, z: pz, rotY: yaw, len:panelLen,grade });
        railItems.push(ph.addBox(px, pz, .12, panelLen, yaw, ry + .03-dy, ry + 1.17+dy));
        }
      }
      // Pale steel two-storey truss, built only from the lower carriageway.
      // Upper-deck geometry remains the mapped opposing lane, not a duplicate.
      if(b.seaCanal&&!b.northbound&&z>2900&&z<4350){
        for(const side of[-1,1]){
          const local=side*(half+.65),a=[local,s.ya+.05,-s.len/2],c=[local,s.yb+.05,s.len/2],atop=[local,s.ya+8,-s.len/2],ctop=[local,s.yb+8,s.len/2];
          P.push(x,0,z,s.yaw);
          P.cyl(steel,a,c,.15,.15,4,false);P.cyl(steel,atop,ctop,.19,.19,4,false);
          P.cyl(steel,a,atop,.19,.19,4,false);P.cyl(steel,a,ctop,.16,.16,4,false);
          P.pop();
        }
      }
      at += s.len;
    }
  }
  // A single source of truth for render, walking and the car's deck service.
  // Planar clipped ramps do not fill their enclosing boxes above open water.
  for(const f of plan.triangles){
    const mat=f.b.foot&&!f.b.yacht&&!f.segment?.groundLanding?concrete:asphalt;
    P.fan(mat,f.points,[0,1,0]);ph.addWalkTriangle(f.points,f.depth);
    if(f.joint){
      // A bounded bevel wedge has the same real slab volume as its collider.
      // Close its soffit and ONLY exposed boundary edges; internal triangle
      // diagonals and edges adjoining another deck do not get duplicate webs.
      P.fan(concrete,f.points.map(p=>[p[0],p[1]-f.depth,p[2]]),[0,-1,0]);
      const[a,b,c]=f.points,sign=Math.sign((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]));
      for(let i=0;i<3;i++){
        const u=f.points[i],v=f.points[(i+1)%3],dx=v[0]-u[0],dz=v[2]-u[2],len=Math.hypot(dx,dz);if(len<1e-5)continue;
        const nx=sign*dz/len,nz=-sign*dx/len,x=(u[0]+v[0])/2+nx*.015,z=(u[2]+v[2])/2+nz*.015,y=(u[1]+v[1])/2;
        const adjacent=deckAtTriangles(plan.triangles,x,z,y);
        if(adjacent!==null&&Math.abs(adjacent-y)<.03)continue;
        P.quad(concrete,[u[0],u[1]-f.depth,u[2]],[v[0],v[1]-f.depth,v[2]],v,u,[nx,0,nz]);
      }
    }
  }
  // Korabelny's inward-leaning portal pylons and fan stays reproduce the source
  // silhouette while the current OSM centre lines own every road deck.
  let pylons=0;
  if(COASTAL_BRIDGES.some(b=>b.marine))for(const[cx,cz]of WHSD.pylons){
    const yaw=-.105,tx=Math.sin(yaw),tz=Math.cos(yaw),nx=tz,nz=-tx;
    const pos=(u,q,y)=>[cx+tx*u+nx*q,y,cz+tz*u+nz*q];
    const top=120.6,base=-5;
    for(const side of[-1,1]){
      P.cyl(concrete,pos(0,side*22,base),pos(0,side*8.5,top),2.3,1.3,6,true);
      const p=pos(0,side*22,base);ph.addBox(p[0],p[2],5,6,yaw,-5,6);
      for(const dir of[-1,1])for(let j=0;j<12;j++){
        const u=dir*(25+j*12),z=cz+tz*u;
        P.cyl(stripe,pos(0,side*(13.5-j*.36),66+j*4.5),pos(u,side*18.4,whsdY(z)+.8),.09,.09,4,false);
      }
    }
    for(const[y0,y1]of[[64,82],[82,101],[101,116]]){
      const q=y=>22-13.5*(y-base)/(top-base);
      for(const side of[-1,1])P.cyl(concrete,pos(0,side*q(y0),y0),pos(0,-side*q(y1),y1),.6,.6,6,false);
      P.cyl(concrete,pos(0,-q(y1),y1),pos(0,q(y1),y1),.65,.65,6,false);
    }
    pylons++;
  }
  const meshes = P.build(root, { name: 'coastal-bridges' }); ctx.addStatic(root); P.b.clear();
  // Each independently breakable panel terminates into its own end posts.
  // The old single centre post left two cut horizontal bars projecting into
  // space whenever a road opening, clipping boundary or removed panel ended a
  // run. Neighbouring half-posts meet at the seam without overlapping faces.
  const rp = new Parts();
  for (const side of [-1, 1]) rp.box(steel, -.045, .045, 0, 1.12, side < 0 ? -3.2 : 3.14, side < 0 ? -3.14 : 3.2);
  for (const h of [.55, 1.05]) rp.box(steel, -.04, .04, h, h + .06, -3.17, 3.17);
  const local = new THREE.Group(), geos = rp.build(local, { name: 'coastal-rail-template' });
  const railMatrix=s=>new THREE.Matrix4().makeRotationY(s.rotY).multiply(new THREE.Matrix4().makeRotationX(-Math.atan(s.grade))).scale(new THREE.Vector3(1,1,s.len/6.4)).setPosition(s.x,s.y,s.z);
  knockInstances(ctx, { name: 'coastal-rail', spots: railSpots, items: railItems, parts: geos.map(m => ({ geo: m.geometry, mat: steel,place:railMatrix })), rec: s=>({ kind: 'fence', mass: 45*s.len/6.4, h: 1.15, w: .12, d:s.len, anchored: true, metal: true }), far: 260 });
  // Spatial cells avoid querying every coastal bridge for each traffic agent.
  const grid = new Map(), cell = 128;
  for (const f of plan.triangles) {
    const xs=f.points.map(p=>p[0]),zs=f.points.map(p=>p[2]);
    for(let ix=Math.floor(Math.min(...xs)/cell);ix<=Math.floor(Math.max(...xs)/cell);ix++)for(let iz=Math.floor(Math.min(...zs)/cell);iz<=Math.floor(Math.max(...zs)/cell);iz++){const key=ix+','+iz;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(f);}
  }
  const empty=[];
  const prior = ctx.services.bridges;
  const deckY = (x,z,ref=Infinity) => {
    const own = deckAtTriangles(grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||empty,x,z,ref);
    const shared = prior?.deckY?.(x,z,ref) ?? null;
    // Yacht's high authored deck can cross a low mapped coastal approach.
    // Both the hook and public service must select the highest reachable
    // floor, rather than allowing the first low deck to hide the shared one.
    return shared !== null && shared <= ref + 1.2 ? (own === null ? shared : Math.max(own, shared)) : own;
  };
  ctx.services.coastalBridges = { list: COASTAL_BRIDGES, segments, triangles:plan.triangles, mitered:plan.mitered, beveled:plan.beveled, deckY };
  ctx.services.bridges = { ...(prior || {}), list: [...(prior?.list || []), ...COASTAL_BRIDGES.map(b => ({ id: b.id, x: b.cx, z: b.cz }))], deckY };
  return { bridges: COASTAL_BRIDGES.length, rails: railSpots.length, meshes: meshes.length,pylons,supportsSkipped,railsSkipped };
}
