const originalRoutes=[
 {name:'El torn de nit',route:[0,1,2,3,7,6,5,9,10,11,15], roster:[0,1,0,2,1,2], arenas:[2,9], boss:2,bossName:'El Botxí de Bronze',theme:0,secret:[6,1],terraces:[0,.42,.14,.68]},
 {name:'La cisterna cega',route:[0,4,8,12,13,9,5,6,10,14,15,11], roster:[3,4,3,5,6,4,5,6], arenas:[8,10], boss:5,bossName:'La Caldera Cega',theme:1,secret:[8,1],terraces:[0,-.48,-.19,.36]},
 {name:'El bastió de vidre',route:[0,1,5,4,8,12,13,9,10,6,7,11,15], roster:[6,7,3,7,8,5,7,8], arenas:[5,10],boss:8,bossName:'El Custodi del Bastió',theme:2,secret:[10,1],terraces:[0,.36,.74,.23]},
 {name:'El pou de les màquines',route:[0,4,5,1,2,3,7,6,10,9,13,14,15],roster:[2,5,7,6,8,5,7,6,8],arenas:[7,13],boss:6,bossName:'El Bessó de Mercuri',theme:1,secret:[6,-1],terraces:[.28,-.44,.15,.60]},
 {name:'El cor de ferro',route:[0,1,2,3,7,11,10,6,5,4,8,9,13,14,15],roster:[7,8,5,6,7,2,8,7,8,5],arenas:[6,13],boss:9,bossName:'El Cor de la Foneria',theme:2,secret:[10,1],terraces:[0,.52,-.12,.82]}
];

const worlds=[
 {name:"L’Illa Maleïda",material:'timber',sky:[25,37,72],shape:'courtyard',corridor:1,palette:[[114,83,53],[71,65,42],[46,40,59],[255,174,77]],glow:[255,169,75],spark:'#ffd28e',root:41.2,bpm:126},
 {name:'Neon Apocalypse',material:'circuit',sky:[27,22,69],shape:'block',corridor:3,palette:[[35,55,91],[24,44,71],[18,25,56],[70,243,255]],glow:[69,224,255],spark:'#72eaff',root:46.25,bpm:144},
 {name:'El Regne dels Oblidats',material:'masonry',sky:[52,46,63],shape:'octagon',corridor:1,palette:[[105,113,102],[55,65,49],[43,48,54],[246,203,115]],glow:[245,189,99],spark:'#ffe3ad',root:36.71,bpm:112},
 {name:'Biohazard Zero',material:'membrane',sky:[24,51,39],shape:'cross',corridor:1,palette:[[74,111,49],[35,65,34],[26,46,36],[179,253,89]],glow:[166,247,88],spark:'#c6ff89',root:43.65,bpm:132},
 {name:'The Abyss',material:'crystal',sky:[66,20,92],shape:'diamond',corridor:1,palette:[[112,53,137],[53,31,91],[42,21,68],[255,93,193]],glow:[237,82,255],spark:'#ff9de7',root:32.70,bpm:156}
];

const worldStages=[
 [
  ['Port dels Nàufrags',null,'Contramestre de la Boira',true],
  ['Taverna de les Set Espelmes',null,'Ombra del Taverner',false],
  ['Selva del Lloro Mut',null,'Custodi de la Selva',true],
  ['Coves del Cementiri',null,'Guardià de les Tombes',false],
  ['Fortalesa de la Marea Negra',null,'El Capità Maleït',true]
 ],
 [
  ['Avinguda dels Hologrames','01237659aef','Sentinella d’Asfalt',true],
  ['Estació Metro-09','048cdefba9567','Inspector de la Línia Morta',false],
  ['Laboratori Paral·laxi','012659dc84','Prototip Paral·laxi',false],
  ['Refineria d’Arcs','04567321','El Forn de Plasma',false],
  ['Passarel·les de la Torre Zero','012659aefb','ARES, la IA Militar',true]
 ],
 [
  ['Aldea sense Campanes','0451267bfea9','Campaner Maleït',true],
  ['Bosc de les Branques Cegues','01548cd9abfe','Caçador de les Branques',true],
  ['Catacumbes de l’Encenser','0489aefb7621','Prior de les Cendres',false],
  ['Temple del Sol Enterrat','01237baef','Custodi de l’Altar',false],
  ['Castell de les Corones Buides','048cdeab765123','El Rei Immortal',true]
 ],
 [
  ['Hospital de Quarantena','0159aedc84','Metge de la Quarantena',false],
  ['Dipòsits de Contenció','0489defb73','Subjecte de Contenció',false],
  ['Col·lector de Residus','0126abfed984','La Massa del Col·lector',false],
  ['Viver de Teixit Viu','0459a6237bf','Matriu del Viver',true],
  ['Cambra de la Soca Zero','01598cdefb73','Soca Zero',false]
 ],
 [
  ['Camp de Llunes Trencades','01237659abfed','El Cartògraf del Buit',true],
  ['Temple de l’Estrella Cega','0456a9def','Oracle de l’Estrella',false],
  ['Ciutat sobre l’Abisme','01548cdeab73','Custodi de la Passarel·la',true],
  ['Fortalesa dels Ecos','0489a67321','La Veu de l’Eco',false],
  ['El Llindar Fracturat','01237659dc84','L’Entitat del Llindar',true]
 ]
];
const levelRoutes=worldStages.flatMap((stages,worldIndex)=>stages.map(([name,layout,bossName,outdoors],index)=>{
 const original=originalRoutes[index];
 if(!layout)return {...original,name,bossName,outdoors,theme:worldIndex};
 const route=Array.from(layout,room=>parseInt(room,16));
 const middle=route[Math.floor(route.length/2)];
 const arena=route[route.length-2];
 const secretRoom=route[2];
 const secretSide=secretRoom%4<2?1:-1;
 const rosters=[[0,1,2,3],[1,6,7,8],[0,2,3,6],[3,4,5,7],[5,6,8,9]];
 const roster=Array.from({length:5+index+Math.floor(worldIndex/2)},(_,slot)=>rosters[worldIndex][(slot+index)%4]);
 const terraces=[
  [0,.25,.55,.35],[0,.31,.66,.88],[0,.34,-.35,.48],
  [.24,-.25,-.46,.05],[0,.48,.86,.28]
 ][worldIndex].map((height,part)=>height+(part&&index%2?.08:0));
 return {name,route,roster,arenas:[middle,arena],boss:index===4?[2,8,6,5,9][worldIndex]:roster.at(-1),
  bossName,theme:worldIndex,terraces,secret:[secretRoom,secretSide],outdoors};
}));
const levels=levelRoutes.map((level,index)=>({...level,
 stage:index%5,bossHealth:[125,185,220,265,340][index%5]+Math.floor(index/5)*20
}));

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
