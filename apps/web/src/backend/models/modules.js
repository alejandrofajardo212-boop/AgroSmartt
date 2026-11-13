import { ROLES } from './roles.js';

const commonRoles = [ROLES.ADMIN];

export const MODULES = [
  { id: 'farms', path: '/terrenos', label: 'Fincas', singular: 'Finca', icon: 'map', description: 'Ubicación, superficie y estado de tus fincas.', roles: [ROLES.ADMIN, ROLES.WORKER, ROLES.AGRONOMIST], fields: [
    { key: 'name', label: 'Nombre de la finca', required: true },
    { key: 'location', label: 'Ubicación', required: true },
    { key: 'areaHa', label: 'Área (hectáreas)', type: 'number', required: true, min: 0.1 },
    { key: 'latitude', label: 'Latitud', type: 'number', required: true, min: -90, max: 90 },
    { key: 'longitude', label: 'Longitud', type: 'number', required: true, min: -180, max: 180 }
  ] },
  { id: 'crops', path: '/cultivos', label: 'Cultivos', singular: 'Cultivo', icon: 'grass', description: 'Ciclos, variedades y progreso de tus cultivos.', roles: [ROLES.ADMIN, ROLES.WORKER, ROLES.AGRONOMIST], fields: [
    { key: 'name', label: 'Cultivo', required: true },
    { key: 'variety', label: 'Variedad', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'stage', label: 'Etapa de crecimiento', required: true },
    { key: 'plantedAt', label: 'Fecha de siembra', type: 'date', required: true },
    { key: 'progress', label: 'Progreso (%)', type: 'number', required: true, min: 0, max: 100 }
  ] },
  { id: 'sensors', path: '/sensores', label: 'Sensores', singular: 'Sensor', icon: 'sensors', description: 'Lecturas y estado de los dispositivos en campo.', roles: [ROLES.ADMIN, ROLES.AGRONOMIST], fields: [
    { key: 'name', label: 'Nombre del sensor', required: true },
    { key: 'type', label: 'Tipo de medición', options: ['Humedad del suelo', 'Temperatura', 'pH del suelo', 'Humedad ambiental'], required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'value', label: 'Lectura actual', type: 'number', required: true },
    { key: 'unit', label: 'Unidad', required: true },
    { key: 'status', label: 'Estado', options: ['En línea', 'Alerta', 'Sin conexión'], required: true }
  ] },
  { id: 'activities', path: '/actividades', label: 'Actividades', singular: 'Actividad', icon: 'event_note', description: 'Labores y actividades programadas en campo.', roles: [ROLES.ADMIN, ROLES.WORKER, ROLES.AGRONOMIST], fields: [
    { key: 'title', label: 'Actividad', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'assignedTo', label: 'Responsable', required: true },
    { key: 'date', label: 'Fecha', type: 'date', required: true },
    { key: 'status', label: 'Estado', options: ['Pendiente', 'En progreso', 'Completada'], required: true }
  ] },
  { id: 'tasks', path: '/tareas', label: 'Tareas', singular: 'Tarea', icon: 'task_alt', description: 'Tareas del equipo operativo.', roles: [ROLES.ADMIN, ROLES.WORKER], fields: [
    { key: 'title', label: 'Nombre de la tarea', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'assignedTo', label: 'Asignada a', required: true },
    { key: 'dueDate', label: 'Fecha límite', type: 'date', required: true },
    { key: 'priority', label: 'Prioridad', options: ['Baja', 'Media', 'Alta'], required: true }
  ] },
  { id: 'harvests', path: '/cosechas', label: 'Cosechas', singular: 'Cosecha', icon: 'agriculture', description: 'Registro de producción y calidad cosechada.', roles: [ROLES.ADMIN, ROLES.WORKER], fields: [
    { key: 'crop', label: 'Cultivo cosechado', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'date', label: 'Fecha de cosecha', type: 'date', required: true },
    { key: 'quantityKg', label: 'Cantidad (kg)', type: 'number', required: true, min: 0.1 },
    { key: 'quality', label: 'Calidad', options: ['Primera', 'Segunda', 'Tercera'], required: true }
  ] },
  { id: 'news', path: '/novedades', label: 'Novedades', singular: 'Novedad', icon: 'campaign', description: 'Novedades y reportes del personal de campo.', roles: [ROLES.ADMIN, ROLES.WORKER], fields: [
    { key: 'title', label: 'Asunto', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'reportedBy', label: 'Reportado por', required: true },
    { key: 'date', label: 'Fecha', type: 'date', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea', required: true }
  ] },
  { id: 'recommendations', path: '/recomendaciones', label: 'Recomendaciones', singular: 'Recomendación', icon: 'lightbulb', description: 'Indicaciones técnicas para mejorar tus cultivos.', roles: [ROLES.ADMIN, ROLES.AGRONOMIST], fields: [
    { key: 'title', label: 'Recomendación', required: true },
    { key: 'crop', label: 'Cultivo relacionado', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'priority', label: 'Prioridad', options: ['Baja', 'Media', 'Alta'], required: true },
    { key: 'description', label: 'Detalle técnico', type: 'textarea', required: true }
  ] },
  { id: 'pests', path: '/plagas', label: 'Plagas y enfermedades', singular: 'Reporte fitosanitario', icon: 'pest_control', description: 'Seguimiento fitosanitario y tratamientos.', roles: [ROLES.ADMIN, ROLES.AGRONOMIST], fields: [
    { key: 'name', label: 'Plaga o enfermedad', required: true },
    { key: 'crop', label: 'Cultivo afectado', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'severity', label: 'Severidad', options: ['Baja', 'Media', 'Alta'], required: true },
    { key: 'treatment', label: 'Tratamiento recomendado', type: 'textarea', required: true }
  ] },
  { id: 'expenses', path: '/finanzas/gastos', label: 'Gastos', singular: 'Gasto', icon: 'payments', description: 'Control de egresos operativos.', roles: [ROLES.ADMIN, ROLES.ACCOUNTANT], fields: [
    { key: 'concept', label: 'Concepto', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'category', label: 'Categoría', options: ['Insumos', 'Personal', 'Maquinaria', 'Transporte', 'Otro'], required: true },
    { key: 'amount', label: 'Valor', type: 'number', required: true, min: 0.01 },
    { key: 'date', label: 'Fecha', type: 'date', required: true }
  ] },
  { id: 'income', path: '/finanzas/ingresos', label: 'Ingresos', singular: 'Ingreso', icon: 'trending_up', description: 'Ventas e ingresos de producción.', roles: [ROLES.ADMIN, ROLES.ACCOUNTANT], fields: [
    { key: 'concept', label: 'Concepto', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'buyer', label: 'Comprador', required: true },
    { key: 'amount', label: 'Valor', type: 'number', required: true, min: 0.01 },
    { key: 'date', label: 'Fecha', type: 'date', required: true }
  ] },
  { id: 'costs', path: '/finanzas/costos', label: 'Costos de producción', singular: 'Costo', icon: 'account_balance_wallet', description: 'Costos asociados a cada ciclo de producción.', roles: [ROLES.ADMIN, ROLES.ACCOUNTANT], fields: [
    { key: 'concept', label: 'Concepto', required: true },
    { key: 'farmId', label: 'Finca', type: 'farm', required: true },
    { key: 'crop', label: 'Cultivo', required: true },
    { key: 'amount', label: 'Valor', type: 'number', required: true, min: 0.01 },
    { key: 'date', label: 'Fecha', type: 'date', required: true }
  ] },
  { id: 'users', path: '/usuarios', label: 'Usuarios', singular: 'Usuario', icon: 'group', description: 'Administra cuentas y perfiles de acceso del sistema.', roles: commonRoles, fields: [
    { key: 'name', label: 'Nombre completo', required: true },
    { key: 'email', label: 'Correo electrónico', type: 'email', required: true },
    { key: 'role', label: 'Rol de acceso', options: Object.values(ROLES), required: true },
    { key: 'password', label: 'Contraseña temporal', type: 'password', required: true, minLength: 8 }
  ] },
  { id: 'reports', path: '/reportes', label: 'Reportes', singular: 'Reporte', icon: 'summarize', description: 'Genera reportes generales de la operación.', roles: commonRoles, fields: [
    { key: 'title', label: 'Nombre del reporte', required: true },
    { key: 'type', label: 'Tipo de reporte', options: ['Producción', 'Financiero', 'Operativo', 'Fitosanitario'], required: true },
    { key: 'period', label: 'Periodo', required: true },
    { key: 'date', label: 'Fecha de generación', type: 'date', required: true }
  ] }
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((module) => [module.id, module]));

/** IDs de los 4 módulos exclusivos del rol Trabajador / Operario */
export const WORKER_MODULE_IDS = ['activities', 'tasks', 'harvests', 'news'];

/** Módulos filtrados para el Trabajador (en el orden del menú operario) */
export const WORKER_MODULES = WORKER_MODULE_IDS.map((id) => MODULE_BY_ID[id]);
