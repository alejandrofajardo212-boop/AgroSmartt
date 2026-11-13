<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/auth';
import { usePlatformStore } from '../../stores/platform';

const auth = useAuthStore();
const platform = usePlatformStore();
const $q = useQuasar();

// ── Estado ────────────────────────────────────────────────────────────────────
const filter = ref('');
const priorityFilter = ref(null);

const priorityOptions = [
  { label: 'Todas las prioridades', value: null },
  { label: 'Alta',  value: 'Alta' },
  { label: 'Media', value: 'Media' },
  { label: 'Baja',  value: 'Baja' }
];

// ── Columnas ──────────────────────────────────────────────────────────────────
const columns = [
  { name: 'title',      label: 'Tarea',          field: 'title',      align: 'left',   sortable: true },
  { name: 'farmId',     label: 'Finca',           field: 'farmId',     align: 'left',   sortable: true },
  { name: 'assignedTo', label: 'Asignada a',      field: 'assignedTo', align: 'left',   sortable: true },
  { name: 'dueDate',    label: 'Fecha límite',     field: 'dueDate',    align: 'center', sortable: true },
  { name: 'priority',   label: 'Prioridad',        field: 'priority',   align: 'center', sortable: true },
  { name: 'status',     label: 'Estado',           field: 'status',     align: 'center' }
];

// ── Datos ─────────────────────────────────────────────────────────────────────
const rows = computed(() => platform.collections['tasks'] || []);

const filteredRows = computed(() => {
  let result = rows.value;
  if (priorityFilter.value) {
    result = result.filter((r) => r.priority === priorityFilter.value);
  }
  if (filter.value) {
    result = result.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(filter.value.toLowerCase()))
    );
  }
  return result;
});

function farmName(id) {
  return platform.farmsForSelect.find((f) => f.id === id)?.name || id;
}

// ── Helpers visuales ──────────────────────────────────────────────────────────
function priorityColor(p) {
  if (p === 'Alta')  return 'negative';
  if (p === 'Media') return 'warning';
  return 'grey-5';
}
function priorityIcon(p) {
  if (p === 'Alta')  return 'keyboard_double_arrow_up';
  if (p === 'Media') return 'drag_handle';
  return 'keyboard_double_arrow_down';
}
function isOverdue(dueDate) {
  return dueDate && new Date(dueDate) < new Date();
}

// ── Estadísticas rápidas ──────────────────────────────────────────────────────
const stats = computed(() => ({
  total:    rows.value.length,
  alta:     rows.value.filter((r) => r.priority === 'Alta').length,
  overdue:  rows.value.filter((r) => isOverdue(r.dueDate)).length
}));

onMounted(() => {
  try {
    platform.load('tasks', auth.user.role);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las tareas.' });
  }
});
</script>

<template>
  <div class="dashboard-page resource-page">
    <!-- Encabezado -->
    <div class="page-heading">
      <div>
        <div class="eyebrow">MÓDULO OPERARIO</div>
        <h1>Tareas asignadas</h1>
        <p>Consulta las tareas del equipo operativo y sus fechas límite.</p>
      </div>
    </div>

    <!-- KPI rápidos -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--blue">
          <div class="stat-card__top"><span>Total de tareas</span>
            <div class="stat-card__icon tone-blue"><q-icon name="task_alt" /></div>
          </div>
          <div class="stat-card__value">{{ stats.total }}</div>
          <div class="stat-card__change">En el plan operativo</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--red">
          <div class="stat-card__top"><span>Prioridad alta</span>
            <div class="stat-card__icon tone-red"><q-icon name="priority_high" /></div>
          </div>
          <div class="stat-card__value">{{ stats.alta }}</div>
          <div class="stat-card__change">Atención inmediata</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="stat-card stat-card--gold">
          <div class="stat-card__top"><span>Vencidas</span>
            <div class="stat-card__icon tone-gold"><q-icon name="schedule" /></div>
          </div>
          <div class="stat-card__value">{{ stats.overdue }}</div>
          <div class="stat-card__change">Superaron la fecha límite</div>
        </q-card>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="resource-toolbar">
      <q-select
        v-model="priorityFilter"
        :options="priorityOptions"
        emit-value
        map-options
        dense
        outlined
        rounded
        style="min-width: 200px"
      />
      <q-input v-model="filter" dense outlined rounded placeholder="Buscar tarea..." class="table-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- Estado vacío -->
    <div v-if="!filteredRows.length" class="empty-state">
      <q-icon name="task_alt" />
      <h2>{{ filter || priorityFilter ? 'Sin resultados' : 'Sin tareas asignadas' }}</h2>
      <p>{{ filter || priorityFilter ? 'Ajusta los filtros para ver resultados.' : 'Cuando te asignen tareas, aparecerán aquí.' }}</p>
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

      <template #body-cell-dueDate="props">
        <q-td :props="props" class="text-center">
          <span :class="isOverdue(props.value) ? 'text-negative text-weight-bold' : ''">
            {{ props.value }}
            <q-icon v-if="isOverdue(props.value)" name="warning" size="xs" color="negative" class="q-ml-xs" />
          </span>
        </q-td>
      </template>

      <template #body-cell-priority="props">
        <q-td :props="props" class="text-center">
          <q-chip
            dense
            :color="priorityColor(props.value)"
            text-color="white"
            :icon="priorityIcon(props.value)"
          >
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props" class="text-center">
          <q-badge
            :color="props.value === 'Completada' ? 'positive' : props.value === 'En progreso' ? 'warning' : 'grey-5'"
            :label="props.value || 'Pendiente'"
            rounded
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>
