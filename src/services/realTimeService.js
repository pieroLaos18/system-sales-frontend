/**
 * Servicio para manejo de datos en tiempo real (solo polling)
 */

class RealTimeService {
  constructor() {
    this.pollingInterval = null;
    this.listeners = new Map();
    this.isConnected = false;

    this.config = {
      pollingInterval: 30000, // 30 segundos
    };

    this.errorHistory = {
      consecutiveErrors: 0,
      lastErrorTime: null,
      lastErrorMessage: null,
      suppressionActive: false
    };

    this.suppressionThreshold = 3;
    this.suppressionInterval = 5 * 60 * 1000;
    this.lastSuppressedSummary = null;
  }

  async initialize() {
    console.log('🚀 Inicializando servicio de tiempo real (polling)...');
    this.initPolling();
  }

  initPolling() {
    console.log(`⏰ Iniciando polling cada ${this.config.pollingInterval / 1000}s`);
    this.isConnected = true;
    this.notifyListeners('connection', { status: 'connected', type: 'polling' });

    this.resetErrorTracking();

    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchLatestData();
        if (this.errorHistory.consecutiveErrors > 0) {
          this.handlePollingRecovery();
        }
      } catch (error) {
        this.handlePollingError(error);
      }
    }, this.config.pollingInterval);
  }

  async fetchLatestData() {
    const { default: api } = await import('./api');

    const [resumen, metodos, ventasDia, topProducts, activities] = await Promise.all([
      api.get('/sales/resumen'),
      api.get('/sales/metodos-pago'),
      api.get('/sales/ventas-por-dia'),
      api.get('/sales/top-products?limit=5'),
      api.get('/actividades/recientes?limit=5')
    ]);

    const data = {
      type: 'dashboard_update',
      timestamp: Date.now(),
      data: {
        resumen: resumen.data,
        metodosPago: metodos.data,
        ventasPorDia: ventasDia.data,
        topProducts: topProducts.data,
        recentActivities: activities.data
      }
    };

    this.handleRealTimeData(data);
  }

  handleRealTimeData(data) {
    this.notifyListeners(data.type, data.data);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.removeListener(event, callback);
  }

  removeListener(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('❌ Error en callback de evento:', err);
        }
      });
    }
  }

  async forceUpdate() {
    try {
      await this.fetchLatestData();
    } catch (error) {
      this.handlePollingError(error);
    }
  }

  handlePollingError(error) {
    const e = this.errorHistory;
    e.consecutiveErrors++;
    e.lastErrorTime = Date.now();
    e.lastErrorMessage = error.message || 'Unknown error';

    if (e.consecutiveErrors <= this.suppressionThreshold) {
      console.error('❌ Error en polling:', error);
      this.notifyListeners('connection', { status: 'error', type: 'polling', error });
    } else if (!e.suppressionActive) {
      e.suppressionActive = true;
      console.warn('⚠️ Suprimiendo logs de errores repetidos (polling).');
      this.notifyListeners('connection', {
        status: 'error_suppressed',
        type: 'polling',
        consecutiveErrors: e.consecutiveErrors,
        message: 'Errores consecutivos, logs suprimidos'
      });
    }

    this.logSuppressedSummary();
  }

  handlePollingRecovery() {
    const e = this.errorHistory;

    if (e.suppressionActive) {
      console.log(`✅ Recuperado después de ${e.consecutiveErrors} errores.`);
      this.notifyListeners('connection', {
        status: 'recovered',
        type: 'polling',
        previousErrors: e.consecutiveErrors
      });
    }

    this.resetErrorTracking();
  }

  logSuppressedSummary() {
    const now = Date.now();
    const e = this.errorHistory;

    if (!this.lastSuppressedSummary || (now - this.lastSuppressedSummary >= this.suppressionInterval)) {
      this.lastSuppressedSummary = now;
      console.log(`📊 Polling: ${e.consecutiveErrors} errores consecutivos. Último error: ${e.lastErrorMessage}`);
    }
  }

  resetErrorTracking() {
    this.errorHistory = {
      consecutiveErrors: 0,
      lastErrorTime: null,
      lastErrorMessage: null,
      suppressionActive: false
    };
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      type: 'polling',
      pollingErrors: this.errorHistory
    };
  }

  async requestUpdate(component = 'dashboard') {
    console.log(`🔄 Actualizando manualmente: ${component}`);
    await this.forceUpdate();
  }

  destroy() {
    console.log('🛑 Deteniendo servicio de tiempo real...');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.listeners.clear();
    this.isConnected = false;
    this.resetErrorTracking();
  }
}

// Exportar instancia singleton
const realTimeService = new RealTimeService();
export default realTimeService;
