import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Tweakpane from 'tweakpane';

// constants
const PARAMS = {
  debug: true,
  lockCamera: false,
};
const pane = new Tweakpane();

// // global variables
let scene, camera, renderer, controls, win;

function init() {
  win = {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, win.viewportWidth / win.viewportHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  resize(win);
  // renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector('#canvas-container').appendChild(renderer.domElement);

  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  var sphereGeo = new THREE.SphereBufferGeometry(20, 6, 6);
  var sphereMat = new THREE.MeshBasicMaterial({ wireframe: true });
  var sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  camera.position.z = 5;

  controls = new OrbitControls(camera, renderer.domElement);

  // gui controls
  toggleAxesHelper(PARAMS.debug);
  togglePanorama(PARAMS.lockCamera);

  pane.addInput(PARAMS, 'debug').on('change', (value) => {
    toggleAxesHelper(value);
  });
  pane.addInput(PARAMS, 'lockCamera').on('change', (value) => {
    togglePanorama(value);
  });

  window.addEventListener('resize', (e) => {
    win.viewportHeight = window.innerHeight;
    win.viewportWidth = window.innerWidth;
    resize(win);
  }, false);
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, controls.object);
};

function resize({ pixelRatio, viewportWidth, viewportHeight }) {
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewportWidth, viewportHeight);

  camera.aspect = viewportWidth / viewportHeight;
  camera.updateProjectionMatrix();
};

function toggleAxesHelper(value) {
  if (!value) {
    scene.remove(scene.getObjectByName('axesHelper'));
  } else {
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axesHelper';
    scene.add(axesHelper);
  }
}

function togglePanorama(lockCamera) {
  if (lockCamera) {
    // save camera position
    controls.saveState();

    // prevent camera movement
    controls.enableZoom = false;
    controls.enablePan = false;
    camera.position.set(0, 0, 0.1);
    controls.target.set(0, 0, 0);
    controls.update();

    // controls.target = controls.target0; //or some appropriate target
    document.addEventListener('wheel', onDocumentMouseWheel, false);
  } else {
    // restore camera position
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.reset();

    document.removeEventListener('wheel', onDocumentMouseWheel);
  }

  lockCamera = !lockCamera;
};

function onDocumentMouseWheel(event) {
  var fov = camera.fov + event.deltaY * 0.05;
  camera.fov = THREE.Math.clamp(fov, 10, 75);
  camera.updateProjectionMatrix();
}

init();
animate();
