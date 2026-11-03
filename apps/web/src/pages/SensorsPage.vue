<script setup>
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useResourcesStore } from '../stores/resources';
import { getApiError } from '../api/client';

const resources = useResourcesStore();
const $q = useQuasar();
onMounted(async () => {
  try { await resources.load('sensors'); }
  catch (error) { $q.notify({ type: 'negative', message: getApiError(error) }); }
});
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading"><div><div class="eyebrow">MONITOREO EN TIEMPO REAL</div><h1>Mis sensores</h1><p>Información precisa para cuidar cada cultivo.</p></div><q-btn color="primary" unelevated no-caps icon="add" label="Agregar sensor" @click="$q.notify({ message: 'La vinculación de sensores estará disponible próximamente.' })" /></div>
    <div class="sensor-summary row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>Sensores registrados</span><div class="stat-card__icon tone-blue"><q-icon name="sensors" /></div></div><div class="stat-card__value">{{ resources.sensors.length }}</div><div class="stat-card__change">En todos tus terrenos</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>En línea</span><div class="stat-card__icon tone-green"><q-icon name="wifi" /></div></div><div class="stat-card__value">{{ resources.sensors.filter(sensor => sensor.status === 'En línea').length }}</div><div class="stat-card__change">Transmitiendo datos</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>Alertas</span><div class="stat-card__icon tone-red"><q-icon name="warning_amber" /></div></div><div class="stat-card__value">{{ resources.sensors.filter(sensor => sensor.status === 'Alerta').length }}</div><div class="stat-card__change">Requieren revisión</div></q-card></div>
    </div>
    <div class="row q-col-gutter-md">
      <div v-for="sensor in resources.sensors" :key="sensor.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="sensor-card">
          <div class="section-heading"><div class="sensor-name"><div class="sensor-card__icon" :class="sensor.status === 'En línea' ? 'tone-green' : 'tone-red'"><q-icon :name="sensor.type.includes('Temperatura') ? 'device_thermostat' : 'water_drop'" /></div><div><h2>{{ sensor.name }}</h2><p>{{ sensor.field }}</p></div></div><q-badge rounded :color="sensor.status === 'En línea' ? 'green-1' : 'red-1'" :text-color="sensor.status === 'En línea' ? 'positive' : 'negative'">{{ sensor.status }}</q-badge></div>
          <div class="sensor-reading"><span>{{ sensor.type }}</span><strong>{{ sensor.value }}<small>{{ sensor.unit }}</small></strong></div>
          <div class="sensor-updated"><q-icon name="schedule" /> Actualizado {{ sensor.updatedAt }}</div>
        </q-card>
      </div>
      <div v-if="resources.loading" class="col-12"><q-skeleton height="180px" /></div>
    </div>
  </div>
</template>
