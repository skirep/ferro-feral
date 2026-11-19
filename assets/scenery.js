const ferroScenery=(()=>{
 const skies=[
  ['island',.64,[46,80,98]],['neon',.57,[61,47,106]],
  ['relic',.42,[93,73,67]],['tissue',.36,[57,82,62]],['void',.65,[65,43,105]]
 ];
 const maps=new Map();
 const beams=new Map();
 const tau=Math.PI*2;
 let space=null, shipTiles=null, loadingShip=false;

 let fleet=null, beacon=null;

 function convoyView(seconds,stage,parallax){
  // Bearings use turns, so the formation stays continuous across panorama seams.
  return {bearing:.395+stage*.183+seconds*.009-parallax*.0017,
   top:.426+Math.sin(seconds*.20+stage)*.008,span:.115};
 }
 function convoyColumn(view,bearing){
  const offset=bearing-view.bearing;
  const local=(offset-Math.floor(offset+.5))/view.span+.5;
  return local>=0&&local<1?Math.floor(local*fleet.width):-1;
 }
 function convoyPixel(background,column,row){
  if(row<0||row>=fleet.height)return background;
  const fg=fleet.colors[row*fleet.width+column],alpha=fg>>>24;
  if(!alpha)return background;
  if(alpha===255)return fg;
  const inv=255-alpha;
  const r=((fg&255)*alpha+(background&255)*inv)/255;
  const g=((fg>>>8&255)*alpha+(background>>>8&255)*inv)/255;
  const b=((fg>>>16&255)*alpha+(background>>>16&255)*inv)/255;
  return (255<<24)|(b<<16)|(g<<8)|r;
 }
 function prepareSpace(ready){
  if(loadingShip)return;
  loadingShip=true;
  for(const [file,read] of [['./assets/skies/orbit.webp',loadOrbit],['./assets/textures/ship-deck.webp',loadDeck],
   ['./assets/convoy/escorta.png',(ctx,width,height)=>{
    fleet={width,height,colors:new Uint32Array(ctx.getImageData(0,0,width,height).data.buffer)};
   }],['./assets/convoy/balisa.png',ctx=>{beacon=ctx.canvas}]]){
   const image=new Image();
   image.onload=()=>{
    const canvas=document.createElement('canvas');
    canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    read(ctx,canvas.width,canvas.height);
    ready();
   };
   image.src=file;
  }
 }

 function loadOrbit(ctx,width,height){
  const {data}=ctx.getImageData(0,0,width,height);
  space={width,height,colors:new Uint32Array(data.buffer)};
 }

 function loadDeck(ctx,width,height){
  const size=256;
  if(width!==3*size||height!==2*size)return;
  shipTiles=Array.from({length:6},(_,i)=>{
   const {data}=ctx.getImageData(i%3*size,Math.floor(i/3)*size,size,size);
   const tile=new Uint32Array(data.buffer);
   for(let j=0;j<tile.length;j++){
    const color=tile[j],r=color&255,g=color>>>8&255,b=color>>>16&255;
    const emissive=i===4?Math.max(0,r-b-55):i===5?Math.max(0,Math.min(g,b)-r-45):0;
    tile[j]=(color&0xffffff)|(Math.min(emissive,95)<<24);
   }
   return tile;
  });
 }

 function load(theme,ready){
  if(maps.has(theme))return;
  maps.set(theme,null);
  const [file]=skies[theme];
  const image=new Image();
  image.onload=()=>{
   const canvas=document.createElement('canvas');
   canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(image,0,0);
   const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);
   // Blend a narrow strip to the same edge color for a continuous turn.
   const seam=Math.round(canvas.width*.024);
   for(let y=0;y<canvas.height;y++){
    const row=y*canvas.width*4,end=row+(canvas.width-1)*4;
    for(let channel=0;channel<3;channel++){
     const midpoint=(data[row+channel]+data[end+channel])/2;
     for(let i=0;i<seam;i++){
      const fade=(1-i/seam)**2;
      const left=row+i*4+channel,right=end-i*4+channel;
      data[left]=data[left]*(1-fade)+midpoint*fade;
      data[right]=data[right]*(1-fade)+midpoint*fade;
     }
    }
   }
   maps.set(theme,{width:canvas.width,height:canvas.height,pixels:new Uint32Array(data.buffer)});
   ready();
  };
  image.src='./assets/skies/'+file+'.webp';
 }

 function sky(pixels,width,height,horizon,angle,plane,theme){
  const map=maps.get(theme);
  if(!map)return;
  const [,offset]=skies[theme];
  const columns=new Int32Array(width);
  const rotation=(angle%tau)/tau;
  for(let x=0;x<width;x++){
   const direction=offset+rotation+Math.atan((2*x/width-1)*plane)/tau;
   columns[x]=Math.floor((direction-Math.floor(direction))*map.width);
  }
  for(let y=0;y<height;y++){
   const normalized=Math.min(.998,.81+(y-horizon)*1.33/height);
   const row=Math.floor(normalized*map.height)*map.width;
   for(let x=0;x<width;x++)pixels[y*width+x]=map.pixels[row+columns[x]];
  }
 }

 function beam(room,color){
  if(beams.has(room))return beams.get(room);
  const canvas=document.createElement('canvas');
  const size=128;
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const tint=alpha=>'rgba('+color.join(',')+','+alpha+')';
  const fade=ctx.createLinearGradient(0,0,0,size);
  fade.addColorStop(0,tint(.03));fade.addColorStop(.12,tint(.36));
  fade.addColorStop(.61,tint(.17));fade.addColorStop(1,tint(.01));
  for(const [top,bottom,opacity] of [[4,48,.24],[2,30,.31],[1,13,.45]]){
   ctx.globalAlpha=opacity;
   ctx.fillStyle=fade;
   ctx.beginPath();ctx.moveTo(64-top,4);ctx.lineTo(64+top,4);
   ctx.lineTo(64+bottom,124);ctx.lineTo(64-bottom,124);ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;
  const bloom=ctx.createRadialGradient(64,14,0,64,14,16);
  bloom.addColorStop(0,'#eaffffbd');bloom.addColorStop(.25,tint(.58));bloom.addColorStop(1,tint(0));
  ctx.fillStyle=bloom;ctx.fillRect(48,0,32,30);
  beams.set(room,canvas);
  return canvas;
 }

 function weather(ctx,width,height,depth,time,heading,theme){
  if(theme===2||theme===3)return;
  const color=theme===4?'#bf9df6':theme===1?'#9bceff':'#a0cfdd';
  const drift=theme===4?14:-35;
  ctx.strokeStyle=color;
  for(let i=0;i<3;i++){
   ctx.globalAlpha=.12+i*.055;
   ctx.beginPath();
   const rate=.64+i*.59;
   for(let j=0;j<24;j++){
    const seed=j+i*24;
    const phase=(seed*.6180339+time*rate)%1;
    const start=seed*.42783-heading*.12+phase*drift/width;
    const x=(start-Math.floor(start))*width, y=phase*height;
    if(depth[Math.floor(y)*width+Math.floor(x)]<.55+i*.8)continue;
    const length=(3+i*4)*(theme===4?.36:1);
    ctx.moveTo(x,y);ctx.lineTo(x+drift*.08,y+length);
   }
   ctx.stroke();
  }
  ctx.globalAlpha=1;
 }

 const haze=theme=>skies[theme][2];
 return {convoyView,convoyColumn,convoyPixel,fleet:()=>fleet,beacon:()=>beacon,load,sky,weather,haze,beam,prepareSpace,space:()=>space,shipTiles:()=>shipTiles};
})();
