import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'

// 相机动画（传指定state）
const targetPos = new Bol3D.Vector3()
const pos = new Bol3D.Vector3()
function cameraAnimation({ cameraState, callback, delayTime = 0, duration = 800 }) {
  targetPos.set(cameraState.target.x, cameraState.target.y, cameraState.target.z)
  pos.set(cameraState.position.x, cameraState.position.y, cameraState.position.z)

  if (targetPos.distanceTo(CACHE.container.orbitControls.target) < 0.1 && pos.distanceTo(CACHE.container.orbitControls.object.position) < 0.1) {
    callback && callback()
    return
  }

  if (STATE.isAnimating) return
  STATE.isAnimating = true

  CACHE.container.orbitControls.enabled = false

  let count = 0

  const t1 = new Bol3D.TWEEN.Tween(CACHE.container.orbitControls.object.position)
    .to(
      {
        x: cameraState.position.x,
        y: cameraState.position.y,
        z: cameraState.position.z
      },
      duration
    )
    .onUpdate(() => { })
    .onComplete(() => {
      count++

      if (count == 2) {
        CACHE.container.orbitControls.enabled = true
        STATE.isAnimating = false
        callback && callback()
      }
    })

  t1.delay(delayTime).start()

  const t2 = new Bol3D.TWEEN.Tween(CACHE.container.orbitControls.target)
    .to(
      {
        x: cameraState.target.x,
        y: cameraState.target.y,
        z: cameraState.target.z
      },
      duration
    )
    .onUpdate(() => { })
    .onComplete(() => {
      count++
      if (count == 2) {
        CACHE.container.orbitControls.enabled = true
        STATE.isAnimating = false
        callback && callback()
      }
    })

  t1.delay(delayTime).start()
  t2.delay(delayTime).start()

  return t1
}

function loadGUI() {
  // gui
  const gui = new dat.GUI()
  // default opts
  const deafultsScene = { distance: 8000, }
  // scenes
  const scenesFolder = gui.addFolder('场景')
  // toneMapping
  scenesFolder.add(CACHE.container.renderer, 'toneMappingExposure', 0, 10).step(0.001).name('exposure')
  scenesFolder.add(CACHE.container.ambientLight, 'intensity').step(0.1).min(0).max(10).name('环境光强度')
  scenesFolder.add(CACHE.container.gammaPass, 'enabled').name('gamma校正')
  scenesFolder
    .addColor(CACHE.container.attrs.lights.directionLights[0], 'color')
    .onChange((val) => {
      CACHE.container.directionLights[0].color.set(val)
    })
    .name('平行光颜色')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'x')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'y')
  scenesFolder.add(CACHE.container.directionLights[0].position, 'z')
  scenesFolder.add(deafultsScene, 'distance').onChange((val) => {
    CACHE.container.directionLights[0].shadow.camera.left = -val
    CACHE.container.directionLights[0].shadow.camera.right = val
    CACHE.container.directionLights[0].shadow.camera.top = val
    CACHE.container.directionLights[0].shadow.camera.bottom = -val
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder.add(CACHE.container.directionLights[0].shadow.camera, 'far').onChange(() => {
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder.add(CACHE.container.directionLights[0].shadow.camera, 'near').onChange(() => {
    CACHE.container.directionLights[0].shadow.camera.updateProjectionMatrix()
    CACHE.container.directionLights[0].shadow.needsUpdate = true
  })
  scenesFolder
    .add(CACHE.container.directionLights[0].shadow, 'bias')
    .step(0.0001)
    .onChange(() => {
      CACHE.container.directionLights[0].shadow.needsUpdate = true
    })
  scenesFolder.add(CACHE.container.directionLights[0], 'intensity').step(0.1).min(0).max(10)

  // filter pass
  const filterFolder = gui.addFolder('滤镜')
  const defaultsFilter = {
    hue: 0,
    saturation: 1,
    vibrance: 0,
    brightness: 0,
    contrast: 1
  }
  filterFolder.add(CACHE.container.filterPass, 'enabled')
  filterFolder
    .add(defaultsFilter, 'hue')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.hue.value = val
    })
  filterFolder
    .add(defaultsFilter, 'saturation')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.saturation.value = val
    })
  filterFolder
    .add(defaultsFilter, 'vibrance')
    .min(0)
    .max(10)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.vibrance.value = val
    })

  filterFolder
    .add(defaultsFilter, 'brightness')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.brightness.value = val
    })
  filterFolder
    .add(defaultsFilter, 'contrast')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val) => {
      CACHE.container.filterPass.filterMaterial.uniforms.contrast.value = val
    })
}



// 将模型添加到clickObjects（visible为false的不添加）
function setPickable(model, evt) {
  const container = evt !== undefined ? evt : CACHE.container
  if (!model.visible) return
  if (model.isMesh) container.clickObjects.push(model)
  if (model.children && model.children.length > 0) {
    model.children.forEach((child) => {
      setPickable(child, container)
    })
  }
}


// 进入不同楼
function enterBuilding(title) {
  if (title === '1#') {
    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[2], 800, () => {
      STATE.currentScene.value = title
      initDevices(title)
    })

  } else if (title === '2#') {
    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[3], 800, () => {
      STATE.currentScene.value = title
      initDevices(title)
    })

  } else if (title === '3#') {
    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[5], 800, () => {
      STATE.currentScene.value = title
      initDevices(title)
    })

  } else if (title === '4#') {
    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[4], 800, () => {
      STATE.currentScene.value = title
      initDevices(title)
    })
  }
}


// 不同楼的设备加载
function initDevices(title) {
  if (title === '4#') {
    STATE.deviceList.children = []

    const wubumox = CACHE.container.scene.children.find(e => e.name === 'wubumox')
    const sanbumox = CACHE.container.scene.children.find(e => e.name === 'sanbumox')

    const wubuMap = DATA.deviceMap.find(e => e.name === 'wubu')
    const sanbuMap = DATA.deviceMap.find(e => e.name === 'sanbu')

    wubuMap.device.forEach((e, index) => {
      const model = wubumox.children.find(e2 => e2.name === e.type)
      if(!model) return
      
      model.position.set(e.position[0], e.position[1], e.position[2])
      model.scale.set(e.scale, e.scale, e.scale)
      model.rotation.x = e.rotate[0]
      model.rotation.y = e.rotate[1]
      model.rotation.z = e.rotate[2]
      STATE.deviceList.add(model)

      if (index === 0) {
        setModelPosition(model)
      }
      
    })

    if (!STATE.deviceList.parent) {
      CACHE.container.scene.add(STATE.deviceList)
    }
  }
}

// 推出到主页面
function backToMainScene() {
  if (STATE.currentScene.value !== 'main') {
    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[0], 0, () => {
      STATE.currentScene.value = 'main'
    })
  }
}
window.backToMainScene = backToMainScene


/**
 * 测试用盒子
 */
function testBox() {
  const boxG = new Bol3D.BoxGeometry(5, 5, 5)
  const boxM = new Bol3D.MeshBasicMaterial({ color: 0xffffff })
  const box = new Bol3D.Mesh(boxG, boxM)
  function waitContainerLoad() {
    if (!CACHE.container) {
      setTimeout(() => {
        waitContainerLoad()
      }, 1000)
    } else {
      CACHE.container.scene.add(box)
      setModelPosition(box)
    }
  }
  waitContainerLoad()
}

/**
 * 设置模型位置(position)，旋转(rotation)，缩放(scale),有该属性的物体亦可
 * @param {object} mesh 待操作模型
 */
function setModelPosition(mesh) {
  const controls = CACHE.container.transformControl
  const gui = new dat.GUI()
  const options = {
    transformModel: "translate"
  }
  gui.add(options, 'transformModel', ["translate", 'rotate', 'scale']).onChange(val => controls.setMode(val))
  const positionX = gui.add(mesh.position, 'x').onChange(val => mesh.position.x = val).name('positionX').step(5)
  const positionY = gui.add(mesh.position, 'y').onChange(val => mesh.position.y = val).name('positionY').step(5)
  const positionZ = gui.add(mesh.position, 'z').onChange(val => mesh.position.z = val).name('positionZ').step(5)
  const rotateX = gui.add(mesh.rotation, 'x').onChange(val => mesh.rotation.x = val).name('rotateX').step(0.1)
  const rotateY = gui.add(mesh.rotation, 'y').onChange(val => mesh.rotation.y = val).name('rotateY').step(0.1)
  const rotateZ = gui.add(mesh.rotation, 'z').onChange(val => mesh.rotation.z = val).name('rotateZ').step(0.1)
  const scaleZX = gui.add(mesh.scale, 'x').onChange(val => mesh.scale.x = val).name('scaleX').step(1)
  const scaleZY = gui.add(mesh.scale, 'y').onChange(val => mesh.scale.y = val).name('scaleY').step(1)
  const scaleZZ = gui.add(mesh.scale, 'z').onChange(val => mesh.scale.z = val).name('scaleZ').step(1)
  controls.attach(mesh)
  controls.addEventListener("change", (e) => {
    positionX.setValue(mesh.position.x)
    positionY.setValue(mesh.position.y)
    positionZ.setValue(mesh.position.z)
    rotateX.setValue(mesh.rotation.x)
    rotateY.setValue(mesh.rotation.y)
    rotateZ.setValue(mesh.rotation.z)
    scaleZX.setValue(mesh.scale.x)
    scaleZY.setValue(mesh.scale.y)
    scaleZZ.setValue(mesh.scale.z)
  })
}


export const API = {
  cameraAnimation,
  loadGUI,
  enterBuilding,
  backToMainScene,
  testBox,
  setPickable
}
