import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/story-editor'
  },
  {
    path: '/story-editor',
    name: 'StoryEditor',
    component: () => import('../views/StoryEditor.vue')
  },
  {
    path: '/character-management',
    name: 'CharacterManagement',
    component: () => import('../views/CharacterManagement.vue')
  },
  {
    path: '/outline-management',
    name: 'OutlineManagement',
    component: () => import('../views/OutlineManagement.vue')
  },
  {
    path: '/world-building',
    name: 'WorldBuilding',
    component: () => import('../views/WorldBuilding.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router