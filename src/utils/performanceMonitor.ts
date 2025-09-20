/**
 * Monitor de rendimiento global para la aplicación
 */

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  fps: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

class PerformanceMonitor {
  private isMonitoring = false;
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
    fps: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  };
  private observers: PerformanceObserver[] = [];
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Inicia el monitoreo de rendimiento
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.startMetricsCollection();
  }

  /**
   * Detiene el monitoreo de rendimiento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.cleanupObservers();
    this.cleanupIntervals();
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Configura los observadores de rendimiento
   */
  private setupObservers(): void {
    try {
      // Observer para Core Web Vitals
      const webVitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.metrics.largestContentfulPaint = Math.round(entry.startTime);
              break;
            case 'first-input':
              this.metrics.firstInputDelay = Math.round((entry as any).processingStart - entry.startTime);
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                this.metrics.cumulativeLayoutShift += (entry as any).value;
              }
              break;
          }
        }
      });

      webVitalsObserver.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
      this.observers.push(webVitalsObserver);

      // Observer para navegación
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.renderTime = Math.round(navEntry.loadEventEnd - navEntry.fetchStart);
          }
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Some performance observers are not supported:', error);
    }
  }

  /**
   * Inicia la recolección de métricas
   */
  private startMetricsCollection(): void {
    // Actualizar métricas cada segundo
    const metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
    
    this.intervals.push(metricsInterval);
  }

  /**
   * Actualiza las métricas de rendimiento
   */
  private updateMetrics(): void {
    // Memoria
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }

    // Conteo de componentes (aproximado)
    this.metrics.componentCount = document.querySelectorAll('[data-react-component]').length;
  }

  /**
   * Limpia los observadores
   */
  private cleanupObservers(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers = [];
  }

  /**
   * Limpia los intervalos
   */
  private cleanupIntervals(): void {
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.intervals = [];
  }

  /**
   * Obtiene el estado del monitoreo
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Reinicia las métricas
   */
  resetMetrics(): void {
    this.metrics = {
      renderTime: 0,
      componentCount: 0,
      memoryUsage: 0,
      fps: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    };
  }
}

// Instancia singleton del monitor de rendimiento
export const performanceMonitor = new PerformanceMonitor();

// Exportar la clase para casos de uso avanzados
export { PerformanceMonitor };

// Exportar tipos
export type { PerformanceMetrics };