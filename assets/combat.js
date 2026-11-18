// Weapon damage, cadence in seconds, ammo cost and spread.
const guns=[
 {name:'Martell d’Arc',damage:24,rate:.28,cost:0,color:'#75eaf1',spread:.055,range:12,targets:1,sound:188},
 {name:'Retallada',damage:132,rate:.95,cost:2,color:'#ffc48e',spread:.30,range:5.6,targets:4,sound:102},
 {name:'Perforadora',damage:19,rate:.105,cost:1,color:'#ffdf7c',spread:.075,range:11,targets:1,sound:237},
 {name:'Llança de Plasma',damage:63,rate:.43,cost:2,color:'#7af4c6',spread:.04,range:15,targets:3,sound:361},
 {name:'Forn de Butxaca',damage:105,rate:.72,cost:3,color:'#ff6944',spread:.12,range:10,targets:1,sound:68},
 {name:'Llançamíssils',damage:150,rate:1.10,cost:4,color:'#ff9c48',sound:82,projectile:{speed:12,radius:3.1,life:2.6}},
 {name:'Nucli Omega',damage:260,rate:1.85,cost:8,color:'#a4ff78',sound:130,projectile:{speed:6,radius:5.5,life:2.9,charge:.42}}
];

function blastDamage(distance,radius,power){
 return distance>=radius?0:power*(1-distance/radius)**1.25;
}

function specialArsenal(level){
 return [5,6].filter(id=>level>(id===5?5:10));
}

const weaponMotionProfiles=[
 [113,1.8,2.2,4],[136,2.6,1.65,8],[126,1.7,2.55,3],[122,2.3,2.05,4],
 [138,2.5,1.8,6],[132,3.15,1.46,10],[140,2.85,1.58,12]
];
const weaponMuzzles=[[.48,.41],[.47,.53],[.48,.39],[.47,.31],[.48,.32],[.50,.045],[.50,.045]];

function weaponMotion(id,time,walk,secondsEquipped,flash,ambient){
 const [width,sway,pace,kick]=weaponMotionProfiles[id];
 const amplitude=ambient?1:.38;
 const breath=time*pace+id*.61;
 const recoil=Math.max(0,flash/.105)**2*kick;
 const equip=Math.max(0,1-secondsEquipped/.24)**2;
 return {
  width,x:Math.sin(breath*.64)*sway*amplitude+Math.sin(walk*.48)*3*(1-equip),
  y:(Math.cos(breath)+.32*Math.sin(breath*1.84))*sway*amplitude+Math.sin(walk)*1.8+recoil+equip*49,
  roll:(Math.sin(breath*.77)*.026*amplitude+Math.cos(walk*.48)*.013)+equip*.16-recoil*.003
 };
}

function weaponViewmodel(id,{width,x,y,roll},heavy){
 const height=width*(heavy?176/224:.70);
 const [u,v]=weaponMuzzles[heavy?id:Math.min(id,4)];
 const muzzle=[width*(u-.5),height*(v-1)];
 const ca=Math.cos(roll),sa=Math.sin(roll);
 x+=240;y+=249;
 return {width,height,x,y,roll,muzzle,screenMuzzle:[x+muzzle[0]*ca-muzzle[1]*sa,y+muzzle[0]*sa+muzzle[1]*ca]};
}

function muzzleInWorld([x,y],player,eye,plane,height,focal){
 const depth=.48,lateral=(x/240-1)*plane*depth;
 const ca=Math.cos(player.a),sa=Math.sin(player.a);
 return [player.x+ca*depth-sa*lateral,player.y+sa*depth+ca*lateral,eye-(y/270-.5)*height*depth/focal];
}

function boltTrailPoint(bolt,behind=0){
 const distance=Math.max(0,bolt.traveled-behind);
 const join=.95,pathDistance=Math.max(join,distance);
 const point=[bolt.origin[0]+bolt.dx*pathDistance,bolt.origin[1]+bolt.dy*pathDistance,bolt.altitude];
 if(distance>=join)return point;
 return point.map((value,axis)=>bolt.muzzle[axis]+(value-bolt.muzzle[axis])*distance/join);
}
