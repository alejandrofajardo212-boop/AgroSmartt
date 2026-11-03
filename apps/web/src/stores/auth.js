import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '../api/client';

function readStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem('agrosmart.user')
      || sessionStorage.getItem('agrosmart.user')
      || 'null'
    );
  } catch {
    localStorage.removeItem('agrosmart.user');
    sessionStorage.removeItem('agrosmart.user');
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('agrosmart.token') || sessionStorage.getItem('agrosmart.token') || '');
  const user = ref(readStoredUser());
  const isAuthenticated = computed(() => Boolean(token.value && user.value));

  function saveSession(session, remember = true) {
    token.value = session.token;
    user.value = session.user;
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    storage.setItem('agrosmart.token', session.token);
    storage.setItem('agrosmart.user', JSON.stringify(session.user));
    otherStorage.removeItem('agrosmart.token');
    otherStorage.removeItem('agrosmart.user');
  }

  async function login(credentials, remember = true) {
    const { data } = await api.post('/auth/login', credentials);
    saveSession(data, remember);
  }

  async function register(details) {
    const { data } = await api.post('/auth/register', details);
    saveSession(data);
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('agrosmart.token');
    localStorage.removeItem('agrosmart.user');
    sessionStorage.removeItem('agrosmart.token');
    sessionStorage.removeItem('agrosmart.user');
  }

  return { token, user, isAuthenticated, login, register, logout };
});
