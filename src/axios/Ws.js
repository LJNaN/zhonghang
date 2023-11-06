export class Ws {
  lockReconnect = false //是否真正建立连接
  timeout = 58 * 1000 //58秒一次心跳
  timeoutObj = null //心跳心跳倒计时
  serverTimeoutObj = null //心跳倒计时
  timeoutNum = null //断开 重连倒计时

  constructor(url) {
    this.init(url)
  }

  init(url) {
    this.websocket = new WebSocket(url)

    // 客户端接收服务端数据时触发
    this.websocket.onmessage = this.websocketOnMessage

    // 连接建立时触发
    this.websocket.onopen = this.websocketOnOpen

    // 通信发生错误时触发
    this.websocket.onerror = this.websocketOnError

    // 连接关闭时触发
    this.websocket.onclose = this.websocketClose
  }

  // 连接建立时触发
  websocketOnOpen() {
    //开启心跳
    this.start()
    //连接建立之后执行send方法发送数据
    let actions = { "type": "deviceStatus" }
    this.websocketSend(JSON.stringify(actions))
  }

  // 通信发生错误时触发
  websocketOnError() {
    console.log("出现错误")
    this.reconnect()
  }

  // 客户端接收服务端数据时触发
  websocketOnMessage(e) {
    console.log(e.data)
    //收到服务器信息，心跳重置
    this.reset()
  }

  websocketSend(Data) {
    //数据发送
    this.websocket.send(Data)
  }

  // 连接关闭时触发
  websocketClose(e) {
    //关闭
    console.log("断开连接", e)
    //重连
    this.reconnect()
  }

  reconnect() {
    //重新连接
    var that = this
    if (that.lockReconnect) {
      return
    }

    that.lockReconnect = true
    //没连接上会一直重连，设置延迟避免请求过多
    that.timeoutNum && clearTimeout(that.timeoutNum)

    that.timeoutNum = setTimeout(function () {
      //新连接
      that.initWebSocket()
      that.lockReconnect = false
    }, 5000)
  }

  //重置心跳
  reset() {
    //清除时间
    clearTimeout(this.timeoutObj)
    clearTimeout(this.serverTimeoutObj)
    //重启心跳
    this.start()
  }

  //开启心跳
  start() {
    console.log("开启心跳")
    const this_ = this
    this_.timeoutObj && clearTimeout(this_.timeoutObj)
    this_.serverTimeoutObj && clearTimeout(this_.serverTimeoutObj)
    this_.timeoutObj = setTimeout(function () {
      //这里发送一个心跳，后端收到后，返回一个心跳消息，
      if (this_.ws.readyState == 1) {
        //如果连接正常
        // self.ws.send("heartCheck") //这里可以自己跟后端约定
      } else {
        //否则重连
        this_.reconnect()
      }
      this_.serverTimeoutObj = setTimeout(function () {
        //超时关闭
        this_.ws.close()
      }, this_.timeout)

    }, this_.timeout)
  }
}