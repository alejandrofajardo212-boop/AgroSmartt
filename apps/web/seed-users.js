/**
 * seed-users.js — Script de utilidad (solo desarrollo)
 * Genera los hashes PBKDF2 de los 4 usuarios demo y los imprime en formato
 * listo para pegar en mockData.js.
 *
 * Uso: node apps/web/seed-users.js
 */

const ITERATIONS = 120000;

async function deriveHash(password, salt) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key, 256
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}

function uuid() {
  return crypto.randomUUID();
}

const users = [
  { name: 'Admin AgroSmart',    email: 'admin@agrosmart.com',     password: 'Admin2026!',     role: 'Administrador' },
  { name: 'Diego Fajardo',     email: 'operario@agrosmart.com',  password: 'Operario2026!',  role: 'Trabajador / Operario' },
  { name: 'Juan Murillo',       email: 'agronomo@agrosmart.com',  password: 'Agronomo2026!',  role: 'Ingeniero agrónomo / Técnico' },
  { name: 'Nicolás Galvis', email: 'contador@agrosmart.com', password: 'Contador2026!', role: 'Contador / Encargado financiero' },
];

console.log('Generando hashes (puede tardar ~5 seg por usuario)...\n');

const results = [];
for (const u of users) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const hash = await deriveHash(u.password, salt);
  results.push({ id: uuid(), name: u.name, email: u.email, role: u.role, passwordHash: hash, passwordSalt: salt });
  console.log(`✓ ${u.email} [${u.role}]`);
}

console.log('\n── Copia este bloque en mockData.js > users: [ ... ] ──\n');
console.log(JSON.stringify(results, null, 2));
