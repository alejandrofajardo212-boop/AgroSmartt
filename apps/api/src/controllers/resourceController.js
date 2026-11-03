import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../utils/httpError.js';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(120),
  areaHa: z.number().positive().max(100000)
});

export function createResourceController(repository, collection) {
  return {
    list: (req, res) => {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      res.json(repository.list(collection, { page, limit }));
    },
    create: async (req, res) => {
      const body = collection === 'terrains'
        ? createSchema.parse(req.body)
        : z.object({ name: z.string().trim().min(2).max(100) })
          .passthrough()
          .parse(req.body);
      const item = await repository.insert(collection, {
        id: randomUUID(),
        ...body,
        status: body.status || 'Saludable',
        createdAt: new Date().toISOString()
      });
      res.status(201).json({ item });
    },
    update: async (req, res) => {
      const body = createSchema.partial().parse(req.body);
      const item = await repository.update(collection, req.params.id, body);
      if (!item) throw new HttpError(404, 'No se encontró el registro solicitado.');
      res.json({ item });
    }
  };
}
