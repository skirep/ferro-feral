const ferroViewport=(()=>{
 function size(longSide,width,height){
  if(!(width>0&&height>0)){width=16;height=9}
  const scale=longSide/Math.max(width,height);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
 }

 function projection(width,height){
  // Share aspect-ratio changes between both axes, preserving the 16:9 framing.
  const scale=Math.sqrt(width*height/(480*270));
  return {plane:.69*width/(480*scale),focal:225*scale};
 }

 function ui(width,height){
  const scale=Math.min(width/480,height/270);
  const w=width/scale,h=height/scale;
  return {scale,w,h,x:(w-480)/2,y:h-270};
 }

 function muzzle([x,y],ui){
  return [(x+ui.x)/ui.w*480,(y+ui.y)/ui.h*270];
 }

 return {size,projection,ui,muzzle};
})();
