import React, { memo, useEffect, useState, useRef } from 'react';
import { useAdvancedLazyLoading, useIntelligentPreload } from '@/hooks/useAdvancedLazyLoading';
import { ErrorBoundary } from 'react-error-boundary';
import { 
  FormSkeleton, 
  ChartSkeleton, 
  SearchResultsSkeleton,
  PageLoadingSkeleton,
  TableSkeleton
} from './ui/SkeletonLoaders';

// Componente de carga genérico con skeleton
const ComponentLoader: React.FC<{ name: string; type?: 'form' | 'chart' | 'search' | 'page' | 'table' }> = ({ 
  name, 
  type = 'page' 
}) => {
  const skeletonComponents = {
    form: <FormSkeleton className="p-4" />,
    chart: <ChartSkeleton className="p-4" />,
    search: <SearchResultsSkeleton className="p-4" />,
    table: <TableSkeleton className="p-4" />,
    page: <PageLoadingSkeleton className="min-h-[200px]" />
  };

  return (
    <div className="w-full">
      <div className="sr-only">Cargando {name}...</div>
      {skeletonComponents[type]}
    </div>
  );
};

interface AdvancedLazyWrapperProps {
  importFn: () => Promise<any>;
  cacheKey: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  priority?: 'low' | 'normal' | 'high';
  preloadDistance?: number;
  retryAttempts?: number;
  cacheStrategy?: 'memory' | 'session' | 'none';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface LazyErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const DefaultErrorFallback: React.FC<LazyErrorFallbackProps> = ({ error, retry }) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <div className="flex items-center space-x-2 text-red-700 mb-2">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">Error al cargar componente</span>
    </div>
    <p className="text-sm text-red-600 mb-3">{error.message}</p>
    <button
      onClick={retry}
      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
    >
      Reintentar
    </button>
  </div>
);

/**
 * Wrapper avanzado para lazy loading con características inteligentes
 */
export const AdvancedLazyWrapper: React.FC<AdvancedLazyWrapperProps> = memo(({
  importFn,
  cacheKey,
  fallback,
  errorFallback: ErrorFallback = DefaultErrorFallback,
  priority = 'normal',
  preloadDistance = 200,
  retryAttempts = 3,
  cacheStrategy = 'memory',
  onLoad,
  onError,
  children,
  className,
  style,
  ...props
}) => {
  const {
    elementRef,
    component: LazyComponent,
    isLoading,
    isLoaded,
    error,
    canRetry,
    retry
  } = useAdvancedLazyLoading(importFn, cacheKey, {
    priority,
    preloadDistance,
    retryAttempts,
    cacheStrategy,
    onLoad,
    onError
  });

  // Renderizar error si existe y se puede reintentar
  if (error && canRetry) {
    return (
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className} style={style}>
        <ErrorFallback error={error} retry={retry} />
      </div>
    );
  }

  // Renderizar error final si no se puede reintentar
  if (error && !canRetry) {
    return (
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className} style={style}>
        <div className="p-4 text-center text-red-600">
          <p>No se pudo cargar el componente después de varios intentos.</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Renderizar componente cargado
  if (isLoaded && LazyComponent) {
    return (
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className} style={style}>
        <ErrorBoundary
          fallback={<ErrorFallback error={new Error('Error en el componente')} retry={retry} />}
        >
          <LazyComponent {...props}>
            {children}
          </LazyComponent>
        </ErrorBoundary>
      </div>
    );
  }

  // Renderizar fallback mientras carga
  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className} style={style}>
      {fallback || <ComponentLoader name="Componente" type="page" />}
    </div>
  );
});

AdvancedLazyWrapper.displayName = 'AdvancedLazyWrapper';

// HOC movido a utils/lazyUtils.ts para evitar advertencias de Fast Refresh

// Hook movido a utils/lazyUtils.ts para evitar advertencias de Fast Refresh

/**
 * Componente para preload basado en interacciones del usuario
 */
const InteractionPreloader: React.FC<{
  children: React.ReactNode;
  preloadTargets: Array<{
    key: string;
    importFn: () => Promise<any>;
    trigger: 'hover' | 'focus' | 'click';
    priority?: 'low' | 'normal' | 'high';
  }>;
}> = ({ children, preloadTargets }) => {
  const { addToPreloadQueue } = useIntelligentPreload();
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  const handleInteraction = (trigger: 'hover' | 'focus' | 'click') => {
    preloadTargets
      .filter(target => target.trigger === trigger && !triggered.has(target.key))
      .forEach(target => {
        addToPreloadQueue(target.key, target.importFn, target.priority || 'normal');
        setTriggered(prev => new Set([...prev, target.key]));
      });
  };

  return (
    <div
      onMouseEnter={() => handleInteraction('hover')}
      onFocus={() => handleInteraction('focus')}
      onClick={() => handleInteraction('click')}
    >
      {children}
    </div>
  );
};

/**
 * Componente para lazy loading con detección de viewport
 */
export const ViewportLazyLoader: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onEnterViewport?: () => void;
  onExitViewport?: () => void;
}> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  onEnterViewport,
  onExitViewport
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        const nowVisible = entry.isIntersecting;
        
        setIsVisible(nowVisible);
        
        if (!wasVisible && nowVisible) {
          onEnterViewport?.();
        } else if (wasVisible && !nowVisible) {
          onExitViewport?.();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, isVisible, onEnterViewport, onExitViewport]);

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>}>
      {isVisible ? children : <div className="min-h-[200px]" />}
    </div>
  );
};