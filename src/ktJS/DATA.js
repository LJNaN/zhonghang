const deviceMap = window.deviceMap
const deviceIdTypeMap = window.deviceIdTypeMap

const stateColorMap = [
  { name: '报警', state: '1', color: '#FF4D4F', url: '2' },
  { name: '运行', state: '2', color: '#73D13D', url: '3' },
  { name: '待机', state: '3', color: '#FFC53D', url: '4' },
  { name: '离线', state: '4', color: '#595959', url: '5' },
  { name: '调试', state: '5', color: '#40A9FF', url: '6' },
]


export const DATA = {
  deviceMap,
  deviceIdTypeMap,
  stateColorMap
}