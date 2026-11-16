// A sheet contains six frames per pose and view, packed in that order.
const ferroEnemySprites = (() => {
 const size=192, cell=96, columns=12, views=8, framesPerView=6;
 const motionPoses=['walk','jump','shoot'];
 const sheets=new Map(), pending=new Map(), frames=new Map();
 let retained=new Set();

 function levelIds({theme,roster,boss}){
  return [...new Set([...roster,boss].map(slot=>theme*ferroEnemyProfiles.length+slot))];
 }

 function load(id){
  if(sheets.has(id))return Promise.resolve();
  if(pending.has(id))return pending.get(id);
  const task=new Promise((resolve,reject)=>{
   const atlas=new Image();
   const file=id===0?'corc-de-quilla-360.png':'directional/'+id+'.png';
   atlas.onload=()=>{
    if(atlas.naturalWidth!==columns*cell||atlas.naturalHeight!==motionPoses.length*views*framesPerView/columns*cell){
     reject(new Error('Invalid directional enemy atlas dimensions: '+file));
     return;
    }
    if(retained.has(id))sheets.set(id,atlas);
    resolve();
   };
   atlas.onerror=()=>reject(new Error('Cannot load enemy atlas '+file));
   atlas.src='./assets/enemies/'+file;
  }).finally(()=>pending.delete(id));
  pending.set(id,task);
  return task;
 }

 function prepare(level,next){
  const ids=levelIds(level);
  const nextIds=next?levelIds(next):[];
  retained=new Set([...ids,...nextIds]);
  for(const id of sheets.keys())if(!retained.has(id))sheets.delete(id);
  const result=Promise.all(ids.map(load));
  result.then(()=>Promise.all(nextIds.filter(id=>retained.has(id)).map(load))).catch(()=>{});
  return result;
 }

 function draw(sheet,view,pose,motionIndex,frame){
  const motionFrame=motionIndex<0?0:Math.floor(frame/2);
  const i=(Math.max(0,motionIndex)*views+view)*framesPerView+motionFrame;
  const x=i%columns*cell,y=Math.floor(i/columns)*cell;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const t=frame/11;
  if(pose==='death'){
   const fall=Math.sin(t*Math.PI/2);
   ctx.translate(size/2+fall*19,size*.86);
   ctx.rotate(fall*.97);
   ctx.scale(1,1-fall*.58);
   ctx.translate(-size/2,-size*.86);
  }else if(pose==='hit'){
   ctx.translate(Math.sin(t*Math.PI)*5,0);
  }
  ctx.drawImage(sheet,x,y,cell,cell,0,0,size,size);
  if(pose==='hit'){
   ctx.resetTransform();
   ctx.globalCompositeOperation='source-atop';
   ctx.fillStyle='rgba(255,107,91,'+((1-t)*.29)+')';
   ctx.fillRect(0,0,size,size);
  }
  return canvas;
 }

 return {
  prepare,
  ready(level){return levelIds(level).every(id=>sheets.has(id))},
  clear(){frames.clear()},
  get(type,view,pose,frame){
   const sheet=sheets.get(type.id);
   if(!sheet)return null;
   const motion=pose==='run'?'walk':pose;
   const motionIndex=motionPoses.indexOf(motion);
   const key=type.id+':'+view+':'+motion+':'+(motionIndex>=0?Math.floor(frame/2):pose==='idle'?0:frame);
   const result=frames.get(key)??draw(sheet,view,pose,motionIndex,frame);
   frames.delete(key);
   frames.set(key,result);
   if(frames.size>192)frames.delete(frames.keys().next().value);
   return result;
  }
 };
})();
