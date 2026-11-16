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
 const foot=177;

 function canvas(width,height=width){
  const image=document.createElement('canvas');
  image.width=width;
  image.height=height;
  return image;
 }

 function load(theme){
  if(worlds.has(theme))return worlds.get(theme);
  const [file,rects]=atlases[theme];
  const atlas=new Image();
  const task=new Promise((resolve,reject)=>{
   atlas.onload=()=>{
    try{
     const sprites=rects.map(([x,y,w,h])=>{
      if(x+w>atlas.naturalWidth||y+h>atlas.naturalHeight)throw new Error('Invalid enemy atlas dimensions');
      return {image:atlas,x,y,w,h};
     });
     resolve(sprites);
    }catch(error){reject(error)}
   };
   atlas.onerror=()=>reject(new Error('Cannot load enemy atlas '+file));
   atlas.src='./assets/enemies/'+file;
  });
  worlds.set(theme,task);
  task.catch(()=>{if(worlds.get(theme)===task)worlds.delete(theme)});
  return task;
 }

 function draw(source,type,view,pose,frame){
  const image=canvas(size),ctx=image.getContext('2d');
  const t=frame/11, arc=Math.sin(Math.PI*t), phase=frame*Math.PI/6;
  const stride=pose==='run'?1:pose==='walk'?.62:0;
  const jump=pose==='jump'?arc:0, shot=pose==='shoot'?arc:0, hit=pose==='hit'?arc:0;
  const fall=pose==='death'?Math.sin(t*Math.PI/2):0;
  const aerial=['wraith','winged','pillar'].includes(type.body);
  const height=Math.min(151,150*source.h/source.w);
  const width=height*source.w/source.h;
  const turn=[1,.93,.80,.91,.96,.91,.80,.93][view];
  const bob=(aerial?Math.sin(phase)*4:Math.abs(Math.sin(phase))*stride*4)+jump*9;
  ctx.imageSmoothingEnabled=false;
  ctx.translate(size/2,foot-bob);
  ctx.scale(view>4?-turn:turn,1);
  if(fall){
   // Rotate around the inner edge of the body, then settle the silhouette at floor level.
   const side=type.slot%2?1:-1;
   ctx.translate(side*(28*fall),0);
   ctx.rotate(-side*fall*1.47);
   ctx.scale(1-.15*fall,1-.58*fall);
  }else{
   ctx.transform(1,0,Math.sin(phase)*stride*.055+shot*.15-hit*.12,1,0,0);
   ctx.scale(1+shot*.035+hit*.06,1-jump*.07+shot*.04-hit*.10+Math.sin(phase)*.012);
  }
  if(stride&&!fall&&!aerial){
   const split=Math.round(source.h*.68), lower=source.h-split;
   const hipY=-height*lower/source.h;
   const step=Math.sin(phase)*stride*width*.10;
   ctx.drawImage(source.image,source.x,source.y,source.w,split,-width/2,-height,width,height+hipY+.6);
   const left=Math.floor(source.w/2);
   for(const side of [-1,1]){
    const start=side<0?0:left,end=side<0?left:source.w;
    const legX=-width/2+start*width/source.w,legW=(end-start)*width/source.w;
    ctx.save();
    ctx.translate(0,hipY);
    ctx.transform(1,0,step*side/-hipY,1,0,0);
    ctx.drawImage(source.image,source.x+start,source.y+split,end-start,lower,legX,0,legW,-hipY);
    ctx.restore();
   }
  }else{
   ctx.drawImage(source.image,source.x,source.y,source.w,source.h,-width/2,-height,width,height);
  }
  ctx.resetTransform();
  if(view===3||view===4||view===5||hit){
   ctx.globalCompositeOperation='source-atop';
   ctx.fillStyle=hit?'rgba(255,107,91,'+(hit*.26)+')':view===4?'#09132145':'#09132125';
   ctx.fillRect(0,0,size,size);
  }
  return image;
 }

 const loaded=new Map();
 return {
  prepare(theme){
   return load(theme).then(sprites=>{loaded.set(theme,sprites)});
  },
  ready(theme){return loaded.has(theme)},
  clear(){frames.clear()},
  get(type,view,pose,frame){
   const source=loaded.get(type.theme)?.[type.slot];
   if(!source)return null;
   const key=type.id+':'+view+':'+pose+':'+frame;
   const image=frames.get(key)??draw(source,type,view,pose,frame);
   frames.delete(key);
   frames.set(key,image);
   if(frames.size>192)frames.delete(frames.keys().next().value);
   return image;
  }
 };
})();
