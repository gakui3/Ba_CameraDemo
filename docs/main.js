import * as THREE from "three";
import {GUI} from "three/examples/jsm/libs/dat.gui.module";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import testVert from "./shaders/test.vert";
import testFrag from "./shaders/test.frag";

import {hoge} from "./test.jsx";

let canvas, renderer, scene, camera, geometry, gui, controls;
let target, ground;
let phi, theta, alt, box, raycaster;
let onPress = false;
let nextPos;
let vPhi, vTheta, vAlt;
let pos;

const param = {
  value01: 1.0,
  value02: true,
  value03: 1.0,
  value04: "hoge01",
};

function init() {
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({canvas});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();

  raycaster = new THREE.Raycaster();
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

  // const controls = new OrbitControls(camera, canvas);
  // controls.target.set(0, 0, 0);
  // controls.update();
  phi = 1.0;
  theta = 1.57;
  alt = 10.0;
  vPhi = 0;
  vTheta = 0;
  vAlt = 0;
  pos = calcLonLatToXYZ(phi, theta, alt);
  // nextPos = p;
  // camera.position.set(nextPos.x, nextPos.y, nextPos.z);

  target = new THREE.Object3D();
  target.add(camera);

  window.addEventListener("mousedown", () => {
    onPress = true;
  });

  window.addEventListener("mouseup", () => {
    onPress = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (onPress) {
      vPhi = vPhi + e.movementX * 0.06 * -0.03;
      vTheta = vTheta + e.movementY * 0.06 * -0.03;
    }
  });

  window.addEventListener("wheel", (e) => {
    vAlt = vAlt + e.deltaY * 0.05;
    // alt += e.deltaY * -0.05;
    // nextPos = calcLonLatToXYZ(phi * 2.0, theta, alt);
    // camera.position.set(nextPos.x, nextPos.y, nextPos.z);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
      const p = target.position.clone();
      target.position.set(p.x, p.y, p.z + 0.1);
      target.updateMatrixWorld();
    }
    if (e.key === "a") {
      const p = target.position.clone();
      target.position.set(p.x + 0.1, p.y, p.z);
      target.updateMatrixWorld();
    }
    if (e.key === "s") {
      const p = target.position.clone();
      target.position.set(p.x, p.y, p.z - 0.1);
      target.updateMatrixWorld();
    }
    if (e.key === "d") {
      const p = target.position.clone();
      target.position.set(p.x - 0.1, p.y, p.z);
      target.updateMatrixWorld();
    }
  });
}

function addObject() {
  geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
  const groundGeo = new THREE.PlaneGeometry(50, 50, 10, 10);

  // const mat = new THREE.ShaderMaterial({
  //   vertexShader: testVert,
  //   fragmentShader: testFrag,
  // });
  const mat = new THREE.MeshPhongMaterial();
  const mat1 = new THREE.MeshPhongMaterial({color: 0xff0000});

  box = new THREE.Mesh(geometry, mat1);
  box.position.set(0, -0.5, 0);
  box.castShadow = true;
  box.receiveShadow = true;
  target.add(box);

  ground = new THREE.Mesh(groundGeo, mat);
  ground.receiveShadow = true;

  ground.rotateX(-1.57);
  ground.position.set(0, -1, 0);
  scene.add(target);
  scene.add(ground);
}

function addGUI() {
  gui = new GUI();
  const folder = gui.addFolder("folder");
  gui.width = 300;

  folder.add(param, "value01").onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value02").onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value03", 0, 2.0).onChange((value) => {
    console.log(value);
  });
  folder.add(param, "value04", ["hoge01", "hoge02"]).onChange((value) => {
    console.log(value);
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

  renderer.render(scene, camera);
  // controls.update(0.03);

  // const cameraCurretnPos = camera.getWorldPosition();
  // const v3 = new THREE.Vector3(0, 0, 0);
  // box.getWorldPosition(v3);
  // camera.position.set(nextPos.x, nextPos.y, nextPos.z);

  vPhi = vPhi * 0.97;
  vTheta = vTheta * 0.97;
  vAlt = vAlt * 0.97;
  phi = phi + vPhi * 0.03;
  theta = theta + vTheta * 0.03;
  alt = alt + vAlt * 0.03;

  // console.log(theta);

  //rayの設定
  // raycaster.set(camera.getWorldPosition(), new THREE.Vector3(0, -1, 0));
  // const intersects = raycaster.intersectObject(ground);
  // if (intersects.length > 0) {
  // const wCamPos = camera.getWorldPosition();
  // const dist = wCamPos.distanceTo(intersects[0].point);
  // pos = calcLonLatToXYZ(phi, theta, alt);
  // console.log(`${theta}  ${dist} ${pos.y}`);

  // if (dist < 0.5) {
  // const _theta = Math.acos(0.5 / alt);
  // theta = _theta * -1;
  // pos.y = -0.49;
  // vTheta = 0;
  pos = calcLonLatToXYZ(phi, theta, alt);
  // }
  // }

  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(box.getWorldPosition());
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
  // addGUI();
  update();
})();
