import { createRouter, createWebHashHistory } from 'vue-router'
import AiTest from '../views/AiTest.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/writing',
    name: 'Writing',
    component: () => import('../views/Writing.vue'),
    meta: { requiresNovel: true }
  },
  {
    path: '/chapters/:id',
    name: 'Chapters',
    component: () => import('../views/Chapters.vue')
  },
  {
    path: '/characters/:id?',
    name: 'Characters',
    component: () => import('../views/Characters.vue'),
    meta: { requiresNovel: true }
  },
  {
    path: '/outline/:id?',
    name: 'Outline',
    component: () => import('../views/Outline.vue'),
    meta: { requiresNovel: true }
  },
  {
    path: '/worldmap/:id?',
    name: 'WorldMap',
    component: () => import('../views/WorldMap.vue'),
    meta: { requiresNovel: true }
  },
  {
    path: '/ai-test',
    name: 'AiTest',
    component: AiTest
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：检查是否选择了小说
router.beforeEach((to, from, next) => {
  if (to.meta.requiresNovel) {
    const currentNovelId = localStorage.getItem('currentNovelId')
    if (!currentNovelId) {
      // 如果没有选择小说，跳转到首页
      next('/')
      return
    }
  }
  next()
})

export default router 