import { createRouter, createWebHistory } from 'vue-router'
import Editor from '../views/Editor.vue'

const routes = [
  {
    path: '/',
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
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 模板占位符编辑器` : '模板占位符编辑器'
  next()
})

export default router
