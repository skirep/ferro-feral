// First-person grip poses and world-space billboard animations.
const ferroArsenal=(()=>{
 const images={};
 const plumes=[];
 function prepare(redraw){
  for(const [key,file] of Object.entries({glove:'glove.png',flamer:'flamer.png',rocket:'rocket.png',blast:'blast.webp'})){
   const image=new Image();
   image.onload=()=>{images[key]=image;redraw()};
   image.src='./assets/arsenal/'+file;
  }
 }
 function plume(start,end,rocket=false){
  if(plumes.length>=32)plumes.shift();
  plumes.push({start,end,rocket,age:0,life:rocket?.78:.40});
 }
 function tick(dt){
  for(let i=plumes.length-1;i>=0;i--){
   plumes[i].age+=dt;
   if(plumes[i].age>=plumes[i].life)plumes.splice(i,1);
  }
 }
 function populate(scene,bolts,camera){
  for(const bolt of bolts){
   if(bolt.gun.projectile.charge||!images.rocket)continue;
   const [x,y,z]=boltTrailPoint(bolt);
   const bearing=Math.atan2(y-camera.y,x-camera.x)-Math.atan2(bolt.dy,bolt.dx);
   const view=(Math.round(bearing*4/Math.PI)%8+8)%8;
   scene.push({x,y,art:images.rocket,frameSize:96,frameX:view*96,altitude:z-.14,size:.28,fixture:true});
  }
  if(!images.blast)return;
  for(const {start,end,age,life,rocket} of plumes){
   const t=age/life,dist=rocket?0:Math.min(1,t*1.35);
   const x=start[0]+(end[0]-start[0])*dist,y=start[1]+(end[1]-start[1])*dist;
   const size=rocket?1.90:.23+t*.92;
   const z=start[2]+(end[2]-start[2])*dist+.13*t;
   // Overlapping tongues of fire join successive bursts when fire is held.
   if(!rocket){
    for(const lag of [.075,.15]){
     const u=Math.max(0,dist-lag),scale=size*(lag>.1?.56:.78);
     scene.push({x:start[0]+(end[0]-start[0])*u,y:start[1]+(end[1]-start[1])*u,
      altitude:start[2]+(end[2]-start[2])*u+.08*t-scale*.5,size:scale,
      art:images.blast,frameSize:112,frameX:112*Math.min(13,Math.floor(2+10*t)),fixture:true});
    }
   }
   scene.push({x,y,altitude:z-size*.5,size,art:images.blast,frameSize:112,
    frameX:112*Math.min(15,Math.floor(t*(rocket?16:13))),fixture:true});
  }
 }
 function grip(ctx,weapon,width,height,phase){
  if(!images.glove)return;
  // The support hand slides along the fore-end, the trigger hand stays on the grip.
  const pump=Math.sin(phase*Math.PI)**2*(weapon===1?.15:weapon===5?.10:.035);
  const broad=weapon>=5;
  const hand=width*(broad?.36:.31);
  const left=width*(broad?-.41:-.32),right=width*(broad?.40:.29);
  ctx.drawImage(images.glove,left,-height*(broad?.48:.42)+height*pump,hand,hand*1.35);
  ctx.save();ctx.translate(right,-height*.31);ctx.scale(-1,1);
  ctx.drawImage(images.glove,0,0,hand*.91,hand*1.28);
  ctx.restore();
 }
 return {prepare,plume,tick,populate,grip,clear:()=>{plumes.length=0},flamer:()=>images.flamer};
})();
