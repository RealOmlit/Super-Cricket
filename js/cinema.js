/* Offline depth-aware shading. Raster rendering; no hardware ray tracing. */
(function(){
 const CM=window.CM=window.CM||{},T=THREE;
 CM.createCinema=function(renderer){
  // Minimal test renderers and unsupported devices keep the standard render path.
  if(!renderer.setRenderTarget||!renderer.getDrawingBufferSize||!renderer.extensions?.has('EXT_color_buffer_float'))return {setQuality(){},render:(s,c)=>renderer.render(s,c)};
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  const uniforms={colorBuffer:{value:target.texture},depthBuffer:{value:target.depthTexture},resolution:{value:new T.Vector2(1,1)},nearPlane:{value:.1},farPlane:{value:1000},aoStrength:{value:.35},bloomStrength:{value:.08}};
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`precision highp float;
    uniform sampler2D colorBuffer,depthBuffer;uniform vec2 resolution;
    uniform float nearPlane,farPlane,aoStrength,bloomStrength;varying vec2 vUv;
    float distanceAt(vec2 uv){float d=texture2D(depthBuffer,clamp(uv,vec2(0.),vec2(1.))).x;return nearPlane*farPlane/(farPlane-d*(farPlane-nearPlane));}
    void main(){
      vec3 c=texture2D(colorBuffer,vUv).rgb;float depth=distanceAt(vUv);vec2 pixel=1./resolution;
      float shadow=0.;vec3 glow=vec3(0.);float weight=0.;
      for(int i=0;i<12;i++){
        float fi=float(i);float a=fi*2.399963;vec2 direction=vec2(cos(a),sin(a));
        float radius=mix(2.,12.,fi/11.);vec2 offset=direction*pixel*radius;
        float neighbor=distanceAt(vUv+offset);float delta=depth-neighbor;
        shadow+=smoothstep(.035,.28,delta)*(1.-smoothstep(.3,1.8,delta));
        vec3 tap=texture2D(colorBuffer,clamp(vUv+direction*pixel*(4.+fi*1.4),vec2(0.),vec2(1.))).rgb;
        glow+=tap*smoothstep(.72,1.,max(tap.r,max(tap.g,tap.b)));weight+=1.;
      }
      c*=1.-aoStrength*(shadow/12.)*(1.-smoothstep(90.,220.,depth));
      c+=glow/max(weight,1.)*bloomStrength;
      // Restrained warm highlights and cool shadows, preserving green turf.
      float lum=dot(c,vec3(.2126,.7152,.0722));
      c*=mix(vec3(.975,.995,1.025),vec3(1.025,1.008,.975),smoothstep(.18,.8,lum));
      vec2 q=vUv*2.-1.;c*=1.-.075*pow(clamp(dot(q,q)*.5,0.,1.),1.5);
      gl_FragColor=vec4(max(c,vec3(0.)),1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const screen=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  screen.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
  let enabled=true;const size=new T.Vector2();
  return {setQuality(mode){enabled=!['low','balanced'].includes(mode);uniforms.aoStrength.value=mode==='cinematic'?.55:mode==='ultra'?.44:.3;uniforms.bloomStrength.value=mode==='cinematic'?.10:.055;},
    render(scene,view){if(!enabled){renderer.render(scene,view);return;}
      renderer.getDrawingBufferSize(size);if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);uniforms.resolution.value.copy(size);}
      uniforms.nearPlane.value=view.near;uniforms.farPlane.value=view.far;
      renderer.setRenderTarget(target);renderer.render(scene,view);renderer.setRenderTarget(null);renderer.render(screen,camera);
    }};
 };
})();
