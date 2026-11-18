const ferroPhoto=(()=>{
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function start(player,eye){
  return {x:player.x,y:player.y,z:eye,a:player.a,pitch:0,zoom:1};
 }
 function aim(camera,dx,dy){
  camera.a+=dx;
  camera.pitch=clamp(camera.pitch+dy,-.52,.52);
 }
 function moveCamera(camera,forward,strafe,lift,dt,move,floor,ceiling,outdoors){
  const scale=2.8*dt/Math.max(1,Math.hypot(forward,strafe));
  const ca=Math.cos(camera.a),sa=Math.sin(camera.a);
  move(camera,(ca*forward-sa*strafe)*scale,(sa*forward+ca*strafe)*scale,.16,camera.z-.14);
  const ground=floor(camera.x,camera.y);
  camera.z=clamp(camera.z+lift*dt*1.8,ground+.18,outdoors?4.4:ceiling-.16);
 }
 return {start,aim,moveCamera};
})();
