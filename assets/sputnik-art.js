const ferroSputnikArt=(()=>{
 let pending, sprites, undergrowth, wildlife, materials, panorama;
 const cell=160,leafCell=288,animalCell=96,materialSize=512;

 function load(path){
  return new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(new Error('Cannot load '+path));
   image.src='./assets/sputnik/'+path;
  });
 }

 function pixels(image){
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;
  canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(image,0,0);
  return new Uint32Array(ctx.getImageData(0,0,canvas.width,canvas.height).data.buffer);
 }

 function prepare(){
  pending??=Promise.all([load('foliage.webp'),load('terrain-hd.webp'),load('coast.webp'),load('wildlife.webp'),load('undergrowth.webp')]).then(([flora,ground,sky,animals,leaves])=>{
   if(flora.naturalWidth!==8*cell||flora.naturalHeight!==5*cell||
    leaves.naturalWidth!==8*leafCell||leaves.naturalHeight!==2*leafCell||
    ground.naturalWidth!==materialSize*2||ground.naturalHeight!==materialSize*2||
    animals.naturalWidth!==8*animalCell||animals.naturalHeight!==16*animalCell)throw new Error('Invalid Sputnik atlas dimensions');
   const sample=pixels(ground);
   materials=Array.from({length:4},(_,tile)=>{
    const levels=[Uint32Array.from({length:materialSize*materialSize},(_,i)=>{
     const x=(tile%2)*materialSize+i%materialSize,y=(tile>>1)*materialSize+Math.floor(i/materialSize);
     return sample[y*materialSize*2+x]&0xffffff;
    })];
    for(let size=materialSize/2;size>=64;size/=2){
     const prior=levels.at(-1);
     levels.push(Uint32Array.from({length:size*size},(_,i)=>{
      const at=Math.floor(i/size)*size*4+(i%size)*2;
      const a=prior[at],b=prior[at+1],c=prior[at+size*2],d=prior[at+size*2+1];
      const red=((a&255)+(b&255)+(c&255)+(d&255))>>2;
      const green=((a>>8&255)+(b>>8&255)+(c>>8&255)+(d>>8&255))>>2;
      const blue=((a>>16)+(b>>16)+(c>>16)+(d>>16))>>2;
      return red|(green<<8)|(blue<<16);
     }));
    }
    return levels;
   });
   panorama={width:sky.naturalWidth,height:sky.naturalHeight,pixels:pixels(sky)};
   wildlife=animals;
   undergrowth=leaves;
   sprites=flora;
  }).catch(error=>{pending=null;throw error});
  return pending;
 }

 function frame(plant,bearing){
  if(!sprites)return null;
  plant.view=ferroEnemySprites.viewFor(plant.yaw,bearing,plant.view);
  if(plant.kind>=5)return {art:undergrowth,frameX:plant.view*leafCell,frameY:(plant.kind-5)*leafCell,frameSize:leafCell};
  return {art:sprites,frameX:plant.view*cell,frameY:plant.kind*cell,frameSize:cell};
 }

 function shrubOpacity(kind,distance){
  if(kind!==2&&kind!==5&&kind!==6)return 1;
  const t=Math.max(0,Math.min(1,(distance-.45)/1.95));
  return .27+.61*t*t*(3-2*t);
 }

 function animalFrame(animal,bearing){
  if(!wildlife)return null;
  animal.view=ferroEnemySprites.viewFor(animal.facing,bearing,animal.view);
  const view=(8-animal.view)%8;
  return {art:wildlife,frameX:view*animalCell,
   frameY:(animal.kind*4+animal.frame)*animalCell,frameSize:animalCell};
 }

 function sky(buffer,width,height,horizon,plane,heading){
  if(!panorama)return;
  const {width:sw,height:sh,pixels}=panorama;
  const columns=Uint16Array.from({length:width},(_,x)=>{
   const u=(heading+Math.atan((2*x/width-1)*plane))/(2*Math.PI);
   return Math.floor((u-Math.floor(u))*sw);
  });
  const vertical=.73/height;
  for(let y=0;y<height;y++){
   const row=Math.min(sh-1,Math.max(0,Math.floor((.75+(y-horizon)*vertical)*sh)))*sw;
   for(let x=0;x<width;x++)buffer[y*width+x]=pixels[row+columns[x]];
  }
 }

 return {prepare,ready:()=>!!sprites,frame,shrubOpacity,animalFrame,sky,materialSize,materials:()=>materials};
})();
