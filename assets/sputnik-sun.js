const ferroSputnikSun=(()=>{
 const resolution=12;
 const faunaShade=[.29,.24,.30,.12];
 const disk=[255,252,225], glow=[255,205,136];
 const mist=[139,175,155];

 function drawSky(buffer,width,height,horizon,plane,focal,heading,sun,blend){
  const angle=sun.azimuth-heading,z=Math.cos(angle);
  if(z<=0)return;
  const x=width/2*(1+Math.sin(angle)/(plane*z));
  const y=horizon-focal*Math.tan(sun.elevation)/z;
  const radius=Math.max(3,width*.017/z),halo=radius*7.2;
  if(x+halo<0||x-halo>width||y+halo<0||y-halo>height)return;
  for(let py=Math.max(0,Math.floor(y-halo));py<Math.min(height,Math.ceil(y+halo));py++){
   for(let px=Math.max(0,Math.floor(x-halo));px<Math.min(width,Math.ceil(x+halo));px++){
    const d=Math.hypot(px+.5-x,py+.5-y)/radius;
    if(d>7.2)continue;
    const i=py*width+px;
    buffer[i]=d<1.1?blend(buffer[i],disk,Math.min(1,(1.1-d)*5)):
     blend(buffer[i],glow,(1-d/7.2)**2*.55);
   }
  }
 }

 function bake(island,plants){
  const {sun,grid}=island;
  const width=grid.length*resolution;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=width;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.globalAlpha=.74;
  for(const plant of island.plants){
   const {art,frameX,frameY,frameSize}=plants(plant,sun.azimuth);
   // Project the silhouette vertically onto the ground, away from the solar azimuth.
   const scale=resolution*plant.size, length=scale*sun.reach;
   ctx.setTransform(-sun.y*scale,sun.x*scale,sun.x*length,sun.y*length,
    plant.x*resolution,plant.y*resolution);
   ctx.drawImage(art,frameX,frameY,frameSize,frameSize,-.5,-1,1,1);
  }
  const rgba=ctx.getImageData(0,0,width,width).data;
  const staticShade=new Uint8Array(width*width);
  for(let i=0;i<staticShade.length;i++)staticShade[i]=rgba[i*4+3];
  return {width,staticShade,dynamic:new Uint8Array(width*width),updated:-Infinity};
 }

 function mark(field,sun,actor,radius,height,altitude=0,opacity=155){
  const {width,dynamic}=field;
  const extent=sun.reach*(height*.5+altitude);
  const cx=actor.x-sun.x*extent,cy=actor.y-sun.y*extent;
  const length=radius+height*.5*sun.reach;
  const span=Math.ceil(Math.max(radius,length)*resolution);
  const ux=Math.floor(cx*resolution),uy=Math.floor(cy*resolution);
  for(let y=Math.max(0,uy-span);y<Math.min(width,uy+span+1);y++){
   for(let x=Math.max(0,ux-span);x<Math.min(width,ux+span+1);x++){
    const dx=(x+.5)/resolution-cx,dy=(y+.5)/resolution-cy;
    const cross=(dx*sun.y-dy*sun.x)/radius;
    const along=(dx*sun.x+dy*sun.y)/length;
    const d=cross*cross+along*along;
    if(d>=1)continue;
    const value=Math.round(opacity*Math.min(1,(1-d)*2.7));
    const i=y*width+x;
    if(value>dynamic[i])dynamic[i]=value;
   }
  }
 }

 function update(field,island,animals,foes,time,hopHeight){
  if(time-field.updated<.055)return;
  field.updated=time;
  field.dynamic.fill(0);
  for(const e of foes){
   if(e.dead>1.5)continue;
   mark(field,island.sun,e,.27,e.hp>0?.92:.12,e.hp>0?hopHeight(e):0,e.hp>0?163:103);
  }
  for(const animal of animals){
   mark(field,island.sun,animal,faunaShade[animal.kind],animal.kind===2?.12:animal.size*.38,
    animal.altitude,animal.kind===2?64:143);
  }
 }

 function transmission(field,x,y){
  const ix=Math.floor(x*resolution),iy=Math.floor(y*resolution);
  if(ix<0||iy<0||ix>=field.width||iy>=field.width)return 1;
  const i=iy*field.width+ix;
  return 1-Math.max(field.staticShade[i],field.dynamic[i])*.00212;
 }

 function surface(texel,transmission,normal,distance,haze,lights,index,elevation){
  const sun=Math.max(0,transmission-.46)*(1.0+normal*.46);
  const warm=1-Math.min(1,elevation*2);
  const fog=Math.min(.68,1-Math.exp(-distance*.032));
  const remain=1-fog, daylight=.60+sun;
  const r=Math.min(255,((texel&255)*(daylight+sun*warm*.16)+lights[index])*remain+haze[0]*fog)|0;
  const g=Math.min(255,((texel>>>8&255)*(daylight+sun*.022)+lights[index+1])*remain+haze[1]*fog)|0;
  const b=Math.min(255,((texel>>>16&255)*(.70+sun*(.72-warm*.12))+lights[index+2])*remain+haze[2]*fog)|0;
  return (255<<24)|(b<<16)|(g<<8)|r;
 }

 function spriteLight(sun,x,y,camera,transmission,intensity){
  const dx=camera.x-x,dy=camera.y-y;
  const distance=Math.hypot(dx,dy);
  const facing=(dx*sun.x+dy*sun.y)/Math.max(.001,distance);
  return {
   brightness:.84+Math.max(0,facing)*.26*transmission+intensity*.16,
   saturation:1.06+Math.max(0,facing)*.13-transmission*.02,
   fog:Math.min(.76,1-Math.exp(-distance*.025))
  };
 }

 return {drawSky,bake,update,transmission,surface,spriteLight,mist};
})();
