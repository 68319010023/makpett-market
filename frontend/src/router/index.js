import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import ForgotPassword from '../views/ForgotPasswordView.vue'
import ResetPassword from '../views/ResetPasswordView.vue'
import Profile from '../views/ProfileView.vue'
import Menu from '../views/MenuView.vue'
import VerifyNotice from '../views/VerifyNoticeView.vue'
import VerifyEmail from '../views/VerifyEmailView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPassword },
  { path: '/reset-password', name: 'reset-password', component: ResetPassword },
  { path: '/verify-notice', name: 'verify-notice', component: VerifyNotice },
  { path: '/verify-email', name: 'verify-email', component: VerifyEmail },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: '/menu',
    name: 'menu',
    component: Menu,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = sessionStorage.getItem('access_token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
})

export default router