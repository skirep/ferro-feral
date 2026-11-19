const ferroSputnikOrbit=(()=>{
 const duration=17,triggerRadius=20,turn=Math.PI*2;
 const aurora=[47,221,232], amber=[255,164,75];
 const clamp=value=>Math.max(0,Math.min(1,value));
 const ease=value=>{const t=clamp(value);return t*t*(3-2*t)};
 const angleWidth=416,angleHeight=168;
 let art,angles,loading=false;

 function prepare(onReady){
  if(art||loading)return;
  loading=true;
  const image=new Image(),directions=new Image();
  image.onload=()=>{art=image;loading=false;onReady()};
  image.onerror=()=>{loading=false};
  directions.onload=()=>{
   if(directions.naturalWidth===angleWidth*4&&directions.naturalHeight===angleHeight*2){
    angles=directions;onReady();
   }
  };
  image.src='./assets/sputnik/carrier.webp';
  directions.src='./assets/sputnik/carrier-360.webp';
 }

 function create(wreck,heading,beach){
  return {x:wreck.x,y:wreck.y,dx:-Math.sin(heading),dy:Math.cos(heading),heading,
   beach,started:null,rewarded:false,deployed:new Set()};
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
  const hover=Math.sin(age*2.05)*.25,bank=.21*(1-approach)-.24*departure+Math.sin(age*1.6)*.035;
  const thrust=ease((age-.7)/.9)*(.32+.47*(1-approach)+.58*ease((age-11.6)/1.3));
  const lock=ease((age-8.7)/2.4)*(1-ease((age-11.65)/1));
  return {age,x:anchorX+event.dx*drift,y:anchorY+event.dy*drift,
   z:5.85+.85*transfer+3.5*(1-approach)+8*departure+hover,visibility:ease((age-1)/2)*(1-ease((age-14)/3)),
   shade:.62*approach*(1-departure),scan,bank,thrust,lock,
   heading:event.heading+Math.PI+transfer*.64-departure*1.38,
   distress:ease(age/.6)*(1-ease((age-9.6)/2)),
   targetX:scanX+Math.sin(age*1.36)*4.3*(1-ease((age-9.4)/1.8)),
   targetY:scanY+Math.cos(age*1.36)*4.3*(1-ease((age-9.4)/1.8)),
   pulse:age>11.35?1-ease(wave):0,wave:clamp(wave)*16};
 }

 function boarding(event,time){
  if(!event||event.started===null)return [];
  const age=time-event.started;
  const beach=!!event.beach;
  const landX=beach?16.65:event.x-1.8,landY=beach?8.8:event.y;
  const descent=[];
  for(let id=0;id<3;id++){
   const start=5.45+id*.73;
   const progress=(age-start)/2.05;
   if(progress<0)continue;
   const hull=sample(event,event.started+start);
   const mix=ease(progress);
   const x=landX+id*.78,y=landY+id*.65;
   const facing=Math.atan2(y-hull.y,x-hull.x);
   descent.push({id,facing,x:hull.x+(x-hull.x)*mix,y:hull.y+(y-hull.y)*mix,
    z:Math.max(0,(hull.z-.65)*(1-mix)),landed:progress>=1,frame:Math.min(11,Math.floor(clamp(progress)*12))});
  }
  return descent;
 }

 function light(state,x,y,sun){
  if(!state)return 1;
  const rx=x-state.x+sun.x*3.8,ry=y-state.y+sun.y*3.8;
  return 1-state.shade*(.15+.85*clamp(1-(rx*rx+ry*ry)/118)**2);
 }

 function disturbance(state,event){
  if(!state)return null;
  if(state.pulse>.12)return {x:event.x,y:event.y,radius:Math.max(4,state.wave+2)};
  if(state.scan>.3)return {x:state.targetX,y:state.targetY,radius:6.4};
  return null;
 }

 function plantSway(state,plant){
  if(!state||plant.kind===3||plant.kind===4)return 0;
  const d=Math.hypot(plant.x-state.targetX,plant.y-state.targetY);
  const scan=state.scan*clamp(1-d/8);
  const shock=state.pulse*clamp(1-Math.abs(d-state.wave)/2.3);
  return Math.sin(state.age*8+plant.yaw)*(scan*.032+shock*.064);
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

 function visible(p,v){
  if(!p||p.x<0||p.x>=v.width||p.y<0||p.y>=v.height)return false;
  return v.depth[Math.floor(p.y)*v.width+Math.floor(p.x)]>p.z-.05;
 }

 function flare(ctx,x,y,radius,color,alpha){
  if(radius<=0||alpha<=0)return;
  const halo=ctx.createRadialGradient(x,y,0,x,y,radius);
  halo.addColorStop(0,'#fffcec');halo.addColorStop(.20,color);halo.addColorStop(1,'transparent');
  ctx.globalAlpha=clamp(alpha);ctx.fillStyle=halo;
  ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
 }

 function animateCarrier(ctx,state,v,w,h){
  if(!v.effects)return;
  ctx.globalCompositeOperation='screen';
  const radius=Math.max(1,w*.037);
  for(const side of [-1,1]){
   const x=side*w*.345,y=.012*h;
   const pulse=.8+.2*Math.sin(state.age*17+side);
   flare(ctx,x,y,radius*(1+state.thrust),'#ff9e4f',state.visibility*state.thrust*pulse*.85);
   if(state.thrust>.36){
    for(let i=0;i<7;i++){
     const phase=(state.age*2.8+i/7)%1;
     const tail=h*phase*state.thrust;
     const ix=x+side*tail*.16+Math.sin(i*8.2+state.age*8)*radius*.23;
     flare(ctx,ix,y+tail,radius*(.18+phase*.34),'#ffa45c',state.thrust*(1-phase)*state.visibility*.34);
    }
   }
   for(let i=0;i<5;i++){
    const phase=(state.age*2-i*.17+side*.36+4)%1;
    const size=Math.max(1,w*.007);
    ctx.globalAlpha=state.visibility*(.16+.82*Math.pow(1-phase,5));
    ctx.fillStyle=side<0?'#ff8a59':'#6cfce8';
    ctx.fillRect(side*w*(.17+i*.061)-size/2,-h*(.17-i*.022),size,size);
   }
  }
  if(state.scan||state.lock){
   ctx.save();ctx.rotate(state.age*(2.4+state.lock));
   ctx.strokeStyle=state.lock>.7?'#ffdc83':'#99fff2';
   ctx.globalAlpha=state.visibility*(.34+state.lock*.43);
   ctx.lineWidth=Math.max(1,w*.009);
   for(let i=0;i<4;i++){
    const a=i*turn/4;
    ctx.beginPath();ctx.arc(0,0,w*.059,a,a+.82);ctx.stroke();
   }
   ctx.restore();
  }
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
   if(effects)for(let i=0;i<3;i++){
    const phase=(state.age*1.3+i/3)%1;
    const span=(upper+(lower-upper)*phase)*.76;
    const x=hull.x+(target.x-hull.x)*phase,y=hull.y+(target.y-hull.y)*phase;
    ctx.globalAlpha=state.scan*Math.sin(phase*Math.PI)*.68;
    ctx.strokeStyle='#a9fff1';ctx.lineWidth=Math.max(1,span*.033);ctx.beginPath();
    ctx.ellipse(x,y,span,Math.max(1.4,span*.14),0,0,turn);ctx.stroke();
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
   const w=11.8*focal/hull.z,h=w*(angles?angleHeight/angleWidth:art?art.height/art.width:.29);
   const x=hull.x-w/2,y=hull.y-h*.62;
   if(x<width&&x+w>0&&y<height&&y+h>0){
    const bank=effects?state.bank:0;
    ctx.save();visibilityPath(ctx,v,[x-w*.06,x+w*1.06,y-h*.43,y+h*1.45],hull.z);
    ctx.globalAlpha=state.visibility;
    if(art){
     ctx.translate(hull.x,hull.y);ctx.rotate(bank);
     if(angles&&v.camera){
      const bearing=Math.atan2(v.camera.y-state.y,v.camera.x-state.x);
      const view=(8-ferroEnemySprites.viewFor(state.heading,bearing))%8;
      ctx.drawImage(angles,(view%4)*angleWidth,Math.floor(view/4)*angleHeight,angleWidth,angleHeight,-w/2,-h*.62,w,h);
     }else ctx.drawImage(art,-w/2,-h*.62,w,h);
     animateCarrier(ctx,state,v,w,h);
    }
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

 function circle(ctx,v,x,y,z,radius){
  ctx.beginPath();
  let last=false;
  for(let i=0;i<=72;i++){
   const angle=i/72*turn;
   const point=v.project(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z);
   const shown=visible(point,v);
   if(shown){
    if(last)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);
   }
   last=shown;
  }
  ctx.stroke();
 }

 function rings(ctx,state,event,v){
  if(!state||(!state.scan&&!state.pulse))return;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  if(state.scan){
   ctx.strokeStyle='#77ffec';ctx.lineWidth=1.5;
   for(let i=0;i<(v.effects?3:1);i++){
    const phase=(state.age*.65+i/3)%1;
    ctx.globalAlpha=state.scan*(1-phase)*.88;
    circle(ctx,v,state.targetX,state.targetY,.068,1.0+phase*2.3);
   }
  }
  if(state.pulse){
   ctx.strokeStyle='#ffd782';
   for(let i=0;i<(v.effects?3:1);i++){
    const radius=state.wave-i*1.75;
    if(radius<=0)continue;
    ctx.lineWidth=2.4-i*.48;
    ctx.globalAlpha=state.pulse*(.9-i*.19);
    circle(ctx,v,event.x,event.y,.068+i*.062,radius);
   }
  }
  ctx.restore();
 }

 function debris(ctx,state,event,v){
  if(!state||!v.effects)return;
  ctx.save();ctx.globalCompositeOperation='screen';
  const {project,focal}=v;
  if(state.scan>.05)for(let i=0;i<31;i++){
   const phase=(state.age*.62+i*.137)%1,angle=state.age*(1.22+i%4*.24)+i*2.40;
   const radius=(1-phase)*(1.1+i%7*.24);
   const pos=project(state.targetX+Math.cos(angle)*radius,state.targetY+Math.sin(angle)*radius,
    .06+3.1*phase*phase);
   if(!visible(pos,v))continue;
   ctx.globalAlpha=state.scan*Math.sin(phase*Math.PI)*.78;
   ctx.fillStyle=i%3===0?'#e4ffcf':'#60e8db';
   const size=Math.min(4,Math.max(1,focal/pos.z*.034));
   ctx.fillRect(pos.x,pos.y,size,size);
  }
  if(state.pulse>.03)for(let i=0;i<45;i++){
   const angle=i*2.3999632,radius=state.wave*(.42+i%11*.054);
   const height=.09+state.pulse*(i%9)*.16;
   const pos=project(event.x+Math.cos(angle)*radius,event.y+Math.sin(angle)*radius,height);
   if(visible(pos,v)){
    ctx.globalAlpha=state.pulse*(.12+i%7*.09);
    ctx.fillStyle=i%3===0?'#ffed9d':'#e88445';
    ctx.fillRect(pos.x,pos.y,Math.min(5,Math.max(1,focal/pos.z*.040)),2);
   }
  }
  ctx.restore();
 }

 function wreck(ctx,state,event,v){
  if(!state||!v.effects||!state.distress)return;
  const {project,focal}=v;
  const beacon=project(event.x,event.y,1.26);
  if(!visible(beacon,v))return;
  const pulse=(.5+.5*Math.sin(state.age*5.4))**3;
  const radius=Math.min(80,focal/beacon.z*.72);
  ctx.save();ctx.globalCompositeOperation='screen';
  flare(ctx,beacon.x,beacon.y,radius,'#ff825d',state.distress*(.25+pulse*.57));
  ctx.globalAlpha=state.distress*.48;
  ctx.strokeStyle='#ff9e6a';ctx.lineWidth=1;
  for(let i=0;i<3;i++){
   const phase=(state.age*.8+i/3)%1;
   const altitude=1.28+phase*1.54;
   circle(ctx,v,event.x,event.y,altitude,.18+phase*1.18);
  }
  ctx.restore();
 }

 function cue(kind,tone,when,out){
  const notes=kind==='signal'?[[84,2,.23,40],[367,.23,.13,503],[503,.38,.12,683]]:[[60,1.7,.30,27],[180,1.0,.18,72],[712,.70,.09,1200]];
  notes.forEach(([pitch,length,volume,end],i)=>tone(pitch,length,volume,i?'sine':'triangle',when+i*.16,out,end));
 }
 return {prepare,create,update,sample,boarding,light,disturbance,plantSway,draw,rings,debris,wreck,cue,aurora,amber};
})();
