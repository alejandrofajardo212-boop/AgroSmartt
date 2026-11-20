<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { ROLE_OPTIONS } from '../backend/models/roles';
import { SessionConflictError } from '../backend/services/authService';
import BrandMark from '../components/BrandMark.vue';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const selectedRole = ref(null);
const email = ref('');
const password = ref('');
const loading = ref(false);
const visible = ref(false);

async function submit() {
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value, role: selectedRole.value });
    $q.notify({
      type: 'positive',
      message: `Bienvenido, ${auth.user.name}.`,
      position: 'top'
    });
    router.replace({ name: 'dashboard' });
  } catch (error) {
    $q.notify({
      type: error instanceof SessionConflictError ? 'warning' : 'negative',
      message: error.message || 'No se pudo iniciar sesión.',
      position: 'top',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-visual">
      <div class="login-visual__shade"></div>
      <div class="login-visual__content">
        <BrandMark />
        <div class="visual-copy">
          <span class="eyebrow">TECNOLOGÍA QUE CULTIVA FUTURO</span>
          <h1>Tu campo,<br /><em>en equilibrio.</em></h1>
          <p>Conectamos tus cultivos con decisiones más inteligentes.</p>
        </div>
        <div class="visual-footer"><span>01</span><span class="footer-line"></span><span>AGRICULTURA DE PRECISIÓN</span></div>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <div class="login-brand-mobile"><BrandMark /></div>
        <p class="eyebrow text-primary">BIENVENIDO DE NUEVO</p>
        <h2>Inicia sesión</h2>
        <p class="login-subtitle">Ingresa con la cuenta que te asignó el administrador.</p>
        <q-form class="login-form" @submit.prevent="submit">
          <label for="role">Tu perfil de acceso</label>
          <q-select
            id="role"
            v-model="selectedRole"
            :options="ROLE_OPTIONS"
            outlined
            dense
            lazy-rules="ondemand"
            behavior="menu"
            :rules="[value => !!value || 'Selecciona tu perfil']"
          >
            <template #prepend><q-icon name="badge" color="primary" /></template>
          </q-select>
          <label for="email">Correo electrónico</label>
          <q-input id="email" v-model="email" outlined dense lazy-rules="ondemand" type="email" autocomplete="username" placeholder="tu@agrosmart.com" :rules="[value => !!value?.trim() || 'Ingresa tu correo']">
            <template #prepend><q-icon name="mail_outline" /></template>
          </q-input>
          <label for="password">Contraseña</label>
          <q-input id="password" v-model="password" outlined dense lazy-rules="ondemand" :type="visible ? 'text' : 'password'" autocomplete="current-password" placeholder="Tu contraseña" :rules="[value => !!value || 'Ingresa tu contraseña']">
            <template #prepend><q-icon name="lock_outline" /></template>
            <template #append><q-icon :name="visible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="visible = !visible" /></template>
          </q-input>
          <q-btn type="submit" label="Iniciar sesión" unelevated no-caps class="full-width login-submit" :loading="loading" />
        </q-form>
        <div class="login-access-note">
          <q-icon name="admin_panel_settings" />
          <span>¿No tienes cuenta? Pídele acceso al administrador de la finca. Las cuentas solo se crean desde el módulo <strong>Usuarios</strong>.</span>
        </div>
      </div>
    </section>
  </main>
</template>
