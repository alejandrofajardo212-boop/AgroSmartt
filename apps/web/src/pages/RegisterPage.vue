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
const name = ref('');
const email = ref('');
const password = ref('');
const confirmation = ref('');
const loading = ref(false);
const visible = ref(false);

async function submit() {
  if (password.value !== confirmation.value) {
    $q.notify({ type: 'warning', message: 'Las contraseñas no coinciden.', position: 'top' });
    return;
  }

  loading.value = true;
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value });
    $q.notify({ type: 'positive', message: 'Tu cuenta se creó correctamente.', position: 'top' });
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
          <span class="eyebrow">CRECE CON DATOS, CULTIVA CON CONFIANZA</span>
          <h1>Un campo<br /><em>más inteligente.</em></h1>
          <p>Empieza a monitorear tus terrenos y cultivos desde un solo lugar.</p>
        </div>
        <div class="visual-footer"><span>02</span><span class="footer-line"></span><span>AGRICULTURA DE PRECISIÓN</span></div>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <div class="login-brand-mobile"><BrandMark /></div>
        <p class="eyebrow text-primary">ÚNETE A AGROSMART</p>
        <h2>Crea tu cuenta</h2>
        <p class="login-subtitle">Comienza a gestionar tus cultivos de forma inteligente.</p>
        <q-form class="login-form" @submit.prevent="submit">
          <label for="name">Nombre completo</label>
          <q-input id="name" v-model="name" outlined dense autocomplete="name" placeholder="Tu nombre" :rules="[value => value.trim().length >= 2 || 'Ingresa tu nombre']" />
          <label for="email">Correo electrónico</label>
          <q-input id="email" v-model="email" outlined dense type="email" autocomplete="email" placeholder="tu@agrosmart.com" :rules="[value => !!value || 'Ingresa tu correo']" />
          <label for="password">Contraseña</label>
          <q-input id="password" v-model="password" outlined dense :type="visible ? 'text' : 'password'" autocomplete="new-password" placeholder="Mínimo 8 caracteres" :rules="[value => value.length >= 8 || 'Usa al menos 8 caracteres']">
            <template #append><q-icon :name="visible ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="visible = !visible" /></template>
          </q-input>
          <label for="confirmation">Confirmar contraseña</label>
          <q-input id="confirmation" v-model="confirmation" outlined dense :type="visible ? 'text' : 'password'" autocomplete="new-password" placeholder="Repite tu contraseña" :rules="[value => !!value || 'Confirma tu contraseña']" />
          <q-btn type="submit" label="Crear cuenta" unelevated no-caps class="full-width login-submit q-mt-md" :loading="loading" />
        </q-form>
        <div class="login-footnote">¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión</router-link></div>
      </div>
    </section>
  </main>
</template>
