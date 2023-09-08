import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { watch, ref } from 'vue'

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
  if (!['1#', '2#', '3#', '4#'].includes(title)) return

  let node = 2
  if (title === '1#') node = 2
  else if (title === '2#') node = 3
  else if (title === '3#') node = 5
  else if (title === '4#') node = 4

  CACHE.container.clickObjects = []
  CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[node], 800, () => {
    CACHE.container.outlinePass.edgeStrength = 3
    CACHE.container.outlinePass.pulsePeriod = 1
    CACHE.container.outlinePass.hiddenEdgeColor = new Bol3D.Color(0.44, 1, 1)
    CACHE.container.outlinePass.visibleEdgeColor = new Bol3D.Color(0.44, 1, 1)
    STATE.currentScene.value = title
    STATE.handleMouseText.value = `进入 ${STATE.currentScene.value}`
    initDevices(title)
  })
}

// 预加载设备模型
function initModels() {
  const yibumox = CACHE.container.scene.children.find(e => e.name === 'yibumox')
  const erbumox = CACHE.container.scene.children.find(e => e.name === 'erbumox')
  const sanbumox = CACHE.container.scene.children.find(e => e.name === 'sanbumox')
  const sibumox = CACHE.container.scene.children.find(e => e.name === 'sibumox')
  const wubumox = CACHE.container.scene.children.find(e => e.name === 'wubumox')

  function handleModel(model) {
    model.children.forEach(e => {
      STATE.deviceModel[e.name] = e.clone()
      const map = DATA.deviceIdTypeMap.find(e2 => e2.modelName === e.name)
      if (map) {
        STATE.deviceModel[e.name].scale.set(map.scale, map.scale, map.scale)
        STATE.deviceModel[e.name].userData.type = map.type
        STATE.deviceModel[e.name].userData.modelName = STATE.deviceModel[e.name].userData.name
        delete STATE.deviceModel[e.name].userData.name
      }
    })
  }

  if (yibumox) {
    handleModel(yibumox)
  }
  if (erbumox) {
    handleModel(erbumox)
  }
  if (sanbumox) {
    handleModel(sanbumox)
  }
  if (sibumox) {
    handleModel(sibumox)
  }
  if (wubumox) {
    handleModel(wubumox)
  }
}


// 不同楼的设备加载
function initDevices(title) {
  if (title === '4#') {
    STATE.deviceList.children = []

    const wubuMap = DATA.deviceMap.filter(e => e.area === '第五制造部')
    const sanbuMap = DATA.deviceMap.filter(e => e.area === '第三制造部')

    wubuMap.forEach((e, index) => {
      const modelMap = DATA.deviceIdTypeMap.find(e2 => e2.id.includes(e.id))
      if (!modelMap) return
      const originModel = STATE.deviceModel[modelMap.modelName]
      if (!originModel) return

      const model = originModel.clone()


      model.position.set(e.position[0], e.position[1], e.position[2])
      model.rotation.x = e.rotate[0]
      model.rotation.y = e.rotate[1]
      model.rotation.z = e.rotate[2]
      model.userData.id = e.id
      model.userData.area = e.area
      model.userData.type = 'device'
      STATE.deviceList.add(model)

      model.traverse(e2 => {
        if (e2.isMesh) {
          e2.userData.id = e.id
          e2.userData.type = 'device'
          CACHE.container.clickObjects.push(e2)
        }
      })

      // if (index === 0) {
      //   setModelPosition(model)
      // }

    })

    if (!STATE.deviceList.parent) {
      CACHE.container.scene.add(STATE.deviceList)
    }
  }
}

// 推出到主页面
function backToMainScene() {
  if (STATE.currentScene.value !== 'main') {
    CACHE.container.loadingBar.style.visibility = 'visible'
    STATE.deviceList.children.forEach(e => {
      e.parent.remove(e)
    })
    STATE.deviceList.children = []
    CACHE.container.outlineObjects = []

    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[0], 0, () => {
      CACHE.container.loadingBar.style.visibility = 'hidden'
      CACHE.container.clickObjects = STATE.mainClickObjects

      STATE.handleMouseText.value = `从 ${STATE.currentScene.value} 退出到外场景`
      STATE.currentScene.value = 'main'
    })
  }
}





// 甲方的双击事件
STATE.handleMouseText = ref('')
function handleMouse() {
  if (CACHE.handleMousePromise) {
    CACHE.handleMousePromise.reject()
  }

  let textWatch = null
  let myReject = null

  CACHE.handleMousePromise = new Promise((resolve, reject) => {
    myReject = reject
    textWatch = watch(STATE.handleMouseText,
      (newVal) => {
        resolve(newVal)
        textWatch()
        CACHE.handleMousePromise = null
      })
  })

  CACHE.handleMousePromise.reject = () => {
    myReject()
    CACHE.handleMousePromise = null
    textWatch && textWatch()
  }

  return CACHE.handleMousePromise
}
window.handleMouse = handleMouse

// 甲方那边要添加的代码
{
  document.addEventListener('dblclick', (() => {
    handleMouse().then(e => { console.log(e) }).catch(() => { })
  }))

  const dbrClickEvent = new CustomEvent('dbrClickEvent', { bubbles: true })
  document.addEventListener('mousedown', e => {
    if (e.button === 2 && e.detail === 2) {
      e.target.dispatchEvent(dbrClickEvent)
    }
  })

  document.addEventListener('dbrClickEvent', () => {
    handleMouse().then(e => { console.log(e) }).catch(() => { })
  })
}

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
  initModels,
  setPickable
}
