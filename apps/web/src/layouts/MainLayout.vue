<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import BrandMark from '../components/BrandMark.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const drawer = ref(false);
const search = ref('');
const navItems = [
  { label: 'Inicio', icon: 'space_dashboard', to: '/' },
  { label: 'Terrenos', icon: 'map', to: '/terrenos' },
  { label: 'Cultivos', icon: 'grass', to: '/cultivos' },
  { label: 'Sensores', icon: 'sensors', to: '/sensores' },
  { label: 'Datos', icon: 'analytics', to: '/', disabled: true },
  { label: 'Actividad', icon: 'event_note', to: '/', disabled: true },
  { label: 'Historial', icon: 'history', to: '/', disabled: true },
  { label: 'Recomendaciones', icon: 'auto_awesome', to: '/', disabled: true },
  { label: 'Alertas', icon: 'notifications', to: '/', disabled: true },
  { label: 'Reportes', icon: 'summarize', to: '/', disabled: true }
];

function signOut() {
  auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <q-layout view="hHh Lpr fFf" class="app-shell">
    <q-drawer v-model="drawer" show-if-above bordered :width="252" class="sidebar">
      <div class="sidebar-brand"><BrandMark /></div>
      <div class="nav-caption">MENÚ PRINCIPAL</div>
      <q-list class="nav-list">
        <q-item
          v-for="item in navItems"
          :key="item.label"
          :to="item.disabled ? undefined : item.to"
          clickable
          :disable="item.disabled"
          :active="route.path === item.to && !item.disabled"
          active-class="nav-item--active"
          class="nav-item"
        >
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
          <q-tooltip v-if="item.disabled">Disponible próximamente</q-tooltip>
        </q-item>
      </q-list>
      <div class="sidebar-bottom">
        <q-item clickable class="profile-item">
          <q-item-section avatar><q-avatar size="36px" color="green-1" text-color="primary">{{ auth.user?.name?.slice(0, 1) }}</q-avatar></q-item-section>
          <q-item-section><q-item-label>{{ auth.user?.name }}</q-item-label><q-item-label caption>{{ auth.user?.role }}</q-item-label></q-item-section>
          <q-btn flat round dense icon="more_vert" @click.stop="signOut"><q-tooltip>Cerrar sesión</q-tooltip></q-btn>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <q-header class="topbar">
        <q-toolbar>
          <q-btn flat round dense icon="menu" class="mobile-menu" @click="drawer = !drawer" />
          <q-input v-model="search" dense rounded outlined placeholder="Buscar terrenos, sensores..." class="top-search">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn flat round dense icon="notifications_none" aria-label="Notificaciones">
            <q-badge color="negative" floating rounded />
          </q-btn>
          <q-btn flat round dense icon="help_outline" aria-label="Ayuda" />
          <q-avatar size="34px" color="green-1" text-color="primary">{{ auth.user?.name?.slice(0, 1) }}</q-avatar>
        </q-toolbar>
      </q-header>
      <q-page class="page-area">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
