import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { localApi } from '../backend/routes/localApi';

export const usePlatformStore = defineStore('platform', () => {
  const collections = reactive({});
  const farmsForSelect = ref([]);
  const dashboard = ref(null);
  const loading = ref(false);

  function load(moduleId, role) {
    loading.value = true;
    try {
      collections[moduleId] = localApi.platform.list(moduleId, role);
      farmsForSelect.value = localApi.platform.referenceFarms();
      return collections[moduleId];
    } finally {
      loading.value = false;
    }
  }

  function searchRecords(role) {
    return localApi.platform.searchRecords(role);
  }

  function create(moduleId, values, role) {
    const item = localApi.platform.create(moduleId, values, role);
    collections[moduleId] = [item, ...(collections[moduleId] || [])];
    if (moduleId === 'farms') farmsForSelect.value = localApi.platform.referenceFarms();
    return item;
  }

  function update(moduleId, id, values, role) {
    const item = localApi.platform.update(moduleId, id, values, role);
    collections[moduleId] = (collections[moduleId] || []).map((record) => record.id === id ? item : record);
    if (moduleId === 'farms') farmsForSelect.value = localApi.platform.referenceFarms();
    return item;
  }

  function remove(moduleId, id, role) {
    const removed = localApi.platform.remove(moduleId, id, role);
    collections[moduleId] = (collections[moduleId] || []).filter((record) => record.id !== id);
    if (moduleId === 'farms') farmsForSelect.value = localApi.platform.referenceFarms();
    return removed;
  }

  async function createUser(values, role) {
    const user = await localApi.auth.createUser(values, role);
    collections.users = [user, ...(collections.users || [])];
    return user;
  }

  function getFarmDetails(farmId, role) {
    return localApi.platform.farmDetails(farmId, role);
  }

  const notifications = ref([]);
  const readNotifications = ref(new Set());
  let readKey = '';

  function readStoredIds(key) {
    try {
      const parsed = JSON.parse(globalThis.localStorage?.getItem(key) || '[]');
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveReadIds() {
    try {
      globalThis.localStorage?.setItem(readKey, JSON.stringify([...readNotifications.value]));
    } catch {
      // Si el navegador no permite guardar, las notificaciones leídas solo duran esta sesión.
    }
  }

  function loadNotifications(user) {
    if (!user) {
      notifications.value = [];
      return [];
    }
    readKey = `agrosmart.notifications.read.${user.id}`;
    readNotifications.value = readStoredIds(readKey);
    notifications.value = localApi.platform.notifications(user.role);
    return notifications.value;
  }

  function isRead(id) {
    return readNotifications.value.has(id);
  }

  function markNotificationRead(id) {
    if (readNotifications.value.has(id)) return;
    readNotifications.value = new Set([...readNotifications.value, id]);
    saveReadIds();
  }

  function markAllNotificationsRead() {
    readNotifications.value = new Set([...readNotifications.value, ...notifications.value.map((item) => item.id)]);
    saveReadIds();
  }

  const unreadCount = computed(() => notifications.value.filter((item) => !readNotifications.value.has(item.id)).length);

  function loadDashboard(role) {
    dashboard.value = localApi.platform.dashboard(role);
    return dashboard.value;
  }

  return { collections, farmsForSelect, dashboard, loading, load, searchRecords, create, update, remove, createUser, getFarmDetails, loadDashboard,
    notifications, unreadCount, loadNotifications, isRead, markNotificationRead, markAllNotificationsRead };
});
