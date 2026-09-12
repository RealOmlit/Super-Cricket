/* Cricket Masters — articulated athletes. Original geometry and keyframe animation. */
(function () {
  'use strict';
  const CM = window.CM = window.CM || {};
  const T = window.THREE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const down = new T.Vector3(0, -1, 0);
  const sphere = new T.SphereGeometry(1, 24, 18);
  const fieldSphere = new T.SphereGeometry(1, 14, 10);
  const geometryCache = new Map();
  let fabricTexture;
  function noiseTexture() {
    if (fabricTexture) return fabricTexture;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); const p = x.createImageData(256, 256);
    let seed = 28375;
    for (let i = 0; i < 65536; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const weave = ((i % 256) % 3 === 0 || (i / 256 | 0) % 3 === 0) ? 8 : 0;
      const v = 236 + (seed / 4294967296) * 19 - weave;
      p.data[i * 4] = p.data[i * 4 + 1] = p.data[i * 4 + 2] = v; p.data[i * 4 + 3] = 255;
    }
    x.putImageData(p, 0, 0);
    fabricTexture = new T.CanvasTexture(c); fabricTexture.wrapS = fabricTexture.wrapT = T.RepeatWrapping;
    fabricTexture.repeat.set(3, 3); fabricTexture.colorSpace = T.SRGBColorSpace;
    return fabricTexture;
  }
  function roundedGeometry(w, h, d, radius) {
    const key = [w, h, d, radius].join('/');
    if (geometryCache.has(key)) return geometryCache.get(key);
    const g = new T.BoxGeometry(w, h, d, 5, 5, 5), p = g.attributes.position;
    const v = new T.Vector3(), q = new T.Vector3(), n = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); q.set(clamp(v.x, -w / 2 + radius, w / 2 - radius), clamp(v.y, -h / 2 + radius, h / 2 - radius), clamp(v.z, -d / 2 + radius, d / 2 - radius));
      n.copy(v).sub(q).normalize().multiplyScalar(radius); q.add(n); p.setXYZ(i, q.x, q.y, q.z);
    }
    g.computeVertexNormals(); geometryCache.set(key, g); return g;
  }
  function profileGeometry(rows, segments = 28) {
    const vertices = [], uv = [], index = [];
    rows.forEach(([y, w, depth, centerZ = 0], r) => {
      for (let j = 0; j <= segments; j++) {
        const a = j / segments * Math.PI * 2;
        vertices.push(Math.sin(a) * w, y, centerZ + Math.cos(a) * depth); uv.push(j / segments, r / (rows.length - 1));
        if (r < rows.length - 1 && j < segments) { const i = r * (segments + 1) + j; if(rows[rows.length-1][0]>rows[0][0])index.push(i,i+1,i+segments+1,i+1,i+segments+2,i+segments+1);else index.push(i,i+segments+1,i+1,i+1,i+segments+1,i+segments+2); }
      }
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(index); g.computeVertexNormals(); return g;
  }
  CM.createPlayer = function (scene, options = {}) {
    const { x = 0, z = 0, role = 'fielder', seed = 1, number = 7, team = role === 'batter' ? 'masters' : 'royals' } = options;
    const names = ['SHAH', 'WALKER', 'OKAFOR', 'KHAN', 'MORGAN', 'SILVA', 'PATEL', 'BROWN', 'REED', 'SINGH', 'CLARKE'];
    const name = options.name || names[Math.abs(seed | 0) % names.length];
    const batting = role === 'batter', keeper = role === 'keeper', umpire = role === 'umpire';
    const fieldDetail = role === 'fielder' || umpire;
    const master = team === 'masters', variation = Math.abs(seed | 0);
    const skinColors = [0xa96e48, 0x65402d, 0xc88d65, 0x815238, 0xe0ad87, 0x4e3123, 0xb87851];
    const cloth = noiseTexture();
    const material = (color, roughness = .83, other = {}) => new T.MeshStandardMaterial({ color, roughness, ...other });
    const fabric = material(umpire ? 0xb92739 : master ? 0x184d81 : 0xd7a620, .91, { map: cloth, bumpMap: cloth, bumpScale: .0012 });
    const trouser = material(umpire ? 0x192329 : master ? 0x123251 : 0x282f3c, .97, { map: cloth });
    const panel = material(umpire ? 0x951e31 : master ? 0x087d98 : 0x202a3b, .92, { map: cloth });
    const seam = material(master ? 0x4caec2 : 0xf4d777, .91);
    const skin = material(skinColors[variation % skinColors.length], .68, { bumpMap: cloth, bumpScale: .0005 });
    const lip = material(new T.Color(skin.color).multiplyScalar(.64), .64);
    const hair = material([0x17130f, 0x291b14, 0x473024, 0x121419][variation % 4], .95);
    const white = material(0xe7e9df, .73, { map: cloth });
    const rubber = material(0x20252a, .88);
    const silver = material(0x879fa4, .34, { metalness: .82 });
    const helmetMat = material(master ? 0x122942 : 0x293646, .36, { metalness: .18 });
    const group = new T.Group(); group.name = name + '_' + role; group.position.set(x, 0, z); scene.add(group);
    const stature = .97 + ((variation * 7) % 9) * .009;
    const build = .94 + ((variation * 3) % 7) * .019;
    group.scale.set(stature * build, stature, stature);
    const rig = new T.Group(); group.add(rig);
    const body = new T.Group(); body.position.y = .925; rig.add(body);
    function mesh(geo, mat, parent, px = 0, py = 0, pz = 0) {
      const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    function ell(rx, ry, rz, mat, parent, px = 0, py = 0, pz = 0) { const m = mesh(fieldDetail?fieldSphere:sphere, mat, parent, px, py, pz); m.scale.set(rx, ry, rz); return m; }
    function box(w, h, d, radius, mat, parent, px = 0, py = 0, pz = 0) { return mesh(roundedGeometry(w, h, d, radius), mat, parent, px, py, pz); }
    function tube(points, radius, mat, parent) { return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), Math.max(8, points.length * 4), radius, 5, false), mat, parent); }
    function cylinder(top, bottom, height, mat, parent, px, py, pz) { return mesh(new T.CylinderGeometry(top, bottom, height, 18), mat, parent, px, py, pz); }
    const torso = mesh(profileGeometry([[-.032,.159,.11],[0,.171,.121],[.12,.168,.121],[.26,.201,.139],[.38,.233,.143],[.45,.235,.124],[.50,.169,.093],[.528,.082,.066]]), fabric, body);
    ell(.165,.074,.119,trouser,body,0,-.006,0);
    // Side panels, piping and folds follow the tailored shirt silhouette.
    for (const side of [-1, 1]) {
      tube([[side*.156,.018,.015],[side*.181,.16,.04],[side*.209,.34,.044],[side*.219,.436,.047]], .022, panel, body);
      tube([[side*.173,.025,-.072],[side*.176,.15,-.09],[side*.216,.37,-.087]], .0035, seam, body);
      for(let i=0;i<3;i++) { const fold = ell(.059,.006,.008,panel,body,side*.105,.063+i*.033,-.116); fold.rotation.z=side*(.12+i*.12); }
    }
    ell(.061,.077,.06,skin,body,0,.54,0);
    const collar = mesh(new T.TorusGeometry(.076,.012,6,28), panel, body,0,.526,0); collar.rotation.x=Math.PI/2;
    box(.020,.057,.006,.002,panel,body,0,.481,-.105);
    for(let i=0;i<2;i++) ell(.004,.004,.003,white,body,.002,.484-i*.020,-.110);
    const head = new T.Group(); head.position.set(0,.69,-.008); body.add(head);
    // Sculpted cranial, cheek and jaw volumes with recessed facial features.
    mesh(profileGeometry([[-.116,.033,.039,-.012],[-.098,.071,.068,-.008],[-.058,.087,.079,-.005],[-.010,.099,.086,0],[.042,.105,.095,.004],[.097,.101,.099,.010],[.145,.080,.079,.015],[.168,.029,.040,.015]],32),skin,head);
    ell(.041,.042,.022,skin,head,-.058,-.010,-.073); ell(.041,.042,.022,skin,head,.058,-.010,-.073);
    ell(.017,.042,.023,skin,head,0,.008,-.094); ell(.023,.014,.028,skin,head,0,-.013,-.109);
    for (const side of [-1,1]) {
      ell(.020,.035,.023,skin,head,side*.103,.012,.002); ell(.010,.019,.009,lip,head,side*.114,.012,-.010);
      ell(.025,.013,.010,lip,head,side*.041,.040,-.087);
      ell(.021,.008,.007,white,head,side*.041,.041,-.095);
      ell(.008,.008,.004,hair,head,side*.041,.041,-.101);
      ell(.003,.003,.002,white,head,side*.039,.044,-.105);
      const brow = ell(.028,.006,.008,hair,head,side*.043,.063,-.092); brow.rotation.z=side*-.07;
      ell(.005,.004,.004,lip,head,side*.012,-.021,-.128);
    }
    ell(.029,.006,.007,lip,head,0,-.052,-.090); ell(.023,.005,.005,skin,head,0,-.061,-.089);
    // Distinct hairlines and beard patterns are part of each athlete's profile.
    if (variation % 4 !== 1) {
      const hairCap = mesh(new T.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI*.42),hair,head,0,.085,.013); hairCap.scale.set(.107,.091,.104);
      for(let k=0;k<7;k++) {const strand=ell(.023,.020,.060,hair,head,(k-3)*.024,.146-Math.abs(k-3)*.004,.009);strand.rotation.z=-.20;}
    } else { const closeCut=mesh(new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.39),hair,head,0,.079,.014);closeCut.scale.set(.104,.090,.102); }
    if (variation % 3 !== 0) {
      for(const side of [-1,1]){const beard=ell(.026,.047,.012,hair,head,side*.069,-.050,-.069);beard.rotation.z=side*-.4;ell(.035,.016,.017,hair,head,side*.024,-.088,-.056);ell(.023,.006,.010,hair,head,side*.017,-.041,-.091);}
    }
    if (batting || keeper) {
      const shell = mesh(new T.SphereGeometry(.139,32,24,0,Math.PI*2,0,Math.PI*.57),helmetMat,head,0,.064,.012); shell.scale.set(1,1.04,1.03);
      box(.24,.015,.128,.007,helmetMat,head,0,.081,-.104);
      for(const side of [-1,1]) {
        ell(.022,.069,.064,helmetMat,head,side*.126,.014,.018);
        for(let vent=0;vent<3;vent++)ell(.016,.004,.006,rubber,head,side*(.065+vent*.017),.136-vent*.012,-.077);
        tube([[side*.119,.024,.047],[side*.097,-.095,-.008],[side*.033,-.115,-.067]],.007,rubber,head);
      }
      for(let row=0;row<3;row++) tube([[-.132,.022-row*.036,-.006],[-.13,.022-row*.036,-.120],[-.09,.022-row*.036,-.164],[.09,.022-row*.036,-.164],[.13,.022-row*.036,-.120],[.132,.022-row*.036,-.006]],.0047,silver,head);
      for(const side of [-1,1])tube([[side*.102,.059,-.151],[side*.109,-.076,-.162]],.0045,silver,head);
      const crest=box(.032,.038,.006,.003,seam,head,0,.134,-.111);crest.rotation.x=-.35;
    } else if (umpire) {
      cylinder(.11,.12,.082,white,head,0,.154,.014); const brim=cylinder(.185,.185,.008,white,head,0,.112,.014); brim.scale.z=.87;
      cylinder(.121,.121,.016,rubber,head,0,.126,.014);
    } else if (variation % 3 === 0) {
      const cap=mesh(new T.SphereGeometry(.118,24,16,0,Math.PI*2,0,Math.PI*.48),panel,head,0,.080,.012);cap.scale.y=.87;
      box(.204,.012,.115,.006,panel,head,0,.088,-.105);
    }
    const hips=[], knees=[], ankles=[], arms=[], elbows=[], hands=[];
    for(const side of [-1,1]) {
      const hip=new T.Group();hip.position.set(side*.105,.914,0);rig.add(hip);hips.push(hip);
      mesh(profileGeometry([[0,.084,.09],[-.055,.102,.109],[-.18,.097,.102],[-.34,.071,.078],[-.42,.070,.069]]),trouser,hip);
      tube([[side*.068,-.02,.018],[side*.087,-.18,.015],[side*.063,-.39,.012]],.0035,panel,hip);
      const knee=new T.Group();knee.position.set(0,-.417,0);hip.add(knee);knees.push(knee);
      ell(.070,.080,.073,trouser,knee,0,-.005,0);
      mesh(profileGeometry([[0,.07,.073],[-.105,.078,.078],[-.20,.065,.068],[-.34,.047,.050],[-.396,.048,.051]]),trouser,knee);
      const ankle=new T.Group();ankle.position.set(0,-.392,0);knee.add(ankle);ankles.push(ankle);
      box(.137,.080,.268,.025,white,ankle,0,-.042,-.062);
      box(.143,.023,.283,.011,rubber,ankle,0,-.086,-.064);
      box(.145,.008,.280,.004,seam,ankle,0,-.075,-.064);
      ell(.062,.038,.067,white,ankle,0,-.021,.009);
      for(let lace=0;lace<4;lace++){const l=box(.077,.007,.009,.003,rubber,ankle,0,-.005,-.040-lace*.025);l.rotation.y=lace%2?.13:-.13;}
      for(const s of [-1,1])for(let k=0;k<3;k++)cylinder(.009,.006,.010,silver,ankle,s*.040,-.102,-.013-k*.07);
      if(batting||keeper) {
        box(.167,.335,.087,.027,white,knee,0,-.145,-.098);
        ell(.084,.077,.061,white,knee,0,.035,-.078);
        for(let rib=-2;rib<=2;rib++)box(.024,.291,.034,.011,white,knee,rib*.030,-.157,-.146);
        for(let seamI=0;seamI<3;seamI++)box(.140,.003,.006,.001,panel,knee,0,.042+seamI*.018,-.132);
        for(const yy of [-.23,-.045]) {box(.156,.027,.016,.005,panel,knee,0,yy,.071);for(const s of [-1,1])box(.012,.030,.102,.005,panel,knee,s*.078,yy,.028);}
        box(.057,.030,.004,.002,panel,knee,0,-.195,-.166);
      }
      const arm=new T.Group();arm.position.set(side*.231,.438,0);body.add(arm);arms.push(arm);
      ell(.097,.097,.100,fabric,arm,side*.010,-.025,0);
      mesh(profileGeometry([[0,.085,.085],[-.065,.090,.091],[-.170,.073,.076],[-.192,.070,.073]]),fabric,arm);
      const cuff=cylinder(.072,.072,.024,panel,arm,0,-.184,0);
      ell(.063,.095,.066,skin,arm,0,-.221,0);
      const elbow=new T.Group();elbow.position.set(0,-.298,0);arm.add(elbow);elbows.push(elbow);
      ell(.056,.059,.059,skin,elbow,0,-.005,0);
      mesh(profileGeometry([[0,.056,.058],[-.075,.065,.065],[-.162,.047,.048],[-.254,.036,.035]]),skin,elbow);
      const hand=new T.Group();hand.position.set(0,-.278,0);elbow.add(hand);hands.push(hand);
      if(batting||keeper) {
        box(.086,.026,.071,.009,panel,hand,0,.044,0);
        box(.081,.067,.054,.017,white,hand,0,-.006,-.006);
        for(let finger=0;finger<4;finger++) {box(.016,.058,.027,.006,white,hand,(finger-1.5)*.019,-.049,-.018);for(let joint=0;joint<2;joint++)box(.016,.005,.004,.002,panel,hand,(finger-1.5)*.019,-.030-joint*.019,-.033);}
        const thumb=box(.023,.059,.027,.008,white,hand,side*.046,-.003,-.010);thumb.rotation.z=side*.45;
      } else {
        ell(.040,.056,.023,skin,hand,0,-.021,0);
        for(let finger=0;finger<4;finger++)ell(.008,.035,.010,skin,hand,(finger-1.5)*.017,-.066,-.003);
        const thumb=ell(.012,.032,.013,skin,hand,side*.038,-.029,-.005);thumb.rotation.z=side*.38;
        if(variation%2===0)cylinder(.041,.041,.035,white,elbow,0,-.220,0);
      }
    }
    // Jersey lettering is rendered locally; no network font or texture dependencies.
    const patches=[];
    function textPatch(front) {
      const c=document.createElement('canvas');c.width=512;c.height=512;
      const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
      const mat=new T.MeshStandardMaterial({map,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
      const p=mesh(new T.PlaneGeometry(.328,.36),mat,body,0,.288,front?-.142:.144);if(front)p.rotation.y=Math.PI;
      patches.push({c,map,front});
    }
    function setIdentity(label,teamLabel){
      patches.forEach(({c,map,front})=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,512,512);ctx.textAlign='center';ctx.fillStyle=master?'#edf4e8':'#f7edca';
        if(front){ctx.font='800 32px Arial';ctx.fillText(umpire?'MATCH OFFICIAL':teamLabel.toUpperCase(),256,255,470);ctx.font='600 15px Arial';ctx.fillText('CRICKET • PERFORMANCE',256,286);}
        else{ctx.font='700 46px Arial';ctx.fillText(label.toUpperCase(),256,130,470);ctx.font='800 218px Arial';ctx.fillText(String(number).padStart(2,'0'),256,345);}map.needsUpdate=true;
      });
    }
    textPatch(true);textPatch(false);setIdentity(name,master?'MASTERS':'ROYALS');
    const bat=new T.Group();body.add(bat);bat.visible=batting;
    const willow=material(0xdcc398,.64);const grain=material(0xb5a079,.82);
    box(.112,.551,.053,.016,willow,bat,0,-.365,0);
    box(.069,.088,.042,.014,willow,bat,0,-.059,0);
    cylinder(.018,.022,.235,rubber,bat,0,.090,0);
    for(let k=0;k<17;k++){const grip=mesh(new T.TorusGeometry(.021,.0022,4,12),panel,bat,0,-.012+k*.013,0);grip.rotation.x=Math.PI/2;}
    for(let k=0;k<7;k++){const line=box(.0009,.459,.002,.0003,grain,bat,(k-3)*.013,-.364,-.027);line.rotation.z=(k-3)*.001;}
    box(.079,.133,.003,.001,panel,bat,0,-.18,-.030);box(.064,.015,.003,.001,seam,bat,0,-.145,-.033);
    box(.100,.013,.058,.005,rubber,bat,0,-.638,0);
    const batToe=new T.Object3D();batToe.position.set(0,-.645,0);bat.add(batToe);
    const shoulder=new T.Vector3(), targetV=new T.Vector3(), direction=new T.Vector3(), bend=new T.Vector3(), elbowPoint=new T.Vector3(), upperDir=new T.Vector3(), lowerDir=new T.Vector3();
    const upperQ=new T.Quaternion(), lowerQ=new T.Quaternion();
    function solveArm(index,target,bendHint) {
      shoulder.copy(arms[index].position);direction.copy(target).sub(shoulder);
      const reach=clamp(direction.length(),.035,.574);direction.normalize();
      const upperLength=.298,lowerLength=.278;
      const along=(upperLength*upperLength-lowerLength*lowerLength+reach*reach)/(2*reach);
      const away=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
      bend.copy(bendHint).addScaledVector(direction,-bendHint.dot(direction)).normalize();
      elbowPoint.copy(shoulder).addScaledVector(direction,along).addScaledVector(bend,away);
      targetV.copy(shoulder).addScaledVector(direction,reach);
      upperDir.copy(elbowPoint).sub(shoulder).normalize();lowerDir.copy(targetV).sub(elbowPoint).normalize();
      upperQ.setFromUnitVectors(down,upperDir);lowerQ.setFromUnitVectors(down,lowerDir);
      arms[index].quaternion.copy(upperQ);elbows[index].quaternion.copy(upperQ).invert().multiply(lowerQ);
      // Knuckles turn around the shared bat grip rather than hanging as fists.
      hands[index].quaternion.copy(lowerQ).invert().multiply(bat.quaternion);hands[index].rotateX(Math.PI*.46);
    }
    const gripA=new T.Vector3(),gripB=new T.Vector3(),hintA=new T.Vector3(-1,-.3,.2),hintB=new T.Vector3(1,-.2,.1);
    const solePoint=new T.Vector3();
    function holdBat() {
      // Constrain the shared prop to the intersection of both arms' reach.
      // This prevents a hand from detaching at the end of an ambitious loft.
      for(let pass=0;pass<6;pass++)for(let i=0;i<2;i++){
        targetV.set(0,i===0?.093:.023,0).applyQuaternion(bat.quaternion).add(bat.position);
        direction.copy(targetV).sub(arms[i].position);const distance=direction.length();
        if(distance>.573)bat.position.addScaledVector(direction,-(distance-.573)/distance);
      }
      gripA.set(0,.093,0).applyQuaternion(bat.quaternion).add(bat.position);
      gripB.set(0,.023,0).applyQuaternion(bat.quaternion).add(bat.position);
      solveArm(0,gripA,hintA);solveArm(1,gripB,hintB);
    }
    // Preserve animated joints while batching all stationary pieces on each joint.
    // Helmet bars, pad ribs, fingers, laces and facial details remain real geometry.
    const fieldPalette = fieldDetail ? material(0xffffff,.84,{map:cloth,vertexColors:true}) : null;
    function batchJoint(parent) {
      for(const child of [...parent.children])if(!child.isMesh)batchJoint(child);
      const batches=new Map();
      for(const child of parent.children)if(child.isMesh){const key=fieldDetail&&!child.material.transparent?'palette':child.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);}
      for(const parts of batches.values()) {
        if(parts.length<2)continue;
        let count=0,indexCount=0;
        for(const part of parts){count+=part.geometry.attributes.position.count;indexCount+=part.geometry.index?part.geometry.index.count:part.geometry.attributes.position.count;}
        const palette=fieldDetail&&!parts[0].material.transparent;
        const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),indices=new Uint32Array(indexCount),colors=palette?new Float32Array(count*3):null;
        const v=new T.Vector3(),n=new T.Vector3(),normalMatrix=new T.Matrix3();let offset=0,idx=0;
        for(const part of parts){
          part.updateMatrix();normalMatrix.getNormalMatrix(part.matrix);
          const attrs=part.geometry.attributes,pos=attrs.position,norm=attrs.normal;
          for(let i=0;i<pos.count;i++){
            v.fromBufferAttribute(pos,i).applyMatrix4(part.matrix);n.fromBufferAttribute(norm,i).applyMatrix3(normalMatrix).normalize();
            positions.set([v.x,v.y,v.z],(offset+i)*3);normals.set([n.x,n.y,n.z],(offset+i)*3);
            if(colors){const color=part.material.color;colors.set([color.r,color.g,color.b],(offset+i)*3);}
            if(attrs.uv)uv.set([attrs.uv.getX(i),attrs.uv.getY(i)],(offset+i)*2);
          }
          if(part.geometry.index)for(let i=0;i<part.geometry.index.count;i++)indices[idx++]=part.geometry.index.getX(i)+offset;
          else for(let i=0;i<pos.count;i++)indices[idx++]=i+offset;
          offset+=pos.count;parent.remove(part);
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('normal',new T.BufferAttribute(normals,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(new T.BufferAttribute(indices,1));geo.computeBoundingSphere();
        if(colors)geo.setAttribute('color',new T.BufferAttribute(colors,3));
        mesh(geo,palette?fieldPalette:parts[0].material,parent);
      }
    }
    function resetPose() {
      rig.position.set(0,0,0);rig.rotation.set(0,0,0);body.position.y=.925;body.rotation.set(0,0,0);head.rotation.set(0,0,0);
      for(let i=0;i<2;i++){hips[i].rotation.set(0,0,0);knees[i].rotation.set(0,0,0);ankles[i].rotation.set(0,0,0);arms[i].rotation.set(0,0,i===0?-.085:.085);elbows[i].rotation.set(.07,0,0);hands[i].rotation.set(0,0,0);}
    }
    function update(dt,time,state={}) {
      const action=state.action||'idle',p=clamp(state.progress||0,0,1),phase=time*9.5+variation*.6;
      resetPose();
      const breath=Math.sin(time*2.3+variation)*.0035;body.position.y+=breath;
      head.rotation.y=Math.sin(time*.7+variation)*.035;
      if(action==='run') {
        const step=Math.sin(phase),step2=Math.cos(phase);rig.position.y=Math.abs(step2)*.035;
        body.rotation.x=.105;body.rotation.z=step*.045;body.rotation.y=step*.07;
        hips[0].rotation.x=step*.71;hips[1].rotation.x=-step*.71;
        knees[0].rotation.x=-.16-Math.max(0,-step)*1.14;knees[1].rotation.x=-.16-Math.max(0,step)*1.14;
        arms[0].rotation.x=-step*.69;arms[1].rotation.x=step*.69;elbows[0].rotation.x=elbows[1].rotation.x=1.13;
        ankles[0].rotation.x=Math.max(0,-step)*.35;ankles[1].rotation.x=Math.max(0,step)*.35;
      } else if(action==='bowl') {
        const load=smooth(p/.36),release=smooth((p-.35)/.33),finish=smooth((p-.68)/.32);
        body.rotation.x=mix(-.12,.57,release)-finish*.17;body.rotation.y=.20*(1-release)-finish*.24;
        rig.position.y=Math.sin(Math.PI*clamp(p/.64,0,1))*.13;
        hips[0].rotation.x=.55*load-.89*release+.55*finish;hips[1].rotation.x=-.40*load+.93*release-.30*finish;
        knees[0].rotation.x=-.65*load+.47*release;knees[1].rotation.x=-.25-.42*finish;
        arms[1].rotation.set(mix(-.65,-3.25,load)-release*2.02-finish*.34,0,.08);elbows[1].rotation.x=.22*(1-release);
        arms[0].rotation.set(mix(1.0,2.64,load)-release*3.45,0,-.18);elbows[0].rotation.x=.40+.78*release;
        head.rotation.x=-body.rotation.x*.7;
      } else if(action==='field') {
        const reach=Math.sin(Math.PI*p);rig.position.y=-reach*.37;body.rotation.x=reach*.62;
        hips[0].rotation.x=.50*reach;hips[1].rotation.x=.38*reach;knees[0].rotation.x=knees[1].rotation.x=-.91*reach;
        arms.forEach((a,i)=>{a.rotation.x=reach*.78;a.rotation.z=(i?1:-1)*.13;elbows[i].rotation.x=reach*.24;});head.rotation.x=-.35*reach;
      } else if(action==='celebrate') {
        const rise=smooth(p/.22);rig.position.y=Math.max(0,Math.sin(p*Math.PI*4))*.09;
        arms[0].rotation.set(2.7*rise,0,-.36*rise);arms[1].rotation.set(2.9*rise,0,.32*rise);
        elbows[0].rotation.x=.30;elbows[1].rotation.x=.37;head.rotation.x=-.19*rise;
      } else if(keeper || (!batting&&!umpire)) {
        const crouch=keeper?.48:.075;rig.position.y=-crouch*.55;body.rotation.x=crouch;
        hips[0].rotation.x=hips[1].rotation.x=crouch*(keeper?1.20:.65);knees[0].rotation.x=knees[1].rotation.x=-crouch*(keeper?2.10:1.35);
        arms[0].rotation.x=arms[1].rotation.x=.12+crouch;elbows[0].rotation.x=elbows[1].rotation.x=.07;
        if(keeper){arms[0].rotation.z=.10;arms[1].rotation.z=-.10;}
      }
      if(batting) {
        if(action!=='run'&&action!=='celebrate') {
          rig.position.y=-.055;hips[0].rotation.x=.15;hips[1].rotation.x=.08;knees[0].rotation.x=-.23;knees[1].rotation.x=-.15;
          body.rotation.x=.10;body.rotation.y=-.12;
          bat.position.set(.015,-.005,-.257);bat.rotation.set(-.08,0,-.06+Math.sin(time*2)*.016);
          if(action==='swing') {
            const lift=smooth(p/.27),hit=smooth((p-.27)/.32),follow=smooth((p-.59)/.41),loft=state.loft?1:0;
            bat.position.set(mix(.015,.22,lift)-hit*.32+follow*.22,mix(-.005,.29,lift)-hit*.24+follow*(.37+loft*.13),mix(-.257,.035,lift)-hit*.42+follow*.12);
            bat.rotation.set(mix(-.08,-1.18,lift)+hit*2.44+follow*(1.72+loft*.45),mix(0,-.38,lift)+hit*.76+follow*.70,mix(-.06,-.25,lift)+hit*.50-follow*.9);
            body.rotation.y=-.12-lift*.32+hit*.74+follow*.30+(state.aim||0)*.16;
            body.rotation.x=.10+hit*.12-follow*.20;head.rotation.y=-body.rotation.y*.72;
            hips[0].rotation.x=.15+hit*.23;hips[1].rotation.x=.08-hit*.15;knees[0].rotation.x=-.23-hit*.11;
          }
          holdBat();
        } else if(action==='run') {bat.position.set(.32,.01,-.10);bat.rotation.set(.5,0,-.45);holdBat();}
        else {bat.position.set(.32,.70,-.02);bat.rotation.set(0,0,Math.PI);holdBat();}
      }
      // Keep the supporting boot on the turf during a crouch and follow-through.
      // A positive jump/run height remains intact.
      let soleHeight=Infinity;
      for(let i=0;i<2;i++)for(const toe of [-.205,.067]){
        solePoint.set(0,-.095,toe).applyQuaternion(ankles[i].quaternion).add(ankles[i].position).applyQuaternion(knees[i].quaternion).add(knees[i].position).applyQuaternion(hips[i].quaternion).add(hips[i].position);
        soleHeight=Math.min(soleHeight,solePoint.y+rig.position.y);
      }
      if(soleHeight<0)rig.position.y-=soleHeight;
    }
    batchJoint(rig);
    update(0,0,{action:'idle'});
    return {group,g:group,rig,body,head,torso,bat,batToe,arms,elbows,hands,hips,knees,ankles,home:new T.Vector3(x,0,z),role,name,number,update,setIdentity,
      getHandPosition(index=1,target=new T.Vector3()){group.updateMatrixWorld(true);return hands[index].getWorldPosition(target);},
      getBatPosition(target=new T.Vector3()){group.updateMatrixWorld(true);return batToe.getWorldPosition(target);}
    };
  };
})();
