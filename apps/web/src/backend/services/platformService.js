import { MODULES, MODULE_BY_ID } from '../models/modules.js';
import { canAccessModule, ROLE_OPTIONS } from '../models/roles.js';

const EMPTY_FIELDS_ERROR = 'Error: No llenaste todos los campos del formulario';

export class PlatformService {
  constructor(repository) {
    this.repository = repository;
  }

  list(moduleId, role) {
    this.assertAccess(moduleId, role);
    const items = this.repository.list(moduleId);
    return moduleId === 'users'
      ? items.map(({ passwordHash, passwordSalt, ...user }) => user)
      : items;
  }

  searchRecords(role) {
    if (!ROLE_OPTIONS.includes(role)) throw new Error('El rol seleccionado no está permitido.');
    return MODULES
      .filter((module) => canAccessModule(role, module.id))
      .flatMap((module) => this.list(module.id, role).map((record) => ({
        moduleId: module.id,
        path: module.path,
        label: module.label,
        singular: module.singular,
        icon: module.icon,
        record
      })));
  }

  create(moduleId, values, role) {
    this.assertAccess(moduleId, role);
    const module = MODULE_BY_ID[moduleId];
    if (moduleId === 'users') throw new Error('Las cuentas se crean mediante el servicio de autenticación.');
    if (module.readOnly) throw new Error('Este módulo es de solo lectura.');
    const cleanValues = this.validateValues(module, values);
    if (moduleId === 'farms') cleanValues.status = 'Saludable';
    if (moduleId === 'crops') cleanValues.health = 'Óptimo';
    return this.repository.create(moduleId, cleanValues);
  }

  update(moduleId, id, values, role) {
    this.assertAccess(moduleId, role);
    const module = MODULE_BY_ID[moduleId];
    if (moduleId === 'users') throw new Error('Las cuentas se gestionan mediante el servicio de autenticación.');
    if (module.readOnly) throw new Error('Este módulo es de solo lectura.');
    const cleanValues = this.validateValues(module, values);
    const updated = this.repository.update(moduleId, id, cleanValues);
    if (!updated) throw new Error('No se encontró el registro que deseas editar.');
    return updated;
  }

  remove(moduleId, id, role) {
    this.assertAccess(moduleId, role);
    const module = MODULE_BY_ID[moduleId];
    if (moduleId === 'users') throw new Error('Las cuentas se gestionan mediante el servicio de autenticación.');
    if (module.readOnly) throw new Error('Este módulo es de solo lectura.');

    if (moduleId === 'farms') {
      const hasReferences = MODULES
        .filter((item) => item.id !== 'farms' && item.fields.some((field) => field.key === 'farmId'))
        .some((item) => this.repository.list(item.id).some((record) => record.farmId === id));
      if (hasReferences) {
        throw new Error('No se puede eliminar esta finca porque tiene registros asociados. Reasígnalos o elimínalos primero.');
      }
    }

    if (!this.repository.remove(moduleId, id)) {
      throw new Error('No se encontró el registro que deseas eliminar.');
    }
    return true;
  }

  validateValues(module, values) {
    const cleanValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    const missing = module.fields.some((field) => {
      const value = cleanValues[field.key];
      return field.required && (value === undefined || value === null || value === '');
    });
    if (missing) throw new Error(EMPTY_FIELDS_ERROR);

    for (const field of module.fields) {
      const value = cleanValues[field.key];
      if (value === undefined || value === null || value === '') continue;
      if (field.type === 'number' && (!Number.isFinite(Number(value)) || (field.min !== undefined && Number(value) < field.min) || (field.max !== undefined && Number(value) > field.max))) {
        throw new Error(`Revisa el valor del campo "${field.label}".`);
      }
      if (field.options && !field.options.includes(value)) {
        throw new Error(`Selecciona una opción válida para "${field.label}".`);
      }
    }

    return cleanValues;
  }

  referenceFarms() {
    return this.repository.list('farms').map(({ id, name }) => ({ id, name }));
  }

  getFarmDetails(farmId, role) {
    this.assertAccess('farms', role);
    const farm = this.repository.list('farms').find((item) => item.id === farmId);
    if (!farm) throw new Error('No se encontró la finca seleccionada.');
    const crops = canAccessModule(role, 'crops')
      ? this.repository.list('crops').filter((item) => item.farmId === farmId)
      : [];
    const sensors = canAccessModule(role, 'sensors')
      ? this.repository.list('sensors').filter((item) => item.farmId === farmId)
      : [];
    return { farm, crops, sensors };
  }

  dashboard(role) {
    const permitted = (moduleId) => canAccessModule(role, moduleId);
    const farms = permitted('farms') ? this.repository.list('farms') : [];
    const crops = permitted('crops') ? this.repository.list('crops') : [];
    const sensors = permitted('sensors') ? this.repository.list('sensors') : [];
    const expenses = permitted('expenses') ? this.repository.list('expenses') : [];
    const income = permitted('income') ? this.repository.list('income') : [];
    const tasks = permitted('tasks') ? this.repository.list('tasks') : [];
    const activities = permitted('activities') ? this.repository.list('activities') : [];
    const harvests = permitted('harvests') ? this.repository.list('harvests') : [];
    const news = permitted('news') ? this.repository.list('news') : [];
    const recommendations = permitted('recommendations') ? this.repository.list('recommendations') : [];
    const pests = permitted('pests') ? this.repository.list('pests') : [];
    const costs = permitted('costs') ? this.repository.list('costs') : [];

    return {
      farms: farms.length,
      crops: crops.length,
      sensors: sensors.length,
      alerts: sensors.filter((sensor) => sensor.status === 'Alerta').length,
      pendingTasks: tasks.filter((task) => task.status !== 'Completada').length,
      activities: activities.length,
      harvests: harvests.length,
      news: news.length,
      recommendations: recommendations.length,
      pests: pests.length,
      expenses: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      income: income.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      costs: costs.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      recentFarms: farms.slice(0, 3)
    };
  }

  assertAccess(moduleId, role) {
    if (!MODULE_BY_ID[moduleId]) throw new Error('El módulo solicitado no existe.');
    if (!canAccessModule(role, moduleId)) throw new Error('No tienes permisos para acceder a este módulo.');
  }
}

export { EMPTY_FIELDS_ERROR };
