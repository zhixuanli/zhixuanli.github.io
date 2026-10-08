(function(){
  'use strict';
  const root=document.getElementById('prototype-space-widget');
  if(!root)return;
  const panel=document.getElementById('prototype-space');
  const canvas=document.getElementById('prototype-space-canvas'),ctx=canvas.getContext('2d');
  const rotation=document.getElementById('space-rotate'),tooltip=document.getElementById('space-tooltip');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const initial={yaw:-.58,pitch:.36,zoom:1};
  const camera={...initial},velocity={yaw:0,pitch:0,zoom:0};
  let points,width=0,height=0,canvasScale=1,extent=1,visible=false,rotate=!reduce.matches,raf=0,last=0,target=null,hits=[];
  const pointers=new Map();let gesture=null;
  const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const wrap=n=>((n+Math.PI)%tau+tau)%tau-Math.PI;
  function readPalette(){
    const style=getComputedStyle(root);
    const token=name=>style.getPropertyValue(name).trim();
    return {
      ink:style.color, muted:token('--muted'), surface:token('--pv-section-surface'),
      grid:token('--line'), axis:token('--pv-space-axis'), cloud:token('--pv-space-cloud'),
      colors:{27:token('--pv-space-p27'),31:token('--pv-space-p31')}
    };
  }
  let palette=readPalette();
  function isActive(){return points&&panel.classList.contains('is-active')&&visible&&!document.hidden&&!document.querySelector('dialog[open]');}
  function paintRotation(){rotation.textContent=rotate?'Pause':'Rotate';rotation.setAttribute('aria-pressed',String(rotate));rotation.setAttribute('aria-label',rotate?'Pause 3D rotation':'Rotate 3D prototype space');}
  function line(a,b,color,lineWidth=1,dash=[]){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function star(x,y,r,color){ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;const px=x+Math.cos(angle)*rr,py=y+Math.sin(angle)*rr;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=palette.surface;ctx.lineWidth=.6;ctx.stroke();}
  function label(text,point,offset,color,placed){
    ctx.font='600 11px -apple-system,BlinkMacSystemFont,Arial,sans-serif';const w=ctx.measureText(text).width+13,h=22;
    const choices=[offset,[offset[0],-offset[1]-h],[-w-12,offset[1]],[12,30],[-w-12,-34]];let x=0,y=0;
    for(const delta of choices){x=clamp(point[0]+delta[0],5,width-w-5);y=clamp(point[1]+delta[1],20,height-h-5);if(!placed.some(r=>x<r.x+r.w+4&&x+w+4>r.x&&y<r.y+r.h+4&&y+h+4>r.y))break;}
    placed.push({x,y,w,h});line(point,[clamp(point[0],x,x+w),clamp(point[1],y,y+h)],color,.7,[2,3]);
    ctx.fillStyle=palette.surface;ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillText(text,x+6,y+15);
  }
  function draw(){
    if(!points||!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const {ink,muted,surface,grid,axis,cloud,colors}=palette;
    const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch),scale=Math.min(width*.38,height*.43)/extent*camera.zoom;
    const project=p=>{const x=p[0]*cy-p[1]*sy,y=p[0]*sy+p[1]*cy;return [width*.5+x*scale,height*.49+(y*sp-p[2]*cp)*scale,y*cp+p[2]*sp];};
    const e=extent*.9;
    for(let i=0;i<=4;i++){
      const v=-e+i*e/2;
      line(project([-e,v,-e]),project([e,v,-e]),grid,.7);
      line(project([v,-e,-e]),project([v,e,-e]),grid,.7);
    }
    const origin=[-e,-e,-e],ends=[[e,-e,-e],[-e,e,-e],[-e,-e,e]];
    ends.forEach(end=>line(project(origin),project(end),axis,.8));
    [[e,-e,e],[-e,e,e],[e,e,-e]].forEach(end=>{
      for(let axis=0;axis<3;axis++){if(end[axis]===e){const begin=[...end];begin[axis]=-e;line(project(begin),project(end),grid,.65);}}
    });
    ctx.fillStyle=cloud;
    for(const point of points.background){const p=project(point);if(p[0]<-2||p[0]>width+2||p[1]<-2||p[1]>height+2)continue;ctx.fillRect(p[0]-.7,p[1]-.7,1.4,1.4);}
    const q=project(points.query),keys=points.prototypes.map(project);hits=[];
    keys.map((p,id)=>({p,id})).sort((a,b)=>a.p[2]-b.p[2]).forEach(({p,id})=>{star(p[0],p[1],3.9,axis);hits.push({x:p[0],y:p[1],id});});
    points.selected.forEach(id=>line(q,keys[id],colors[id],1,[3,3]));
    points.selected.forEach(id=>star(keys[id][0],keys[id][1],9,colors[id]));
    ctx.beginPath();ctx.moveTo(q[0],q[1]-6);ctx.lineTo(q[0]+6,q[1]);ctx.lineTo(q[0],q[1]+6);ctx.lineTo(q[0]-6,q[1]);ctx.closePath();ctx.fillStyle=surface;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.6;ctx.stroke();
    const placed=[];
    label('P27 · '+points.weights[27].toFixed(2),keys[27],[15,-30],colors[27],placed);
    label('P31 · '+points.weights[31].toFixed(2),keys[31],[-88,-34],colors[31],placed);
    label('Current input',q,[17,15],ink,placed);
    ends.forEach((end,i)=>{
      const p=project(end);ctx.font='10px -apple-system,BlinkMacSystemFont,Arial,sans-serif';const text='PC'+(i+1)+' ('+(points.variance[i]*100).toFixed(1)+'%)',w=ctx.measureText(text).width;
      const x=clamp(p[0]-w/2,6,width-w-6),y=clamp(p[1]+(i===2?-10:16),36,height-3);ctx.fillStyle=surface;ctx.fillRect(x-3,y-10,w+6,14);ctx.fillStyle=muted;ctx.fillText(text,x,y);
    });
    ctx.font='10px -apple-system,BlinkMacSystemFont,Arial,sans-serif';ctx.fillStyle=muted;ctx.fillText('Training-fit PCA · '+(points.variance.reduce((a,b)=>a+b,0)*100).toFixed(1)+'% variance',10,14);
  }
  function resize(){
    width=canvas.clientWidth;
    height=canvas.clientHeight;
    if(!width||!height)return;
    canvasScale=canvas.getBoundingClientRect().width/width;
    const pixelRatio=Math.min(devicePixelRatio||1,2)*canvasScale;
    canvas.width=Math.round(width*pixelRatio);
    canvas.height=Math.round(height*pixelRatio);
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    draw();
  }
  function animate(time){
    raf=0;if(!isActive()){last=0;return;}
    const dt=last?Math.min((time-last)/1000,.032):1/60;last=time;
    if(target){
      let distance=0;
      for(const key of ['yaw','pitch','zoom']){velocity[key]+=(180*(target[key]-camera[key])-27*velocity[key])*dt;camera[key]+=velocity[key]*dt;distance+=Math.abs(target[key]-camera[key])+Math.abs(velocity[key]);}
      if(distance<.001){Object.assign(camera,target);target=null;Object.keys(velocity).forEach(k=>velocity[k]=0);}
    }
    if(rotate)camera.yaw=wrap(camera.yaw+dt*.075);
    draw();if(rotate||target)raf=requestAnimationFrame(animate);else last=0;
  }
  function sync(){if(!isActive()){cancelAnimationFrame(raf);raf=0;last=0;return;}if((rotate||target)&&!raf)raf=requestAnimationFrame(animate);}
  function pause(){rotate=false;paintRotation();sync();}
  function moveTo(next){pause();target={...camera,...next};if(reduce.matches){Object.assign(camera,target);target=null;draw();}else sync();}
  function reset(){moveTo({yaw:camera.yaw+wrap(initial.yaw-camera.yaw),pitch:initial.pitch,zoom:1});}
  function zoom(delta){moveTo({zoom:clamp((target||camera).zoom+delta,.65,2)});}
  rotation.addEventListener('click',()=>{rotate=!rotate;target=null;paintRotation();sync();});
  document.getElementById('space-reset').addEventListener('click',reset);
  document.getElementById('space-zoom-in').addEventListener('click',()=>zoom(.15));
  document.getElementById('space-zoom-out').addEventListener('click',()=>zoom(-.15));
  function beginGesture(){
    const values=[...pointers.values()];gesture=values.length===1?{point:values[0],yaw:camera.yaw,pitch:camera.pitch}:{distance:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),zoom:camera.zoom};
  }
  canvas.addEventListener('pointerdown',event=>{pause();target=null;Object.keys(velocity).forEach(k=>velocity[k]=0);tooltip.hidden=true;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-grabbing');canvas.focus({preventScroll:true});beginGesture();});
  canvas.addEventListener('pointermove',event=>{
    if(pointers.has(event.pointerId)){
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const values=[...pointers.values()];
      if(values.length===1&&gesture.point){camera.yaw=wrap(gesture.yaw-(event.clientX-gesture.point.x)/canvasScale*.008);camera.pitch=clamp(gesture.pitch+(event.clientY-gesture.point.y)/canvasScale*.006,.06,1.32);}
      else if(values.length>=2&&gesture.distance){camera.zoom=clamp(gesture.zoom*Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)/gesture.distance,.65,2);}
      draw();return;
    }
    const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/canvasScale,y=(event.clientY-rect.top)/canvasScale;
    const hit=hits.map(h=>({...h,distance:Math.hypot(h.x-x,h.y-y)})).filter(h=>h.distance<11).sort((a,b)=>a.distance-b.distance)[0];
    tooltip.hidden=!hit;if(hit){tooltip.textContent='P'+hit.id+' · matching weight '+points.weights[hit.id].toFixed(4);tooltip.style.left=clamp(x+12,8,width-205)+'px';tooltip.style.top=clamp(y-30,20,height-30)+'px';}
  });
  function endPointer(event){pointers.delete(event.pointerId);if(pointers.size)beginGesture();else{gesture=null;canvas.classList.remove('is-grabbing');}}
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);canvas.addEventListener('pointerleave',()=>tooltip.hidden=true);
  canvas.addEventListener('wheel',event=>{if(document.activeElement!==canvas)return;event.preventDefault();event.stopPropagation();zoom(event.deltaY<0?.12:-.12);},{passive:false});
  canvas.addEventListener('keydown',event=>{
    const base=target||camera;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','=','-',' '].includes(event.key)){event.preventDefault();event.stopPropagation();}else return;
    if(event.key==='Home')reset();else if(event.key==='+'||event.key==='=')zoom(.15);else if(event.key==='-')zoom(-.15);else if(event.key===' '){rotate=!rotate;target=null;paintRotation();sync();}
    else moveTo({yaw:base.yaw+(event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0),pitch:clamp(base.pitch+(event.key==='ArrowUp'?.08:event.key==='ArrowDown'?-.08:0),.06,1.32)});
  });
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(()=>{
    palette=readPalette();
    draw();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(root);
  new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});
  new MutationObserver(sync).observe(document.getElementById('figure-dialog'),{attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',sync);
  reduce.addEventListener('change',()=>{if(reduce.matches){rotate=false;if(target){Object.assign(camera,target);target=null;}paintRotation();draw();}sync();});
  paintRotation();
  fetch('static/data/prototype-space.json').then(response=>{if(!response.ok)throw Error('Coordinates unavailable');return response.json();}).then(data=>{
    points=data;extent=Math.max(...data.background.flat().map(Math.abs),...data.prototypes.flat().map(Math.abs),...data.query.map(Math.abs))*1.1;
    document.getElementById('space-status').textContent='';resize();sync();
  }).catch(()=>{document.getElementById('space-status').textContent='The 3D view could not load. The original paper figure is available.';});
}());
