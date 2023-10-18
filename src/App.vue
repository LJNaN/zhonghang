<script setup lang="ts">
import Scene from '@/views/Scene.vue'
</script>

<template>
  <div v-if="false"
    style="transform: scale(0.2);pointer-events: all; width: 2000px; height: 1000px; background: url('./assets/3d/img/1.png') center / 100% 100% no-repeat;">
    <p style="position: absolute;font-size: 6rem; color: #FFF;font-weight: bold;letter-spacing: 2rem;top: 10%;left: 50%;transform: translateX(-50%);">17#</p>
    <div style="position: absolute; display: flex;flex-direction: column; border: 10px solid red;height: 65%;width: 90%;left: 5%;bottom: 8%;">
      <div style="width: 100%;min-height: 20%;display: flex; justify-content: space-between;align-items: center;">
        <span style="font-weight: bold;font-size: 5rem;word-break: keep-all; letter-spacing: 0.5rem; color: #FFF; ">分类</span>
        <span style="font-size: 5rem;word-break: break-all;letter-spacing: 0.5rem; color: #FFF; ">三部 五部</span>
      </div>
    </div>
  </div>
  <Scene />
  <router-view></router-view>
</template>

<style scoped>
:global(#app) {
  width: 100vw;
  height: 100vh;
  background-color: #999;
  pointer-events: none;
}
</style>
