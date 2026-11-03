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
  ]
};
