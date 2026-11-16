// Enemy entries: name, effect color, AI archetype, hit points. IDs follow sprite order.
const types=[
 ['Corc de coure','#df965e','runner',24],['Càntir cec','#9cd460','spitter',33],
 ['Guillotina','#dc6961','charger',49],['Fum de sutge','#aa95da','ghost',26],
 ['Monja de sal','#eae4bc','sniper',38],['Cranc de caldera','#ed9634','tank',78],
 ['Bessó invertit','#63d0df','strafer',38],['Niu de claus','#d77ab0','burst',47],
 ['Custodi de vidre','#89b3fb','guard',70],['Cor de la foneria','#ff5641','boss',240]
];

// Weapon damage, cadence in seconds, ammo cost and spread.
const guns=[
 {name:'Martell d’Arc',damage:24,rate:.28,cost:0,color:'#75eaf1',spread:.055,range:12,targets:1,sound:188},
 {name:'Retallada',damage:132,rate:.95,cost:2,color:'#ffc48e',spread:.30,range:5.6,targets:4,sound:102},
 {name:'Perforadora',damage:19,rate:.105,cost:1,color:'#ffdf7c',spread:.075,range:11,targets:1,sound:237},
 {name:'Llança de Plasma',damage:63,rate:.43,cost:2,color:'#7af4c6',spread:.04,range:15,targets:3,sound:361},
 {name:'Forn de Butxaca',damage:105,rate:.72,cost:3,color:'#ff6944',spread:.12,range:10,targets:1,sound:68}
];
