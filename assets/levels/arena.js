const ferroArena=(()=>{
 const rooms=[[9,9],[27,9],[27,27],[9,27]];
 const links=[[0,1],[1,2],[2,3],[3,0]];

 function layout(size,types){
  const grid=Array.from({length:size},()=>Array(size).fill(1));
  function carve(x1,y1,x2,y2){
   for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)grid[y][x]=0;
  }
  for(const [x,y] of rooms)carve(x-6,y-6,x+6,y+6);
  for(const [start,end] of links){
   const [x,y]=rooms[start],[ex,ey]=rooms[end];
   if(x===ex)carve(x-1,Math.min(y,ey),x+1,Math.max(y,ey));
   else carve(Math.min(x,ex),y-1,Math.max(x,ex),y+1);
  }
  const occupants=rooms.map(()=>[]);
  types.forEach((type,i)=>{
   occupants[i%4].push(type);
   occupants[(i+2)%4].push(type);
  });
  const spawns=occupants.flatMap((group,room)=>{
   const [x,y]=rooms[room];
   return group.map((type,i)=>({
    x:x-4.4+i%10*.98,y:y-3+Math.floor(i/10)*1.45,type
   }));
  });
  return {
   grid,spawns,
   lamps:rooms.flatMap(([x,y])=>[[x-4,y-4],[x+4,y-4],[x-4,y+4],[x+4,y+4]]),
   supplies:rooms.flatMap(([x,y])=>[[x-5,y+4,'hp'],[x+5,y+4,'ammo']]),
   start:[4.5,4.5]
  };
 }

 function target(enemy,player,foes,canSee){
  let closest=null, limit=121;
  for(const candidate of foes){
   if(candidate===enemy||candidate.hp<=0)continue;
   const squared=(candidate.x-enemy.x)**2+(candidate.y-enemy.y)**2;
   if(squared>=limit||!canSee(enemy,candidate,Math.sqrt(squared)))continue;
   closest=candidate;limit=squared;
  }
  // Fight visible rivals first. The player is a target in empty or isolated rooms.
  if(closest)return closest;
  const distance=Math.hypot(player.x-enemy.x,player.y-enemy.y);
  return distance<11&&canSee(enemy,player,distance)?player:null;
 }

 function shotTarget(shot,foes,altitude){
  let best=null,limit=.31**2;
  for(const enemy of foes){
   if(enemy===shot.owner||enemy.hp<=0)continue;
   const distance=(enemy.x-shot.x)**2+(enemy.y-shot.y)**2;
   if(distance>=limit||Math.abs(shot.altitude-altitude(enemy))>=.45)continue;
   best=enemy;limit=distance;
  }
  return best;
 }
 return {layout,target,shotTarget};
})();
