import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface ProgressiveLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  priority?: boolean;
  delay?: number;
  retryCount?: number;
  preloadDistance?: number;
  enablePrefetch?: boolean;
}

interface LoadingState {
  isVisible: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  progress: number;
  retries: number;
}

interface ProgressiveLoadingReturn extends LoadingState {
  elementRef: React.RefObject<HTMLElement>;
  triggerLoad: () => void;
  retry: () => void;
  preload: () => void;
  reset: () => void;
}

/**
 * Hook avanzado para carga progresiva con múltiples estrategias
 */
export const useProgressiveLoading = (
  loadFn: () => Promise<any>,
  options: ProgressiveLoadingOptions = {}
): ProgressiveLoadingReturn => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    priority = false,
    delay = 0,
    retryCount = 3,
    preloadDistance = 200,
    enablePrefetch = true
  } = options;

  const [state, setState] = useState<LoadingState>({
    isVisible: priority,
    isLoading: false,
    isLoaded: false,
    hasError: false,
    progress: 0,
    retries: 0
  });

  const elementRef = useRef<HTMLElement>(null);
  const loadPromiseRef = useRef<Promise<any> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer para detectar visibilidad
  const { isIntersecting } = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin: priority ? '0px' : rootMargin,
    freezeOnceVisible: true
  });

  // Actualizar visibilidad
  useEffect(() => {
    if (isIntersecting && !state.isVisible) {
      setState(prev => ({ ...prev, isVisible: true }));
    }
  }, [isIntersecting, state.isVisible]);

  // Función de carga con manejo de errores y reintentos
  const executeLoad = useCallback(async () => {
    if (state.isLoaded || loadPromiseRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, hasError: false, progress: 0 }));

    try {
      // Simular progreso durante la carga
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 20, 90)
        }));
      }, 100);

      loadPromiseRef.current = loadFn();
      await loadPromiseRef.current;

      clearInterval(progressInterval);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        progress: 100,
        hasError: false
      }));
    } catch (error) {
      console.error('Progressive loading error:', error);
      
      setState(prev => {
        const newRetries = prev.retries + 1;
        return {
          ...prev,
          isLoading: false,
          hasError: newRetries >= retryCount,
          retries: newRetries,
          progress: 0
        };
      });

      // Reintentar automáticamente si no se han agotado los intentos
      if (state.retries < retryCount - 1) {
        const retryDelay = Math.pow(2, state.retries) * 1000;
        timeoutRef.current = setTimeout(() => {
          executeLoad();
        }, retryDelay);
      }
    } finally {
      loadPromiseRef.current = null;
    }
  }, [loadFn, state.isLoaded, state.retries, retryCount]);

  // Trigger de carga cuando sea visible
  useEffect(() => {
    if (state.isVisible && !state.isLoaded && !state.isLoading && !state.hasError) {
      if (delay > 0) {
        timeoutRef.current = setTimeout(executeLoad, delay);
      } else {
        executeLoad();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.isVisible, state.isLoaded, state.isLoading, state.hasError, delay, executeLoad]);

  // Prefetch para elementos cercanos
  useEffect(() => {
    if (!enablePrefetch || priority) return;

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const isNearViewport = rect.top < window.innerHeight + preloadDistance;

      if (isNearViewport && !state.isLoaded && !state.isLoading) {
        executeLoad();
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [enablePrefetch, priority, preloadDistance, state.isLoaded, state.isLoading, executeLoad]);

  // Funciones de control
  const triggerLoad = useCallback(() => {
    if (!state.isLoaded && !state.isLoading) {
      executeLoad();
    }
  }, [state.isLoaded, state.isLoading, executeLoad]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      retries: 0,
      progress: 0
    }));
    executeLoad();
  }, [executeLoad]);

  const preload = useCallback(() => {
    if (!state.isLoaded) {
      executeLoad();
    }
  }, [state.isLoaded, executeLoad]);

  const reset = useCallback(() => {
    setState({
      isVisible: priority,
      isLoading: false,
      isLoaded: false,
      hasError: false,
      progress: 0,
      retries: 0
    });
    loadPromiseRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [priority]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    elementRef,
    triggerLoad,
    retry,
    preload,
    reset
  };
};

// Utility function para throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Hook para carga progresiva de listas con paginación
 */
export const useProgressiveList = <T>(
  loadPageFn: (page: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    preloadPages?: number;
    threshold?: number;
  } = {}
) => {
  const { pageSize = 20, preloadPages = 1, threshold = 0.8 } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadNextPage = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await loadPageFn(currentPage);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        
        // Precargar páginas adicionales si está configurado
        if (preloadPages > 0 && newItems.length === pageSize) {
          for (let i = 1; i <= preloadPages; i++) {
            try {
              const preloadItems = await loadPageFn(currentPage + i);
              if (preloadItems.length > 0) {
                setItems(prev => [...prev, ...preloadItems]);
                setCurrentPage(prev => prev + 1);
              } else {
                setHasMore(false);
                break;
              }
            } catch {
              break;
            }
          }
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [loadPageFn, currentPage, isLoading, hasMore, pageSize, preloadPages]);

  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadNextPage,
    reset
  };
};