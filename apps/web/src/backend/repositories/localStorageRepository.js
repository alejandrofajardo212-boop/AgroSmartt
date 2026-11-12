import { mockData, STORAGE_KEY } from '../data/mockData.js';

export class LocalStorageRepository {
  constructor(storage = globalThis.localStorage) {
    if (!storage) throw new Error('El almacenamiento local del navegador no está disponible.');
    this.storage = storage;
  }

  readState() {
    const stored = this.storage.getItem(STORAGE_KEY);
    if (stored === null) {
      const initial = structuredClone(mockData);
      this.writeState(initial);
      return initial;
    }

    try {
      const parsed = JSON.parse(stored);
      const state = Object.fromEntries(
        Object.entries(mockData).map(([collection, seed]) => [
          collection,
          Array.isArray(parsed[collection]) ? parsed[collection] : structuredClone(seed)
        ])
      );
      if (Array.isArray(parsed.users)) {
        state.users = parsed.users.filter((user) =>
          user
          && typeof user.passwordHash === 'string'
          && typeof user.passwordSalt === 'string'
        );
      }
      return state;
    } catch (error) {
      throw new Error('No se pudieron leer los datos guardados. Limpia los datos locales e inténtalo nuevamente.', { cause: error });
    }
  }

  writeState(state) {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      throw new Error('No se pudieron guardar los datos en este navegador.', { cause: error });
    }
  }

  list(collection) {
    const state = this.readState();
    if (!Array.isArray(state[collection])) throw new Error(`La colección "${collection}" no existe.`);
    return structuredClone(state[collection]);
  }

  create(collection, values) {
    const state = this.readState();
    if (!Array.isArray(state[collection])) throw new Error(`La colección "${collection}" no existe.`);
    const item = { id: globalThis.crypto.randomUUID(), ...values, createdAt: new Date().toISOString() };
    state[collection].unshift(item);
    this.writeState(state);
    return structuredClone(item);
  }

  update(collection, id, values) {
    const state = this.readState();
    if (!Array.isArray(state[collection])) throw new Error(`La colección "${collection}" no existe.`);
    const index = state[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;

    const existing = state[collection][index];
    const item = { ...existing, ...values, id: existing.id, createdAt: existing.createdAt };
    state[collection][index] = item;
    this.writeState(state);
    return structuredClone(item);
  }

  remove(collection, id) {
    const state = this.readState();
    if (!Array.isArray(state[collection])) throw new Error(`La colección "${collection}" no existe.`);
    const next = state[collection].filter((item) => item.id !== id);
    if (next.length === state[collection].length) return false;
    state[collection] = next;
    this.writeState(state);
    return true;
  }
}
