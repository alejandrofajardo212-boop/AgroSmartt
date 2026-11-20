import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/repositories/jsonRepository.js';

let directory;
let server;
let repository;
let baseUrl;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'agrosmart-test-'));
  repository = new JsonRepository(join(directory, 'data.json'));
  await repository.init();
  server = createApp(repository).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(directory, { recursive: true, force: true });
});

async function loginAs(email, password, role) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  return (await response.json()).token;
}

function register(body, token) {
  return fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
}

test('el registro sin sesión está bloqueado', async () => {
  const response = await register({ name: 'Intruso', email: 'intruso@test.com', password: 'password123', role: 'Administrador' });
  assert.equal(response.status, 401);
  assert.equal(repository.findUserByEmail('intruso@test.com'), null);
});

test('un usuario que no es administrador no puede crear cuentas', async () => {
  const token = await loginAs('operario@agrosmart.com', 'Operario2026!', 'Trabajador / Operario');
  const response = await register({ name: 'Intruso', email: 'intruso2@test.com', password: 'password123', role: 'Administrador' }, token);
  assert.equal(response.status, 403);
  assert.equal(repository.findUserByEmail('intruso2@test.com'), null);
});

test('el administrador crea una cuenta con rol y esa cuenta inicia sesión', async () => {
  const token = await loginAs('admin@agrosmart.com', 'Admin2026!', 'Administrador');
  const response = await register({ name: 'Usuario Demo', email: 'demo@test.com', password: 'password123', role: 'Trabajador / Operario' }, token);
  assert.equal(response.status, 201);
  const { user } = await response.json();
  assert.equal(user.role, 'Trabajador / Operario');
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);

  const newToken = await loginAs('demo@test.com', 'password123', 'Trabajador / Operario');
  assert.ok(newToken);
  const privateResponse = await fetch(`${baseUrl}/terrains`, { headers: { authorization: `Bearer ${newToken}` } });
  assert.equal(privateResponse.status, 200);
  const forbiddenResponse = await fetch(`${baseUrl}/terrains`, {
    method: 'POST',
    headers: { authorization: `Bearer ${newToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Nuevo lote', location: 'Chía', areaHa: 2 })
  });
  assert.equal(forbiddenResponse.status, 403);
});

test('el administrador no puede asignar un rol inventado', async () => {
  const token = await loginAs('admin@agrosmart.com', 'Admin2026!', 'Administrador');
  const response = await register({ name: 'Nuevo Usuario', email: 'new@test.com', password: 'password123', role: 'SuperAdmin' }, token);
  assert.equal(response.status, 400);
});

test('all four seed accounts can sign in without being persisted in the repository', async () => {
  const credentials = [
    ['admin@agrosmart.com', 'Admin2026!', 'Administrador'],
    ['operario@agrosmart.com', 'Operario2026!', 'Trabajador / Operario'],
    ['agronomo@agrosmart.com', 'Agronomo2026!', 'Ingeniero agrónomo / Técnico'],
    ['contador@agrosmart.com', 'Contador2026!', 'Contador / Encargado financiero']
  ];

  for (const [email, password, role] of credentials) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(session.user.email, email);
    assert.equal(session.user.role, role);
    assert.ok(session.token);

    const currentUser = await fetch(`${baseUrl}/auth/me`, {
      headers: { authorization: `Bearer ${session.token}` }
    });
    assert.equal((await currentUser.json()).user.email, email);
  }

  for (const [email] of credentials) assert.equal(repository.findUserByEmail(email), null);
});

test('invalid input returns a generic client error', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', password: 'short' })
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Los datos enviados no son válidos.' });
});

test('repository persists changes and returns paginated results', async () => {
  const result = repository.list('terrains', { page: 1, limit: 1 });
  assert.equal(result.items.length, 1);
  assert.equal(result.pagination.total, 3);

  const reloaded = new JsonRepository(join(directory, 'data.json'));
  await reloaded.init();
  assert.equal(reloaded.list('terrains', { page: 1, limit: 1 }).pagination.pages, 3);
});
