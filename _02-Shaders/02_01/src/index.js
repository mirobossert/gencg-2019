import Tweakpane from 'tweakpane';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';
import colorConvert from 'color-convert';
import { getRideDuration, simulateRide } from '../../../js/utils/animation';

// gui parameters
const PARAMS = {
  debug: false,
  lockCamera: true,
  background: '#ffffff',
  elevation: 0,
};
const pane = new Tweakpane();

// create a capturer that exports Equirectangular 360 JPG images in a TAR file
const capturer360 = new CCapture({
  format: 'threesixty',
  display: true,
  autoSaveTime: 3,
  framerate: 30,
});

let renderer, canvas, plane;
let controls;
let direction = 'up';

let rideDuration = getRideDuration(2); // nr. of floors is used to calculate elevation speed
let elevationMin = 0;
let elevationMax = 2;

// these objects need to be globally available for CCapture
window.equiManaged;
window.camera;
window.scene;

const win = {
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
};

/*
* initialize scene
*/
function init() {
  window.scene = new THREE.Scene();

  window.camera = new THREE.PerspectiveCamera(50, win.viewportWidth / win.viewportHeight, 0.1, 20000);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  resize(win); // sets renderer size and dpr

  window.equiManaged = new CubemapToEquirectangular(renderer, true, '8K');

  document.getElementById('canvas-container').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(window.camera, renderer.domElement);
  window.camera.position.z = 200;

  /*
  * add gui items
  */
  pane.addSeparator();
  pane.addInput(PARAMS, 'elevation', {
    min: elevationMin, max: elevationMax,
  });
  // BUTTONS
  pane.addSeparator();
  pane.addButton({title: 'Start Capture'}).on('click', () => {
    startCapture360();
  });
  pane.addButton({title: 'Stop Capture'}).on('click', () => {
    stopCapture360();
  });
  pane.addSeparator();
  pane.addButton({title: 'Start Ride'}).on('click', () => {
    startRide();
  });
  pane.addButton({title: 'Capture Ride'}).on('click', () => {
    startCapture360();
    startRide();
  });

  generateScene();
}

let start = performance.now();

function animate(delta) {
  requestAnimationFrame(animate);
  const time = (performance.now() - start) / 1000;

  plane.material.uniforms.uTime.value = time;

  controls.update(delta);

  renderer.render(window.scene, window.camera);
  capturer360.capture(canvas);
}








/*
* generate scene
*/
function generateScene() {
  const material = new THREE.RawShaderMaterial({
    vertexShader: `
      // attributes of our mesh
      attribute vec3 position;
      attribute vec2 uv;

      // built-in uniforms from ThreeJS camera and Object3D
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat3 normalMatrix;

      // custom uniforms to build up our tubes
      uniform float uTime;

      // pass a few things along to the vertex shader
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 pos = vec4(position, 1.0);
        gl_Position = pos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uHue;
      uniform float uHueVariation;
      uniform float uDensity;
      uniform float uDisplacement;
      uniform float uGradient;

      varying vec2 vUv;

      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      float hue2rgb(float f1, float f2, float hue) {
          if (hue < 0.0)
              hue += 1.0;
          else if (hue > 1.0)
              hue -= 1.0;
          float res;
          if ((6.0 * hue) < 1.0)
              res = f1 + (f2 - f1) * 6.0 * hue;
          else if ((2.0 * hue) < 1.0)
              res = f2;
          else if ((3.0 * hue) < 2.0)
              res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
          else
              res = f1;
          return res;
      }

      vec3 hsl2rgb(vec3 hsl) {
          vec3 rgb;

          if (hsl.y == 0.0) {
              rgb = vec3(hsl.z); // Luminance
          } else {
              float f2;

              if (hsl.z < 0.5)
                  f2 = hsl.z * (1.0 + hsl.y);
              else
                  f2 = hsl.z + hsl.y - hsl.y * hsl.z;

              float f1 = 2.0 * hsl.z - f2;

              rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
              rgb.g = hue2rgb(f1, f2, hsl.x);
              rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
          }
          return rgb;
      }

      vec3 hsl2rgb(float h, float s, float l) {
          return hsl2rgb(vec3(h, s, l));
      }

      float noise(vec3 p){
          vec3 a = floor(p);
          vec3 d = p - a;
          d = d * d * (3.0 - 2.0 * d);

          vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
          vec4 k1 = perm(b.xyxy);
          vec4 k2 = perm(k1.xyxy + b.zzww);

          vec4 c = k2 + a.zzzz;
          vec4 k3 = perm(c);
          vec4 k4 = perm(c + 1.0);

          vec4 o1 = fract(k3 * (1.0 / 41.0));
          vec4 o2 = fract(k4 * (1.0 / 41.0));

          vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
          vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

          return o4.y * d.y + o4.x * (1.0 - d.y);
      }

      vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

      float cnoise(vec2 P){
          vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
          vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
          Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
          vec4 ix = Pi.xzxz;
          vec4 iy = Pi.yyww;
          vec4 fx = Pf.xzxz;
          vec4 fy = Pf.yyww;
          vec4 i = perm(perm(ix) + iy);
          vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
          vec4 gy = abs(gx) - 0.5;
          vec4 tx = floor(gx + 0.5);
          gx = gx - tx;
          vec2 g00 = vec2(gx.x,gy.x);
          vec2 g10 = vec2(gx.y,gy.y);
          vec2 g01 = vec2(gx.z,gy.z);
          vec2 g11 = vec2(gx.w,gy.w);
          vec4 norm = 1.79284291400159 - 0.85373472095314 *
          vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
          g00 *= norm.x;
          g01 *= norm.y;
          g10 *= norm.z;
          g11 *= norm.w;
          float n00 = dot(g00, vec2(fx.x, fy.x));
          float n10 = dot(g10, vec2(fx.y, fy.y));
          float n01 = dot(g01, vec2(fx.z, fy.z));
          float n11 = dot(g11, vec2(fx.w, fy.w));
          vec2 fade_xy = fade(Pf.xy);
          vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
          float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
          return 2.3 * n_xy;
      }

      void main () {
        float mouseDistance = 0.0; // length(vUv - uMousePosition)
        float t = uTime * .005;
        float elevation =  vUv.y * uDensity * 30.0;

        float shadow = smoothstep(0.0, .3 + sin(t * 5.0 * 3.14) * .1 , mouseDistance);
        elevation += shadow * 5.0;

        float displacement = cnoise( vec2( t + vUv.y * 2.0, t + vUv.x * 3.0 )) * uDisplacement * 3.0 ;

        elevation += displacement * 4.0;
        elevation *= 2.0 + cnoise( vec2( t + vUv.y * 1.0, t + .5)) * 2.0 ;

        //elevation += cnoise ( vec2 (elevation * .1, t * 3.0) );

        float light = .9 + fract(elevation) ;
        light *= .9 + (1.0 - (displacement * displacement)) * .1;
        elevation = floor(elevation);
        //elevation += uGradient * .25;

        float hue =  uHue + shadow * .1 + cnoise( vec2( elevation * .10, .1 + t)) * uHueVariation;
        float saturation = .6;;
        float brightness =  - (1.0 - shadow) * .1 + .5  - smoothstep( 0.0, .9,  cnoise( vec2( elevation * .5, .4 + t * 5.0)) ) * .1;


        vec3 hslCol = vec3( hue, saturation, brightness);
        vec3 col = hsl2rgb(hslCol) * vec3(light, 1.0, 1.0);


        /* circle:
        float d = length(vUv- vec2(.5,.5));
        float radius = .1;// + (t * .1);
        float stroke = 0.001;
        float smoothing = .0005;
        d = smoothstep(radius, radius+smoothing, d) - smoothstep(radius+stroke, radius+stroke+smoothing, d);

        col += d;// * 10.0;
        */

        gl_FragColor = vec4(col, 1.);
      }
    `,

    uniforms: {
      uTime: { type: 'f', value: 0 },
      uHue: {type: 'f', value: random.value()},
      uHueVariation: {type: 'f', value: .01},
      uGradient: {type: 'f', value: .5},
      uDensity: {type: 'f', value: 1.5},
      uDisplacement: {type: 'f', value: 2},
    }
  });

  const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
  plane = new THREE.Mesh(planeGeometry, material);
  scene.add(plane);

  // set starting point
  if (direction === 'up') {
    PARAMS.elevation = elevationMin;
  } else {
    PARAMS.elevation = elevationMax;
  }

  pane.refresh();
}









/*
* handle window resize
*/
window.addEventListener('resize', (e) => {
  win.viewportHeight = window.innerHeight;
  win.viewportWidth = window.innerWidth;
  resize(win);
}, false);

function resize({ pixelRatio, viewportWidth, viewportHeight }) {
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewportWidth, viewportHeight);

  camera.aspect = viewportWidth / viewportHeight;
  camera.updateProjectionMatrix();
};

/*
* start and stop CCapture
*/
function startCapture360(event) {
  capturer360.start();
}

function stopCapture360(event) {
  capturer360.stop();
}

/*
* toggle debug helpers
*/
function toggleAxesHelper(value) {
  if (!value) {
    scene.remove(scene.getObjectByName('axesHelper'));
  } else {
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axesHelper';
    scene.add(axesHelper);
  }
}

/*
* api for lift commands
*/
function restart() {
  if (direction === 'up') {
    PARAMS.elevation = 0;
  } else {
    PARAMS.elevation = elevationMax;
  }

  pane.refresh();

  generateScene();
  startRide();
}

/*
* call order: direction - floor -space
*/
document.addEventListener('keydown', onKeydown, false);
function onKeydown(event) {
  if (event.keyCode === 32) restart() // 32 = Space
  if (event.keyCode === 38) direction = 'up' // 38 = ArrowUp
  if (event.keyCode === 40) direction = 'down' // 40 = ArrowDown
}

init();
animate();