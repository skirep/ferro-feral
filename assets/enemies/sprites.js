// Source atlases use five columns and four rows in catalog order.
const ferroEnemySprites = (() => {
 const size=192, frames=new Map(), worlds=new Map();
 const atlases=[
  ['illa-maleida-sprites.png',[
   [6,35,180,149],[198,47,180,137],[420,4,120,180],[607,4,130,180],[793,4,142,180],
   [7,196,178,180],[199,196,178,180],[406,196,147,180],[605,196,133,180],[774,215,180,161],
   [6,433,180,135],[211,388,153,180],[401,388,157,180],[590,388,164,180],[783,388,161,180],
   [11,580,170,180],[212,580,151,180],[395,580,169,180],[593,580,157,180],[777,580,174,180]
  ]],
  ['neon-apocalypse-sprites.png',[
   [6,70,180,114],[198,50,180,134],[417,4,126,180],[609,4,126,180],[804,4,120,180],
   [6,223,180,153],[198,252,180,124],[423,196,113,180],[599,196,146,180],[774,213,180,163],
   [19,388,154,180],[237,388,101,180],[390,391,180,177],[582,428,180,140],[815,388,98,180],
   [6,587,180,173],[211,580,153,180],[404,580,152,180],[582,580,179,180],[774,583,180,177]
  ]],
  ['regne-oblidats-sprites.png',[
   [6,32,180,152],[198,48,180,136],[403,4,154,180],[603,4,137,180],[801,4,125,180],
   [11,196,170,180],[198,227,180,149],[410,196,140,180],[608,196,128,180],[775,196,177,180],
   [10,388,172,180],[207,388,162,180],[390,394,180,174],[582,398,180,170],[777,388,174,180],
   [14,580,163,180],[210,580,155,180],[397,580,166,180],[583,580,177,180],[776,580,175,180]
  ]],
  ['biohazard-zero-sprites.png',[
   [6,51,180,133],[198,26,180,158],[421,4,118,180],[610,4,123,180],[793,4,141,180],
   [21,196,150,180],[198,250,180,126],[421,196,118,180],[611,196,121,180],[774,199,180,177],
   [6,408,180,160],[214,388,147,180],[390,388,180,180],[582,421,180,147],[794,388,139,180],
   [24,580,144,180],[206,580,164,180],[394,580,172,180],[586,580,171,180],[776,580,176,180]
  ]],
  ['the-abyss-sprites.png',[
   [6,21,180,163],[198,35,180,149],[408,4,144,180],[601,4,142,180],[801,4,126,180],
   [6,202,180,174],[198,216,180,160],[398,196,163,180],[586,196,171,180],[774,229,180,147],
   [16,388,159,180],[229,388,117,180],[421,388,118,180],[582,397,180,171],[792,388,144,180],
   [6,581,180,179],[204,580,168,180],[390,581,180,179],[586,580,171,180],[774,585,180,175]
  ]]
 ];
 const foot=177, motionFrames=6, motionColumns=12;
 const motionPoses=['walk','jump','shoot'];
 const directionalCell=80, directionalFrames=12, views=8;
 const bodyHeight=140, sideMargin=7, topMargin=5, sampleStep=3;
 const directionWidths=[1,.93,.80,.91,.96,.91,.80,.93];

 function canvas(width,height=width){
  const image=document.createElement('canvas');
  image.width=width;
  image.height=height;
  return image;
 }

 function image(file){
  return new Promise((resolve,reject)=>{
   const atlas=new Image();
   atlas.onload=()=>resolve(atlas);
   atlas.onerror=()=>reject(new Error('Cannot load enemy atlas '+file));
   atlas.src='./assets/enemies/'+file;
  });
 }

 function readAlpha(atlas,step=1){
  const copy=canvas(atlas.naturalWidth/step,atlas.naturalHeight/step);
  const ctx=copy.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(atlas,0,0,copy.width,copy.height);
  const alpha=ctx.getImageData(0,0,copy.width,copy.height);
  copy.width=copy.height=0;
  return alpha;
 }

 function bounds(bitmap,x,y,w,h){
  let left=w,right=0,top=h,bottom=0;
  for(let row=0;row<h;row++){
   let alpha=((y+row)*bitmap.width+x)*4+3;
   for(let col=0;col<w;col++,alpha+=4){
    if(bitmap.data[alpha]<72)continue;
    left=Math.min(left,col);right=Math.max(right,col+1);
    top=Math.min(top,row);bottom=Math.max(bottom,row+1);
   }
  }
  return right>left&&bottom>top?{left,right,top,bottom}:null;
 }

 function scaleMotion(walk,poses,source){
  const heights=walk.map(box=>box.bottom-box.top).sort((a,b)=>a-b);
  const mid=Math.floor(heights.length/2);
  const height=heights.length?(heights[mid]+heights[Math.floor((heights.length-1)/2)])/2:bodyHeight;
  const ground=walk.length?Math.max(...walk.map(box=>box.bottom)):foot;
  const center=size/2;
  const left=Math.min(center,...poses.map(box=>box.left));
  const right=Math.max(center,...poses.map(box=>box.right));
  const top=Math.min(ground,...poses.map(box=>box.top));
  const bottom=Math.max(ground,...poses.map(box=>box.bottom));
  const scale=Math.min(1.75,bodyHeight/height,
   (size-2*sideMargin)*source.h/source.w/height,
   (center-sideMargin)/Math.max(1,center-left,right-center),
   (foot-topMargin)/Math.max(1,ground-top),
   (size-foot-2)/Math.max(1,bottom-ground));
  return {ground,scale,height:height*scale};
 }

 function motionGeometry(sheets,sprites){
  const cell=size/sampleStep;
  const boundsByPose=sheets.map(sheet=>{
   const alpha=readAlpha(sheet,sampleStep);
   return sprites.map((_,slot)=>Array.from({length:motionFrames},(_,frame)=>{
    const index=slot*motionFrames+frame;
    const box=bounds(alpha,index%motionColumns*cell,Math.floor(index/motionColumns)*cell,cell,cell);
    return box&&{left:box.left*sampleStep,right:box.right*sampleStep,top:box.top*sampleStep,bottom:box.bottom*sampleStep};
   }).filter(Boolean));
  });
  return sprites.map((source,slot)=>scaleMotion(boundsByPose[0][slot],boundsByPose.flatMap(pose=>pose[slot]),source));
 }

 // Keep only the active and most recently loaded campaign world decoded.
 function prepare(theme){
  if(loaded.has(theme)){
   const entry=loaded.get(theme);
   loaded.delete(theme);
   loaded.set(theme,entry);
   return Promise.resolve();
  }
  if(worlds.has(theme))return worlds.get(theme);
  const [file,rects]=atlases[theme], prefix=file.replace('-sprites.png','');
  const directionalTypes=typesByWorld[theme].filter(type=>type.atlas);
  const task=Promise.all([
   image(file),
   Promise.all(motionPoses.map(pose=>image(prefix+'-'+pose+'.png'))),
   Promise.all(directionalTypes.map(async type=>{
    const sheet=await image('360/'+type.atlas+'.webp');
    if(sheet.naturalWidth!==directionalCell*directionalFrames||
       sheet.naturalHeight!==directionalCell*views*motionPoses.length){
     throw new Error('Invalid directional enemy atlas: '+type.atlas);
    }
    return [type.slot,sheet];
   }))
  ]).then(([base,sheets,directional])=>{
   const baseAlpha=readAlpha(base);
   const sprites=rects.map(([x,y,w,h])=>{
    if(x+w>base.naturalWidth||y+h>base.naturalHeight)throw new Error('Invalid enemy atlas dimensions');
    const box=bounds(baseAlpha,x,y,w,h);
    return box?{image:base,x:x+box.left,y:y+box.top,w:box.right-box.left,h:box.bottom-box.top}
     :{image:base,x,y,w,h};
   });
   for(const sheet of sheets){
    if(sheet.naturalWidth!==motionColumns*size||sheet.naturalHeight!==10*size)throw new Error('Invalid motion atlas dimensions');
   }
   loaded.set(theme,{sprites,sheets,geometry:motionGeometry(sheets,sprites),directional:new Map(directional)});
   trimWorlds();
  }).finally(()=>worlds.delete(theme));
  worlds.set(theme,task);
  return task;
 }

 function motionFrame(sheet,type,view,frame,geometry){
  const image=canvas(size),ctx=image.getContext('2d');
  const index=type.slot*motionFrames+Math.floor(frame*motionFrames/12);
  const x=(index%motionColumns)*size,y=Math.floor(index/motionColumns)*size;
  const turn=directionWidths[view];
  ctx.translate(size/2,foot);
  const {scale,ground}=geometry;
  ctx.scale((view>4?-turn:turn)*scale,scale);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet,x,y,size,size,-size/2,-ground,size,size);
  ctx.resetTransform();
  shade(ctx,view,0);
  return image;
 }

 // Each row is one movement and viewing angle. Columns are consecutive frames.
 function directionalFrame(sheet,view,motion,pose,frame){
  const image=canvas(size),ctx=image.getContext('2d');
  const poseIndex=motionPoses.indexOf(motion);
  const column=poseIndex<0?0:frame;
  const row=(poseIndex<0?motionPoses.indexOf('shoot'):poseIndex)*views+view;
  ctx.imageSmoothingEnabled=false;
  ctx.translate(size/2,foot);
  if(pose==='death'){
   const fall=Math.sin(frame/11*Math.PI/2);
   ctx.translate(-fall*28,0);
   ctx.rotate(fall*1.47);
   ctx.scale(1-.15*fall,1-.58*fall);
  }
  ctx.drawImage(sheet,column*directionalCell,row*directionalCell,directionalCell,directionalCell,
   -size/2,-size*73/directionalCell,size,size);
  ctx.resetTransform();
  if(pose==='hit')shade(ctx,view,Math.sin(Math.PI*frame/11));
  return image;
 }

 function shade(ctx,view,hit){
  if(view!==3&&view!==4&&view!==5&&!hit)return;
  ctx.globalCompositeOperation='source-atop';
  ctx.fillStyle=hit?'rgba(255,107,91,'+(hit*.26)+')':view===4?'#09132145':'#09132125';
  ctx.fillRect(0,0,size,size);
 }

 function draw(source,type,view,pose,frame,geometry){
  const image=canvas(size),ctx=image.getContext('2d');
  const t=frame/11,phase=frame*Math.PI/6;
  const hit=pose==='hit'?Math.sin(Math.PI*t):0;
  const fall=pose==='death'?Math.sin(t*Math.PI/2):0;
  const aerial=['wraith','winged','pillar'].includes(type.body);
  const height=geometry.height,width=height*source.w/source.h;
  const turn=directionWidths[view],bob=aerial&&!fall?Math.sin(phase)*4:0;
  ctx.imageSmoothingEnabled=false;
  ctx.translate(size/2,foot-bob);
  ctx.scale(view>4?-turn:turn,1);
  if(fall){
   const side=type.slot%2?1:-1;
   ctx.translate(side*28*fall,0);
   ctx.rotate(-side*fall*1.47);
   ctx.scale(1-.15*fall,1-.58*fall);
  }else{
   ctx.transform(1,0,-hit*.12,1,0,0);
   ctx.scale(1+hit*.06,1-hit*.10+Math.sin(phase)*.012);
  }
  ctx.drawImage(source.image,source.x,source.y,source.w,source.h,-width/2,-height,width,height);
  ctx.resetTransform();
  shade(ctx,view,hit);
  return image;
 }

 let keepAllWorlds=false;
 const loaded=new Map();
 function trimWorlds(){
  while(!keepAllWorlds&&loaded.size>2)loaded.delete(loaded.keys().next().value);
 }
 return {
  prepare,
  retainWorlds(value){keepAllWorlds=value;trimWorlds()},
  ready(theme){return loaded.has(theme)},
  clear(){frames.clear()},
  get(type,view,pose,frame){
   const entry=loaded.get(type.theme);
   if(!entry)return null;
   const motion=pose==='run'?'walk':pose;
   const directional=entry.directional.get(type.slot);
   const sheet=entry.sheets[motionPoses.indexOf(motion)];
   const cachedFrame=directional?(pose==='idle'?0:frame):sheet?Math.floor(frame/2):frame;
   const key=type.id+':'+view+':'+(sheet?motion:pose)+':'+cachedFrame;
   const geometry=entry.geometry[type.slot];
   let image=frames.get(key);
   if(!image){
    if(directional)image=directionalFrame(directional,view,motion,pose,cachedFrame);
    else if(sheet)image=motionFrame(sheet,type,view,frame,geometry);
    else image=draw(entry.sprites[type.slot],type,view,pose,frame,geometry);
   }
   frames.delete(key);
   frames.set(key,image);
   if(frames.size>192)frames.delete(frames.keys().next().value);
   return image;
  }
 };
})();
