const ferroSputnikOrbit=(()=>{
 const duration=17,triggerRadius=20;
 const aurora=[47,221,232], amber=[255,164,75];
 const clamp=value=>Math.max(0,Math.min(1,value));
 const ease=value=>{const t=clamp(value);return t*t*(3-2*t)};
 let art;

 function prepare(onReady){
  if(art)return;
  const image=new Image();
  image.onload=()=>{art=image;onReady()};
  image.src='./assets/sputnik/carrier.webp';
 }

 function create(wreck,heading,beach){
  return {x:wreck.x,y:wreck.y,dx:-Math.sin(heading),dy:Math.cos(heading),
   beach,started:null,rewarded:false};
 }

 function update(event,player,time,elapsed=0){
  if(event.started===null){
   const dx=event.x-player.x,dy=event.y-player.y,distance=Math.hypot(dx,dy);
   const beachArrival=event.beach&&elapsed>=3;
   if(!beachArrival&&(distance>triggerRadius||distance>6&&(dx*Math.cos(player.a)+dy*Math.sin(player.a))/distance<.65))return;
   event.started=time;
   return 'signal';
  }
  if(!event.rewarded&&time-event.started>=13.2){
   event.rewarded=true;
   return 'cache';
  }
 }

 function sample(event,time){
  if(!event||event.started===null)return null;
  const age=time-event.started;
  if(age<0||age>=duration)return null;
  const approach=ease((age-1.2)/4),departure=ease((age-12)/5);
  const drift=(event.beach?10:19)*(1-approach)-28*departure;
  const transfer=event.beach?ease((age-6)/5):1;
  const anchorX=event.beach?event.beach.hullX+(event.x-event.beach.hullX)*transfer:event.x;
  const anchorY=event.beach?event.beach.hullY+(event.y-event.beach.hullY)*transfer:event.y;
  const scanX=event.beach?event.beach.x+(event.x-event.beach.x)*transfer:event.x;
  const scanY=event.beach?event.beach.y+(event.y-event.beach.y)*transfer:event.y;
  const scan=ease((age-4.4)/2)*(1-ease((age-11)/1.1));
  const wave=(age-11.35)/2.5;
  return {age,x:anchorX+event.dx*drift,y:anchorY+event.dy*drift,
   z:5.85+.85*transfer+3.5*(1-approach)+8*departure,visibility:ease((age-1)/2)*(1-ease((age-14)/3)),
   shade:.62*approach*(1-departure),scan,
   targetX:scanX+Math.sin(age*1.36)*4.3*(1-ease((age-9.4)/1.8)),
   targetY:scanY+Math.cos(age*1.36)*4.3*(1-ease((age-9.4)/1.8)),
   pulse:age>11.35?1-ease(wave):0,wave:clamp(wave)*16};
 }

 function light(state,x,y,sun){
  if(!state)return 1;
  const rx=x-state.x+sun.x*3.8,ry=y-state.y+sun.y*3.8;
  return 1-state.shade*(.15+.85*clamp(1-(rx*rx+ry*ry)/118)**2);
 }

 function visibilityPath(ctx,v,geometry,limit){
  const {width,height,depth}=v;
  const left=Math.max(0,Math.floor(geometry[0])),right=Math.min(width,Math.ceil(geometry[1]));
  const top=Math.max(0,Math.floor(geometry[2])),bottom=Math.min(height,Math.ceil(geometry[3]));
  ctx.beginPath();
  for(let x=left;x<right;x+=2){
   let start=-1;
   for(let y=top;y<=bottom;y++){
    const visible=y<bottom&&depth[y*width+x]>limit;
    if(visible&&start<0)start=y;
    if(!visible&&start>=0){ctx.rect(x,start,Math.min(2,right-x),y-start);start=-1}
   }
  }
  ctx.clip();
 }

 function draw(ctx,state,v){
  if(!state)return;
  const {width,height,focal,project,effects}=v;
  const hull=project(state.x,state.y,state.z);
  const target=project(state.targetX,state.targetY,.04);
  ctx.save();
  if(hull&&target&&state.scan){
   const upper=focal/hull.z*.36,lower=focal/target.z*1.95;
   ctx.save();
   visibilityPath(ctx,v,[Math.min(hull.x-upper,target.x-lower),Math.max(hull.x+upper,target.x+lower),
    Math.min(hull.y,target.y)-2,Math.max(hull.y,target.y)+5],Math.min(hull.z,target.z));
   ctx.globalCompositeOperation='screen';
   for(const [spread,alpha] of [[1,.18],[.65,.17],[.24,.30]]){
    const color=ctx.createLinearGradient(hull.x,hull.y,target.x,target.y);
    color.addColorStop(0,'rgba(130,249,255,'+state.scan*alpha*1.8+')');
    color.addColorStop(.65,'rgba(41,220,224,'+state.scan*alpha+')');
    color.addColorStop(1,'rgba(111,255,232,0)');
    ctx.fillStyle=color;ctx.beginPath();
    ctx.moveTo(hull.x-upper*spread,hull.y);ctx.lineTo(hull.x+upper*spread,hull.y);
    ctx.lineTo(target.x+lower*spread,target.y);ctx.lineTo(target.x-lower*spread,target.y);
    ctx.closePath();ctx.fill();
   }
   if(effects)for(let i=0;i<22;i++){
    const a=(state.age*.42+i*.618)%1;
    const side=Math.sin(i*17.5+state.age)*a*lower;
    ctx.fillStyle='#c8ffef';ctx.globalAlpha=state.scan*Math.sin(a*Math.PI)*.72;
    ctx.fillRect(hull.x+(target.x-hull.x)*a+side,hull.y+(target.y-hull.y)*a,1+a*2,1+a*2);
   }
   ctx.restore();
  }
  if(hull&&state.visibility){
   const w=11.8*focal/hull.z,h=w*(art?art.height/art.width:.29),x=hull.x-w/2,y=hull.y-h*.62;
   if(x<width&&x+w>0&&y<height&&y+h>0){
    ctx.save();visibilityPath(ctx,v,[x,x+w,y,y+h],hull.z);
    ctx.globalAlpha=state.visibility;
    if(art)ctx.drawImage(art,x,y,w,h);
    else{
     ctx.fillStyle='#152137';ctx.beginPath();ctx.moveTo(x,y+h*.68);ctx.lineTo(x+w*.31,y+h*.06);
     ctx.lineTo(x+w*.66,y);ctx.lineTo(x+w,y+h*.66);ctx.lineTo(x+w*.55,y+h);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    if(effects){
     ctx.globalCompositeOperation='screen';
     const centerY=hull.y,r=Math.max(4,w*.19);
     const lamp=ctx.createRadialGradient(hull.x,centerY,0,hull.x,centerY,r);
     lamp.addColorStop(0,'#e2fff8');lamp.addColorStop(.11,'#71ffe7aa');lamp.addColorStop(1,'#58ffec00');
     ctx.globalAlpha=state.visibility*(.30+state.scan*.62);ctx.fillStyle=lamp;
     ctx.fillRect(hull.x-r,centerY-r,r*2,r*2);
    }
   }
  }
  ctx.restore();
 }

 function rings(ctx,state,event,v){
  if(!state||(!state.scan&&!state.pulse))return;
  const {project,depth,width,height}=v;
  const x=state.pulse?event.x:state.targetX,y=state.pulse?event.y:state.targetY;
  const radius=state.pulse?state.wave:1.50+(state.age*.65)%1;
  ctx.save();ctx.strokeStyle=state.pulse?'#ffd782':'#77ffec';ctx.lineWidth=state.pulse?2.4:1.6;
  ctx.globalAlpha=state.pulse?state.pulse*.85:state.scan*.85;
  ctx.globalCompositeOperation='screen';ctx.beginPath();
  let last=null;
  for(let i=0;i<=90;i++){
   const angle=i/90*Math.PI*2;
   const p=project(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,.068);
   const valid=p&&p.x>=0&&p.x<width&&p.y>=0&&p.y<height&&depth[Math.floor(p.y)*width+Math.floor(p.x)]>p.z-.04;
   if(valid){
    if(last)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);
   }
   last=valid;
  }
  ctx.stroke();ctx.restore();
 }

 function cue(kind,tone,when,out){
  const notes=kind==='signal'?[[84,2,.23,40],[367,.23,.13,503],[503,.38,.12,683]]:[[60,1.7,.30,27],[180,1.0,.18,72],[712,.70,.09,1200]];
  notes.forEach(([pitch,length,volume,end],i)=>tone(pitch,length,volume,i?'sine':'triangle',when+i*.16,out,end));
 }
 return {prepare,create,update,sample,light,draw,rings,cue,aurora,amber};
})();
