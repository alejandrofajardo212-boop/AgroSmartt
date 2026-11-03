import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';
import { HttpError } from './utils/httpError.js';

export function createApp(repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', createApiRouter(repository));
  app.use((req, _res, next) => next(new HttpError(404, 'No se encontró el recurso solicitado.')));
  app.use(errorHandler);
  return app;
}
