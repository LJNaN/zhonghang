import { API } from './API.js'
import { CACHE } from './CACHE.js'
import { ref } from 'vue'

const PUBLIC_PATH = './assets/3d'
const initialState = {
  position: { x: -2189.29, y: 1601.48, z: 2521.4699999999993 },
  target: { x: -921.59, y: 0, z: 879.28 }
}

// main 主场景
// 1# 2# 3# 4# 各楼
let currentScene = ref('main')


export const STATE = {
  initialState,
  currentScene,
  PUBLIC_PATH
}
