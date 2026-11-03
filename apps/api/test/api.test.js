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

test('registration creates a regular-user session and protects private routes', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Usuario Demo', email: 'demo@test.com', password: 'password123' })
  });
  assert.equal(response.status, 201);
  const session = await response.json();
  assert.equal(session.user.role, 'Usuario');
  assert.ok(session.token);

  const privateResponse = await fetch(`${baseUrl}/terrains`, {
    headers: { authorization: `Bearer ${session.token}` }
  });
  assert.equal(privateResponse.status, 200);
  assert.ok((await privateResponse.json()).items.length > 0);

  const forbiddenResponse = await fetch(`${baseUrl}/terrains`, {
    method: 'POST',
    headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Nuevo lote', location: 'Chía', areaHa: 2 })
  });
  assert.equal(forbiddenResponse.status, 403);
});

test('public registration cannot grant administrator access', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Nuevo Usuario', email: 'new@test.com', password: 'password123', role: 'SuperAdmin' })
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.role, 'Usuario');
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
