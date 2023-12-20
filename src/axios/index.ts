import axios from 'axios'
import { showMessage } from './status' // 引入状态码文件
import { ElMessage } from 'element-plus' // 引入el 提示框，这个项目里用什么组件库这里引什么
import { VUEDATA } from '@/VUEDATA.js'

// 设置接口超时时间
const env = import.meta.env
axios.defaults.timeout = 60000
axios.defaults.baseURL = ''
const BASE_URL = ""

//http request 拦截器
axios.interceptors.request.use(
  (config) => {
    if (config.url.includes('/twin/getCollectData')) {
      config.headers = {
        'Blade-Auth': VUEDATA.token
      }

    } else if (config.url.includes('/blade-auth/oauth/token')) {
      config.headers = {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Basic c2FiZXI6c2FiZXJfc2VjcmV0'
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

//http response 拦截器
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    if (response) {
      // 请求已发出，但是不在2xx的范围
      showMessage(response.status) // 传入响应码，匹配响应码对应信息
      return Promise.reject(response.data)
    } else {
      ElMessage.warning('网络连接异常,请稍后再试!')
    }
  }
)

// 封装 GET POST 请求并导出
export function request(url = '', params = {}, type = 'GET') {
  //设置 url params type 的默认值
  return new Promise((resolve, reject) => {
    let promise
    if (type.toUpperCase() === 'GET') {
      promise = axios({
        baseURL: BASE_URL,
        url,
        params
      })
    } else if (type.toUpperCase() === 'POST') {
      promise = axios({
        method: 'POST',
        baseURL: BASE_URL,
        url,
        data: params
      })
    }
    //处理返回
    promise
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
