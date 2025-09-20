import React, { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  fps: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * Componente para monitoreo de rendimiento en tiempo real
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = true,
  position = 'top-right',
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
    fps: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // Calcular FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(calculateFPS);
    }
  }, [enabled]);

  // Obtener métricas de memoria
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }, []);

  // Actualizar métricas
  const updateMetrics = useCallback(() => {
    if (!enabled) return;

    const newMetrics: PerformanceMetrics = {
      ...metrics,
      memoryUsage: getMemoryUsage(),
      componentCount: document.querySelectorAll('[data-react-component]').length
    };

    // Obtener Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            newMetrics.largestContentfulPaint = Math.round(entry.startTime);
            break;
          case 'first-input':
            newMetrics.firstInputDelay = Math.round((entry as any).processingStart - entry.startTime);
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              newMetrics.cumulativeLayoutShift += (entry as any).value;
            }
            break;
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback para navegadores que no soportan todas las métricas
    }

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    return () => observer.disconnect();
  }, [enabled, metrics, getMemoryUsage, onMetricsUpdate]);

  // Inicializar monitoreo
  useEffect(() => {
    if (!enabled) return;

    calculateFPS();
    const interval = setInterval(updateMetrics, 1000);

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, calculateFPS, updateMetrics]);

  // Integrar con el monitor de rendimiento global
  useEffect(() => {
    if (enabled) {
      performanceMonitor.startMonitoring();
      return () => performanceMonitor.stopMonitoring();
    }
  }, [enabled]);

  if (!enabled || !showOverlay) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getMetricColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.poor) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300`}>
      <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono min-w-[200px]">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Performance</span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-300 hover:text-white"
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
        
        {isVisible && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getMetricColor(metrics.fps, { good: 55, poor: 30 })}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={getMetricColor(metrics.memoryUsage, { good: 50, poor: 100 })}>
                {metrics.memoryUsage}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Components:</span>
              <span>{metrics.componentCount}</span>
            </div>
            
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={getMetricColor(metrics.largestContentfulPaint, { good: 2500, poor: 4000 })}>
                {metrics.largestContentfulPaint}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={getMetricColor(metrics.firstInputDelay, { good: 100, poor: 300 })}>
                {metrics.firstInputDelay}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={getMetricColor(metrics.cumulativeLayoutShift * 1000, { good: 100, poor: 250 })}>
                {metrics.cumulativeLayoutShift.toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



/**
 * Componente para análisis de rendimiento de rutas
 */
export const RoutePerformanceAnalyzer: React.FC<{
  route: string;
  onAnalysisComplete?: (analysis: any) => void;
}> = ({ route, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const analyzeRoute = async () => {
      setIsAnalyzing(true);
      
      try {
        // Simular análisis de rendimiento de ruta
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const routeAnalysis = {
          route,
          loadTime: Math.random() * 2000 + 500,
          bundleSize: Math.random() * 500 + 100,
          renderTime: Math.random() * 100 + 20,
          memoryUsage: Math.random() * 50 + 10,
          recommendations: [
            'Consider code splitting for heavy components',
            'Implement lazy loading for images',
            'Optimize bundle size by removing unused dependencies'
          ]
        };
        
        setAnalysis(routeAnalysis);
        onAnalysisComplete?.(routeAnalysis);
      } catch (error) {
        console.error('Route analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeRoute();
  }, [route, onAnalysisComplete]);

  if (isAnalyzing) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Analyzing route performance...</span>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Route Performance: {route}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Load Time:</span>
          <span className="ml-2 font-mono">{Math.round(analysis.loadTime)}ms</span>
        </div>
        <div>
          <span className="text-gray-600">Bundle Size:</span>
          <span className="ml-2 font-mono">{Math.round(analysis.bundleSize)}KB</span>
        </div>
        <div>
          <span className="text-gray-600">Render Time:</span>
          <span className="ml-2 font-mono">{Math.round(analysis.renderTime)}ms</span>
        </div>
        <div>
          <span className="text-gray-600">Memory:</span>
          <span className="ml-2 font-mono">{Math.round(analysis.memoryUsage)}MB</span>
        </div>
      </div>
      
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {analysis.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar estadísticas de bundle
 */
export const BundleStatsDisplay: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBundleStats = async () => {
      try {
        // En producción, esto cargaría las estadísticas reales del bundle
        const mockStats = {
          totalSize: 1250,
          gzippedSize: 380,
          chunks: [
            { name: 'vendor', size: 650, gzipped: 180 },
            { name: 'main', size: 320, gzipped: 95 },
            { name: 'components', size: 180, gzipped: 65 },
            { name: 'pages', size: 100, gzipped: 40 }
          ],
          loadTime: 1200,
          cacheHitRate: 0.85
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to load bundle stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBundleStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Bundle Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalSize}KB</div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.gzippedSize}KB</div>
          <div className="text-sm text-gray-600">Gzipped</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.loadTime}ms</div>
          <div className="text-sm text-gray-600">Load Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.round(stats.cacheHitRate * 100)}%</div>
          <div className="text-sm text-gray-600">Cache Hit</div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Chunk Breakdown</h4>
        <div className="space-y-2">
          {stats.chunks.map((chunk: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm">{chunk.name}</span>
              <div className="flex space-x-4 text-sm">
                <span>{chunk.size}KB</span>
                <span className="text-gray-600">({chunk.gzipped}KB gzipped)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};