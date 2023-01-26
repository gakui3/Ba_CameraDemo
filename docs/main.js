import * as THREE from "three";
import {GUI} from "three/examples/jsm/libs/dat.gui.module";

let canvas, renderer, scene, camera, geometry, gui, controls;
let target, ground;
let phi, theta, alt, box, raycaster;
let onPress = false;
let nextPos;
let vPhi, vTheta, vAlt;
let pos;
let cameraVelocity;
let reflectionThreshold;

const param = {
  reflectionThreshold: 1.0,
};

function init() {
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({canvas});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  reflectionThreshold = 0.1;

  raycaster = new THREE.Raycaster();
  cameraVelocity = new THREE.Vector3(0, 0, 0);
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  // camera.position.set(0, 0, 10);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;

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
      // vPhi = vPhi + e.movementX * 0.06 * -0.03;
      // vTheta = vTheta + e.movementY * 0.06 * -0.03;
      const rotateYYalue = e.movementX * 0.001;
      const up = new THREE.Vector4(0, 1, 0, 0);
      up.applyMatrix4(camera.matrix).normalize();
      const axis = new THREE.Vector3(up.x, up.y, up.z);
      camera.rotateOnAxis(axis, rotateYYalue);
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

function addObject() {
  geometry = new THREE.BoxGeometry(2, 1.5, 0.25);
  const groundGeo = new THREE.PlaneGeometry(50, 50, 10, 10);

  const loader = new THREE.TextureLoader();
  const texture = loader.load("./testTex.png");

  const mat = new THREE.MeshPhongMaterial();
  const mat1 = new THREE.MeshPhongMaterial({map: texture});

  box = new THREE.Mesh(geometry, mat1);
  box.position.set(0, 0, 0);
  box.rotateY(0.785);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);

  ground = new THREE.Mesh(groundGeo, mat);
  ground.receiveShadow = true;

  ground.rotateX(-1.57);
  ground.position.set(0, -0.5, 0);
  scene.add(box);
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
  cameraVelocity.multiplyScalar(0.97);

  const cv = cameraVelocity.clone();
  cameraPosition.add(cv.multiplyScalar(0.03));
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);

  renderer.render(scene, camera);
  // controls.update();

  // vPhi = vPhi * 0.97;
  // vTheta = vTheta * 0.97;
  // vAlt = vAlt * 0.97;
  // phi = phi + vPhi * 0.03;
  // theta = theta + vTheta * 0.03;
  // alt = alt + vAlt * 0.03;

  //rayの設定
  const v3 = new THREE.Vector3(0, 0, 0);
  camera.getWorldPosition(v3);

  const forward = new THREE.Vector4(0, 0, -1, 0);
  forward.applyMatrix4(camera.matrix).normalize();
  const fv = new THREE.Vector3(forward.x, forward.y, forward.z);
  // console.log(camera.position);

  raycaster.set(camera.position, fv);
  const intersects = raycaster.intersectObject(box);
  if (intersects.length > 0) {
    var selectedObject = scene.getObjectByName("refLine");
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("dirLine");
    scene.remove(selectedObject);

    const wn = box.localToWorld(intersects[0].face.normal.clone());
    // console.log(wn);
    const dir = fv.clone().normalize();
    dir.reflect(wn.clone());

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

    const dist = intersects[0].point.distanceTo(camera.position);
    if (dist < 0.2) {
      cameraVelocity = dir.multiplyScalar(reflectionThreshold);
    }
  }

  // if (dist < 0.5) {
  // const _theta = Math.acos(0.5 / alt);
  // theta = _theta * -1;
  // pos.y = -0.49;
  // vTheta = 0;

  // pos = calcLonLatToXYZ(phi, theta, alt);
  // }
  // }

  // camera.position.set(pos.x, pos.y, pos.z);
  // camera.lookAt(box.getWorldPosition());
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
