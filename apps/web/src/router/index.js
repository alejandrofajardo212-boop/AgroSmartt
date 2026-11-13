import { Notify } from 'quasar';
import { createRouter, createWebHistory } from 'vue-router';
import { MODULES } from '../backend/models/modules';
import { canAccessModule } from '../backend/models/roles';
import { useAuthStore } from '../stores/auth';

/** Rutas dedicadas para las 4 pantallas del Trabajador / Operario */
const workerRoutes = [
  {
    path: 'actividades',
    name: 'activities',
    component: () => import('../pages/worker/ActivitiesPage.vue'),
    meta: { requiresAuth: true, moduleId: 'activities' }
  },
  {
    path: 'tareas',
    name: 'tasks',
    component: () => import('../pages/worker/TasksPage.vue'),
    meta: { requiresAuth: true, moduleId: 'tasks' }
  },
  {
    path: 'cosechas',
    name: 'harvests',
    component: () => import('../pages/worker/HarvestsPage.vue'),
    meta: { requiresAuth: true, moduleId: 'harvests' }
  },
  {
    path: 'novedades',
    name: 'news',
    component: () => import('../pages/worker/NewsPage.vue'),
    meta: { requiresAuth: true, moduleId: 'news' }
  }
];

/** Rutas genéricas para los demás módulos (excluyendo los 4 del Trabajador que ya tienen vista propia) */
const moduleRoutes = MODULES
  .filter((module) => !['activities', 'tasks', 'harvests', 'news'].includes(module.id))
  .map((module) => ({
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
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
        ...workerRoutes,
        ...moduleRoutes
      ]
    },
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
