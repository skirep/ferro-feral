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
 const frameTime={walk:1000/6.5,jump:980/12,shoot:820/12};
 const previews=angles.map(label=>{
  const figure=document.createElement('figure');
  const canvas=document.createElement('canvas');
  const caption=document.createElement('figcaption');
  canvas.width=canvas.height=192;
  canvas.setAttribute('aria-hidden','true');
  caption.textContent=label;
  figure.append(canvas,caption);
  container.append(figure);
  return canvas.getContext('2d');
 });
 const roster=types.filter(type=>type.atlas);
 const spawns=ferroArena.layout(37,types).spawns;
 for(const [i,type] of roster.entries()){
  const option=document.createElement('option');
  option.value=i;
  option.textContent=type.name;
  enemy.append(option);
 }
 let request=0,started=null,opened=0;

 function render(){
  const type=roster[Number(enemy.value)];
  const frame=Number(slider.value)-1;
  counter.value=slider.value+'/12';
  previews.forEach((ctx,view)=>{
   const art=ferroEnemySprites.get(type,view,pose.value,frame);
   ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
   if(art)ctx.drawImage(art,0,0);
  });
 }

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
