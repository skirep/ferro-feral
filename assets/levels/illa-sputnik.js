// Room IDs are ordered left to right on a 4 × 4 grid.
const ferroSputnik=(()=>{
 const theme=5;
 const sunlight=[[.03,.30],[-.34,.44],[2.88,.25],[-1.87,.48],[1.84,.19]];
 const stages=[
  ['Platja de les Palmeres',[0,1,5,6,10,11,15],[0,1,1,0,0,1],105],
  ['Congost de les Falgueres',[12,13,9,5,4,0,1,2,6,10,14],[1,0,0,1,0,1,1,0],130],
  ['Camí dels Manglars',[3,2,6,5,9,8,12,13,14,10,11,7],[0,1,0,1,1,0,1,0,0,1],155],
  ['Bosc de les Arrels',[15,11,7,6,2,1,0,4,5,9,10,14,13],[1,0,1,0,0,1,0,1,1,0],175],
  ['Cràter de l’Sputnik',[4,8,12,13,9,5,1,2,3,7,11,15,14,10],[0,1,0,1,1,0,0,1,0,1,1,0],205]
 ].map(([name,route,roster,bossHealth],stage)=>({
  name,route,roster,bossHealth,stage,outdoors:true,sun:sunlight[stage],
  arenas:[route[2],10],boss:1,secret:[route[3],1],terraces:[0,0,0,0]
 }));

 function layout(chapter,size){
  const grid=Array.from({length:size},()=>new Uint8Array(size).fill(1));
  const heights=Array.from({length:size},()=>new Float32Array(size));
  const terrain=Array.from({length:size},()=>new Uint8Array(size));
  const positions=[7,16,25,38];
  const rooms=Array.from({length:16},(_,i)=>[positions[i%4],positions[i>>2]]);
  const plants=[];
  const [azimuth,elevation]=chapter.sun;
  const sun={azimuth,elevation,x:Math.cos(azimuth),y:Math.sin(azimuth),reach:1/Math.tan(elevation)};
  const airAnchors=chapter.route.map(id=>rooms[id].map(value=>value+.5));
  const carve=(x,y,material)=>{
   grid[y][x]=0;
   terrain[y][x]=material;
  };
  for(const [i,id] of chapter.route.entries()){
   const [x,y]=rooms[id];
   const radius=id===10?5:i===0||i===chapter.route.length-1||chapter.arenas.includes(id)?4:3;
   const material=id===10?2:i===0&&chapter.stage===0?0:1;
   for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    if(Math.abs(dx)+Math.abs(dy)<=radius*2-1)carve(x+dx,y+dy,material);
   }
   if(i===0)continue;
   const [sx,sy]=rooms[chapter.route[i-1]];
   const horizontal=sx!==x;
   const width=(i+chapter.stage)%3===0?2:1;
   const start=horizontal?Math.min(sx,x):Math.min(sy,y);
   const end=horizontal?Math.max(sx,x):Math.max(sy,y);
   for(let mile=start;mile<=end;mile++)for(let offset=-width;offset<=width;offset++){
    const px=horizontal?mile:x+offset,py=horizontal?y+offset:mile;
    if(grid[py][px])carve(px,py,1);
   }
  }

  const [cx,cy]=rooms[10];
  const wreck={x:cx+1.5,y:cy-1.5,kind:3,size:2.15,yaw:-.9};
  grid[cy-2][cx+1]=2;
  // Sprites just inside the walkable edge cover the bank and leave the path clear.
  for(let y=2;y<size-2;y++)for(let x=2;x<size-2;x++){
   if(grid[y][x]!==0)continue;
   const edges=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>grid[y+dy][x+dx]);
   for(const [dx,dy] of edges){
    const seed=(x*811+y*421+dx*29+dy*47+chapter.stage*711)%997;
    if(seed%9===0||Math.hypot(x+.5-wreck.x,y+.5-wreck.y)<2.65)continue;
    const beach=terrain[y][x]===0;
    const kind=beach?(seed%3?0:2):seed%9<2?0:seed%9<4?1:seed%9===8?4:2;
    const size=[2.95,3.15,1.24,2.15,1.12][kind]*(.83+seed%17/50);
    const jitter=(seed%15-7)*.043;
    const yaw=seed*.193;
    if(!beach||seed%4===0)plants.push({x:x+.5+dx*.46+dy*jitter,y:y+.5+dy*.46+dx*jitter,kind,size,yaw});
    if(!beach&&kind!==4&&seed%5===0&&grid[y+dy*2]?.[x+dx*2]){
     plants.push({x:x+.5+dx*1.55+dy*jitter,y:y+.5+dy*1.55+dx*jitter,kind:seed%2,size:3.8+seed%11*.075,yaw});
    }
   }
  }
  plants.push(wreck);
  const [secretX,secretY]=rooms[chapter.secret[0]];
  return {grid,heights,terrain,rooms,plants,wreck,sun,airAnchors,secret:[secretX+2.5,secretY-1.5]};
 }

 // Rivals are preferred while visible. Guards holding their own ground still fire at the player.
 function opponents(enemy,candidate){
  return enemy.type.faction!==candidate.type.faction;
 }

 return {theme,stages,layout,opponents};
})();
ferroWorldLevels.push(ferroSputnik.stages);
