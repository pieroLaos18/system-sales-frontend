// Importa Vue y la función para crear la aplicación
import { createApp } from 'vue';

// Importa el componente principal de la aplicación
import App from './App.vue';

// Importa los estilos globales de la aplicación
import './assets/css/global.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'vue-datepicker-next/index.css';

// Importa el router
import router from './router';

// Importa axios
import axios from 'axios';

// Importa Application Insights
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Configura axios con interceptor global de errores
axios.interceptors.response.use(
  response => response,
  error => {
    const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
    const isLoginRoute = router.currentRoute.value.path === '/login' || router.currentRoute.value.path === '/';

    if (isAuthError && !isLoginRoute) {
      localStorage.clear();
      router.push('/login');
      alert('Tu usuario ha sido desactivado o tu sesión ha expirado.');
    }
    return Promise.reject(error);
  }
);

// Inicializa Application Insights (versión segura y mínima)
console.log('Application Insights KEY:', import.meta.env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY);

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: import.meta.env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY,
    enableAutoRouteTracking: false, // Desactiva seguimiento automático temporalmente
    disableAjaxTracking: true,
    disableFetchTracking: true
  }
});
appInsights.loadAppInsights();
appInsights.trackEvent({ name: 'AppStarted' }); // Evento simple de prueba
window.appInsights = appInsights;

// Inicializa la app Vue
createApp(App)
  .use(router)
  .mount('#app');
