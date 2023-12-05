<template>
  <div v-show="!isEdit" class="btn" @click="handleEditMode">{{ STATE.isEditMode.value ? '退出编辑模式' : '进入编辑模式' }}</div>

  <div class="editor" v-show="STATE.isEditMode.value">
    <div class="output" v-show="!isEdit">
      <el-button @click="clickInsert">新增</el-button>
      <el-button @click="clickOutput">导出配置(替换"根目录/data/deviceList.js")</el-button>
    </div>

    <el-table v-show="!isEdit" :data="DATA.deviceList" class="table" @row-click="clickRow" ref="table"
      highlight-current-row border>
      <el-table-column prop="id" label="ID" width="100" align="center" />
      <el-table-column label="旋转" width="78" align="center">
        <template #default="scope">
          {{ scope.row.rotate * 180 / 3.14 + '°' }}
        </template>
      </el-table-column>
      <el-table-column prop="position" label="位置" align="center" />
      <el-table-column prop="area" label="制造部" width="100" align="center" />
      <el-table-column prop="group" label="班组" width="100" align="center" />
      <el-table-column label="显示" width="60" align="center">
        <template #default="scope">
          {{ scope.row.visible ? '是' : '否' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="60" align="center">
        <template #default="scope">
          <el-button link size="small" style="color: #476494;" @click="clickEdit(scope)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-form v-show="isEdit" class="form" :model="formData">
      <el-form-item label="类型" prop="deviceType" label-width="60">
        <el-select v-model="formData.deviceType" @change="selectChange" :disabled="isGroundPick">
          <el-option v-for="item in DATA.deviceTypeMap" :label="item.type" :value="item.type" />
        </el-select>
        <el-button @click="handleGroundPick" type="primary"
          style="--el-button-bg-color:#48576e;--el-button-border-color:#48576e;--el-button-hover-bg-color:#667b9b;--el-button-hover-border-color:#667b9b;">{{
            isGroundPick ? '就选这个 隐藏所有设备' : '展示所有设备' }}</el-button>
      </el-form-item>

      <el-form-item label="ID" prop="id" label-width="60" v-show="!isGroundPick">
        <el-input v-model="formData.id" />
      </el-form-item>

      <el-form-item label="班组" prop="area" label-width="60" v-show="!isGroundPick">
        <el-input v-model="formData.area" />
      </el-form-item>

      <el-form-item label="制造部" prop="group" label-width="60" v-show="!isGroundPick">
        <el-input v-model="formData.group" />
      </el-form-item>

      <el-form-item label="位置" prop="position" label-width="60" v-show="!isGroundPick">
        <el-input v-model="formData.position[0]" @focus="handleInput('position')" style="width:30%" />
        <el-input v-model="formData.position[2]" @focus="handleInput('position')" style="width:30%" />
      </el-form-item>

      <el-form-item label="旋转" prop="rotate" label-width="60" v-show="!isGroundPick">
        <el-input v-model="formData.rotate" @focus="handleInput('rotate')" style="width:30%" />
      </el-form-item>

      <el-space v-if="!isInsertMode" fill style="width: 100%;" v-show="!isGroundPick">
        <el-form-item label="缩放" prop="scale" label-width="60">
          <el-slider v-model="formData.scale" show-input :min="10" :max="2000" @input="handleScale"
            style="--el-slider-main-bg-color:#48576e;" />
        </el-form-item>
        <el-alert type="info" :closable="false" style="margin-top: -3%;">
          <p>缩放对所有同类型设备生效。更改设备类型后请保存提交，重新进入编辑模式生效</p>
        </el-alert>
      </el-space>

      <el-form-item label="显示" prop="visible" label-width="60" style="margin-top:3%;" v-show="!isGroundPick">
        <el-switch v-model="formData.visible" @click="handleVisible" style="--el-switch-on-color:#48576e; width:30%" />
      </el-form-item>

      <el-form-item label-width="60" style="margin-top: 10%;" v-show="!isGroundPick">
        <el-button @click="handleSubmit(0)">保存</el-button>
        <el-button @click="handleSubmit(1)">返回(不保存)</el-button>
        <el-button type="danger" @click="handleSubmit(2)" v-show="!isInsertMode">删除</el-button>
      </el-form-item>
    </el-form>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { VUEDATA } from '@/VUEDATA'
import { DATA } from '@/ktJS/DATA'
import { CACHE } from '@/ktJS/CACHE'
import { STATE } from '@/ktJS/STATE'
import { API } from '@/ktJS/API'
import { Group, Mesh, Object3D } from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import bus from '@/utils/bus.js'
import { ElMessage } from 'element-plus'

let control = null            // transform 控制器
let table = ref(null)         // 表格 ref dom
let isEdit = ref(false)       // 是否进入编辑模式
let isGroundPick = ref(false) // 是否进入了广场选设备模式
let isInsertMode = ref(false) // 新增模式
let oldVal = null             // 原始模型的数据 备份
let oldModel = null           // 原始模型 备份
let tempModel = null          // 编辑类型时的临时模型

interface FormData {
  deviceType: number,
  id: string,
  rotate: number,
  scale: number,
  position: number[],
  visible: boolean,
  group: string,
  area: string
}
const formData = reactive({
  deviceType: 0,
  id: '',
  rotate: 0,
  scale: 1,
  position: [0, 0, 0],
  visible: true,
  group: '',
  area: ''
})

// 点击左下进入编辑按钮按钮
function handleEditMode(): void {
  STATE.isEditMode.value = !STATE.isEditMode.value
  const waijing = CACHE.container.scene.children.find((e: { name: string }) => e.name === 'waijing')
  const tagGroup = CACHE.container.scene.children.find((e: { userData: { type: string } }) => e.userData.type === 'TagGroup')

  waijing.children.forEach((e: Mesh) => {
    if (e.name === '124cf' || e.name === '35cf' || e.name === '3dlcf' || e.name === '1cdlcj') {
      e.visible = !STATE.isEditMode.value
      e.children.forEach((e2: Mesh) => e2.visible = !STATE.isEditMode.value)
    }
  })

  tagGroup.visible = !STATE.isEditMode.value

  STATE.wallList.forEach((e: Mesh) => {
    e.visible = STATE.isEditMode.value
  })

  STATE.deviceList.children.forEach((e: Mesh) => {
    e.visible = STATE.isEditMode.value
  })

  if (STATE.isEditMode.value) {
    bus.$on('device', (id: string) => {


      if (id) {
        if (isEdit.value) {
          ElMessage({
            message: '请先完成当前编辑',
            type: 'warning',
          })
          return
        }

        CACHE.container.outlineObjects = []
        const group = STATE.deviceList.children.find((e: Mesh | Group) => e.userData.id === id)
        if (!group) return

        group.traverse((e: any) => {
          if (e.isMesh) {
            CACHE.container.outlineObjects.push(e)
          }
        })

        // 操，具体细节我就不说了，功能是双击模型，然后 element table 进行对应跳转
        const tableBody = table.value.$el.children[0].children[2].children[0].children[0].children[0].children[0].children[1]
        for (let i = 0; i < tableBody.children.length; i++) {
          if (tableBody.children[i].children[0].children[0].innerText === group.userData.id) {
            const rowIndex = DATA.deviceList.findIndex((e: { id: string }) => e.id === group.userData.id)
            table.value.setCurrentRow(DATA.deviceList[rowIndex])
            table.value.scrollTo({ top: tableBody.children[i].offsetTop, behavior: 'smooth' })
            break
          }
        }
      }
    })

  } else {
    bus.$off('device')
  }
}

// 点击编辑按钮
function clickEdit(scope: { row: FormData }): void {
  const model = STATE.deviceList.children.find((e: Group | Mesh) => e.userData.id === scope.row.id)
  if (!model) return
  if (control) {
    control.attach(model)
    control.object = model
  } else {
    control = editorControls(model)
  }
  control.addEventListener("change", changeListener)

  isEdit.value = true
  const typeMap = DATA.deviceTypeMap.find((e: { id: string[] }) => e.id.includes(scope.row.id))
  formData.deviceType = typeMap.type || '未知'
  formData.id = scope.row.id
  formData.position[0] = scope.row.position[0]
  formData.position[2] = scope.row.position[2]
  formData.rotate = scope.row.rotate * 180 / 3.14
  formData.visible = scope.row.visible
  formData.group = scope.row.group
  formData.area = scope.row.area
  formData.scale = typeMap.scale

  oldVal = JSON.parse(JSON.stringify(formData))
  oldModel = model
}

// 点击保存、不保存、删除
function handleSubmit(type: number): void {
  if (type === 0) {

    const obj = control.object
    control.removeEventListener("change", changeListener)
    control.detach()

    if (isInsertMode.value) {
      
      
      const index = DATA.deviceList.findIndex((e: { id: string }) => e.id === formData.id)
      
      if (index >= 0) {
        ElMessage.warning('已存在此ID')
        return
      }

      DATA.deviceList.push({
        id: formData.id,
        type: formData.deviceType,
        position: [formData.position[0], 0, formData.position[2]],
        rotate: formData.rotate / 180 * 3.14,
        area: formData.area,
        group: formData.group,
        visible: formData.visible
      })

      tempModel.parent.remove(tempModel)
      STATE.deviceList.add(tempModel)

      tempModel.userData.deviceType = formData.deviceType
      tempModel.userData.id = formData.id
      tempModel.userData.area = formData.area
      tempModel.userData.group = formData.group
      tempModel.traverse((e: any) => {
        if (e.isMesh) {
          e.userData.type = 'device'
          e.userData.deviceType = formData.deviceType
          e.userData.id = formData.id
          e.userData.area = formData.area
          e.userData.group = formData.group
          CACHE.container.clickObjects.push(e)
        }
      })

      const typeMap = DATA.deviceTypeMap.find((e: { id: string[] }) => e.id.includes(formData.id))
      if (typeMap) {
        const index = typeMap.id.findIndex((e: string) => e === formData.id)
        typeMap.id.splice(index, 1)
      }

      const newTypeMap = DATA.deviceTypeMap.find((e: { type: number }) => e.type === formData.deviceType)
      if (newTypeMap) {
        newTypeMap.id.push(formData.id)
      }


    } else if (tempModel) {
      // 删除 deviceList 上的旧数据
      const index = DATA.deviceList.findIndex((e: { id: string }) => e.id === oldVal.id)
      if (index >= 0) {
        DATA.deviceList.splice(index, 1)
      }

      if (oldModel) {
        oldModel.parent.remove(oldModel)
        oldModel = null
      }

      DATA.deviceList.push({
        id: formData.id,
        type: formData.deviceType,
        position: [formData.position[0], 0, formData.position[2]],
        rotate: formData.rotate / 180 * 3.14,
        area: formData.area,
        group: formData.group,
        visible: formData.visible
      })

      tempModel.parent.remove(tempModel)
      STATE.deviceList.add(tempModel)

      tempModel.userData.deviceType = formData.deviceType
      tempModel.userData.id = formData.id
      tempModel.userData.area = formData.area
      tempModel.userData.group = formData.group
      tempModel.traverse((e: any) => {
        if (e.isMesh) {

          e.userData.type = 'device'
          e.userData.deviceType = formData.deviceType
          e.userData.id = formData.id
          e.userData.area = formData.area
          e.userData.group = formData.group
          CACHE.container.clickObjects.push(e)
        }
      })

      const typeMap = DATA.deviceTypeMap.find((e: { id: string[] }) => e.id.includes(formData.id))
      if (typeMap) {
        const index = typeMap.id.findIndex((e: string) => e === formData.id)
        typeMap.id.splice(index, 1)
      }

      const newTypeMap = DATA.deviceTypeMap.find((e: { type: number }) => e.type === formData.deviceType)
      if (newTypeMap) {
        newTypeMap.id.push(formData.id)
      }


      // 模型没变
    } else {
      const data = DATA.deviceList.find((e: FormData) => e.id === oldModel.userData.id)

      if (data) {
        data.id = formData.id
        data.position[0] = Number(formData.position[0].toFixed(1))
        data.position[2] = Number(formData.position[2].toFixed(1))
        data.rotate = formData.rotate / 180 * 3.14
        data.visible = formData.visible
        data.group = formData.group
        data.area = formData.area
      }

      const map = DATA.deviceTypeMap.find((e: { id: string[] }) => e.id.includes(obj.userData.id))

      if (map) {
        map.scale = formData.scale
      }

      obj.userData.id = formData.id
      obj.traverse((e: any) => {
        if (e.isMesh) {

          e.userData.type = 'device'
          e.userData.id = formData.id
        }
      })
    }
    isEdit.value = false

  } else if (type === 1) {
    control.removeEventListener("change", changeListener)
    control.detach()

    if (oldModel) {
      oldModel.position.x = oldVal.position[0]
      oldModel.position.z = oldVal.position[2]
      oldModel.rotation.y = oldVal.rotate
      oldModel.visible = oldVal.visible
      oldModel.group = oldVal.group
      oldModel.area = oldVal.area
    }

    if (tempModel) {
      tempModel.parent.remove(tempModel)
    }
    isEdit.value = false

  } else if (type === 2) {
    control.removeEventListener("change", changeListener)
    control.detach()
    CACHE.container.outlineObjects = []

    oldModel.parent.remove(oldModel)
    const index = DATA.deviceList.findIndex((e: FormData) => e.id === oldModel.userData.id)
    if (index >= 0) {
      DATA.deviceList.splice(index, 1)
    }

    oldModel = null
    isEdit.value = false
  }

  isInsertMode.value = false
  isEdit.value = false
  oldVal = null
  oldModel = null
  tempModel = null
}

// 切换显示隐藏
function handleVisible(): void {
  if (tempModel) {
    tempModel.visible = formData.visible

  } else {
    oldModel.visible = formData.visible
  }
}

// 点击 position 或 rotate 栏 
function handleInput(type: string): void {
  if (type === 'position') {
    control.setMode('translate')
    control.showX = true
    control.showY = false
    control.showZ = true

  } else if (type === 'rotate') {
    control.setMode('rotate')
    control.showX = false
    control.showY = true
    control.showZ = false

  }
}

// 点击 scale 栏
function handleScale(val: number): void {
  if (tempModel) {
    tempModel.scale.set(val, val, val)

  } else if (oldModel) {
    const map = DATA.deviceTypeMap.find((e: { id: string[] }) => e.id.includes(formData.id))
    map.id.forEach((e: string) => {
      const model = STATE.deviceList.children.find((item: Mesh | Group) => item.userData.id === e)
      if (model) {
        model.scale.set(val, val, val)
      }
    })
  }
}

// 点击表格的某一行
function clickRow(e: FormData): void {

  CACHE.container.outlineObjects = []
  const item = DATA.deviceList.find((e2: FormData) => e2.id === e.id)
  if (!item) return

  const obj = STATE.deviceList.children.find((e2: Mesh | Group) => e2.userData.id === item.id)
  if (!obj) return

  obj.traverse((e2: any) => {
    if (e2.isMesh) {
      CACHE.container.outlineObjects.push(e2)
    }
  })

  const cameraPosition = API.computedCameraFocusPosition(obj.position)
  const cameraState = {
    position: cameraPosition,
    target: obj.position
  }
  API.cameraAnimation({ cameraState })
}

// 设备类型改变
function selectChange(type: number): void {
  const map = DATA.deviceTypeMap.find((e: { type: number }) => e.type === type)
  if (!map) return

  if (tempModel) {
    if (isInsertMode.value) {
      control.removeEventListener("change", changeListener)
      control.detach()
    }
    tempModel.parent.remove(tempModel)
    tempModel = null
  }

  let model = null
  if (isInsertMode.value) {
    const map = DATA.deviceTypeMap.find((e: { type: number }) => e.type === type)
    if (!map) return
    const originModel = STATE.deviceModel.children.find((e: { name: string }) => e.name === map.modelName)
    if (!originModel) return

    model = originModel.clone()
    model.position.set(formData.position[0], 0, formData.position[2])
    model.rotation.y = Math.PI / 180 * formData.rotate
    model.visible = true
    CACHE.container.scene.add(model)

    control.object = model

    formData.position[0] = model.position.x
    formData.position[2] = model.position.z
    formData.rotate = model.rotation.y
    formData.visible = true
    tempModel = model


  } else {
    oldModel.visible = false
    model = STATE.deviceModel.children.find(e2 => e2.name === map.modelName).clone()
    model.position.x = formData.position[0]
    model.position.z = formData.position[2]
    model.rotation.y = formData.rotate * 3.14 / 180
    model.visible = true
    model.scale.set(map.scale, map.scale, map.scale)
    tempModel = model

    CACHE.container.scene.add(model)
    control.object = model
  }

  if (model && !isGroundPick.value) {
    CACHE.container.outlineObjects = []
    model.traverse((e: any) => {
      if (e.isMesh) {
        CACHE.container.outlineObjects.push(e)
      }
    })
  }
}

// 显示 / 隐藏所有设备
function handleGroundPick(): void {
  isGroundPick.value = !isGroundPick.value
  CACHE.container.transformControl.visible = !isGroundPick.value

  if (isGroundPick.value) {
    CACHE.container.outlineObjects = []
    // 保存一下视角
    CACHE.groupPickCameraState = {
      camera: CACHE.container.orbitCamera.position.clone(),
      target: CACHE.container.orbitControls.target.clone()
    }

    CACHE.container.orbitCamera.position.set(-65.6431, 1218.8404, -854.6625)
    CACHE.container.orbitControls.target.set(-59.6002, 0, 95.4743)
    CACHE.container.orbitControls.maxPolarAngle = 1.2

    bus.$on('originModel', (modelName: string) => {
      const typeMap = DATA.deviceTypeMap.find((e: { modelName: string }) => e.modelName === modelName)
      const model = STATE.deviceModel.children.find(e => e.userData.modelName === modelName)

      CACHE.container.outlineObjects = []
      model.traverse((e: any) => {
        if (e.isMesh) {
          CACHE.container.outlineObjects.push(e)
        }
      })

      if (typeMap) {
        formData.deviceType = typeMap.type

      } else {
        const newType = {
          type: Math.max(...DATA.deviceTypeMap.map((e: { type: number }) => e.type)) + 1,
          modelName,
          id: [modelName],
          scale: 300
        }
        DATA.deviceTypeMap.push(newType)
        formData.deviceType = newType.type
      }

      selectChange(formData.deviceType)
    })
    STATE.deviceModel.visible = true

  } else {
    CACHE.container.orbitCamera.position.set(CACHE.groupPickCameraState.camera.x, CACHE.groupPickCameraState.camera.y, CACHE.groupPickCameraState.camera.z)
    CACHE.container.orbitControls.target.set(CACHE.groupPickCameraState.target.x, CACHE.groupPickCameraState.target.y, CACHE.groupPickCameraState.target.z)
    CACHE.container.orbitControls.maxPolarAngle = Math.PI / 2
    CACHE.groupPickCameraState = {}
    bus.$off('originModel')
    STATE.deviceModel.visible = false

    CACHE.container.outlineObjects = []
    control.object.traverse((e: any) => {
      if (e.isMesh) {
        CACHE.container.outlineObjects.push(e)
      }
    })
  }
}

// 点击新增按钮
function clickInsert(): void {
  isInsertMode.value = true
  isEdit.value = true

  const defaultMap = DATA.deviceTypeMap[0]
  const defaultModel = STATE.deviceModel.children.find((e: { name: string }) => e.name === defaultMap.modelName)
  if (!defaultModel) return

  const model = defaultModel.clone()
  model.position.set(0, 0, 0)
  model.rotation.y = 0
  model.scale.set(defaultMap.scale, defaultMap.scale, defaultMap.scale)
  model.visible = true
  model.userData.deviceType = defaultMap.type
  model.userData.id = '0000000000'
  CACHE.container.scene.add(model)
  CACHE.container.outlineObjects = []
  model.traverse((e: any) => {
    if (e.isMesh) {
      CACHE.container.outlineObjects.push(e)
    }
  })


  if (control) {
    control.attach(model)
    control.object = model

  } else {
    const controls = editorControls(model)
    control = controls
  }
  control.addEventListener("change", changeListener)

  formData.deviceType = model.userData.deviceType
  formData.id = model.userData.id
  formData.position = [0, 0, 0]
  formData.rotate = 0
  formData.scale = defaultMap.scale
  formData.visible = true

  oldVal = JSON.parse(JSON.stringify(formData))
  tempModel = model
}

// 点击导出按钮
function clickOutput(): void {
  const link = document.createElement('a')
  link.download = 'deviceInfo.js'
  const outDeviceList = DATA.deviceList
  const outDeviceTypeMap = DATA.deviceTypeMap
  link.href = `
    data:text/plain,
    const deviceList = ${JSON.stringify(outDeviceList)}\n
    window.deviceList = deviceList
    
    const deviceTypeMap = ${JSON.stringify(outDeviceTypeMap)}\n
    window.deviceTypeMap = deviceTypeMap
    `
  link.click()
}

// transform
function editorControls(mesh: Object3D): TransformControls {
  // CACHE.container.bloomPass.enabled = false
  const controls = CACHE.container.transformControl;
  controls.translationSnap = 1
  controls.rotationSnap = Math.PI / 8
  controls.showY = false
  controls.attach(mesh);

  return controls
}

function changeListener(): void {
  formData.position[0] = Number(control.object.position.x.toFixed(1))
  formData.position[2] = Number(control.object.position.z.toFixed(1))
  formData.rotate = Number((control.object.rotation.y * 180 / Math.PI).toFixed(1))
}




onMounted(() => {

})

</script>

<style lang="less" scoped>
.btn {
  position: absolute;
  bottom: 10%;
  left: 5%;
  border: 1px solid #bad3ff;
  pointer-events: all;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0.5%;
  height: 32px;
  text-align: center;
  border-radius: 4px;
  background-color: #47669c;
  color: #fff;
  font-size: 14px;
  letter-spacing: 2px;
  transition: all 0.3s;
  opacity: 0.8;
}

.editor {
  position: absolute;
  right: 1%;
  top: 20%;
  width: 32%;
  height: 60vh;
  pointer-events: none;

  .output {
    pointer-events: all;
    position: absolute;
    top: -10%;
  }

  .table {
    pointer-events: all;
    height: 100%;
  }

  .form {
    border-radius: 4px;
    padding: 2%;
    pointer-events: all;
    position: absolute;
    left: 0;
    width: 100%;
    background-color: #fff;
  }
}
</style>