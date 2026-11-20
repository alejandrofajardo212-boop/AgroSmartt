export const STORAGE_KEY = 'agrosmart.local.data.v1';
export const SESSION_KEY = 'agrosmart.local.session.v1';
export const ACTIVE_SESSIONS_KEY = 'agrosmart.local.active-sessions.v1';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const mockData = {
  users: [],
  farms: [
    { id: 'farm-1', name: 'Finca El Paraíso', location: 'La Ramada, Cundinamarca', areaHa: 12.5, latitude: 4.711, longitude: -74.0721, status: 'Saludable' },
    { id: 'farm-2', name: 'Lote Norte', location: 'Chía, Cundinamarca', areaHa: 8.2, latitude: 4.861, longitude: -74.033, status: 'Requiere atención' },
    { id: 'farm-3', name: 'Parcela La Esperanza', location: 'Facatativá, Cundinamarca', areaHa: 5.7, latitude: 4.813, longitude: -74.354, status: 'Saludable' }
  ],
  crops: [
    { id: 'crop-1', name: 'Tomate', variety: 'Chonto', farmId: 'farm-1', stage: 'Fructificación', plantedAt: '2026-01-12', progress: 72, health: 'Óptimo' },
    { id: 'crop-2', name: 'Maíz', variety: 'ICA V-109', farmId: 'farm-2', stage: 'Crecimiento', plantedAt: '2026-02-03', progress: 48, health: 'Atención' },
    { id: 'crop-3', name: 'Papa', variety: 'Criolla', farmId: 'farm-3', stage: 'Desarrollo', plantedAt: '2026-01-27', progress: 61, health: 'Óptimo' },
    { id: 'crop-4', name: 'Lechuga', variety: 'Batavia', farmId: 'farm-1', stage: 'Germinación', plantedAt: '2026-03-10', progress: 24, health: 'Crítico' }
  ],
  sensors: [
    { id: 'sensor-1', name: 'Sensor Suelo 01', type: 'Humedad del suelo', farmId: 'farm-1', value: 68, unit: '%', status: 'En línea' },
    { id: 'sensor-2', name: 'Sensor Clima 02', type: 'Temperatura', farmId: 'farm-1', value: 24.5, unit: '°C', status: 'En línea' },
    { id: 'sensor-3', name: 'Sensor Suelo 03', type: 'Humedad del suelo', farmId: 'farm-2', value: 34, unit: '%', status: 'Alerta' }
  ],
  activities: [
    { id: 'activity-1', title: 'Revisión del sistema de riego', farmId: 'farm-1', assignedTo: 'Diego Fajardo', date: '2026-11-12', status: 'En progreso' },
    { id: 'activity-2', title: 'Inspección de hojas', farmId: 'farm-2', assignedTo: 'Juan Murillo', date: '2026-11-13', status: 'Pendiente' }
  ],
  tasks: [
    { id: 'task-1', title: 'Preparar fertilización', farmId: 'farm-1', assignedTo: 'Diego Fajardo', dueDate: '2026-11-14', priority: 'Alta' },
    { id: 'task-2', title: 'Limpiar canal de drenaje', farmId: 'farm-2', assignedTo: 'Diego Fajardo', dueDate: '2026-11-15', priority: 'Media' }
  ],
  harvests: [{ id: 'harvest-1', crop: 'Tomate', farmId: 'farm-1', date: '2026-11-08', quantityKg: 340, quality: 'Primera' }],
  news: [{ id: 'news-1', title: 'Fuga menor en válvula de riego', farmId: 'farm-2', reportedBy: 'Diego Fajardo', date: '2026-11-12', description: 'Se aisló la válvula y quedó pendiente el reemplazo.' }],
  recommendations: [{ id: 'recommendation-1', title: 'Aumentar frecuencia de riego', crop: 'Maíz', farmId: 'farm-2', priority: 'Alta', description: 'La humedad del suelo está por debajo del rango recomendado.' }],
  pests: [{ id: 'pest-1', name: 'Mosca blanca', crop: 'Tomate', farmId: 'farm-1', severity: 'Baja', treatment: 'Monitorear semanalmente y mantener control biológico.' }],
  expenses: [{ id: 'expense-1', concept: 'Fertilizante orgánico', farmId: 'farm-1', category: 'Insumos', amount: 480000, date: '2026-11-05' }],
  income: [{ id: 'income-1', concept: 'Venta de tomate', farmId: 'farm-1', buyer: 'Mercado Central', amount: 1350000, date: '2026-11-08' }],
  costs: [{ id: 'cost-1', concept: 'Mano de obra', farmId: 'farm-2', crop: 'Maíz', amount: 620000, date: '2026-11-10' }],
  reports: []
};
