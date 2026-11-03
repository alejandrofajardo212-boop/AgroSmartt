import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '../api/client';

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref(null);
  const loading = ref(false);
  const error = ref('');

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const { data } = await api.get('/dashboard');
      summary.value = data;
    } catch (cause) {
      error.value = cause.response?.data?.error || 'No fue posible cargar el resumen.';
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  return { summary, loading, error, load };
});
