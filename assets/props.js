const ferroProps=(()=>{
 const kinds={
  crate:{radius:.33,height:.66,mass:3,hp:62},
  barrel:{radius:.25,height:.68,mass:1.7,hp:43}
 };
 const sprites=new Map();
 const frameSize=160, columns=4, views=8;
 const fragmentColors={crate:['#855536','#bc8553','#63402d','#454851'],barrel:['#813938','#b1503d','#434653','#d2954a']};
 let loadTask=null;

 function spawn(cores){
  return cores.flatMap(([x,y],room)=>[
   [-3.6,-1.9,'crate'],[-2.9,-2.1,'barrel'],[2.4,3.3,'crate'],
   [2.6,2.4,'barrel'],[3.3,2.5,'barrel'],[4,-1.3,'crate'],[-3.8,3.1,'barrel']
  ].map(([dx,dy,kind])=>({
   ...kinds[kind],kind,room,x:x+dx,y:y+dy,z:0,vx:0,vy:0,vz:0,roll:0,
   yaw:Math.atan2(dy,dx)+Math.PI,spin:0
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
  const torque=Math.cos(prop.yaw)*dy-Math.sin(prop.yaw)*dx;
  prop.spin=Math.max(-8,Math.min(8,prop.spin+torque*kick*.56/prop.mass));
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
  prop.yaw+=prop.spin*dt;
  prop.spin*=Math.exp(-dt*(prop.z>.02?1.4:3.8));
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

 function frame(kind,view){
  const index=(views-view)%views;
  return {art:sprites.get(kind),frameSize,frameX:index%columns*frameSize,frameY:Math.floor(index/columns)*frameSize};
 }

 function shatter(fragments,prop,dx,dy){
  const colors=fragmentColors[prop.kind];
  const count=prop.kind==='barrel'?12:9;
  fragments.splice(0,Math.max(0,fragments.length+count-96));
  for(let i=0;i<count;i++){
   const a=i*2.39996+Math.random()*.23,speed=1.2+Math.random()*3.2;
   fragments.push({
    x:prop.x,y:prop.y,z:prop.z+.20+Math.random()*.26,
    vx:prop.vx*.48+dx*.66+Math.cos(a)*speed,vy:prop.vy*.48+dy*.66+Math.sin(a)*speed,
    vz:1+Math.random()*3,roll:0,spin:(i%2?1:-1)*(4+Math.random()*9),yaw:a,
    radius:.025,size:.04+Math.random()*.09,life:1.25+Math.random()*2,color:colors[i%colors.length]
   });
  }
 }

 function tickFragments(fragments,wall,dt){
  for(let i=fragments.length-1;i>=0;i--){
   const fragment=fragments[i];
   fragment.life-=dt;
   if(fragment.life<=0){fragments.splice(i,1);continue}
   move(fragment,wall,dt);
  }
 }

 function prepare(){
  if(loadTask)return loadTask;
  loadTask=Promise.all(Object.keys(kinds).map(kind=>new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>{
    if(image.naturalWidth!==columns*frameSize||image.naturalHeight!==views/columns*frameSize){
     reject(new Error('Invalid prop sprite: '+kind));
     return;
    }
    sprites.set(kind,image);
    resolve();
   };
   image.onerror=()=>reject(new Error('Cannot load prop sprite: '+kind));
   image.src='./assets/props/'+kind+'.webp?v=360';
  }))).catch(error=>{
   loadTask=null;
   throw error;
  });
  return loadTask;
 }

 return {spawn,tick,push,along,prepare,frame,shatter,tickFragments};
})();
