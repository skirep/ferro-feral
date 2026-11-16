const worlds = [
 {"name":"L’Illa Maleïda","shape":"courtyard","corridor":1,"root":41.2,"bpm":126},
 {"name":"Neon Apocalypse","shape":"block","corridor":3,"root":46.25,"bpm":144},
 {"name":"El Regne dels Oblidats","shape":"octagon","corridor":1,"root":36.71,"bpm":112},
 {"name":"Biohazard Zero","shape":"cross","corridor":1,"root":43.65,"bpm":132},
 {"name":"The Abyss","shape":"diamond","corridor":1,"root":32.7,"bpm":156}
];
const levels = ferroWorldLevels.flatMap((stages,theme)=>
 stages.map((level,stage)=>({...level,theme,stage}))
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
