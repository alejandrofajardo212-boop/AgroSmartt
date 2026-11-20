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

  /**
   * Notificaciones calculadas a partir de los datos de los módulos que el rol puede ver.
   * Cada notificación tiene un id estable para poder marcarla como leída.
   */
  notifications(role) {
    if (!ROLE_OPTIONS.includes(role)) throw new Error('El rol seleccionado no está permitido.');
    const permitted = (moduleId) => canAccessModule(role, moduleId);
    const list = (moduleId) => (permitted(moduleId) ? this.repository.list(moduleId) : []);
    const farmName = new Map(this.repository.list('farms').map((farm) => [farm.id, farm.name]));
    const where = (record) => farmName.get(record.farmId) || 'Sin finca';
    const money = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
    const items = [];
    const push = (moduleId, record, data) => items.push({
      id: `${moduleId}:${record.id}:${data.kind || 'info'}`,
      moduleId,
      recordId: record.id,
      path: MODULE_BY_ID[moduleId].path,
      date: record.date || record.dueDate || record.plantedAt || record.createdAt || '',
      ...data
    });

    for (const task of list('tasks')) {
      if (task.status === 'Completada') continue;
      push('tasks', task, {
        kind: 'pending',
        icon: 'task_alt',
        tone: task.priority === 'Alta' ? 'negative' : 'warning',
        title: `Tarea pendiente: ${task.title}`,
        caption: `Prioridad ${task.priority || 'sin definir'} · vence ${task.dueDate || 'sin fecha'} · ${where(task)}`
      });
    }
    for (const activity of list('activities')) {
      if (activity.status === 'Completada') continue;
      push('activities', activity, {
        kind: 'open',
        icon: 'event_note',
        tone: 'info',
        title: `Actividad ${String(activity.status || 'pendiente').toLowerCase()}: ${activity.title}`,
        caption: `${activity.assignedTo || 'Sin responsable'} · ${activity.date || 'sin fecha'} · ${where(activity)}`
      });
    }
    for (const item of list('news')) {
      push('news', item, {
        icon: 'campaign',
        tone: 'warning',
        title: `Novedad: ${item.title}`,
        caption: `Reportada por ${item.reportedBy || 'el equipo'} · ${item.date || ''} · ${where(item)}`
      });
    }
    for (const crop of list('crops')) {
      if (crop.health !== 'Crítico' && crop.health !== 'Atención') continue;
      push('crops', crop, {
        kind: 'health',
        icon: 'grass',
        tone: crop.health === 'Crítico' ? 'negative' : 'warning',
        title: `Cultivo en estado ${crop.health.toLowerCase()}: ${crop.name}`,
        caption: `${crop.variety || ''} · etapa ${crop.stage || 'sin definir'} · ${where(crop)}`
      });
    }
    for (const farm of list('farms')) {
      if (farm.status === 'Saludable') continue;
      push('farms', farm, {
        kind: 'status',
        icon: 'map',
        tone: 'warning',
        title: `Finca ${String(farm.status || '').toLowerCase()}: ${farm.name}`,
        caption: `${farm.location} · ${farm.areaHa} ha`
      });
    }
    for (const sensor of list('sensors')) {
      if (sensor.status === 'En línea') continue;
      push('sensors', sensor, {
        kind: 'status',
        icon: 'sensors',
        tone: 'negative',
        title: `Sensor ${String(sensor.status).toLowerCase()}: ${sensor.name}`,
        caption: `${sensor.type} · lectura ${sensor.value}${sensor.unit || ''} · ${where(sensor)}`
      });
    }
    for (const pest of list('pests')) {
      push('pests', pest, {
        icon: 'pest_control',
        tone: pest.severity === 'Alta' ? 'negative' : 'warning',
        title: `Reporte fitosanitario: ${pest.name}`,
        caption: `${pest.crop} · severidad ${pest.severity} · ${where(pest)}`
      });
    }
    for (const rec of list('recommendations')) {
      push('recommendations', rec, {
        icon: 'lightbulb',
        tone: rec.priority === 'Alta' ? 'warning' : 'info',
        title: `Recomendación: ${rec.title}`,
        caption: `${rec.crop} · prioridad ${rec.priority} · ${where(rec)}`
      });
    }
    for (const expense of list('expenses')) {
      push('expenses', expense, {
        icon: 'payments',
        tone: 'negative',
        title: `Gasto registrado: ${expense.concept}`,
        caption: `${money(expense.amount)} · ${expense.category} · ${expense.date || ''}`
      });
    }
    for (const income of list('income')) {
      push('income', income, {
        icon: 'trending_up',
        tone: 'positive',
        title: `Ingreso registrado: ${income.concept}`,
        caption: `${money(income.amount)} · ${income.buyer} · ${income.date || ''}`
      });
    }
    for (const cost of list('costs')) {
      push('costs', cost, {
        icon: 'account_balance_wallet',
        tone: 'warning',
        title: `Costo de producción: ${cost.concept}`,
        caption: `${money(cost.amount)} · ${cost.crop} · ${cost.date || ''}`
      });
    }

    return items.sort((left, right) => String(right.date).localeCompare(String(left.date)));
  }

  assertAccess(moduleId, role) {
    if (!MODULE_BY_ID[moduleId]) throw new Error('El módulo solicitado no existe.');
    if (!canAccessModule(role, moduleId)) throw new Error('No tienes permisos para acceder a este módulo.');
  }
}

export { EMPTY_FIELDS_ERROR };
