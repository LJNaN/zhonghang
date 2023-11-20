const deviceMap = window.deviceMap
const deviceIdTypeMap = window.deviceIdTypeMap

const stateColorMap = [
  { name: '报警', state: '1', color: '#FF4D4F', url: '2' },
  { name: '运行', state: '2', color: '#73D13D', url: '3' },
  { name: '待机', state: '3', color: '#FFC53D', url: '4' },
  { name: '离线', state: '4', color: '#595959', url: '5' },
  { name: '调试', state: '5', color: '#40A9FF', url: '6' },
]

const buildingArea = [
  { name: '3#', value: { x1: 920, x2: 1985, z1: -1115, z2: 350 } },
  { name: '2#', value: { x1: -350, x2: 550, z1: -1420, z2: -485 } },
  { name: '17#', value: { x1: -2415, x2: -745, z1: -1155, z2: 295 } },
  { name: '5#', value: { x1: -900, x2: -270, z1: 2035, z2: 2475 } },
]


export const DATA = {
  deviceMap,
  deviceIdTypeMap,
  stateColorMap,
  buildingArea
}