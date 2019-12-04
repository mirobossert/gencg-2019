import Tweakpane from 'tweakpane';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';
import colorConvert from 'color-convert';

// constants
const PARAMS = {
  debug: false,
  lockCamera: true,
  background: 0xffffff,
  elevation: 0,
};
const pane = new Tweakpane();

// // global variables
var equiManaged;
let win, scene, camera, capturer360, controls, renderer, canvas;

function init() {
  win = {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };

  capturer360 = new CCapture({
      format: 'threesixty',
      display: true,
      autoSaveTime: 3,
  });

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  equiManaged = new CubemapToEquirectangular(renderer, true, '4K');
  var container = document.getElementsByClassName('container')[0];
  canvas = container.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, container);
  camera.position.z = 0.01;

  pane.addButton({title: 'Capture Start'}).on('click', () => {
    capturer360.start();
  });
  pane.addButton({title: 'Capture Stop'}).on('click', () => {
    capturer360.stop();
  });

  window.addEventListener('resize', (e) => {
    win.viewportHeight = window.innerHeight;
    win.viewportWidth = window.innerWidth;
    resize(win);
  }, false);
  document.addEventListener('keydown', onKeydown, false);
}

function animate(delta) {
  requestAnimationFrame(animate);

  controls.update(delta);

  renderer.render(scene, camera);
  capturer360.capture(canvas);
}

function onKeydown(event) {
  if (event.keyCode === 32) restart() // 32 = Space
  if (event.keyCode === 38) direction = 'up' // 38 = ArrowUp
  if (event.keyCode === 40) direction = 'down' // 40 = ArrowDown
}

init();
animate();
