const ferroSputnikWildlife=(()=>{
 const neighbors=[[1,0],[0,1],[-1,0],[0,-1]];
 const species=[
  {kind:0,size:1.15,speed:1.08,radius:.26},
  {kind:1,size:1.36,speed:1.42,radius:.21},
  {kind:2,size:.80,speed:.47,radius:0},
  {kind:3,size:.55,speed:.66,radius:.16}
 ];
 const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));

 function spawn(island){
  const {airAnchors:rooms,grid}=island;
  const animals=[];
  for(const [index,kind] of [0,3,1,0,3,1,0,3].entries()){
   const [x,y]=rooms[Math.floor(index*(rooms.length-1)/8)];
   const spots=[[2,1],[-2,1],[1,-2],[-1,2]];
   const [dx,dy]=spots[index%spots.length];
   const open=grid[Math.floor(y+dy)]?.[Math.floor(x+dx)]===0;
   animals.push({...species[kind],x:open?x+dx:x,y:open?y+dy:y,
    facing:index*2.13,age:0,phase:index*2.39,step:0,pause:index*.11,
    homeX:x,homeY:y,altitude:0,frame:0});
  }
  for(const [index,anchor] of [.12,.46,.76].entries()){
   const [homeX,homeY]=rooms[Math.floor(anchor*(rooms.length-1))];
   for(let i=0;i<3;i++){
    animals.push({...species[2],x:homeX,y:homeY,homeX,homeY,
     facing:0,age:0,phase:i*.39+index*1.83,step:0,altitude:2+index*.28,frame:0,
     orbit:4.65+index*.6+i*.53});
   }
  }
  return animals;
 }

 function nextCell(animal,grid,player,flee){
  const x=Math.floor(animal.x),y=Math.floor(animal.y);
  let best=-Infinity,next=null;
  for(const [ox,oy] of neighbors){
   if(grid[y+oy]?.[x+ox]!==0)continue;
   const nx=x+ox+.5,ny=y+oy+.5;
   const turn=Math.cos(animal.facing-Math.atan2(oy,ox));
   const variance=Math.sin(animal.phase*12.7+animal.step*4.91+ox*6.23+oy*7.67);
   const distance=Math.hypot(nx-animal.homeX,ny-animal.homeY);
   const score=flee?Math.hypot(nx-player.x,ny-player.y)+variance*.12:
    variance+turn*.48-Math.max(0,distance-4)*.48;
   if(score>best){best=score;next={x:nx,y:ny}}
  }
  animal.step++;
  return next;
 }

 function update(animals,grid,player,dt,startled,move,disturbance){
  for(const animal of animals){
   animal.age+=dt;
   const startledByOrbit=disturbance&&Math.hypot(animal.x-disturbance.x,animal.y-disturbance.y)<disturbance.radius;
   if(animal.kind===2){
    const alarm=animal.alarm??0;
    animal.alarm=alarm+((startledByOrbit?1:0)-alarm)*Math.min(1,dt*2.5);
    const orbit=animal.age*animal.speed+animal.phase;
    const radius=animal.orbit+animal.alarm*2.1;
    animal.x=animal.homeX+Math.cos(orbit)*radius;
    animal.y=animal.homeY+Math.sin(orbit)*radius*.86;
    animal.altitude=1.88+Math.sin(orbit+animal.phase)*.48+(animal.orbit-4)*.28+animal.alarm*1.6;
    animal.facing=Math.atan2(Math.cos(orbit)*.86,-Math.sin(orbit));
    animal.frame=Math.floor((animal.age*(10+animal.alarm*6)+animal.phase)%4);
    continue;
   }
   const distance=Math.hypot(player.x-animal.x,player.y-animal.y);
   const flee=!!startledByOrbit||distance<(startled?6.8:2.2);
   const threat=startledByOrbit?disturbance:player;
   if(flee&&!animal.flee){animal.next=null;animal.pause=0}
   animal.flee=flee;
   if(animal.pause>0){animal.pause-=dt;animal.frame=0;continue}
   animal.next??=nextCell(animal,grid,threat,flee);
   if(!animal.next)continue;
   const dx=animal.next.x-animal.x,dy=animal.next.y-animal.y,d=Math.hypot(dx,dy);
   if(d<.045){
    animal.next=null;
    if(!flee&&animal.step%4===0)animal.pause=.7+animal.phase%1.3;
    continue;
   }
   const turn=wrap(Math.atan2(dy,dx)-animal.facing);
   animal.facing+=Math.max(-dt*7,Math.min(dt*7,turn));
   const stride=Math.min(d,animal.speed*(flee?2.05:1)*dt);
   const x=animal.x,y=animal.y;
   move(animal,dx/d*stride,dy/d*stride,animal.radius);
   if(Math.hypot(animal.x-x,animal.y-y)<stride*.08)animal.next=null;
   animal.frame=1+Math.floor(animal.age*(flee?12:6))%3;
  }
 }
 return {spawn,update};
})();
