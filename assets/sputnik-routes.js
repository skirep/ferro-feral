// The optional routes branch from the first clearing and return to it.
const ferroSputnikRoutes=(()=>{
 const platforms=[
  {x:12.75,y:7.5,z:.67},{x:14.55,y:7.5,z:1.36},
  {x:16.4,y:7.5,z:2.08},{x:18.18,y:7.5,z:2.82}
 ];
 const half=.57,slab=.19,corner=.91;
 const hatch={x:18.43,y:7.5,z:2.82};
 const cave={x:16.5,y:1.65,z:0};
 const gates=[[14,3],[18,3]];
 const rewards={hatch:{gun:5,ammo:20},cave:{gun:3,ammo:30}};
 let hatchArt,caveArt,loading=false;

 function prepare(){
  if(loading)return;
  loading=true;
  const hatchImage=new Image(),caveImage=new Image();
  hatchImage.onload=()=>{hatchArt=hatchImage};
  caveImage.onload=()=>{caveArt=caveImage};
  hatchImage.src='./assets/sputnik/boarding-hatch.webp';
  caveImage.src='./assets/sputnik/cave-mouth.webp';
 }

 function build(map){
  const cavern=Array.from(map.grid,row=>new Uint8Array(row.length));
  for(let y=1;y<=2;y++)for(let x=14;x<=18;x++){map.grid[y][x]=0;cavern[y][x]=1}
  for(const [x,y] of gates)cavern[y][x]=1;
  return {map,cavern,open:false,claimed:new Set()};
 }

 function unlock(route){
  if(!route||route.open)return false;
  route.open=true;
  for(const [x,y] of gates)route.map.grid[y][x]=0;
  return true;
 }

 function inField(route,actor){
  return route?.open&&actor.x>=11.5&&actor.x<=19.3&&Math.abs(actor.y-7.5)<1.1;
 }

 function support(route,x,y,maxZ){
  if(!route.open)return 0;
  let result=0;
  for(const step of platforms){
   const dx=Math.abs(x-step.x),dy=Math.abs(y-step.y);
   if(dx<half&&dy<half&&dx+dy<corner&&step.z<=maxZ)result=Math.max(result,step.z);
  }
  return result;
 }

 function jump(route,actor){
  if(!inField(route,actor)||actor.riftAir)return false;
  actor.riftAir={velocity:4.75};
  return true;
 }

 function step(route,actor,dt){
  if(!actor.riftAir&&!inField(route,actor)&&actor.z<=.015)return false;
  if(!route?.open||actor.jumpTime>0)return false;
  const grounded=support(route,actor.x,actor.y,actor.z+.04);
  if(!actor.riftAir&&actor.z<=grounded+.035){
   actor.z=actor.groundZ=grounded;
   return true;
  }
  const air=actor.riftAir??={velocity:0};
  const gravity=inField(route,actor)?7.9:11.5;
  const z=actor.z+air.velocity*dt-gravity*dt*dt*.5;
  air.velocity-=gravity*dt;
  if(air.velocity<=0&&z<=grounded){
   actor.z=actor.groundZ=grounded;
   actor.riftAir=null;
  }else{
   actor.z=z;
  }
  return true;
 }

 function collect(route,actor){
  if(!route.open||actor.hp<=0)return null;
  for(const [name,location] of [['hatch',hatch],['cave',cave]]){
   if(route.claimed.has(name)||name==='hatch'&&actor.riftAir||Math.abs(actor.z-location.z)>.31||Math.hypot(actor.x-location.x,actor.y-location.y)>.61)continue;
   route.claimed.add(name);
   return {name,...rewards[name]};
  }
  return null;
 }

 function display(route,time,camera){
  if(!route.open)return [];
  const scene=[];
  if(hatchArt){
   scene.push({...hatch,art:hatchArt,size:1.2,altitude:hatch.z-.05,fixture:true});
  }
  if(!route.claimed.has('hatch'))scene.push({
   x:hatch.x-.28,y:hatch.y,size:.20,altitude:hatch.z+.39+Math.sin(time*4)*.08,color:'#72fce7'
  });
  if(!route.claimed.has('cave'))scene.push({
   x:cave.x,y:cave.y,size:.33,altitude:.44+Math.sin(time*3)*.11,color:'#f2b96d'
  });
  for(const [x,y] of gates){
   if(caveArt&&camera.y>y+1.2)scene.push({x:x+.5,y:y+.79,art:caveArt,size:1.72,altitude:0,fixture:true});
   scene.push({x:x+.5,y:y+.88,size:.15,altitude:.40+Math.sin(time*3+x)*.09,color:'#ffc984'});
  }
  return scene;
 }

 function column(route,v){
  if(!route.open)return;
  const {x,y,dx,dy,eye,focal,horizon,height,width,screenX,depth,pixels,time,rock}=v;
  for(const [i,p] of platforms.entries()){
   if(dx===0&&Math.abs(x-p.x)>=half||dy===0&&Math.abs(y-p.y)>=half)continue;
   const ax=dx===0?-Infinity:(p.x-half-x)/dx,bx=dx===0?Infinity:(p.x+half-x)/dx;
   const ay=dy===0?-Infinity:(p.y-half-y)/dy,by=dy===0?Infinity:(p.y+half-y)/dy;
   let near=Math.max(.045,Math.min(ax,bx),Math.min(ay,by)),far=Math.min(Math.max(ax,bx),Math.max(ay,by));
   for(const sign of [-1,1]){
    const off=x-p.x+(y-p.y)*sign,delta=dx+dy*sign;
    if(delta===0){if(Math.abs(off)>corner)far=-1;continue}
    const start=(-corner-off)/delta,end=(corner-off)/delta;
    near=Math.max(near,Math.min(start,end));far=Math.min(far,Math.max(start,end));
   }
   if(far<=near)continue;
   const top=Math.max(0,Math.floor(horizon+(eye-p.z)*focal/(eye>=p.z?far:near)));
   const bottom=Math.min(height,Math.ceil(horizon+(eye-p.z+slab)*focal/(eye>=p.z-slab?near:far)));
   const pulse=.52+.45*Math.sin(time*2-i);
   for(let row=top;row<bottom;row++){
    const slope=(horizon-row)/focal;
    const enter=slope>0?(p.z-slab-eye)/slope:(p.z-eye)/slope;
    const leave=slope>0?(p.z-eye)/slope:(p.z-slab-eye)/slope;
    const dist=slope===0?near:Math.max(near,enter),end=slope===0?far:Math.min(far,leave);
    if(slope===0&&(eye<p.z-slab||eye>p.z)||end<dist)continue;
    const index=row*width+screenX;
    if(dist>=depth[index])continue;
    const z=eye+slope*dist;
    const u=x+dx*dist-p.x,w=y+dy*dist-p.y;
    const topFace=z>p.z-.013;
    const etched=topFace&&Math.abs(Math.abs(u)+Math.abs(w)-.31)<.033;
    const rail=!topFace&&z>p.z-.095&&z<p.z-.049;
    const grain=rock?.[((Math.floor(w*97+(p.z-z)*140)&127)*128)+(Math.floor(u*104)&127)]??0x424040;
    if(rail||etched){
     pixels[index]=(255<<24)|(226<<16)|((154+(pulse*81|0))<<8)|63;
    }else{
     const ratio=topFace?1.17:.71;
     const r=Math.min(255,15+(grain&255)*ratio)|0,g=Math.min(255,20+(grain>>8&255)*ratio)|0;
     const b=Math.min(255,34+(grain>>16&255)*ratio)|0;
     pixels[index]=(255<<24)|(b<<16)|(g<<8)|r;
    }
    depth[index]=dist;
   }
  }
 }

 return {prepare,build,unlock,inField,support,jump,step,collect,display,column,platforms};
})();
