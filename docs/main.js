import * as THREE from "three";
import {GUI} from "three/examples/jsm/libs/dat.gui.module";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

let canvas, renderer, scene, camera, geometry, gui;
let target, ground;
let phi, theta, alt, raycaster;
let onPress = false;
let nextPos;
let vPhi, vTheta, vAlt;
let pos;
let cameraVelocity;
let reflectionThreshold;
let _dir;
let isCollision;
let intersectObjects;
let controls;

const param = {
  reflectionThreshold: 0.1,
};

function init() {
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({canvas});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  reflectionThreshold = 0.1;
  _dir = new THREE.Vector3(0, 0, 0);
  isCollision = false;
  intersectObjects = [];

  raycaster = new THREE.Raycaster();
  cameraVelocity = new THREE.Vector3(0, 0, 0);
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  // camera.position.set(0, 0, 10);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  controls = new OrbitControls(camera, canvas);
  controls.update();

  const dLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dLight.position.set(30, 30, 30); // ライトの方向
  const aLight = new THREE.AmbientLight(0xffffff, 0.2);
  dLight.castShadow = true;
  dLight.shadow.mapSize.width = 2048; // default
  dLight.shadow.mapSize.height = 2048; // default
  dLight.shadow.camera.near = 0.01; // default
  dLight.shadow.camera.far = 500; // default
  dLight.shadow.camera.bottom = -100;
  dLight.shadow.camera.top = 100;
  dLight.shadow.camera.left = -100;
  dLight.shadow.camera.right = 100;
  scene.add(dLight);
  scene.add(aLight);

  camera.position.set(0, 0.5, 5);
  scene.add(camera);

  window.addEventListener("mousedown", () => {
    onPress = true;
  });

  window.addEventListener("mouseup", () => {
    onPress = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (onPress) {
      // const rotateYYalue = e.movementX * 0.001;
      // const rotateXYalue = e.movementY * 0.001;
      // const up = new THREE.Vector4(0, 1, 0, 0);
      // up.applyMatrix4(camera.matrix).normalize();
      // const axis_up = new THREE.Vector3(up.x, up.y, up.z);
      // camera.rotateOnAxis(axis_up, rotateYYalue);
      // const right = new THREE.Vector4(1, 0, 0, 0);
      // right.applyMatrix4(camera.matrix).normalize();
      // const axis_right = new THREE.Vector3(right.x, right.y, right.z);
      // camera.rotateOnAxis(axis_right, rotateXYalue);
    }
  });

  // window.addEventListener("wheel", (e) => {
  //   vAlt = vAlt + e.deltaY * 0.05;
  //   // alt += e.deltaY * -0.05;
  //   // nextPos = calcLonLatToXYZ(phi * 2.0, theta, alt);
  //   // camera.position.set(nextPos.x, nextPos.y, nextPos.z);
  // });

  const acc = 10.0;
  window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
      const forward = new THREE.Vector4(0, 0, 1, 0);
      forward.applyMatrix4(camera.matrix).normalize();
      const fv = new THREE.Vector3(forward.x, forward.y, forward.z);

      const v = cameraVelocity.clone();
      cameraVelocity = v.add(fv.multiplyScalar(-0.03 * acc));
    }

    if (e.key === "s") {
      const forward = new THREE.Vector4(0, 0, 1, 0);
      forward.applyMatrix4(camera.matrix).normalize();
      const fv = new THREE.Vector3(forward.x, forward.y, forward.z);

      const v = cameraVelocity.clone();
      cameraVelocity = v.add(fv.multiplyScalar(0.03 * acc));
    }
  });
}

function addBox(x, y, z, sx, sy, sz, rot) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load("./testTex.png");
  const mat1 = new THREE.MeshPhongMaterial({map: texture});
  const boxGeometry = new THREE.BoxGeometry(sx, sy, sz); //new THREE.BoxGeometry(2, 1.5, 0.25);
  const box = new THREE.Mesh(boxGeometry, mat1);
  box.position.set(x, y, z);
  box.rotateY(rot);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  intersectObjects.push(box);
}

function addObject() {
  const loader = new THREE.TextureLoader();
  const texture = loader.load("./testTex.png");

  const mat = new THREE.MeshPhongMaterial();
  const mat1 = new THREE.MeshPhongMaterial({map: texture});

  //sphere
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 20, 20); //new THREE.BoxGeometry(2, 1.5, 0.25);
  const cyl = new THREE.Mesh(cylinderGeometry, mat1);
  cyl.position.set(4, 0, 0);
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  scene.add(cyl);
  intersectObjects.push(cyl);

  const sphereGeometry = new THREE.SphereGeometry(1, 20);
  const spe = new THREE.Mesh(sphereGeometry, mat1);
  spe.position.set(-4, 0, 0);
  spe.castShadow = true;
  spe.receiveShadow = true;
  scene.add(spe);
  intersectObjects.push(spe);

  //box
  addBox(0, 0, 0, 2, 1.5, 0.25, 0);
  addBox(1.0, 0, -0.45, 2, 1.5, 0.25, 1.57);
  addBox(0, -0.5, 3, 2, 0.25, 2, 0);

  const groundGeo = new THREE.PlaneGeometry(50, 50, 10, 10);
  ground = new THREE.Mesh(groundGeo, mat);
  ground.receiveShadow = true;

  ground.rotateX(-1.57);
  ground.position.set(0, -0.75, 0);
  scene.add(ground);
}

function addGUI() {
  gui = new GUI();
  const folder = gui.addFolder("params");
  gui.width = 300;

  folder
    .add(param, "reflectionThreshold", 0.01, 1.0, 0.01)
    .onChange((value) => {
      reflectionThreshold = value;
    });
}

const calcLonLatToXYZ = (_phi, _theta, _alt) => {
  const x = _alt * Math.sin(_theta) * Math.sin(_phi);
  const y = _alt * Math.cos(_theta);
  const z = _alt * Math.sin(_theta) * Math.cos(_phi);
  return new THREE.Vector3(x, y, z);
};

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  let cameraPosition = camera.position.clone();

  renderer.render(scene, camera);

  //rayの設定
  const v3 = new THREE.Vector3(0, 0, 0);
  camera.getWorldPosition(v3);

  const forward = new THREE.Vector4(0, 0, -1, 0);
  forward.applyMatrix4(camera.matrix).normalize();
  const fv = new THREE.Vector3(forward.x, forward.y, forward.z);

  raycaster.set(camera.position, fv);
  const intersects = raycaster.intersectObjects(intersectObjects);
  if (intersects.length > 0) {
    var selectedObject = scene.getObjectByName("refLine");
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("dirLine");
    scene.remove(selectedObject);

    // const wn = intersects[0].object.localToWorld(
    //   intersects[0].face.normal.clone()
    // );
    const wn = new THREE.Vector3(0, 0, 0);
    const normalMatrix = new THREE.Matrix3();
    normalMatrix.getNormalMatrix(intersects[0].object.matrixWorld);
    wn.copy(intersects[0].face.normal.clone())
      .applyMatrix3(normalMatrix)
      .normalize();
    let dir = fv.clone().normalize();

    //反射ベクトルを求める
    // dir.reflect(wn.clone()).normalize();
    //並行ベクトルを求める
    const a = dir.clone().multiplyScalar(-1).dot(wn.clone());
    const paraDir = dir.clone().add(wn.clone().multiplyScalar(a));
    dir = paraDir.normalize();

    //
    const normPoints = [];
    normPoints.push(intersects[0].point);
    const p1 = wn.clone().add(intersects[0].point);
    normPoints.push(p1.add(new THREE.Vector3(0, 0.05, 0)));
    const normMat = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    const normGeometry = new THREE.BufferGeometry().setFromPoints(normPoints);
    const normLine = new THREE.Line(normGeometry, normMat);
    normLine.name = "dirLine";
    scene.add(normLine);
    //

    //
    const refPoints = [];
    refPoints.push(intersects[0].point);
    refPoints.push(
      dir
        .clone()
        .add(intersects[0].point.clone())
        .add(new THREE.Vector3(0, 0.05, 0))
    );
    const refMat = new THREE.LineBasicMaterial({
      color: 0xffff00,
    });
    const refGeometry = new THREE.BufferGeometry().setFromPoints(refPoints);
    const refLine = new THREE.Line(refGeometry, refMat);
    refLine.name = "refLine";
    scene.add(refLine);
    //

    //debug
    // const boxGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    // const box = new THREE.Mesh(
    //   boxGeometry,
    //   new THREE.MeshPhongMaterial({color: 0xffff00})
    // );
    // box.position.copy(intersects[0].point);
    // scene.add(box);

    const dist = intersects[0].point.distanceTo(camera.position);
    if (dist <= 0.2) {
      cameraVelocity = dir.multiplyScalar(0.4);
      isCollision = true;
    }
  }

  cameraVelocity.multiplyScalar(0.97);

  const cv = cameraVelocity.clone();
  cameraPosition.add(cv.multiplyScalar(0.03));
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  // const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

(function () {
  init();
  addCamera();
  addObject();
  addGUI();
  update();
})();
