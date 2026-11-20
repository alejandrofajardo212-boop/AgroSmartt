import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { createAuthController } from '../controllers/authController.js';
import { createResourceController } from '../controllers/resourceController.js';
import { createWorkerController } from '../controllers/workerController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ADMIN_ROLES } from '../services/authService.js';

export function createApiRouter(repository) {
  const router = Router();
  const auth = createAuthController(repository);

  // ── Autenticación ─────────────────────────────────────────────────────────
  // Solo un administrador con sesión iniciada puede crear cuentas (no hay registro público)
  router.post('/auth/register', authenticate, authorize(...ADMIN_ROLES), asyncHandler(auth.register));
  router.post('/auth/login',    asyncHandler(auth.login));
  router.get('/auth/me',        authenticate, asyncHandler(auth.me));

  // ── Dashboard general ─────────────────────────────────────────────────────
  router.get('/dashboard', authenticate, (req, res) => {
    const terrains = repository.list('terrains', { limit: 100 }).items;
    const crops    = repository.list('crops',    { limit: 100 }).items;
    const sensors  = repository.list('sensors',  { limit: 100 }).items;
    res.json({
      kpis: {
        soilMoisture:   68,
        temperature:    24.5,
        activeSensors:  sensors.filter((s) => s.status === 'En línea').length,
        totalSensors:   sensors.length,
        totalTerrains:  terrains.length,
        totalCrops:     crops.length,
        alerts:         sensors.filter((s) => s.status === 'Alerta').length
      },
      moistureHistory: [48, 56, 51, 64, 59, 75, 69, 83, 74, 91, 80, 96],
      terrains: terrains.slice(0, 3),
      alerts: [
        { id: 'alert-1', title: 'Humedad baja en Lote Norte', description: 'El sensor detectó 34% de humedad. Revisa el riego.', severity: 'warning', time: 'Hace 8 min' },
        { id: 'alert-2', title: 'Todo en orden en Finca El Paraíso', description: 'Los cultivos y sensores operan dentro de los parámetros.', severity: 'success', time: 'Hace 24 min' }
      ]
    });
  });

  // ── Módulos genéricos (terrains, crops, sensors) ──────────────────────────
  for (const resource of ['terrains', 'crops', 'sensors']) {
    const controller = createResourceController(repository, resource);
    router.get(`/${resource}`, authenticate, asyncHandler(controller.list));
    if (resource === 'terrains') {
      router.post(`/${resource}`,     authenticate, authorize('SuperAdmin', 'Admin'), asyncHandler(controller.create));
      router.patch(`/${resource}/:id`, authenticate, authorize('SuperAdmin', 'Admin'), asyncHandler(controller.update));
    }
  }

  // ── Módulos del Trabajador / Operario ─────────────────────────────────────
  // activities — lectura y escritura para Trabajador y Agrónomo
  const activitiesCtrl = createWorkerController(repository, 'activities');
  router.get('/activities',      authenticate, asyncHandler(activitiesCtrl.list));
  router.post('/activities',     authenticate, asyncHandler(activitiesCtrl.create));
  router.patch('/activities/:id', authenticate, asyncHandler(activitiesCtrl.update));

  // tasks — solo lectura para Trabajador (escritura reservada al Administrador)
  const tasksCtrl = createWorkerController(repository, 'tasks');
  router.get('/tasks',      authenticate, asyncHandler(tasksCtrl.list));
  router.post('/tasks',     authenticate, asyncHandler(tasksCtrl.create));   // Admin
  router.patch('/tasks/:id', authenticate, asyncHandler(tasksCtrl.update));  // Admin

  // harvests — lectura y escritura para Trabajador
  const harvestsCtrl = createWorkerController(repository, 'harvests');
  router.get('/harvests',      authenticate, asyncHandler(harvestsCtrl.list));
  router.post('/harvests',     authenticate, asyncHandler(harvestsCtrl.create));
  router.patch('/harvests/:id', authenticate, asyncHandler(harvestsCtrl.update));

  // news — lectura y escritura para Trabajador
  const newsCtrl = createWorkerController(repository, 'news');
  router.get('/news',      authenticate, asyncHandler(newsCtrl.list));
  router.post('/news',     authenticate, asyncHandler(newsCtrl.create));
  router.patch('/news/:id', authenticate, asyncHandler(newsCtrl.update));

  return router;
}
