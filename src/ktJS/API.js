import { STATE } from './STATE.js'
import { CACHE } from './CACHE.js'
import { DATA } from './DATA.js'
import { watch, ref } from 'vue'
import { VUEDATA } from '@/VUEDATA.js'
import Ws from '@/axios/Ws.js'
import { getCollectData } from '@/axios/api.ts'

// 相机动画（传指定state）
const targetPos = new Bol3D.Vector3()
const pos = new Bol3D.Vector3()
function cameraAnimation({ cameraState, callback = () => { }, delayTime = 0, duration = 800 }) {
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
    .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
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
    .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
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

// 算聚焦距离的
function computedCameraFocusPosition(targetP, gapDistance = 400, y = 300) {
  const differencePosition = {
    x: CACHE.container.orbitControls.target.x - CACHE.container.orbitCamera.position.x,
    y: CACHE.container.orbitControls.target.y - CACHE.container.orbitCamera.position.y,
    z: CACHE.container.orbitControls.target.z - CACHE.container.orbitCamera.position.z
  }

  const tempPosition = {
    x: targetP.x - differencePosition.x,
    y: targetP.y - differencePosition.y,
    z: targetP.z - differencePosition.z
  }

  const currentP = tempPosition

  // 计算点1和点2之间的距离
  let distance = Math.sqrt((targetP.x - currentP.x) ** 2 + (targetP.z - currentP.z) ** 2);

  // 计算从点1到点2的向量，并将其标准化为单位向量
  let vector = { x: (targetP.x - currentP.x) / distance, z: (targetP.z - currentP.z) / distance };

  // 将向量乘以100，以便点1向点2移动
  let scaled_vector = { x: vector.x * gapDistance, z: vector.z * gapDistance };

  // 将点1的x和z坐标设置为新位置的值，使其靠近点2
  const computedPosition = new Bol3D.Vector3()
  computedPosition.x = targetP.x - scaled_vector.x;
  computedPosition.z = targetP.z - scaled_vector.z;
  computedPosition.y = y;

  // 最终坐标[x3,y3,z3]
  return computedPosition
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



function getData() {
  const url = `${window.wsUrl}${VUEDATA.token}`
  const ws = new Ws({ url, onMessage })
  STATE.ws = ws

  function onMessage(res) {

    if (res.deviceStatusInfos) {
      res.deviceStatusInfos.forEach(e => {
        const item = STATE.deviceList.children.find(e2 => e2.userData.id === e.deviceCode)

        if (!item) return

        item.userData.group = e.groupName
        item.userData.circle.changeState(e.currentStatus)
      })
    }
  }
}


// 进入不同楼
function enterBuilding(title) {
  if (!['2#', '17#', '5#', '3#', '6#'].includes(title)) return

  let node = 2
  if (title === '2#') node = 2
  else if (title === '17#') node = 3
  else if (title === '5#') node = 5
  else if (title === '3#') node = 4
  else if (title === '6#') node = 6

  destroyCurrentPopup()

  CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[node], 800, () => {

    // 开围墙
    if (title === '5#') {
      STATE.wallList.forEach(e => {
        if (e.name === '1dulidiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })

    } else if (title === '2#') {
      STATE.wallList.forEach(e => {
        if (e.name === '3dulidiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })

    } else if (title === '3#') {
      STATE.wallList.forEach(e => {
        if (e.name === 'sanchangdiban' || e.name === 'wuchangdiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })

    } else if (title === '17#') {
      STATE.wallList.forEach(e => {
        if (e.name === 'yichangdiban' || e.name === 'erchangdiban' || e.name === 'sichangdiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })
    } else if (title === '6#') {
      STATE.wallList.forEach(e => {
        if (e.name === '6changfangztzz') {
          e.visible = true
        } else {
          e.visible = false
        }
      })
    }

    STATE.currentScene.value = title

    window.parent.postMessage({
      event: 'deptClick',
      targetData: {
        Id: `点击事件 制造部 ${STATE.currentScene.value}`
      }
    }, '*')
    console.log(
      `deptClick-点击事件 制造部 ${STATE.currentScene.value}`
    )

    // 设备恢复不透明
    STATE.deviceList.children.forEach(e => {
      e.traverse(e2 => {
        if (e2.isMesh) {
          e2.material = e2.userData.material[0]
        }
      })
    })

    // 设备显隐
    if (title === '2#') {
      const waijing = CACHE.container.scene.children.find(e => e.name === 'waijing')
      if (waijing) {
        waijing.traverse(e => {
          if (e.name === '3DCF-lc-01') {
            e.renderOrder = 1
          }
        })
      }

      STATE.deviceList.children.forEach(e => {
        e.visible = isDeviceAmongTheBuilding(e, title)
      })

    } else if (title === '17#' || title === '3#' || title === '5#' || title === '6#') {
      STATE.deviceList.children.forEach(e => {
        e.visible = isDeviceAmongTheBuilding(e, title)
      })
    }

  })
}

// 预加载设备模型
function initModels() {
  const modelList = ['yibumox', 'erbumox', 'sanbumox', 'sibumox', 'wubumox', '3dulsb', '13SHEB-v1']

  modelList.forEach(name => {
    const model = CACHE.container.scene.children.find(e => e.name === name)
    if (model) {
      model.visible = false
      model.children.forEach(e => {
        const cloneModel = e.clone()
        STATE.deviceModel.add(cloneModel)
        const map = DATA.deviceTypeMap.find(e2 => e2.modelName === e.name)
        if (map) {
          e.scale.set(map.scale, map.scale, map.scale)
          cloneModel.scale.set(map.scale, map.scale, map.scale)
          cloneModel.userData.deviceType = map.type
          cloneModel.userData.modelName = cloneModel.userData.name
          delete cloneModel.userData.name
        }

        cloneModel.traverse(e2 => {
          if (e2.isMesh) {
            // e2.material.color.set('#444444')
            // e2.material.emissive.set('#444444')
            // e2.material.emissiveIntensity = 0
            // e2.material.needsUpdate = true
            CACHE.container.clickObjects.push(e2)
            e2.userData.type = 'originModel'
            e2.userData.deviceType = map?.type || 0
            e2.userData.modelName = cloneModel.userData.modelName
          }
        })
      })
    }
  })

  initDeviceGround()
}

// 加载把设备摆上去 在编辑器里面提供选择的区域
function initDeviceGround() {
  const width = 2000
  const height = 1400
  const spacingX = width / Math.ceil(Math.sqrt(STATE.deviceModel.children.length))
  const spacingY = height / Math.ceil(Math.sqrt(STATE.deviceModel.children.length))
  let currentX = spacingX / 2 - width / 2
  let currentY = spacingY / 2 - height / 2
  STATE.deviceModel.children.forEach(e => {
    e.position.x = currentX
    e.position.z = currentY

    currentX += spacingX
    if (currentX > (width / 2)) {
      currentX = spacingX / 2 - width / 2
      currentY += spacingY
    }
  })
  STATE.deviceModel.position.y = 500

  const planeM = new Bol3D.MeshBasicMaterial({ color: "#48576e" })
  const planeG = new Bol3D.PlaneGeometry(10000, 10000)
  const plane = new Bol3D.Mesh(planeG, planeM)
  plane.name = 'deviceGround'
  plane.material.side = 2
  plane.rotation.x = -Math.PI / 2
  STATE.deviceModel.add(plane)

  STATE.deviceModel.visible = false
  CACHE.container.scene.add(STATE.deviceModel)
}

// 设备加载
function initDevices() {
  STATE.deviceList.children = []
  DATA.deviceList.forEach((e, index) => {
    const modelMap = DATA.deviceTypeMap.find(e2 => e2.id.includes(e.id))
    if (!modelMap) return
    const originModel = STATE.deviceModel.children.find(e2 => e2.userData.modelName === modelMap.modelName)
    if (!originModel) return
    const model = originModel.clone()

    model.traverse(e2 => {
      if (e2.isMesh) {
        const transparentMaterial = e2.material.clone()
        transparentMaterial.transparent = true
        transparentMaterial.opacity = 0.1
        e2.userData.material = [e2.material, transparentMaterial]
      }
    })

    model.position.set(e.position[0], e.position[1], e.position[2])
    model.rotation.x = 0
    model.rotation.y = e.rotate * 3.14 / 180
    model.rotation.z = 0
    model.userData.id = e.id
    model.userData.area = e.area
    model.userData.type = 'device'
    model.userData.group = e.group
    model.userData.deviceType = originModel.userData.deviceType || 0
    model.visible = false
    STATE.deviceList.add(model)


    model.traverse(e2 => {
      if (e2.isMesh) {
        e2.userData.id = e.id
        e2.userData.type = 'device'
        CACHE.container.clickObjects.push(e2)
      }
    })

  })

  if (!STATE.deviceList.parent) {
    CACHE.container.scene.add(STATE.deviceList)
  }


  initCircle()
}

// 加载状态圆点
function initCircle() {
  STATE.deviceList.children.forEach(e => {
    const circleIcon = new Icon(e.userData.id)
    e.userData.circle = circleIcon
  })
}

// 退出到主页面
function backToMainScene() {
  if (STATE.currentScene.value !== 'main') {
    CACHE.container.outlineObjects = []
    CACHE.container.loadingBar.style.visibility = 'visible'

    destroyCurrentPopup()

    if (CACHE.groupRoamAnimate.length) {
      CACHE.groupRoamAnimate.forEach(e => {
        clearTimeout(e)
      })
      CACHE.groupRoamAnimate = []
    }

    CACHE.container.updateSceneByNodes(CACHE.jsonParser.nodes[0], 0, () => {
      STATE.deviceList.children.forEach(e => {
        e.visible = false
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material = e2.userData.material[0]
          }
        })
      })
      CACHE.container.loadingBar.style.visibility = 'hidden'

      window.parent.postMessage({
        event: 'deptClick',
        targetData: {
          Id: `点击事件 制造部 ${STATE.currentScene.value} 退出`
        }
      }, '*')
      console.log(
        `deptClick-点击事件 制造部 ${STATE.currentScene.value} 退出`
      )


      STATE.currentScene.value = 'main'
    })
  }
}


// 二维按钮  点击部
function handleArea(area) {

  if (STATE.currentScene.value === 'main') {
    const waijing = CACHE.container.scene.children.find(e => e.name === 'waijing')
    waijing.children.forEach(e => {
      if (e.name === '124cf' || e.name === '35cf' || e.name === '3dlcf' || e.name === '1cdlcj'||e.name === '1dcf-lc-01' || e.name === 'jzwd1' || e.name === 'jz6') {
        e.visible = false
      }
    })

    STATE.wallList.forEach(e => {
      e.visible = true
    })

    STATE.deviceList.children.forEach(e => {
      e.visible = true

      if (e.userData.area === area) {
        e.userData.circle.popup.material.opacity = 1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material = e2.userData.material[0]
          }
        })

      } else {
        e.userData.circle.popup.material.opacity = 0.1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material = e2.userData.material[1]
          }
        })
      }
    })

  } else {

    if (STATE.currentScene.value === '5#') {
      STATE.wallList.forEach(e => {
        if (e.name === '1dulidiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })
    } else if (STATE.currentScene.value === '2#') {
      STATE.wallList.forEach(e => {
        if (e.name === '3dulidiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })

    } else if (STATE.currentScene.value === '3#') {
      STATE.wallList.forEach(e => {
        if (e.name === 'sanchangdiban' || e.name === 'wuchangdiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })

    } else if (STATE.currentScene.value === '17#') {
      STATE.wallList.forEach(e => {
        if (e.name === 'yichangdiban' || e.name === 'erchangdiban' || e.name === 'sichangdiban') {
          e.visible = true
        } else {
          e.visible = false
        }
      })
    }


    STATE.deviceList.children.forEach(e => {
      e.visible = isDeviceAmongTheBuilding(e, STATE.currentScene.value)

      if (e.userData.area === area) {
        e.userData.circle.popup.material.opacity = 1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material = e2.userData.material[0]
          }
        })

      } else {
        e.userData.circle.popup.material.opacity = 0.1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material = e2.userData.material[1]
          }
        })
      }

    })
  }


}

// 设备全部恢复 全部显示
function deviceReset() {
  if (STATE.currentScene.value === 'main') {

    const waijing = CACHE.container.scene.children.find(e => e.name === 'waijing')
    waijing.children.forEach(e => {
      if (e.name === '124cf' || e.name === '35cf' || e.name === '3dlcf' || e.name === '1cdlcj'||e.name === '1dcf-lc-01' || e.name === 'jzwd1' || e.name === 'jz6') {
        e.visible = true
      }
    })

    STATE.wallList.forEach(e => {
      e.visible = false
    })

    STATE.deviceList.children.forEach(e => {
      e.visible = false
    })

  } else {

    STATE.deviceList.children.forEach(e => {
      e.visible = false

      if (isDeviceAmongTheBuilding(e, STATE.currentScene.value)) {

        e.visible = true
        e.userData.circle.popup.material.opacity = 1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material.transparent = false
            e2.material.opacity = 1
          }
        })
      }
    })
  }
}

// 设备是不是在范围内
function isDeviceAmongTheBuilding(device, building) {
  if (!device || !device.position || !building) {
    return false
  }

  const devicePosition = { x: device.position.x, z: device.position.z }

  const area = DATA.buildingArea.find(e => e.name === building)

  if (!area) {
    return false
  }

  if (area.value.x1 < devicePosition.x && area.value.x2 > devicePosition.x && area.value.z1 < devicePosition.z && area.value.z2 > devicePosition.z) {
    return true

  } else {
    return false
  }

}


// 点击设备 镜头位移
function handleDevice(obj) {
  const modelMap = DATA.deviceList.find(e2 => e2.id === obj.userData.id)
  const model = STATE.deviceList.children.find(e2 => e2.userData.id === obj.userData.id)
  if (modelMap && model) {
    window.parent.postMessage({
      event: 'productLineClick',
      targetData: {
        Id: `点击事件 设备 ${obj.userData.id}`,
        dept: modelMap.area,
        team: modelMap.group
      }
    }, '*')
    console.log(
      `deviceClick-点击事件 设备 ${obj.userData.id}`
    )
  }
  const finalPosition = API.computedCameraFocusPosition(model.position, 200)

  const cameraState = {
    position: finalPosition,
    target: { x: model.position.x, y: model.position.y, z: model.position.z }
  }
  cameraAnimation({ cameraState })
}


// 单击楼层、设备弹弹窗
// type building deivce 
// id 楼title 设备id
// clickVal 点击事件 xRay 获取到的信息
// cameraMove 是否相机位移
function mouseClick(type, id, clickVal, cameraMove = true) {
  if (type === 'building') {
    let buildingArea = []
    if (id === '3#') {
      buildingArea = ['第三制造部', '第五制造部']
    } else if (id === '17#') {
      buildingArea = ['第一制造部', '第二制造部', '第四制造部']
    } else if (id === '2#') {
      buildingArea = ['第一制造部']
    } else if (id === '5#') {
      buildingArea = ['第三制造部']
    }

    let deviceNum = 0
    STATE.deviceList.children.forEach(e => {
      if (isDeviceAmongTheBuilding(e, id)) {
        deviceNum++
      }
    })

    const info = {
      title: id,
      list: [
        { name: '部门', value: buildingArea.length ? buildingArea.join(' ') : '--' },
        { name: '设备数', value: `${deviceNum}台` }
      ]
    }
    const popup = new Popup('building', info, clickVal.point)
    STATE.currentPopup = popup.popup

    window.parent.postMessage({
      event: 'productLineClick',
      targetData: {
        Id: `点击事件 大楼 ${id}`
      }
    }, '*')
    console.log(
      `buildingClick-点击事件 大楼 ${id}`
    )


  } else if (type === 'device') {
    if (cameraMove) {
      handleDevice(clickVal.object)
    }

    const deviceData = DATA.deviceList.find(e => e.id === id)
    const typeMap = DATA.stateColorMap.find(e => e.state == STATE.deviceList.children.find(e2 => e2.userData.id === id).userData.circle.state)
    const info = {
      title: id,
      list: [
        { name: '部门', value: deviceData?.area || '--' }
      ]
    }

    const popup = new Popup('device', info, clickVal.point)

    getCollectData(id).then(res => {
      if (res.data.code === 200) {
        const newInfo = {
          title: id,
          list: [{ name: '部门', value: deviceData?.area || '--' }]
        }

        res.data.data.forEach(e => {
          newInfo.list.push(
            { name: e.name, value: e.value }
          )
        })

        destroyCurrentPopup()
        const popup = new Popup('device', newInfo, clickVal.point)
      }
    })
  }
}

function destroyCurrentPopup() {
  if (STATE.currentPopup) {
    STATE.currentPopup.element.remove()
    STATE.currentPopup.parent.remove(STATE.currentPopup)
  }
  STATE.currentPopup = null
}

class Popup {
  type = ''
  info = {
    title: '',
    list: []
  }
  position = { x: 0, y: 0, z: 0 }
  popup = null


  constructor(type, info, position) {
    if (type) {
      this.type = type
    }
    if (info.title && info.list) {
      this.info.title = info.title
      this.info.list = info.list
    }
    if (position) this.position = position.clone()
    this.position.x += 60
    this.position.y += 30

    let text = ''
    this.info.list.forEach(e => {
      text += `
        <div style="width: 100%;margin-bottom: 5%;display: flex; justify-content: flex-start;align-items: center;">
          <span style="font-weight: bold;font-size: 5rem;word-break: keep-all; letter-spacing: 0.5rem; color: #FFF; ">${e.name}: </span>
          <span style="font-weight: bold;font-size: 5rem;word-break: break-all;letter-spacing: 0.5rem; color: #FFF; ">${e.value}</span>
        </div>
      `
    })

    const popup = new Bol3D.POI.Popup3DSprite({
      value: `<div style="pointer-events: all; width: 1500px; height: ${this.type === 'device' ? 2000 : 1500}px; background: url('./assets/3d/img/1.png') center / 100% 100% no-repeat;">
          <p style="position: absolute;font-size: 6rem; color: #00f6f7;font-weight: bold;letter-spacing: 2rem;top: 10%;left: 10%; word-break: keep-all;">${this.info.title}</p>
          <div style="position: absolute; display: flex;flex-direction: column;height: 73%;width: 85%;left: 10%;top: 20%;overflow-y:scroll;">
            ${text}
          </div>
        </div>`,
      position: [this.position.x, this.position.y, this.position.z],
      width: 150,
      height: this.type === 'device' ? 200 : 150,
      closeSize: 7,
      className: 'mouseClickPopup',
      size: this.type === 'building' ? 0.3 : 0.05,
      closeColor: '#ffffff'
    })
    this.popup = popup

    destroyCurrentPopup()
    CACHE.container.scene.add(popup)
    STATE.currentPopup = popup
  }
}

class Icon {
  state = 4
  popup = null
  deviceModel = null
  deviceId = ''


  constructor(deviceId) {
    const model = STATE.deviceList.children.find(e => e.userData.id === deviceId)
    if (!model) return

    this.deviceId = deviceId
    this.deviceModel = model

    this.init()
  }

  init() {
    let url = './assets/3d/img/'
    const map = DATA.stateColorMap.find(e => e.state == this.state)
    if (map && map.url) {
      url += (map.url + '.png')

    } else {
      url += '5.png'
    }

    let top = 0
    this.deviceModel.traverse(e => {
      if (e.isMesh) {
        if (e.geometry.boundingBox.max.y > top) {
          top = e.geometry.boundingBox.max.y
        }
      }
    })
    const typeMap = DATA.deviceTypeMap.find(e => e.id.includes(this.deviceId))

    const popup = new Bol3D.POI.Icon({
      url,
      position: [0, top + 10 / typeMap.scale, 0],
      scale: [0.02 / typeMap.scale, 0.02 / typeMap.scale],
      sizeAttenuation: false
    })

    this.popup = popup
    popup.userData.type = 'circle'
    this.deviceModel.add(popup)
  }

  destroy() {
    if (this.popup) {
      this.popup.parent.remove(this.popup)
    }
  }

  changeState(state) {
    if (state != undefined && this.state != state) {
      this.state = state
      this.destroy()
      this.init()
    }
  }
}


// 部门围墙的shader
class WallLine {
  time = { value: 0.0 }
  size = {
    x: { value: 0.0 },
    y: { value: 0.0 },
    z: { value: 0.0 }
  }
  UscaleY = { value: 8.0 }

  baseTopColor = { value: new Bol3D.Color(0.22, 0.32, 0.48) }
  baseDownColor = { value: new Bol3D.Color(0.18, 1, 1) }
  lineColor = { value: new Bol3D.Color(0.18, 1, 1) }

  constructor(object) {
    this.setMaterial(object)

    this.shaderRender()
  }

  setMaterial(object) {
    object.geometry.computeBoundingBox();
    object.geometry.computeBoundingSphere();
    const { geometry } = object;
    const { max, min } = geometry.boundingBox;
    const size = new Bol3D.Vector3(
      max.x - min.x,
      max.y - min.y,
      max.z - min.z
    )
    this.size.x.value = size.x
    this.size.y.value = size.y
    this.size.z.value = size.z

    const { material } = object

    material.transparent = true;
    material.side = 2;
    material.alphaToCoverage = true

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = this.time
      shader.uniforms.x0 = this.size.x
      shader.uniforms.y0 = this.size.y
      shader.uniforms.z0 = this.size.z
      shader.uniforms.baseTop = this.baseTopColor
      shader.uniforms.baseDown = this.baseDownColor
      shader.uniforms.lineCol = this.lineColor


      /**
       * 对片元着色器进行修改
       */
      const fragment = `
        uniform float time;
        uniform float x0;
        uniform float y0;
        uniform float z0;
        uniform float UscaleY;
        uniform vec3 baseTop;
        uniform vec3 baseDown;
        uniform vec3 lineCol;

        varying vec3 vPosition;
        float x;
        float y;
        float z;

        // GRAPH section
        int n = 5; //number of lines
        float scl = 2.; //difference between thin and thick lines
        float speed = 1.;

        float pi = 3.14;

        void main() {
      `;
      const fragmentColor = `
        x = vPosition.x / x0 + 0.5;  // 要除以模型的xyz  +0.5是让坐标系变为0-1
        y = vPosition.y / (y0 + UscaleY) + 0.5;  // 要除以模型的xyz  +0.5是让坐标系变为0-1
        z = vPosition.z / z0 + 0.5;  // 要除以模型的xyz  +0.5是让坐标系变为0-1

        // 要把uv转为position

        vec2 uv = vec2 (x, y);
        vec3 baseCol = mix(baseDown, baseTop, smoothstep(-0.2, 1., uv.y));


        float off = fract(time*speed);

        float lg = fract((exp(scl*uv.y)-1.) / (exp(scl)-1.) * float(n) - off);
        float mask = distance(lg, 0.5)*2.;

        vec3 col = mix(baseCol, lineCol, smoothstep(0.8, .9, mask)) ;

        gl_FragColor = vec4(col, 1.1 - y);
        #include <logdepthbuf_fragment>
      `;
      shader.fragmentShader = shader.fragmentShader.replace("void main() {", fragment)
      shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", fragmentColor);



      /**
       * 对顶点着色器进行修改
       */
      const vertex = `
        uniform float time;
        varying vec3 vColor;
        varying vec3 vPosition;

        
        void main() { 
          vPosition = vec3 (position.x, position.y, position.z);
      `
      const vertexPosition = `
        vec3 transformed = vec3(vPosition);
      `

      shader.vertexShader = shader.vertexShader.replace("void main() {", vertex);
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", vertexPosition);
    }

  }


  shaderRender() {
    requestAnimationFrame(this.shaderRender.bind(this))
    this.time.value = STATE.clock.getElapsedTime()
  }
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
  mouseClick,
  loadGUI,
  enterBuilding,
  backToMainScene,
  initDevices,
  testBox,
  handleDevice,
  initModels,
  handleArea,
  deviceReset,
  setPickable,
  WallLine,
  computedCameraFocusPosition,
  isDeviceAmongTheBuilding,
  getData
}
