<template>
  <div class="btn" @click="handleEditMode">{{ VUEDATA.isEditMode.value ? '退出编辑模式' : '进入编辑模式' }}</div>

  <div class="editor">
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
        <el-select v-model="formData.deviceType" @change="selectChange">
          <el-option v-for="item in DATA.deviceTypeMap" :label="'与 ' + item.modelName + ' 相同'" :value="item.type" />
        </el-select>
      </el-form-item>

      <el-form-item label="ID" prop="id" label-width="60">
        <el-input v-model="formData.id" />
      </el-form-item>

      <el-form-item label="班组" prop="area" label-width="60">
        <el-input v-model="formData.area" />
      </el-form-item>

      <el-form-item label="制造部" prop="group" label-width="60">
        <el-input v-model="formData.group" />
      </el-form-item>

      <el-form-item label="位置" prop="position" label-width="60">
        <el-input v-model="formData.position[0]" @focus="handleInput('position')" style="width:30%" />
        <el-input v-model="formData.position[2]" @focus="handleInput('position')" style="width:30%" />
      </el-form-item>

      <el-form-item label="旋转" prop="rotate" label-width="60">
        <el-input v-model="formData.rotate" @focus="handleInput('rotate')" style="width:30%" />
      </el-form-item>

      <el-space fill style="width: 100%;">
        <el-form-item label="缩放" prop="scale" label-width="60">
          <el-slider v-model="formData.scale" show-input :min="10" :max="2000" @input="handleScale"
            style="--el-slider-main-bg-color:#48576e;" />
        </el-form-item>
        <el-alert type="info" :closable="false" style="margin-top: -3%;">
          <p>缩放对所有同类型设备生效</p>
        </el-alert>
      </el-space>

      <el-form-item label="显示" prop="visible" label-width="60" style="margin-top:3%;">
        <el-switch v-model="formData.visible" @click="handleVisible" style="--el-switch-on-color:#48576e; width:30%" />
      </el-form-item>

      <el-form-item label-width="60" style="margin-top: 10%;">
        <el-button @click="isInsertMode ? insertSubmit(0) : handleSubmit(0)">保存</el-button>
        <el-button @click="isInsertMode ? insertSubmit(1) : handleSubmit(1)">返回(不保存)</el-button>
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
import { objectPick } from '@vueuse/shared'

let control = null            // transform 控制器
let table = ref(null)         // 表格 ref dom
let isEdit = ref(false)       // 是否进入编辑模式
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
console.log(formData )

// 点击左下进入编辑按钮按钮
function handleEditMode(): void {
  VUEDATA.isEditMode.value = !VUEDATA.isEditMode.value
  const waijing = CACHE.container.scene.children.find((e: { name: string }) => e.name === 'waijing')
  const tagGroup = CACHE.container.scene.children.find((e: { userData: { type: string } }) => e.userData.type === 'TagGroup')

  waijing.children.forEach((e: Mesh) => {
    if (e.name === '124cf' || e.name === '35cf' || e.name === '3dlcf' || e.name === '1cdlcj') {
      e.visible = !VUEDATA.isEditMode.value
      e.children.forEach((e2: Mesh) => e2.visible = !VUEDATA.isEditMode.value)
    }
  })

  tagGroup.visible = !VUEDATA.isEditMode.value

  STATE.wallList.forEach((e: Mesh) => {
    e.visible = VUEDATA.isEditMode.value
  })

  STATE.deviceList.children.forEach((e: Mesh) => {
    e.visible = VUEDATA.isEditMode.value
  })
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

    // 新模型
    if (tempModel) {
      const index = DATA.deviceMap.value.findIndex((e: { type: any; id: any }) => e.type === oldModel.userData.deviceType && e.id === oldModel.userData.id)
      if (index >= 0) {
        DATA.deviceMap.value.splice(index, 1)
      }
      oldModel.parent.remove(oldModel)
      oldModel = null
      DATA.deviceMap.value.push({
        id: formData.id,
        type: formData.deviceType,
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotate: formData.rotate,
        visible: formData.visible
      })

      obj.userData.deviceType = formData.deviceType
      obj.userData.id = formData.id
      obj.traverse((e: any) => {
        if (e.isMesh) {
          e.userData.type = 'device'
          e.userData.deviceType = formData.deviceType
          e.userData.id = formData.id
          CACHE.container.clickObjects.push(e)
        }
      })

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
    oldModel.position.x = oldVal.position[0]
    oldModel.position.z = oldVal.position[2]
    oldModel.rotation.y = oldVal.rotate
    oldModel.visible = oldVal.visible
    oldModel.group = oldVal.group
    oldModel.area = oldVal.area
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

  oldVal = null
  oldModel = null
  tempModel = null
}

// 新增状态下 点击保存、不保存
function insertSubmit(type: number): void {

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
function selectChange(e: any): void {

  // if (e === oldVal.deviceType) return

  // if (tempModel) {
  //   if (isInsertMode.value) {
  //     control.removeEventListener("change", changeListener)
  //     control.detach()
  //   }
  //   tempModel.parent.remove(tempModel)
  //   tempModel = null
  // }

  // if (isInsertMode.value) {
  //   const originModel = STATE.sceneList[e]

  //   if (!originModel) return

  //   const model = originModel.clone()
  //   model.position.set(formData.x, 0, formData.z)
  //   model.rotation.y = Math.PI / 180 * formData.rotate
  //   model.visible = true
  //   CACHE.container.scene.add(model)
  //   CACHE.container.outlineObjects = []
  //   model.traverse(e => {
  //     if (e.isMesh) {
  //       CACHE.container.outlineObjects.push(e)
  //     }
  //   })

  //   if (control) {

  //     control.attach(model)
  //     control.object = model
  //   } else {
  //     const controls = editorControls(model)
  //     control = controls
  //   }
  //   control.addEventListener("change", changeListener)

  //   formData.id = e + '_1'
  //   formData.x = model.position.x
  //   formData.z = model.position.z
  //   formData.rotate = model.rotation.y
  //   formData.visible = true

  //   oldVal = JSON.parse(JSON.stringify(formData))
  //   tempModel = model


  // } else {

  //   oldModel.visible = false
  //   const model = STATE.sceneList[e].clone()
  //   model.position.x = formData.x
  //   model.position.z = formData.z
  //   model.rotation.y = formData.rotate * Math.PI / 180
  //   model.visible = true
  //   tempModel = model

  //   CACHE.container.scene.add(model)
  //   CACHE.container.outlineObjects = []
  //   model.traverse(e => {
  //     if (e.isMesh) {
  //       CACHE.container.outlineObjects.push(e)
  //     }
  //   })
  //   control.object = model
  // }
}

// 点击新增按钮
function clickInsert(): void {
  isInsertMode.value = true
  isEdit.value = true

  // const originModel = STATE.sceneList[modelList[0]?.modelName]
  // if (!originModel) return

  // const model = originModel.clone()
  // model.position.set(0, 0, 0)
  // model.rotation.y = 0
  // model.visible = true
  // model.userData.deviceType = modelList[0]?.modelName
  // model.userData.id = modelList[0]?.modelName + '_1'
  // CACHE.container.scene.add(model)
  // CACHE.container.outlineObjects = []
  // model.traverse(e => {
  //   if (e.isMesh) {
  //     CACHE.container.outlineObjects.push(e)
  //   }
  // })


  // if (control) {
  //   control.attach(model)
  //   control.object = model
  // } else {
  //   const controls = editorControls(model)
  //   control = controls
  // }
  // control.addEventListener("change", changeListener)

  // formData.deviceType = model.userData.deviceType
  // formData.id = model.userData.id
  // formData.x = model.position.x
  // formData.z = model.position.z
  // formData.rotate = model.rotation.y
  // formData.visible = true


  // oldVal = JSON.parse(JSON.stringify(formData))
  // tempModel = model
}

// 点击导出按钮
function clickOutput(): void {
  const link = document.createElement('a')
  link.download = 'deviceList.js'
  const outDeviceList = DATA.deviceList
  link.href = `data:text/plain,const deviceList = ${JSON.stringify(outDeviceList)}\n window.deviceList = deviceList`
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
  pointer-events: all;

  .output {
    position: absolute;
    top: -10%;
  }

  .table {
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