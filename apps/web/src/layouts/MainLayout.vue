<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { usePlatformStore } from '../stores/platform';
import BrandMark from '../components/BrandMark.vue';
import { MODULES } from '../backend/models/modules';
import { canAccessModule } from '../backend/models/roles';
import { scoreSearchMatch } from '../search';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const platform = usePlatformStore();
const drawer = ref(false);
const search = ref('');
const searchResults = ref([]);
const searchMenuOpen = ref(false);
const searchLoading = ref(false);
const navItems = computed(() => MODULES.filter((item) => canAccessModule(auth.user?.role, item.id)));
let searchTimeout;

function titleFor(result) {
  const record = result.record;
  for (const key of ['name', 'title', 'concept', 'crop', 'email']) {
    if (record[key]) return String(record[key]);
  }
  return result.singular;
}

function detailsFor(record) {
  return [
    record.location,
    record.variety,
    record.type,
    record.status || record.priority || record.severity,
    record.date
  ].filter(Boolean).join(' · ');
}

function runSearch(query) {
  clearTimeout(searchTimeout);
  if (query.trim().length < 2) {
    searchResults.value = [];
    searchLoading.value = false;
    searchMenuOpen.value = false;
    return;
  }

  searchMenuOpen.value = true;
  searchLoading.value = true;
  searchTimeout = setTimeout(() => {
    try {
      searchResults.value = platform.searchRecords(auth.user.role)
        .map((result) => {
          const values = Object.entries(result.record)
            .filter(([key, value]) => key !== 'id' && key !== 'createdAt' && value !== null && value !== undefined)
            .map(([, value]) => String(value));
          return {
            ...result,
            title: titleFor(result),
            details: detailsFor(result.record),
            score: scoreSearchMatch(query, [result.label, result.singular, ...values])
          };
        })
        .filter((result) => result.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 7);
    } catch (error) {
      searchResults.value = [];
      $q.notify({ type: 'negative', message: error.message || 'No se pudo completar la búsqueda.' });
    } finally {
      searchLoading.value = false;
    }
  }, 180);
}

function goToSearchResult(result) {
  searchMenuOpen.value = false;
  search.value = '';
  router.push({ path: result.path, query: { detail: result.record.id } });
}

function openFirstSearchResult() {
  if (searchResults.value[0]) goToSearchResult(searchResults.value[0]);
}

watch(search, runSearch);
onBeforeUnmount(() => clearTimeout(searchTimeout));

const notificationsOpen = ref(false);

function refreshNotifications() {
  try {
    platform.loadNotifications(auth.user);
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudieron cargar las notificaciones.' });
  }
}

function openNotification(item) {
  platform.markNotificationRead(item.id);
  notificationsOpen.value = false;
  router.push({ path: item.path, query: { detail: item.recordId } });
}

// Carga las notificaciones al entrar y cada vez que cambia de usuario o de pantalla
watch(() => [auth.user?.id, route.fullPath], refreshNotifications, { immediate: true });

function signOut() {
  try {
    auth.logout();
    router.replace({ name: 'login' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'No se pudo cerrar la sesión.' });
  }
}

watch(() => auth.isAuthenticated, (authenticated) => {
  if (!authenticated) router.replace({ name: 'login' });
});
</script>

<template>
  <q-layout view="hHh Lpr fFf" class="app-shell">
    <q-drawer v-model="drawer" show-if-above bordered :width="252" class="sidebar">
      <div class="sidebar-brand"><BrandMark /></div>
      <div class="nav-caption">ESPACIO DE TRABAJO</div>
      <q-list class="nav-list">
        <q-item to="/" clickable :active="route.path === '/'" active-class="nav-item--active" class="nav-item">
          <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
          <q-item-section>Resumen general</q-item-section>
        </q-item>
        <div class="nav-section-label">MÓDULOS</div>
        <q-item
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          clickable
          :active="route.path === item.path"
          active-class="nav-item--active"
          class="nav-item"
        >
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
      <div class="sidebar-bottom">
        <q-item class="profile-item">
          <q-item-section avatar><q-avatar size="36px" color="green-1" text-color="primary">{{ auth.user?.name?.slice(0, 1) }}</q-avatar></q-item-section>
          <q-item-section><q-item-label>{{ auth.user?.name }}</q-item-label><q-item-label caption>{{ auth.user?.role }}</q-item-label></q-item-section>
          <q-btn flat round dense icon="logout" aria-label="Cerrar sesión" @click.stop="signOut"><q-tooltip>Cerrar sesión</q-tooltip></q-btn>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <q-header class="topbar">
        <q-toolbar>
          <q-btn flat round dense icon="menu" class="mobile-menu" @click="drawer = !drawer" />
          <div class="top-search-wrap">
            <q-input
              v-model="search"
              dense
              rounded
              outlined
              :loading="searchLoading"
              placeholder="Buscar en tus módulos..."
              aria-label="Buscar en tus módulos"
              class="top-search"
              @focus="searchMenuOpen = search.trim().length >= 2"
              @keydown.enter.prevent="openFirstSearchResult"
              @keydown.esc="search = ''"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-menu v-model="searchMenuOpen" fit anchor="bottom left" self="top left" :offset="[0, 6]" no-focus>
              <q-list class="search-results">
                <q-item
                  v-for="result in searchResults"
                  :key="`${result.moduleId}-${result.record.id}`"
                  clickable
                  v-close-popup
                  @click="goToSearchResult(result)"
                >
                  <q-item-section avatar><q-icon :name="result.icon" color="primary" /></q-item-section>
                  <q-item-section>
                    <q-item-label>{{ result.title }}</q-item-label>
                    <q-item-label caption>{{ result.label }}<span v-if="result.details"> · {{ result.details }}</span></q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="!searchLoading && search.trim().length >= 2 && !searchResults.length">
                  <q-item-section class="text-grey-7">No encontramos coincidencias.</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
          <q-space />
          <q-btn
            flat
            round
            dense
            :icon="platform.unreadCount ? 'notifications_active' : 'notifications_none'"
            aria-label="Notificaciones"
            @click="refreshNotifications"
          >
            <q-badge v-if="platform.unreadCount" color="negative" floating rounded>{{ platform.unreadCount > 9 ? '9+' : platform.unreadCount }}</q-badge>
            <q-tooltip>Notificaciones</q-tooltip>
            <q-menu v-model="notificationsOpen" anchor="bottom right" self="top right" :offset="[0, 8]">
              <div class="notifications-panel">
                <div class="notifications-panel__header">
                  <div>
                    <div class="notifications-panel__title">Notificaciones</div>
                    <div class="notifications-panel__subtitle">{{ platform.unreadCount ? `${platform.unreadCount} sin leer` : 'Estás al día' }}</div>
                  </div>
                  <q-btn
                    v-if="platform.unreadCount"
                    flat
                    dense
                    no-caps
                    color="primary"
                    label="Marcar todas como leídas"
                    @click="platform.markAllNotificationsRead()"
                  />
                </div>
                <q-separator />
                <q-list class="notifications-panel__list">
                  <q-item
                    v-for="item in platform.notifications"
                    :key="item.id"
                    clickable
                    v-close-popup
                    :class="{ 'notification-item--unread': !platform.isRead(item.id) }"
                    @click="openNotification(item)"
                  >
                    <q-item-section avatar>
                      <q-avatar size="34px" :color="item.tone" text-color="white" :icon="item.icon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="notification-item__title">{{ item.title }}</q-item-label>
                      <q-item-label caption lines="2">{{ item.caption }}</q-item-label>
                    </q-item-section>
                    <q-item-section v-if="!platform.isRead(item.id)" side>
                      <span class="notification-dot" aria-label="Sin leer" />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!platform.notifications.length">
                    <q-item-section class="text-grey-7 text-center q-py-md">No tienes notificaciones por ahora.</q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-menu>
          </q-btn>
          <q-btn flat round dense icon="help_outline" aria-label="Ayuda" @click="$q.notify({ message: 'Selecciona un módulo del menú para consultar o registrar información.' })" />
          <q-avatar size="34px" color="green-1" text-color="primary">{{ auth.user?.name?.slice(0, 1) }}</q-avatar>
        </q-toolbar>
      </q-header>
      <q-page class="page-area">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
