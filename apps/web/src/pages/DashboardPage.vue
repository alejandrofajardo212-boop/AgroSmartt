<script setup>
import { computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { MODULES, WORKER_MODULES } from '../backend/models/modules';
import { ROLES } from '../backend/models/roles';
import { useAuthStore } from '../stores/auth';
import { usePlatformStore } from '../stores/platform';

const auth = useAuthStore();
const platform = usePlatformStore();
const $q = useQuasar();
const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const availableModules = computed(() => {
  if (auth.user?.role === ROLES.WORKER) return WORKER_MODULES;
  return MODULES.filter((item) => item.roles.includes(auth.user?.role) || auth.user?.role === ROLES.ADMIN);
});

const cards = computed(() => {
  const data = platform.dashboard || {};
  const money = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
  if (auth.user?.role === ROLES.WORKER) {
    return [
      { label: 'Tareas pendientes', value: data.pendingTasks, icon: 'task_alt', tone: 'gold', change: 'Asignadas al equipo' },
      { label: 'Actividades', value: data.activities, icon: 'event_note', tone: 'blue', change: 'En el plan de trabajo' },
      { label: 'Cosechas registradas', value: data.harvests, icon: 'agriculture', tone: 'green', change: 'Registros de producción' },
      { label: 'Novedades', value: data.news, icon: 'campaign', tone: 'red', change: 'Reportes del equipo' }
    ];
  }
  if (auth.user?.role === ROLES.AGRONOMIST) {
    return [
      { label: 'Cultivos monitoreados', value: data.crops, icon: 'grass', tone: 'green', change: 'En tus fincas' },
      { label: 'Recomendaciones', value: data.recommendations, icon: 'lightbulb', tone: 'gold', change: 'Criterios técnicos' },
      { label: 'Reportes fitosanitarios', value: data.pests, icon: 'pest_control', tone: 'red', change: 'Plagas y enfermedades' },
      { label: 'Sensores en alerta', value: data.alerts, icon: 'sensors', tone: 'blue', change: 'Revisión técnica' }
    ];
  }
  if (auth.user?.role === ROLES.ACCOUNTANT) {
    return [
      { label: 'Ingresos registrados', value: money(data.income), icon: 'trending_up', tone: 'green', change: 'Ventas e ingresos' },
      { label: 'Gastos registrados', value: money(data.expenses), icon: 'payments', tone: 'red', change: 'Egresos operativos' },
      { label: 'Costos de producción', value: money(data.costs), icon: 'account_balance_wallet', tone: 'gold', change: 'Costos agrícolas' },
      { label: 'Balance', value: money(data.income - data.expenses - data.costs), icon: 'account_balance', tone: 'blue', change: 'Ingresos menos costos' }
    ];
  }
  return [
    { label: 'Fincas registradas', value: data.farms, icon: 'map', tone: 'green', change: 'Parcelas agrícolas' },
    { label: 'Cultivos activos', value: data.crops, icon: 'grass', tone: 'gold', change: 'En distintos ciclos' },
    { label: 'Sensores vinculados', value: data.sensors, icon: 'sensors', tone: 'blue', change: 'Monitoreo del campo' },
    { label: 'Alertas de sensores', value: data.alerts, icon: 'notifications_active', tone: 'red', change: 'Requieren atención' }
  ];
});

onMounted(() => {
  try {
    platform.loadDashboard(auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo cargar el resumen.' });
  }
});
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow">{{ today.toLocaleUpperCase('es-CO') }}</div>
        <h1>Hola, {{ auth.user?.name?.split(' ')[0] }}</h1>
        <p>Este es tu espacio de trabajo como {{ auth.user?.role }}.<span v-if="auth.user?.role === ROLES.WORKER"> Accede a tus 4 módulos operativos desde los accesos directos.</span></p>
      </div>
      <q-badge class="role-badge" color="green-1" text-color="primary"><q-icon name="verified_user" /> {{ auth.user?.role }}</q-badge>
    </div>

    <div class="row q-col-gutter-md dashboard-stats">
      <div v-for="card in cards" :key="card.label" class="col-12 col-sm-6 col-xl-3">
        <q-card flat bordered class="stat-card" :class="`stat-card--${card.tone}`">
          <div class="stat-card__top"><span>{{ card.label }}</span><div class="stat-card__icon" :class="`tone-${card.tone}`"><q-icon :name="card.icon" /></div></div>
          <div class="stat-card__value">{{ card.value }}</div>
          <div class="stat-card__change">{{ card.change }}</div>
        </q-card>
      </div>
    </div>

    <section class="workspace-section">
      <div class="section-heading">
        <div><h2>Tu espacio de trabajo</h2><p>Módulos disponibles para tu perfil</p></div>
      </div>
      <div class="row q-col-gutter-md">
        <div v-for="module in availableModules" :key="module.id" class="col-12 col-sm-6 col-lg-4">
          <q-card flat bordered class="module-shortcut" :to="module.path" clickable>
            <div class="module-shortcut__icon"><q-icon :name="module.icon" /></div>
            <div class="module-shortcut__copy"><strong>{{ module.label }}</strong><span>{{ module.description }}</span></div>
            <q-icon class="module-shortcut__arrow" name="arrow_forward" />
          </q-card>
        </div>
      </div>
    </section>

    <section v-if="platform.dashboard?.recentFarms?.length" class="workspace-section">
      <div class="section-heading">
        <div><h2>Fincas recientes</h2><p>Acceso rápido a los detalles de tus propiedades.</p></div>
        <q-btn flat no-caps color="primary" label="Ver todas" to="/terrenos" />
      </div>
      <div class="row q-col-gutter-md">
        <div v-for="farm in platform.dashboard.recentFarms" :key="farm.id" class="col-12 col-md-4">
          <q-card flat bordered class="farm-summary-card">
            <div class="farm-summary-card__icon"><q-icon name="landscape" /></div>
            <div class="farm-summary-card__name">{{ farm.name }}</div>
            <div class="farm-summary-card__location">{{ farm.location }} · {{ farm.areaHa }} ha</div>
            <q-btn flat dense no-caps color="primary" label="Ver detalles" :to="{ name: 'farms', query: { detail: farm.id } }" />
          </q-card>
        </div>
      </div>
    </section>
  </div>
</template>
