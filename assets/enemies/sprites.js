// Rasterize animated, layered enemy models only when visible.
const ferroEnemySprites = (() => {
 const size=192, capacity=256, cache=new Map();
 const plans={
  // half-width, trunk height, depth, center height, leg pairs
  hound:[17,10,23,43,2], crawler:[29,9,19,34,3], tall:[14,24,12,77,1],
  wraith:[16,23,12,72,0], bulwark:[28,22,17,66,1], walker:[20,19,14,67,1],
  winged:[15,16,15,69,0], worm:[13,14,20,44,0], pillar:[23,30,18,70,0]
 };
 const shades=new Map();
 function tint(hex,k){
  const key=hex+k;
  if(shades.has(key))return shades.get(key);
  const channels=[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*k)));
  const color='rgb('+channels.join(',')+')';
  shades.set(key,color);
  return color;
 }
 function draw(type,view,pose,frame){
  const image=document.createElement('canvas');
  image.width=image.height=size;
  const ink=image.getContext('2d');
  const {shell,light,dark,glow,finish}=type.world;
  const [width,height,depth,bodyY,legs]=plans[type.body];
  const t=frame/11, cycle=Math.sin(frame*Math.PI/6);
  const moving=pose==='run'||pose==='walk';
  const walk=moving?(pose==='run'?13:8):0;
  const lift=pose==='jump'?Math.sin(Math.PI*t):0;
  const fire=pose==='shoot'?Math.sin(Math.PI*t):0;
  const recoil=pose==='hit'?Math.sin(Math.PI*t)*11:0;
  const death=pose==='death'?Math.sin(t*Math.PI/2):0;
  const hover=legs===0&&type.body!=='worm'?Math.sin(type.slot+t*Math.PI*2)*3:0;
  const bob=(moving?Math.abs(cycle)*3:Math.sin(t*Math.PI*2)*1.7)+hover;
  const yaw=view*Math.PI/4, c=Math.cos(yaw),s=Math.sin(yaw);
  const fall=death*(type.slot%2?1:-1)*1.34, fc=Math.cos(fall),fs=Math.sin(fall);
  const liftFeet=legs===0?8:0;
  const faces=[];
  function project([x,y,z]){
   const px=x*c-z*s, pz=x*s+z*c;
   const drop=death*Math.max(0,Math.abs(px)*.72);
   const py=Math.max(0,y*fc-px*fs-drop);
   return [96+(px*fc+y*fs)*(1-death*.35)+recoil,174-py-pz*.22,pz+py*.40];
  }
  function poly(vertices,color,shade){
   const points=vertices.map(project);
   const [a,b,c]=points;
   if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>=0)return;
   faces.push({points,depth:points.reduce((sum,p)=>sum+p[2],0)/points.length,color:tint(color,shade)});
  }
  function slab(x,y,z,w,h,d,color,bevel=.25){
   const edge=Math.min(w,d)*bevel;
   const ring=[[-w+edge,-d],[w-edge,-d],[w,-d+edge],[w,d-edge],[w-edge,d],[-w+edge,d],[-w,d-edge],[-w,-d+edge]];
   const base=ring.map(([a,b])=>[x+a,y-h,z+b]);
   const top=ring.map(([a,b])=>[x+a*.95,y+h,z+b*.95]);
   poly(top,color,1.32);
   for(let i=0;i<8;i++){
    const next=(i+1)%8;
    poly([base[i],top[i],top[next],base[next]],color,[.52,.60,.76,.85,1.02,.92,.76,.56][i]);
   }
  }
  function spike(x,y,z,w,h,d,color,dx=0,dz=0){
   const a=[x-w,y,z-d],b=[x+w,y,z-d],c=[x+w,y,z+d],e=[x-w,y,z+d],tip=[x+dx,y+h,z+dz];
   poly([a,tip,b],color,.61);poly([b,tip,c],color,.83);
   poly([c,tip,e],color,1.10);poly([e,tip,a],color,.91);
  }
  function pipe(x0,y0,z0,x1,y1,z1,r,color){
   const steps=Math.ceil(Math.hypot(x1-x0,y1-y0,z1-z0)/(r*1.45));
   for(let i=0;i<=steps;i++){
    const f=i/Math.max(1,steps);
    slab(x0+(x1-x0)*f,y0+(y1-y0)*f,z0+(z1-z0)*f,r,r,r,color,.39);
   }
  }
  const y=bodyY+bob, low=type.body==='hound'||type.body==='crawler'||type.body==='worm';
  const m=type.slot, asym=(m%3-1)*2;
  const headY=y+(low?13:height+14), headZ=low?depth+1:7;
  const crown=type.crest;
  const boss=m>=15;
  const skull=low?13:type.body==='pillar'?18:11+m%4;
  slab(0,y-11,-1,width*.72,height*.77,depth*.84,dark);
  slab(0,y,0,width,height,depth,shell,.42);
  slab(0,y+height*.60,1,width*.86,height*.35,depth+2,light,.55);
  for(const side of [-1,1]){
   for(let row=0;row<4;row++){
    const ribY=y-height*.75+row*height*.48;
    slab(side*(width*.73+row%2*2),ribY,depth*.77,5,1.4,5,row===m%4?glow:dark);
   }
   slab(side*width*.82,y+height*.68,-depth*.56,5,4,5,shell);
   slab(side*width*.74,y+height*.75,-depth*.55,1.7,1.8,1.6,light);
  }
  slab(0,y+1,depth*.97,width*.43,Math.max(2,height*.44),3,dark,.40);
  slab(0,y+2,depth+3,width*.24,Math.max(1.4,height*.15),1.5,glow,.40);
  for(let n=0;n<legs;n++){
   for(const side of [-1,1]){
    const z=legs===1?0:(n-(legs-1)/2)*(depth*.94);
    const stride=cycle*side*(n%2?-1:1);
    const x=side*(legs===1?width*.57:width+7);
    const foot=liftFeet+5+Math.max(0,stride)*walk*.45+lift*13;
    const step=z+stride*walk+(pose==='jump'?side*8:0);
    const kneeY=y*.44+lift*12;
    pipe(side*width*.67,y-height*.46,z,x,kneeY,z+4,5,dark);
    slab(x,kneeY,z+4,6,5,6,shell);
    slab(x,kneeY+1,z+9,2,2,2,light);
    pipe(x,kneeY,z+4,x,foot,step,4,shell);
    slab(x,foot,step+3,6,4,9,dark);
    slab(x,foot+1,step+9,5,2,4,light);
   }
  }
  if(type.body==='worm'||type.body==='wraith'){
   for(let i=0;i<5;i++){
    const drift=Math.sin(i*.7+t*Math.PI*2)*(i+1)*1.4;
    slab(drift,y-height-(i+1)*4,-i*6,12-i*1.7,5,12-i,shell,.55);
    slab(drift,y-height-(i+1)*4,-i*6+10-i,5-i*.7,1,2,i%2?light:glow);
   }
  }
  if(type.body==='winged'){
   for(const side of [-1,1]){
    const wingY=y+9+cycle*10;
    pipe(side*10,y,0,side*39,wingY,-9,3,light);
    for(let i=0;i<5;i++)spike(side*(19+i*5),wingY-i*2,-9-i*2,4,-19+i,5,shell,-side*3,-8);
   }
  }
  if(type.body==='pillar'){
   for(const side of [-1,1])for(let i=0;i<3;i++){
    slab(side*(width+5+i*3),y-16+i*14,-i*6,4,7,6,i===1?glow:light,.56);
   }
   slab(0,17,0,width*.74,7,depth,dark,.55);
   slab(0,13,0,width*.61,2,depth*.87,glow,.55);
  }
  for(const side of [-1,1]){
   if(type.body==='winged'||type.body==='worm')continue;
   const swing=low?0:side*cycle*walk*.36;
   const ax=side*(width+5), ay=y-(low?3:12)+fire*7;
   const az=depth*.65+swing+fire*12-recoil*.4;
   pipe(side*width*.82,y+height*.32,0,ax,ay,az,low?4:6,dark);
   slab(ax,ay,az,6,8,6,shell,.5);
   const weapon=side===1?type.arm:(type.arm==='sacs'||type.arm==='fangs'?type.arm:'fist');
   if(weapon==='blade'||weapon==='fangs'){
    spike(ax,ay,az+4,5,weapon==='blade'?24:9,4,light,side*4,11);
    slab(ax,ay,az+3,6,2,5,glow);
   }else if(weapon==='rifle'||weapon==='cannon'){
    slab(ax,ay,az+9,weapon==='cannon'?8:5,5,17,shell);
    slab(ax,ay,az+25,4,4,3,light);
    slab(ax,ay,az+27,2,2,2,dark);
    slab(ax,ay+3,az+13,1.6,2,9,glow);
    if(fire>.91)spike(ax,ay,az+28,5,12,5,glow,-1,8);
   }else if(weapon==='shield'){
    slab(ax,ay+4,az+4,10,16,4,light,.45);
    slab(ax,ay+4,az+8,7,12,3,shell,.52);
    slab(ax,ay+4,az+11,2.3,7,1,glow);
   }else if(weapon==='hammer'){
    slab(ax,ay+6,az+7,10,9,10,dark);
    slab(ax,ay+8,az+9,11,4,11,light);
    slab(ax,ay+8,az+19,5,2,2,glow);
   }else if(weapon==='orb'||weapon==='sacs'){
    slab(ax,ay+3,az+7,7,8,7,light,.65);
    slab(ax,ay+3,az+12,5,5,3,glow,.65);
   }
  }
  const hx=asym, hy=headY-(pose==='hit'?recoil*.35:0), hz=headZ+fire*5;
  slab(hx,hy,hz,skull,10,11,shell,.50);
  slab(hx,hy+7,hz,skull*.94,5,12,light,.50);
  slab(hx,hy+1,hz+10,skull*.83,4,3,dark);
  if(crown==='visor'||crown==='halo'){
   slab(hx,hy+1,hz+13,skull*.71,1.8,1,glow,.46);
  }else{
   for(const side of [-1,1])slab(hx+side*skull*.43,hy+2,hz+13,2.4,2.1,1.2,glow);
  }
  slab(hx,hy-7,hz+8,skull*.70,2.6,5,light);
  for(let i=-2;i<=2;i++)slab(hx+i*2.4,hy-6,hz+13,.8,1.5,.6,dark);
  for(const side of [-1,1]){
   const crestX=hx+side*skull*.83;
   if(crown==='horns'||crown==='split')spike(crestX,hy+8,hz,5,boss?21:12,5,light,side*6,-4);
   if(crown==='halo')pipe(crestX,hy+7,hz-5,hx+side*6,hy+23,hz-8,2,glow);
   if(crown==='mask')slab(crestX,hy-3,hz+5,4,7,6,dark);
   slab(crestX,hy+1,hz-6,4,4,7,shell);
   if(finish==='wreck'){
    spike(side*width*.76,y+height*.85,-depth*.65,4,16+m%4,3,light,side*4,-3);
    pipe(side*width*.56,y-7,depth+1,side*width*.80,y+15,-depth,1.7,light);
   }else if(finish==='neon'){
    slab(side*(width-2),y+height*.64,-depth*.76,4,8+m%4,4,dark);
    slab(side*(width-2),y+height*.64,-depth*.76+4,2,6+m%4,1,glow);
   }else if(finish==='relic'){
    slab(side*(width+2),y+height*.35,0,7,9,12,light);
    spike(side*(width+3),y+height*.52,-4,5,13+m%3,6,shell,side*3);
   }else if(finish==='tissue'){
    for(let i=0;i<3;i++)slab(side*(width+i%2),y+height*.1+i*5,(i-1)*8,5+i,4+i,5+i,i===1?glow:light,.64);
   }else{
    spike(side*(width+4),y+height*.57,-5,6,19+m%5,5,light,side*5,-4);
    slab(side*(width+5),y+height*.57,-5,4,4,4,glow,.54);
   }
  }
  if(boss){
   for(let i=-2;i<=2;i++)spike(hx+i*5,hy+10,hz-7,3,16-Math.abs(i)*3,3,i%2?glow:light,i*1.5,-4);
   slab(0,y-2,-depth,13,16,5,dark,.53);
   slab(0,y-2,-depth-4,7,9,3,glow,.55);
  }else{
   for(let i=0;i<3;i++)slab((m%2?1:-1)*(3+i*3),y+height*.56-i*2,-depth,2,1,2,light);
  }
  faces.sort((a,b)=>a.depth-b.depth);
  for(const {points,color} of faces){
   ink.beginPath();
   ink.moveTo(Math.round(points[0][0]),Math.round(points[0][1]));
   for(const [x,y] of points.slice(1))ink.lineTo(Math.round(x),Math.round(y));
   ink.closePath();
   ink.strokeStyle=color;
   ink.lineWidth=1.12;
   ink.stroke();
   ink.fillStyle=color;
   ink.fill();
  }
  return image;
 }
 return {
  size,
  clear(){cache.clear()},
  get(type,view,pose,frame){
   const key=type.id+':'+view+':'+pose+':'+frame;
   const image=cache.get(key)??draw(type,view,pose,frame);
   cache.delete(key);
   cache.set(key,image);
   if(cache.size>capacity)cache.delete(cache.keys().next().value);
   return image;
  }
 };
})();
