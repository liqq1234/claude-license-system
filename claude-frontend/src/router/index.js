import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由组件懒加载
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const Profile = () => import('@/views/Profile.vue')
const ActivationCode = () => import('@/views/activation/ActivationCode.vue')
const AccountStatusTest = () => import('@/views/AccountStatusTest.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresGuest: true,
      title: '用户登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      requiresGuest: true,
      title: '用户注册'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      requiresGuest: true,
      title: '找回密码'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: 'Claude 国内 - 账号管理'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: true,
      title: '个人资料'
    }
  },
  {
    path: '/activation',
    name: 'ActivationCode',
    component: ActivationCode,
    meta: {
      requiresAuth: true,
      title: '激活码管理'
    }
  },
  {
    path: '/claude-manager',
    name: 'ClaudeManager',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: 'Claude 账号管理'
    }
  },
  {
    path: '/account-status-test',
    name: 'AccountStatusTest',
    component: AccountStatusTest,
    meta: {
      requiresAuth: true,
      title: '账户状态管理'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 检查认证状态
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，跳转到登录页
      next('/login')
      return
    }

    // 已登录，验证token是否有效
    try {
      const isValid = await authStore.verifyToken()
      if (!isValid) {
        // token无效，清除状态并跳转到登录页
        await authStore.logout(false) // 不显示退出消息
        next('/login')
        return
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      await authStore.logout(false)
      next('/login')
      return
    }
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 已登录用户访问登录/注册页，跳转到仪表板
    next('/dashboard')
    return
  }

  next()
})

export default router
