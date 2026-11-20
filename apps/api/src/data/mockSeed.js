export const mockSeed = {
  users: [],
  terrains: [
    { id: 'field-1', name: 'Finca El Paraíso', location: 'La Ramada, Cundinamarca', areaHa: 12.5, crop: 'Tomate', status: 'Saludable', moisture: 68, temperature: 24.5 },
    { id: 'field-2', name: 'Lote Norte', location: 'Chía, Cundinamarca', areaHa: 8.2, crop: 'Maíz', status: 'Requiere atención', moisture: 34, temperature: 29.1 },
    { id: 'field-3', name: 'Parcela La Esperanza', location: 'Facatativá, Cundinamarca', areaHa: 5.7, crop: 'Papa', status: 'Saludable', moisture: 72, temperature: 21.8 }
  ],
  crops: [
    { id: 'crop-1', name: 'Tomate', variety: 'Chonto', field: 'Finca El Paraíso', stage: 'Fructificación', progress: 72, plantedAt: '2026-01-12', health: 'Óptimo', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=85' },
    { id: 'crop-2', name: 'Maíz', variety: 'ICA V-109', field: 'Lote Norte', stage: 'Crecimiento', progress: 48, plantedAt: '2026-02-03', health: 'Atención', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=85' },
    { id: 'crop-3', name: 'Papa', variety: 'Criolla', field: 'Parcela La Esperanza', stage: 'Desarrollo', progress: 61, plantedAt: '2026-01-27', health: 'Óptimo', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=85' },
    { id: 'crop-4', name: 'Lechuga', variety: 'Batavia', field: 'Finca El Paraíso', stage: 'Germinación', progress: 24, plantedAt: '2026-03-10', health: 'Crítico', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=85' }
  ],
  sensors: [
    { id: 'sensor-1', name: 'Sensor Suelo 01', field: 'Finca El Paraíso', type: 'Humedad del suelo', value: 68, unit: '%', status: 'En línea', updatedAt: 'Hace 2 min' },
    { id: 'sensor-2', name: 'Sensor Clima 02', field: 'Finca El Paraíso', type: 'Temperatura', value: 24.5, unit: '°C', status: 'En línea', updatedAt: 'Hace 5 min' },
    { id: 'sensor-3', name: 'Sensor Suelo 03', field: 'Lote Norte', type: 'Humedad del suelo', value: 34, unit: '%', status: 'Alerta', updatedAt: 'Hace 1 min' }
  ],

  // ── Módulos del Trabajador / Operario ─────────────────────────────────────
  activities: [
    { id: 'act-1', title: 'Revisión del sistema de riego', farmId: 'field-1', assignedTo: 'Diego Fajardo', date: '2026-11-12', status: 'En progreso', createdAt: '2026-11-01T10:00:00Z' },
    { id: 'act-2', title: 'Inspección de hojas por plagas', farmId: 'field-2', assignedTo: 'Juan Murillo', date: '2026-11-13', status: 'Pendiente', createdAt: '2026-11-02T08:00:00Z' },
    { id: 'act-3', title: 'Aplicación de fertilizante foliar', farmId: 'field-3', assignedTo: 'Diego Fajardo', date: '2026-11-14', status: 'Pendiente', createdAt: '2026-11-03T09:00:00Z' }
  ],
  tasks: [
    { id: 'task-1', title: 'Preparar fertilización de maíz', farmId: 'field-2', assignedTo: 'Diego Fajardo', dueDate: '2026-11-14', priority: 'Alta', status: 'Pendiente', createdAt: '2026-11-01T10:00:00Z' },
    { id: 'task-2', title: 'Limpiar canal de drenaje', farmId: 'field-2', assignedTo: 'Diego Fajardo', dueDate: '2026-11-15', priority: 'Media', status: 'Pendiente', createdAt: '2026-11-02T10:00:00Z' },
    { id: 'task-3', title: 'Revisar tuberías de goteo', farmId: 'field-1', assignedTo: 'Juan Murillo', dueDate: '2026-11-16', priority: 'Baja', status: 'Pendiente', createdAt: '2026-11-03T10:00:00Z' }
  ],
  harvests: [
    { id: 'harv-1', crop: 'Tomate', farmId: 'field-1', date: '2026-11-08', quantityKg: 340, quality: 'Primera', createdAt: '2026-11-08T14:00:00Z' },
    { id: 'harv-2', crop: 'Papa', farmId: 'field-3', date: '2026-11-10', quantityKg: 580, quality: 'Segunda', createdAt: '2026-11-10T11:00:00Z' }
  ],
  news: [
    { id: 'news-1', title: 'Fuga menor en válvula de riego', farmId: 'field-2', reportedBy: 'Diego Fajardo', date: '2026-11-12', description: 'Se aisló la válvula y quedó pendiente el reemplazo. Requiere herramienta especializada.', createdAt: '2026-11-12T09:00:00Z' },
    { id: 'news-2', title: 'Daño en cerca perimetral sección norte', farmId: 'field-3', reportedBy: 'Juan Murillo', date: '2026-11-11', description: 'Se detectó una sección de cerca derribada que podría permitir el ingreso de animales.', createdAt: '2026-11-11T16:00:00Z' }
  ]
};
