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
const saving = ref(false);
const editingId = ref(null);
const form = reactive({
  title: '',
  farmId: '',
  assignedTo: '',
  date: '',
  status: ''
});

const statusOptions = ['Pendiente', 'En progreso', 'Completada'];

// ── Columnas de la tabla ──────────────────────────────────────────────────────
const columns = [
  { name: 'title',      label: 'Actividad',    field: 'title',      align: 'left',   sortable: true },
  { name: 'farmId',     label: 'Finca',         field: 'farmId',     align: 'left',   sortable: true,
    format: (val) => platform.farmsForSelect.find((f) => f.id === val)?.name || val },
  { name: 'assignedTo', label: 'Responsable',   field: 'assignedTo', align: 'left',   sortable: true },
  { name: 'date',       label: 'Fecha',          field: 'date',       align: 'center', sortable: true },
  { name: 'status',     label: 'Estado',         field: 'status',     align: 'center', sortable: true },
  { name: 'actions',    label: 'Acciones',       field: 'actions',    align: 'center' }
];

// ── Datos ─────────────────────────────────────────────────────────────────────
const rows = computed(() => platform.collections['activities'] || []);
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

// ── Acciones de formulario ────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null;
  Object.assign(form, { title: '', farmId: '', assignedTo: '', date: '', status: '' });
  formOpen.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  Object.assign(form, {
    title: row.title,
    farmId: row.farmId,
    assignedTo: row.assignedTo,
    date: row.date,
    status: row.status
  });
  formOpen.value = true;
}

async function save() {
  if (!form.title || !form.farmId || !form.assignedTo || !form.date || !form.status) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos obligatorios.', position: 'top' });
    return;
  }
  saving.value = true;
  try {
    const values = { ...form };
    if (editingId.value) {
      platform.update('activities', editingId.value, values, auth.user.role);
    } else {
      platform.create('activities', values, auth.user.role);
    }
    $q.notify({ type: 'positive', message: editingId.value ? 'Actividad actualizada.' : 'Actividad registrada.', position: 'top' });
    formOpen.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo guardar.', position: 'top' });
  } finally {
    saving.value = false;
  }
}

function statusColor(status) {
  if (status === 'Completada') return 'positive';
  if (status === 'En progreso') return 'warning';
  return 'grey-6';
}

onMounted(() => {
  try {
    platform.load('activities', auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las actividades.' });
  }
});
</script>

<template>
  <div class="dashboard-page resource-page">
    <!-- Encabezado -->
    <div class="page-heading">
      <div>
        <div class="eyebrow">MÓDULO OPERARIO</div>
        <h1>Actividades agrícolas</h1>
        <p>Registra y gestiona las labores programadas en campo.</p>
      </div>
      <q-btn color="primary" unelevated no-caps icon="add" label="Registrar actividad" @click="openCreate" />
    </div>

    <!-- Toolbar -->
    <div class="resource-toolbar">
      <div class="farm-count">
        <strong>{{ rows.length }}</strong>
        <span>actividades registradas</span>
      </div>
      <q-input v-model="filter" dense outlined rounded placeholder="Buscar actividad..." class="table-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- Estado vacío -->
    <div v-if="!filteredRows.length" class="empty-state">
      <q-icon name="event_note" />
      <h2>{{ filter ? 'Sin resultados' : 'Sin actividades registradas' }}</h2>
      <p>{{ filter ? 'Prueba otro término de búsqueda.' : 'Registra la primera actividad del día usando el botón superior.' }}</p>
    </div>

    <!-- Tabla -->
    <q-table
      v-else
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :rows-per-page-options="[10, 20, 50]"
      class="worker-table"
    >
      <template #body-cell-farmId="props">
        <q-td :props="props">
          <q-icon name="place" size="xs" class="q-mr-xs text-grey-6" />
          {{ farmName(props.value) }}
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props" class="text-center">
          <q-badge :color="statusColor(props.value)" :label="props.value" rounded />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn flat round dense icon="edit" color="primary" size="sm"
            aria-label="Editar actividad" @click="openEdit(props.row)">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Formulario de registro / edición -->
    <q-dialog v-model="formOpen">
      <q-card class="dialog-card resource-form-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon name="event_note" /></div>
          <div>
            <div class="text-h6">{{ editingId ? 'Editar actividad' : 'Registrar actividad' }}</div>
            <div class="text-caption text-grey-7">Completa los campos para guardar.</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar" />
        </q-card-section>

        <q-form @submit.prevent="save">
          <q-card-section class="resource-form-grid">
            <q-input
              v-model="form.title"
              label="Nombre de la actividad *"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-select
              v-model="form.farmId"
              label="Finca *"
              :options="farmOptions"
              emit-value
              map-options
              outlined
              :rules="[(v) => !!v || 'Selecciona una finca']"
            />
            <q-input
              v-model="form.assignedTo"
              label="Responsable *"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.date"
              label="Fecha *"
              type="date"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-select
              v-model="form.status"
              label="Estado *"
              :options="statusOptions"
              outlined
              :rules="[(v) => !!v || 'Selecciona un estado']"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps icon="save"
              :label="editingId ? 'Guardar cambios' : 'Registrar'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
