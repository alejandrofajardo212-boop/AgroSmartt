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
const isRegistering = ref(false);
const selectedRole = ref(null);
const email = ref('');
const password = ref('');
const name = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const visible = ref(false);

function setMode(registering) {
  isRegistering.value = registering;
  name.value = '';
  confirmPassword.value = '';
  email.value = '';
  password.value = '';
  visible.value = false;
}

async function submit() {
  loading.value = true;
  try {
    if (isRegistering.value) {
      if (password.value !== confirmPassword.value) {
        throw new Error('Las contraseñas no coinciden.');
      }
      const registeredEmail = email.value.trim();
      await auth.registerAccount({
        name: name.value,
        email: registeredEmail,
        password: password.value,
        role: selectedRole.value
      });
      setMode(false);
      email.value = registeredEmail;
      $q.notify({
        type: 'positive',
        message: 'Cuenta creada. Ahora inicia sesión con tu correo y contraseña.',
        position: 'top'
      });
      return;
    }
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
        <p class="eyebrow text-primary">{{ isRegistering ? 'ÚNETE A AGROSMART' : 'BIENVENIDO DE NUEVO' }}</p>
        <h2>{{ isRegistering ? 'Crea tu cuenta' : 'Inicia sesión' }}</h2>
        <p class="login-subtitle">{{ isRegistering ? 'Registra tu cuenta y elige uno de los cuatro roles.' : 'Ingresa con la cuenta registrada para tu perfil.' }}</p>
        <div class="login-mode" role="group" aria-label="Acceso a AgroSmart">
          <button type="button" class="login-mode__button" :aria-pressed="!isRegistering" :class="{ 'login-mode__button--active': !isRegistering }" @click="setMode(false)">Iniciar sesión</button>
          <button type="button" class="login-mode__button" :aria-pressed="isRegistering" :class="{ 'login-mode__button--active': isRegistering }" @click="setMode(true)">Crear cuenta</button>
        </div>
        <q-form :key="isRegistering ? 'register' : 'login'" class="login-form" @submit.prevent="submit">
          <label for="role">{{ isRegistering ? 'Elige tu rol' : 'Tu perfil de acceso' }}</label>
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
          <template v-if="isRegistering">
            <label for="name">Nombre completo</label>
            <q-input id="name" v-model="name" outlined dense lazy-rules="ondemand" autocomplete="name" placeholder="Tu nombre" :rules="[value => !!value?.trim() || 'Ingresa tu nombre']">
              <template #prepend><q-icon name="person_outline" /></template>
            </q-input>
          </template>
          <label for="email">Correo electrónico</label>
          <q-input id="email" v-model="email" outlined dense lazy-rules="ondemand" type="email" autocomplete="username" placeholder="tu@agrosmart.com" :rules="[value => !!value?.trim() || 'Ingresa tu correo']">
            <template #prepend><q-icon name="mail_outline" /></template>
          </q-input>
          <label for="password">Contraseña</label>
          <q-input id="password" v-model="password" outlined dense lazy-rules="ondemand" :type="visible ? 'text' : 'password'" :autocomplete="isRegistering ? 'new-password' : 'current-password'" placeholder="Tu contraseña" :rules="[value => !!value || 'Ingresa tu contraseña', value => !isRegistering || (value?.length >= 8) || 'Usa al menos 8 caracteres']">
            <template #prepend><q-icon name="lock_outline" /></template>
            <template #append><q-icon :name="visible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="visible = !visible" /></template>
          </q-input>
          <template v-if="isRegistering">
            <label for="confirm-password">Confirma tu contraseña</label>
            <q-input id="confirm-password" v-model="confirmPassword" outlined dense lazy-rules="ondemand" :type="visible ? 'text' : 'password'" autocomplete="new-password" placeholder="Repite tu contraseña" :rules="[value => !!value || 'Confirma tu contraseña', value => value === password || 'Las contraseñas no coinciden']">
              <template #prepend><q-icon name="lock_outline" /></template>
            </q-input>
          </template>
          <q-btn type="submit" :label="isRegistering ? 'Crear cuenta en AgroSmart' : 'Iniciar sesión'" unelevated no-caps class="full-width login-submit" :loading="loading" />
        </q-form>
        <div class="login-footnote"><q-icon name="shield" /> {{ isRegistering ? 'Después del registro, inicia sesión con tu cuenta' : 'Acceso disponible para los cuatro roles registrados' }}</div>
      </div>
    </section>
  </main>
</template>
