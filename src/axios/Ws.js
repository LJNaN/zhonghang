export default class Ws {
  lockReconnect = false //是否真正建立连接
  timeoutNum = null //断开 重连倒计时
  websocket = null
  url = ""
  onMessage = null

  constructor(data) {
    if (data.url) this.url = data.url
    if (data.onMessage) this.onMessage = data.onMessage
    this.init()
  }

  init() {
    this.websocket = new WebSocket(this.url)

    // 客户端接收服务端数据时触发
    this.websocket.onmessage = this.websocketOnMessage.bind(this)

    // 连接建立时触发
    this.websocket.onopen = this.websocketOnOpen.bind(this)

    // 通信发生错误时触发
    this.websocket.onerror = this.websocketOnError.bind(this)

    // 连接关闭时触发
    this.websocket.onclose = this.websocketClose.bind(this)
  }

  //开启心跳
  start() {

  }


  //重新连接
  reconnect() {
    const this_ = this
    if (this_.lockReconnect) {
      return
    }

    this_.lockReconnect = true
    //没连接上会一直重连，设置延迟避免请求过多
    this_.timeoutNum && clearTimeout(this_.timeoutNum)

    this_.timeoutNum = setTimeout(function () {
      //新连接
      this_.init()
      this_.lockReconnect = false
    }, 5000)
  }

  // 连接建立时触发
  websocketOnOpen() {
    // //开启心跳
    // this.start()

    //连接建立之后执行send方法发送数据
    let actions = { "type": "deviceStatus" }
    this.websocketSend(JSON.stringify(actions))
  }

  // 通信发生错误时触发
  websocketOnError() {
    // this.reconnect()
  }

  // 客户端接收服务端数据时触发
  websocketOnMessage(e) {
    if (e.data) {
      this.onMessage && this.onMessage(JSON.parse(e.data))
    }
    // 收到服务器信息，心跳重置
    // this.reset()
  }

  websocketSend(Data) {
    //数据发送
    this.websocket.send(Data)
  }

  // 连接关闭时触发
  websocketClose(e) {
    //关闭

    //重连
    // this.reconnect()
  }


  //重置心跳
  reset() {
    //重启心跳
    // this.start()
  }
}