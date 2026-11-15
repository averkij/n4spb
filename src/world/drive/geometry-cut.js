import * as THREE from 'three';
// Split triangles at the actual clipping planes, preserving all attributes.
// Centroid selection alone leaves giant triangles across an open doorway.
export function cutBox(source,min,max) {
  const geometry=source.index?source.toNonIndexed():source;
  const keys=Object.keys(geometry.attributes),sizes=keys.map(k=>geometry.attributes[k].itemSize);
  const offsets=[];let stride=0;for(const size of sizes){offsets.push(stride);stride+=size;}
  const pOffset=offsets[keys.indexOf('position')],inside=[],outside=[];
  const emit=(polygon,dest)=>{for(let i=1;i<polygon.length-1;i++)dest.push(polygon[0],polygon[i],polygon[i+1]);};
  for(let i=0;i<geometry.attributes.position.count;i+=3) {
    let polygon=[];
    for(let j=0;j<3;j++){const v=[];for(const key of keys){const a=geometry.attributes[key];for(let c=0;c<a.itemSize;c++)v.push(a.array[(i+j)*a.itemSize+c]);}polygon.push(v);}
    for(let axis=0;axis<3;axis++)for(const [bound,sign] of [[min[axis],1],[max[axis],-1]]) {
      if(!polygon.length)continue;
      const keep=[],discard=[];
      for(let j=0;j<polygon.length;j++) {
        const a=polygon[j],b=polygon[(j+1)%polygon.length],da=(a[pOffset+axis]-bound)*sign,db=(b[pOffset+axis]-bound)*sign;
        (da>=0?keep:discard).push(a);
        if((da>=0)!==(db>=0)){const t=da/(da-db),v=a.map((x,c)=>x+(b[c]-x)*t);keep.push(v);discard.push(v);}
      }
      emit(discard,outside);polygon=keep;
    }
    emit(polygon,inside);
  }
  const build=vertices=>{
    const g=new THREE.BufferGeometry();keys.forEach((key,k)=>{const values=[];for(const v of vertices)for(let c=0;c<sizes[k];c++)values.push(v[offsets[k]+c]);g.setAttribute(key,new THREE.Float32BufferAttribute(values,sizes[k]));});
    g.computeBoundingSphere();return g;
  };
  const result={inside:build(inside),outside:build(outside)};
  if(geometry!==source)geometry.dispose();
  return result;
}
