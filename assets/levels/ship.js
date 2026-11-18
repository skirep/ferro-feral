const ferroShip=(()=>{
 const mapSize=49, pitch=12;
 const names=[
  ['Hangar dels Nàufrags','Dic de manteniment','Magatzem de contenidors','Grua orbital','Porta de l’hangar'],
  ['Galeria de distribució','Central de refrigeració','Turbines de plasma','Conductes d’injecció','Reactor principal'],
  ['Arxiu de vol','Cambra de navegació','Pont de transferència','Sala dels relés','Bastió de dades'],
  ['Moll de quarantena','Hivernacle d’emergència','Laboratori de cultius','Cambra estèril','Nucli de contenció'],
  ['Mirador del buit','Antena d’espai profund','Centrífuga de gravetat','Galeria del comandant','Pont de comandament']
 ];
 const panelMaterials={bulkhead:0,floor:1,ceiling:2,cargo:3,terminal:4,reactor:5};
 const directions=[[1,0,1],[-1,0,2],[0,1,4],[0,-1,8]];
 const pitDepth=1.18;

 function layout(chapter){
  const grid=Array.from({length:mapSize},()=>new Uint8Array(mapSize).fill(1));
  const heights=Array.from({length:mapSize},()=>new Float32Array(mapSize));
  const windows=Array.from({length:mapSize},()=>new Uint8Array(mapSize));
  const pits=Array.from({length:mapSize},()=>new Uint8Array(mapSize));
  const objects=Array.from({length:mapSize},()=>new Uint8Array(mapSize));
  const rooms=Array.from({length:16},(_,id)=>[5+id%4*pitch,5+Math.floor(id/4)*pitch]);
  const deck=chapter.route.map((id,i)=>{
   const big=chapter.arenas.includes(id)||i===0||i===chapter.route.length-1;
   const hangar=id===chapter.arenas[0];
   const shape=(i+chapter.theme+chapter.stage)%3;
   const [x,y]=rooms[id];
   return {id,x,y,rx:hangar&&x>5?5:big?4:shape===1?2:3,ry:hangar&&y>5?5:big?4:shape===2?2:3,
    z:chapter.terraces[Math.floor(i*4/chapter.route.length)]*.33,big};
  });
  const carve=(x,y,z)=>{grid[y][x]=0;heights[y][x]=z};
  for(const {x,y,rx,ry,z} of deck){
   for(let dy=-ry;dy<=ry;dy++)for(let dx=-rx;dx<=rx;dx++)carve(x+dx,y+dy,z);
  }

  const gaps=[], candidates=[];
  const lane=chapter.stage%2===0?1:0;
  for(let i=1;i<deck.length;i++){
   const a=deck[i-1],b=deck[i],dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);
   const first=(dx?a.rx:a.ry), last=pitch-(dx?b.rx:b.ry);
   for(let j=first+1;j<last;j++){
    const z=a.z+(b.z-a.z)*(j-first)/(last-first);
    for(let k=-lane;k<=lane;k++)carve(a.x+dx*j+dy*k,a.y+dy*j+dx*k,z);
   }
   if(i>=2&&a.z===b.z)candidates.push({a,dx,dy});
  }
  const selected=chapter.stage<2?[candidates[0]]:[candidates[0],candidates.at(-1)];
  for(const entry of new Set(selected.filter(Boolean))){
   const {a,dx,dy}=entry;
   const x=a.x+dx*pitch/2,y=a.y+dy*pitch/2;
   const gap={x,y,dx,dy,lane};
   gaps.push(gap);
   for(let k=-lane;k<=lane;k++){
    const px=x+dy*k,py=y+dx*k;
    pits[py][px]=1;
    carve(px,py,a.z-pitDepth);
   }
  }

  const [secretRoom,secretSide]=chapter.secret;
  const secretDeck=deck.find(room=>room.id===secretRoom);
  const [secretX,secretY]=rooms[secretRoom];
  const secretOffset=secretDeck.rx+1;
  const reach=Math.min(5,secretSide<0?secretX-1:mapSize-2-secretX);
  for(let step=secretOffset;step<=reach;step++){
   carve(secretX+step*secretSide,secretY+1,secretDeck.z);
   carve(secretX+step*secretSide,secretY+2,secretDeck.z);
  }
  // The original secret slot is kept accessible when it falls within a larger room.
  const secret=[secretX+reach*secretSide+.5,secretY+2.5];
  if(grid[secretY+2][secretX+reach*secretSide])carve(secretX+reach*secretSide,secretY+2,secretDeck.z);

  for(const [i,room] of deck.entries()){
   const {x,y,rx,ry,z,big}=room;
   if(big)for(const [dx,dy,face] of directions){
    const distance=(dx?rx:ry)+1;
    for(const offset of [-3,-2,2,3]){
     const wx=x+dx*distance+dy*offset,wy=y+dy*distance+dx*offset;
     if(grid[wy]?.[wx]===1)windows[wy][wx]|=face;
    }
   }
   const placements=big?[
    [-rx+1,-ry+1,panelMaterials.cargo,.86],[rx-1,ry-1,panelMaterials.cargo,.86],
    [-rx+1,ry-1,panelMaterials.terminal,.77],[rx-1,-ry+1,panelMaterials.reactor,1.08]
   ]:[[-2,i%2?2:-2,panelMaterials.terminal,.77]];
   for(const [dx,dy,material,height] of placements){
    const px=x+dx,py=y+dy;
    if(px===Math.floor(secret[0])&&py===Math.floor(secret[1]))continue;
    if(i===deck.length-1&&dx>=0)continue;
    objects[py][px]=material;
    carve(px,py,z+height);
   }
  }
  return {grid,heights,windows,pits,objects,rooms,deck,gaps,secret};
 }

 function canStep(heights,x,y,limit){
  return (heights[Math.floor(y)]?.[Math.floor(x)]??0)<=limit+.0001;
 }

 return {mapSize,layout,names,panelMaterials,canStep};
})();
