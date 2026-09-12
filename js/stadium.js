/* Cricket Masters — stadium, turf and broadcast environment. */
(function () {
  'use strict';
  const CM = window.CM = window.CM || {};
  CM.createStadium = function (scene, renderer) {
    const T = THREE, root = new T.Group();
    root.name = 'Masters Oval'; scene.add(root);
    let seed = 9182026;
    function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    const TAU = Math.PI * 2, ready = [], clockUniform = { value: 0 };
    const boxGeo = new T.BoxGeometry(1, 1, 1), cylinderGeo = new T.CylinderGeometry(1, 1, 1, 8);
    const dummy = new T.Object3D(), color = new T.Color();
    const mat = (c, roughness = .82, metalness = 0) => new T.MeshStandardMaterial({ color: c, roughness, metalness });
    const concrete = mat(0xa6a8a3), concDark = mat(0x4d595e), steel = mat(0xd9dedb, .48, .54);
    const navy = mat(0x173440), roofing = mat(0xc7ceca, .7, .15), black = mat(0x101d25), white = mat(0xf5eee0);
    function mesh(geo, material, x = 0, y = 0, z = 0) {
      const object = new T.Mesh(geo, material); object.position.set(x, y, z); root.add(object); return object;
    }
    function box(w, h, d, material, x, y, z) { const o = mesh(boxGeo, material, x, y, z); o.scale.set(w, h, d); return o; }
    function beam(a, b, radius, material = steel) {
      const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
      const o = mesh(cylinderGeo, material); o.position.copy(start).add(end).multiplyScalar(.5);
      o.scale.set(radius, delta.length(), radius); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return o;
    }
    function instanceMesh(geometry, material, count) {
      const o = new T.InstancedMesh(geometry, material, count); o.frustumCulled = false; root.add(o); return o;
    }
    function at(o, i, x, y, z, sx = 1, sy = 1, sz = 1, angle = 0, hex) {
      dummy.position.set(x, y, z); dummy.rotation.set(0, angle, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); o.setMatrixAt(i, dummy.matrix);
      if (hex !== undefined) o.setColorAt(i, color.set(hex));
    }
    function loadedTexture(key, rx, ry, srgb) {
      const texture = new T.Texture(); texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(rx, ry); texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (srgb) texture.colorSpace = T.SRGBColorSpace;
      ready.push(new Promise(resolve => {
        const img = new Image(); img.onload = () => { texture.image = img; texture.needsUpdate = true; resolve(); };
        img.onerror = () => { const c=document.createElement('canvas');c.width=c.height=2;const ctx=c.getContext('2d');ctx.fillStyle=srgb?'#668b40':'#8080ff';ctx.fillRect(0,0,2,2);texture.image=c;texture.needsUpdate=true;resolve(); }; img.src = window.CM_TEXTURES?.[key] || '';
      })); return texture;
    }
    function canvasTexture(w, h, paint) {
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; paint(canvas.getContext('2d'), w, h);
      const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4; return texture;
    }

    // Physical ground surface, photographed albedo and fine normal detail.
    const grassMap = loadedTexture('grass-color', 80, 80, true);
    const grassNormal = loadedTexture('grass-normal', 80, 80, false);
    const turfMat = new T.MeshStandardMaterial({ color: 0x427b2d, map: grassMap, normalMap: grassNormal, normalScale: new T.Vector2(.38, .38), roughness: .98 });
    turfMat.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vTurfWorld;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTurfWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = 'varying vec3 vTurfWorld;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat stripe = smoothstep(-0.05,0.05,sin(vTurfWorld.z*0.34));\nfloat turfVariation = sin(vTurfWorld.x*.31+sin(vTurfWorld.z*.41))*sin(vTurfWorld.z*.53+vTurfWorld.x*.14);\ndiffuseColor.rgb *= mix(vec3(.76,.88,.68),vec3(1.05,1.06,.91),stripe) * (1.0+turfVariation*.055);');
    };
    const turf = mesh(new T.CircleGeometry(70.5, 192), turfMat); turf.name = 'Textured outfield'; turf.rotation.x = -Math.PI / 2; turf.receiveShadow = true;
    const apron = mesh(new T.RingGeometry(70.2, 74.5, 192), mat(0x6c7471)); apron.rotation.x = -Math.PI / 2; apron.position.y = -.025;
    const pitchMat = new T.MeshStandardMaterial({ color: 0xcdbb87, map: loadedTexture('pitch-color', 1.2, 7, true), normalMap: loadedTexture('pitch-normal', 1.2, 7, false), normalScale: new T.Vector2(.27, .27), roughness: 1 });
    const squareMat = mat(0x7f9050), square = box(10.8, .013, 25, squareMat, 0, .004, 0); square.receiveShadow = true;
    const pitch = mesh(new T.PlaneGeometry(3.05, 22.5), pitchMat, 0, .021, 0); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true;
    // Adjacent practice strips add the layered, maintained character of a real square.
    for (const x of [-3.6, 3.6]) { const o = mesh(new T.PlaneGeometry(2.65, 22.5), turfMat, x, .022, 0); o.rotation.x = -Math.PI / 2; o.receiveShadow = true; }
    const creaseMat = mat(0xf3edce);
    for (const sign of [-1, 1]) {
      box(3.64, .007, .045, creaseMat, 0, .033, sign * 8.84);
      box(2.64, .007, .04, creaseMat, 0, .033, sign * 10.06);
      for (const x of [-1.32, 1.32]) box(.041, .007, 2.7, creaseMat, x, .034, sign * 10.05);
    }
    const wear = new T.BufferGeometry(), wearPoints = [];
    for (let i = 0; i < 1200; i++) {
      const z = (random() > .5 ? 1 : -1) * (8 + random() * 2.65), x = (random() - .5) * 2.15;
      wearPoints.push(x, .032 + random() * .005, z);
    }
    wear.setAttribute('position', new T.Float32BufferAttribute(wearPoints, 3));
    root.add(new T.Points(wear, new T.PointsMaterial({ color: 0x80754c, size: .023, transparent: true, opacity: .5 })));

    // 150,000 individually oriented short blades, concentrated around the playing square.
    const grassCount = 150000, grassGeo = new T.InstancedBufferGeometry();
    grassGeo.setAttribute('position', new T.Float32BufferAttribute([-.5,0,0, .5,0,0, -.29,.55,0, .29,.55,0, .07,1,.18], 3));
    grassGeo.setIndex([0,1,2,1,3,2,2,3,4]);
    const offsets = new Float32Array(grassCount * 3), shapes = new Float32Array(grassCount * 4), shades = new Float32Array(grassCount);
    for (let i = 0; i < grassCount; i++) {
      let x, z;
      do {
        if (i < 110000) { x = (random() - .5) * 46; z = (random() - .5) * 63; }
        else { const a = random() * TAU, r = Math.sqrt(random()) * 68; x = Math.sin(a) * r; z = Math.cos(a) * r; }
      } while (Math.abs(x) < 5.4 && Math.abs(z) < 12.5);
      offsets.set([x, .012, z], i * 3);
      const a = random() * TAU;
      shapes.set([Math.cos(a), Math.sin(a), .017 + random() * .024, .045 + random() * .075], i * 4);
      shades[i] = random();
    }
    grassGeo.setAttribute('aOffset', new T.InstancedBufferAttribute(offsets, 3));
    grassGeo.setAttribute('aShape', new T.InstancedBufferAttribute(shapes, 4));
    grassGeo.setAttribute('aShade', new T.InstancedBufferAttribute(shades, 1));
    grassGeo.instanceCount = grassCount;
    const grassMaterial = new T.ShaderMaterial({ extensions: {derivatives:true}, side: T.DoubleSide, uniforms: { uTime: clockUniform, uFog: { value: new T.Color(0xb4cbd5) } },
      vertexShader: `attribute vec3 aOffset; attribute vec4 aShape; attribute float aShade;
        uniform float uTime; varying float vHeight; varying float vShade; varying float vDepth; varying vec3 vWorld;
        void main(){vec3 p=position; vHeight=p.y; vShade=aShade;
          p.x*=aShape.z; p.z*=aShape.z; p.y*=aShape.w;
          p.x += sin(uTime*1.5+aOffset.x*.18+aOffset.z*.23)*.015*vHeight*vHeight;
          p.xz=mat2(aShape.x,-aShape.y,aShape.y,aShape.x)*p.xz; p+=aOffset; vWorld=p;
          vec4 mv=modelViewMatrix*vec4(p,1.); vDepth=-mv.z; gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uFog; varying float vHeight; varying float vShade; varying float vDepth; varying vec3 vWorld;
        void main(){float stripe=smoothstep(-.05,.05,sin(vWorld.z*.34));
          vec3 c=mix(vec3(.017,.032,.004),vec3(.115,.205,.035),vHeight);
          vec3 surfaceNormal=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
          vec3 lightDirection=normalize(vec3(-.43,.68,.49));
          float sunlight=abs(dot(surfaceNormal,lightDirection));
          float transmission=pow(max(dot(normalize(cameraPosition-vWorld),-lightDirection),0.),3.);
          c*=.65+.55*sunlight;
          c+=vec3(.07,.105,.012)*transmission*vHeight;
          c*=mix(.6,1.,smoothstep(0.,.55,vHeight));
          c*=mix(.78,1.12,vShade)*mix(.8,1.06,stripe);
          float fog=1.-exp(-.000012*vDepth*vDepth);gl_FragColor=vec4(mix(c,uFog,fog),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const blades = mesh(grassGeo, grassMaterial); blades.frustumCulled = false;

    // Continuous boundary rope, inset marker caps and a separate advertising ring.
    const rope = mesh(new T.TorusGeometry(64, .065, 6, 384), mat(0xece6cd)); rope.rotation.x = Math.PI / 2; rope.position.y = .069;
    const pads = instanceMesh(boxGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .82 }), 96);
    for (let i = 0; i < 96; i++) { const a = i / 96 * TAU; at(pads, i, Math.sin(a)*64, .1, Math.cos(a)*64, .42,.17,.22,a, i % 4 === 0 ? 0xbbe460 : 0xf4f0df); }
    function labelTexture(text, inverted, accent) {
      return canvasTexture(1024, 128, (c,w,h) => {
        c.fillStyle = inverted ? '#dceccd' : '#102f38'; c.fillRect(0,0,w,h);
        c.fillStyle = accent || (inverted ? '#183329' : '#d6efaa'); c.font = '700 46px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text,w/2,h/2);
        c.fillStyle = '#afda66'; c.fillRect(0,h-5,w,5);
      });
    }
    const adLabels = ['CRICKET MASTERS', 'EVERY BALL. EVERYTHING.', 'THE MASTERS OVAL', 'MAKE YOUR MOMENT'];
    const adMats = adLabels.map((s,i) => new T.MeshStandardMaterial({ map: labelTexture(s, i===2), roughness:.8, emissive:0x325735, emissiveIntensity:.16 }));
    const adPanels=adMats.map(material=>instanceMesh(new T.PlaneGeometry(7.66,1.05),material,14));
    for (let i = 0; i < 56; i++) {
      const a = i / 56 * TAU, r = 70.2, width = 7.66;
      at(adPanels[i%4],Math.floor(i/4),Math.sin(a)*r,.66,Math.cos(a)*r,1,1,1,a+Math.PI);
    }

    // Tiered continuous stadium bowl. Explicit aisle gaps keep the seating believable.
    function ringBand(inner, outer, yInner, yOuter, material, start = 0, sweep = TAU, steps = 192) {
      const vertices=[], uvs=[], indices=[];
      for (let i=0;i<=steps;i++) { const a=start+sweep*i/steps; vertices.push(Math.sin(a)*inner,yInner,Math.cos(a)*inner,Math.sin(a)*outer,yOuter,Math.cos(a)*outer); uvs.push(i/steps,0,i/steps,1); }
      for (let i=0;i<steps;i++) { const k=i*2; indices.push(k,k+1,k+2,k+1,k+3,k+2); }
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(vertices,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
      const o=mesh(g,material);o.receiveShadow=true;return o;
    }
    ringBand(74,82.7,.35,6.8,concrete);
    ringBand(82.7,85,6.8,6.8,concDark);
    ringBand(85,95.6,8.7,18.4,concrete);
    ringBand(74,74,.25,1.05,concDark);
    ringBand(83.2,83.2,6.5,8.7,navy);
    ringBand(96,96,0,20,concDark);
    ringBand(95.5,98.5,18.4,18.4,concDark);
    const rowCount=22, seatsPerRow=440, seatCount=rowCount*seatsPerRow;
    const seatMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.6});
    const seatBases=instanceMesh(boxGeo,seatMaterial,seatCount);
    const seatBacks=instanceMesh(boxGeo,seatMaterial,seatCount);
    const people=[]; let seats=0;
    const seatColors=[0x163f4b,0x285560,0x3c6570,0x819985,0x285560];
    for(let row=0;row<rowCount;row++) {
      const upper=row>=10, rr=upper?85.7+(row-10)*.82:74.7+row*.77, yy=upper?9.45+(row-10)*.74:1.02+row*.58;
      for(let col=0;col<seatsPerRow;col++) {
        const aisle=col%22; if(aisle<2)continue;
        const a=(col+.5)/seatsPerRow*TAU;
        // Pavilion and scoreboard occupy dedicated bays, clear of the seated crowd.
        if(Math.abs(a-Math.PI)<.18 && upper)continue;
        const x=Math.sin(a)*rr,z=Math.cos(a)*rr, cc=seatColors[(Math.floor(col/22)+row)%seatColors.length];
        at(seatBases,seats,x,yy,z,.59,.105,.43,a,cc);
        at(seatBacks,seats,Math.sin(a)*(rr+.21),yy+.28,Math.cos(a)*(rr+.21),.59,.49,.075,a,cc);
        if(random()>.17)people.push({a,x,z,rr,y:yy,shade:random(),skin:random()}); seats++;
      }
    }
    seatBases.count=seatBacks.count=seats;
    const shirts=[0xe7e5d9,0xc0a64a,0x547c93,0x344b73,0x76805a,0x913f38,0xb58d68,0x597e70,0xbbc6cc,0x1b333a,0x7a5563,0xbeb57c];
    const skins=[0xc38c66,0x8a583a,0xd1a381,0x67472f,0xa37550,0xdfb092];
    const bodies=instanceMesh(new T.CapsuleGeometry(.19,.27,2,5),new T.MeshStandardMaterial({color:0xffffff,roughness:1}),people.length);
    const heads=instanceMesh(new T.SphereGeometry(.119,6,5),new T.MeshStandardMaterial({color:0xffffff,roughness:.95}),people.length);
    const legs=instanceMesh(boxGeo,new T.MeshStandardMaterial({color:0x35444b,roughness:1}),people.length);
    const hair=instanceMesh(new T.SphereGeometry(.12,6,4,0,TAU,0,Math.PI*.48),new T.MeshStandardMaterial({color:0xffffff,roughness:1}),people.length);
    const spectators=[];
    people.forEach((p,i)=>{
      const variation=.86+p.shade*.23;
      at(bodies,i,p.x,p.y+.4,p.z,.98,variation,1,p.a,shirts[Math.floor(p.shade*shirts.length)]);
      at(heads,i,p.x,p.y+.78*variation,p.z-.03,1,1.14,1,0,skins[Math.floor(p.skin*skins.length)]);
      at(legs,i,Math.sin(p.a)*(p.rr-.2),p.y+.03,Math.cos(p.a)*(p.rr-.2),.31,.23,.42,p.a);
      at(hair,i,p.x,p.y+.82*variation,p.z-.03,1,1,1,p.a,i%9===0?0xaaa495:0x2b241e);
      if(i%47===0)spectators.push({index:i,p,variation});
    });

    // Radial stair treads, entry tunnels and terrace railings.
    const steps=instanceMesh(boxGeo,concrete,20*22);
    let stepIndex=0;
    for(let section=0;section<20;section++){
      const a=(section*22+.5)/440*TAU;
      for(let row=0;row<22;row++){
        const upper=row>=10,rr=upper?85.7+(row-10)*.82:74.7+row*.77,yy=upper?9.15+(row-10)*.74:.75+row*.58;
        at(steps,stepIndex++,Math.sin(a)*rr,yy,Math.cos(a)*rr,1.53,.24,.75,a);
      }
      const r=83.3;
      const opening=box(2.8,2.15,.24,black,Math.sin(a)*r,7.57,Math.cos(a)*r);opening.rotation.y=a;
      const lintel=box(3.2,.2,.7,steel,Math.sin(a)*r,8.72,Math.cos(a)*r);lintel.rotation.y=a;
    }
    for(const [r,y] of [[73.7,1.35],[83.1,7.8],[85,9.6],[96.3,20]]){
      const rail=mesh(new T.TorusGeometry(r,.055,5,240),steel,0,y,0);rail.rotation.x=Math.PI/2;
    }
    const railPosts=instanceMesh(cylinderGeo,steel,160);
    for(let i=0;i<160;i++){const a=i/160*TAU;at(railPosts,i,Math.sin(a)*83.1,7.15,Math.cos(a)*83.1,.035,1.2,.035);}

    // A floating roof ribbon with open front edge and engineered cantilever frames.
    const roofMat=roofing.clone();roofMat.side=T.DoubleSide;
    ringBand(83.4,100.2,21.1,24.6,roofMat,0,TAU,240).castShadow=true;
    ringBand(83.4,83.4,20.6,21.1,navy);
    ringBand(100.2,100.2,23.65,24.6,navy);
    const roofRibs=instanceMesh(boxGeo,steel,64), roofColumns=instanceMesh(cylinderGeo,steel,64);
    const trussPairs=[];
    for(let i=0;i<64;i++){
      const a=i/64*TAU;
      at(roofColumns,i,Math.sin(a)*97.3,12.1,Math.cos(a)*97.3,.11,24.2,.11);
      const start=new T.Vector3(Math.sin(a)*83.4,20.7,Math.cos(a)*83.4),end=new T.Vector3(Math.sin(a)*100.2,24.25,Math.cos(a)*100.2);
      dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.scale.set(.16,.16,start.distanceTo(end));dummy.lookAt(end);dummy.updateMatrix();roofRibs.setMatrixAt(i,dummy.matrix);
      for(let j=0;j<4;j++){
        const r1=84+j*3.3,r2=r1+3.3,y1=20.8+(r1-83.4)*.21,y2=20.8+(r2-83.4)*.21;
        trussPairs.push([[Math.sin(a)*r1,y1,Math.cos(a)*r1],[Math.sin(a)*r2,y2-1.05,Math.cos(a)*r2]]);
        trussPairs.push([[Math.sin(a)*r1,y1-1.05,Math.cos(a)*r1],[Math.sin(a)*r2,y2,Math.cos(a)*r2]]);
      }
    }
    const trusses=instanceMesh(cylinderGeo,steel,trussPairs.length);
    const axis=new T.Vector3(0,1,0);
    trussPairs.forEach(([aa,bb],i)=>{
      const a=new T.Vector3(...aa),b=new T.Vector3(...bb),d=b.clone().sub(a);
      dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(axis,d.clone().normalize());dummy.scale.set(.045,d.length(),.045);dummy.updateMatrix();trusses.setMatrixAt(i,dummy.matrix);
    });

    // Broadcast pavilion and player balconies behind the bowler's arm.
    const glass=new T.MeshStandardMaterial({color:0x547584,metalness:.64,roughness:.23});
    const pavilion=box(30,7,8,navy,0,11,-88);pavilion.castShadow=true;
    const pavilionWindows=instanceMesh(boxGeo,glass,26);
    for(let floor=0;floor<2;floor++){
      box(31,.3,9,concrete,0,8+floor*3,-87.5);
      for(let window=0;window<13;window++)at(pavilionWindows,floor*13+window,(window-6)*2.2,9.4+floor*3,-83.93,1.83,2.1,.12);
      box(30,.45,.7,steel,0,10.75+floor*3,-83.3);
      box(30,.8,.12,glass,0,8.3+floor*3,-82.96);
    }
    box(32,.48,9.7,roofing,0,15.15,-87.5);
    const pavilionSign=mesh(new T.PlaneGeometry(20,1.3),new T.MeshBasicMaterial({map:labelTexture('THE MASTERS PAVILION',false)}),0,14.15,-83.89);
    const screenBase=box(18,9.2,.45,navy,0,20.5,-85.7);screenBase.castShadow=true;
    const scoreboardCanvas=document.createElement('canvas');scoreboardCanvas.width=1536;scoreboardCanvas.height=768;
    const scoreTexture=new T.CanvasTexture(scoreboardCanvas);scoreTexture.colorSpace=T.SRGBColorSpace;
    const scoreScreen=mesh(new T.PlaneGeometry(17.4,8.7),new T.MeshBasicMaterial({map:scoreTexture,toneMapped:false}),0,20.5,-85.43);
    let displayed='';
    function updateScore(runs=0,wickets=0,balls=0,team='Masters XI'){
      const key=team+':'+runs+':'+wickets+':'+balls;if(key===displayed)return;displayed=key;
      const c=scoreboardCanvas.getContext('2d'),w=1536,h=768;
      c.fillStyle='#07191c';c.fillRect(0,0,w,h);c.fillStyle='#cce794';c.fillRect(0,0,w,10);
      c.font='600 43px Arial';c.fillText('CRICKET MASTERS',80,92);
      c.textAlign='right';c.fillStyle='#a9c8bc';c.font='32px Arial';c.fillText('LIVE AT THE OVAL',w-80,92);
      c.textAlign='left';c.fillStyle='#94b5a7';c.font='42px Arial';c.fillText(team.toUpperCase(),83,205);
      c.fillStyle='#f6f7e9';c.font='bold 234px Arial';c.fillText(runs+' / '+wickets,65,439);
      c.fillStyle='#cce794';c.font='bold 60px Arial';c.fillText(Math.floor(balls/6)+'.'+balls%6+' OVERS',83,553);
      c.fillStyle='#41574d';c.fillRect(80,602,w-160,2);c.fillStyle='#b0c2b8';c.font='35px Arial';c.fillText('EVERY BALL. EVERYTHING.',83,690);
      c.textAlign='right';c.fillText('MASTERS SERIES',w-80,690);c.textAlign='left';
      scoreTexture.needsUpdate=true;
    }
    updateScore();
    // White sight screens sit clear of the crowd behind each set of wickets.
    for(const z of [-68.1,68.1]){
      const screen=box(10,4.4,.2,mat(0xdee3d9),0,2.4,z);screen.castShadow=true;
      for(const x of [-4.4,4.4]){box(.12,4.6,.15,steel,x,2.3,z+.25);box(1,.15,1.3,concDark,x,.12,z);}
      const slats=instanceMesh(boxGeo,white,22);
      for(let i=0;i<22;i++)at(slats,i,0,.35+i*.197,z+(z<0?.12:-.12),9.8,.08,.05);
    }

    // Four steel lattice floodlight towers, each with a 24-lamp bank.
    const lampMat=new T.MeshBasicMaterial({color:0xfff8d2,toneMapped:false});
    const mastSegments=[];
    const lampData=[];
    for(const [x,z] of [[-66,-67],[66,-67],[-66,67],[66,67]]){
      const angle=Math.atan2(-x,-z),r=1.05;
      for(const side of [-1,1])mastSegments.push([[x+side*r,0,z],[x+side*.4,33,z]]);
      for(let level=0;level<11;level++){
        const lo=level*3,hi=lo+3,rl=r-lo*.0197,rh=r-hi*.0197;
        mastSegments.push([[x-rl,lo,z],[x+rh,hi,z]],[[x+rl,lo,z],[x-rh,hi,z]]);
      }
      const bank=box(6.1,3.7,.42,concDark,x,34,z);bank.rotation.y=angle;
      for(let row=0;row<4;row++)for(let col=0;col<6;col++){
        const localX=(col-2.5)*.91,localZ=.24;
        lampData.push({x:x+Math.cos(angle)*localX+Math.sin(angle)*localZ,y:32.8+row*.78,z:z-Math.sin(angle)*localX+Math.cos(angle)*localZ,a:angle});
      }
    }
    const masts=instanceMesh(cylinderGeo,steel,mastSegments.length);
    mastSegments.forEach(([aa,bb],i)=>{const a=new T.Vector3(...aa),b=new T.Vector3(...bb),d=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(axis,d.clone().normalize());dummy.scale.set(.085,d.length(),.085);dummy.updateMatrix();masts.setMatrixAt(i,dummy.matrix);});
    const lamps=instanceMesh(boxGeo,lampMat,lampData.length);
    lampData.forEach((p,i)=>at(lamps,i,p.x,p.y,p.z,.61,.48,.13,p.a));
    const haloMap=canvasTexture(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,237,186,.5)');g.addColorStop(.13,'rgba(255,228,174,.11)');g.addColorStop(1,'rgba(255,224,160,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
    for(const [x,z] of [[-66,-67],[66,-67],[-66,67],[66,67]]){const halo=new T.Sprite(new T.SpriteMaterial({map:haloMap,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.5}));halo.position.set(x,34,z);halo.scale.set(15,15,1);root.add(halo);}

    // Quiet movement on the upper concourse: team pennants and a warm clouded sky.
    const flagGeo=new T.PlaneGeometry(2.6,1.2,12,4);
    const flagMat=new T.MeshStandardMaterial({color:0xe7e8d8,side:T.DoubleSide,roughness:1});
    flagMat.onBeforeCompile=shader=>{shader.uniforms.uTime=clockUniform;shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z += sin(position.x*2.6+uTime*3.0)*(position.x+1.3)*.17;');};
    for(let i=0;i<12;i++){const a=i/12*TAU,r=99;const x=Math.sin(a)*r,z=Math.cos(a)*r;beam([x,24.3,z],[x,29,z],.045);const flag=mesh(flagGeo,flagMat,x+1.3,28.2,z);flag.rotation.y=a;}
    const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{uSun:{value:new T.Vector3(-.43,.68,.49).normalize()}},
      vertexShader:'varying vec3 vSky;void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 vSky;uniform vec3 uSun;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
        float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+vec2(5.7,1.2);a*=.5;}return n;}
        void main(){vec3 d=normalize(vSky);float h=max(d.y,0.);vec3 c=mix(vec3(.71,.8,.83),vec3(.20,.43,.64),pow(h,.6));
          float sd=max(dot(d,uSun),0.);c+=vec3(1.,.78,.48)*pow(sd,32.)*.22;c+=vec3(1.,.91,.73)*smoothstep(.9994,.9998,sd)*3.;
          vec2 uv=d.xz/(h+.22)*1.6;float n=fbm(uv+vec2(3.,8.));float cloud=smoothstep(.52,.69,n)*smoothstep(.01,.18,h);
          c=mix(c,vec3(.9,.91,.88),cloud*.88);gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const sky=mesh(new T.SphereGeometry(490,32,20),skyMat);sky.renderOrder=-10;
    scene.fog=new T.FogExp2(0xb4cbd5,.0034);
    let crowdTime=0;
    function update(dt,time){
      clockUniform.value=time;crowdTime+=dt;
      // Selected spectators lean and move; updates are deliberately spread over time.
      if(crowdTime>.14){crowdTime=0;spectators.forEach(({index,p,variation})=>{
        const bob=Math.sin(time*1.3+index*.71)*.027;
        at(bodies,index,p.x,p.y+.4+bob,p.z,.98,variation,1,p.a+Math.sin(time*.7+index)*.035,shirts[Math.floor(p.shade*shirts.length)]);
      });bodies.instanceMatrix.needsUpdate=true;}
    }
    root.updateMatrixWorld(true);
    return {update,updateScore,setQuality(mode){grassGeo.instanceCount=({low:20000,balanced:65000,high:110000,ultra:150000,cinematic:150000})[mode]||110000;},ready:Promise.all(ready),root,stats:{grassBlades:grassCount,seats, spectators:people.length}};
  };
}());
