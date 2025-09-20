import React, { useState } from 'react';
import { useIntelligentPreload } from '@/hooks/useAdvancedLazyLoading';

/**
 * HOC para crear componentes lazy con configuración avanzada
 */
export const createAdvancedLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    cacheKey: string;
    fallback?: React.ReactNode;
    errorFallback?: React.ComponentType<any>;
    priority?: 'low' | 'normal' | 'high';
    preloadDistance?: number;
    retryAttempts?: number;
    cacheStrategy?: 'memory' | 'session' | 'none';
  }
): React.ComponentType<P> => {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent = React.memo<P>((props) => {
    return (
      <React.Suspense fallback={options.fallback || <div>Cargando...</div>}>
        <LazyComponent {...(props as any)} />
      </React.Suspense>
    );
  });

  WrappedComponent.displayName = `AdvancedLazy(${options.cacheKey})`;
  return WrappedComponent;
};

/**
 * Hook para preload inteligente de componentes relacionados
 */
export const useSmartPreload = () => {
  const { addToPreloadQueue } = useIntelligentPreload();
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());

  const preloadRoute = (route: string, importFn: () => Promise<any>, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (!preloadedRoutes.has(route)) {
      addToPreloadQueue(route, importFn, priority);
      setPreloadedRoutes(prev => new Set([...prev, route]));
    }
  };

  const preloadRelatedComponents = (currentRoute: string) => {
    // Lógica para precargar componentes relacionados basada en la ruta actual
    const relatedComponents: Record<string, Array<{ key: string; importFn: () => Promise<any>; priority: 'low' | 'normal' | 'high' }>> = {
      '/memorias': [
        { key: 'nueva-memoria', importFn: () => import('@/pages/NuevaMemoria'), priority: 'high' },
        { key: 'ver-memoria', importFn: () => import('@/pages/VerMemoria'), priority: 'normal' },
        { key: 'export-dialog', importFn: () => import('@/components/ExportDialog'), priority: 'low' }
      ],
      '/nueva-memoria': [
        { key: 'memorias', importFn: () => import('@/pages/Memorias'), priority: 'high' },
        { key: 'tag-manager', importFn: () => import('@/components/TagManager'), priority: 'normal' }
      ],
      '/dashboard': [
        { key: 'analisis-emocional', importFn: () => import('@/pages/AnalisisEmocional'), priority: 'normal' },
        { key: 'configuracion', importFn: () => import('@/pages/Configuracion'), priority: 'low' }
      ]
    };

    const related = relatedComponents[currentRoute];
    if (related) {
      related.forEach(({ key, importFn, priority }) => {
        preloadRoute(key, importFn, priority);
      });
    }
  };

  return {
    preloadRoute,
    preloadRelatedComponents,
    preloadedRoutes: Array.from(preloadedRoutes)
  };
};