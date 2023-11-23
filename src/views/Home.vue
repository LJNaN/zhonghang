<template>
  <div class="home">
    <div class="areaList">
      <div class="areaList-item" v-for="item in areaList" :key="item" @click="handleAreaBtn(item)">
        {{ item }}
        <div v-if="item != '全部显示' && popupShow[item]" class="areaList-item-group">
          <div class="areaList-item-group-item" v-for="group in groupList[item]" @click.stop="handleGroup(item, group)">
            {{ group }}
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
import { API } from "@/ktJS/API";
import { STATE } from "@/ktJS/STATE";
import { DATA } from "@/ktJS/DATA";
import { CACHE } from "@/ktJS/CACHE";

let areaList = ref([
  "第一制造部",
  "第二制造部",
  "第三制造部",
  "第四制造部",
  "第五制造部",
  "全部显示",
]);

const popupShow = reactive({
  第一制造部: false,
  第二制造部: false,
  第三制造部: false,
  第四制造部: false,
  第五制造部: false,
});
STATE.popupShow = popupShow;

const groupList = {};


watch(
  STATE.currentScene,
  (newVal) => {
    if (newVal === "main") {
      areaList.value = [
        "第一制造部",
        "第二制造部",
        "第三制造部",
        "第四制造部",
        "第五制造部",
        "全部显示",
      ];
    } else if (newVal === "2#") {
      areaList.value = ["第一制造部", "全部显示"];
    } else if (newVal === "17#") {
      areaList.value = ["第一制造部", "第二制造部", "第四制造部", "全部显示"];
    } else if (newVal === "5#") {
      areaList.value = ["第三制造部", "全部显示"];
    } else if (newVal === "3#") {
      areaList.value = ["第三制造部", "第五制造部", "全部显示"];
    }


    if (['2#', '17#', '5#', '3#'].includes(newVal)) {
      for (let key in popupShow) {
        const list = DATA.deviceMap.filter(e => {
          if (e.area === key) {
            const deviceP = { position: { x: e.position[0], z: e.position[2] } }
            return API.isDeviceAmongTheBuilding(deviceP, newVal)

          } else {
            return false
          }
        }).map((e) => e.group)

        groupList[key] = Array.from(new Set(list)).filter((e) => e);
      }
    }
  },
  { immediate: true }
);

function handleAreaBtn(item) {
  if (STATE.currentScene.value === "main") {
    for (let key in popupShow) {
      popupShow[key] = false;
    }
  } else {
    for (let key in popupShow) {
      popupShow[key] = key === item;
    }
  }

  if (item === "全部显示") {
    API.deviceReset();
  } else {
    API.handleArea(item);
  }

  window.parent.postMessage(
    {
      event: "deptClick",
      targetData: {
        Id: `点击事件 制造部 ${item}`,
      },
    },
    "*"
  );

  console.log(
    `deptClick-点击事件 制造部 ${item}`
  );
}

function handleGroup(item, group) {
  if (!["第一制造部", "第二制造部", "第三制造部", "第四制造部", "第五制造部"].includes(item)) return;

  const tempList = STATE.deviceList.children.filter(e => e.userData.area === item && e.userData.group === group)
  
  const list = tempList.filter(e => {
    return API.isDeviceAmongTheBuilding(e, STATE.currentScene.value)
  })
  

  window.parent.postMessage(
    {
      event: "teamClick",
      targetData: {
        Id: `点击事件 班组 ${item} ${group}`,
      },
    },
    "*"
  );

  console.log(
    `teamClick-点击事件 班组 ${item} ${group}`
  );

  if (!list.length) return;

  // 透明度
  STATE.deviceList.children.forEach((e) => {
    if (list.map(e2 => e2.userData.id).includes(e.userData.id)) {
      e.userData.circle.popup.material.opacity = 1;
      e.traverse((e2) => {
        if (e2.isMesh) {
          e2.material = e2.userData.material[0]
        }
      });
    } else {
      e.userData.circle.popup.material.opacity = 0.1;
      e.traverse((e2) => {
        if (e2.isMesh) {
          e2.material = e2.userData.material[1]
        }
      });
    }
  });

  // 挨个高亮  漫游轮播
  if (CACHE.groupRoamAnimate.length) {
    CACHE.groupRoamAnimate.forEach((e) => {
      clearTimeout(e);
    });
    CACHE.groupRoamAnimate = [];
  }

  list.sort((a, b) => {
    return a.position.x - b.position.x;
  });

  

  for (let i = 0; i < list.length; i++) {
    const timer = setTimeout(() => {
      const model = STATE.deviceList.children.find((e) => e.userData.id === list[i].userData.id);
      if (!model) return

      CACHE.container.outlineObjects = [];
      model.traverse((e) => {
        if (e.isMesh) {
          CACHE.container.outlineObjects.push(e);
        }
      });


      // 计算相机和目标的位置
      const target = { x: list[i].position.x, y: 0, z: list[i].position.z };
      const finalPosition = { x: 0, y: 0, z: 0 };
      finalPosition.x = list[i].position.x;
      finalPosition.y = 80;
      finalPosition.z = list[i].position.z + 170;

      const raycaster = new Bol3D.Raycaster();
      const origin = new Bol3D.Vector3(
        finalPosition.x,
        finalPosition.y,
        finalPosition.z
      );
      const direction = new Bol3D.Vector3(target.x, target.y, target.z)
        .sub(origin)
        .normalize();

      raycaster.set(origin, direction);
      const intersects = raycaster.intersectObjects(STATE.wallList);
      if (intersects.length) {
        if (intersects[0].distance < 300) {
          finalPosition.z -= 340;
        }
      }


      new Bol3D.TWEEN.Tween(CACHE.container.orbitCamera.position)
        .to(
          {
            x: finalPosition.x,
            y: finalPosition.y,
            z: finalPosition.z,
          },
          800
        )
        .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
        .start();

      new Bol3D.TWEEN.Tween(CACHE.container.orbitControls.target)
        .to(
          {
            x: target.x,
            y: target.y,
            z: target.z,
          },
          800
        )
        .easing(Bol3D.TWEEN.Easing.Quadratic.InOut)
        .start();

      API.mouseClick('device', model?.userData?.id || '', { point: model.position }, false)
    }, i * 3000);

    CACHE.groupRoamAnimate.push(timer);
  }
}

function back() {
  API.backToMainScene();
  for (let key in STATE.popupShow) {
    STATE.popupShow[key] = false;
  }
}

onMounted(() => { });
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
      color: #fff;
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
          border: 1px solid #ffffff55;
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
    color: #fff;
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
