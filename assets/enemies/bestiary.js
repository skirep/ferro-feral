const ferroBestiary=(()=>{
 const panel=document.getElementById('bestiaryPanel');
 const enemy=document.getElementById('bestiaryEnemy');
 const pose=document.getElementById('bestiaryPose');
 const slider=document.getElementById('bestiaryFrame');
 const counter=document.getElementById('bestiaryFrameCount');
 const play=document.getElementById('bestiaryPlay');
 const placement=document.getElementById('bestiaryArena');
 const container=document.getElementById('bestiaryViews');
 const angles=['Front','Front · 45°','Perfil · 90°','Darrere · 135°','Esquena','Darrere · 225°','Perfil · 270°','Front · 315°'];
 const rooms=['nord-oest','nord-est','sud-est','sud-oest'];
 const frameTime={walk:1000/6.5,jump:980/12,shoot:820/12,idle:180,run:1000/15,aim:55,recover:50,hit:33,death:82};
 const extra={idle:'Espera',run:'Córrer',aim:'Apuntar',recover:'Recuperar la postura',hit:'Rebre un impacte',death:'Caure'};
 const extraOptions=Object.entries(extra).map(([value,textContent])=>{
  const option=document.createElement('option');
  option.value=value;option.textContent=textContent;option.hidden=option.disabled=true;
  pose.append(option);
  return option;
 });
 const previews=angles.map(label=>{
  const figure=document.createElement('figure');
  const canvas=document.createElement('canvas');
  const caption=document.createElement('figcaption');
  canvas.width=canvas.height=256;
  canvas.setAttribute('aria-hidden','true');
  caption.textContent=label;
  figure.append(canvas,caption);
  container.append(figure);
  return canvas.getContext('2d');
 });
 const roster=types.filter(type=>type.atlas);
 const spawns=ferroArena.layout(37,types).spawns;
 for(const [theme,world] of worlds.entries()){
  const group=document.createElement('optgroup');
  group.label=world.name;
  for(const [i,type] of roster.entries()){
   if(type.theme!==theme)continue;
   const option=document.createElement('option');
   option.value=i;
   option.textContent=type.name;
   group.append(option);
  }
  if(group.childElementCount)enemy.append(group);
 }
 let request=0,started=null,opened=0;

 function render(){
  const type=roster[Number(enemy.value)];
  const frame=Number(slider.value)-1;
  counter.value=slider.value+'/12';
  previews.forEach((ctx,view)=>{
   const flex=type.torsoMotion&&pose.value==='run'?Math.sin(frame*Math.PI/3-.6)*.9:0;
   const art=ferroEnemySprites.get(type,view,pose.value,frame,flex);
   ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
   if(art)ctx.drawImage(art,0,0,ctx.canvas.width,ctx.canvas.height);
  });
 }

 window.addEventListener('ferro-enemy-frames',()=>{if(!panel.hidden)render()});

 function showPlacement(){
  const type=roster[Number(enemy.value)];
  const copies=spawns.filter(spawn=>spawn.type===type);
  placement.textContent='Arena · '+copies.length+' exemplars a l’inici · '+copies.map(copy=>rooms[copy.room]).join(' i ');
 }

 function animate(now){
  if(started===null)started=now-(Number(slider.value)-1)*frameTime[pose.value];
  const next=String(1+Math.floor((now-started)/frameTime[pose.value])%12);
  if(next!==slider.value){
   slider.value=next;
   render();
  }
  request=requestAnimationFrame(animate);
 }

 function stop(){
  cancelAnimationFrame(request);
  request=0;
  started=null;
  play.textContent='Reprodueix';
 }

 function reset(){
  started=null;
  slider.value=1;
  render();
 }

 play.onclick=()=>{
  if(request){stop();return}
  play.textContent='Pausa';
  request=requestAnimationFrame(animate);
 };
 slider.oninput=()=>{stop();render()};
 pose.onchange=reset;
 enemy.onchange=loadSelection;

 async function loadSelection(){
  const revision=++opened;
  const type=roster[Number(enemy.value)];
  stop();
  for(const option of extraOptions){
   const supported=type.hd || type.theme===0 && !['aim','recover'].includes(option.value);
   option.hidden=option.disabled=!supported;
  }
  if(pose.selectedOptions[0]?.disabled)pose.value='walk';
  slider.disabled=play.disabled=true;
  placement.textContent='Carregant els atles…';
  for(const ctx of previews)ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  try{
   await ferroEnemySprites.prepare(type.theme,[type.slot]);
   if(revision!==opened||panel.hidden)return;
   showPlacement();
   reset();
   slider.disabled=play.disabled=false;
  }catch{
   if(revision===opened)placement.textContent='No s’han pogut carregar els atles. Torna a obrir el bestiari.';
  }
 }

 return {
  open:loadSelection,
  close(){opened++;stop()}
 };
})();
