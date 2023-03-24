import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'


console.log(portalFragmentShader, portalVertexShader)
/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 400
})

const debugObject = {}


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)


//texture
const bakedTexture = textureLoader.load('bakedCarl.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

//materials
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture, side: THREE.DoubleSide});
//pole light materal

const poleLightMaterial =  new THREE.MeshBasicMaterial({color: 0xffffe5});

debugObject.portalColorStart = '#e2f9a4'
debugObject.portalColorEnd = '#0ca6e9'

gui.addColor(
    debugObject, 'portalColorStart'
).onChange(()=>{
    portalMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
})
gui.addColor(
    debugObject, 'portalColorEnd'
).onChange(()=>{
    portalMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
})

const portalMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms:{
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color(debugObject.portalColorStart)}, 
        uColorEnd: {value: new THREE.Color(debugObject.portalColorEnd)}
    }
})



//gltf loader
gltfLoader.load('bakedPortal.glb', (gltf)=>{
    const bakedMesh = gltf.scene.children.find((child)=>{
        return child.name === 'baked'
    })
    const poleLightAMesh = gltf.scene.children.find((child)=>{
        return child.name === 'poleLightA'
    })
    const poleLightBMesh = gltf.scene.children.find((child)=>{
        return child.name === 'poleLightB'
    })
    const portalLightMesh = gltf.scene.children.find((child)=>{
        return child.name === 'portalLight'
    })
    bakedMesh.material = bakedMaterial
    poleLightAMesh.material = poleLightMaterial
    poleLightBMesh.material = poleLightMaterial
    portalLightMesh.material = portalMaterial
    scene.add(gltf.scene)
})

//fireflies
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 100
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for(let i=0; i< firefliesCount; i++){
    // x
     positionArray[i * 3 + 0] = (Math.random() - 0.5)* 4;
    // y
    positionArray[i * 3 + 1] = Math.random() * 2;
    // z
    positionArray[i * 3 + 2] = (Math.random() - .5)* 4;

    scaleArray[i] = Math.random()
}
//custom attribute converted to buffer attribute to accept array
firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

//material

const fireflyMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
        uTime: {value: 0},
        uPixelRatio: {
            value: Math.min(window.devicePixelRatio, 2)
        },
        uSize: {value: 30}
    }
})

gui.add(fireflyMaterial.uniforms.uSize, 'value').min(0).max(400).step(1).name('fireflies size')

//points
const fireflies = new THREE.Points(firefliesGeometry, fireflyMaterial)
scene.add(fireflies)




/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update fireflies
    fireflyMaterial.uniforms.uPixelRatio.setPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})



/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#303030'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor')
.onChange(()=>{
    renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //update materials
    fireflyMaterial.uniforms.uTime.value = elapsedTime
    portalMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()