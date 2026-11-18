const ferroProps=(()=>{
 const kinds={
  crate:{radius:.33,height:.66,mass:3,hp:62},
  barrel:{radius:.25,height:.68,mass:1.7,hp:43}
 };
 const sprites=new Map();

 function spawn(cores){
  return cores.flatMap(([x,y],room)=>[
   [-3.6,-1.9,'crate'],[-2.9,-2.1,'barrel'],[2.4,3.3,'crate'],
   [2.6,2.4,'barrel'],[3.3,2.5,'barrel'],[4,-1.3,'crate'],[-3.8,3.1,'barrel']
  ].map(([dx,dy,kind])=>({
   ...kinds[kind],kind,room,x:x+dx,y:y+dy,z:0,vx:0,vy:0,vz:0,roll:0
  })));
 }

 function fits(wall,x,y,radius){
  return !wall(x-radius,y-radius)&&!wall(x-radius,y+radius)&&
   !wall(x+radius,y-radius)&&!wall(x+radius,y+radius);
 }

 function push(prop,dx,dy,kick,lift=0){
  prop.vx+=dx*kick/prop.mass;
  prop.vy+=dy*kick/prop.mass;
  prop.vz=Math.max(prop.vz,lift/prop.mass);
 }

 function move(prop,wall,dt){
  const r=prop.radius;
  const x=prop.x+prop.vx*dt, y=prop.y+prop.vy*dt;
  if(fits(wall,x,prop.y,r))prop.x=x;else prop.vx*=-.47;
  if(fits(wall,prop.x,y,r))prop.y=y;else prop.vy*=-.47;
  if(prop.z>0||prop.vz>0){
   prop.z+=prop.vz*dt;
   prop.vz-=7.4*dt;
   if(prop.z<=0){prop.z=0;prop.vz=prop.vz<-.9?-prop.vz*.31:0}
  }
  const drag=Math.exp(-dt*(prop.z>.02?.64:5.5));
  prop.vx*=drag;prop.vy*=drag;
  if(Math.abs(prop.vx)<.015)prop.vx=0;
  if(Math.abs(prop.vy)<.015)prop.vy=0;
  prop.roll=Math.min(.24,Math.max(-.24,prop.roll*Math.exp(-dt*5)+prop.vx*dt*.33));
 }

 function tick(props,wall,player,previous,dt){
  for(const prop of props){
   if(prop.hp<=0)continue;
   move(prop,wall,dt);
   if(player.z>prop.z+prop.height||prop.z>player.z+.65)continue;
   let dx=prop.x-player.x, dy=prop.y-player.y;
   if(dx===0&&dy===0)dx=.001;
   const distance=Math.hypot(dx,dy), gap=prop.radius+.19-distance;
   if(gap<=0)continue;
   const ax=dx/distance, ay=dy/distance;
   const x=prop.x+ax*gap, y=prop.y+ay*gap;
   const canPush=fits(wall,x,y,prop.radius);
   if(canPush){
    prop.x=x;prop.y=y;
    const approach=((player.x-previous[0])*ax+(player.y-previous[1])*ay)/Math.max(.001,dt);
    push(prop,ax,ay,Math.max(0,approach)*.22);
   }else if(fits(wall,player.x-ax*gap,player.y-ay*gap,.19)){
    player.x-=ax*gap;player.y-=ay*gap;
   }
  }
  for(let i=0;i<props.length;i++){
   const a=props[i];
   if(a.hp<=0)continue;
   for(let j=i+1;j<props.length;j++){
    const b=props[j];
    if(b.hp<=0||a.z>b.z+b.height||b.z>a.z+a.height)continue;
    const dx=b.x-a.x||.001,dy=b.y-a.y,sum=a.radius+b.radius;
    if(Math.abs(dx)>=sum||Math.abs(dy)>=sum)continue;
    const distance=Math.hypot(dx,dy), overlap=sum-distance;
    if(overlap<=0)continue;
    const x=dx/distance,y=dy/distance;
    const aMove=overlap*b.mass/(a.mass+b.mass),bMove=overlap-aMove;
    if(fits(wall,a.x-x*aMove,a.y-y*aMove,a.radius)){a.x-=x*aMove;a.y-=y*aMove}
    if(fits(wall,b.x+x*bMove,b.y+y*bMove,b.radius)){b.x+=x*bMove;b.y+=y*bMove}
    const closing=(a.vx-b.vx)*x+(a.vy-b.vy)*y;
    if(closing<=0)continue;
    const impulse=1.36*closing/(1/a.mass+1/b.mass);
    push(a,-x,-y,impulse);push(b,x,y,impulse);
   }
  }
 }

 function along(props,x,y,altitude,dx,dy,limit){
  let hit=null;
  for(const prop of props){
   if(prop.hp<=0||altitude<prop.z||altitude>prop.z+prop.height)continue;
   const sx=prop.x-x,sy=prop.y-y,dot=sx*dx+sy*dy,side=sx*dy-sy*dx;
   if(dot<0||Math.abs(side)>=prop.radius)continue;
   const distance=Math.max(0,dot-Math.sqrt(prop.radius**2-side**2));
   if(distance<limit){hit={prop,distance};limit=distance}
  }
  return hit;
 }

 function art(kind){
  if(sprites.has(kind))return sprites.get(kind);
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=80;
  const ctx=canvas.getContext('2d');
  const poly=(color,points)=>{
   ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);
   for(const point of points.slice(1))ctx.lineTo(...point);
   ctx.closePath();ctx.fill();
  };
  if(kind==='crate'){
   poly('#423e47',[[7,21],[55,16],[72,26],[72,69],[55,79],[7,73]]);
   poly('#aa7650',[[7,21],[55,16],[72,26],[54,31]]);
   poly('#594e57',[[54,30],[72,26],[72,69],[55,79]]);
   poly('#855d40',[[11,28],[51,33],[51,74],[11,69]]);
   for(let i=0;i<4;i++)poly(i%2?'#6c4737':'#ad7e51',[[14,33+i*8],[48,37+i*8],[48,43+i*8],[14,40+i*8]]);
   poly('#bd9362',[[11,64],[45,34],[51,35],[51,42],[14,72],[11,70]]);
   ctx.fillStyle='#cac2af';
   for(const [x,y] of [[12,31],[48,35],[12,66],[48,70],[58,34],[66,65]])ctx.fillRect(x,y,3,3);
  }else{
   const metal=ctx.createLinearGradient(14,0,67,0);
   for(const [t,color] of [[0,'#552934'],[.22,'#c14e40'],[.43,'#ff9161'],[.76,'#ad4540'],[1,'#40242e']])metal.addColorStop(t,color);
   poly(metal,[[14,18],[66,18],[64,70],[55,78],[24,78],[16,70]]);
   ctx.fillStyle='#332631';ctx.beginPath();ctx.ellipse(40,18,26,10,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#8f6a71';ctx.stroke();ctx.fillStyle='#d4aaa2';ctx.fillRect(44,16,8,4);
   for(const y of [27,62]){
    ctx.fillStyle='#502e38';ctx.fillRect(15,y,50,4);
    ctx.fillStyle='#e17a57';ctx.fillRect(18,y+3,44,2);
   }
   poly('#ffbf58',[[40,36],[53,55],[27,55]]);
   ctx.fillStyle='#3f2630';ctx.fillRect(39,42,3,7);ctx.fillRect(39,51,3,2);
  }
  sprites.set(kind,canvas);
  return canvas;
 }
 return {spawn,tick,push,along,art};
})();
