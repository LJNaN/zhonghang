import { API } from './API.js'
import { CACHE } from './CACHE.js'
import { STATE } from './STATE.js'
import { DATA } from './DATA.js'

let container

// 通过配置文件加载
export const loadSceneByJSON = ({ domElement, callback }) => {
  fetch(`${STATE.PUBLIC_PATH}/editor/bol3d.json`) // 配置文件路径
    .then((res) => {
      return res.json()
    })
    .then((result) => {
      const nodeData = result.data
      const fileList = result.fileList

      container = new Bol3D.Container({
        publicPath: STATE.PUBLIC_PATH,
        container: domElement,
        loadingBar: {
          show: true,
          type: 10
        }
      })

      const jsonParser = new Bol3D.JSONParser({
        container,
        modelUrls: fileList,
        publicPath: `${STATE.PUBLIC_PATH}/editor/`  // 节点解析，资源文件路径（包含hdr，天空盒，图片等）
      })
      CACHE.jsonParser = jsonParser
      jsonParser.parseNodes(nodeData, jsonParser.nodes) // 解析节点, jsonParser.nodes存储了配置文件导出的所有节点信息
      container.loadModelsByUrl({
        // prefix: '',  // 路径前缀， 模型地址最终为 `${STATE.PUBLIC_PATH}/editor/${prefix}/fileName`
        modelUrls: jsonParser.modelUrls,
        onProgress: (model, evt) => {
          // 
        },
        onLoad: (evt) => {
          // 
          CACHE.container = evt
          window.STATE = STATE
          window.CACHE = CACHE
          window.container = evt

          /**
           *  根据jsonParser.nodes中的节点更新3D场景，注意，调用该方法会覆盖onProgress中的模型编辑操作
           *  因此，想要在代码中二次编辑模型，需在该方法调用之后再调用
           */

          // 处理编辑器中的克隆模型
          if (jsonParser.clones) {
            for (const key in jsonParser.clones) {
              const jClone = jsonParser.clones[key]

              const name = jClone.name
              const index = jClone.index
              const count = jClone.count

              let model = null,
                animations = null

              // clone model
              evt.sceneModels.forEach((sModel) => {
                if (sModel.userData.fileName === name) model = sModel
              })

              // clone animations ---- todo
              evt.handleClone({
                model,
                animations,
                name,
                index,
                count
              })
            }
          }

          evt.updateSceneByNodes(jsonParser.nodes[0], 0, () => {
            // update clickObjects
            evt.scene.children.forEach((sModel) => {
              // model pickable update
              // if (sModel.userData.fileName && sModel.userData.fileName !== '' && sModel.visible) {
              //   API.setPickable(sModel, evt)
              // }
              // elements pickable update ---- todo

              if (sModel.userData.type === 'TagGroup') {
                sModel.children.forEach(e => {
                  const title = e.opts.title
                  e.children.forEach(e2 => {
                    e2.userData.title = title
                    evt.clickObjects.push(e2)
                  })
                })

              } else if (sModel.name === 'waijing') {
                sModel.traverse(e => {
                  if (['3dlcf_1', '3dlcf_3', '124cf_1', '124cf_3', '1cdlcj_1', '1cdlcj_3', '35cf_1', '35cf_3'].includes(e.name)) {
                    evt.clickObjects.push(e)

                  } else if (['1dulidiban', 'sanbudiban', 'wuchangdiban', '3dulidiban', 'yichangdiban', 'sichangdiban', 'erchangdiban'].includes(e.name)) {// 围墙
                    STATE.wallList.push(e)
                    if (e.name === 'sanbudiban') {
                      e.name = 'sanchangdiban'
                    }
                    e.material.side = 2
                    e.visible = false
                    e.renderOrder = 0
                    const wall = new API.WallLine(e)
                    wall.name = e.name
                  }
                })
              }
            })

            // 给标签加辉光
            const iconArr = CACHE.container.scene.children.find(e => e.children?.[0]?.isCompositeIcon)
            if (iconArr) {
              iconArr.traverse(e => {
                if (e.isMesh) {
                  CACHE.container.addBloom(e)
                }
              })
            }

            CACHE.container.bloomPass.radius = 0.4
            CACHE.container.bloomPass.strength = 0.5


            // 给控制器加 change 时间
            container.orbitControls.addEventListener('start', (() => {
              // 清除轮播
              if (CACHE.groupRoamAnimate.length) {
                CACHE.groupRoamAnimate.forEach(e => {
                  clearTimeout(e)
                })
                CACHE.groupRoamAnimate = []
              }
            }))


            API.initModels()
            API.initDevices()
            API.getData()
            window.STATE = STATE
            window.DATA = DATA
            window.CACHE = CACHE


            API.testBox()
            CACHE.container.loadingBar.style.visibility = 'hidden'
          })

          /**
          * updateSceneByNodes(node, duration, callback)
          * @node: jsonParser解析后的节点
          * @duration: 相机过渡动画执行时间，默认为0不执行
          * @callback: 更新完成回调
          */
          // evt.updateSceneByNodes(jsonParser.nodes[0] , 800 , () => {
          //   
          // })
        }
      })

      /**
       * 出于性能考虑，container中的clickObjects不再自动添加，需要在加载模型时手动添加，注意！！！
       */
      const events = new Bol3D.Events(container)

      events.onclick = (e) => {
        if (!e.objects.length) {
          return
        }

        let obj = null
        let objIndex = 0
        for (let i = 0; i < e.objects.length; i++) {
          if (e.objects[i].object.visible) {
            obj = e.objects[i].object
            objIndex = i
            break
          }
        }
        if (!obj) return


        // 单击不同楼
        if (STATE.currentScene.value === 'main') {
          if (['2#', '17#', '5#', '3#'].includes(obj.userData.title)) {
            API.mouseClick('building', obj.userData.title, e.objects[objIndex])

          } else if (obj.name === '3dlcf_1' || obj.name === '3dlcf_3') {
            API.mouseClick('building', '2#', e.objects[objIndex])

          } else if (obj.name === '124cf_1' || obj.name === '124cf_3') {
            API.mouseClick('building', '17#', e.objects[objIndex])

          } else if (obj.name === '1cdlcj_1' || obj.name === '1cdlcj_3') {
            API.mouseClick('building', '5#', e.objects[objIndex])

          } else if (obj.name === '35cf_1' || obj.name === '35cf_3') {
            API.mouseClick('building', '3#', e.objects[objIndex])
          }

        } else {
          if (obj.userData.type === 'device') {
            API.mouseClick('device', obj.userData.id, e.objects[objIndex])
          }
        }
      }

      events.ondblclick = (e) => {
        // 左键双击
        if (e.event.button === 0) {
          if (!e.objects.length) {
            return
          }

          let obj = null
          for (let i = 0; i < e.objects.length; i++) {
            if (e.objects[i].object.visible) {
              obj = e.objects[i].object
              break
            }
          }
          
          if (!obj) return


          // 进入不同楼
          if (STATE.currentScene.value === 'main') {
            if (['2#', '17#', '5#', '3#'].includes(obj.userData.title)) {
              API.enterBuilding(obj.userData.title)

            } else if (obj.name === '3dlcf_1' || obj.name === '3dlcf_3') {
              API.enterBuilding('2#')

            } else if (obj.name === '124cf_1' || obj.name === '124cf_3') {
              API.enterBuilding('17#')

            } else if (obj.name === '1cdlcj_1' || obj.name === '1cdlcj_3') {
              API.enterBuilding('5#')

            } else if (obj.name === '35cf_1' || obj.name === '35cf_3') {
              API.enterBuilding('3#')
            }

          }


          // 右键双击
        }
        // else if (e.event.button === 2) {
        //   API.backToMainScene()
        //   for (let key in STATE.popupShow) {
        //     STATE.popupShow[key] = false
        //   }
        // }
      }



      events.onhover = (e) => {
        if (!e.objects.length) {
          return
        }

        let obj = null
        for (let i = 0; i < e.objects.length; i++) {
          if (e.objects[i].object.visible) {
            obj = e.objects[i].object
            break
          }
        }
        if (!obj) return


        if (obj.userData.type === 'device') {
          const modelMap = DATA.deviceMap.find(e2 => e2.id === obj.userData.id)
          const model = STATE.deviceList.children.find(e2 => e2.userData.id === obj.userData.id)
          if (modelMap && model) {
            CACHE.container.outlineObjects = []
            model.traverse(e2 => {
              if (e2.isMesh) {
                CACHE.container.outlineObjects.push(e2)
              }
            })
          }
        }
      }
    })
}
