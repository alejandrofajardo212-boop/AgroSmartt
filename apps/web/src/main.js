import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Notify, Dialog } from 'quasar';
import iconSet from 'quasar/icon-set/material-icons';
import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css';
import './css/app.css';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(createPinia())
  .use(router)
  .use(Quasar, { plugins: { Notify, Dialog }, iconSet })
  .mount('#app');
