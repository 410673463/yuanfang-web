import Vue from 'vue'
import Router from 'vue-router'
import store from '../store/index'
import { findNavTree } from '../api/menu'
import { findPermissions } from '../api/user'
Vue.use(Router)

/* Layout */
import Layout from '@/views/layout/Layout'
// sys
import sys from './sys/sys'
/* Router Modules */

/** note: sub-menu only appear when children.length>=1
 *  detail see  https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 **/

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirect in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
    roles: ['admin','editor']    will control the page roles (you can set multiple roles)
    title: 'title'               the name show in sub-menu and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar
    noCache: true                if true, the page will no be cached(default is false)
    breadcrumb: false            if false, the item will hidden in breadcrumb(default is true)
    affix: true                  if true, the tag will affix in the tags-view
  }
**/
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/authredirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/errorPage/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/errorPage/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: 'dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'dashboard', icon: 'dashboard', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/error',
    component: Layout,
    redirect: 'noredirect',
    name: 'ErrorPages',
    meta: {
      title: 'errorPages',
      icon: '404'
    },
    children: [
      {
        path: '401',
        component: () => import('@/views/errorPage/401'),
        name: 'Page401',
        meta: { title: 'page401', noCache: true }
      },
      {
        path: '404',
        component: () => import('@/views/errorPage/404'),
        name: 'Page404',
        meta: { title: 'page404', noCache: true }
      }
    ]
  },
]

export const asyncRoutes = []

const router = new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})



router.beforeEach((to, from, next) => {
  // 登录界面登录成功之后，会把用户信息保存在会话
  // 存在时间为会话生命周期，页面关闭即失效。
  let token = sessionStorage.getItem('AUTH-TOKEN')
  if (to.path === '/login') {
    // 如果是访问登录界面，如果用户会话信息存在，代表已登录过，跳转到主页
    if (token) {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (!token) {
      // 如果访问非登录界面，且户会话信息不存在，代表未登录，则跳转到登录界面
      next({ path: '/login' })
    } else {
      // 加载动态菜单和路由
      addDynamicMenuAndRoutes(to, from)
      next()
    }
  }
})
/**
* 加载动态菜单和路由
*/
function addDynamicMenuAndRoutes(to, from) {
  if (store.state.app.menuRouteLoaded) {
    console.log('动态菜单和路由已经存在.')
    return
  }
  findNavTree()
    .then(res => {
      // 添加动态路由
      let dynamicRoutes = addDynamicRoutes(res.data)
      //dynamicRoutes.push(sys)
      router.addRoutes(dynamicRoutes)
      store.commit('SET_ROUTES', dynamicRoutes)
      // 保存加载状态
      store.commit('menuRouteLoaded', true)
      // 保存菜单树
      store.commit('setNavTree', res.data)
    }).then(res => {
      findPermissions().then(res => {
        // 保存用户权限标识集合
        console.log('用户按钮权限标识')
        console.log(res)
        store.commit('SET_PERMS', res.data)
      })
    }).catch(function (res) {
      console.log(res)
    })
}
/**
* 添加动态(菜单)路由
* @param {*} menuList 菜单列表
* @param {*} routes 递归创建的动态(菜单)路由
*/
function addDynamicRoutes(menuList = [], routes = []) {
  var temp = []
  var route
  for (var i = 0; i < menuList.length; i++) {
    if (menuList[i].children && menuList[i].children.length >= 1) {
      temp = temp.concat(menuList[i].children)
      route = {
        path: menuList[i].url,
        component: Layout,
        name: menuList[i].name,
        children: [],
        meta: {
          title: menuList[i].name,
          icon: menuList[i].icon,
          index: menuList[i].id
        }
      }
      routes.push(route)
    } else if (menuList[i].url && /\S/.test(menuList[i].url)) {
      menuList[i].url = menuList[i].url.replace(/^\//, '')
      // 创建路由配置
      route = {
        path: menuList[i].url,
        component: null,
        name: menuList[i].name,
        children: [],
        meta: {
          title: menuList[i].name,
          icon: menuList[i].icon,
          index: menuList[i].id
        }
      }
      try {
        // 根据菜单URL动态加载vue组件，这里要求vue组件须按照url路径存储
        // 如url="sys/user"，则组件路径应是"@/views/sys/user.vue",否则组件加载不到
        let array = menuList[i].url.split('/')
        let url = ''
        for (let i = 0; i < array.length; i++) {
          url += array[i].substring(0, 1).toUpperCase() + array[i].substring(1) + '/'
        }
        url = url.substring(0, url.length - 1)
        route['component'] = resolve => require([`@/views/modules/${url}`], resolve)
      } catch (e) { console.log(e) }
      routes[0].children.push(route)
    }
  }
  if (temp.length >= 1) {
    addDynamicRoutes(temp, routes)
  } else {
    console.log('动态路由加载...')
    console.log(routes)
    console.log('动态路由加载完成.')
  }
  return routes
}



export default router 