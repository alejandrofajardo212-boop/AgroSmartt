import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { JsonRepository } from './repositories/jsonRepository.js';

const repository = new JsonRepository(env.dataFile);
await repository.init();

if (process.env.NODE_ENV !== 'production' && !repository.findUserByEmail('demo@agrosmart.com')) {
  await repository.insert('users', {
    id: randomUUID(),
    name: 'Equipo AgroSmart',
    email: 'demo@agrosmart.com',
    passwordHash: await bcrypt.hash('AgroSmart2026!', 12),
    role: 'Admin'
  });
}

const app = createApp(repository);
app.listen(env.port, () => {
  console.log(`AgroSmart API disponible en http://localhost:${env.port}/api`);
});
