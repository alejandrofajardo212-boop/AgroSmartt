<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { MODULE_BY_ID } from '../backend/models/modules';
import { useAuthStore } from '../stores/auth';
import { usePlatformStore } from '../stores/platform';

const props = defineProps({ moduleId: { type: String, required: true } });
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const platform = usePlatformStore();
const $q = useQuasar();
const filter = ref('');
const formOpen = ref(false);
const detailsOpen = ref(false);
const deleteConfirmOpen = ref(false);
const saving = ref(false);
const deleting = ref(false);
const selected = ref(null);
const pendingDelete = ref(null);
const editingId = ref(null);
const form = reactive({});

const config = computed(() => MODULE_BY_ID[props.moduleId]);
const rows = computed(() => platform.collections[props.moduleId] || []);
const filteredRows = computed(() => rows.value.filter((row) =>
  Object.values(row).some((value) => String(value).toLowerCase().includes(filter.value.toLowerCase()))
));
const titleKey = computed(() => config.value.fields.find((field) => ['title', 'name', 'concept', 'crop'].includes(field.key))?.key);
const canEdit = computed(() => !config.value.readOnly && props.moduleId !== 'users');
const canDelete = computed(() => !config.value.readOnly && props.moduleId !== 'users');

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);
}

function openCreateForm() {
  editingId.value = null;
  resetForm();
  formOpen.value = true;
}

function openEditForm(row) {
  editingId.value = row.id;
  resetForm();
  for (const field of config.value.fields) {
    form[field.key] = row[field.key] ?? '';
  }
  formOpen.value = true;
}

function requestDelete(row) {
  pendingDelete.value = row;
  deleteConfirmOpen.value = true;
}

function deleteRecord() {
  if (!pendingDelete.value) return;
  deleting.value = true;
  try {
    platform.remove(props.moduleId, pendingDelete.value.id, auth.user.role);
    $q.notify({
      type: 'positive',
      message: `${config.value.singular} eliminado correctamente`,
      position: 'top'
    });
    deleteConfirmOpen.value = false;
    pendingDelete.value = null;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo eliminar el registro.', position: 'top' });
  } finally {
    deleting.value = false;
  }
}

function required(value) {
  return String(value ?? '').trim().length > 0 || 'Este campo es obligatorio';
}

function notifyMissing() {
  $q.notify({ type: 'negative', message: 'Error: No llenaste todos los campos del formulario', position: 'top' });
}

function farmOptions() {
  return platform.farmsForSelect.map((farm) => ({ label: farm.name, value: farm.id }));
}

function farmName(farmId) {
  return platform.farmsForSelect.find((farm) => farm.id === farmId)?.name || 'Finca sin asignar';
}

function displayValue(field, value) {
  if (field.key === 'farmId') return farmName(value);
  if (field.key === 'amount') return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
  if (field.key === 'progress') return `${value}%`;
  return value;
}

function openDetails(row) {
  selected.value = row;
  detailsOpen.value = true;
}

function openRouteDetails() {
  const row = rows.value.find((item) => item.id === route.query.detail);
  if (row) openDetails(row);
}

function load() {
  try {
    platform.load(props.moduleId, auth.user.role);
    openRouteDetails();
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar los datos.' });
  }
}

async function save() {
  if (config.value.fields.some((field) => field.required && String(form[field.key] ?? '').trim() === '')) {
    notifyMissing();
    return;
  }
  saving.value = true;
  try {
    const values = Object.fromEntries(config.value.fields.map((field) => [
      field.key,
      field.type === 'number' ? Number(form[field.key]) : form[field.key]
    ]));
    if (editingId.value) platform.update(props.moduleId, editingId.value, values, auth.user.role);
    else if (props.moduleId === 'users') await platform.createUser(values, auth.user.role);
    else platform.create(props.moduleId, values, auth.user.role);
    $q.notify({
      type: 'positive',
      message: editingId.value
        ? `${config.value.singular} actualizado correctamente`
        : `${config.value.singular} creado correctamente`,
      position: 'top'
    });
    formOpen.value = false;
    editingId.value = null;
    resetForm();
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo guardar la información.', position: 'top' });
  } finally {
    saving.value = false;
  }
}

watch(() => props.moduleId, () => {
  selected.value = null;
  detailsOpen.value = false;
  load();
});
watch(() => route.query.detail, (id) => {
  if (id) openRouteDetails();
  else {
    selected.value = null;
    detailsOpen.value = false;
  }
});
watch(detailsOpen, (isOpen) => {
  if (!isOpen && route.query.detail && route.name === props.moduleId) {
    router.replace({ name: props.moduleId });
  }
});
onMounted(load);
</script>

<template>
  <div v-if="config" class="dashboard-page resource-page">
    <div class="page-heading">
      <div><div class="eyebrow">GESTIÓN AGROSMART</div><h1>{{ config.label }}</h1><p>{{ config.description }}</p></div>
      <q-btn v-if="!config.readOnly" color="primary" unelevated no-caps icon="add" :label="`Agregar ${config.singular.toLowerCase()}`" @click="openCreateForm" />
    </div>

    <div class="resource-toolbar">
      <div class="farm-count"><strong>{{ rows.length }}</strong><span>{{ config.label.toLowerCase() }} registrados</span></div>
      <q-input v-model="filter" dense outlined rounded class="table-search" placeholder="Buscar en este módulo">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div v-if="platform.loading && !rows.length" class="row q-col-gutter-md">
      <div v-for="item in 3" :key="item" class="col-12 col-md-6 col-xl-4"><q-skeleton height="228px" class="rounded-borders" /></div>
    </div>
    <div v-else-if="!filteredRows.length" class="empty-state">
      <q-icon :name="config.icon" />
      <h2>{{ filter ? 'No encontramos resultados' : `Aún no hay ${config.label.toLowerCase()}` }}</h2>
      <p>{{ filter ? 'Prueba con otro término de búsqueda.' : 'Cuando registres información, aparecerá aquí.' }}</p>
      <q-btn v-if="!config.readOnly && !filter" color="primary" unelevated no-caps icon="add" :label="`Agregar ${config.singular.toLowerCase()}`" @click="openCreateForm" />
    </div>
    <div v-else class="row q-col-gutter-lg">
      <div v-for="row in filteredRows" :key="row.id" class="col-12 col-md-6 col-xl-4">
        <q-card flat bordered class="resource-card">
          <div class="resource-card__top">
            <div class="resource-card__icon"><q-icon :name="config.icon" /></div>
            <q-badge v-if="row.status || row.priority || row.severity" rounded :color="['Alerta', 'Alta', 'Crítico'].includes(row.status || row.priority || row.severity) ? 'orange-1' : 'green-1'" :text-color="['Alerta', 'Alta', 'Crítico'].includes(row.status || row.priority || row.severity) ? 'warning' : 'positive'">{{ row.status || row.priority || row.severity }}</q-badge>
          </div>
          <q-card-section class="resource-card__body">
            <div class="resource-card__title">{{ row[titleKey] || row.name }}</div>
            <div v-if="row.role" class="resource-card__subtitle">{{ row.role }}</div>
            <div v-else-if="row.farmId" class="resource-card__subtitle"><q-icon name="place" /> {{ farmName(row.farmId) }}</div>
            <div v-else-if="row.email" class="resource-card__subtitle">{{ row.email }}</div>
            <div class="resource-card__preview">
              <template v-for="field in config.fields.filter(field => field.key !== titleKey && field.key !== 'password').slice(0, 3)" :key="field.key">
                <span><strong>{{ field.label }}:</strong> {{ displayValue(field, row[field.key]) }}</span>
              </template>
              <span v-if="config.readOnly && row.email"><strong>Correo:</strong> {{ row.email }}</span>
            </div>
            <div class="resource-card__actions">
              <q-btn outline no-caps color="primary" class="resource-card__details" icon-right="arrow_forward" label="Ver detalles" @click="openDetails(row)" />
              <q-btn v-if="canEdit" outline no-caps color="primary" icon="edit" label="Editar" :aria-label="`Editar ${config.singular.toLowerCase()}: ${row[titleKey] || row.name}`" @click="openEditForm(row)" />
              <q-btn v-if="canDelete" outline no-caps color="negative" icon="delete" label="Eliminar" :aria-label="`Eliminar ${config.singular.toLowerCase()}: ${row[titleKey] || row.name}`" @click="requestDelete(row)" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="formOpen">
      <q-card class="dialog-card resource-form-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon :name="config.icon" /></div>
          <div><div class="text-h6">{{ editingId ? `Editar ${config.singular.toLowerCase()}` : `Agregar ${config.singular.toLowerCase()}` }}</div><div class="text-caption text-grey-7">{{ editingId ? 'Actualiza los campos que necesites.' : 'Completa todos los campos para guardar.' }}</div></div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar formulario" />
        </q-card-section>
        <q-form @submit.prevent="save" @validation-error="notifyMissing">
          <q-card-section class="resource-form-grid">
            <template v-for="field in config.fields" :key="field.key">
              <q-select v-if="field.type === 'farm'" v-model="form[field.key]" :label="field.label" :options="farmOptions()" outlined emit-value map-options :rules="[required]" />
              <q-select v-else-if="field.options" v-model="form[field.key]" :label="field.label" :options="field.options" outlined :rules="[required]" />
              <q-input v-else v-model="form[field.key]" :label="field.label" :type="field.type === 'textarea' ? 'textarea' : field.type || 'text'" :min="field.min" :max="field.max" :step="field.type === 'number' ? 'any' : undefined" outlined :rules="[required, ...(field.minLength ? [value => value.length >= field.minLength || `Usa al menos ${field.minLength} caracteres`] : [])]" :class="{ 'field-wide': field.type === 'textarea' }" />
            </template>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps icon="save" :label="editingId ? 'Guardar cambios' : 'Guardar'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailsOpen">
      <q-card v-if="selected" class="dialog-card resource-details-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon :name="config.icon" /></div>
          <div><div class="text-h6">{{ selected[titleKey] || selected.name }}</div><div class="text-caption text-grey-7">{{ config.singular }} · Información detallada</div></div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar detalles" />
        </q-card-section>
        <q-separator />
        <q-card-section class="resource-detail-list">
          <div v-for="field in config.fields.filter(item => item.key !== 'password')" :key="field.key" class="resource-detail-row">
            <span>{{ field.label }}</span><strong>{{ displayValue(field, selected[field.key]) || '—' }}</strong>
          </div>
          <template v-if="config.readOnly">
            <div class="resource-detail-row"><span>Correo electrónico</span><strong>{{ selected.email }}</strong></div>
            <div class="resource-detail-row"><span>Rol de acceso</span><strong>{{ selected.role }}</strong></div>
          </template>
          <div v-if="selected.id" class="resource-detail-row"><span>Identificador</span><strong class="detail-id">{{ selected.id }}</strong></div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteConfirmOpen" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon text-negative"><q-icon name="delete" /></div>
          <div><div class="text-h6">Eliminar {{ config.singular.toLowerCase() }}</div><div class="text-caption text-grey-7">¿Seguro que deseas eliminar «{{ pendingDelete?.[titleKey] || pendingDelete?.name }}»?</div></div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2 text-grey-8">La acción no se puede deshacer.</q-card-section>
        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat no-caps label="Cancelar" :disable="deleting" @click="deleteConfirmOpen = false; pendingDelete = null" />
          <q-btn color="negative" unelevated no-caps icon="delete" label="Eliminar" :loading="deleting" @click="deleteRecord" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
