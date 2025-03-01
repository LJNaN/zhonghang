import { request } from './index'

// example
export function getRealData(params: {}) {
  return request('/GetRealData', params, 'post')
}

export function getToken() {
  const data = {
    tenantId: "000000",
    username: "SJLS",
    password: "123456",
    grant_type: "password",
    scope: "all"
  }
  return request("/api/blade-auth/oauth/token", data, "POST")
}

// 设备弹窗信息
export function getCollectData(deviceId = '') {
  return request(`/api/twin/getCollectData/${deviceId}`)
}