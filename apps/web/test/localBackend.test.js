import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LocalStorageRepository } from '../src/backend/repositories/localStorageRepository.js';
import { LocalAuthService, SessionConflictError } from '../src/backend/services/authService.js';
import { EMPTY_FIELDS_ERROR, PlatformService } from '../src/backend/services/platformService.js';
import { ROLES } from '../src/backend/models/roles.js';
import { ACTIVE_SESSIONS_KEY, SESSION_KEY } from '../src/backend/data/mockData.js';

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test('local repository starts without demo accounts and persists new records', () => {
  const storage = new MemoryStorage();
  const repository = new LocalStorageRepository(storage);
  assert.equal(repository.list('farms').length, 3);
  assert.deepEqual(repository.list('users'), []);

  repository.create('farms', { name: 'Finca nueva' });
  const reloaded = new LocalStorageRepository(storage);
  assert.equal(reloaded.list('farms')[0].name, 'Finca nueva');
});

test('local repository removes legacy demo users but keeps registered accounts', () => {
  const storage = new MemoryStorage();
  const repository = new LocalStorageRepository(storage);
  repository.list('users');
  const state = JSON.parse(storage.getItem('agrosmart.local.data.v1'));
  state.users = [
    { id: 'legacy-demo', email: 'admin@agrosmart.com', role: ROLES.ADMIN },
    { id: 'registered', email: 'owner@agrosmart.com', role: ROLES.WORKER, passwordHash: 'hash', passwordSalt: 'salt' }
  ];
  storage.setItem('agrosmart.local.data.v1', JSON.stringify(state));

  assert.deepEqual(repository.list('users').map((user) => user.id), ['registered']);
});

test('legacy demo sessions are rejected unless the account is registered', () => {
  const storage = new MemoryStorage();
  const session = {
    id: 'legacy-session',
    user: { id: 'user-admin', email: 'admin@agrosmart.com', role: ROLES.ADMIN },
    expiresAt: Date.now() + 60_000
  };
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  storage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify([{
    id: session.id,
    email: session.user.email,
    role: session.user.role,
    expiresAt: session.expiresAt
  }]));

  assert.equal(new LocalAuthService(storage).getSession(), null);
});

test('platform validates required fields and enforces module roles', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  assert.throws(
    () => platform.create('farms', { name: 'Sin coordenadas' }, ROLES.ADMIN),
    new RegExp(EMPTY_FIELDS_ERROR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  );
  assert.throws(
    () => platform.list('farms', ROLES.ACCOUNTANT),
    /No tienes permisos/
  );
  assert.throws(
    () => platform.create('users', {}, ROLES.ADMIN),
    /servicio de autenticación/
  );
  assert.equal(platform.list('expenses', ROLES.ACCOUNTANT).length, 1);
});

test('global search returns only records accessible to each role', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const workerRecords = platform.searchRecords(ROLES.WORKER);
  const agronomistRecords = platform.searchRecords(ROLES.AGRONOMIST);
  const accountantRecords = platform.searchRecords(ROLES.ACCOUNTANT);
  const adminRecords = platform.searchRecords(ROLES.ADMIN);

  assert.ok(workerRecords.some((item) => item.moduleId === 'farms'));
  assert.ok(!workerRecords.some((item) => item.moduleId === 'sensors'));
  assert.ok(agronomistRecords.some((item) => item.moduleId === 'sensors'));
  assert.ok(accountantRecords.some((item) => item.moduleId === 'expenses'));
  assert.ok(!accountantRecords.some((item) => item.moduleId === 'farms'));
  assert.ok(!adminRecords.some((item) => item.moduleId === 'users'));
});

test('farm details resolve crops and sensors from local state', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const details = platform.getFarmDetails('farm-1', ROLES.AGRONOMIST);
  assert.equal(details.farm.name, 'Finca El Paraíso');
  assert.equal(details.crops.length, 2);
  assert.equal(details.sensors.length, 2);
});

test('editable records update their fields while preserving identity and creation time', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const originalFarm = platform.list('farms', ROLES.ADMIN)[0];
  const updatedFarm = platform.update('farms', originalFarm.id, {
    name: 'Finca El Paraíso Norte',
    location: originalFarm.location,
    areaHa: originalFarm.areaHa,
    latitude: originalFarm.latitude,
    longitude: originalFarm.longitude
  }, ROLES.ADMIN);

  assert.equal(updatedFarm.name, 'Finca El Paraíso Norte');
  assert.equal(updatedFarm.id, originalFarm.id);
  assert.equal(updatedFarm.createdAt, originalFarm.createdAt);
  assert.throws(
    () => platform.update('farms', 'missing-farm', {
      name: 'Finca',
      location: 'Ubicación',
      areaHa: 1,
      latitude: 0,
      longitude: 0
    }, ROLES.ADMIN),
    /No se encontró el registro/
  );
});

test('record deletion is role-protected and preserves farms with associated records', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const expense = platform.list('expenses', ROLES.ACCOUNTANT)[0];

  assert.throws(
    () => platform.remove('farms', 'farm-1', ROLES.ADMIN),
    /registros asociados/
  );
  assert.throws(
    () => platform.remove('expenses', expense.id, ROLES.WORKER),
    /No tienes permisos/
  );
  assert.equal(platform.remove('expenses', expense.id, ROLES.ACCOUNTANT), true);
  assert.ok(!platform.list('expenses', ROLES.ACCOUNTANT).some((item) => item.id === expense.id));
});

test('login requires a registered account and blocks a second active session for the same role', async () => {
  const storage = new MemoryStorage();
  const auth = new LocalAuthService(storage);
  await assert.rejects(
    () => auth.login({ email: 'admin@agrosmart.com', password: 'Agro2026!', role: ROLES.ADMIN }),
    /Credenciales incorrectas/
  );
  const user = await auth.registerAccount({
    name: 'Equipo AgroSmart',
    email: 'admin@agrosmart.com',
    password: 'Agro2026!',
    role: ROLES.ADMIN
  });
  const session = await auth.login({
    email: user.email,
    password: 'Agro2026!',
    role: ROLES.ADMIN
  });
  assert.equal(session.user.role, ROLES.ADMIN);
  await assert.rejects(
    () => auth.login({ email: user.email, password: 'Agro2026!', role: ROLES.ADMIN }),
    SessionConflictError
  );
  await assert.rejects(
    () => auth.login({ email: user.email, password: 'Agro2026!', role: ROLES.WORKER }),
    /Credenciales incorrectas/
  );
  auth.logout();
  assert.equal(auth.getSession(), null);
});

test('administrator creates accounts with hashed passwords that can sign in', async () => {
  const storage = new MemoryStorage();
  const auth = new LocalAuthService(storage);
  const user = await auth.createUser({
    name: 'Operaria Demo',
    email: 'New.User@AgroSmart.com',
    password: 'ClaveSegura2026',
    role: ROLES.WORKER
  }, ROLES.ADMIN);

  assert.equal(user.email, 'new.user@agrosmart.com');
  const storedUser = new LocalStorageRepository(storage).list('users').find((item) => item.email === user.email);
  assert.ok(storedUser.passwordHash);
  assert.equal(storedUser.password, undefined);
  const session = await auth.login({
    email: user.email,
    password: 'ClaveSegura2026',
    role: ROLES.WORKER
  });
  assert.equal(session.user.id, user.id);
  await assert.rejects(
    () => auth.login({ email: user.email, password: 'ClaveIncorrecta', role: ROLES.WORKER }),
    /Credenciales incorrectas/
  );
  await assert.rejects(
    () => auth.createUser({ name: 'Otro', email: 'other@test.com', password: 'ClaveSegura2026', role: ROLES.WORKER }, ROLES.WORKER),
    /Solo el administrador/
  );
  auth.logout();
});

test('new accounts can register with a selected role and sign in', async () => {
  const storage = new MemoryStorage();
  const auth = new LocalAuthService(storage);
  const user = await auth.registerAccount({
    name: 'María Campo',
    email: 'maria@agrosmart.com',
    password: 'Cosecha2026!',
    role: ROLES.AGRONOMIST
  });

  assert.equal(user.role, ROLES.AGRONOMIST);
  const session = await auth.login({
    email: user.email,
    password: 'Cosecha2026!',
    role: ROLES.AGRONOMIST
  });
  assert.equal(session.user.id, user.id);
  auth.logout();
});

test('accounts for all four roles can register and sign in to their role', async () => {
  const auth = new LocalAuthService(new MemoryStorage());

  for (const [index, role] of Object.values(ROLES).entries()) {
    const user = await auth.registerAccount({
      name: `Usuario ${index + 1}`,
      email: `usuario${index + 1}@agrosmart.com`,
      password: 'Cosecha2026!',
      role
    });
    const session = await auth.login({
      email: user.email,
      password: 'Cosecha2026!',
      role
    });

    assert.equal(session.user.role, role);
    auth.logout();
  }
});
