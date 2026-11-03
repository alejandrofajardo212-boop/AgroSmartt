import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  async register({ name, email, password }) {
    if (this.repository.findUserByEmail(email)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo electrónico.');
    }

    const user = {
      id: randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'Usuario'
    };
    await this.repository.insert('users', user);
    return this.createSession(user);
  }

  async login({ email, password }) {
    const user = this.repository.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
