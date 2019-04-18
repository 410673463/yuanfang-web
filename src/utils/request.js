import axios from 'axios'
import router from '../router/index.js'
import { Message } from 'element-ui'


export default function $axios(url, method, params) {
  return new Promise((resolve, reject) => {
    const instance = axios.create({
      baseURL: process.env.BASE_API,
      timeout: 10000 * 1,// 10s
      // transformRequest: [// // 对 请求参数 进行任意转换处理
      //   function(params) {
      //     return QS.stringify(params)
      //   }
      // ]
    })
    // 设置post请求头
    //instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
    // request 拦截器
    instance.interceptors.request.use(
      config => {
        const token = sessionStorage.getItem('AUTH-TOKEN')
        if (token) {
          config.headers.AuthorizationToken = token
        } else {
          // 重定向到登录页面
          router.replace({
            path: '/login',
            query: {
              redirect: router.currentRoute.fullPath
            }
          })
        }
        // 3. 根据请求方法，序列化传来的参数，根据后端需求是否序列化
        //if (config.method === 'post') {
        // if (config.data.__proto__ === FormData.prototype
        //   || config.url.endsWith('path')
        //   || config.url.endsWith('mark')
        //   || config.url.endsWith('patchs')
        // ) {

        // } else {
        // config.data = qs.stringify(config.data)
        // }
        // }
        return config
      },
      error => {
        // 请求错误时
        console.log('request:', error)
        // 1. 判断请求超时
        if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') !== -1) {
          console.log('timeout请求超时')
          // return service.request(originalRequest);// 再重复请求一次
        }
        // 2. 需要重定向到错误页面
        const errorInfo = error.response
        console.log(errorInfo)
        if (errorInfo) {
          error = errorInfo.data // 页面那边catch的时候就能拿到详细的错误信息,看最下边的Promise.reject
          const errorStatus = errorInfo.status // 404 403 500 ...
          router.push({
            path: `/error/${errorStatus}`
          })
        }
        return Promise.reject(error) // 在调用的那边可以拿到(catch)你想返回的错误信息
      }
    )

    // response 拦截器
    instance.interceptors.response.use(
      response => {
        let data
        // IE9时response.data是undefined，因此需要使用response.request.responseText(Stringify后的字符串)
        // eslint-disable-next-line eqeqeq
        if (response.data == undefined) {
          data = JSON.parse(response.request.responseText)
        } else {
          data = response.data
        }

        // 根据返回的code值来做不同的处理
        // switch (data.status) {
        //   case 1:
        //     console.log(data.desc)
        //     break
        //   case 0:
        //     // eslint-disable-next-line no-undef
        //     store.commit('changeState')
        //     // console.log('登录成功')
        //     break
        //   default:
        //     break
        // }
        // 若不是正确的返回code，且已经登录，就抛出错误
        // const err = new Error(data.desc)
        // err.data = data
        // err.response = response
        // throw err

        return data
      },
      err => {
        debugger
        console.log(err)
        if (err && err.response) {
          switch (err.response.status) {
            case 400:
              err.message = '请求错误'
              break
            case 401:
              err.message = '未授权，请登录'
              sessionStorage.removeItem('AUTH-TOKEN')
              router.replace({
                path: '/login',
                query: {
                  redirect: router.currentRoute.fullPath
                }
              })
              break
            case 403:
              err.message = '拒绝访问'
              break
            case 404:
              err.message = `请求地址出错: ${err.response.config.url}`
              break
            case 408:
              err.message = '请求超时'
              break
            case 500:
              err.message = '服务器内部错误'
              break
            case 501:
              err.message = '服务未实现'
              break
            case 502:
              err.message = '网关错误'
              break
            case 503:
              err.message = '服务不可用'
              break
            case 504:
              err.message = '网关超时'
              break
            case 505:
              err.message = 'HTTP版本不受支持'
              break
            default:
          }
          console.log(err)
        }else{
          Message.error('服务器出错')
          debugger
          sessionStorage.removeItem('AUTH-TOKEN')
          console.log(router)
          router.replace({
            path: '/login',
            query: {
              redirect: router.currentRoute.fullPath
            }
          })
        }
       
        return Promise.reject(err) // 返回接口返回的错误信息
      }
    )

    // 请求处理
    instance(url, method, params).then(res => {
      resolve(res)
    }).catch(error => {
      reject(error)
    })
  })
}
