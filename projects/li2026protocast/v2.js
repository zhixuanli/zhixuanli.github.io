(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const compactCharts = matchMedia('(max-width:480px)');
  const images = 'static/images/';
  const state = { variable:'temperature', caseId:'16212', baseline:'PredFormer', step:0, prototypeHour:12, storm:'Doksuri', trackFrame:0, leadVariable:'UV10', leadHour:12, benchmark:'globalForecast', focusedCurve:null };
  let data, extra;
  let fieldRevision=0, trackRevision=0, leadRevision=0;
  const holdDuration=1500, resetDuration=460;
  const motionEasing='cubic-bezier(.22,1,.36,1)';
  const clampProgress=value=>Math.max(0,Math.min(1,value));
  const frameDelta=(time,last,max=100)=>last?Math.max(0,Math.min(max,time-last)):0;
  const svgCache=new Map(), imageCache=new Map(), tabSprings=new Map();

  // Small critically damped springs keep the selection surface continuous
  // when a reader reverses a selection before the previous move has settled.
  function updateTab(group, immediate=false) {
    const selected=group.querySelector('button[aria-pressed="true"]');
    if(!selected || !selected.offsetWidth)return;
    const target=[selected.offsetLeft,selected.offsetWidth];
    let spring=tabSprings.get(group);
    if(!spring){spring={x:target[0],w:target[1],vx:0,vw:0,tx:target[0],tw:target[1],raf:0,last:0};tabSprings.set(group,spring);immediate=true;}
    spring.tx=target[0];spring.tw=target[1];
    function paint(){group.style.setProperty('--tab-x',spring.x+'px');group.style.setProperty('--tab-w',spring.w+'px');}
    if(immediate || reduce.matches){cancelAnimationFrame(spring.raf);spring.raf=0;spring.x=spring.tx;spring.w=spring.tw;spring.vx=spring.vw=0;paint();return;}
    if(spring.raf)return;
    spring.last=0;
    function frame(time){
      const dt=Math.min((time-(spring.last||time-16))/1000,.032)/3;spring.last=time;
      for(let i=0;i<3;i++){
        spring.vx+=(650*(spring.tx-spring.x)-51*spring.vx)*dt;
        spring.vw+=(650*(spring.tw-spring.w)-51*spring.vw)*dt;
        spring.x+=spring.vx*dt;spring.w+=spring.vw*dt;
      }
      paint();
      if(Math.abs(spring.tx-spring.x)+Math.abs(spring.tw-spring.w)+Math.abs(spring.vx)+Math.abs(spring.vw)<.1){spring.x=spring.tx;spring.w=spring.tw;spring.raf=0;paint();return;}
      spring.raf=requestAnimationFrame(frame);
    }
    spring.raf=requestAnimationFrame(frame);
  }
  function choose(group,button){group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateTab(group);}
  document.querySelectorAll('.pv-tabs').forEach(group=>{
    updateTab(group,true);
    new ResizeObserver(()=>updateTab(group,true)).observe(group);
    group.addEventListener('keydown',event=>{
      const buttons=[...group.querySelectorAll('button')];const current=buttons.indexOf(document.activeElement);
      if(current<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[next].focus();buttons[next].click();
    });
  });
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.pv-reveal').forEach(e=>reveal.observe(e));
  document.documentElement.classList.toggle('pv-motion',!reduce.matches);

  // Count once on entry, with a fast start and a gentle 1.5-second settle.
  const counters=[...document.querySelectorAll('.pv-count')];
  const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting || entry.intersectionRatio<.4)return;
    counterObserver.unobserve(entry.target);
    const current=entry.target.querySelector('.pv-count-current');
    const target=Number(entry.target.dataset.count),started=performance.now();
    function frame(now){
      const progress=reduce.matches?1:Math.min(1,Math.max(0,(now-started)/1500));
      current.textContent=(target*(1-Math.pow(1-progress,4))).toFixed(2);
      if(progress<1)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }),{threshold:.4});
  counters.forEach(counter=>{
    if(!reduce.matches)counter.querySelector('.pv-count-current').textContent='0.00';
    counterObserver.observe(counter);
  });
  function finishCounters(){
    counterObserver.disconnect();
    counters.forEach(counter=>{counter.querySelector('.pv-count-current').textContent=counter.dataset.count;});
  }

  const fmt=(n)=>Number(n).toFixed(Math.abs(n)<1?4:2);
  function utc(value){let iso=value.replace(/(\.\d{3})\d+$/,'$1');if(!/[Zz]|[+]\d\d:\d\d$/.test(iso))iso+='Z';return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}
  function currentCase(){return data.cases.find(c=>c.id===state.caseId);}
  function currentVariable(){return data.variables.find(v=>v.key===state.variable);}
  function currentStorm(){return data.storms.find(s=>s.name===state.storm);}
  function currentLead(){const c=extra.leadwise.find(c=>c.variable===state.leadVariable);return compactCharts.matches?{...c,...c.mobile}:c;}
  function name(method){return method==='A5'?'ProtoCast':data.methods.find(m=>m.key===method).label;}
  function preload(filename){if(!imageCache.has(filename)){const image=new Image();image.src=images+filename;imageCache.set(filename,image.decode().then(()=>image));}return imageCache.get(filename);}
  async function svg(filename,scope){
    if(!svgCache.has(filename))svgCache.set(filename,fetch(images+filename).then(r=>{if(!r.ok)throw Error('Figure unavailable');return r.text();}));
    const text=await svgCache.get(filename);
    return text.replace(/id="([^"]+)"/g,(_,id)=>`id="${scope}${id}"`).replace(/url\(#([^\)]+)\)/g,(_,id)=>`url(#${scope}${id})`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#${scope}${id}"`);
  }
  function writeText(element,text){
    if(element.textContent!==text)element.textContent=text;
  }
  function animateUpdate(...elements){
    if(reduce.matches)return;
    for(const element of elements){
      element.animate([{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'none'}],
        {duration:280,easing:motionEasing});
    }
  }
  function fadePrevious(stage,previous){
    if(!previous||reduce.matches)return;
    previous.classList.add('pv-outgoing-plot');
    previous.setAttribute('aria-hidden','true');
    stage.insertBefore(previous,stage.querySelector(':scope > .pv-outgoing-plot'));
    previous.animate([{opacity:1},{opacity:0}],{duration:280,easing:motionEasing})
      .finished.then(()=>previous.remove(),()=>previous.remove());
  }
  function addMetricDirection(plot){
    const axis=[...plot.querySelectorAll('text')].find(label=>
      /^(?:T2M MAE|MSE|Mean track error) \(/.test(label.textContent.trim()));
    if(!axis)return;

    const arrow=document.createElementNS(plot.namespaceURI,'tspan');
    arrow.setAttribute('dx','.25em');
    arrow.setAttribute('dy','-.72em');
    arrow.setAttribute('rotate','90');
    arrow.setAttribute('aria-hidden','true');
    arrow.textContent='↓';
    axis.append(arrow);
    plot.setAttribute('aria-label',plot.getAttribute('aria-label')+' · Lower error is better');
  }
  function replacePlot(stage,text,animate){
    const previous=stage.firstElementChild;
    const template=document.createElement('template');
    template.innerHTML=text;
    const plot=template.content.firstElementChild;
    addMetricDirection(plot);
    if(previous)previous.replaceWith(plot);
    else stage.append(plot);
    if(animate)fadePrevious(stage,previous);
    return plot;
  }
  function observeMotion(element,onChange,threshold=.35){
    new IntersectionObserver(entries=>{
      const entry=entries[entries.length-1];
      onChange(entry.isIntersecting&&entry.intersectionRatio>=threshold);
    },{threshold}).observe(element);
  }

  // Reset the highlight layer while the gray reference and axes stay in place.
  function advanceReplay(elapsed,delta,duration,paint){
    const resetAt=duration+holdDuration;
    const next=(elapsed+delta)%(resetAt+resetDuration);
    if(next===elapsed||(next>=duration&&next<=resetAt&&elapsed>=duration&&elapsed<=resetAt))return next;
    const fade=clampProgress((next-resetAt)/resetDuration);
    const strength=1-fade*fade*(3-2*fade);
    paint(clampProgress(next/duration),strength);
    return next;
  }
  function prepareReveal(plot,key){
    const reveal=plot.querySelector(`[data-${key}-reveal]`);
    const future=plot.querySelector(`[data-${key}-future]`);
    const start=Number(reveal.getAttribute('x'));
    const first=Number(reveal.getAttribute('width'));
    const full=reveal.dataset.end?Number(reveal.dataset.end)-start:Number(reveal.dataset.fullWidth);
    const colorClip=reveal.parentElement.id;
    plot.querySelectorAll(`[clip-path="url(#${colorClip})"],[data-history-cursor],[id$="-hover-cursor"]`)
      .forEach(layer=>layer.classList.add('pv-replay-ink'));
    return (progress,strength=1)=>{
      const width=first+(full-first)*progress;
      reveal.setAttribute('width',width);
      future.setAttribute('x',strength<1?start:start+width);
      future.setAttribute('width',strength<1?full:full-width);
      plot.style.setProperty('--pv-replay-strength',strength);
      plot.classList.toggle('is-resetting',strength<1);
      return start+width;
    };
  }
  function nearest(points,x){let selected=0;for(let i=1;i<points.length;i++)if(Math.abs(points[i][0]-x)<Math.abs(points[selected][0]-x))selected=i;return selected;}
  function svgX(event,element){return new DOMPoint(event.clientX,event.clientY).matrixTransform(element.getScreenCTM().inverse()).x;}
  function cursor(container,pointSets,index){
    const group=container.querySelector('[id$="-hover-cursor"]');if(!group)return;
    const keys=Object.keys(pointSets),x=pointSets[keys[0]][index][0];
    group.style.display='';
    const line=group.querySelector('[id$="-cursor-line"]');line.setAttribute('x1',x);line.setAttribute('x2',x);
    keys.forEach(key=>{const circle=group.querySelector(`[id$="-cursor-${key}"]`);if(circle){circle.setAttribute('cx',pointSets[key][index][0]);circle.setAttribute('cy',pointSets[key][index][1]);}});
  }

  const reelIntro=420;
  const reelChapters=[
    {draw:3200,hold:1450},
    {draw:3000,hold:1550},
    {draw:4600,hold:1700}
  ];
  const reelStops=[0];
  for(const chapter of reelChapters)reelStops.push(reelStops.at(-1)+reelIntro+chapter.draw+chapter.hold);
  const reelDuration=reelStops.at(-1);
  const reelViews=[...$('reel').querySelectorAll('[data-scene]')];
  const reelCopy=$('reel').querySelector('.pv-reel-copy');
  let reelScene=0,reelElapsed=0,reelPlaying=false,reelRaf=0,reelLast=0,reelVisible=false,reelWanted=!reduce.matches;
  let reelTrackReveal,reelFrameIndex=-1;
  function setScene(index){
    reelScene=index;
    for(const element of reelViews){
      const active=Number(element.dataset.scene)===index;
      element.classList.toggle('is-active',active);
      element.inert=!active;
      element.setAttribute('aria-hidden',String(!active));
    }
    const tabs=$('reel-tabs');
    choose(tabs,tabs.querySelector(`[data-scene-button="${index}"]`));
  }
  function reelFrame(still=false){
    const phase=reelElapsed<reelStops[1]?0:reelElapsed<reelStops[2]?1:2;
    if(phase!==reelScene)setScene(phase);
    const within=reelElapsed-reelStops[phase]-reelIntro;
    const part=still?1:clampProgress(within/reelChapters[phase].draw);
    if(phase===0)$('reel-wipe').style.setProperty('--wipe',still?'50%':(2+96*part)+'%');
    if(phase===1){
      const error=$('reel-errors');
      error.style.setProperty('--error-scan',(2+96*part)+'%');
      error.style.setProperty('--scan-opacity',still?0:1-clampProgress((within-reelChapters[phase].draw)/240));
      error.classList.toggle('is-settled',part===1);
    }
    if(phase===2){
      const storm=data.storms[0];
      const index=Math.floor(part*(storm.count-1));
      if(index!==reelFrameIndex){
        reelFrameIndex=index;
        $('reel-storm').querySelectorAll('.track-sample').forEach(mark=>{
          mark.classList.toggle('is-future',Number(mark.dataset.frame)>index);
          mark.classList.toggle('is-current',Number(mark.dataset.frame)===index);
        });
        $('reel-storm-time').textContent=`${utc(storm.frames[index].time)} UTC · +3h center · initialization ${index+1} / ${storm.count}`;
      }
      reelTrackReveal(part);
    }
    const progress=reelElapsed/reelDuration;
    $('reel-progress').style.transform=`scaleX(${progress})`;
    $('reel-progress').parentElement.setAttribute('aria-valuenow',Math.round(100*progress));
  }
  function paintReel(){
    const button=$('reel-play');
    button.setAttribute('aria-label',reelWanted?'Pause research preview':'Play research preview');
    button.innerHTML=reelWanted?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
  }
  function setReelWanted(value){
    reelWanted=value;
    paintReel();
    syncReelPlayback();
  }
  function syncReelPlayback(){
    const active=reelWanted&&reelVisible&&!document.hidden&&!dialog.open&&!reelCopy.contains(document.activeElement);
    if(active===reelPlaying)return;
    reelPlaying=active;
    cancelAnimationFrame(reelRaf);
    reelLast=0;
    if(active)reelRaf=requestAnimationFrame(reelTick);
    syncTrackPlayback();
  }
  function reelTick(time){
    reelElapsed=(reelElapsed+frameDelta(time,reelLast,70))%reelDuration;
    reelLast=time;
    reelFrame();
    reelRaf=requestAnimationFrame(reelTick);
  }
  function bindReel(){
    reelTrackReveal=prepareReveal($('reel-storm').querySelector('svg'),'curve');
    reelFrame(true);
    paintReel();
    $('reel-play').addEventListener('click',()=>setReelWanted(!reelWanted));
    $('reel-restart').addEventListener('click',()=>{
      reelElapsed=0;
      reelFrame();
      setReelWanted(true);
    });
    $('reel-tabs').addEventListener('click',event=>{
      const button=event.target.closest('[data-scene-button]');
      if(!button)return;
      reelElapsed=reelStops[Number(button.dataset.sceneButton)];
      reelFrame(!reelWanted);
    });
    reelCopy.addEventListener('focusin',syncReelPlayback);
    reelCopy.addEventListener('focusout',()=>queueMicrotask(syncReelPlayback));
    observeMotion($('reel').querySelector('.pv-reel-art'),visible=>{
      reelVisible=visible;
      syncReelPlayback();
    },.45);
  }

  let prototypePlaying=false,prototypeRaf=0,prototypeLast=0,prototypeElapsed=0,prototypeVisible=false,prototypeReady=false,prototypePlayback='auto';
  const prototypeDrawDuration=6600;
  let drawPrototypeReveal,drawHistoryReveal;
  function syncPrototypePlayback(){
    const wantsPlayback=prototypePlayback==='play'||(prototypePlayback==='auto'&&!reduce.matches);
    const shouldPlay=prototypeReady&&state.step===2&&prototypeVisible&&!document.hidden&&!dialog.open&&wantsPlayback;
    if(shouldPlay!==prototypePlaying)setPrototypePlaying(shouldPlay);
  }
  function setPrototypePlaying(value){
    prototypePlaying=value;cancelAnimationFrame(prototypeRaf);prototypeLast=0;
    const button=$('prototype-play');button.textContent=value?'Pause':'Play';
    button.setAttribute('aria-label',value?'Pause forecast error animation':'Play forecast error animation');
    if(!value)return;
    function frame(time){
      if(!prototypePlaying)return;
      prototypeElapsed=advanceReplay(prototypeElapsed,frameDelta(time,prototypeLast),prototypeDrawDuration,paintPrototypeReplay);
      prototypeLast=time;
      prototypeRaf=requestAnimationFrame(frame);
    }
    prototypeRaf=requestAnimationFrame(frame);
  }
  function paintPrototypeReplay(progress,strength){renderPrototypeHour(1+11*progress,strength);}
  function scrubPrototypeHour(hour){
    prototypePlayback='paused';syncPrototypePlayback();renderPrototypeHour(hour);
    prototypeElapsed=(state.prototypeHour-1)/11*prototypeDrawDuration;
  }
  function setPrototypeStep(step){
    const entering=state.step!==Number(step);
    state.step=Number(step);
    for(const view of document.querySelectorAll('[data-prototype-panel],[data-story-step]')){
      const active=Number(view.dataset.prototypePanel??view.dataset.storyStep)===state.step;
      view.classList.toggle('is-active',active);
      view.inert=!active;
      view.setAttribute('aria-hidden',String(!active));
    }

    choose($('prototype-tabs'),$('prototype-tabs').querySelector(`[data-prototype-step="${state.step}"]`));
    if(state.step===1&&entering&&historyPlayback==='auto'){
      historyElapsed=0;renderHistoryProgress(reduce.matches?1:0);
    }
    if(state.step===2){
      if(entering&&prototypePlayback==='auto'&&!reduce.matches){prototypeElapsed=0;state.prototypeHour=1;}
      renderPrototypeHour(state.prototypeHour);
    }
    syncPrototypePlayback();syncHistoryPlayback();
  }
  function renderPrototypeHour(hour,strength=1){
    state.prototypeHour=Math.max(1,Math.min(12,Number(hour)));
    const position=state.prototypeHour-1;
    const index=Math.floor(position);
    const measuredHour=index+1;
    $('prototype-lead').value=measuredHour;
    writeText($('prototype-lead-label'),measuredHour+'h');
    // The cursor and readouts share the last revealed whole-hour sample.
    writeText($('prototype-full'),extra.prototype.full[index].toFixed(4)+' K');
    writeText($('prototype-removed'),extra.prototype.removed[index].toFixed(4)+' K');
    cursor($('prototype-intervention'),extra.prototype.points,index);
    drawPrototypeReveal(position/11,strength);
  }
  let historyPlaying=false,historyRaf=0,historyLast=0,historyElapsed=0,historyPlayback='auto';
  const historyDrawDuration=6600;
  function renderHistoryProgress(progress,strength=1){
    const x=drawHistoryReveal(progress,strength)-3;
    const line=$('history-stage').querySelector('[data-history-cursor]');
    line.setAttribute('x1',x);
    line.setAttribute('x2',x);
    writeText($('history-time'),String(Math.round(-11+11*progress)).replace('-','−')+'h');
  }
  function syncHistoryPlayback(){
    const wants=historyPlayback==='play'||(historyPlayback==='auto'&&!reduce.matches);
    const active=prototypeReady&&state.step===1&&prototypeVisible&&!document.hidden&&!dialog.open&&wants;
    if(active!==historyPlaying)setHistoryPlaying(active);
  }
  function setHistoryPlaying(value){
    historyPlaying=value;cancelAnimationFrame(historyRaf);historyLast=0;
    $('history-play').textContent=value?'Pause':'Play';
    $('history-play').setAttribute('aria-label',value?'Pause prototype history animation':'Play prototype history animation');
    if(!value)return;
    function frame(time){
      if(!historyPlaying)return;
      historyElapsed=advanceReplay(historyElapsed,frameDelta(time,historyLast),historyDrawDuration,renderHistoryProgress);
      historyLast=time;
      historyRaf=requestAnimationFrame(frame);
    }
    historyRaf=requestAnimationFrame(frame);
  }
  async function preparePrototype(){
    const [history,intervention]=await Promise.all([
      svg('p27-history-reveal.svg','history-'),
      svg('p27-intervention-reveal.svg','proto-')
    ]);
    drawHistoryReveal=prepareReveal(replacePlot($('history-stage'),history,false),'history');
    drawPrototypeReveal=prepareReveal(replacePlot($('prototype-intervention'),intervention,false),'prototype');
    if(reduce.matches){
      historyElapsed=historyDrawDuration;
      prototypeElapsed=prototypeDrawDuration;
    }
    renderHistoryProgress(reduce.matches?1:0);
    prototypeReady=true;
    $('history-play').addEventListener('click',()=>{
      historyPlayback=historyPlaying?'paused':'play';
      if(historyPlayback==='play'&&historyElapsed===historyDrawDuration)historyElapsed+=holdDuration;
      syncHistoryPlayback();
    });
    $('prototype-lead').addEventListener('pointerdown',()=>{prototypePlayback='paused';syncPrototypePlayback();});
    $('prototype-lead').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))scrubPrototypeHour($('prototype-lead').value);});
    $('prototype-lead').addEventListener('input',()=>scrubPrototypeHour($('prototype-lead').value));
    $('prototype-play').addEventListener('click',()=>{
      prototypePlayback=prototypePlaying?'paused':'play';
      if(prototypePlayback==='play'&&prototypeElapsed===prototypeDrawDuration)prototypeElapsed+=holdDuration;
      syncPrototypePlayback();
    });
    observeMotion($('prototype-panels'),visible=>{
      prototypeVisible=visible;
      syncPrototypePlayback();
      syncHistoryPlayback();
    });
    $('prototype-intervention').addEventListener('pointermove',event=>{if(state.step!==2||prototypePlaying)return;const element=$('prototype-intervention').querySelector('svg');if(element)scrubPrototypeHour(nearest(extra.prototype.points.full,svgX(event,element))+1);});
    const tabs=$('prototype-tabs');
    const stage=tabs.closest('.pv-prototype-stage');
    const layout=stage.parentElement;
    const stepCount=tabs.querySelectorAll('[data-prototype-step]').length;
    const pageScale=Number(getComputedStyle(document.documentElement).zoom)||1;
    function storyScroll(){
      const pinTop=parseFloat(getComputedStyle(stage).top)*pageScale;
      if(!Number.isFinite(pinTop))return;
      const track=layout.getBoundingClientRect();
      return {elapsed:pinTop-track.top,distance:track.height-stage.getBoundingClientRect().height};
    }
    tabs.addEventListener('click',event=>{
      const button=event.target.closest('[data-prototype-step]');
      if(!button)return;
      const step=Number(button.dataset.prototypeStep);
      if(step===state.step)return;
      const scroll=storyScroll();
      if(scroll){
        // Jump directly to the selected interval so the stage only changes once.
        const target=(step+.5)*scroll.distance/stepCount;
        window.scrollBy({top:target-scroll.elapsed,behavior:'instant'});
      }
      setPrototypeStep(step);
    });
    $('jump-intervention').addEventListener('click',()=>$('prototype-lead').focus());

    let storyFrame=0;
    function followStory(){
      if(storyFrame)return;
      storyFrame=requestAnimationFrame(()=>{
        storyFrame=0;
        const scroll=storyScroll();
        if(!scroll)return;
        const progress=clampProgress(scroll.elapsed/scroll.distance);
        const step=Math.min(stepCount-1,Math.floor(progress*stepCount));
        if(step!==state.step)setPrototypeStep(step);
      });
    }
    window.addEventListener('scroll',followStory,{passive:true});
    window.addEventListener('resize',followStory);
    setPrototypeStep(0);
    followStory();
  }

  let forecastPlaying=false,forecastRaf=0,forecastLast=0,forecastElapsed=0,forecastReady=false,forecastVisible=false,forecastPlayback='auto';
  let forecastShown=false;
  const forecastDrawDuration=6000;
  function syncForecastPlayback(){
    const wants=forecastPlayback==='play'||(forecastPlayback==='auto'&&!reduce.matches);
    const active=forecastReady&&forecastVisible&&!document.hidden&&!dialog.open&&wants;
    if(active!==forecastPlaying)setForecastPlaying(active);
  }
  function setForecastPlaying(value){
    forecastPlaying=value;cancelAnimationFrame(forecastRaf);forecastLast=0;
    $('forecast-play').textContent=value?'Pause':'Play';
    $('forecast-play').setAttribute('aria-label',value?'Pause forecast comparison':'Play forecast comparison');
    if(!value)return;
    function frame(time){
      if(!forecastPlaying)return;
      forecastElapsed=advanceReplay(forecastElapsed,frameDelta(time,forecastLast),forecastDrawDuration,paintForecastReplay);
      forecastLast=time;
      forecastRaf=requestAnimationFrame(frame);
    }
    forecastRaf=requestAnimationFrame(frame);
  }
  function paintForecastReplay(progress,strength){setDivider(2+96*progress,strength);}
  function takeForecastControl(){
    forecastPlayback='paused';syncForecastPlayback();
    forecastElapsed=clampProgress((Number($('forecast-divider').value)-2)/96)*forecastDrawDuration;
    $('forecast-wipe').style.setProperty('--pv-replay-strength',1);
  }
  function setDivider(value,strength=1){
    const percent=clampProgress(Number(value)/100)*100;
    const wipe=$('forecast-wipe');
    wipe.style.setProperty('--wipe',percent+'%');
    wipe.style.setProperty('--pv-replay-strength',strength);
    const range=$('forecast-divider');
    range.value=percent.toFixed(1);
    range.setAttribute('aria-valuetext',`${Math.round(percent)} percent ground truth, ${Math.round(100-percent)} percent prediction`);
  }
  function fadeForecastPlots(){
    if(reduce.matches)return;
    const wipe=$('forecast-wipe');
    const previous=document.createElement('div');
    previous.className='pv-wipe';
    previous.style.setProperty('--wipe',wipe.style.getPropertyValue('--wipe'));
    for(const id of ['forecast-prediction','forecast-target']){
      const image=$(id).cloneNode();
      image.removeAttribute('id');
      if(id==='forecast-target')
        image.style.opacity=wipe.style.getPropertyValue('--pv-replay-strength');
      previous.append(image);
    }
    fadePrevious(wipe,previous);
    for(const id of ['error-ours-image','error-baseline-image']){
      const image=$(id).cloneNode();
      image.removeAttribute('id');
      fadePrevious($(id).parentElement,image);
    }
  }
  async function renderForecast(){
    const revision=++fieldRevision,v=currentVariable(),c=currentCase(),baseline=state.baseline,values=c.values[v.key];
    forecastReady=false;syncForecastPlayback();
    const filenames=[values.A5.field,values.GT.field,values.A5.error,values[baseline].error];
    $('forecast-explorer').setAttribute('aria-busy','true');
    try{
      await Promise.all([...filenames,v.key+'-scale.png',v.key+'-error-scale.png'].map(preload));
      if(revision!==fieldRevision)return;
      if(forecastShown)fadeForecastPlots();
      ['forecast-prediction','forecast-target','error-ours-image','error-baseline-image'].forEach((id,i)=>$(id).src=images+filenames[i]);
      $('forecast-prediction').alt=`ProtoCast ${v.name.toLowerCase()} forecast, paper example ${c.id}`;$('forecast-target').alt=`Ground truth for the same ${v.name.toLowerCase()} example`;
      $('error-ours-image').alt=`ProtoCast ${v.name.toLowerCase()} absolute error`;$('error-baseline-image').alt=`${name(baseline)} ${v.name.toLowerCase()} absolute error`;
      $('variable-title').textContent=v.name;$('forecast-date').textContent=`Valid ${utc(c.valid)} UTC · +12h · 32 × 64`;
      $('error-ours-value').textContent=fmt(values.A5.mae)+' '+v.unit;$('error-baseline-value').textContent=fmt(values[baseline].mae)+' '+v.unit;$('error-baseline-name').textContent=name(baseline);$('error-unit').textContent=v.unit;
      $('field-low').textContent=fmt(v.low);$('field-high').textContent=fmt(v.high)+' '+v.unit;$('field-scale').src=images+v.key+'-scale.png';$('error-scale').src=images+v.key+'-error-scale.png';$('error-high').textContent=fmt(v.errorMax);
      $('forecast-context').textContent=`${c.label} · initialized ${utc(c.issue)} UTC · physical units`;
      if(forecastShown){
        animateUpdate($('variable-title'),$('field-low').parentElement,$('error-unit'),
          $('error-ours-value'),$('error-baseline-value'),$('error-high').parentElement);
      }else if(forecastPlayback==='auto'){
        forecastElapsed=reduce.matches?forecastDrawDuration/2:0;
        setDivider(reduce.matches?50:2);
      }
      forecastShown=true;
      forecastReady=true;
      syncForecastPlayback();
    }catch(error){$('page-status').textContent='Some forecast images could not be loaded. The original paper figures remain available.';}
    finally{
      if(revision===fieldRevision){
        $('forecast-explorer').setAttribute('aria-busy','false');
        forecastReady=forecastShown;
        syncForecastPlayback();
      }
    }
  }
  function bindForecast(){
    $('variable-tabs').addEventListener('click',event=>{const b=event.target.closest('[data-variable]');if(!b)return;state.variable=b.dataset.variable;choose($('variable-tabs'),b);renderForecast();});
    $('forecast-divider').addEventListener('pointerdown',takeForecastControl);
    $('forecast-divider').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))takeForecastControl();});
    $('forecast-divider').addEventListener('input',()=>{takeForecastControl();setDivider($('forecast-divider').value);});
    $('forecast-play').addEventListener('click',()=>{
      forecastPlayback=forecastPlaying?'paused':'play';
      if(forecastPlayback==='play'&&forecastElapsed===forecastDrawDuration)forecastElapsed+=holdDuration;
      syncForecastPlayback();
    });
    observeMotion($('forecast-wipe'),visible=>{
      forecastVisible=visible;
      syncForecastPlayback();
    });
    const handle=$('forecast-handle');let drag=null;
    handle.addEventListener('pointerdown',event=>{event.preventDefault();takeForecastControl();const rect=$('forecast-wipe').getBoundingClientRect();drag={id:event.pointerId,offset:event.clientX-(rect.left+Number($('forecast-divider').value)/100*rect.width)};handle.setPointerCapture(event.pointerId);});
    handle.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const rect=$('forecast-wipe').getBoundingClientRect();setDivider((event.clientX-rect.left-drag.offset)/rect.width*100);takeForecastControl();});
    function endDrag(){drag=null;}
    handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);handle.addEventListener('lostpointercapture',endDrag);
  }

  const sunIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>';
  const moonIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/></svg>';
  function clockPhase(time){
    const hour=(Number(time.slice(11,13))+8)%24;
    return {hour,day:hour>=6&&hour<18};
  }
  function renderDayCycle(storm){
    $('track-day-cycle').innerHTML=storm.frames.map(frame=>{
      const phase=clockPhase(frame.time);
      return `<span class="pv-day-point${phase.day?' is-day':''}" title="${String(phase.hour).padStart(2,'0')}:00 · UTC+8" aria-hidden="true">${phase.day?sunIcon:moonIcon}</span>`;
    }).join('');
  }
  let trackPlaying=false,trackRaf=0,trackLast=0,trackElapsed=0,trackReady=false,trackVisible=false,trackPlayback='auto';
  let trackPlot,drawTrackReveal;
  function syncTrackPlayback(){
    const wantsPlayback=trackPlayback==='play'||(trackPlayback==='auto'&&!reduce.matches);
    const shouldPlay=trackReady&&trackVisible&&!document.hidden&&!dialog.open&&!reelPlaying&&wantsPlayback;
    if(shouldPlay!==trackPlaying)setTrackPlaying(shouldPlay);
  }
  function takeTrackControl(){trackPlayback='paused';syncTrackPlayback();}
  function paintTrackReplay(progress,strength){
    const index=Math.floor(progress*(currentStorm().count-1)+1e-8);
    if(index!==state.trackFrame)renderTrackFrame(index);
    drawTrackReveal(progress,strength);
  }
  function renderTrackFrame(index){
    const s=currentStorm();state.trackFrame=Math.max(0,Math.min(s.count-1,Number(index)));
    trackPlot.querySelectorAll('.track-sample').forEach(mark=>{const i=Number(mark.dataset.frame);mark.classList.toggle('is-future',i>state.trackFrame);mark.classList.toggle('is-current',i===state.trackFrame);});
    const timestamp=utc(s.frames[state.trackFrame].time)+' UTC';
    $('track-range').value=state.trackFrame;
    $('track-time').textContent=timestamp;
    $('track-count').textContent=`${state.trackFrame+1} / ${s.count}`;
    const phase=clockPhase(s.frames[state.trackFrame].time),icon=$('track-day-icon');
    icon.classList.toggle('is-day',phase.day);
    icon.title=`${phase.day?'Day':'Night'} · ${String(phase.hour).padStart(2,'0')}:00 UTC+8`;
    $('track-day-cycle').querySelectorAll('.pv-day-point').forEach((point,i)=>point.classList.toggle('is-current',i===state.trackFrame));
    $('track-range').setAttribute('aria-valuetext',`Initialization ${state.trackFrame+1} of ${s.count}, +3h center valid ${timestamp}`);
  }
  function setTrackPlaying(value){
    trackPlaying=value;cancelAnimationFrame(trackRaf);trackLast=0;const b=$('track-play');
    b.setAttribute('aria-label',value?'Pause track replay':'Play track replay');b.innerHTML=value?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><span>Pause</span>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg><span>Play</span>';
    if(!value)return;
    function frame(time){
      if(!trackPlaying)return;
      const duration=(currentStorm().count-1)*1000;
      trackElapsed=advanceReplay(trackElapsed,frameDelta(time,trackLast),duration,paintTrackReplay);
      trackLast=time;
      trackRaf=requestAnimationFrame(frame);
    }
    trackRaf=requestAnimationFrame(frame);
  }
  async function renderTrack(storm=state.storm){
    const revision=++trackRevision;
    const s=data.storms.find(item=>item.name===storm);
    trackReady=false;
    syncTrackPlayback();
    try{
      const text=await svg('typhoon-'+s.name.toLowerCase()+'-reveal.svg','track-'+revision+'-');
      if(revision!==trackRevision)return;
      const changed=Boolean(trackPlot);
      trackPlot=replacePlot($('track-stage'),text,changed);
      drawTrackReveal=prepareReveal(trackPlot,'track');
      state.storm=storm;
      const frame=reduce.matches&&trackPlayback==='auto'?s.count-1:0;
      trackElapsed=frame*1000;
      $('storm-meta').textContent=`${s.count} initializations · ProtoCast vs. ${s.baselineLabel}`;
      $('track-range').max=s.count-1;
      renderDayCycle(s);
      renderTrackFrame(frame);
      drawTrackReveal(frame/(s.count-1));
      if(changed)animateUpdate($('storm-meta'),$('track-time'),$('track-count'),$('track-day-cycle'));
    }catch(error){
      if(revision===trackRevision)$('page-status').textContent='The selected storm figure could not be loaded.';
    }finally{
      if(revision===trackRevision){
        trackReady=Boolean(trackPlot);
        syncTrackPlayback();
      }
    }
  }
  function bindTrack(){
    $('track-day-icon').innerHTML=sunIcon.replace('<svg','<svg class="pv-sun"')+moonIcon.replace('<svg','<svg class="pv-moon"');
    $('storm-tabs').addEventListener('click',event=>{
      const button=event.target.closest('[data-storm]');
      if(!button||button.getAttribute('aria-pressed')==='true')return;
      choose($('storm-tabs'),button);
      renderTrack(button.dataset.storm);
    });
    $('track-play').addEventListener('click',()=>{
      trackPlayback=trackPlaying?'paused':'play';
      if(trackPlayback==='play'&&trackElapsed===(currentStorm().count-1)*1000)trackElapsed+=holdDuration;
      syncTrackPlayback();
    });
    $('track-range').addEventListener('pointerdown',takeTrackControl);
    $('track-range').addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))takeTrackControl();
    });
    $('track-range').addEventListener('input',()=>{
      if(!trackPlot)return;
      takeTrackControl();
      const frame=Number($('track-range').value);
      trackElapsed=frame*1000;
      renderTrackFrame(frame);
      drawTrackReveal(frame/(currentStorm().count-1));
    });
    observeMotion($('track-stage'),visible=>{
      trackVisible=visible;
      syncTrackPlayback();
    });
  }

  let leadPlaying=false,leadRaf=0,leadLast=0,leadElapsed=0,leadReady=false,leadVisible=false,leadPlayback='auto';
  const leadDrawDuration=6600;
  let leadPlot,leadChart,drawLeadReveal;
  function syncLeadPlayback(){
    const wantsPlayback=leadPlayback==='play'||(leadPlayback==='auto'&&!reduce.matches);
    const shouldPlay=leadReady&&leadVisible&&!document.hidden&&!dialog.open&&wantsPlayback;
    if(shouldPlay!==leadPlaying)setLeadPlaying(shouldPlay);
  }
  function setLeadPlaying(value){
    leadPlaying=value;cancelAnimationFrame(leadRaf);leadLast=0;
    const button=$('lead-play');button.textContent=value?'Pause':'Play';
    button.setAttribute('aria-label',value?'Pause lead-wise MSE animation':'Play lead-wise MSE animation');
    if(!value)return;
    function frame(time){
      if(!leadPlaying)return;
      leadElapsed=advanceReplay(leadElapsed,frameDelta(time,leadLast),leadDrawDuration,paintLeadReplay);
      leadLast=time;
      leadRaf=requestAnimationFrame(frame);
    }
    leadRaf=requestAnimationFrame(frame);
  }
  function paintLeadReplay(progress,strength){renderLeadHour(1+11*progress,strength);}
  function scrubLeadHour(hour){
    if(!leadChart)return;
    leadPlayback='paused';syncLeadPlayback();renderLeadHour(hour);
    leadElapsed=(state.leadHour-1)/11*leadDrawDuration;
  }
  function renderLeadHour(hour,strength=1){
    state.leadHour=Math.max(1,Math.min(12,Number(hour)));
    const c=leadChart,position=state.leadHour-1,index=Math.round(position);
    $('lead-range').value=index+1;
    writeText($('lead-hour'),(index+1)+'h');
    // The readouts stay on the paper's measured whole-hour values.
    Object.keys(c.curves).forEach(method=>{const value=$('lead-values').querySelector(`[data-method-value="${method}"]`);if(value)writeText(value,fmt(c.curves[method][index]));});
    const low=Math.floor(position),high=Math.min(11,low+1),fraction=position-low,points={};
    for(const method of Object.keys(c.curves)){
      const a=c.points[method][low],b=c.points[method][high];
      points[method]=[[a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction]];
    }
    cursor(leadPlot,points,0);
    drawLeadReveal(position/11,strength);
  }
  function focusCurve(method){
    state.focusedCurve=method;
    Object.keys(extra.colors).forEach(m=>{const group=leadPlot.querySelector(`[id$="-curve-${m}"]`);if(group)group.style.opacity=method&&m!==method?'.18':'1';});
    $('lead-values').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.method===method)));
  }
  async function renderLead(resetReplay=false){
    const revision=++leadRevision,c=currentLead();
    leadReady=false;
    syncLeadPlayback();
    try{
      const text=await svg(c.svg.replace(/\.svg$/,'-reveal.svg'),'result-'+revision+'-');
      if(revision!==leadRevision)return;
      if(leadPlayback==='auto'&&reduce.matches)leadElapsed=leadDrawDuration;
      else if(resetReplay&&leadPlayback!=='paused')leadElapsed=0;
      if(leadPlayback!=='paused')state.leadHour=1+11*clampProgress(leadElapsed/leadDrawDuration);
      const changed=Boolean(leadPlot)&&resetReplay;
      leadPlot=replacePlot($('lead-stage'),text,changed);
      leadChart=c;
      drawLeadReveal=prepareReveal(leadPlot,'lead');
      $('lead-case-label').textContent=`${c.variable} · ${c.caseId} · ${c.unit}`;
      focusCurve(state.focusedCurve);
      renderLeadHour(state.leadHour);
      if(changed)animateUpdate($('lead-case-label'),$('lead-values'));
    }catch(error){
      if(revision===leadRevision)$('page-status').textContent='The selected forecast error figure could not be loaded.';
    }finally{
      if(revision===leadRevision){
        leadReady=Boolean(leadPlot);
        syncLeadPlayback();
      }
    }
  }
  function bindLead(){
    const buttons=Object.keys(extra.colors).map(method=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='pv-curve-value';
      button.dataset.method=method;
      button.setAttribute('aria-label','Highlight '+extra.labels[method]+' curve');
      button.setAttribute('aria-pressed','false');
      button.style.setProperty('--curve-color',extra.colors[method]);
      button.innerHTML=`<span><i aria-hidden="true"></i>${extra.labels[method]}</span><strong class="pv-lower-value" title="MSE, lower is better" data-method-value="${method}"></strong>`;
      button.addEventListener('click',()=>{if(leadPlot)focusCurve(state.focusedCurve===method?null:method);});
      return button;
    });
    $('lead-values').replaceChildren(...buttons);
    $('lead-variable-tabs').addEventListener('click',event=>{
      const button=event.target.closest('[data-lead-variable]');
      if(!button||state.leadVariable===button.dataset.leadVariable)return;
      state.leadVariable=button.dataset.leadVariable;
      choose($('lead-variable-tabs'),button);
      renderLead(true);
    });
    $('lead-range').addEventListener('pointerdown',()=>{
      leadPlayback='paused';
      syncLeadPlayback();
    });
    $('lead-range').addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))scrubLeadHour($('lead-range').value);
    });
    $('lead-range').addEventListener('input',()=>scrubLeadHour($('lead-range').value));
    $('lead-play').addEventListener('click',()=>{
      leadPlayback=leadPlaying?'paused':'play';
      if(leadPlayback==='play'&&leadElapsed===leadDrawDuration)leadElapsed+=holdDuration;
      syncLeadPlayback();
    });
    observeMotion($('lead-stage'),visible=>{
      leadVisible=visible;
      syncLeadPlayback();
    });
    $('lead-stage').addEventListener('pointermove',event=>{
      if(leadPlaying||!leadReady)return;
      scrubLeadHour(nearest(leadChart.points.A5,svgX(event,leadPlot))+1);
    });
    compactCharts.addEventListener('change',()=>renderLead());
  }
  function renderBenchmark(animate=false){
    const table=extra.benchmarks[state.benchmark];const minima=table.columns.map((_,i)=>Math.min(...table.rows.map(r=>Number(r.mae[i]))));
    $('benchmark-table').querySelector('thead').innerHTML='<tr><th scope="col">Method</th>'+table.columns.map(c=>`<th scope="col">${c} ↓</th>`).join('')+'</tr>';
    $('benchmark-table').querySelector('tbody').innerHTML=table.rows.map(r=>`<tr class="${r.method==='A5'?'is-ours':''}"><th scope="row">${r.label}</th>${r.mae.map((n,i)=>`<td class="${Number(n)===minima[i]?'is-best':''}">${n}</td>`).join('')}</tr>`).join('');
    $('benchmark-summary').textContent=state.benchmark==='globalForecast'?'ProtoCast achieves the lowest MAE on all four GlobalForecast variables.':'ProtoCast achieves the lowest MAE on all four TyphoonTracking variables.';
    if(animate)animateUpdate($('benchmark-table').tBodies[0],$('benchmark-summary'));
  }

  let methodVisible=false,methodManual=null;
  function syncMethodPlayback(){
    const active=methodVisible&&!document.hidden&&!dialog.open&&(methodManual===null?!reduce.matches:methodManual);
    $('method-figure').classList.toggle('is-running',active);
    $('method-play').textContent=active?'Pause':'Play';
    $('method-play').setAttribute('aria-label',active?'Pause method animation':'Play method animation');
  }
  function bindMethod(){
    const phases=$('method-phases');
    const labels=phases.querySelectorAll('[data-method-phase]');
    new ResizeObserver(()=>{
      for(const label of labels){
        const left=label.offsetLeft;
        const right=phases.clientWidth-left-label.offsetWidth;
        phases.style.setProperty(`--pv-${label.dataset.methodPhase}-box`,`0 ${right}px 0 ${left}px`);
      }
    }).observe(phases);
    $('method-play').addEventListener('click',()=>{methodManual=!$('method-figure').classList.contains('is-running');syncMethodPlayback();});
    observeMotion($('method-figure'),visible=>{
      methodVisible=visible;
      syncMethodPlayback();
    },.22);
  }
  function syncFigurePlayback(){
    syncReelPlayback();
    syncTrackPlayback();
    syncPrototypePlayback();
    syncHistoryPlayback();
    syncForecastPlayback();
    syncLeadPlayback();
    syncMethodPlayback();
  }
  const dialog=$('figure-dialog');let priorOverflow='';
  function openFigure(button){
    const title=button.dataset.caption;
    const original=button.querySelector('img');
    const image=new Image(Number(original.getAttribute('width')),Number(original.getAttribute('height')));
    image.src=images+button.dataset.original;
    image.alt=title;
    $('dialog-content').replaceChildren(image);
    $('dialog-title').textContent=title;
    priorOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    dialog.showModal();
    syncFigurePlayback();
    $('dialog-close').focus({preventScroll:true});
  }
  $('dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    document.documentElement.style.overflow=priorOverflow;
    syncFigurePlayback();
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  });
  document.querySelectorAll('[data-original]').forEach(button=>button.addEventListener('click',()=>openFigure(button)));
  document.addEventListener('visibilitychange',syncFigurePlayback);
  reduce.addEventListener('change',()=>{
    document.documentElement.classList.toggle('pv-motion',!reduce.matches);
    if(reduce.matches){
      finishCounters();
      setReelWanted(false);
      if(reelTrackReveal)reelFrame(true);
      prototypePlayback='paused';
      prototypeElapsed=prototypeDrawDuration;
      if(prototypeReady)renderPrototypeHour(12);
      leadPlayback='paused';
      leadElapsed=leadDrawDuration;
      if(leadChart)renderLeadHour(12);
      historyPlayback='paused';
      historyElapsed=historyDrawDuration;
      if(prototypeReady)renderHistoryProgress(1);
      forecastPlayback='paused';
      forecastElapsed=forecastDrawDuration/2;
      if(forecastReady)setDivider(50);
      trackPlayback='paused';
      if(trackPlot){
        const finalFrame=currentStorm().count-1;
        trackElapsed=finalFrame*1000;
        renderTrackFrame(finalFrame);
        drawTrackReveal(1);
      }
      methodManual=false;
      tabSprings.forEach((_,group)=>updateTab(group,true));
    }
    syncFigurePlayback();
  });
  function themeIcon(){if($('theme-toggle').querySelector('svg'))return;const dark=document.documentElement.dataset.theme==='dark';$('theme-toggle').innerHTML=dark?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/></svg>';}
  $('theme-toggle').addEventListener('click',themeIcon);themeIcon();

  async function start(){
    try{
      const responses=await Promise.all([fetch('static/data/showcase.json'),fetch('static/data/protocast-v2.json?v=2')]);if(responses.some(r=>!r.ok))throw Error('Page data unavailable');
      [data,extra]=await Promise.all(responses.map(r=>r.json()));
      bindForecast();bindTrack();bindLead();bindMethod();
      $('benchmark-tabs').addEventListener('click',event=>{const b=event.target.closest('[data-benchmark]');if(!b||state.benchmark===b.dataset.benchmark)return;state.benchmark=b.dataset.benchmark;choose($('benchmark-tabs'),b);renderBenchmark(true);});
      const tasks=[preparePrototype(),renderForecast(),renderTrack(),renderLead(),svg('doksuri-preview-reveal.svg','preview-').then(text=>replacePlot($('reel-storm'),text,false))];
      await Promise.all(tasks);renderBenchmark();bindReel();
    }catch(error){$('page-status').textContent='Some interactive figures could not be loaded. Reload the page, or use the original paper figures and PDF.';$('forecast-explorer').setAttribute('aria-busy','false');}
  }
  start();
}());
