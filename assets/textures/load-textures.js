// Atlas columns, left to right: 3 wall variants, floor, ceiling.
const textureTileSize=128;
const surfaceTextures=ferroSurfaces.map(({wall,floor,ceiling})=>
 [wall,wall,wall,floor,ceiling].map(color=>Array(textureTileSize**2).fill(color))
);
function loadSurfaceTextures(){
 for(const [world,surface] of ferroSurfaces.entries()){
  const image=new Image();
  image.onload=()=>{
   const size=textureTileSize;
   if(image.naturalWidth!==5*size||image.naturalHeight!==size){
    console.warn('Invalid texture atlas dimensions:',surface.atlas);
    return;
   }
   const canvas=document.createElement('canvas');
   canvas.width=image.naturalWidth;
   canvas.height=image.naturalHeight;
   const brush=canvas.getContext('2d',{willReadFrequently:true});
   brush.drawImage(image,0,0);
   try{
    const tiles=surfaceTextures[world].map((_,index)=>{
     const pixels=brush.getImageData(index*size,0,size,size).data;
     return Array.from({length:size**2},(_,pixel)=>{
      const offset=pixel*4;
      return [pixels[offset],pixels[offset+1],pixels[offset+2]];
     });
    });
    surfaceTextures[world]=tiles;
    redraw=true;
   }catch(error){console.warn('Could not read texture atlas:',surface.atlas,error)}
  };
  image.onerror=()=>console.warn('Could not load texture atlas:',surface.atlas);
  image.src=surface.atlas;
 }
}
