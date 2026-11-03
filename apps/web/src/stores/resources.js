import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '../api/client';

export const useResourcesStore = defineStore('resources', () => {
  const terrains = ref([]);
  const crops = ref([]);
  const sensors = ref([]);
  const loading = ref(false);

  async function load(resource) {
    loading.value = true;
    try {
      const { data } = await api.get(`/${resource}`, { params: { page: 1, limit: 20 } });
      const target = { terrains, crops, sensors }[resource];
      if (target) target.value = data.items;
      return data;
    } finally {
      loading.value = false;
    }
  }

  return { terrains, crops, sensors, loading, load };
});
