import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pbkdf2, randomUUID, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { SEED_USERS, SEED_USER_EMAILS } from '../../../shared/seedUsers.js';

const deriveSeedHash = promisify(pbkdf2);
const SEED_PASSWORD_ITERATIONS = 120000;

/** Roles que pueden crear cuentas */
export const ADMIN_ROLES = ['Administrador', 'SuperAdmin', 'Admin'];

/** Roles que el administrador puede asignar a una cuenta nueva */
export const ASSIGNABLE_ROLES = [
  'Administrador',
  'Trabajador / Operario',
  'Ingeniero agrónomo / Técnico',
  'Contador / Encargado financiero'
];

export class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  /** Crea una cuenta con el rol que asigna el administrador. Devuelve el usuario sin la contraseña. */
  async register({ name, email, password, role }) {
    if (!ASSIGNABLE_ROLES.includes(role)) throw new HttpError(400, 'El rol seleccionado no está permitido.');
    const normalizedEmail = email.toLowerCase();
    if (SEED_USER_EMAILS.has(normalizedEmail) || this.repository.findUserByEmail(normalizedEmail)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo electrónico.');
    }

    const user = {
      id: randomUUID(),
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role
    };
    await this.repository.insert('users', user);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async login({ email, password, role }) {
    const normalizedEmail = email.toLowerCase();
    const seedUser = SEED_USERS.find((account) => account.email === normalizedEmail);
    if (seedUser) {
      const actualHash = await deriveSeedHash(password, seedUser.passwordSalt, SEED_PASSWORD_ITERATIONS, 32, 'sha256');
      const expectedHash = Buffer.from(seedUser.passwordHash, 'hex');
      if (
        (role && role !== seedUser.role)
        || actualHash.length !== expectedHash.length
        || !timingSafeEqual(actualHash, expectedHash)
      ) {
        throw new HttpError(401, 'Correo electrónico o contraseña incorrectos.');
      }
      return this.createSession(seedUser);
    }

    const user = this.repository.findUserByEmail(normalizedEmail);
    if (!user || (role && role !== user.role) || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Correo electrónico o contraseña incorrectos.');
    }
    return this.createSession(user);
  }

  createSession(user) {
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(safeUser, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    return { token, user: safeUser };
  }
}
