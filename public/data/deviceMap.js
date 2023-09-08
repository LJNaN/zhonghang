const deviceMap = [{
  id: '6102060031',
  position: [1580, 0, -820],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060006',
  position: [1500, 0, -820],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060033',
  position: [1385, 0, -805],
  rotate: [0, 0, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: 's7-200smart',
  position: [1305, 0, -820],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6102060023',
  position: [1585, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060002',
  position: [1529, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060001',
  position: [1473, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060004',
  position: [1417, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060005',
  position: [1361, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102060003',
  position: [1305, 0, -615],
  rotate: [0, Math.PI / 4, 0],
  area: '第五制造部',
  group: "螺钉班"
}, {
  id: '6102030008',
  position: [1495, 0, -515],
  rotate: [0, Math.PI, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6102030009',
  position: [1428, 0, -515],
  rotate: [0, Math.PI, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6102030011',
  position: [1360, 0, -515],
  rotate: [0, Math.PI, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6107010005',
  position: [1330, 0, -515],
  rotate: [0, 0, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6102070008',
  position: [1300, 0, -545],
  rotate: [0, 0, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6107010008',
  position: [1300, 0, -520],
  rotate: [0, 0, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6107010001',
  position: [1320, 0, -495],
  rotate: [0, 0, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6102020003',
  position: [1600, 0, -400],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: "滚挤钳班"
}, {
  id: '6101050004',
  position: [1574, 0, -400],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: "机加班"
}, {
  id: '6101050005',
  position: [1548, 0, -400],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: "机加班"
}, {
  id: '6101050033',
  position: [1522, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050034',
  position: [1496, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050012',
  position: [1470, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050013',
  position: [1444, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050018',
  position: [1418, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050019',
  position: [1392, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050123',
  position: [1366, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}, {
  id: '6101050122',
  position: [1340, 0, -415],
  rotate: [0, Math.PI / 2, 0],
  area: '第五制造部',
  group: ""
}]

const deviceIdTypeMap = [{
  type: 15,
  modelName: '6102060031',
  id: ['6102060031'],
  scale: 400
}, {
  type: 16,
  modelName: '6102060006',
  id: ['6102060006'],
  scale: 400
}, {
  type: 17,
  modelName: '6102060033',
  id: ['6102060033'],
  scale: 400
}, {
  type: 18,
  modelName: 's7-200smart',
  id: ['s7-200smart'],
  scale: 400
}, {
  type: 19,
  modelName: '6102060023',
  id: ['6102060023'],
  scale: 400
}, {
  type: 20,
  modelName: '6102060002',
  id: ['6102060002', '6102060001', '6102060004', '6102060005', '6102060003'],
  scale: 400
}, {
  type: 21,
  modelName: '6102030008',
  id: ['6102030008', '6102030009', '6102030011'],
  scale: 400
}, {
  type: 26,
  modelName: '6107010005',
  id: ['6107010005', '6107010008'],
  scale: 400
}, {
  type: 27,
  modelName: '6107010001',
  id: ['6107010001'],
  scale: 400
}, {
  type: 24,
  modelName: '6102020003',
  id: ['6102020003'],
  scale: 400
}, {
  type: 25,
  modelName: '6101050004',
  id: ['6101050004', '6101050005'],
  scale: 400
// }, {
//   type: 12,
//   modelName: '6102060033',
//   id: ['6101030033', '6101030034','6101050123', '6101050122'],
//   scale: 400
}, {
  type: 22,
  modelName: '6101050012',
  id: ['6101050012', '6101050013'],
  scale: 400
// }, {
//   type: 23,
//   modelName: '6101030018',
//   id: ['6101030018', '6101030019'],
//   scale: 400
}]

window.deviceMap = deviceMap
window.deviceIdTypeMap = deviceIdTypeMap