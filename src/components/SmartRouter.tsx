import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Link as RouterLink, LinkProps } from 'react-router-dom';
import { useSmartPreloading, withSmartPreload } from '../hooks/useSmartPreloading';
import { chunkPreloader } from '../utils/bundleOptimization';

// Componente Link mejorado con preload inteligente
export const SmartLink = withSmartPreload(RouterLink);

// Componente de carga optimizado
const OptimizedSuspense: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <div className="flex items-center justify-center min-h-[200px]">Cargando...</div> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Wrapper para rutas con preload automático
interface SmartRouteProps {
  path: string;
  element: React.ReactElement;
  preloadRelated?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

const SmartRoute: React.FC<SmartRouteProps> = ({ 
  path, 
  element, 
  preloadRelated = true,
  priority = 'normal' 
}) => {
  const { preloadRelatedRoutes } = useSmartPreloading();

  useEffect(() => {
    if (preloadRelated) {
      // Preload rutas relacionadas después de un delay
      const timer = setTimeout(() => {
        preloadRelatedRoutes(path);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [path, preloadRelated, preloadRelatedRoutes]);

  return (
    <Route 
      path={path} 
      element={
        <OptimizedSuspense>
          {element}
        </OptimizedSuspense>
      } 
    />
  );
};

// Router principal con optimizaciones
interface SmartRouterProps {
  children: React.ReactNode;
  enablePreloading?: boolean;
  enableAnalytics?: boolean;
}

export const SmartRouter: React.FC<SmartRouterProps> = ({ 
  children, 
  enablePreloading = true,
  enableAnalytics = false 
}) => {
  const { strategy, stats } = useSmartPreloading();

  useEffect(() => {
    if (enableAnalytics) {
      // Log estadísticas de carga cada 30 segundos
      const interval = setInterval(() => {
        console.log('Bundle Loading Stats:', {
          strategy,
          ...stats,
          timestamp: new Date().toISOString()
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [enableAnalytics, strategy, stats]);

  // Preload crítico en idle
  useEffect(() => {
    if (!enablePreloading) return;

    const preloadCritical = () => {
      // Preload chunks críticos cuando el navegador esté idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          chunkPreloader.preloadChunk('react-core', 'high');
          chunkPreloader.preloadChunk('ui-critical', 'high');
          chunkPreloader.preloadChunk('router-vendor', 'high');
        });
      } else {
        // Fallback para navegadores sin requestIdleCallback
        setTimeout(() => {
          chunkPreloader.preloadChunk('react-core', 'high');
          chunkPreloader.preloadChunk('ui-critical', 'high');
          chunkPreloader.preloadChunk('router-vendor', 'high');
        }, 2000);
      }
    };

    preloadCritical();
  }, [enablePreloading]);

  return (
    <Routes>
      {children}
    </Routes>
  );
};



// Componente de navegación optimizada
interface SmartNavProps {
  links: Array<{
    to: string;
    label: string;
    icon?: React.ReactNode;
    priority?: 'high' | 'normal' | 'low';
  }>;
  className?: string;
}

export const SmartNav: React.FC<SmartNavProps> = ({ links, className = '' }) => {
  const { preloadRoute } = useSmartPreloading();

  // Preload de alta prioridad en mount
  useEffect(() => {
    const highPriorityLinks = links.filter(link => link.priority === 'high');
    highPriorityLinks.forEach(link => {
      preloadRoute(link.to, 'high');
    });
  }, [links, preloadRoute]);

  return (
    <nav className={className}>
      {links.map(({ to, label, icon, priority = 'normal' }) => (
        <SmartLink
          key={to}
          to={to}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
          onMouseEnter={() => {
            if (priority === 'normal') {
              preloadRoute(to, 'normal');
            }
          }}
        >
          {icon}
          <span>{label}</span>
        </SmartLink>
      ))}
    </nav>
  );
};

// Componente de breadcrumbs con preload
interface SmartBreadcrumbsProps {
  items: Array<{
    to?: string;
    label: string;
  }>;
  className?: string;
}

export const SmartBreadcrumbs: React.FC<SmartBreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.to ? (
            <SmartLink 
              to={item.to} 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {item.label}
            </SmartLink>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Componente de estadísticas de rendimiento (solo en desarrollo)
export const BundleStats: React.FC = () => {
  const { stats, strategy } = useSmartPreloading();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono z-50">
      <div>Strategy: {strategy}</div>
      <div>Loaded: {stats.loaded} chunks</div>
      <div>Loading: {stats.loading} chunks</div>
      <div>Size: ~{stats.totalEstimatedSize}KB</div>
    </div>
  );
};

export { SmartRoute };