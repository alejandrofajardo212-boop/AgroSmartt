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
  crop: '',
  farmId: '',
  date: '',
  quantityKg: '',
  quality: ''
});

const qualityOptions = ['Primera', 'Segunda', 'Tercera'];

// ── Columnas ──────────────────────────────────────────────────────────────────
const columns = [
  { name: 'crop',       label: 'Cultivo',          field: 'crop',       align: 'left',   sortable: true },
  { name: 'farmId',     label: 'Finca',             field: 'farmId',     align: 'left',   sortable: true },
  { name: 'date',       label: 'Fecha de cosecha',  field: 'date',       align: 'center', sortable: true },
  { name: 'quantityKg', label: 'Cantidad (kg)',      field: 'quantityKg', align: 'right',  sortable: true },
  { name: 'quality',    label: 'Calidad',            field: 'quality',    align: 'center', sortable: true },
  { name: 'actions',   label: 'Acciones',           field: 'actions',    align: 'center' }
];

// ── Datos ─────────────────────────────────────────────────────────────────────
const rows = computed(() => platform.collections['harvests'] || []);
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

// ── Estadísticas ──────────────────────────────────────────────────────────────
const totalKg = computed(() =>
  rows.value.reduce((sum, r) => sum + Number(r.quantityKg || 0), 0)
);
const firstQuality = computed(() =>
  rows.value.filter((r) => r.quality === 'Primera').length
);

// ── Acciones ──────────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null;
  Object.assign(form, { crop: '', farmId: '', date: '', quantityKg: '', quality: '' });
  formOpen.value = true;
}
function openEdit(row) {
  editingId.value = row.id;
  Object.assign(form, {
    crop: row.crop,
    farmId: row.farmId,
    date: row.date,
    quantityKg: row.quantityKg,
    quality: row.quality
  });
  formOpen.value = true;
}

async function save() {
  if (!form.crop || !form.farmId || !form.date || !form.quantityKg || !form.quality) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos obligatorios.', position: 'top' });
    return;
  }
  saving.value = true;
  try {
    const values = { ...form, quantityKg: Number(form.quantityKg) };
    if (editingId.value) {
      platform.update('harvests', editingId.value, values, auth.user.role);
    } else {
      platform.create('harvests', values, auth.user.role);
    }
    $q.notify({ type: 'positive', message: editingId.value ? 'Cosecha actualizada.' : 'Cosecha registrada.', position: 'top' });
    formOpen.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo guardar.', position: 'top' });
  } finally {
    saving.value = false;
  }
}

function qualityColor(q) {
  if (q === 'Primera') return 'positive';
  if (q === 'Segunda') return 'warning';
  return 'grey-6';
}

onMounted(() => {
  try {
    platform.load('harvests', auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las cosechas.' });
  }
});
</script>

<template>
  <div class="dashboard-page resource-page">
    <!-- Encabezado -->
    <div class="page-heading">
      <div>
        <div class="eyebrow">MÓDULO OPERARIO</div>
        <h1>Registro de cosechas</h1>
        <p>Registra la producción recolectada con cantidad y calidad.</p>
      </div>
      <q-btn color="primary" unelevated no-caps icon="add" label="Registrar cosecha" @click="openCreate" />
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--green">
          <div class="stat-card__top"><span>Total cosechado</span>
            <div class="stat-card__icon tone-green"><q-icon name="agriculture" /></div>
          </div>
          <div class="stat-card__value">{{ totalKg.toLocaleString('es-CO') }} kg</div>
          <div class="stat-card__change">Producción acumulada</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--gold">
          <div class="stat-card__top"><span>Registros totales</span>
            <div class="stat-card__icon tone-gold"><q-icon name="list_alt" /></div>
          </div>
          <div class="stat-card__value">{{ rows.length }}</div>
          <div class="stat-card__change">Lotes registrados</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--blue">
          <div class="stat-card__top"><span>Calidad primera</span>
            <div class="stat-card__icon tone-blue"><q-icon name="grade" /></div>
          </div>
          <div class="stat-card__value">{{ firstQuality }}</div>
          <div class="stat-card__change">Lotes de mayor calidad</div>
        </q-card>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="resource-toolbar">
      <div class="farm-count">
        <strong>{{ rows.length }}</strong>
        <span>cosechas registradas</span>
      </div>
      <q-input v-model="filter" dense outlined rounded placeholder="Buscar cosecha..." class="table-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- Estado vacío -->
    <div v-if="!filteredRows.length" class="empty-state">
      <q-icon name="agriculture" />
      <h2>{{ filter ? 'Sin resultados' : 'Sin cosechas registradas' }}</h2>
      <p>{{ filter ? 'Prueba otro término de búsqueda.' : 'Comienza registrando la primera cosecha del ciclo.' }}</p>
      <q-btn v-if="!filter" color="primary" unelevated no-caps icon="add" label="Registrar cosecha" @click="openCreate" />
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
      <template #body-cell-quantityKg="props">
        <q-td :props="props" class="text-right text-weight-medium">
          {{ Number(props.value).toLocaleString('es-CO') }} kg
        </q-td>
      </template>
      <template #body-cell-quality="props">
        <q-td :props="props" class="text-center">
          <q-badge :color="qualityColor(props.value)" :label="props.value" rounded />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <q-btn flat round dense icon="edit" color="primary" size="sm"
            aria-label="Editar cosecha" @click="openEdit(props.row)">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Formulario -->
    <q-dialog v-model="formOpen">
      <q-card class="dialog-card resource-form-dialog">
        <q-card-section class="dialog-heading">
          <div class="dialog-icon"><q-icon name="agriculture" /></div>
          <div>
            <div class="text-h6">{{ editingId ? 'Editar cosecha' : 'Registrar cosecha' }}</div>
            <div class="text-caption text-grey-7">Completa los campos para guardar el registro.</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar" />
        </q-card-section>

        <q-form @submit.prevent="save">
          <q-card-section class="resource-form-grid">
            <q-input
              v-model="form.crop"
              label="Cultivo cosechado *"
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
              v-model="form.date"
              label="Fecha de cosecha *"
              type="date"
              outlined
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />
            <q-input
              v-model="form.quantityKg"
              label="Cantidad (kg) *"
              type="number"
              min="0.1"
              step="0.1"
              outlined
              :rules="[(v) => !!v && Number(v) > 0 || 'Ingresa una cantidad válida']"
            />
            <q-select
              v-model="form.quality"
              label="Calidad *"
              :options="qualityOptions"
              outlined
              :rules="[(v) => !!v || 'Selecciona la calidad']"
            />
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps icon="save"
              :label="editingId ? 'Guardar cambios' : 'Registrar cosecha'" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>
