// Procedural wall textures and RGB surface colors, in campaign order.
const ferroSurfaces = [
 {
  material: "timber",
  wall: [114, 83, 53],
  floor: [71, 65, 42],
  ceiling: [46, 40, 59],
  accent: [255, 174, 77],
  sky: [25, 37, 72],
  glow: [255, 169, 75],
  spark: "#ffd28e"
 },
 {
  material: "circuit",
  wall: [35, 55, 91],
  floor: [24, 44, 71],
  ceiling: [18, 25, 56],
  accent: [70, 243, 255],
  sky: [27, 22, 69],
  glow: [69, 224, 255],
  spark: "#72eaff"
 },
 {
  material: "masonry",
  wall: [105, 113, 102],
  floor: [55, 65, 49],
  ceiling: [43, 48, 54],
  accent: [246, 203, 115],
  sky: [52, 46, 63],
  glow: [245, 189, 99],
  spark: "#ffe3ad"
 },
 {
  material: "membrane",
  wall: [74, 111, 49],
  floor: [35, 65, 34],
  ceiling: [26, 46, 36],
  accent: [179, 253, 89],
  sky: [24, 51, 39],
  glow: [166, 247, 88],
  spark: "#c6ff89"
 },
 {
  material: "crystal",
  wall: [112, 53, 137],
  floor: [53, 31, 91],
  ceiling: [42, 21, 68],
  accent: [255, 93, 193],
  sky: [66, 20, 92],
  glow: [237, 82, 255],
  spark: "#ff9de7"
 }
];

const wallMaterials=ferroSurfaces.map(({wall,floor,accent,ceiling})=>[wall,floor,accent,ceiling]);
function materialPixel(type,u,v,style){
 const grain=((u*13^v*61^(u*v))&31)/255;
 switch(type){
  case 'timber': {
   const plank=(u+style*4)&31;
   const knot=Math.hypot(plank-14,(v&63)-30);
   return [plank<2?3:0,.82+grain+Math.sin(u*.8+Math.sin(v*.12)*2+knot*.24)*.12];
  }
  case 'circuit': {
   const lane=(u+style*17)&31, strip=(v+style*9)&31;
   const trace=(lane===5&&strip<24)||(strip===23&&lane<21);
   return [trace?2:lane<2||strip<2?3:0,trace?.78:.76+grain];
  }
  case 'masonry': {
   const row=v&15,col=(u+((v>>4)&1)*16)&31;
   return [row<2||col<2?3:0,.72+grain+((u>>5^v>>4)&3)*.08];
  }
  case 'membrane': {
   const vein=Math.sin(u*.13+Math.sin(v*.17)*2.8+style);
   const nodes=Math.cos(v*.20-u*.13);
   return [vein>.88?2:nodes<-.5?1:0,.57+grain+Math.abs(vein)*.30];
  }
  default: {
   const shard=(u+v*2+style*19)&31,cut=(u*2-v)&63;
   return [shard<2?2:cut<20?3:0,.65+grain+(shard>>3)*.13];
  }
 }
}
const wallTextures=wallMaterials.map((colors,index)=>Array.from({length:3},(_,style)=>
 Array.from({length:128*128},(_,pixel)=>{
  const [ink,light]=materialPixel(ferroSurfaces[index].material,pixel&127,pixel>>7,style);
  return colors[ink].map(channel=>Math.min(255,Math.round(channel*light)));
 })
));
