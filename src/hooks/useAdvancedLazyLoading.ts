import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number | number[];
  priority?: 'low' | 'normal' | 'high';
  preloadDistance?: number;
  retryAttempts?: number;
  cacheStrategy?: 'memory' | 'session' | 'none';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LazyLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  retryCount: number;
}

// Cache global para componentes lazy
const componentCache = new Map<string, Promise<any>>();
const sessionCache = new Map<string, any>();

/**
 * Hook avanzado para lazy loading con estrategias inteligentes
 */
export const useAdvancedLazyLoading = (
  importFn: () => Promise<any>,
  cacheKey: string,
  options: LazyLoadingOptions = {}
) => {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    priority = 'normal',
    preloadDistance = 200,
    retryAttempts = 3,
    cacheStrategy = 'memory',
    onLoad,
    onError
  } = options;

  const [state, setState] = useState<LazyLoadingState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    retryCount: 0
  });

  const elementRef = useRef<HTMLElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const [component, setComponent] = useState<any>(null);

  // Intersection Observer para detectar visibilidad
  const { isIntersecting } = useIntersectionObserver(elementRef, {
    rootMargin,
    threshold
  });

  // Función para cargar el componente
  const loadComponent = useCallback(async () => {
    if (state.isLoaded || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let loadedComponent;

      // Verificar cache según estrategia
      if (cacheStrategy === 'memory' && componentCache.has(cacheKey)) {
        loadedComponent = await componentCache.get(cacheKey)!;
      } else if (cacheStrategy === 'session' && sessionCache.has(cacheKey)) {
        loadedComponent = sessionCache.get(cacheKey);
      } else {
        // Cargar componente
        const importPromise = importFn();
        
        // Guardar en cache según estrategia
        if (cacheStrategy === 'memory') {
          componentCache.set(cacheKey, importPromise);
        }
        
        loadedComponent = await importPromise;
        
        if (cacheStrategy === 'session') {
          sessionCache.set(cacheKey, loadedComponent);
        }
      }

      setComponent(loadedComponent.default || loadedComponent);
      setState(prev => ({ ...prev, isLoading: false, isLoaded: true }));
      onLoad?.();

    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err,
        retryCount: prev.retryCount + 1
      }));
      onError?.(err);
    }
  }, [importFn, cacheKey, cacheStrategy, state.isLoaded, state.isLoading, onLoad, onError]);

  // Función para reintentar carga
  const retry = useCallback(() => {
    if (state.retryCount < retryAttempts) {
      setState(prev => ({ ...prev, error: null }));
      loadComponent();
    }
  }, [loadComponent, state.retryCount, retryAttempts]);

  // Preload inteligente basado en prioridad
  const preload = useCallback(() => {
    if (priority === 'high') {
      loadComponent();
    } else if (priority === 'normal') {
      // Preload con delay para componentes normales
      loadTimeoutRef.current = setTimeout(loadComponent, 100);
    }
    // Los componentes de baja prioridad solo se cargan cuando son visibles
  }, [loadComponent, priority]);

  // Efecto para manejar la carga basada en visibilidad
  useEffect(() => {
    if (isIntersecting && !state.isLoaded && !state.isLoading) {
      loadComponent();
    }
  }, [isIntersecting, loadComponent, state.isLoaded, state.isLoading]);

  // Efecto para preload basado en prioridad
  useEffect(() => {
    if (priority === 'high') {
      preload();
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [preload, priority]);

  // Preload inteligente basado en distancia del scroll
  useEffect(() => {
    if (!elementRef.current || priority === 'low') return;

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const distanceFromViewport = Math.abs(rect.top - window.innerHeight);

      if (distanceFromViewport <= preloadDistance && !state.isLoaded && !state.isLoading) {
        loadComponent();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadComponent, preloadDistance, priority, state.isLoaded, state.isLoading]);

  return {
    elementRef,
    component,
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    error: state.error,
    canRetry: state.retryCount < retryAttempts,
    retry,
    preload,
    loadComponent
  };
};

/**
 * Hook para preload inteligente de múltiples componentes
 */
export const useIntelligentPreload = () => {
  const [preloadQueue, setPreloadQueue] = useState<Array<{
    key: string;
    importFn: () => Promise<any>;
    priority: 'low' | 'normal' | 'high';
  }>>([]);

  const addToPreloadQueue = useCallback((key: string, importFn: () => Promise<any>, priority: 'low' | 'normal' | 'high' = 'normal') => {
    setPreloadQueue(prev => {
      const exists = prev.find(item => item.key === key);
      if (exists) return prev;
      
      const newItem = { key, importFn, priority };
      // Ordenar por prioridad
      const sorted = [...prev, newItem].sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      return sorted;
    });
  }, []);

  const processPreloadQueue = useCallback(async () => {
    if (preloadQueue.length === 0) return;

    // Procesar elementos de alta prioridad inmediatamente
    const highPriority = preloadQueue.filter(item => item.priority === 'high');
    const normalPriority = preloadQueue.filter(item => item.priority === 'normal');
    const lowPriority = preloadQueue.filter(item => item.priority === 'low');

    // Cargar alta prioridad inmediatamente
    await Promise.allSettled(highPriority.map(item => {
      if (!componentCache.has(item.key)) {
        const promise = item.importFn();
        componentCache.set(item.key, promise);
        return promise;
      }
      return Promise.resolve();
    }));

    // Cargar prioridad normal con delay
    setTimeout(async () => {
      await Promise.allSettled(normalPriority.map(item => {
        if (!componentCache.has(item.key)) {
          const promise = item.importFn();
          componentCache.set(item.key, promise);
          return promise;
        }
        return Promise.resolve();
      }));
    }, 500);

    // Cargar baja prioridad cuando el navegador esté idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        await Promise.allSettled(lowPriority.map(item => {
          if (!componentCache.has(item.key)) {
            const promise = item.importFn();
            componentCache.set(item.key, promise);
            return promise;
          }
          return Promise.resolve();
        }));
      });
    }

    setPreloadQueue([]);
  }, [preloadQueue]);

  useEffect(() => {
    if (preloadQueue.length > 0) {
      const timer = setTimeout(processPreloadQueue, 100);
      return () => clearTimeout(timer);
    }
  }, [preloadQueue, processPreloadQueue]);

  return {
    addToPreloadQueue,
    queueLength: preloadQueue.length
  };
};

/**
 * Utilidad para limpiar cache
 */
export const clearLazyLoadingCache = (strategy: 'memory' | 'session' | 'all' = 'all') => {
  if (strategy === 'memory' || strategy === 'all') {
    componentCache.clear();
  }
  if (strategy === 'session' || strategy === 'all') {
    sessionCache.clear();
  }
};

/**
 * Hook para monitorear el rendimiento del lazy loading
 */
export const useLazyLoadingMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalLoaded: 0,
    totalErrors: 0,
    averageLoadTime: 0,
    cacheHitRate: 0
  });

  const recordLoad = useCallback((loadTime: number, fromCache: boolean) => {
    setMetrics(prev => ({
      totalLoaded: prev.totalLoaded + 1,
      totalErrors: prev.totalErrors,
      averageLoadTime: (prev.averageLoadTime * prev.totalLoaded + loadTime) / (prev.totalLoaded + 1),
      cacheHitRate: fromCache 
        ? (prev.cacheHitRate * prev.totalLoaded + 1) / (prev.totalLoaded + 1)
        : (prev.cacheHitRate * prev.totalLoaded) / (prev.totalLoaded + 1)
    }));
  }, []);

  const recordError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalErrors: prev.totalErrors + 1
    }));
  }, []);

  return {
    metrics,
    recordLoad,
    recordError
  };
};