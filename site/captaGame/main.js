const timestamp = Date.now();
const url = `/captcha/start?id=${timestamp}`;

// Effectuer la requête GET
fetch(url, {
    method: 'GET',
    headers: {
        'Accept': 'application/json' // Modifier si vous attendez un autre type de réponse
    }
})

import * as CANNON from './js/cannon-es.js'
import * as THREE from './js/three.module.js'
import Stats from './js/stats.module.js'
import { PointerLockControlsCannon } from './js/PointerLockControlsCannon.js'

/**
 * Example of a really barebones version of a fps game.
 */

// three.js variables
let camera, scene, renderer, stats
let material

// cannon.js variables
let world
let controls
const timeStep = 1 / 60
let lastCallTime = performance.now()
let sphereShape
let sphereBody
let physicsMaterial
let raycaster
// const balls = []
// const ballMeshes = []
// const boxes = []
// const boxMeshes = []
const walls = []
const cremaWalls = []
let beforWall = null

const instructions = document.getElementById('instructions')
const reticule = document.getElementById('reticule')

initThree()
initCannon()
initPointerLock()
animate()

function initThree() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.4, 1000)

  // Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 0, 500)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(scene.fog.color)

  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  raycaster = new THREE.Raycaster();

  document.body.appendChild(renderer.domElement)

  // Stats.js
  stats = new Stats()
  document.body.appendChild(stats.dom)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)



  const spotlight = new THREE.SpotLight(0xffffff, 0.5, 0, Math.PI / 4, 1)
  spotlight.position.set(0, 70, 50)
  spotlight.castShadow = true

  spotlight.shadow.camera.near = 10
  spotlight.shadow.camera.far = 100
  spotlight.shadow.camera.fov = 30

  // spotlight.shadow.bias = -0.0001
  spotlight.shadow.mapSize.width = 2048
  spotlight.shadow.mapSize.height = 2048

  scene.add(spotlight)



  // Deuxième 
  // Helpers
  //const helper1 = new THREE.SpotLightHelper(spotlight);
  //scene.add(helper1);


  // Generic material
  material = new THREE.MeshLambertMaterial({ color: 0x999999 })

  // Floor
  const floorGeometry = new THREE.PlaneBufferGeometry(150, 150, 200, 200); // Taille réduite et définition augmentée
  floorGeometry.rotateX(-Math.PI / 2);

  const floor = new THREE.Mesh(floorGeometry, material);
  floor.receiveShadow = true;

  scene.add(floor);


  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function initCannon() {
  world = new CANNON.World()

  // Tweak contact properties.
  // Contact stiffness - use to make softer/harder contacts
  world.defaultContactMaterial.contactEquationStiffness = 1e9

  // Stabilization time in number of timesteps
  world.defaultContactMaterial.contactEquationRelaxation = 4

  const solver = new CANNON.GSSolver()
  solver.iterations = 7
  solver.tolerance = 0.1
  world.solver = new CANNON.SplitSolver(solver)
  // use this to test non-split solver
  // world.solver = solver

  world.gravity.set(0, -20, 0)

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material('physics')
  const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
    friction: 0.0,
    restitution: 0.3,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(physics_physics)

  // init phisics
  sphereShape = new CANNON.Sphere(1)
  sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial })
  sphereBody.addShape(sphereShape)
  sphereBody.position.set(0, 5, 0)
  sphereBody.linearDamping = 0.9
  world.addBody(sphereBody)

  // Create the ground plane
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
  groundBody.addShape(groundShape)
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(groundBody)

  function getShootDirection() {
    const vector = new THREE.Vector3(0, 0, 1)
    vector.unproject(camera)
    const ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize())
    return ray.direction
  }

  
  
  // Créer les murs
  createWall(20, 0, 20, 300, 50, 1, material)
  createWall(-20, 0, -20, 300, 50, 1, material)
  createWall(20, 0, -20, 1, 50, 100, material)
  createWall(-20, 0, -20, 1, 50, 100, material)

  //crenau
  const mat2 = new THREE.MeshLambertMaterial({ color: 0x00ff00 })
  
  cremaWalls.push(createWall(-20, -0.5, -5, 300, 2, 1, mat2)[1])
  cremaWalls.push(createWall(-20, 6, -5, 300, 9, 1, mat2)[1])

  //portailable
  const mat3 = new THREE.MeshLambertMaterial({ color: 0xffffff })
  for (let index = -18; index < 20; index+=6) {
    walls.push(createWall(index, 0, -15, 2, 6, 1, mat3)[0])
  }

  //entry portale
  const mat4 = new THREE.MeshLambertMaterial({ color: 0x00aaff })
  createWallEntry(2, 0, -3, 2, 6, 1, mat4)

  window.addEventListener('click', (event) => {
    if (!controls.enabled) {
      return;
    }
  
    const shootDirection = getShootDirection();
    const playerPos = controls.getPlayerPos();
    
    // Configure le raycaster
    raycaster.set(playerPos, new THREE.Vector3(shootDirection.x, shootDirection.y, shootDirection.z).normalize());
  
    // Tester les intersections
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    let firstMesh = null;

    if (intersects.length > 0) {
      // Parcours des intersections pour trouver le premier mesh
      firstMesh = intersects.find(intersection => intersection.object instanceof THREE.Mesh)?.object;
      if (firstMesh && !walls.includes(firstMesh)) {
        firstMesh = null
      }
    }


    if(firstMesh != null) {
      console.log(firstMesh);
    } else {
      return
    }
    


    if(beforWall != null) {
      if(beforWall.uuid == firstMesh.uuid) {
        return
      }
        

      beforWall.material = mat3;

    }
      
    firstMesh.material = new THREE.MeshLambertMaterial({ color: 0xff6600 })

    beforWall = firstMesh;
    
    
  })
}

function createWall(x, y, z, width, height, depth, material) {
  // Créer la géométrie et le matériau du mur
  const wallGeometry = new THREE.BoxBufferGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeometry, material);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;

  scene.add(wall);

  // Créer le corps physique du mur
  const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
  const wallBody = new CANNON.Body({ mass: 0, material: physicsMaterial }); // Mass 0 pour être un objet statique
  wallBody.addShape(wallShape);
  wallBody.position.set(x, y, z);
  world.addBody(wallBody);

  return [wall, wallBody] 
}

function createWallEntry(x, y, z, width, height, depth, material) {
  // Créer la géométrie et le matériau du mur
  const wallGeometry = new THREE.BoxBufferGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeometry, material);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;

  scene.add(wall);

  // Créer le corps physique du mur
  const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
  const wallBody = new CANNON.Body({ mass: 0, material: physicsMaterial }); // Mass 0 pour être un objet statique
  wallBody.addShape(wallShape);
  wallBody.position.set(x, y, z);
  world.addBody(wallBody);


  wallBody.addEventListener('collide', (event) => {

    teleport()


});

  return wall
}

function teleport() {
  if(beforWall != null) {
    
    console.log(cremaWalls)
    controls.setPlayerPos(beforWall.position.x, beforWall.position.z)
    console.log(controls.getPlayerPos())

    const url = `/captcha/end?id=${timestamp}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json' // Modifier si vous attendez un autre type de réponse
        }
    }).then(response => {
      if (!response.ok) {
          document.querySelector('body').innerHTML  = '<h1 style="color: red; text-align: center;">CAPTCHA FAILED</h1>';
      } else {
        setTimeout(() => {
          document.querySelector('body').innerHTML  = '<h1 style="color: green; text-align: center;">CAPTCHA CLEARED</h1>';
      }, 2000);
      }})
  }
} 

function initPointerLock() {
  controls = new PointerLockControlsCannon(camera, sphereBody)
  scene.add(controls.getObject())

  instructions.addEventListener('click', () => {
    controls.lock()
    
  })

  controls.addEventListener('lock', () => {
    
    controls.enabled = true
    instructions.style.display = 'none'
    reticule.style.display = null
  })

  controls.addEventListener('unlock', () => {
    controls.enabled = false
    instructions.style.display = null
    reticule.style.display = 'none'
  })
}

function animate() {
  requestAnimationFrame(animate)

  const time = performance.now() / 1000
  const dt = time - lastCallTime
  lastCallTime = time

  if (controls.enabled) {
    world.step(timeStep, dt)

    // Update ball positions
    // for (let i = 0; i < balls.length; i++) {
    //   ballMeshes[i].position.copy(balls[i].position)
    //   ballMeshes[i].quaternion.copy(balls[i].quaternion)
    // }

    // // Update box positions
    // for (let i = 0; i < boxes.length; i++) {
    //   boxMeshes[i].position.copy(boxes[i].position)
    //   boxMeshes[i].quaternion.copy(boxes[i].quaternion)
    // }
  }

  controls.update(dt)
  renderer.render(scene, camera)
  stats.update()
}