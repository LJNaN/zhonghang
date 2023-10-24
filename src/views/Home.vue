
<template>
  <div class="home">

    <div class="areaList">
      <div class="areaList-item" v-for="item in areaList" :key="item" @click="handleArea(item)">
        {{ item }}
        <div v-if="item != '全部显示' && popupShow[item]" class="areaList-item-group">
          <div class="areaList-item-group-item" v-for="group in groupList[item]" @click.stop="handleGroup(item, group)">{{
            group
          }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="STATE.currentScene.value != 'main'" class="back" @click="back">返回</div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, reactive, render } from "vue";
import * as echarts from "echarts";
import { API } from "@/ktJS/API"
import { STATE } from "@/ktJS/STATE"
import { DATA } from "@/ktJS/DATA"
import { CACHE } from "@/ktJS/CACHE";

let areaList = ref([
  '第一制造部',
  '第二制造部',
  '第三制造部',
  '第四制造部',
  '第五制造部',
  '全部显示'
])


const popupShow = reactive({
  '第一制造部': false,
  '第二制造部': false,
  '第三制造部': false,
  '第四制造部': false,
  '第五制造部': false
})
STATE.popupShow = popupShow


const groupList = {}
for (let key in popupShow) {
  groupList[key] = Array.from(new Set(DATA.deviceMap.filter(e => e.area === key).map(e => e.group))).filter(e => e)
}

watch(STATE.currentScene,
  ((newVal) => {
    if (newVal === 'main') {
      areaList.value = ['第一制造部', '第二制造部', '第三制造部', '第四制造部', '第五制造部', '全部显示']
    } else if (newVal === '2#') {
      areaList.value = []
    } else if (newVal === '17#') {
      areaList.value = ['第一制造部', '第二制造部', '第四制造部', '全部显示']
    } else if (newVal === '5#') {
      areaList.value = []
    } else if (newVal === '3#') {
      areaList.value = ['第三制造部', '第五制造部', '全部显示']
    }
  }), { immediate: true })


function handleArea(item) {
  if (STATE.currentScene.value === 'main') {
    for (let key in popupShow) {
      popupShow[key] = false
    }
  } else {
    for (let key in popupShow) {
      popupShow[key] = key === item
    }
  }


  if (item === '全部显示') {
    API.deviceReset()
  } else {
    API.handleArea(item)
  }
}

function handleGroup(item, group) {

  if (!['第一制造部', '第二制造部', '第三制造部', '第四制造部', '第五制造部'].includes(item)) return

  const list = DATA.deviceMap.filter(e => e.area === item && e.group === group)
  console.log('list: ', list);

  if (!list.length) return

  STATE.deviceList.children.forEach(e => {
    if (e.visible && e.userData.area === item) {
      if (e.userData.group === group) {
        e.userData.circle.popup.material.opacity = 1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material.transparent = false
            e2.material.opacity = 1
          }
        })
      } else {
        e.userData.circle.popup.material.opacity = 0.1
        e.traverse(e2 => {
          if (e2.isMesh) {
            e2.material.transparent = true
            e2.material.opacity = 0.1
          }
        })
      }
    }
  })


  // 挨个高亮  漫游轮播
  if (CACHE.groupRoamAnimate.length) {
    CACHE.groupRoamAnimate.forEach(e => {
      clearTimeout(e)
    })
    CACHE.groupRoamAnimate = []
  }

  for (let i = 0; i < list.length; i++) {
    const timer = setTimeout(() => {
      const model = STATE.deviceList.children.find(e => e.userData.id === list[i].id)
      if (model) {
        CACHE.container.outlineObjects = []
        model.traverse(e => {
          if (e.isMesh) {
            CACHE.container.outlineObjects.push(e)
          }
        })
      }

      const target = { x: list[i].position[0], y: 0, z: list[i].position[2] }
      const finalPosition = API.computedCameraFocusPosition(target, 100, 60)

      const cameraState = {
        position: finalPosition,
        target: { x: list[i].position[0], y: 0, z: list[i].position[2] }
      }
      API.cameraAnimation({ cameraState })
    }, i * 3000)

    CACHE.groupRoamAnimate.push(timer)
  }
}


function back() {
  API.backToMainScene()
  for (let key in STATE.popupShow) {
    STATE.popupShow[key] = false
  }
}


onMounted(() => {
});


</script>


<style lang="less" scoped>
.home {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: absolute;

  .areaList {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 10%;
    display: flex;
    width: 50%;
    justify-content: center;


    &-item {
      position: relative;
      border: 1px solid #bad3ff;
      margin: 0 2%;
      pointer-events: all;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 10%;
      height: 32px;
      text-align: center;
      border-radius: 4px;
      background-color: #47669c;
      color: #FFF;
      font-size: 14px;
      letter-spacing: 2px;
      transition: all 0.3s;
      opacity: 0.8;

      &-group {
        position: absolute;
        width: 100%;
        bottom: 42px;
        display: flex;
        flex-direction: column-reverse;
        justify-content: flex-end;

        &-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          background-color: #47669c;
          border: 1px solid #FFFFFF55;
        }
      }
    }

    &-item:hover {
      background-color: #5e84c7;
      opacity: 1;
    }
  }

  .back {
    border: 1px solid #bad3ff;
    position: absolute;
    right: 2%;
    bottom: 10%;
    pointer-events: all;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 5%;
    height: 32px;
    text-align: center;
    border-radius: 4px;
    background-color: #47669c;
    color: #FFF;
    font-size: 14px;
    letter-spacing: 2px;
    transition: all 0.3s;
    opacity: 0.8;
  }

  .back:hover {
    background-color: #5e84c7;
    opacity: 1;
  }
}
</style>
