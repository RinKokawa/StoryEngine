import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/writing',
    name: 'Writing',
    component: () => import('../views/Writing.vue')
  },
  {
    path: '/characters',
    name: 'Characters',
    component: () => import('../views/Characters.vue')
  },
  {
    path: '/outline',
    name: 'Outline',
    component: () => import('../views/Outline.vue')
  },
  {
    path: '/worldmap',
    name: 'WorldMap',
    component: () => import('../views/WorldMap.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 