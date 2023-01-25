import * as THREE from "three";
import {GUI} from "three/examples/jsm/libs/dat.gui.module";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import testVert from "./shaders/test.vert";
import testFrag from "./shaders/test.frag";

import {hoge} from "./test.jsx";

import Ammo from "./lib/ammo";

let canvas, renderer, scene, camera, geometry, gui, controls;
let target, ground;
let phi, theta, alt, box, raycaster;
let onPress = false;
let nextPos;
let vPhi, vTheta, vAlt;
let pos;
let physicsWorld;
let rigidBodies = [];
let tmpTrans;
let clock;
let deltaTime;

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
  clock = new THREE.Clock();

  raycaster = new THREE.Raycaster();

  startAmmo();
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
  const groundGeo = new THREE.PlaneGeometry(100, 100, 10, 10);

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
  // scene.add(ground);
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
  deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
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
  // let deltaTime = clock.getDelta();
  pos = calcLonLatToXYZ(phi, theta, alt);

  //rayの設定
  // const cp = new THREE.Vector3();
  // camera.getWorldPosition(cp);
  // raycaster.set(cp, new THREE.Vector3(0, -1, 0));
  // const intersects = raycaster.intersectObject(ground);
  // if (intersects.length > 0) {
  //   // const wCamPos = camera.getWorldPosition();
  //   const dist = cp.distanceTo(intersects[0].point);
  //   // console.log(`theta: ${theta}  dist: ${dist}  wcampos: ${wCamPos.y}`);

  //   if (dist < 0.5) {
  //     const _theta = Math.acos((dist - 1.0) / alt);
  //     theta = _theta;
  //     // vTheta = 0;
  //     pos = calcLonLatToXYZ(phi, theta, alt);
  //   }
  // }

  camera.position.set(pos.x, pos.y, pos.z);
  const boxPos = new THREE.Vector3();
  box.getWorldPosition(boxPos);
  camera.lookAt(boxPos);

  // collisionDetector.update();
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

function startAmmo() {
  Ammo().then((Ammo) => {
    tmpTrans = new Ammo.btTransform();
    setupPhysicsWorld(Ammo);
    createBlock(Ammo);
    createBall(Ammo);
  });
  // .catch((err) => alert(err));
}

function setupPhysicsWorld(Ammo) {
  let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  let overlappingPairCache = new Ammo.btDbvtBroadphase();
  let solver = new Ammo.btSequentialImpulseConstraintSolver();
  console.log("hoge");

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
  console.log(physicsWorld);
}

function createBlock(Ammo) {
  let pos = {x: 0, y: -1.5, z: 0};
  let scale = {x: 100, y: 2, z: 100};
  // let quat = {x: 0, y: 0, z: 0, w: 1};
  const quat = new THREE.Quaternion();
  quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.0);
  let mass = 0;

  //threeJS Section
  let blockPlane = new THREE.Mesh(
    new THREE.BoxBufferGeometry(),
    new THREE.MeshPhongMaterial({color: 0xa0afa4})
  );

  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);

  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;

  scene.add(blockPlane);

  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  let colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
  );
  colShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );
  let body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(1);
  body.setRollingFriction(0.1);

  physicsWorld.addRigidBody(body);
}

function createBall(Ammo) {
  let pos = {x: 0, y: 1, z: 0};
  let radius = 2;
  let quat = {x: 0, y: 0, z: 0, w: 1};
  let mass = 1;

  //threeJS Section
  let ball = new THREE.Mesh(
    new THREE.SphereBufferGeometry(radius),
    new THREE.MeshPhongMaterial({color: 0xff0505})
  );

  ball.position.set(pos.x, pos.y, pos.z);

  ball.castShadow = true;
  ball.receiveShadow = true;

  scene.add(ball);

  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  let colShape = new Ammo.btSphereShape(radius);
  colShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );
  let body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(4);
  body.setRollingFriction(10);

  // physicsWorld.addRigidBody(body);

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);
}

function updatePhysics(deltaTime) {
  // Step world
  if (physicsWorld === undefined) return;
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rigid bodies
  for (let i = 0; i < rigidBodies.length; i++) {
    let objThree = rigidBodies[i];
    let objAmmo = objThree.userData.physicsBody;
    let ms = objAmmo.getMotionState();
    if (ms) {
      ms.getWorldTransform(tmpTrans);
      let p = tmpTrans.getOrigin();
      let q = tmpTrans.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}

(function () {
  init();
  addCamera();
  addObject();
  // addGUI();
  update();
})();
