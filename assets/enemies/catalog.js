// Enemy entries are indexed locally by world. Slots 15–19 are the five stage bosses.
const ferroEnemyWorlds = [
 // Outer shell, highlights, joints, emissive color, and ornament family.
 {shell:'#845348',light:'#e6ba80',dark:'#2c2531',glow:'#55e2cb',finish:'wreck'},
 {shell:'#354e75',light:'#a6ddfd',dark:'#1d193a',glow:'#fd56c7',finish:'neon'},
 {shell:'#64694d',light:'#d6c59e',dark:'#292c2c',glow:'#ffd269',finish:'relic'},
 {shell:'#8a4b64',light:'#eea99b',dark:'#372039',glow:'#b3fa52',finish:'tissue'},
 {shell:'#51416e',light:'#c1aff4',dark:'#1a152b',glow:'#6ff0ff',finish:'void'}
];

const ferroEnemyProfiles = [
 // AI, health, speed, body plan, crest, armament, size, special score
 ['runner',24,2.35,'hound','visor','fangs',.88,false],
 ['spitter',30,1.33,'crawler','mask','sacs',.84,false],
 ['charger',45,1.88,'tall','horns','blade',1.07,false],
 ['ghost',24,1.90,'wraith','halo','orb',.97,false],
 ['sniper',34,1.00,'tall','visor','rifle',1.02,false],
 ['tank',65,.88,'bulwark','mask','hammer',1.18,false],
 ['strafer',33,1.95,'hound','horns','blade',.93,false],
 ['burst',42,1.21,'walker','split','cannon',1.00,true],
 ['guard',57,1.23,'bulwark','visor','shield',1.12,true],
 ['ghost',30,1.94,'winged','split','fangs',.87,false],
 ['spitter',38,1.31,'worm','mask','orb',.98,false],
 ['charger',52,1.71,'walker','halo','hammer',1.04,true],
 ['tank',66,.97,'pillar','split','cannon',1.16,true],
 ['runner',28,2.20,'crawler','horns','fangs',.92,false],
 ['strafer',43,1.64,'wraith','visor','sacs',.99,true],
 ['boss',150,1.08,'walker','horns','blade',1.35,true],
 ['boss',200,1.13,'winged','halo','rifle',1.40,true],
 ['boss',240,1.02,'bulwark','split','hammer',1.44,true],
 ['boss',290,1.10,'crawler','mask','cannon',1.46,true],
 ['boss',370,1.02,'pillar','horns','orb',1.52,true]
];

const ferroEnemyNames = [
 [
  "Corc de quilla",
  "Cranc de la sentina",
  "Corsari cosit",
  "Espectre del fanal",
  "Vigia dels esculls",
  "Carcassa d’àncora",
  "Escurçó de manglar",
  "Canoner ofegat",
  "Bussó de bronze",
  "Gavina d’ossos",
  "Sangonera del rom",
  "Esquelet del barril",
  "Ídol de corall",
  "Pop de la pólvora",
  "Sirena d’algues"
 ],
 [
  "Rata de silici",
  "Aranya de fibra",
  "Motorista desossat",
  "Fantasma de píxels",
  "Vigia d’infraroig",
  "Blindat de trànsit",
  "Drone de càrrega",
  "Fuseller d’arc",
  "Escut de mercuri",
  "Vespa de neó",
  "Sonda magneto",
  "Policia de crom",
  "Reactor errant",
  "Centpeus de cable",
  "Proxy de quars"
 ],
 [
  "Llop d’heura",
  "Cranc de sepulcre",
  "Botxí del ferro",
  "Ànima de la cripta",
  "Arquer sense rostre",
  "Gòlem de granit",
  "Senglar del fossat",
  "Monjo de les brases",
  "Cavaller del reliquiari",
  "Corb ossificat",
  "Arrel de cementiri",
  "Penitent encadenat",
  "Gàrgola de pissarra",
  "Escorpí de l’ossari",
  "Bruixa del vern"
 ],
 [
  "Rata de cultiu",
  "Carronya de sis potes",
  "Infermer mutat",
  "Aerosol vivent",
  "Tirador del cordó",
  "Tanc d’epidermis",
  "Larva del filtre",
  "Esputador de sèrum",
  "Quarantenari blindat",
  "Mosquit de la soca",
  "Pòlip del desguàs",
  "Subjecte del davantal",
  "Tumor caminant",
  "Tenalla de teixit",
  "Medusa de reactiu"
 ],
 [
  "Sabues del buit",
  "Aranya de basalts",
  "Executor d’òrbita",
  "Eco desdoblat",
  "Vigia del paral·laxi",
  "Colós de gravetat",
  "Drac de pols lunar",
  "Corista de l’eclipsi",
  "Custodi d’obsidiana",
  "Falena de l’horitzó",
  "Anèl·lid còsmic",
  "Pelegrí sense ombra",
  "Monòlit fracturat",
  "Estrella carronyera",
  "Vestigi prismàtic"
 ]
];

const types = ferroEnemyWorlds.flatMap((world, theme) =>
 ferroEnemyProfiles.map(([kind,hp,speed,body,crest,arm,size,special], slot) => ({
  id:theme*ferroEnemyProfiles.length+slot, theme, slot, kind, hp, speed, body, crest, arm,
  size, special, world, name:ferroEnemyNames[theme][slot] ?? ferroWorldLevels[theme][slot-15].bossName
 }))
);
