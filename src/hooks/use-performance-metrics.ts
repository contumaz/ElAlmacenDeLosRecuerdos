import { useState, useCallback } from 'react';
import { PerformanceMetrics } from '../components/PerformanceMonitor';

// Instancia del monitor de rendimiento (se importará desde PerformanceMonitor)
let performanceMonitor: any;

/**
 * Hook para usar métricas de rendimiento en componentes
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor?.startMonitoring();
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceMonitor?.stopMonitoring();
  }, []);

  const getMetrics = useCallback(() => {
    return performanceMonitor?.getMetrics();
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMetrics
  };
};