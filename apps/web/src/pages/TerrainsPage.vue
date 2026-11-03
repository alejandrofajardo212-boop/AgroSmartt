<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useResourcesStore } from '../stores/resources';
import { api, getApiError } from '../api/client';
import StatCard from '../components/StatCard.vue';

const resources = useResourcesStore();
const $q = useQuasar();
const filter = ref('');
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ name: '', location: '', areaHa: null });
const columns = [
  { name: 'name', label: 'TERRENO', field: 'name', align: 'left', sortable: true },
  { name: 'location', label: 'UBICACIÓN', field: 'location', align: 'left' },
  { name: 'crop', label: 'CULTIVO', field: 'crop', align: 'left' },
  { name: 'areaHa', label: 'ÁREA', field: 'areaHa', align: 'right' },
  { name: 'moisture', label: 'HUMEDAD', field: 'moisture', align: 'right' },
  { name: 'status', label: 'ESTADO', field: 'status', align: 'left' }
];

async function load() {
  try { await resources.load('terrains'); }
  catch (error) { $q.notify({ type: 'negative', message: getApiError(error) }); }
}
onMounted(load);

async function createTerrain() {
  saving.value = true;
  try {
    await api.post('/terrains', form.value);
    $q.notify({ type: 'positive', message: 'Terreno agregado correctamente.' });
    showDialog.value = false;
    form.value = { name: '', location: '', areaHa: null };
    await load();
  } catch (error) {
    $q.notify({ type: 'negative', message: getApiError(error) });
  } finally { saving.value = false; }
}
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading"><div><div class="eyebrow">GESTIÓN DE PARCELAS</div><h1>Mis terrenos</h1><p>Administra y monitorea tus parcelas agrícolas.</p></div><q-btn color="primary" unelevated no-caps icon="add" label="Agregar terreno" @click="showDialog = true" /></div>
    <div class="terrain-summary row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-4"><StatCard label="Terrenos registrados" :value="resources.terrains.length" icon="map" change="En tu cuenta" /></div>
      <div class="col-12 col-sm-4"><StatCard label="Área total" :value="resources.terrains.reduce((sum, item) => sum + item.areaHa, 0).toFixed(1)" unit=" ha" icon="square_foot" tone="gold" /></div>
      <div class="col-12 col-sm-4"><StatCard label="En buen estado" :value="resources.terrains.filter(item => item.status === 'Saludable').length" icon="check_circle" tone="blue" /></div>
    </div>
    <q-card flat bordered class="content-card table-card">
      <div class="section-heading"><div><h2>Todos los terrenos</h2><p>Información actualizada desde tus sensores</p></div><q-input v-model="filter" dense outlined rounded placeholder="Buscar..." class="table-search"><template #prepend><q-icon name="search" /></template></q-input></div>
      <q-table :rows="resources.terrains" :columns="columns" row-key="id" :filter="filter" :loading="resources.loading" flat :rows-per-page-options="[5, 10, 20]" no-data-label="Aún no tienes terrenos registrados">
        <template #body-cell-name="props"><q-td :props="props"><div class="table-primary">{{ props.value }}</div><div class="table-caption">ID {{ props.row.id }}</div></q-td></template>
        <template #body-cell-status="props"><q-td :props="props"><q-badge rounded :color="props.value === 'Saludable' ? 'green-1' : 'orange-1'" :text-color="props.value === 'Saludable' ? 'positive' : 'warning'">{{ props.value }}</q-badge></q-td></template>
        <template #body-cell-moisture="props"><q-td :props="props">{{ props.value }}%</q-td></template>
      </q-table>
    </q-card>
    <q-dialog v-model="showDialog">
      <q-card class="dialog-card">
        <q-card-section><div class="text-h6">Agregar terreno</div><div class="text-caption text-grey-7">Registra una nueva parcela agrícola.</div></q-card-section>
        <q-form @submit.prevent="createTerrain">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="form.name" label="Nombre del terreno" outlined dense :rules="[value => !!value || 'Campo requerido']" />
            <q-input v-model="form.location" label="Ubicación" outlined dense :rules="[value => !!value || 'Campo requerido']" />
            <q-input v-model.number="form.areaHa" label="Área (hectáreas)" type="number" min="0.1" step="0.1" outlined dense :rules="[value => value > 0 || 'Ingresa un área válida']" />
          </q-card-section>
          <q-card-actions align="right"><q-btn flat no-caps label="Cancelar" v-close-popup /><q-btn type="submit" color="primary" unelevated no-caps label="Guardar terreno" :loading="saving" /></q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
