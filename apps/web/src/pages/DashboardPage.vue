<script setup>
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useDashboardStore } from '../stores/dashboard';
import { getApiError } from '../api/client';
import StatCard from '../components/StatCard.vue';

const dashboard = useDashboardStore();
const $q = useQuasar();
onMounted(async () => {
  try { await dashboard.load(); }
  catch (error) { $q.notify({ type: 'negative', message: getApiError(error) }); }
});

const chartPoints = (values) => values.map((value, index) => `${index * 36},${110 - value}`).join(' ');
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <div><div class="eyebrow">JUEVES, 15 DE OCTUBRE</div><h1>Resumen general</h1><p>Esto es lo que ocurre hoy en tus terrenos.</p></div>
      <q-btn outline no-caps icon="calendar_today" label="Últimos 7 días" class="date-button" />
    </div>

    <div v-if="dashboard.loading && !dashboard.summary" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-xl-3"><q-skeleton height="136px" class="rounded-borders" /></div>
    </div>
    <template v-else-if="dashboard.summary">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-xl-3"><StatCard label="Humedad del suelo" :value="dashboard.summary.kpis.soilMoisture" unit="%" change="↑ 4.2% vs. semana anterior" icon="water_drop" /></div>
        <div class="col-12 col-sm-6 col-xl-3"><StatCard label="Temperatura ambiente" :value="dashboard.summary.kpis.temperature" unit="°C" change="Dentro del rango ideal" icon="device_thermostat" tone="gold" /></div>
        <div class="col-12 col-sm-6 col-xl-3"><StatCard label="Sensores activos" :value="`${dashboard.summary.kpis.activeSensors}/${dashboard.summary.kpis.totalSensors}`" change="Todos los sistemas en línea" icon="sensors" tone="blue" /></div>
        <div class="col-12 col-sm-6 col-xl-3"><StatCard label="Alertas pendientes" :value="dashboard.summary.kpis.alerts" change="1 requiere atención" icon="notifications_active" tone="red" /></div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-xl-8">
          <q-card flat bordered class="content-card chart-card">
            <div class="section-heading"><div><h2>Tendencia de humedad</h2><p>Promedio de tus terrenos</p></div><q-btn flat round dense icon="more_horiz" /></div>
            <div class="chart-legend"><span class="legend-dot"></span> Humedad del suelo <span class="legend-note">· Últimos 7 días</span></div>
            <div class="chart-wrap">
              <div class="chart-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
              <svg class="line-chart" viewBox="0 0 396 120" preserveAspectRatio="none" role="img" aria-label="Gráfico de tendencia de humedad">
                <line v-for="y in [10, 35, 60, 85, 110]" :key="y" x1="0" :y1="y" x2="396" :y2="y" class="chart-grid" />
                <polyline :points="chartPoints(dashboard.summary.moistureHistory)" class="chart-line" />
              </svg>
            </div>
            <div class="chart-labels"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
          </q-card>
        </div>
        <div class="col-12 col-xl-4">
          <q-card flat bordered class="content-card alerts-card">
            <div class="section-heading"><div><h2>Alertas recientes</h2><p>Actualizaciones de tus terrenos</p></div><q-btn flat dense no-caps label="Ver todas" color="primary" /></div>
            <div v-for="alert in dashboard.summary.alerts" :key="alert.id" class="alert-row">
              <div class="alert-icon" :class="`alert-${alert.severity}`"><q-icon :name="alert.severity === 'warning' ? 'water_drop' : 'check_circle'" /></div>
              <div class="alert-copy"><strong>{{ alert.title }}</strong><p>{{ alert.description }}</p><span>{{ alert.time }}</span></div>
            </div>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="content-card terrains-preview">
        <div class="section-heading"><div><h2>Mis terrenos</h2><p>Estado general de tus parcelas</p></div><q-btn to="/terrenos" flat no-caps color="primary" label="Ver terrenos" icon-right="arrow_forward" /></div>
        <div class="row q-col-gutter-md">
          <div v-for="field in dashboard.summary.terrains" :key="field.id" class="col-12 col-md-4">
            <div class="terrain-mini">
              <div class="terrain-mini__icon"><q-icon name="landscape" /></div>
              <div class="terrain-mini__heading"><strong>{{ field.name }}</strong><q-badge :color="field.status === 'Saludable' ? 'green-1' : 'orange-1'" :text-color="field.status === 'Saludable' ? 'positive' : 'warning'">{{ field.status }}</q-badge></div>
              <span>{{ field.location }} · {{ field.areaHa }} ha</span>
              <div class="terrain-mini__stats"><span><q-icon name="water_drop" /> {{ field.moisture }}%</span><span><q-icon name="thermostat" /> {{ field.temperature }}°C</span></div>
            </div>
          </div>
        </div>
      </q-card>
    </template>
  </div>
</template>
