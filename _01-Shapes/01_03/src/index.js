// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Tweakpane from 'tweakpane';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';
import colorConvert from 'color-convert';
// import CubemapToEquirectangular from 'three.cubemap-to-equirectangular';

// import { hsv2hsl } from '../../../js/convert-colors.js';

// constants
const PARAMS = {
  debug: false,
  lockCamera: true,
  background: 0xffffff,
  elevation: 0,
};
const pane = new Tweakpane();

// // global variables
let direction, scene, camera, renderer, controls, win, palette, meshes, capturer360;

let floors = 8; // nr. of floors is used to calculate elevation speed
let elevationMin = 0;
let elevationMax = 2;

function init() {
  win = {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };

  scene = new THREE.Scene();

  capturer360 = new CCapture({
      format: 'threesixty',
      display: true,
      autoSaveTime: 3,
  });

  // function startCapture360(event) {
  //     capturer360.start();
  // }

  // function stopCapture360(event) {
  //     capturer360.stop();
  // }

  camera = new THREE.PerspectiveCamera(75, win.viewportWidth / win.viewportHeight, 0.1, 1000);
  // camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  resize(win);
  // renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector('#canvas-container').appendChild(renderer.domElement);

  // equiManaged = new CubemapToEquirectangular( renderer, true );
  // window.equiManaged = new CubemapToEquirectangular(renderer, true, '4K');

  // WebGL background color
  // renderer.setClearColor(PARAMS.background, 1);
  scene.background = new THREE.Color(PARAMS.background);

  camera.position.z = 5;

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // gui controls
  toggleAxesHelper(PARAMS.debug);
  togglePanorama(PARAMS.lockCamera);

  pane.addInput(PARAMS, 'debug').on('change', (value) => {
    toggleAxesHelper(value);
  });
  pane.addInput(PARAMS, 'lockCamera', { label: 'lift view' }).on('change', (value) => {
    togglePanorama(value);
  });
  pane.addInput(PARAMS, 'background', { input: 'color' }).on('change', (value) => {
    const c = value.comps_;
    const chsl = colorConvert.hsv.hsl(c[0],c[1],c[2]);
    const color = `hsl(${chsl[0]}%, ${chsl[1]}%, ${chsl[2]}%)`;
    // console.log(color, colorConvert.hsv.hex(c[0],c[1],c[2]));
    scene.background = color;
    // renderer.setClearColor(colorConvert.hsv.hsl(c[0],c[1],c[2]), 1);
  });
  pane.addSeparator();
  pane.addInput(PARAMS, 'elevation', {
    min: elevationMin, max: elevationMax,
  });
  // pane.addSeparator();
  // pane.addButton({title: 'Save Frame'}).on('click', () => {
  //   equiManaged.update(camera, scene);
  // });
  pane.addSeparator();
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

  restart();
}


 // Re-use the same Geometry across all our cubes
 const geometry = new THREE.BoxGeometry(1, 1, 1);
 // The # of cubes to create
 const chunks = 500;

// reset scene
function restart(event) {
  // A group that will hold all of our cubes
  const container = new THREE.Group();

  // Get a palette for our scene
  palette = random.pick(palettes);

  // Create each cube and return a THREE.Mesh
  meshes = Array.from(new Array(chunks)).map(() => {
    // Basic "unlit" material with no depth
    const material = new THREE.MeshBasicMaterial({
      // Avoid popping
      depthTest: false,
      color: random.pick(palette)
    });

    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Randomize it
    randomizeMesh(mesh);

    return mesh;
  });

  // Add meshes to the group
  meshes.forEach(m => container.add(m));

  container.name = 'meshContainer';
  const oldContainer = scene.getObjectByName(container.name);

  if (direction === 'up') {
    PARAMS.elevation = elevationMin;
  } else {
    PARAMS.elevation = elevationMax;
  }
  console.log(PARAMS.elevation);
  pane.refresh();

  // remove elements from the scene if there are any
  if (oldContainer) {
    scene.remove(oldContainer);
  }
  // Then add the group to the scene
  scene.add(container);
}

const start = performance.now();
let time = 0;
let delta = 0;
let before = start;
function animate(now) {
  requestAnimationFrame(animate);
  delta = before - now;
  before = now;
  time += start;


  // PARAMS.elevation = 1 * Math.sin(time) + 20;
  // console.log(time, PARAMS.elevation);
  // camera.position.y = PARAMS.elevation;

  // Animate each mesh with noise
  meshes.forEach(mesh => {
    const f = 0.5;
    mesh.position.x = mesh.originalPosition.x + 0.25 * random.noise3D(
      mesh.originalPosition.x * f,
      mesh.originalPosition.y * f,
      mesh.originalPosition.z * f,
    );
    mesh.position.y = mesh.originalPosition.y + 0.25 * random.noise3D(
      mesh.originalPosition.x * f,
      mesh.originalPosition.y * f,
      mesh.originalPosition.z * f,
      time * 0.00001,
    ) - (PARAMS.elevation  - (elevationMax / 2));
  });

  controls.update();
  capturer360.capture(renderer.domElement);
  renderer.render(scene, controls.object);
};

function randomizeMesh(mesh) {
  // Choose a random point in a 3D volume between with no elements in the center
  const coords = [];
  const exclude = 0.1; // inner radius to exclude
  const radius = 2;
  const theta = random.range(0, 1) * 2.0 * Math.PI;

  const dist = radius * Math.sqrt(random.range(exclude, 1));

  // generates random position in a circle
  coords[0] = (radius * Math.cos(theta)) * dist;
  coords[1] = (radius * Math.sin(theta)) * dist;

  const point = new THREE.Vector3(
    coords[0], // x: blue
    random.range(-2, 2), // y: green
    coords[1], // z: red
  );
  mesh.position.copy(point);
  mesh.originalPosition = mesh.position.clone();

  // Choose a color for the mesh material
  mesh.material.color.set(random.pick(palette));

  // Randomly scale each axis
  mesh.scale.set(
    random.gaussian(),
    random.gaussian(),
    random.gaussian()
  );

  // Do more random scaling on each axis
  if (random.chance(0.5)) mesh.scale.x *= random.gaussian();
  if (random.chance(0.5)) mesh.scale.y *= random.gaussian();
  if (random.chance(0.5)) mesh.scale.z *= random.gaussian();

  // Further scale each object
  mesh.scale.multiplyScalar(random.gaussian() * 0.25);
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
    // controls.saveState();

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

function onKeydown(event) {
  if (event.keyCode === 32) restart() // 32 = Space
  if (event.keyCode === 38) direction = 'up' // 38 = ArrowUp
  if (event.keyCode === 40) direction = 'down' // 40 = ArrowDown
}

init();
animate();
