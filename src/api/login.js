import request from '@/utils/request'

export function loginByUsername(username, password) {
  const data = { account: username, password: password, captcha: '' }
  return request({
    url: '/signIn',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/login/logout',
    method: 'post'
  })
}

export function getUserInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}

