import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LocalStorageRepository } from '../src/backend/repositories/localStorageRepository.js';
import { LocalAuthService, SessionConflictError } from '../src/backend/services/authService.js';
import { EMPTY_FIELDS_ERROR, PlatformService } from '../src/backend/services/platformService.js';
import { ROLES, canAccessModule } from '../src/backend/models/roles.js';
import { MODULES } from '../src/backend/models/modules.js';
import { ACTIVE_SESSIONS_KEY, SESSION_KEY, STORAGE_KEY, mockData } from '../src/backend/data/mockData.js';
import { SEED_USERS } from '../../shared/seedUsers.js';

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

test('four seed accounts can sign in without being stored as local users', async () => {
  const storage = new MemoryStorage();
  const auth = new LocalAuthService(storage);
  const credentials = [
    ['admin@agrosmart.com', 'Admin2026!', ROLES.ADMIN],
    ['operario@agrosmart.com', 'Operario2026!', ROLES.WORKER],
    ['agronomo@agrosmart.com', 'Agronomo2026!', ROLES.AGRONOMIST],
    ['contador@agrosmart.com', 'Contador2026!', ROLES.ACCOUNTANT]
  ];

  assert.equal(SEED_USERS.length, 4);
  for (const [email, password, role] of credentials) {
    const session = await auth.login({ email, password, role });

    assert.equal(session.user.email, email);
    assert.equal(new LocalStorageRepository(storage).list('users').length, 0);
    assert.equal(new LocalAuthService(storage).getSession().user.email, email);
    auth.logout();
  }
});

test('platform validates required fields and enforces module roles', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  assert.throws(
    () => platform.create('crops', { name: 'Sin datos' }, ROLES.ADMIN),
    new RegExp(EMPTY_FIELDS_ERROR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  );
  assert.throws(
    () => platform.list('farms', ROLES.WORKER),
    /No tienes permisos/
  );
  assert.throws(
    () => platform.list('sensors', ROLES.ACCOUNTANT),
    /No tienes permisos/
  );
  assert.equal(platform.list('expenses', ROLES.ACCOUNTANT).length, 1);
});

test('global search returns only records accessible to each role', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const workerRecords = platform.searchRecords(ROLES.WORKER);
  const agronomistRecords = platform.searchRecords(ROLES.AGRONOMIST);
  const accountantRecords = platform.searchRecords(ROLES.ACCOUNTANT);
  const adminRecords = platform.searchRecords(ROLES.ADMIN);

  assert.ok(!workerRecords.some((item) => item.moduleId === 'farms'));
  assert.ok(!workerRecords.some((item) => item.moduleId === 'sensors'));
  assert.ok(agronomistRecords.some((item) => item.moduleId === 'sensors'));
  assert.ok(accountantRecords.some((item) => item.moduleId === 'expenses'));
  assert.ok(!accountantRecords.some((item) => item.moduleId === 'farms'));
  assert.ok(!adminRecords.some((item) => item.moduleId === 'users'));
});

test('fincas: visibles para administrador y técnico, ocultas para operario y contador', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  assert.equal(platform.dashboard(ROLES.ADMIN).farms, 3);
  assert.equal(platform.list('farms', ROLES.AGRONOMIST).length, 3);
  assert.equal(platform.dashboard(ROLES.WORKER).farms, 0);
  assert.throws(() => platform.list('farms', ROLES.WORKER), /No tienes permisos/);
  assert.throws(() => platform.list('farms', ROLES.ACCOUNTANT), /No tienes permisos/);
});

test('editable records update their fields while preserving identity and creation time', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const originalCrop = platform.list('crops', ROLES.ADMIN)[0];
  const updatedCrop = platform.update('crops', originalCrop.id, {
    ...originalCrop,
    name: 'Tomate Norte'
  }, ROLES.ADMIN);

  assert.equal(updatedCrop.name, 'Tomate Norte');
  assert.equal(updatedCrop.id, originalCrop.id);
  assert.equal(updatedCrop.createdAt, originalCrop.createdAt);
  assert.throws(
    () => platform.update('crops', 'missing-crop', { ...originalCrop, name: 'Cultivo' }, ROLES.ADMIN),
    /No se encontró el registro/
  );
});

test('record deletion is role-protected', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  const expense = platform.list('expenses', ROLES.ACCOUNTANT)[0];

  assert.throws(
    () => platform.remove('farms', 'farm-1', ROLES.ADMIN),
    /tiene registros asociados/
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
    email: 'registered-admin@agrosmart.com',
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

test('el operario solo ve cultivos, actividades, tareas, cosechas y novedades', () => {
  assert.deepEqual(
    MODULES.filter((module) => canAccessModule(ROLES.WORKER, module.id)).map((module) => module.id),
    ['crops', 'activities', 'tasks', 'harvests', 'news']
  );
  assert.equal(canAccessModule(ROLES.WORKER, 'farms'), false);
});

test('las notificaciones existen para los cuatro roles y respetan sus permisos', () => {
  const platform = new PlatformService(new LocalStorageRepository(new MemoryStorage()));
  for (const role of Object.values(ROLES)) {
    const items = platform.notifications(role);
    assert.ok(items.length > 0, `sin notificaciones para ${role}`);
    assert.ok(items.every((item) => canAccessModule(role, item.moduleId)));
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  }
  assert.ok(!platform.notifications(ROLES.WORKER).some((item) => item.moduleId === 'sensors'));
});

test('los nombres de las cuentas demo y de los registros guardados están actualizados', () => {
  const names = Object.fromEntries(SEED_USERS.map((user) => [user.email, user.name]));
  assert.equal(names['operario@agrosmart.com'], 'Diego Fajardo');
  assert.equal(names['agronomo@agrosmart.com'], 'Juan Murillo');
  assert.equal(names['contador@agrosmart.com'], 'Nicolás Galvis');

  const storage = new MemoryStorage();
  const old = structuredClone(mockData);
  old.activities[0].assignedTo = 'Carlos Ramírez';
  old.news[0].reportedBy = 'Laura Méndez';
  storage.setItem(STORAGE_KEY, JSON.stringify(old));
  const repository = new LocalStorageRepository(storage);
  assert.equal(repository.list('activities')[0].assignedTo, 'Diego Fajardo');
  assert.equal(repository.list('news')[0].reportedBy, 'Juan Murillo');
});
