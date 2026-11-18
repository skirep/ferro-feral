const ferroEffects=(()=>{
 const colors=['#5dffe2','#b985ff','#ffbe57','#ff5972'];
 const roomLight=[[65,255,217],[168,102,255],[255,177,63],[255,55,92]];
 const maxBursts=24, maxTraces=12;
 const bursts=[], traces=[], waves=[];
 const crystals=colors.map(()=>new Map());
 const silhouettes=[
  [[0,-33],[19,-10],[14,15],[0,32],[-14,15],[-19,-10]],
  [[0,-30],[24,-18],[28,7],[0,29],[-28,7],[-24,-18]],
  [[-16,-23],[16,-23],[23,-5],[14,24],[-14,24],[-23,-5]],
  [[0,-32],[17,-16],[27,9],[12,23],[0,30],[-12,23],[-27,9],[-17,-16]]
 ];
 const tau=Math.PI*2;

 function clear(){bursts.length=traces.length=waves.length=0}

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

 function blast(x,y,z,color,radius,omega){
  impact(x,y,z,color,true);
  if(waves.length>=8)waves.shift();
  waves.push({x,y,z,color,radius,omega,t:0,life:omega?1.05:.65});
 }

 function tick(dt){
  for(const effects of [bursts,traces,waves]){
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
  const lean=[-.19,.60,.04,-.44][room];
  for(const [height,radius,tilt,phase] of [[19,38,lean,0],[-15,29,-lean,Math.PI]]){
   ctx.save();
   ctx.translate(0,height);ctx.rotate(tilt);
   ctx.beginPath();ctx.ellipse(0,0,radius,9,0,0,tau);
   ctx.strokeStyle=color+'43';ctx.lineWidth=1;ctx.stroke();
   ctx.beginPath();ctx.ellipse(0,0,radius,9,0,a+phase,a+phase+Math.PI*.72);
   ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
   ctx.restore();
  }
  ctx.beginPath();
  for(const [i,[x,y]] of silhouettes[room].entries()){
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
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

 function dot(ctx,project,x,y,z,color,alpha,size){
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

 function draw(ctx,project,shots,bolts,detail){
  const spark=(x,y,z,color,alpha,size)=>dot(ctx,project,x,y,z,color,alpha,size);
  for(const shot of shots){
   const vx=Math.cos(shot.a),vy=Math.sin(shot.a);
   for(let i=detail?4:2;i>=0;i--){
    const d=i*Math.min(.15,shot.speed*.037);
    spark(shot.x-vx*d,shot.y-vy*d,shot.altitude-shot.slope*d,i?shot.color:'#fff4cf',1-i*.17,i?7:12);
   }
  }
  for(const bolt of bolts){
   const {gun,traveled}=bolt;
   const omega=!!gun.projectile.charge;
   const count=detail?(omega?11:7):4;
   for(let i=count;i>=0;i--){
    const offset=i*(omega?.14:.19),fade=1-i/(count+1);
    if(offset>traveled)continue;
    const [x,y,z]=boltTrailPoint(bolt,offset);
    spark(x,y,z,i<2?'#fff8d4':gun.color,fade,(omega?34:16)*(i?fade:.98));
   }
  }
  for(const {from,to,color,heavy,t,life} of traces){
   const alpha=1-t/life, dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2];
   const count=Math.min(detail?72:32,Math.max(2,Math.ceil(Math.hypot(dx,dy)*(detail?8:5))));
   for(let i=0;i<=count;i++){
    const f=i/count;
    spark(from[0]+dx*f,from[1]+dy*f,from[2]+dz*f,color,alpha,heavy?8:4);
   }
  }
  for(const {x,y,z,color,large,sparks,t,life} of bursts){
   const alpha=1-t/life;
   const radius=.07+t*(large?2.6:1.7);
   const ring=large?(detail?20:10):0;
   for(let i=0;i<ring;i++){
    const angle=i*tau/ring;
    spark(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z+.04,color,alpha*.85,10);
   }
   for(let i=0;i<sparks.length;i+=detail?1:2){
    const [vx,vy,vz]=sparks[i];
    const altitude=z+Math.max(-.30,vz*t-4*t*t);
    spark(x+vx*t,y+vy*t,altitude,i%3===0?'#ffe7ae':color,alpha,large?12:8);
    if(detail&&t>.035){
     spark(x+vx*(t-.027),y+vy*(t-.027),altitude-(vz-8*t)*.027,color,alpha*.38,large?9:5);
     if(i%4===0)spark(x+vx*t*.24,y+vy*t*.24,z+t*.8,'#918595',alpha*.21,12+t*24);
    }
   }
   if(t<.10)spark(x,y,z,'#fff7db',alpha,large?24:15);
  }
  for(const {x,y,z,color,radius,omega,t,life} of waves){
   const time=t/life,alpha=1-time;
   const spread=.18+radius*Math.sqrt(time), count=detail?46:19;
   for(let i=0;i<count;i++){
    const a=i*tau/count;
    const dx=Math.cos(a)*spread,dy=Math.sin(a)*spread;
    spark(x+dx,y+dy,z*.4+.05,color,alpha*.74,omega?17:12);
    if(omega&&detail&&i%2===0)spark(x+dx*.76,y+dy*.76,z+.25+Math.sin(a*5)*.15,color,alpha*.45,11);
   }
   if(time<.38){
    spark(x,y,z,color,alpha,omega?95:62);
    spark(x,y,z,'#fffbe4',alpha,omega?49:29);
   }
  }
  ctx.globalAlpha=1;
 }

 function arena(ctx,project,cores,pulses,time,ambient,detail,player){
  for(const [room,[x,y]] of cores.entries()){
   if(Math.hypot(x-player.x,y-player.y)>14)continue;
   const color=colors[room];
   if(ambient){
    const count=detail?42:18;
    for(let i=0;i<count;i++){
     const life=(i*.618034+time*[.60,.16,.44,.27][room])%1;
     const angle=i*2.39996+time*(room===1?1.4:.3);
     const radius=room===1?1.25+(i%4)*.44:room===2?.36+life*3:.58+life*1.6;
     const z=room===0?.35+life*1.93:room===1?1.16+Math.sin(angle*1.9)*.71:
      room===2?.08+life*life*2.2:1.96-life*1.65+Math.sin(angle)*.21;
     const alpha=Math.sin(life*Math.PI)*(.43+i%3*.15);
     dot(ctx,project,x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z,i%5?color:'#fff7db',alpha,room===2?9:6);
    }
   }
   const age=pulses[room];
   if(age>=1.25)continue;
   const radius=.7+age*3.8, alpha=(1-age/1.25)*.82;
   const points=detail?68:32;
   for(let i=0;i<points;i++){
    const a=i*tau/points;
    dot(ctx,project,x+Math.cos(a)*radius,y+Math.sin(a)*radius,.095+Math.sin(a*6-age*10)*.04,color,alpha,detail?12:9);
   }
  }
  ctx.globalAlpha=1;
 }

 return {clear,impact,trace,blast,tick,crystal,draw,arena,floorMark,roomLight};
})();
