import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { localApi } from '../backend/routes/localApi';
import { SESSION_KEY } from '../backend/data/mockData';

export const useAuthStore = defineStore('auth', () => {
  const authError = ref('');
  let initialSession = null;
  try {
    initialSession = localApi.auth.currentSession();
  } catch (error) {
    authError.value = error.message || 'No se pudo validar la sesión local.';
  }
  const session = ref(initialSession);
  const user = computed(() => session.value?.user || null);
  const isAuthenticated = computed(() => Boolean(user.value));

  async function login(credentials) {
    session.value = await localApi.auth.login(credentials);
  }

  function refreshSession() {
    try {
      session.value = localApi.auth.currentSession();
    } catch (error) {
      authError.value = error.message || 'No se pudo validar la sesión local.';
      session.value = null;
    }
  }

  function logout() {
    localApi.auth.logout();
    session.value = null;
    localStorage.removeItem('agrosmart.token');
    localStorage.removeItem('agrosmart.user');
    sessionStorage.removeItem('agrosmart.token');
    sessionStorage.removeItem('agrosmart.user');
  }

  function clearAuthError() {
    authError.value = '';
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== SESSION_KEY) return;
      try {
        session.value = localApi.auth.currentSession();
      } catch (error) {
        authError.value = error.message || 'No se pudo validar la sesión local.';
      }
    });
  }

  return { session, user, isAuthenticated, authError, login, refreshSession, logout, clearAuthError };
});
