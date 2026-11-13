<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/auth';
import { usePlatformStore } from '../../stores/platform';

const auth = useAuthStore();
const platform = usePlatformStore();
const $q = useQuasar();

// ── Estado de UI ─────────────────────────────────────────────────────────────
const filter = ref('');
const formOpen = ref(false);
const detailsOpen = ref(false);
const saving = ref(false);
const editingId = ref(null);
const selected = ref(null);
const form = reactive({
  title: '',
  farmId: '',
  reportedBy: '',
  date: '',
  description: ''
});

// ── Datos ─────────────────────────────────────────────────────────────────────
const rows = computed(() => platform.collections['news'] || []);
const filteredRows = computed(() =>
  filter.value
    ? rows.value.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(filter.value.toLowerCase()))
      )
    : rows.value
);
const farmOptions = computed(() =>
  platform.farmsForSelect.map((f) => ({ label: f.name, value: f.id }))
);
function farmName(id) {
  return platform.farmsForSelect.find((f) => f.id === id)?.name || id;
}

// ── Acciones ──────────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null;
  const today = new Date().toISOString().split('T')[0];
  Object.assign(form, {
    title: '',
    farmId: '',
    reportedBy: auth.user?.name || '',
    date: today,
    description: ''
  });
  formOpen.value = true;
}
function openEdit(row) {
  editingId.value = row.id;
  Object.assign(form, {
    title: row.title,
    farmId: row.farmId,
    reportedBy: row.reportedBy,
    date: row.date,
    description: row.description
  });
  formOpen.value = true;
}
function viewDetails(row) {
  selected.value = row;
  detailsOpen.value = true;
}

async function save() {
  if (!form.title || !form.farmId || !form.reportedBy || !form.date || !form.description) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos obligatorios.', position: 'top' });
    return;
  }
  saving.value = true;
  try {
    const values = { ...form };
    if (editingId.value) {
      platform.update('news', editingId.value, values, auth.user.role);
    } else {
      platform.create('news', values, auth.user.role);
    }
    $q.notify({ type: 'positive', message: editingId.value ? 'Novedad actualizada.' : 'Novedad reportada correctamente.', position: 'top' });
    formOpen.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo guardar.', position: 'top' });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  try {
    platform.load('news', auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las novedades.' });
  }
});
</script>

<template>
  <div class="dashboard-page resource-page">
    <!-- Encabezado -->
    <div class="page-heading">
      <div>
        <div class="eyebrow">MÓDULO OPERARIO</div>
        <h1>Novedades en cultivos</h1>
        <p>Reporta incidencias, alertas o eventos relevantes observados en campo.</p>
      </div>
      <q-btn color="primary" unelevated no-caps icon="campaign" label="Reportar novedad" @click="openCreate" />
    </div>

    <!-- Toolbar -->
    <div class="resource-toolbar">
      <div class="farm-count">
        <strong>{{ rows.length }}</strong>
        <span>novedades reportadas</span>
      </div>
      <q-input v-model="filter" dense outlined rounded placeholder="Buscar novedad..." class="table-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- Estado vacío -->
    <div v-if="!filteredRows.length" class="empty-state">
      <q-icon name="campaign" />
      <h2>{{ filter ? 'Sin resultados' : 'Sin novedades reportadas' }}</h2>
      <p>{{ filter ? 'Prueba otro término de búsqueda.' : 'Reporta cualquier incidencia o novedad que observes en el campo.' }}</p>
      <q-btn v-if="!filter" color="primary" unelevated no-caps icon="campaign" label="Reportar novedad" @click="openCreate" />
    </div>

    <!-- Tarjetas de novedades -->
    <div v-else class="row q-col-gutter-lg">
      <div
        v-for="row in filteredRows"
        :key="row.id"
        class="col-12 col-md-6 col-xl-4"
      >
        <q-card flat bordered class="resource-card news-card">
          <div class="resource-card__top">
            <div class="resource-card__icon"><q-icon name="campaign" /></div>
            <q-badge rounded color="orange-1" text-color="warning" label="Novedad" />
          </div>
          <q-card-section class="resource-card__body">
            <div class="resource-card__title">{{ row.title }}</div>
            <div class="resource-card__subtitle">
              <q-icon name="place" />
              {{ farmName(row.farmId) }}
            </div>
            <div class="resource-card__preview">
              <span><strong>Reportado por:</strong> {{ row.reportedBy }}</span>
              <span><strong>Fecha:</strong> {{ row.date }}</span>
              <span class="news-description-preview">{{ row.description }}</span>
            </div>
            <div class="resource-card__actions">
              <q-btn outline no-caps color="primary" class="resource-card__details"
                icon-right="arrow_forward" label="Ver detalle" @click="viewDetails(row)" />
              <q-btn outline no-caps color="primary" icon="edit" label="Editar"
                :aria-label="`Editar novedad: ${row.title}`" @click="openEdit(row)" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Formulario de reporte -->
    <q-dialog v-model="formOpen">
      <q-card class="dialog-card resource-form-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon name="campaign" /></div>
          <div>
            <div class="text-h6">{{ editingId ? 'Editar novedad' : 'Reportar novedad' }}</div>
            <div class="text-caption text-grey-7">Describe la incidencia observada en campo.</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar" />
        </q-card-section>

        <q-form @submit.prevent="save">
          <q-card-section class="resource-form-grid">
            <q-input
              v-model="form.title"
              label="Asunto / Título *"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-select
              v-model="form.farmId"
              label="Finca afectada *"
              :options="farmOptions"
              emit-value
              map-options
              outlined
              :rules="[(v) => !!v || 'Selecciona la finca']"
            />
            <q-input
              v-model="form.reportedBy"
              label="Reportado por *"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.date"
              label="Fecha del reporte *"
              type="date"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.description"
              label="Descripción detallada *"
              type="textarea"
              outlined
              rows="4"
              class="field-wide"
              :rules="[(v) => !!v || 'Describe la novedad']"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps icon="save"
              :label="editingId ? 'Guardar cambios' : 'Reportar novedad'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Modal de detalle -->
    <q-dialog v-model="detailsOpen">
      <q-card v-if="selected" class="dialog-card resource-details-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon name="campaign" /></div>
          <div>
            <div class="text-h6">{{ selected.title }}</div>
            <div class="text-caption text-grey-7">Novedad · Información detallada</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-separator />
        <q-card-section class="resource-detail-list">
          <div class="resource-detail-row"><span>Finca</span><strong>{{ farmName(selected.farmId) }}</strong></div>
          <div class="resource-detail-row"><span>Reportado por</span><strong>{{ selected.reportedBy }}</strong></div>
          <div class="resource-detail-row"><span>Fecha</span><strong>{{ selected.date }}</strong></div>
          <div class="resource-detail-row"><span>Descripción</span><strong>{{ selected.description }}</strong></div>
          <div v-if="selected.id" class="resource-detail-row">
            <span>Identificador</span><strong class="detail-id">{{ selected.id }}</strong>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.news-description-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--q-grey-7, #616161);
  font-size: 0.85rem;
  margin-top: 4px;
}
</style>
