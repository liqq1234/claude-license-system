import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/activation-codes',
    name: 'ActivationCodes',
    component: () => import('../views/ActivationCodes.vue')
  },
  {
    path: '/claude-manager',
    name: 'ClaudeManager',
    component: () => import('../views/ClaudeManager.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
