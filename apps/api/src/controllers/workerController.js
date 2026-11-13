import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../utils/httpError.js';

/** Schemas de validación por colección */
const schemas = {
  activities: z.object({
    title:      z.string().trim().min(2).max(120),
    farmId:     z.string().trim().min(1),
    assignedTo: z.string().trim().min(2).max(80),
    date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    status:     z.enum(['Pendiente', 'En progreso', 'Completada'])
  }),
  tasks: z.object({
    title:      z.string().trim().min(2).max(120),
    farmId:     z.string().trim().min(1),
    assignedTo: z.string().trim().min(2).max(80),
    dueDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    priority:   z.enum(['Baja', 'Media', 'Alta']),
    status:     z.enum(['Pendiente', 'En progreso', 'Completada']).optional().default('Pendiente')
  }),
  harvests: z.object({
    crop:       z.string().trim().min(2).max(80),
    farmId:     z.string().trim().min(1),
    date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    quantityKg: z.number().positive().max(1_000_000),
    quality:    z.enum(['Primera', 'Segunda', 'Tercera'])
  }),
  news: z.object({
    title:       z.string().trim().min(2).max(160),
    farmId:      z.string().trim().min(1),
    reportedBy:  z.string().trim().min(2).max(80),
    date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    description: z.string().trim().min(5).max(2000)
  })
};

/** Roles con acceso de escritura por colección */
const WRITE_ACCESS = {
  activities: ['Administrador', 'Trabajador / Operario', 'Ingeniero agrónomo / Técnico'],
  tasks:      ['Administrador'],                           // Trabajador solo lee
  harvests:   ['Administrador', 'Trabajador / Operario'],
  news:       ['Administrador', 'Trabajador / Operario']
};

/** Roles con acceso de lectura por colección */
const READ_ACCESS = {
  activities: ['Administrador', 'Trabajador / Operario', 'Ingeniero agrónomo / Técnico'],
  tasks:      ['Administrador', 'Trabajador / Operario'],
  harvests:   ['Administrador', 'Trabajador / Operario'],
  news:       ['Administrador', 'Trabajador / Operario']
};

export function createWorkerController(repository, collection) {
  if (!schemas[collection]) throw new Error(`Colección "${collection}" no soportada en workerController.`);

  return {
    /** GET /{collection} — listar con paginación */
    list: (req, res) => {
      const userRole = req.user?.role;
      if (!READ_ACCESS[collection]?.includes(userRole)) {
        throw new HttpError(403, 'No tienes permiso para ver este módulo.');
      }
      const page  = Math.max(1, Number(req.query.page)  || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const { items, pagination } = repository.list(collection, { page, limit });
      res.json({ items, pagination });
    },

    /** POST /{collection} — crear */
    create: async (req, res) => {
      const userRole = req.user?.role;
      if (!WRITE_ACCESS[collection]?.includes(userRole)) {
        throw new HttpError(403, 'No tienes permiso para registrar en este módulo.');
      }
      const body = schemas[collection].parse(req.body);
      const item = await repository.insert(collection, {
        id: randomUUID(),
        ...body,
        createdAt: new Date().toISOString()
      });
      res.status(201).json({ item });
    },

    /** PATCH /{collection}/:id — actualizar */
    update: async (req, res) => {
      const userRole = req.user?.role;
      if (!WRITE_ACCESS[collection]?.includes(userRole)) {
        throw new HttpError(403, 'No tienes permiso para modificar este módulo.');
      }
      const body = schemas[collection].partial().parse(req.body);
      const item = await repository.update(collection, req.params.id, body);
      if (!item) throw new HttpError(404, 'No se encontró el registro solicitado.');
      res.json({ item });
    }
  };
}
