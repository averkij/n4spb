// Shared natural-bank surface: rendering and terrain query the same triangles.
// A narrow submerged continuation connects the low stone lip to the pond/canal
// bed, so walkers can return from the water without an invisible vertical step.
// The shelf changes neither water membership nor boat passage.
export function fitNaturalBankWidths(runs,isWater){
  for(const r of runs)for(const q of r.fr){
    const m=Math.hypot(q.mx,q.mz),nx=m?q.mx/m:0,nz=m?q.mz/m:0,wanted=(r.reach.run+.3)*q.k*m;
    q.landScale=1;
    if(wanted<1e-8)continue;
    // Two neighbouring ponds/canals can have different levels. Their full
    // default-width slopes must not overlap and leave a high apron ending
    // halfway down the other bank. Reserve at most half of the actual dry
    // strip for each shore; the remaining ridge is ordinary y=0 ground.
    for(let d=.08;d<=wanted*2+.25;d+=.25){
      if(!isWater(q.x+nx*d,q.z+nz*d))continue;
      let lo=Math.max(.001,d-.25),hi=d;
      for(let k=0;k<15;k++){const mid=(lo+hi)/2;if(isWater(q.x+nx*mid,q.z+nz*mid))hi=mid;else lo=mid;}
      q.landScale=Math.min(1,Math.max(.01,lo*.49)/wanted);break;
    }
  }
  // At a very short corner edge, an unrestricted nine-metre mitre can run
  // backwards along its neighbour. Keep the offset endpoints ordered along
  // each source segment. Blend a narrowed corner into its neighbours rather
  // than leaving a wide end cap towering over the next short section.
  for(const r of runs){
    for(let i=0;i+1<r.fr.length;i++){
      const a=r.fr[i],b=r.fr[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<1e-7)continue;
      const d=r.reach.run+.3,pa=(a.mx*dx+a.mz*dz)/len*a.k*d,pb=(b.mx*dx+b.mz*dz)/len*b.k*d;
      if(pa>0)a.landScale=Math.min(a.landScale,len*.45/pa);if(pb<0)b.landScale=Math.min(b.landScale,len*.45/-pb);
    }
    const full=q=>Math.max(1e-8,(r.reach.run+.3)*q.k*Math.hypot(q.mx,q.mz));
    for(let pass=0;pass<3;pass++){
      if(r.closed){const a=r.fr[0],b=r.fr.at(-1);a.landScale=b.landScale=Math.min(a.landScale,b.landScale);}
      for(const direction of [1,-1])for(let k=1;k<r.fr.length;k++){
        const i=direction===1?k:r.fr.length-1-k,a=r.fr[i-direction],b=r.fr[i],len=Math.hypot(b.x-a.x,b.z-a.z);
        b.landScale=Math.min(b.landScale,(full(a)*a.landScale+len*.5)/full(b));
      }
    }
    if(r.closed){const a=r.fr[0],b=r.fr.at(-1);a.landScale=b.landScale=Math.min(a.landScale,b.landScale);}
  }
  // Two-metre samples are needed to FIND a narrow strip, not to tessellate
  // every unchanged broad straight bank. Remove only inserted, collinear
  // samples with no width adjustment on either side; preserve source bends
  // and every fitted transition. This does not change the visible surface.
  for(const r of runs){const kept=[r.fr[0]];
    for(let i=1;i+1<r.fr.length;i++){const a=kept[kept.length-1],q=r.fr[i],b=r.fr[i+1],cross=(q.x-a.x)*(b.z-q.z)-(q.z-a.z)*(b.x-q.x);
      if(q.inserted&&a.landScale===1&&q.landScale===1&&b.landScale===1&&Math.abs(cross)<1e-7)continue;kept.push(q);
    }
    kept.push(r.fr[r.fr.length-1]);r.fr=kept;r.pts=kept.map(q=>[q.x,q.z]);
  }
}
export function naturalBankSurfaces(runs, waterways) {
  const surfaces = [];
  const add = (r, kind, points, walk = true) => {
    const a=points[0], b=points[1], c=points[2];
    let nx=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
    let ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
    let nz=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    let len=Math.hypot(nx,ny,nz);
    if(len<1e-9){const d=points[3];nx=(c[1]-a[1])*(d[2]-a[2])-(c[2]-a[2])*(d[1]-a[1]);ny=(c[2]-a[2])*(d[0]-a[0])-(c[0]-a[0])*(d[2]-a[2]);nz=(c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0]);len=Math.hypot(nx,ny,nz);}
    if(len<1e-9)return;
    // All loft strips are ordered water -> land. Keep their visible side up.
    if(walk&&ny<0){points=points.slice().reverse();nx=-nx;ny=-ny;nz=-nz;}
    surfaces.push({bank:r.bank,reach:r.reach,key:r.reach.key,kind,points,walk,
      normal:[nx/len,ny/len,nz/len]});
  };
  for(const r of runs){
    const {water,bed}=waterways[r.reach.key], {run,kerb,lip}=r.reach;
    // On the taller Swan/Moika banquettes, a return from the bed must meet
    // the coping within an ordinary walking step, not a 0.57 m vertical jump.
    const kt=water+kerb,y0=kt+lip,foot=Math.max(water-.12,kt-.24);
    const grass=[[.45,y0]];
    for(const[t,e]of[[.18,.17],[.38,.37],[.58,.58],[.78,.79],[.92,.94],[1,1]])grass.push([.45+t*(run-.45),y0*(1-e)]);
    // End exactly on the ground cut. An apron below uncut flat ground would
    // recreate a see-through/sliver mismatch at the upper edge.
    grass.push([run+.3,0]);
    const shelf=Math.max(3,(water-bed)*2.5);
    const profile=[[-shelf,bed,'bed'],[0,foot,'wall'],[0,kt,'coping'],[.45,kt,'coping'],...grass.map(p=>[...p,'grass'])];
    const at=(q,p)=>{const d=p[0]*q.k*(p[0]>0?(q.landScale??1):1);return[q.x+q.mx*d,p[1],q.z+q.mz*d];};
    for(let i=0;i+1<r.fr.length;i++)for(let j=0;j+1<profile.length;j++){
      const p=profile[j],q=profile[j+1],a=r.fr[i],b=r.fr[i+1];
      const walk=q[0]>p[0]+1e-8;
      add(r,p[2],[at(a,p),at(b,p),at(b,q),at(a,q)],walk);
    }
    if(r.closed)continue;
    // A true open run meets a bridge abutment or an ordinary quay. Close the
    // exposed earth between its top and the street instead of a fan crossing
    // the concave stepped profile (which used to leave transparent triangles).
    for(const[end,dir]of[[0,-1],[r.fr.length-1,1]]){
      const q=r.fr[end],next=r.fr[end===0?1:end-1],dx=(end===0?next.x-q.x:q.x-next.x)*dir,dz=(end===0?next.z-q.z:q.z-next.z)*dir;
      for(let j=0;j+1<profile.length;j++){
        // The submerged shelf is open water, not an earth bank. Raising its
        // end to street level creates a freestanding panel in the canal.
        const p=profile[j],v=profile[j+1];if(p[0]<0||v[0]<=p[0]+1e-8)continue;
        let points=[at(q,p),at(q,v),at(q,[v[0],0]),at(q,[p[0],0])];
        const a=points[0],b=points[1],c=points[2],dot=((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]))*dx+((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*dz;
        if(dot<0)points.reverse();add(r,'cap',points,false);
      }
    }
  }
  return surfaces;
}

// Immutable 16 m buckets keep ground queries local; no scan of every bank,
// temporary vectors or per-frame geometry work. Shared corners may overlap;
// the upper visible surface is the physical ground there.
export function bankHeightQuery(surfaces) {
  const grid=new Map(),cell=16;
  for(const s of surfaces){if(!s.walk)continue;
    for(const ids of [[0,1,2],[0,2,3]]){
      const[a,b,c]=ids.map(i=>s.points[i]),den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
      if(Math.abs(den)<1e-9)continue;
      const t={a,b,c,den,ground:s.kind==='grass'||s.kind==='bed',x0:Math.min(a[0],b[0],c[0]),x1:Math.max(a[0],b[0],c[0]),z0:Math.min(a[2],b[2],c[2]),z1:Math.max(a[2],b[2],c[2])};
      for(let x=Math.floor(t.x0/cell);x<=Math.floor(t.x1/cell);x++)for(let z=Math.floor(t.z0/cell);z<=Math.floor(t.z1/cell);z++){
        const key=x*8192+z;let list=grid.get(key);if(!list)grid.set(key,list=[]);list.push(t);
      }
    }
  }
  return(x,z,groundOnly=false)=>{const list=grid.get(Math.floor(x/cell)*8192+Math.floor(z/cell));if(!list)return null;let h=null;
    for(const t of list){if(groundOnly&&!t.ground||x<t.x0-1e-7||x>t.x1+1e-7||z<t.z0-1e-7||z>t.z1+1e-7)continue;
      const{a,b,c,den}=t,u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;
      if(Math.min(u,v,w)<-1e-7)continue;const y=u*a[1]+v*b[1]+w*c[1];h=h===null?y:Math.max(h,y);
    }return h;
  };
}
