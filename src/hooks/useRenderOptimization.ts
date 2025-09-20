import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { debounce, throttle } from 'lodash';

/**
 * Hook para optimización avanzada de renderizado con memoización inteligente
 */
export const useRenderOptimization = <T extends Record<string, any>>(
  data: T,
  dependencies: React.DependencyList = [],
  options: {
    debounceMs?: number;
    throttleMs?: number;
    deepCompare?: boolean;
    maxCacheSize?: number;
  } = {}
) => {
  const {
    debounceMs = 300,
    throttleMs = 100,
    deepCompare = false,
    maxCacheSize = 50
  } = options;

  const cacheRef = useRef(new Map<string, any>());
  const renderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());

  // Memoización inteligente con cache LRU
  const memoizedData = useMemo(() => {
    const cacheKey = deepCompare 
      ? JSON.stringify(data) 
      : dependencies.join('|');
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    // Implementar LRU cache
    if (cacheRef.current.size >= maxCacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    const processedData = { ...data };
    cacheRef.current.set(cacheKey, processedData);
    return processedData;
  }, [data, deepCompare, dependencies, maxCacheSize]);

  // Debounced update para evitar renders excesivos
  const debouncedUpdate = useCallback(
    (newData: T) => {
      const debouncedFn = debounce((data: T) => {
        return data;
      }, debounceMs);
      return debouncedFn(newData);
    },
    [debounceMs]
  );

  // Throttled update para actualizaciones frecuentes
  const throttledUpdate = useCallback(
    (newData: T) => {
      const throttledFn = throttle((data: T) => {
        return data;
      }, throttleMs);
      return throttledFn(newData);
    },
    [throttleMs]
  );

  // Métricas de rendimiento
  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.debug('Render #' + renderCountRef.current + ', Time since last: ' + timeSinceLastRender + 'ms');
    }
  });

  return {
    data: memoizedData,
    debouncedUpdate,
    throttledUpdate,
    renderCount: renderCountRef.current,
    clearCache: () => cacheRef.current.clear()
  };
};

/**
 * Hook para optimización de listas grandes con virtualización
 */
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index,
        top: (visibleRange.startIndex + index) * itemHeight
      }));
  }, [items, visibleRange, itemHeight]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Detectar fin de scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    isScrolling,
    visibleRange
  };
};

/**
 * Hook para optimización de formularios con validación inteligente
 */
export const useOptimizedForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<keyof T, string | null>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Validación debounced
  const debouncedValidation = useCallback(
    (newValues: T) => {
      const debouncedFn = debounce(async (values: T) => {
        if (!validationSchema) return;
        
        setIsValidating(true);
        try {
          const validationErrors = validationSchema(values);
          setErrors(validationErrors);
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setIsValidating(false);
        }
      }, 300);
      return debouncedFn(newValues);
    },
    [validationSchema]
  );

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Trigger validation
    const newValues = { ...values, [field]: value };
    debouncedValidation(newValues);
  }, [values, debouncedValidation]);

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    setValue,
    setFieldError,
    resetForm
  };
};

/**
 * Hook para detección de cambios de viewport y optimización responsive
 */
export const useResponsiveOptimization = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  const updateViewport = useCallback(
    () => {
      const throttledFn = throttle(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        setViewport({
          width,
          height,
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024
        });
      }, 100);
      return throttledFn();
    },
    []
  );

  useEffect(() => {
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [updateViewport]);

  return viewport;
};

/**
 * Hook para optimización de imágenes con lazy loading inteligente
 */
export const useImageOptimization = (src: string, options: {
  placeholder?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
} = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
    quality = 80,
    format = 'auto',
    sizes = '100vw'
  } = options;

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Generar URL optimizada
  const optimizedSrc = useMemo(() => {
    if (!isInView) return placeholder;
    
    // Aquí se podría integrar con un servicio de optimización de imágenes
    // Por ahora, retornamos la URL original
    return src;
  }, [src, isInView, placeholder]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    setError('Failed to load image');
    setIsLoaded(false);
  }, []);

  return {
    src: optimizedSrc,
    isLoaded,
    isInView,
    error,
    imgRef,
    imgProps: {
      ref: imgRef,
      src: optimizedSrc,
      onLoad: handleLoad,
      onError: handleError,
      loading: 'lazy' as const,
      sizes
    }
  };
};

/**
 * HOC para optimización automática de componentes
 */
export const withRenderOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: boolean;
    profiler?: boolean;
    errorBoundary?: boolean;
  } = {}
) => {
  const { memo = true, profiler = false, errorBoundary = false } = options;

  let OptimizedComponent = Component;

  // Aplicar React.memo si está habilitado
  if (memo) {
    OptimizedComponent = React.memo(OptimizedComponent) as React.ComponentType<P>;
  }

  // Envolver con Profiler si está habilitado
  if (profiler && process.env.NODE_ENV === 'development') {
    const ProfiledComponent = (props: P) => {
      const onRenderCallback = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        console.debug('Component ' + id + ' ' + phase + ': ' + actualDuration + 'ms');
      };

      return React.createElement(
        React.Profiler,
        {
          id: Component.displayName || Component.name,
          onRender: onRenderCallback
        },
        React.createElement(OptimizedComponent, props)
      );
    };
    OptimizedComponent = ProfiledComponent;
  }

  // Envolver con Error Boundary si está habilitado
  if (errorBoundary) {
    class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Component error:', error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return React.createElement(
            'div',
            { className: 'error-fallback p-4 text-center' },
            React.createElement('h3', null, 'Something went wrong'),
            React.createElement(
              'button',
              {
                onClick: () => this.setState({ hasError: false }),
                className: 'mt-2 px-4 py-2 bg-blue-500 text-white rounded'
              },
              'Try again'
            )
          );
        }

        return this.props.children;
      }
    }

    const ErrorBoundaryWrapper = (props: P) => {
      return React.createElement(
        ErrorBoundary,
        null,
        React.createElement(OptimizedComponent, props)
      );
    };
    OptimizedComponent = ErrorBoundaryWrapper;
  }

  return OptimizedComponent;
};