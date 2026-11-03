import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { guestOnly: true } },
    { path: '/registro', name: 'register', component: () => import('../pages/RegisterPage.vue'), meta: { guestOnly: true } },
    { path: '/', component: () => import('../layouts/MainLayout.vue'), meta: { requiresAuth: true }, children: [
      { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
      { path: 'terrenos', name: 'terrains', component: () => import('../pages/TerrainsPage.vue') },
      { path: 'cultivos', name: 'crops', component: () => import('../pages/CropsPage.vue') },
      { path: 'sensores', name: 'sensors', component: () => import('../pages/SensorsPage.vue') }
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' };
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'dashboard' };
});

export default router;
