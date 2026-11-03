<script setup>
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useResourcesStore } from '../stores/resources';
import { getApiError } from '../api/client';

const resources = useResourcesStore();
const $q = useQuasar();
onMounted(async () => {
  try { await resources.load('crops'); }
  catch (error) { $q.notify({ type: 'negative', message: getApiError(error) }); }
});
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading"><div><div class="eyebrow">CICLOS DE CULTIVO</div><h1>Mis cultivos</h1><p>Monitorea el crecimiento y la salud de cada cultivo.</p></div><q-btn color="primary" unelevated no-caps icon="add" label="Nuevo cultivo" @click="$q.notify({ message: 'El registro de cultivos estará disponible próximamente.' })" /></div>
    <div class="crop-summary row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>Cultivos activos</span><div class="stat-card__icon tone-green"><q-icon name="grass" /></div></div><div class="stat-card__value">{{ resources.crops.length }}</div><div class="stat-card__change">En distintas etapas</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>Salud óptima</span><div class="stat-card__icon tone-blue"><q-icon name="favorite" /></div></div><div class="stat-card__value">{{ resources.crops.filter(crop => crop.health === 'Óptimo').length }}</div><div class="stat-card__change">Cultivos saludables</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card flat bordered class="stat-card"><div class="stat-card__top"><span>Requieren atención</span><div class="stat-card__icon tone-red"><q-icon name="warning_amber" /></div></div><div class="stat-card__value">{{ resources.crops.filter(crop => crop.health !== 'Óptimo').length }}</div><div class="stat-card__change">Revisa sus condiciones</div></q-card></div>
    </div>
    <div class="row q-col-gutter-md crop-grid">
      <div v-for="crop in resources.crops" :key="crop.id" class="col-12 col-sm-6 col-lg-3">
        <q-card flat bordered class="crop-card">
          <div class="crop-image" :style="{ backgroundImage: `url(${crop.image})` }"><q-badge floating rounded :color="crop.health === 'Óptimo' ? 'green-1' : crop.health === 'Atención' ? 'orange-1' : 'red-1'" :text-color="crop.health === 'Óptimo' ? 'positive' : crop.health === 'Atención' ? 'warning' : 'negative'">{{ crop.health }}</q-badge></div>
          <q-card-section>
            <div class="crop-title">{{ crop.name }}</div><div class="crop-subtitle">{{ crop.variety }} · {{ crop.field }}</div>
            <div class="crop-progress-label"><span>{{ crop.stage }}</span><strong>{{ crop.progress }}%</strong></div>
            <q-linear-progress rounded size="7px" :value="crop.progress / 100" color="positive" track-color="green-1" />
            <div class="crop-footer"><span><q-icon name="calendar_today" /> Desde {{ crop.plantedAt }}</span><q-btn flat round dense icon="arrow_forward" color="primary" aria-label="Ver cultivo" /></div>
          </q-card-section>
        </q-card>
      </div>
      <div v-if="resources.loading" class="col-12"><q-skeleton height="240px" /></div>
    </div>
  </div>
</template>
