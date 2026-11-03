import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { createAuthController } from '../controllers/authController.js';
import { createResourceController } from '../controllers/resourceController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createApiRouter(repository) {
  const router = Router();
  const auth = createAuthController(repository);

  router.post('/auth/register', asyncHandler(auth.register));
  router.post('/auth/login', asyncHandler(auth.login));
  router.get('/auth/me', authenticate, asyncHandler(auth.me));

  router.get('/dashboard', authenticate, (req, res) => {
    const terrains = repository.list('terrains', { limit: 100 }).items;
    const crops = repository.list('crops', { limit: 100 }).items;
    const sensors = repository.list('sensors', { limit: 100 }).items;
    res.json({
      kpis: {
        soilMoisture: 68,
        temperature: 24.5,
        activeSensors: sensors.filter((sensor) => sensor.status === 'En línea').length,
        totalSensors: sensors.length,
        totalTerrains: terrains.length,
        totalCrops: crops.length,
        alerts: sensors.filter((sensor) => sensor.status === 'Alerta').length
      },
      moistureHistory: [48, 56, 51, 64, 59, 75, 69, 83, 74, 91, 80, 96],
      terrains: terrains.slice(0, 3),
      alerts: [
        { id: 'alert-1', title: 'Humedad baja en Lote Norte', description: 'El sensor detectó 34% de humedad. Revisa el riego.', severity: 'warning', time: 'Hace 8 min' },
        { id: 'alert-2', title: 'Todo en orden en Finca El Paraíso', description: 'Los cultivos y sensores operan dentro de los parámetros.', severity: 'success', time: 'Hace 24 min' }
      ]
    });
  });

  for (const resource of ['terrains', 'crops', 'sensors']) {
    const controller = createResourceController(repository, resource);
    router.get(`/${resource}`, authenticate, asyncHandler(controller.list));
    if (resource === 'terrains') {
      router.post(`/${resource}`, authenticate, authorize('SuperAdmin', 'Admin'), asyncHandler(controller.create));
      router.patch(`/${resource}/:id`, authenticate, authorize('SuperAdmin', 'Admin'), asyncHandler(controller.update));
    }
  }

  return router;
}
