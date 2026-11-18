const ferroCharacterMotion=(()=>{
 const cell=224;
 const poses=['idle','walk','run','jump','aim','shoot','recover','hit','death'];
 const quality=4;
 const foot=Math.round(cell*177/192);
 const facing=view=>(8-view)%8;
 let gaitCanvas;

 function spring(actor,dt){
  const active=actor.run&&actor.jump<=0&&actor.wind<=0;
  const drive=active?Math.sin(actor.travel*Math.PI/3)*.93:0;
  let x=actor.torso??0,v=actor.torsoSpeed??0;
  const steps=Math.max(1,Math.ceil(dt*120)),step=dt/steps;
  for(let i=0;i<steps;i++){
   v+=(drive*233-x*233-v*17)*step;
   x+=v*step;
  }
  actor.torso=Math.max(-1.45,Math.min(1.45,x));
  actor.torsoSpeed=v;
 }

 function render(ctx,sheet,view,pose,frame,torso){
  const u=frame/11,cycle=frame*Math.PI/6;
  const moving=pose==='walk'||pose==='run',sprint=pose==='run';
  const aim=pose==='aim'||pose==='shoot'||pose==='recover';
  const row=moving?0:pose==='jump'?2:aim?3:1;
  const direction=facing(view);
  const x=direction*cell,y=row*cell;
  const lift=moving?-(sprint?7:3)*Math.abs(Math.sin(cycle)):pose==='idle'?Math.sin(cycle)*1.3:0;
  const side=Math.sin(direction*Math.PI/4);
  const recoil=pose==='shoot'?Math.max(0,1-Math.abs(frame-6)*.30):pose==='recover'?(1-u)*.21:0;
  ctx.imageSmoothingEnabled=false;
  ctx.translate(cell/2,foot);
  if(pose==='death'){
   const fall=Math.sin(u*Math.PI/2);
   ctx.translate(-fall*25,0);ctx.rotate(fall*1.49);ctx.scale(1-.17*fall,1-.55*fall);
  }else{
   const hit=pose==='hit'?Math.sin(Math.PI*u):0;
   const lean=sprint?side*.09:pose==='jump'?side*(u-.5)*.17:pose==='aim'?(1-u)*side*.045:0;
   ctx.transform(1,0,hit*.13+lean+side*recoil*.048,1,-side*recoil*5,lift-recoil*4);
  }
  if(moving){
   if(!gaitCanvas){
    gaitCanvas=document.createElement('canvas');
    gaitCanvas.width=gaitCanvas.height=cell;
   }
   const gait=gaitCanvas.getContext('2d');
   gait.clearRect(0,0,cell,cell);
   gait.imageSmoothingEnabled=false;
   gait.translate(cell/2,foot);
   const stride=Math.sin(cycle),reach=Math.abs(stride);
   const thigh=106;
   const mid=cell/2;
   const opposite=stride<0;
   gait.save();
   if(opposite)gait.scale(-1,1);
   const legsX=opposite?facing((8-view)%8)*cell:x;
   for(let start=thigh;start<foot;start+=quality){
    const count=Math.min(quality,foot-start);
    const taper=(start-thigh)/(foot-thigh);
    const width=cell*(1-taper*(1-reach)*(sprint?.50:.70));
    const sway=side*taper*reach*(sprint?3:7);
    gait.drawImage(sheet,legsX,y+start,cell,count,-width/2+sway,start-foot,width,count);
   }
   gait.restore();
   const weight=[1,.94,.82,.35,0,.35,.82,.94][view];
   const displacement=weight*torso*(sprint?4.3:1.4);
   // Deform only the upper torso band and taper to the shoulders and waist.
   const mapped=at=>Math.round(at+Math.max(0,1-Math.abs(at-68)/23)**2*displacement);
   for(let start=0;start<thigh;start+=quality){
    const next=Math.min(thigh,start+quality),top=mapped(start);
    gait.drawImage(sheet,x,y+start,cell,next-start,-mid,top-foot,cell,mapped(next)-top);
   }
   gait.resetTransform();
   ctx.drawImage(gaitCanvas,-mid,-foot);
  }else{
   ctx.drawImage(sheet,x,y,cell,cell,-cell/2,-foot,cell,cell);
  }
  ctx.resetTransform();
  if(pose==='hit'){
   ctx.globalCompositeOperation='source-atop';
   ctx.fillStyle='rgba(255,85,66,'+Math.sin(Math.PI*u)*.41+')';
   ctx.fillRect(0,0,cell,cell);
  }
 }

 return {cell,poses,spring,render};
})();
