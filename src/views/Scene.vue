<script setup>
import { ref, onMounted } from "vue";
import { loadSceneByJSON } from "@/ktJS";

const sceneContainerRef = ref(null);

onMounted(() => {
  loadSceneByJSON({
    domElement: sceneContainerRef.value,
    callback: () => {
      //
    },
  });

});
</script>

<template>
  <div class="scene">
    <canvas ref="sceneContainerRef" class="sceneContainer"></canvas>
  </div>
</template>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  position: absolute;
}

canvas {
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1;
  position: absolute;
}
</style>
