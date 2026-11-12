import { reactive, ref } from 'vue';
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

  function loadDashboard(role) {
    dashboard.value = localApi.platform.dashboard(role);
    return dashboard.value;
  }

  return { collections, farmsForSelect, dashboard, loading, load, searchRecords, create, update, remove, createUser, getFarmDetails, loadDashboard };
});
