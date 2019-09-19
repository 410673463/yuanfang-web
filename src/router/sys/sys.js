/* Layout */
import Layout from '@/views/layout/Layout'

const sysRouters = {
  path: '/system',
  component: Layout,
  alwaysShow: true, // will always show the root menu
  meta: { title: '系统设置', icon: 'fa fa-cogs' },
  children: [
    {
      path: 'menu',
      component: () => import('@/views/modules/System/Menu'),
      name: 'Menus',
      meta: { title: '菜单管理', icon: 'fa fa-bars' }
    },
    {
      path: 'dept',
      component: () => import('@/views/modules/System/Dept'),
      name: 'Dept',
      meta: { title: '机构管理', icon: 'fa fa-building' }
    },
    {
      path: 'user',
      component: () => import('@/views/modules/System/User'),
      name: 'user',
      meta: { title: '账号管理', icon: 'fa fa-users' }
    },
    {
      path: 'role',
      component: () => import('@/views/modules/System/Role'),
      name: 'role',
      meta: { title: '角色管理', icon: 'fa fa-user-secret' }
    }
  ]

}
export default sysRouters
