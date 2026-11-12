<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { MODULE_BY_ID } from '../backend/models/modules';
import { canAccessModule } from '../backend/models/roles';
import { useAuthStore } from '../stores/auth';
import { usePlatformStore } from '../stores/platform';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const platform = usePlatformStore();
const config = MODULE_BY_ID.farms;
const farms = () => platform.collections.farms || [];
const filter = ref('');
const formOpen = ref(false);
const detailsOpen = ref(false);
const saving = ref(false);
const deleteConfirmOpen = ref(false);
const deleting = ref(false);
const details = ref(null);
const pendingDelete = ref(null);
const editingFarmId = ref(null);
const form = reactive({ name: '', location: '', areaHa: '', latitude: '', longitude: '' });

function resetForm() {
  Object.keys(form).forEach((key) => { form[key] = ''; });
}

function openCreateForm() {
  editingFarmId.value = null;
  resetForm();
  formOpen.value = true;
}

function openEditForm(farm) {
  editingFarmId.value = farm.id;
  Object.keys(form).forEach((key) => { form[key] = farm[key] ?? ''; });
  formOpen.value = true;
}

function notifyMissing() {
  $q.notify({ type: 'negative', message: 'Error: No llenaste todos los campos del formulario', position: 'top' });
}

function required(value) {
  return String(value ?? '').trim().length > 0 || 'Este campo es obligatorio';
}

async function load() {
  try {
    platform.load('farms', auth.user.role);
    if (canAccessModule(auth.user.role, 'crops')) platform.load('crops', auth.user.role);
    if (canAccessModule(auth.user.role, 'sensors')) platform.load('sensors', auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las fincas.' });
  }
}

function showDetails(farmId) {
  try {
    details.value = platform.getFarmDetails(farmId, auth.user.role);
    detailsOpen.value = true;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });
  }
}

async function saveFarm() {
  if (Object.values(form).some((value) => String(value ?? '').trim() === '')) {
    notifyMissing();
    return;
  }
  saving.value = true;
  try {
    const values = {
      ...form,
      areaHa: Number(form.areaHa),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    };
    if (editingFarmId.value) {
      platform.update('farms', editingFarmId.value, values, auth.user.role);
    } else {
      platform.create('farms', values, auth.user.role);
    }
    $q.notify({
      type: 'positive',
      message: editingFarmId.value ? 'Finca actualizada correctamente' : 'Finca creada correctamente',
      position: 'top'
    });
    formOpen.value = false;
    editingFarmId.value = null;
    resetForm();
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo guardar la finca.', position: 'top' });
  } finally {
    saving.value = false;
  }
}

function requestDelete(farm) {
  pendingDelete.value = farm;
  deleteConfirmOpen.value = true;
}

function deleteFarm() {
  if (!pendingDelete.value) return;
  deleting.value = true;
  try {
    platform.remove('farms', pendingDelete.value.id, auth.user.role);
    $q.notify({ type: 'positive', message: 'Finca eliminada correctamente', position: 'top' });
    deleteConfirmOpen.value = false;
    pendingDelete.value = null;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo eliminar la finca.', position: 'top' });
  } finally {
    deleting.value = false;
  }
}

watch(() => route.query.detail, (farmId) => {
  if (farmId) showDetails(String(farmId));
}, { immediate: true });

watch(detailsOpen, (isOpen) => {
  if (!isOpen && route.query.detail) router.replace({ name: 'farms' });
});

onMounted(load);
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <div><div class="eyebrow">GESTIÓN DE PROPIEDADES</div><h1>Mis fincas</h1><p>Ubicación, superficie y estado de tus fincas.</p></div>
      <q-btn color="primary" unelevated no-caps icon="add_location_alt" label="Registrar finca" @click="openCreateForm" />
    </div>

    <div class="farm-toolbar">
      <div class="farm-count"><strong>{{ farms().length }}</strong><span>fincas en tu espacio</span></div>
      <q-input v-model="filter" dense outlined rounded class="table-search" placeholder="Buscar por nombre o ubicación">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="platform.loading && !farms().length" class="row q-col-gutter-md">
      <div v-for="item in 3" :key="item" class="col-12 col-md-6 col-xl-4"><q-skeleton height="265px" class="rounded-borders" /></div>
    </div>
    <div v-else-if="!farms().length" class="empty-state">
      <q-icon name="landscape" />
      <h2>Aún no tienes fincas registradas</h2>
      <p>Registra tu primera finca para asociar cultivos y sensores.</p>
      <q-btn color="primary" unelevated no-caps icon="add" label="Registrar finca" @click="openCreateForm" />
    </div>
    <div v-else class="row q-col-gutter-lg">
      <div v-for="farm in farms().filter(item => `${item.name} ${item.location}`.toLowerCase().includes(filter.toLowerCase()))" :key="farm.id" class="col-12 col-md-6 col-xl-4">
        <q-card flat bordered class="farm-card">
          <div class="farm-card__banner">
            <div class="farm-card__landscape"><q-icon name="landscape" /></div>
            <q-badge rounded :color="farm.status === 'Saludable' ? 'green-1' : 'orange-1'" :text-color="farm.status === 'Saludable' ? 'positive' : 'warning'">{{ farm.status }}</q-badge>
          </div>
          <q-card-section class="farm-card__body">
            <div class="farm-card__title">{{ farm.name }}</div>
            <div class="farm-card__location"><q-icon name="place" /> {{ farm.location }}</div>
            <div class="farm-card__metrics">
              <div><span>SUPERFICIE</span><strong>{{ farm.areaHa }} <small>ha</small></strong></div>
              <div><span>CULTIVOS</span><strong>{{ platform.collections.crops?.filter(crop => crop.farmId === farm.id).length || 0 }}</strong></div>
              <div><span>SENSORES</span><strong>{{ platform.collections.sensors?.filter(sensor => sensor.farmId === farm.id).length || 0 }}</strong></div>
            </div>
            <div class="farm-card__actions">
              <q-btn outline no-caps color="primary" class="farm-card__details" icon-right="arrow_forward" label="Ver detalles" @click="showDetails(farm.id)" />
              <q-btn outline no-caps color="primary" icon="edit" label="Editar" :aria-label="`Editar finca ${farm.name}`" @click="openEditForm(farm)" />
              <q-btn outline no-caps color="negative" icon="delete" label="Eliminar" :aria-label="`Eliminar finca ${farm.name}`" @click="requestDelete(farm)" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="formOpen">
      <q-card class="dialog-card farm-form-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon name="add_location_alt" /></div>
          <div><div class="text-h6">{{ editingFarmId ? 'Editar finca' : 'Registrar finca' }}</div><div class="text-caption text-grey-7">Completa la información para guardar tu finca.</div></div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar formulario" />
        </q-card-section>
        <q-form @submit.prevent="saveFarm" @validation-error="notifyMissing">
          <q-card-section class="farm-form-grid">
            <q-input v-for="field in config.fields" :key="field.key" v-model="form[field.key]" :label="field.label" :type="field.type || 'text'" :min="field.min" :max="field.max" :step="field.type === 'number' ? 'any' : undefined" outlined :rules="[required]" :class="{ 'field-wide': field.key === 'name' || field.key === 'location' }">
              <template v-if="field.type === 'number'" #prepend><q-icon :name="field.key === 'areaHa' ? 'square_foot' : 'my_location'" /></template>
            </q-input>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps icon="save" :label="editingFarmId ? 'Guardar cambios' : 'Guardar finca'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailsOpen" position="right">
      <q-card v-if="details" class="farm-details-panel">
        <div class="farm-details-cover"><q-btn flat round dense icon="close" class="farm-details-close" aria-label="Cerrar detalles" @click="detailsOpen = false" /><div class="farm-details-cover__icon"><q-icon name="landscape" /></div><div class="farm-details-cover__label">FICHA DE PROPIEDAD</div><h2>{{ details.farm.name }}</h2><p><q-icon name="place" /> {{ details.farm.location }}</p></div>
        <q-card-section class="farm-details-content">
          <div class="details-section-title">Información de la finca</div>
          <div class="details-info-grid">
            <div><span>Área</span><strong>{{ details.farm.areaHa }} ha</strong></div>
            <div><span>Estado</span><strong>{{ details.farm.status }}</strong></div>
            <div><span>Latitud</span><strong>{{ details.farm.latitude }}</strong></div>
            <div><span>Longitud</span><strong>{{ details.farm.longitude }}</strong></div>
          </div>
          <a class="map-link" :href="`https://www.google.com/maps?q=${details.farm.latitude},${details.farm.longitude}`" target="_blank" rel="noopener noreferrer"><q-icon name="open_in_new" /> Ver coordenadas en el mapa</a>
          <div class="details-section-title q-mt-lg">Cultivos asociados <q-badge color="green-1" text-color="primary">{{ details.crops.length }}</q-badge></div>
          <div v-if="details.crops.length" class="related-list">
            <div v-for="crop in details.crops" :key="crop.id" class="related-item"><div class="related-icon related-icon--crop"><q-icon name="grass" /></div><div><strong>{{ crop.name }} · {{ crop.variety }}</strong><span>{{ crop.stage }} · {{ crop.progress }}% de progreso</span></div></div>
          </div>
          <div v-else class="related-empty">Todavía no hay cultivos asociados.</div>
          <div class="details-section-title q-mt-lg">Sensores vinculados <q-badge color="blue-1" text-color="blue-8">{{ details.sensors.length }}</q-badge></div>
          <div v-if="details.sensors.length" class="related-list">
            <div v-for="sensor in details.sensors" :key="sensor.id" class="related-item"><div class="related-icon related-icon--sensor"><q-icon name="sensors" /></div><div><strong>{{ sensor.name }}</strong><span>{{ sensor.type }} · {{ sensor.value }} {{ sensor.unit }} · {{ sensor.status }}</span></div></div>
          </div>
          <div v-else class="related-empty">Todavía no hay sensores vinculados.</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteConfirmOpen" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon text-negative"><q-icon name="delete" /></div>
          <div><div class="text-h6">Eliminar finca</div><div class="text-caption text-grey-7">¿Seguro que deseas eliminar «{{ pendingDelete?.name }}»?</div></div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2 text-grey-8">
          La acción no se puede deshacer. Si tiene registros asociados, primero tendrás que reasignarlos o eliminarlos.
        </q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat no-caps label="Cancelar" :disable="deleting" @click="deleteConfirmOpen = false; pendingDelete = null" />
          <q-btn color="negative" unelevated no-caps icon="delete" label="Eliminar finca" :loading="deleting" @click="deleteFarm" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
