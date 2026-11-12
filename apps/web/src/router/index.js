import { Notify } from 'quasar';
import { createRouter, createWebHistory } from 'vue-router';
import { MODULES } from '../backend/models/modules';
import { canAccessModule } from '../backend/models/roles';
import { useAuthStore } from '../stores/auth';

const moduleRoutes = MODULES.map((module) => ({
  path: module.path.slice(1),
  name: module.id,
  component: module.id === 'farms'
    ? () => import('../pages/FarmsPage.vue')
    : () => import('../pages/ResourcePage.vue'),
  props: module.id === 'farms' ? undefined : { moduleId: module.id },
  meta: { requiresAuth: true, moduleId: module.id }
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { guestOnly: true } },
    { path: '/', component: () => import('../layouts/MainLayout.vue'), meta: { requiresAuth: true }, children: [
      { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
      ...moduleRoutes
    ] },
    { path: '/fincas', redirect: { name: 'farms' } },
    { path: '/registro', redirect: { name: 'login' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  auth.refreshSession();
  if (auth.authError) {
    Notify.create({ type: 'negative', message: auth.authError });
    auth.clearAuthError();
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' };
  if (to.meta.guestOnly && auth.isAuthenticated) {
    Notify.create({ type: 'warning', message: 'Ya hay una sesión activa. Cierra sesión para cambiar de cuenta o rol.' });
    return { name: 'dashboard' };
  }
  if (to.meta.moduleId && !canAccessModule(auth.user?.role, to.meta.moduleId)) {
    Notify.create({ type: 'negative', message: 'Tu rol no tiene permiso para acceder a este módulo.' });
    return { name: 'dashboard' };
  }
});

export default router;
