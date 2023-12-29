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

    <Editor v-if="VUEDATA.showEditor"></Editor>

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
import Editor from '@/components/editor.vue'
import { VUEDATA } from "@/VUEDATA";

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


// 中文排序
const chineseNums = ["一", "二", "三", "四", "五", "六", "七", "八", "大", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十", "三十一", "三十二", "三十三", "三十四", "三十五", "三十六", "三十七", "三十八", "三十九", "四十", "四十一", "四十二", "四十三", "四十四", "四十五", "四十六", "四十七", "四十八", "四十九", "四十", "四十一", "四十二", "四十三", "四十四", "四十五", "四十六", "四十七", "四十八", "四十九", "五十", "五十一", "五十二", "五十三", "五十四", "五十五", "五十六", "五十七", "五十八", "五十九", "六十", "六十一", "六十二", "六十三", "六十四", "六十五", "六十六", "六十七", "六十八", "六十九", "七十", "七十一", "七十二", "七十三", "七十四", "七十五", "七十六", "七十七", "七十八", "七十九", "八十", "八十一", "八十二", "八十三", "八十四", "八十五", "八十六", "八十七", "八十八", "八十九", "九十", "九十一", "九十二", "九十三", "九十四", "九十五", "九十六", "九十七", "九十八", "九十九", "一百"]
const chineseRegexp = new RegExp('(?<=第).*(?=制造部)', 'g')
function chineseSort(a, b) {
  const aMatch = a.match(chineseRegexp)
  const bMatch = b.match(chineseRegexp)
  if (!aMatch || !bMatch) {
    return -1

  } else {
    const indexA = chineseNums.indexOf(aMatch[0])
    const indexB = chineseNums.indexOf(bMatch[0])
    return indexA - indexB
  }
}

watch(
  STATE.currentScene,
  (newVal) => {
    waitForDeviceListLoad()
    function waitForDeviceListLoad() {
      if (!STATE.deviceList.children.length) {
        setTimeout(() => {
          waitForDeviceListLoad()
        }, 500)
      } else {
        getSetAreaList()
      }
    }

    function getSetAreaList() {
      const setAreaList = []
      if (STATE.currentScene.value === 'main') {
        STATE.deviceList.children.forEach(e => {
          if (e.userData.area && !setAreaList.includes(e.userData.area)) {
            setAreaList.push(e.userData.area)
          }
        })

      } else {
        STATE.deviceList.children.forEach(e => {
          const isAmong = API.isDeviceAmongTheBuilding(e, newVal)
          if (isAmong) {
            if (e.userData.area && !setAreaList.includes(e.userData.area)) {
              setAreaList.push(e.userData.area)
            }
          }
        })
      }
      setAreaList.sort(chineseSort)
      setAreaList.push("全部显示")
      areaList.value = setAreaList


      if (['2#', '17#', '5#', '3#', '6#'].includes(newVal)) {
        for (let key in popupShow) {
          const list = DATA.deviceList.filter(e => {
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


// 点击班组 轮播
function handleGroup(item, group) {
  if (!["第一制造部", "第二制造部", "第三制造部", "第四制造部", "第五制造部"].includes(item)) return;

  const tempList = STATE.deviceList.children.filter(e => e.userData.area === item && e.userData.group === group)

  const list = tempList.filter(e => {
    return API.isDeviceAmongTheBuilding(e, STATE.currentScene.value)
  })

  popupShow[item] = false

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


  const listPart = []
  list.forEach(e => {
    let flag = false
    for (let i = 0; i < listPart.length; i++) {
      for (let j = 0; j < listPart[i].length; j++) {
        if (listPart[i][j].position.z > (e.position.z - 30) && listPart[i][j].position.z < (e.position.z + 30)) {
          listPart[i].push(e)
          flag = true
          break
        }
      }
    }
    if (!flag) {
      listPart.push([e])
    }
  })

  listPart.forEach(e => {
    e.sort((a, b) => {
      return a.position.x - b.position.x;
    });
  })

  const flatList = listPart.flat();

  for (let i = 0; i < flatList.length; i++) {
    const timer = setTimeout(() => {
      const model = STATE.deviceList.children.find((e) => e.userData.id === flatList[i].userData.id);
      if (!model) return

      CACHE.container.outlineObjects = [];
      model.traverse((e) => {
        if (e.isMesh) {
          CACHE.container.outlineObjects.push(e);
        }
      });


      // 计算相机和目标的位置
      const target = { x: flatList[i].position.x, y: 0, z: flatList[i].position.z };
      const finalPosition = { x: 0, y: 0, z: 0 };
      finalPosition.x = flatList[i].position.x;
      finalPosition.y = 80;
      finalPosition.z = flatList[i].position.z + 170;

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
