import Tweakpane from 'tweakpane';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';
import colorConvert from 'color-convert';
import { getRideDuration, simulateRide } from '../../../js/utils/animation';

// gui parameters
const PARAMS = {
  debug: false,
  lockCamera: true,
  background: 0xffffff,
  elevation: 0,
};
const pane = new Tweakpane();

// create a capturer that exports Equirectangular 360 JPG images in a TAR file
const capturer360 = new CCapture({
  format: 'threesixty',
  display: true,
  autoSaveTime: 3,
  framerate: 60,
});

let renderer, canvas;
let meshes = [];
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

  window.camera = new THREE.PerspectiveCamera(75, win.viewportWidth / win.viewportHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  resize(win); // sets renderer size and dpr

  window.equiManaged = new CubemapToEquirectangular(renderer, true, '8K');

  document.getElementById('canvas-container').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(window.camera, renderer.domElement);
  window.camera.position.z = 5;

  /*
  * add gui items
  */
  // DEBUG
  toggleAxesHelper(PARAMS.debug);
  togglePanorama(PARAMS.lockCamera);
  pane.addInput(PARAMS, 'debug').on('change', (value) => {
    toggleAxesHelper(value);
  });
  pane.addInput(PARAMS, 'lockCamera', { label: 'lift view' }).on('change', (value) => {
    togglePanorama(value);
  });
  // ELEVATOR POSITION
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
let posY = 0;
let isAnimating = false;
function startRide() {
  start = performance.now();
  posY = PARAMS.elevation;
  isAnimating = true;
}

function animate(delta) {
  requestAnimationFrame(animate);
  const time = (performance.now() - start) / 1000;

  /*
  t is current time
  b is start value
  c is change in value
  rd is ride duration
  td is transition duration
  */
  if (isAnimating) {
    if (direction === 'up') {
      posY += simulateRide(time, 0, 1, rideDuration, 2.5) * 0.005;
    } else {
      posY -= simulateRide(time, 0, 1, rideDuration, 2.5) * 0.005;
    }
    // console.log(simulateRide(time, 0, 1, rideDuration, 2.5));
    PARAMS.elevation = posY;
    if (time > rideDuration) {
      isAnimating = false;
      // console.log('finished');
    }
  }

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
      delta * 0.00005,
    ) - (PARAMS.elevation - (elevationMax / 2));
  });

  controls.update(delta);

  renderer.render(window.scene, window.camera);
  capturer360.capture(canvas);
}








/*
* generate scene
*/

// Re-use the same Geometry across all our cubes
const geometry = new THREE.BoxGeometry(1, 1, 1);
// The # of cubes to create
const chunks = 500;

// reset scene
function generateScene() {
  // A group that will hold all of our cubes
  const container = new THREE.Group();

  // Get a palette for our scene
  const palette = random.pick(palettes);

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
    randomizeMesh(mesh, palette);

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

  pane.refresh();

  // remove elements from the scene if there are any
  if (oldContainer) {
    scene.remove(oldContainer);
  }
  // Then add the group to the scene
  scene.add(container);
}

/*
* randomize mesh
*/
function randomizeMesh(mesh, palette) {
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
* toggle camera position for debugging
*/
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


/*
* api for lift commands
*/
function restart() {
  generateScene();
}
function setDirection() {
  if (direction === 'up') {
    PARAMS.elevation = 0;
  } else {
    PARAMS.elevation = elevationMax;
  }
  // console.log(direction, PARAMS.elevation);
  pane.refresh();
  startRide();
}

document.addEventListener('keydown', onKeydown, false);
function onKeydown(event) {
  if (event.keyCode === 32) restart() // 32 = Space
  if (event.keyCode === 38) {
    direction = 'up';
    setDirection() // 38 = ArrowUp
  }
  if (event.keyCode === 40) {
    direction = 'down';
    setDirection() // 40 = ArrowDown
  }
}


init();
animate();
