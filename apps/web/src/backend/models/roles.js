export const ROLES = Object.freeze({
  ADMIN: 'Administrador',
  WORKER: 'Trabajador / Operario',
  AGRONOMIST: 'Ingeniero agrónomo / Técnico',
  ACCOUNTANT: 'Contador / Encargado financiero'
});

export const ROLE_OPTIONS = Object.values(ROLES);

export const ROLE_ACCESS = Object.freeze({
  [ROLES.ADMIN]: ['*'],
  [ROLES.WORKER]: ['crops', 'activities', 'tasks', 'harvests', 'news'],
  [ROLES.AGRONOMIST]: ['farms', 'crops', 'sensors', 'activities', 'recommendations', 'pests'],
  [ROLES.ACCOUNTANT]: ['expenses', 'income', 'costs']
});

export function canAccessModule(role, moduleId) {
  const allowed = ROLE_ACCESS[role] || [];
  return allowed.includes('*') || allowed.includes(moduleId);
}
