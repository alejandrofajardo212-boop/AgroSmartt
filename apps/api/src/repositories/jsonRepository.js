import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { mockSeed } from '../data/mockSeed.js';

export class JsonRepository {
  constructor(filePath) {
    this.filePath = resolve(filePath);
    this.state = structuredClone(mockSeed);
    this.writeQueue = Promise.resolve();
  }

  async init() {
    try {
      this.state = JSON.parse(await readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.persist();
    }
  }

  list(collection, { page = 1, limit = 20 } = {}) {
    const items = this.state[collection] || [];
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) }
    };
  }

  findById(collection, id) {
    return this.state[collection]?.find((item) => item.id === id) || null;
  }

  findUserByEmail(email) {
    return this.state.users.find((user) => user.email === email.toLowerCase()) || null;
  }

  async insert(collection, item) {
    this.state[collection].push(item);
    await this.persist();
    return item;
  }

  async update(collection, id, changes) {
    const index = this.state[collection].findIndex((item) => item.id === id);
    if (index < 0) return null;
    this.state[collection][index] = { ...this.state[collection][index], ...changes };
    await this.persist();
    return this.state[collection][index];
  }

  async persist() {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.tmp`;
      await writeFile(temporaryPath, snapshot, 'utf8');
      await rename(temporaryPath, this.filePath);
    });
    return this.writeQueue;
  }
}
