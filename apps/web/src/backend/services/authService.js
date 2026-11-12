import {
  ACTIVE_SESSIONS_KEY,
  SESSION_DURATION_MS,
  SESSION_KEY
} from '../data/mockData.js';
import { ROLE_OPTIONS, ROLES } from '../models/roles.js';
import { LocalStorageRepository } from '../repositories/localStorageRepository.js';

const PASSWORD_ITERATIONS = 120000;

async function derivePasswordHash(password, salt) {
  const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: new TextEncoder().encode(salt),
    iterations: PASSWORD_ITERATIONS,
    hash: 'SHA-256'
  }, key, 256);
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class SessionConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionConflictError';
  }
}

export class LocalAuthService {
  constructor(storage = globalThis.localStorage) {
    if (!storage) throw new Error('El almacenamiento local del navegador no está disponible.');
    this.storage = storage;
    this.repository = new LocalStorageRepository(storage);
  }

  async login({ email, password, role }) {
    if (!email?.trim() || !password || !role) {
      throw new Error('Selecciona un rol e ingresa tu correo y contraseña.');
    }
    if (!ROLE_OPTIONS.includes(role)) throw new Error('El rol seleccionado no está permitido.');

    const normalizedEmail = email.trim().toLowerCase();
    const account = this.repository.list('users').find((item) => item.email === normalizedEmail);
    if (account?.passwordHash && account.passwordSalt && account.role === role) {
      const passwordHash = await derivePasswordHash(password, account.passwordSalt);
      if (passwordHash !== account.passwordHash) {
        throw new Error('Credenciales incorrectas o el rol no corresponde a esta cuenta.');
      }
    } else {
      throw new Error('Credenciales incorrectas o el rol no corresponde a esta cuenta.');
    }

    const active = this.readActiveSessions().filter((session) => session.expiresAt > Date.now());
    const conflict = active.find((session) => session.email === account.email || session.role === role);
    if (conflict) {
      throw new SessionConflictError('Ya existe una sesión activa para esta cuenta o rol. Cierra la sesión activa antes de continuar.');
    }

    const session = {
      id: globalThis.crypto.randomUUID(),
      user: { id: account.id, name: account.name, email: account.email, role: account.role },
      expiresAt: Date.now() + SESSION_DURATION_MS
    };
    this.writeActiveSessions([...active, { id: session.id, email: account.email, role, expiresAt: session.expiresAt }]);
    try {
      this.storage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      this.writeActiveSessions(active);
      throw error;
    }
    return session;
  }

  async createUser({ name, email, password, role }, actorRole) {
    if (actorRole !== ROLES.ADMIN) throw new Error('Solo el administrador puede gestionar usuarios.');
    return this.saveUser({ name, email, password, role });
  }

  async registerAccount({ name, email, password, role }) {
    return this.saveUser({ name, email, password, role });
  }

  async saveUser({ name, email, password, role }) {
    if (![name, email, password, role].every((value) => String(value ?? '').trim())) {
      throw new Error('Error: No llenaste todos los campos del formulario');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Ingresa un correo electrónico válido.');
    }
    if (normalizedEmail.length > 254) throw new Error('El correo electrónico es demasiado largo.');
    if (!ROLE_OPTIONS.includes(role)) throw new Error('El rol seleccionado no está permitido.');
    if (password.length < 8 || password.length > 128) {
      throw new Error('La contraseña temporal debe tener entre 8 y 128 caracteres.');
    }

    const exists = this.repository.list('users').some((user) => user.email === normalizedEmail);
    if (exists) throw new Error('Ya existe una cuenta con ese correo electrónico.');

    const passwordSalt = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const passwordHash = await derivePasswordHash(password, passwordSalt);
    const user = this.repository.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash,
      passwordSalt
    });
    const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...safeUser } = user;
    return safeUser;
  }

  getSession() {
    const raw = this.storage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw);
      const isActive = this.readActiveSessions().some((active) =>
        active.id === session.id
        && active.email === session.user?.email
        && active.role === session.user?.role
        && active.expiresAt > Date.now()
      );
      const registeredAccount = this.repository.list('users').find((account) =>
        account.id === session.user?.id
        && account.email === session.user?.email
        && account.role === session.user?.role
        && account.passwordHash
        && account.passwordSalt
      );
      if (
        !session.id
        || !session.user?.email
        || !ROLE_OPTIONS.includes(session.user.role)
        || !Number.isFinite(session.expiresAt)
        || session.expiresAt <= Date.now()
        || !isActive
        || !registeredAccount
      ) {
        this.clearSession(session.id);
        return null;
      }
      return session;
    } catch (error) {
      this.clearSession();
      throw new Error('No se pudo validar la sesión local.', { cause: error });
    }
  }

  logout() {
    const session = this.getSession();
    this.clearSession(session?.id);
  }

  readActiveSessions() {
    const raw = this.storage.getItem(ACTIVE_SESSIONS_KEY);
    if (!raw) return [];
    try {
      const sessions = JSON.parse(raw);
      if (!Array.isArray(sessions)) throw new TypeError('Expected an array of active sessions.');
      return sessions.filter((session) =>
        session
        && typeof session.id === 'string'
        && typeof session.email === 'string'
        && ROLE_OPTIONS.includes(session.role)
        && Number.isFinite(session.expiresAt)
      );
    } catch (error) {
      throw new Error('No se pudo validar el registro de sesiones activas.', { cause: error });
    }
  }

  writeActiveSessions(sessions) {
    this.storage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  }

  clearSession(sessionId) {
    const remaining = this.readActiveSessions().filter((session) => session.id !== sessionId);
    this.writeActiveSessions(remaining);
    this.storage.removeItem(SESSION_KEY);
  }
}
