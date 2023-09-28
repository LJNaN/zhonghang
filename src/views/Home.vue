
<template>
  <div class="home">

    <div class="areaList">
      <div class="areaList-item" v-for="item in areaList" :key="item" @click="handleArea(item)">{{ item }}</div>
    </div>

    <div v-if="STATE.currentScene.value != 'main'" class="back" @click="back">返回</div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { API } from "@/ktJS/API"
import { STATE } from "@/ktJS/STATE"

let areaList = ref([
  '第一制造部',
  '第二制造部',
  '第三制造部',
  '第四制造部',
  '第五制造部',
  '全部显示'
])

watch(STATE.currentScene,
  ((newVal) => {
    if (newVal === 'main') {
      areaList.value = ['第一制造部', '第二制造部', '第三制造部', '第四制造部', '第五制造部','全部显示']
    } else if (newVal === '1#') {
      areaList.value = []
    } else if (newVal === '2#') {
      areaList.value = ['第一制造部', '第二制造部', '第四制造部','全部显示']
    } else if (newVal === '3#') {
      areaList.value = []
    } else if (newVal === '4#') {
      areaList.value = ['第三制造部', '第五制造部','全部显示']
    }
  }), { immediate: true })


function handleArea(item) {
  if(item === '全部显示') {
    API.deviceReset()
  } else {
    API.handleArea(item)
  }
}

function back() {
  API.backToMainScene()
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
