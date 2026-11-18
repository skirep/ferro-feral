const ferroEffects=(()=>{
 const colors=['#5dffe2','#b985ff','#ffbe57','#ff5972'];
 const roomLight=[[65,255,217],[168,102,255],[255,177,63],[255,55,92]];
 const maxBursts=24, maxTraces=12;
 const bursts=[], traces=[];
 const crystals=colors.map(()=>new Map());
 const tau=Math.PI*2;

 function clear(){bursts.length=traces.length=0}

 function impact(x,y,z,color,large=false){
  if(bursts.length>=maxBursts)bursts.shift();
  const count=large?22:9;
  const sparks=Array.from({length:count},(_,i)=>{
   const angle=i*tau/count+Math.random()*.28;
   const speed=(.6+Math.random()*1.5)*(large?1.9:1);
   return [Math.cos(angle)*speed,Math.sin(angle)*speed,.85+Math.random()*(large?3.2:1.5)];
  });
  bursts.push({x,y,z,color,large,sparks,t:0,life:large?.82:.38});
 }

 function trace(from,to,color,heavy){
  if(traces.length>=maxTraces)traces.shift();
  traces.push({from,to,color,heavy,t:0,life:heavy?.23:.12});
 }

 function tick(dt){
  for(const effects of [bursts,traces]){
   for(let i=effects.length-1;i>=0;i--){
    effects[i].t+=dt;
    if(effects[i].t>=effects[i].life)effects.splice(i,1);
   }
  }
 }

 function crystal(room,time,animated){
  const frame=animated?Math.floor(time*18)%24:3;
  const frames=crystals[room];
  if(frames.has(frame))return frames.get(frame);
  const canvas=document.createElement('canvas');
  const size=96, color=colors[room], a=frame*tau/24;
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const centerY=48+Math.sin(a)*3;
  const halo=ctx.createRadialGradient(48,centerY,1,48,centerY,45);
  halo.addColorStop(0,color+'83');halo.addColorStop(.48,color+'37');halo.addColorStop(1,color+'00');
  ctx.fillStyle=halo;ctx.fillRect(0,0,size,size);

  ctx.translate(48,centerY);
  // Two orbiting rings sit at different heights around the floating core.
  for(const [height,radius,tilt,phase] of [[19,38,-.19,0],[-15,29,.22,Math.PI]]){
   ctx.save();
   ctx.translate(0,height);ctx.rotate(tilt);
   ctx.beginPath();ctx.ellipse(0,0,radius,9,0,0,tau);
   ctx.strokeStyle=color+'43';ctx.lineWidth=1;ctx.stroke();
   ctx.beginPath();ctx.ellipse(0,0,radius,9,0,a+phase,a+phase+Math.PI*.72);
   ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
   ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(0,-32);ctx.lineTo(17,-8);ctx.lineTo(12,14);
  ctx.lineTo(0,30);ctx.lineTo(-14,14);ctx.lineTo(-18,-8);ctx.closePath();
  ctx.fillStyle='#14132a';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();

  const edge=Math.sin(a)*9;
  ctx.beginPath();
  ctx.moveTo(0,-30);ctx.lineTo(15,-7);ctx.lineTo(edge,19);ctx.lineTo(0,28);ctx.lineTo(-14,-8);ctx.closePath();
  ctx.fillStyle=color+'82';ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0,-24);ctx.lineTo(edge+4,-6);ctx.lineTo(edge,19);ctx.lineTo(edge-4,-6);ctx.closePath();
  ctx.fillStyle='#f5ffff';ctx.fill();
  for(let i=0;i<5;i++){
   const angle=a+i*tau/5;
   const x=Math.round(Math.cos(angle)*(27+i*2));
   const y=Math.round(Math.sin(angle)*12+(i-2)*8);
   ctx.fillStyle=i%2?color:'#fff8e8';
   ctx.fillRect(x,y,i%2?2:3,i%2?2:3);
  }
  frames.set(frame,canvas);
  return canvas;
 }

 function floorMark(dx,dy){
  const distance=dx*dx+dy*dy;
  if(distance>32)return 0;
  if(distance<10&&(Math.abs(distance-2.45)<.15||Math.abs(distance-7.54)<.22))return 2;
  const short=Math.min(Math.abs(dx),Math.abs(dy)),long=Math.max(Math.abs(dx),Math.abs(dy));
  if(short<.075&&long>2.55&&long<5.6&&Math.floor(long*4)%4!==0)return 1;
  if(short>.46&&short<.54&&long>1.67&&long<2.65)return 2;
  return 0;
 }

 function draw(ctx,project,shots){
  function dot(x,y,z,color,alpha,size){
   const screen=project(x,y,z);
   if(!screen)return;
   const [sx,sy,distance]=screen;
   const width=Math.max(1,Math.min(12,Math.round(size/distance)));
   ctx.fillStyle=color;
   ctx.globalAlpha=alpha*.22;
   ctx.fillRect(sx-width,sy-width,width*2+1,width*2+1);
   ctx.globalAlpha=alpha;
   ctx.fillRect(sx-Math.floor(width/2),sy-Math.floor(width/2),width,width);
  }
  for(const shot of shots){
   const vx=Math.cos(shot.a),vy=Math.sin(shot.a);
   for(let i=4;i>=0;i--){
    const d=i*Math.min(.15,shot.speed*.037);
    dot(shot.x-vx*d,shot.y-vy*d,shot.altitude-shot.slope*d,i?shot.color:'#fff4cf',1-i*.17,i?7:12);
   }
  }
  for(const {from,to,color,heavy,t,life} of traces){
   const alpha=1-t/life, dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2];
   const count=Math.min(72,Math.max(2,Math.ceil(Math.hypot(dx,dy)*8)));
   for(let i=0;i<=count;i++){
    const f=i/count;
    dot(from[0]+dx*f,from[1]+dy*f,from[2]+dz*f,color,alpha,heavy?8:4);
   }
  }
  for(const {x,y,z,color,large,sparks,t,life} of bursts){
   const alpha=1-t/life;
   const radius=.07+t*(large?2.6:1.7);
   for(let i=0;i<20;i++){
    const angle=i*tau/20;
    dot(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z+.04,color,alpha*.85,large?10:6);
   }
   for(const [vx,vy,vz] of sparks){
    dot(x+vx*t,y+vy*t,z+Math.max(-.15,vz*t-4*t*t),color,alpha,large?12:8);
   }
   if(t<.10)dot(x,y,z,'#fff7db',alpha,large?24:15);
  }
  ctx.globalAlpha=1;
 }

 return {clear,impact,trace,tick,crystal,draw,floorMark,roomLight};
})();
