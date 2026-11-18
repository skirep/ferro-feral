// Atlas columns, left to right: 3 wall variants, floor, ceiling.
const textureTileSize=128;
const wallTileSize=256;
const wallTextures=Array(ferroWallAtlases.length).fill(null);
const surfaceTextures=ferroSurfaces.map(({wall,floor,ceiling})=>
 [wall,wall,wall,floor,ceiling].map(color=>Array(textureTileSize**2).fill(color))
);
function loadSurfaceTextures(){
 for(const [material,path] of ferroWallAtlases.entries()){
  const image=new Image();
  image.onload=()=>{
   if(image.naturalWidth!==wallTileSize*3||image.naturalHeight!==wallTileSize)return;
   const canvas=document.createElement('canvas');
   canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   try{
    const brush=canvas.getContext('2d',{willReadFrequently:true});
    brush.drawImage(image,0,0);
    wallTextures[material]=Array.from({length:3},(_,variant)=>{
     const rgba=brush.getImageData(variant*wallTileSize,0,wallTileSize,wallTileSize).data;
     return Uint32Array.from({length:wallTileSize**2},(_,pixel)=>{
      const offset=pixel*4, r=rgba[offset], g=rgba[offset+1], b=rgba[offset+2];
      const glow=material===1?Math.max(0,Math.min(g,b)-r-45):material===5?Math.max(0,r-g-64):0;
      return r|(g<<8)|(b<<16)|(Math.min(glow,120)<<24);
     });
    });
    redraw=true;
   }catch(error){console.warn('Could not read wall atlas:',path,error)}
  };
  image.onerror=()=>console.warn('Could not load wall atlas:',path);
  image.src=path;
 }
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
