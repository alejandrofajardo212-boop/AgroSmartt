<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { getApiError } from '../api/client';
import BrandMark from '../components/BrandMark.vue';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const email = ref('demo@agrosmart.com');
const password = ref('AgroSmart2026!');
const remember = ref(true);
const loading = ref(false);
const visible = ref(false);

async function submit() {
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value }, remember.value);
    $q.notify({ type: 'positive', message: '¡Bienvenido a AgroSmart!', position: 'top' });
    router.replace({ name: 'dashboard' });
  } catch (error) {
    $q.notify({ type: 'negative', message: getApiError(error), position: 'top' });
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
        <p class="login-subtitle">Ingresa tus credenciales para continuar.</p>
        <q-form class="login-form" @submit.prevent="submit">
          <label for="email">Correo electrónico</label>
          <q-input id="email" v-model="email" outlined dense type="email" autocomplete="email" placeholder="tu@agrosmart.com" :rules="[value => !!value || 'Ingresa tu correo']" />
          <label for="password">Contraseña</label>
          <q-input id="password" v-model="password" outlined dense :type="visible ? 'text' : 'password'" autocomplete="current-password" placeholder="Tu contraseña" :rules="[value => !!value || 'Ingresa tu contraseña']">
            <template #append><q-icon :name="visible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="visible = !visible" /></template>
          </q-input>
          <div class="login-options"><q-checkbox v-model="remember" label="Recordarme" dense /><a href="#" @click.prevent="$q.notify({ message: 'Contacta al administrador para recuperar tu acceso.' })">¿Olvidaste tu contraseña?</a></div>
          <q-btn type="submit" label="Iniciar sesión" unelevated no-caps class="full-width login-submit" :loading="loading" />
        </q-form>
        <div class="login-footnote">¿Aún no tienes una cuenta? <router-link to="/registro">Solicitar acceso</router-link></div>
        <div class="demo-hint">Demo: demo@agrosmart.com · AgroSmart2026!</div>
      </div>
    </section>
  </main>
</template>
