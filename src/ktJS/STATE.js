import { API } from './API.js'
import { CACHE } from './CACHE.js'
import { ref } from 'vue'

const PUBLIC_PATH = './assets/3d'
const initialState = {
  position: { x: -2189.29, y: 1601.48, z: 2521.4699999999993 },
  target: { x: -921.59, y: 0, z: 879.28 }
}

const deviceModel = new Bol3D.Group()

// main 主场景
// 2# 17# 5# 3# 各楼
let currentScene = ref('main')

const deviceList = new Bol3D.Group()

let currentPopup = null

const wallList = []

const clock = new Bol3D.Clock()

const isEditMode = ref(false) // 是否在编辑模式
const isGroundPick = ref(false) // 是否展示所有设备 在进行选择

export const STATE = {
  initialState,
  currentScene,
  PUBLIC_PATH,
  deviceModel,
  currentPopup,
  wallList,
  clock,
  deviceList,
  isEditMode,
  isGroundPick
}
