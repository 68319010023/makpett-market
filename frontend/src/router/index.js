import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import Profile from '../views/ProfileView.vue'
import Menu from '../views/MenuView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
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