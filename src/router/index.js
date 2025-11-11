import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Editor from '../views/Editor.vue'
import Settings from '../views/Settings.vue'
import TemplateFiller from '../views/TemplateFiller.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '主页' }
  },
  {
    path: '/editor',
    name: 'Editor',
    component: Editor,
    meta: { title: '编辑器' }
  },
  {
    path: '/editor/:projectId',
    name: 'EditorWithProject',
    component: Editor,
    meta: { title: '编辑器' }
  },
  {
    path: '/filler',
    name: 'TemplateFiller',
    component: TemplateFiller,
    meta: { title: '模板填充' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '设置' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 模板占位符编辑器` : '模板占位符编辑器'
  next()
})

export default router
