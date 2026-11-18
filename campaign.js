const worlds = [
 {"name":"L’Illa Maleïda","shape":"courtyard","corridor":1,"root":41.2,"bpm":126},
 {"name":"Neon Apocalypse","shape":"block","corridor":3,"root":46.25,"bpm":144},
 {"name":"El Regne dels Oblidats","shape":"octagon","corridor":1,"root":36.71,"bpm":112},
 {"name":"Biohazard Zero","shape":"cross","corridor":1,"root":43.65,"bpm":132},
 {"name":"The Abyss","shape":"diamond","corridor":1,"root":32.7,"bpm":156},
 {"name":"L’Illa de l’Sputnik","root":43.65,"bpm":118}
];
const levels = ferroWorldLevels.flatMap((stages,theme)=>
 stages.map((level,stage)=>({...level,name:ferroShip.names[theme]?.[stage]??level.name,theme,stage}))
);

const campaign = {
 id:'foneria',
 name:'Campanya de Ferro Feral',
 levels
};
const campaignSaveKey='ferro-campaign-v1:'+campaign.id;

function unlockedLevel(value){
 if(!Number.isInteger(value))return 0;
 return Math.max(0,Math.min(campaign.levels.length-1,value));
}
function readCampaignProgress(storage){
 try{return unlockedLevel(JSON.parse(storage.getItem(campaignSaveKey))?.unlocked)}
 catch{return 0}
}
function saveCampaignProgress(storage,completed,nextUnlocked){
 const unlocked=Math.max(unlockedLevel(nextUnlocked),unlockedLevel(completed+1),readCampaignProgress(storage));
 try{storage.setItem(campaignSaveKey,JSON.stringify({unlocked}))}catch{}
 return unlocked;
}

function calculateLevelScore({normal,special,shots,hits,seconds,damageTaken,secrets=0,deaths=0}){
 const timeBonus=Math.max(0,600-Math.floor(seconds)*5);
 const accuracyBonus=shots?Math.round(400*hits/shots):0;
 return secrets*500+normal*100+special*250+2000+1000+(deaths?0:1500)+(damageTaken||deaths?0:2500)+timeBonus+accuracyBonus;
}
function readLevelRecords(storage){
 try{
  const records=JSON.parse(storage.getItem('ferro-records-v1:'+campaign.id));
  return levels.map((_,index)=>{
   const entry=records?.[index];
   return Number.isInteger(entry?.points)&&entry.points>=0&&Number.isFinite(entry.seconds)&&entry.seconds>=0?entry:null;
  });
 }catch{return levels.map(()=>null)}
}
function saveLevelRecord(storage,records,index,result){
 const saved=readLevelRecords(storage);
 const best=(a,b)=>!a||b&&(b.points>a.points||b.points===a.points&&b.seconds<a.seconds)?b:a;
 const next=records.map((entry,i)=>best(entry,saved[i]));
 next[index]=best(next[index],result);
 try{storage.setItem('ferro-records-v1:'+campaign.id,JSON.stringify(next))}catch{}
 return next;
}

const worldProgressKey='ferro-worlds-v1:'+campaign.id;
function readWorldProgress(storage){
 let saved;
 try{saved=JSON.parse(storage.getItem(worldProgressKey))}catch{}
 const legacy=readCampaignProgress(storage);
 return worlds.map((_,world)=>Math.max(
  Number.isInteger(saved?.[world])?Math.min(4,saved[world]):0,
  world<ferroSputnik.theme?Math.max(0,Math.min(4,legacy-world*5)):0
 ));
}
function saveWorldProgress(storage,progress){
 const merged=readWorldProgress(storage).map((stage,index)=>Math.max(stage,Number.isInteger(progress[index])?Math.min(4,progress[index]):0));
 try{storage.setItem(worldProgressKey,JSON.stringify(merged))}catch{}
 return merged;
}
function levelAvailable(progress,index){
 const level=levels[index];
 return !!level&&level.stage<=progress[level.theme];
}
function completeWorldStage(storage,progress,index){
 if(!levelAvailable(progress,index))return progress;
 const {theme,stage}=levels[index];
 const next=progress.slice();
 next[theme]=Math.max(next[theme],Math.min(4,stage+1));
 return saveWorldProgress(storage,next);
}
