/* Cricket Masters — Stadium Edition. Classic scripts keep the whole folder offline. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const T = window.THREE;
  const CM = window.CM = window.CM || {};
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const defaults={team:'Masters XI',opponent:'Royals XI',difficulty:'club',overs:2,target:24};
  let config={...defaults};try{Object.assign(config,JSON.parse(localStorage.getItem('cm-match')||'{}'));}catch(e){}
  const levels={rookie:{pace:1.1,window:.24,field:5.2,swing:.08,reaction:.65,predict:.05},club:{pace:.94,window:.17,field:6.3,swing:.17,reaction:.4,predict:.15},pro:{pace:.76,window:.115,field:7.2,swing:.29,reaction:.22,predict:.32},legend:{pace:.62,window:.075,field:8.2,swing:.42,reaction:.12,predict:.5}};
  if(!levels[config.difficulty])config.difficulty='club';
  config.overs=[2,5,10,20].includes(Number(config.overs))?Number(config.overs):2;
  config.target=Math.max(1,Math.min(600,Math.round(Number(config.target)||24)));
  config.team=String(config.team||defaults.team).trim().slice(0,24);config.opponent=String(config.opponent||defaults.opponent).trim().slice(0,24);
  const rules = CM.rules = {
    quality: (elapsed, duration) => clamp(1 - Math.abs(elapsed / duration - .92) / levels[config.difficulty].window, 0, 1),
    boundary: (bounced) => bounced ? 4 : 6,
    overs: n => `${Math.floor(n / 6)}.${n % 6}`,
    complete: (runs, wickets, balls) => runs >= config.target || wickets >= 10 || balls >= config.overs*6,
    runsFromTime: time => Math.min(3,Math.max(0,Math.floor((time-1.15)/2.8)))
  };
  function fail(error) {
    console.error(error);
    $('loading')?.classList.add('hidden');
    const panel = $('error');
    if (panel) { panel.classList.remove('hidden'); panel.textContent = 'The 3D scene could not start. Extract the whole folder, then open index.html in a browser with WebGL enabled.'; }
    if ($('start')) { $('start').disabled = true; $('start').textContent = '3D unavailable'; }
  }
  window.addEventListener('error', e => { if (!CM.ready) fail(e.error || e.message); });
  try {
    if (!T || !CM.createStadium || !CM.createPlayer) throw new Error('Missing game files');
    const scene = new T.Scene();
    const renderer = new T.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    $('stage').appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Three-dimensional cricket oval');
    const cinema=CM.createCinema(renderer);
    const camera = new T.PerspectiveCamera(48, 1, .1, 1000);
    camera.position.set(21, 11, 29);
    const cameraTarget = new T.Vector3(0, 1.2, 0);
    const desiredPosition = camera.position.clone(), desiredTarget = cameraTarget.clone();
    scene.add(new T.HemisphereLight(0xc8dfee, 0x475a30, 1.15));
    const sun = new T.DirectionalLight(0xffe4b7, 2.6);
    sun.position.set(-35, 65, 30); sun.castShadow = true;
    Object.assign(sun.shadow.camera, {left:-29,right:29,top:30,bottom:-30,near:1,far:140});
    sun.shadow.normalBias = .025; sun.shadow.bias = -.0001; sun.shadow.mapSize.set(2048,2048);
    scene.add(sun);
    const rim = new T.DirectionalLight(0xc3d8ff, .65); rim.position.set(20, 12, -25); scene.add(rim);
    const stadium = CM.createStadium(scene, renderer);
    CM.addEquipment?.(scene);
    const roster = ['A. Rao', 'J. Walker', 'M. Khan', 'T. Brooks', 'D. Silva', 'K. James', 'R. Malik', 'J. Clarke', 'S. Patel', 'L. Bell', 'N. Cole'];
    const makePlayer = (x,z,role,seed,number,name,team='royals') => CM.createPlayer(scene,{x,z,role,seed,number,name,team});
    let batter = makePlayer(-.43,9.35,'batter',2,7,'A. RAO','masters');
    let partner = makePlayer(1.25,-9,'batter',9,23,'J. WALKER','masters');
    const bowler = makePlayer(.3,-23,'bowler',16,18,'MITCHELL');
    const keeper = makePlayer(0,12.4,'keeper',33,4,'HAYES');
    const umpire = makePlayer(-.6,-12.5,'umpire',12,0,'UMPIRE');
    bowler.group.rotation.y = Math.PI;
    const fieldLocations=[[-19,-21],[18,-19],[-28,4],[29,7],[-21,27],[22,29],[-39,-32],[35,-38],[3,-46]];
    const fielders = fieldLocations.map((p,i) => makePlayer(p[0],p[1],'fielder',55+i*7,6+i,roster[i]));
    const allPlayers=[batter,partner,bowler,keeper,umpire,...fielders];
    const ivory = new T.MeshStandardMaterial({color:0xf2ddad,roughness:.6});
    const wickets=[];
    [-10.06,10.06].forEach(z => {
      const group=new T.Group();scene.add(group);
      for(let i=-1;i<=1;i++){
        const stump=new T.Mesh(new T.CylinderGeometry(.019,.022,.715,12),ivory);
        stump.position.set(i*.105,.3575,z);stump.castShadow=true;group.add(stump);
      }
      for(let i=-1;i<=1;i+=2){const bail=new T.Mesh(new T.CylinderGeometry(.012,.012,.14,8),ivory);bail.rotation.z=Math.PI/2;bail.position.set(i*.053,.721,z);group.add(bail);}
      wickets.push(group);
    });
    const ball=new T.Mesh(new T.SphereGeometry(.074,24,16),new T.MeshStandardMaterial({color:0xc82e22,roughness:.36}));
    ball.castShadow=true;scene.add(ball);
    for(let side=-1;side<=1;side+=2){const seam=new T.Mesh(new T.TorusGeometry(.073,.002,4,60),new T.MeshStandardMaterial({color:0xf6ddd2,roughness:.8}));seam.position.z=side*.009;ball.add(seam);}
    const ballShadow=new T.Mesh(new T.CircleGeometry(.17,24),new T.MeshBasicMaterial({color:0x101905,transparent:true,opacity:.25,depthWrite:false}));
    ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.07;scene.add(ballShadow);
    const ballHalo=new T.Mesh(new T.SphereGeometry(.15,12,8),new T.MeshBasicMaterial({color:0xffda8a,transparent:true,opacity:.18,depthWrite:false}));ball.add(ballHalo);
    const trailArray=new Float32Array(18*3),trailGeo=new T.BufferGeometry();
    trailGeo.setAttribute('position',new T.BufferAttribute(trailArray,3));
    const trail=new T.Line(trailGeo,new T.LineBasicMaterial({color:0xffdc9b,transparent:true,opacity:.32}));trail.frustumCulled=false;scene.add(trail);
    const aiming=new T.Group();scene.add(aiming);
    const aimCurve=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:0xf7d790,dashSize:.4,gapSize:.35,transparent:true,opacity:.65}));aiming.add(aimCurve);
    const targetRing=new T.Mesh(new T.RingGeometry(.5,.55,40),new T.MeshBasicMaterial({color:0xffe3a3,transparent:true,opacity:.8,side:T.DoubleSide}));targetRing.rotation.x=-Math.PI/2;aiming.add(targetRing);
    const dust=new T.InstancedMesh(new T.SphereGeometry(.018,4,3),new T.MeshBasicMaterial({color:0xd6bb82,transparent:true,opacity:.45}),36);scene.add(dust);dust.visible=false;
    const dustOrigin=new T.Vector3(),dummy=new T.Object3D();let dustLife=0;
    let phase='intro',clock=0,totalTime=0,runs=0,wicketsLost=0,balls=0,history=[],aim=0,loft=false,paused=false;
    let deliveryDuration=1.45,deliveryX=0,bowledType='Good length',deliveryIndex=0;
    let swingProgress=-1,flightTime=0,firstBounce=false,settled=false,missKind='dot',cameraMode=0;
    const contactStart=new T.Vector3(),contactEnd=new T.Vector3(0,.72,9.1);
    let inningsSerial=0,soundEnabled=true,qualityMode='high',helpPaused=false,collector=null;
    let lastShotAim=0,shotCount=0,deliverySwing=0;
    let striker=0,nonStriker=1,nextBatter=2,pendingSwap=false;let figures=roster.map(()=>({runs:0,balls:0}));
    const velocity=new T.Vector3();
    const aimNames=['Cover','Off drive','Straight','On drive','Square leg'];
    let audioContext,audioGain,ambience;
    function beginSound(){
      if(!soundEnabled)return;
      try{
        if(!audioContext){
          audioContext=new (window.AudioContext||window.webkitAudioContext)();
          audioGain=audioContext.createGain();audioGain.gain.value=.22;audioGain.connect(audioContext.destination);
          const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate),data=buffer.getChannelData(0);
          let sample=0;for(let i=0;i<data.length;i++){sample=.97*sample+.03*(Math.random()*2-1);data[i]=sample;}
          const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;
          const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;
          ambience=audioContext.createGain();ambience.gain.value=.25;noise.connect(filter);filter.connect(ambience);ambience.connect(audioGain);noise.start();
        }
        audioContext.resume().catch(()=>{});
      }catch(e){soundEnabled=false;}
    }
    function sound(kind){
      if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
      const now=audioContext.currentTime;
      if(kind==='hit'||kind==='bounce'){
        const duration=kind==='hit'?.12:.06,b=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*duration),audioContext.sampleRate),d=b.getChannelData(0);
        for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*7);
        const n=audioContext.createBufferSource();n.buffer=b;const f=audioContext.createBiquadFilter();f.type='bandpass';f.frequency.value=kind==='hit'?1100:280;
        const gain=audioContext.createGain();gain.gain.value=kind==='hit'?1.2:.38;n.connect(f);f.connect(gain);gain.connect(audioGain);n.start();
      }else{
        const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(kind==='wicket'?380:660,now);osc.frequency.exponentialRampToValueAtTime(kind==='wicket'?140:990,now+.28);gain.gain.setValueAtTime(.17,now);gain.gain.exponentialRampToValueAtTime(.001,now+.5);osc.connect(gain);gain.connect(audioGain);osc.start();osc.stop(now+.51);
        if(kind==='boundary'){ambience.gain.setTargetAtTime(1,now,.1);ambience.gain.setTargetAtTime(.25,now+1.7,.6);}
      }
    }
    function setPhase(next){phase=next;clock=0;$('phase').textContent={intro:'Stadium edition',runup:'Bowler approaching',bowl:'Watch the release',delivery:'Watch the ball',contact:'Play the shot',flight:'Ball in play',miss:'Through to the keeper',result:'Between deliveries',over:'Innings complete'}[phase];}
    function call(title,detail){$('call').textContent=title;$('detail').textContent=detail;}
    function setQuality(){
      const preset=({low:[.8,512],balanced:[1,1024],high:[1.6,2048],ultra:[2,2048],cinematic:[2.5,4096]})[qualityMode]||[1.6,2048];
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,preset[0]));renderer.shadowMap.enabled=qualityMode!=='low';
      sun.shadow.mapSize.set(preset[1],preset[1]);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
      stadium.setQuality?.(qualityMode);cinema.setQuality(qualityMode);resize();
    }
    function resize(){const w=$('stage').clientWidth||innerWidth,h=$('stage').clientHeight||innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
    function updateUI(){
      $('runs').textContent=runs;$('wickets').textContent=wicketsLost;$('overs').textContent=rules.overs(balls);
      $('need').textContent=runs>=config.target?'Target reached':`${config.target-runs} needed from ${config.overs*6-balls} balls`;
      $('rate').textContent=balls<config.overs*6?(Math.max(0,config.target-runs)*6/(config.overs*6-balls)).toFixed(1):'—';
      $('timingPanel').classList.toggle('hidden',config.difficulty==='legend');document.body.classList.toggle('legend-mode',config.difficulty==='legend');
      $('history').replaceChildren(...Array.from({length:6},(_,i)=>{
        const el=document.createElement('span'),overStart=Math.floor(Math.max(0,balls-1)/6)*6,value=history[overStart+i];el.textContent=value===undefined?'·':value;
        if(value==='W')el.className='ball-wicket';else if(Number(value)>=4)el.className='ball-boundary';else if(value!==undefined)el.className='ball-played';return el;
      }));
      $('teamLabel').textContent=config.team;$('oversLimit').textContent='OVERS / '+config.overs;$('targetLabel').textContent='TARGET '+config.target;
      $('previewTarget').textContent=config.target;$('previewBalls').textContent=config.overs*6;
      $('batters').textContent=`${roster[striker]} * ${figures[striker].runs} (${figures[striker].balls})  •  ${roster[nonStriker]} ${figures[nonStriker].runs} (${figures[nonStriker].balls})`;
      stadium.updateScore(runs,wicketsLost,balls,config.team);
    }
    function updateAim(){
      $('aimLabel').textContent=aimNames[aim+2];$('ground').classList.toggle('active',!loft);$('loft').classList.toggle('active',loft);
      $('ground').setAttribute('aria-pressed',String(!loft));$('loft').setAttribute('aria-pressed',String(loft));
      $('left').disabled=aim===-2;$('right').disabled=aim===2;
      const angle=aim*.53,points=[];
      for(let i=0;i<22;i++){const distance=i*.45;points.push(new T.Vector3(Math.sin(angle)*distance,.08,9.15-Math.cos(angle)*distance));}
      aimCurve.geometry.dispose();aimCurve.geometry=new T.BufferGeometry().setFromPoints(points);aimCurve.computeLineDistances();targetRing.position.copy(points[points.length-1]);
    }
    function face(player,x,z){player.group.rotation.y=Math.atan2(player.group.position.x-x,player.group.position.z-z);}
    function resetField(){
      fielders.forEach((p,i)=>{p.group.position.copy(p.home);
        if(shotCount>0&&['pro','legend'].includes(config.difficulty)&&i<6){const angle=lastShotAim*.53;const targetX=Math.sin(angle)*(25+i*3),targetZ=9-Math.cos(angle)*(25+i*3);p.group.position.x+=(targetX-p.home.x)*.3;p.group.position.z+=(targetZ-p.home.z)*.3;}
        face(p,0,9);});
      partner.group.position.set(1.25,0,-9);partner.group.rotation.y=Math.PI;
      batter.group.position.set(-.43,0,9.35);batter.group.rotation.y=0;
      keeper.group.position.set(0,0,12.4);keeper.group.rotation.y=0;
      bowler.group.position.set(.3,0,-23);bowler.group.rotation.y=Math.PI;
      wickets[1].children.forEach((m,i)=>{m.rotation.x=0;m.rotation.z=i<3?0:Math.PI/2;m.position.y=i<3?.3575:.721;});
    }
    function nextDelivery(){
      if(pendingSwap){[batter,partner]=[partner,batter];pendingSwap=false;}
      batter.setIdentity(roster[striker],config.team);partner.setIdentity(roster[nonStriker],config.team);bowler.setIdentity(Math.floor(balls/6)%2?'REED':'MITCHELL',config.opponent);
      resetField();swingProgress=-1;flightTime=0;firstBounce=false;settled=false;collector=null;ball.visible=true;trail.visible=false;
      deliveryIndex=Math.floor(Math.random()*4);
      deliveryDuration=[1.48,1.34,1.61,1.42][deliveryIndex]*levels[config.difficulty].pace*(.94+Math.random()*.12);
      deliveryX=[.02,.21,-.15,.07][deliveryIndex]+(Math.random()-.5)*.16;deliverySwing=(Math.random()<.5?-1:1)*levels[config.difficulty].swing;bowledType=['Good length','Full and fast','Slower ball','Back of a length'][deliveryIndex];
      $('deliveryLabel').textContent=(Math.floor(balls/6)%2?'REED • ':'MITCHELL • ')+(config.difficulty==='legend'?'RIGHT ARM • OVER '+(Math.floor(balls/6)+1):bowledType);$('speed').textContent=Math.round([132,144,118,138][deliveryIndex]+({rookie:-15,club:0,pro:7,legend:12})[config.difficulty]);
      $('timingMarker').style.left='0%';$('timing').setAttribute('aria-valuenow','0');
      $('swing').disabled=true;call('Set your field.','Choose the gap. Watch the bowler.');setPhase('runup');
    }
    function reset(){
      beginSound();lastShotAim=0;shotCount=0;fielders.forEach(p=>p.setIdentity(p.name,config.opponent));keeper.setIdentity('HAYES',config.opponent);striker=0;nonStriker=1;nextBatter=2;pendingSwap=false;figures=roster.map(()=>({runs:0,balls:0}));inningsSerial++;runs=wicketsLost=balls=0;history=[];paused=false;aim=0;loft=false;
      $('intro').classList.add('hidden');$('result').classList.add('hidden');$('hud').classList.remove('hidden');document.body.classList.add('is-live');
      $('pause').textContent='Pause';$('pause').setAttribute('aria-pressed','false');
      updateUI();updateAim();nextDelivery();
    }
    function resolve(n,isWicket=false,description=''){
      if(settled)return;settled=true;figures[striker].runs+=n;figures[striker].balls++;runs+=n;wicketsLost+=Number(isWicket);balls++;history.push(isWicket?'W':String(n));
      if(isWicket&&nextBatter<11)striker=nextBatter++;
      if((n%2===1)!==(balls%6===0)){[striker,nonStriker]=[nonStriker,striker];pendingSwap=true;}
      const ended=rules.complete(runs,wicketsLost,balls);
      setPhase('result');$('swing').disabled=true;aiming.visible=false;
      call(isWicket?'Wicket.':n===6?'Into the stands.':n===4?'Finds the boundary.':n===0?'Dot ball.':`${n} ${n===1?'run':'runs'}.`,description||'Back to the crease.');
      if(isWicket)sound('wicket');else if(n>=4)sound('boundary');updateUI();
      if(ended) $('phase').textContent='Final delivery';
    }
    function endInnings(){
      setPhase('over');const won=runs>=config.target;
      $('resultTitle').textContent=won?'Chase complete.':'The chase ends here.';
      $('resultDetail').textContent=won?`${config.team} win with ${config.overs*6-balls} balls remaining. ${runs}/${wicketsLost} in ${rules.overs(balls)} overs.`:`${runs}/${wicketsLost} in ${rules.overs(balls)} overs. ${config.target-1-runs===0?'Scores level.':`${config.opponent} win by ${config.target-1-runs} runs.`}`;
      try{const key='cm-best-'+config.difficulty+'-'+config.overs+'-'+config.target;const best=Math.max(runs,Number(localStorage.getItem(key))||0);localStorage.setItem(key,String(best));$('resultDetail').textContent+=' Personal best for this challenge: '+best+' runs.';}catch(e){}
      $('result').classList.remove('hidden');call(won?'That’s your moment.':'One more innings?','Play again to take on the chase.');
    }
    function swing(){
      if(paused||phase!=='delivery'||swingProgress>=0)return;
      lastShotAim=aim;shotCount++;const q=rules.quality(clock,deliveryDuration);swingProgress=0;$('swing').disabled=true;
      if(q<.12){call('Mistimed.',config.difficulty==='legend'?'Read the ball as it reaches the bat.':'Meet the ball closer to the crease.');return;}
      const angle=aim*.53+(1-q)*.12;velocity.set(Math.sin(angle)*(21+q*17),loft?9+q*13:1.7+q*1.6,-Math.cos(angle)*(21+q*17));
      contactStart.copy(ball.position);contactEnd.set(deliveryX,.72,9.1);setPhase('contact');flightTime=0;firstBounce=false;
      call(q>.8?'Off the middle.':q>.5?'Good connection.':'Off the edge.',loft?'Lofted. Watch the field.':'Along the ground. Find the gap.');
    }
    function togglePause(){if(phase==='intro'||phase==='over')return;paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));if(paused)audioContext?.suspend();else if(soundEnabled)audioContext?.resume();}
    function dustAt(pos){dustOrigin.copy(pos);dustLife=1;dust.visible=true;}
    function moveFielder(p,dt){
      const difficulty=levels[config.difficulty];
      const actualDistance=Math.hypot(ball.position.x-p.group.position.x,ball.position.z-p.group.position.z);
      if(flightTime<difficulty.reaction)return actualDistance;
      const lead=ball.position.y>.4?difficulty.predict:0;
      const dx=ball.position.x+velocity.x*lead-p.group.position.x,dz=ball.position.z+velocity.z*lead-p.group.position.z,d=Math.hypot(dx,dz);
      if(d> .7){const move=Math.min(d,dt*levels[config.difficulty].field);p.group.position.x+=dx/d*move;p.group.position.z+=dz/d*move;face(p,ball.position.x,ball.position.z);}
      return actualDistance;
    }
    function animatePlayers(dt){
      const running=phase==='flight'&&flightTime>1.15,celebrating=phase==='over'&&runs>=config.target||phase==='result'&&Number(history[history.length-1])>=4;
      let batterAction='idle';if(swingProgress>=0&&swingProgress<1.05)batterAction='swing';else if(running)batterAction='run';else if(celebrating)batterAction='celebrate';
      const swingPose=swingProgress<.12?swingProgress/.12*.58:.58+(swingProgress-.12)/.82*.42;
      batter.update(dt,totalTime,{action:batterAction,progress:celebrating?clamp(clock,0,1):clamp(swingPose,0,1),loft,aim});
      partner.update(dt,totalTime,{action:running?'run':celebrating?'celebrate':'idle',progress:clamp(clock,0,1)});
      bowler.update(dt,totalTime,{action:phase==='runup'?'run':phase==='bowl'?'bowl':phase==='delivery'&&clock<.45?'bowl':'idle',progress:phase==='bowl'?clock/.92:phase==='delivery'?.6+clock/.45*.4:0});
      keeper.update(dt,totalTime,{action:phase==='miss'?'field':'idle',progress:clamp(clock/.6,0,1)});
      umpire.update(dt,totalTime,{action:'idle',progress:0});
      fielders.forEach(p=>p.update(dt,totalTime,{action:phase==='flight'?'run':phase==='result'&&p===collector&&clock<.85?'field':phase==='result'&&history[history.length-1]==='W'?'celebrate':'idle',progress:phase==='result'?clamp(clock/.85,0,1):(totalTime*.6)%1}));
    }
    function update(dt){
      totalTime+=dt;clock+=dt;if(swingProgress>=0)swingProgress+=dt;
      aiming.visible=['runup','bowl','delivery'].includes(phase);
      if(phase==='runup'){
        bowler.group.position.z=-23+Math.min(1,clock/2.1)*11.7;ball.position.set(bowler.group.position.x+.3,1.1,bowler.group.position.z+.1);
        if(clock>2.1){setPhase('bowl');call('Here it comes.',config.difficulty==='legend'?'Watch the seam. Read the bounce.':'Swing as the marker enters the gold zone.');}
      }else if(phase==='bowl'){
        const t=clock/.92;bowler.group.position.z=-11.3+Math.min(t,1)*1.1;ball.position.set(.3+.55*Math.cos(t*Math.PI*1.8),1.5+.7*Math.sin(t*Math.PI),bowler.group.position.z);
        if(t>=.6){setPhase('delivery');ball.position.set(.18,2.18,-10);$('swing').disabled=false;}
      }else if(phase==='delivery'){
        const t=clamp(clock/deliveryDuration,0,1),bounce=[.68,.79,.61,.53][deliveryIndex];
        ball.position.x=T.MathUtils.lerp(.18,deliveryX,t)+Math.sin(t*Math.PI)*deliverySwing;
        ball.position.z=-10+20.06*t;
        if(t<bounce){const u=t/bounce;ball.position.y=2.18*(1-u)+.10*u+.38*Math.sin(u*Math.PI);}
        else {const u=(t-bounce)/(1-bounce);ball.position.y=.1+Math.sin(u*Math.PI*.66)*.78;}
        if(t>=bounce&&!firstBounce){sound('bounce');dustAt(ball.position);firstBounce=true;}
        const percent=Math.round(t*100);$('timingMarker').style.left=percent+'%';$('timing').setAttribute('aria-valuenow',String(percent));
        if(t>=1){missKind=Math.abs(deliveryX)<.14?'bowled':'dot';setPhase('miss');$('swing').disabled=true;}
      }else if(phase==='miss'){
        ball.position.z+=dt*17;ball.position.y=Math.max(.1,ball.position.y-dt*.8);
        if(missKind==='bowled'&&ball.position.z>10){wickets[1].children[1].rotation.x=-Math.min(1.35,clock*2);wickets[1].children.slice(3).forEach((m,i)=>{m.position.y=.72+Math.sin(clamp(clock,0,1)*Math.PI)*.7;m.rotation.z=clock*5*(i?1:-1);});}
        if(clock>.6)resolve(0,missKind==='bowled',missKind==='bowled'?'Bowled. A little later on the next one.':'Through to the keeper. No run.');
      }else if(phase==='contact'){
        ball.position.lerpVectors(contactStart,contactEnd,Math.min(clock/.12,1));
        if(clock>=.12){setPhase('flight');sound('hit');trail.visible=true;for(let i=0;i<18;i++)ball.position.toArray(trailArray,i*3);}
      }else if(phase==='flight'){
        flightTime+=dt;velocity.y-=9.81*dt;ball.position.addScaledVector(velocity,dt);
        if(ball.position.y<.085){ball.position.y=.085;firstBounce=true;if(velocity.y<-1.5){sound('bounce');dustAt(ball.position);}velocity.y=velocity.y<-1?-velocity.y*.32:0;}
        if(ball.position.y<.18){const drag=Math.max(0,1-dt*.43);velocity.x*=drag;velocity.z*=drag;}
        for(let i=trailArray.length-1;i>=3;i--)trailArray[i]=trailArray[i-3];ball.position.toArray(trailArray,0);trailGeo.attributes.position.needsUpdate=true;
        const radius=Math.hypot(ball.position.x,ball.position.z);
        if(radius>=63.7)resolve(rules.boundary(firstBounce),false,firstBounce?'Races across the rope.':'Clears the rope on the full.');
        if(!settled){
          let best=Infinity,closest;
          fielders.forEach(p=>{const d=moveFielder(p,dt);if(d<best){best=d;closest=p;}});
          if(flightTime>1.1&&best<1.0&&ball.position.y<1.9){
            const caught=!firstBounce&&velocity.y<0;
            if(caught){collector=closest;resolve(0,true,'Caught in the deep. Try a ground shot through the gap.');}
            else if(ball.position.y<.5){collector=closest;resolve(rules.runsFromTime(flightTime),false,'Fielded and returned to the keeper.');}
          }
          if(!settled&&(flightTime>10||flightTime>2.8&&Math.hypot(velocity.x,velocity.z)<1.2))resolve(rules.runsFromTime(flightTime),false,'Safely back in the crease.');
        }
        if(flightTime>1.15){const progress=(flightTime-1.15)/2.8,lap=Math.floor(progress),fraction=progress-lap,z=lap%2===0?9-fraction*18:-9+fraction*18;batter.group.position.set(-.7,0,z);partner.group.position.set(.8,0,-z);batter.group.rotation.y=lap%2===0?0:Math.PI;partner.group.rotation.y=lap%2===0?Math.PI:0;}
      }else if(phase==='result'&&clock>2.5){if(rules.complete(runs,wicketsLost,balls))endInnings();else nextDelivery();}
      if(dustLife>0){dustLife-=dt*1.7;for(let i=0;i<36;i++){const a=i*2.399,t=1-dustLife;dummy.position.set(dustOrigin.x+Math.cos(a)*t*(.1+(i%6)*.05),.08+Math.sin(t*Math.PI)*(.05+(i%7)*.024),dustOrigin.z+Math.sin(a)*t*.3);dummy.scale.setScalar(Math.max(.05,dustLife));dummy.updateMatrix();dust.setMatrixAt(i,dummy.matrix);}dust.instanceMatrix.needsUpdate=true;dust.visible=dustLife>0;}
      ball.rotation.x+=dt*16;ball.rotation.z+=dt*5;ballShadow.position.set(ball.position.x,.065,ball.position.z);ballShadow.scale.setScalar(1+ball.position.y*.15);ballShadow.material.opacity=.27/(1+ball.position.y*.13);
      animatePlayers(dt);
      if(phase==='runup'||phase==='bowl')bowler.getHandPosition?.(1,ball.position);
      if(phase==='result'&&collector&&clock>.42)collector.getHandPosition?.(1,ball.position);
      stadium.update?.(dt,totalTime);
    }
    function frameCamera(dt){
      if(phase==='intro'){
        const t=totalTime*.025;desiredPosition.set(19+Math.sin(t)*3,9.5,24+Math.cos(t)*3);desiredTarget.set(0,1.6,-1);
      }else if(phase==='flight'){
        desiredPosition.set(ball.position.x*.55+10,Math.max(6.5,ball.position.y*.65+5),ball.position.z*.5+18);desiredTarget.copy(ball.position).lerp(new T.Vector3(0,1,9),.18);
      }else if(cameraMode===0){desiredPosition.set(4.8,3.6,17.8);desiredTarget.set(0,1,-6);}
      else if(cameraMode===1){desiredPosition.set(12,8,23);desiredTarget.set(0,1,-3);}
      else {desiredPosition.set(1.25,2.35,15.2);desiredTarget.set(0,1.2,-5);}
      if(phase==='over'){desiredPosition.set(3.5,2.2,12.8);desiredTarget.copy(batter.group.position).add(new T.Vector3(0,1.0,0));}
      const lerp=1-Math.exp(-dt*(phase==='flight'?2.5:3));camera.position.lerp(desiredPosition,lerp);cameraTarget.lerp(desiredTarget,lerp);camera.lookAt(cameraTarget);
    }
    $('start').addEventListener('click',reset);$('playAgain').addEventListener('click',reset);$('restart').addEventListener('click',reset);
    $('swing').addEventListener('click',swing);
    $('left').addEventListener('click',()=>{aim=clamp(aim-1,-2,2);updateAim();});$('right').addEventListener('click',()=>{aim=clamp(aim+1,-2,2);updateAim();});
    $('ground').addEventListener('click',()=>{loft=false;updateAim();});$('loft').addEventListener('click',()=>{loft=true;updateAim();});
    $('pause').addEventListener('click',togglePause);
    $('camera').addEventListener('click',()=>{cameraMode=(cameraMode+1)%3;$('camera').textContent=['Camera: crease','Camera: broadcast','Camera: batter'][cameraMode];});
    $('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('sound').textContent=soundEnabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)beginSound();else audioContext?.suspend();});
    $('quality').addEventListener('change',e=>{qualityMode=e.target.value;try{localStorage.setItem('cm-quality',qualityMode);}catch(e){}setQuality();});
    let settingsPaused=false;
    function closeSettings(){ $('settingsDialog').classList.add('hidden');if(settingsPaused){settingsPaused=false;togglePause();}$('settings').focus(); }
    $('settings').addEventListener('click',()=>{settingsPaused=!paused&&phase!=='intro'&&phase!=='over';if(settingsPaused)togglePause();
      $('teamName').value=config.team;$('opponentName').value=config.opponent;$('difficulty').value=config.difficulty;$('matchOvers').value=config.overs;$('matchTarget').value=config.target;
      $('settingsDialog').classList.remove('hidden');$('teamName').focus();});
    $('closeSettings').addEventListener('click',closeSettings);
    $('matchOvers').addEventListener('change',()=>{$('matchTarget').value=Number($('matchOvers').value)*12;});
    $('settingsForm').addEventListener('submit',e=>{e.preventDefault();
      config={team:$('teamName').value.trim().slice(0,24)||defaults.team,opponent:$('opponentName').value.trim().slice(0,24)||defaults.opponent,difficulty:levels[$('difficulty').value]?$('difficulty').value:'club',overs:[2,5,10,20].includes(Number($('matchOvers').value))?Number($('matchOvers').value):2,target:clamp(Math.round(Number($('matchTarget').value)||24),1,600)};
      try{localStorage.setItem('cm-match',JSON.stringify(config));}catch(e){}settingsPaused=false;$('settingsDialog').classList.add('hidden');reset();});
    function closeHelp(){ $('helpDialog').classList.add('hidden');if(helpPaused){helpPaused=false;togglePause();}$('help').focus();}
    $('help').addEventListener('click',()=>{helpPaused=!paused&&phase!=='intro'&&phase!=='over';if(helpPaused)togglePause();$('helpDialog').classList.remove('hidden');$('closeHelp').focus();});$('closeHelp').addEventListener('click',closeHelp);
    window.addEventListener('keydown',e=>{
      if(!$('settingsDialog').classList.contains('hidden')){if(e.code==='Escape')closeSettings();return;}
      if(e.code==='Escape'){if(!$('helpDialog').classList.contains('hidden'))closeHelp();else togglePause();return;}
      if(!$('helpDialog').classList.contains('hidden')||e.target.matches('input,select,textarea'))return;
      if(e.repeat)return;
      if(e.code==='Space'){e.preventDefault();if(phase==='intro'&&CM.ready||phase==='over')reset();else swing();}
      else if(e.code==='KeyA'||e.code==='ArrowLeft'){$('left').click();e.preventDefault();}
      else if(e.code==='KeyD'||e.code==='ArrowRight'){$('right').click();e.preventDefault();}
      else if(e.code==='KeyL'){loft=!loft;updateAim();}
      else if(e.code==='KeyP')togglePause();else if(e.code==='KeyC')$('camera').click();else if(e.code==='KeyM')$('sound').click();
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused&&phase!=='intro'&&phase!=='over')togglePause();});
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;call('Graphics paused.','Reload to restore the graphics context.');});
    try{const saved=localStorage.getItem('cm-quality');if(['low','balanced','high','ultra','cinematic'].includes(saved))qualityMode=saved;}catch(e){}$('quality').value=qualityMode;
    window.addEventListener('resize',resize);setQuality();updateAim();updateUI();resetField();ball.position.set(.2,1.1,-23);
    let previous=performance.now();
    function loop(now){
      const dt=Math.min(.05,(now-previous)/1000);previous=now;
      if(!paused){update(dt);frameCamera(dt);}cinema.render(scene,camera);requestAnimationFrame(loop);
    }
    // Read-only diagnostics for the packaged-build smoke test.
    CM.snapshot=()=>({deliveryDuration,deliveryIndex,deliverySwing,shotCount,config:{...config},quality:qualityMode,striker,nonStriker,figures,phase,runs,wickets:wicketsLost,balls,paused,aim,loft,ready:CM.ready,ball:ball.position.toArray(),camera:camera.position.toArray(),players:allPlayers.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,stadium:stadium.stats});
    Promise.resolve(stadium.ready).then(()=>{
      renderer.compile(scene,camera);CM.ready=true;$('loading').classList.add('hidden');$('start').disabled=false;requestAnimationFrame(loop);
    }).catch(fail);
  }catch(error){fail(error);}
})();
