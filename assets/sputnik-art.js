const ferroSputnikArt=(()=>{
 let pending, sprites, wildlife, materials, panorama;
 const cell=160,animalCell=96;

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
  pending??=Promise.all([load('foliage.webp'),load('terrain.webp'),load('coast.webp'),load('wildlife.webp')]).then(([flora,ground,sky,animals])=>{
   if(flora.naturalWidth!==8*cell||flora.naturalHeight!==5*cell||
    ground.naturalWidth!==256||ground.naturalHeight!==256||
    animals.naturalWidth!==8*animalCell||animals.naturalHeight!==16*animalCell)throw new Error('Invalid Sputnik atlas dimensions');
   const sample=pixels(ground);
   materials=Array.from({length:4},(_,tile)=>Uint32Array.from({length:128*128},(_,i)=>
    sample[((tile>>1)*128+(i>>7))*256+(tile%2)*128+(i&127)]&0xffffff
   ));
   panorama={width:sky.naturalWidth,height:sky.naturalHeight,pixels:pixels(sky)};
   wildlife=animals;
   sprites=flora;
  }).catch(error=>{pending=null;throw error});
  return pending;
 }

 function frame(plant,bearing){
  if(!sprites)return null;
  plant.view=ferroEnemySprites.viewFor(plant.yaw,bearing,plant.view);
  return {art:sprites,frameX:plant.view*cell,frameY:plant.kind*cell,frameSize:cell};
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

 return {prepare,ready:()=>!!sprites,frame,animalFrame,sky,materials:()=>materials};
})();
