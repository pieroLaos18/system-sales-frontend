<template>
  <div class="page-container">
    <div class="background-decor"></div>
    <div class="verificar-box glass">
      <div class="icon-circle">
        <i class="fas fa-user-check"></i>
      </div>
      <h2>Verificación de Cuenta</h2>
      <div v-if="loading" class="loading-msg">Verificando tu cuenta, por favor espera...</div>
      <div v-if="success" class="success">
        {{ success }}<br />
        Serás redirigido en breve...
      </div>
      <div v-if="error" class="error">
        {{ error }}
        <div v-if="allowResend">
          <button @click="reenviarCorreo" class="resend-btn">Reenviar verificación</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/services/api';

export default {
  data() {
    return {
      success: null,
      error: null,
      loading: true,
      allowResend: false,
      email: null, // Se obtendrá desde el backend si es posible
    };
  },
  async mounted() {
    const token = this.$route.query.token;
    console.log('🔐 Token capturado desde URL:', token);

    if (!token || typeof token !== 'string') {
      this.error = 'Token no válido o faltante.';
      this.loading = false;
      return;
    }

    try {
      const response = await axios.post('/auth/verificar', { token });
      this.success = response.data.message;
      this.loading = false;

      setTimeout(() => {
        this.$router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('❌ Error al verificar:', err);
      this.error = err.response?.data?.message || 'Ocurrió un error al verificar la cuenta.';
      this.loading = false;

      // Si el error es por token expirado, permitimos reenviar
      if (
        this.error.toLowerCase().includes('expirado') ||
        this.error.toLowerCase().includes('inválido')
      ) {
        this.allowResend = true;
      }
    }
  },
  methods: {
    async reenviarCorreo() {
      try {
        const email = prompt('Ingresa tu correo electrónico para reenviar el enlace de verificación:');
        if (!email) return;

        const response = await axios.post('/auth/reenviar-verificacion', { correo_electronico: email });
        this.success = response.data.message;
        this.error = null;
        this.allowResend = false;
      } catch (err) {
        this.error = err.response?.data?.message || 'No se pudo reenviar el correo.';
        this.success = null;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #8b5cf6;
  --success-color: #10b981;
  --error-color: #ef4444;
  --text-light: #9ca3af;
  --bg-primary: #ffffff;
}
.page-container {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 1rem;
  margin: 0;
  overflow: auto;
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.background-decor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}
.background-decor::before,
.background-decor::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}
.background-decor::before {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}
.background-decor::after {
  width: 200px;
  height: 200px;
  bottom: -100px;
  right: -100px;
  animation-delay: 10s;
}
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-30px) rotate(120deg); }
  66% { transform: translateY(30px) rotate(240deg); }
}
.glass {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(22px);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(99,102,241,0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  padding: 3.5rem 2.5rem 2.5rem 2.5rem;
  max-width: 420px;
  min-width: 260px;
  width: 100%;
  z-index: 1;
  text-align: center;
  margin: auto;
  animation: slideUp 0.6s ease-out;
  position: relative;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.icon-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 8px 24px rgba(99,102,241,0.18);
  animation: pulse 2s infinite;
}
.icon-circle i {
  color: #fff;
  font-size: 2.5rem;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}
.verificar-box h2 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.loading-msg {
  color: #ffe082;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.success {
  color: #10b981;
  background: rgba(16, 185, 129, 0.13);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border-left: 4px solid var(--success-color);
  margin: 1rem 0 0 0;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  animation: slideIn 0.5s ease-in-out;
}
.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.13);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border-left: 4px solid var(--error-color);
  margin: 1rem 0 0 0;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.resend-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}
.resend-btn:hover {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
}
/* Responsive design */
@media (max-width: 575.98px) {
  .glass {
    padding: 1.5rem 1rem;
    border-radius: 16px;
    max-width: 100%;
    margin: 0 0.5rem;
  }
  .icon-circle {
    width: 54px;
    height: 54px;
    margin-bottom: 1rem;
  }
  .icon-circle i {
    font-size: 1.5rem;
  }
  .verificar-box h2 {
    font-size: 1.3rem;
  }
  .success, .error, .loading-msg {
    font-size: 0.93rem;
  }
}
@media (min-width: 576px) and (max-width: 767.98px) {
  .glass {
    padding: 2rem 1.5rem;
    border-radius: 20px;
    max-width: 480px;
  }
}
@media (min-width: 768px) and (max-width: 991.98px) {
  .glass {
    padding: 2.5rem 2rem;
    border-radius: 24px;
    max-width: 520px;
  }
}
@media (min-width: 992px) and (max-width: 1199.98px) {
  .glass {
    padding: 3rem 2.5rem;
    border-radius: 24px;
    max-width: 560px;
  }
}
@media (min-width: 1200px) {
  .glass {
    padding: 3.5rem 3rem;
    border-radius: 28px;
    max-width: 600px;
  }
}
</style>
