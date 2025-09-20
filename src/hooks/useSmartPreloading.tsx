import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chunkPreloader, getChunksForRoute, getBandwidthStrategy, BANDWIDTH_STRATEGIES } from '../utils/bundleOptimization';

/**
 * Hook para preload inteligente de chunks basado en patrones de navegación
 */
export const useSmartPreloading = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preloadedRoutes = useRef(new Set<string>());
  const hoverTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const strategy = getBandwidthStrategy();
  const config = BANDWIDTH_STRATEGIES[strategy];

  // Preload chunks para la ruta actual
  useEffect(() => {
    const currentRoute = location.pathname;
    if (!preloadedRoutes.current.has(currentRoute)) {
      chunkPreloader.preloadRouteChunks(currentRoute);
      preloadedRoutes.current.add(currentRoute);
    }
  }, [location.pathname]);

  // Configurar Intersection Observer para preload por proximidad
  useEffect(() => {
    if (!config.aggressivePreload) return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && !preloadedRoutes.current.has(href)) {
              // Preload con delay para evitar sobrecarga
              setTimeout(() => {
                chunkPreloader.preloadRouteChunks(href);
                preloadedRoutes.current.add(href);
              }, config.preloadDistance);
            }
          }
        });
      },
      {
        rootMargin: `${config.preloadDistance}px`,
        threshold: 0.1
      }
    );

    return () => {
      intersectionObserver.current?.disconnect();
    };
  }, [config.aggressivePreload, config.preloadDistance]);

  // Preload en hover con debounce
  const handleLinkHover = useCallback((href: string) => {
    if (preloadedRoutes.current.has(href)) return;

    // Limpiar timeout anterior si existe
    const existingTimeout = hoverTimeouts.current.get(href);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Configurar nuevo timeout
    const timeout = setTimeout(() => {
      chunkPreloader.preloadRouteChunks(href);
      preloadedRoutes.current.add(href);
      hoverTimeouts.current.delete(href);
    }, 100); // Delay corto para evitar preloads innecesarios

    hoverTimeouts.current.set(href, timeout);
  }, []);

  // Cancelar preload en mouse leave
  const handleLinkLeave = useCallback((href: string) => {
    const timeout = hoverTimeouts.current.get(href);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeouts.current.delete(href);
    }
  }, []);

  // Registrar link para observación
  const registerLink = useCallback((element: HTMLAnchorElement | null) => {
    if (!element || !intersectionObserver.current) return;

    intersectionObserver.current.observe(element);

    // Cleanup function
    return () => {
      intersectionObserver.current?.unobserve(element);
    };
  }, []);

  // Preload manual de ruta específica
  const preloadRoute = useCallback(async (route: string, priority: 'high' | 'normal' | 'low' = 'normal') => {
    if (preloadedRoutes.current.has(route)) return;

    try {
      await chunkPreloader.preloadRouteChunks(route);
      preloadedRoutes.current.add(route);
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    }
  }, []);

  // Preload de rutas relacionadas basado en patrones de uso
  const preloadRelatedRoutes = useCallback((currentRoute: string) => {
    const relatedRoutes = getRelatedRoutes(currentRoute);
    
    relatedRoutes.forEach((route, index) => {
      // Preload escalonado para evitar sobrecarga
      setTimeout(() => {
        preloadRoute(route, 'low');
      }, index * 500);
    });
  }, [preloadRoute]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    const timeouts = hoverTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return {
    handleLinkHover,
    handleLinkLeave,
    registerLink,
    preloadRoute,
    preloadRelatedRoutes,
    strategy,
    stats: chunkPreloader.getLoadingStats()
  };
};

/**
 * Determina rutas relacionadas basado en patrones de navegación
 */
function getRelatedRoutes(currentRoute: string): string[] {
  const routePatterns: Record<string, string[]> = {
    '/': ['/memorias', '/dashboard'],
    '/memorias': ['/memorias/nueva', '/dashboard', '/analisis-emocional'],
    '/memorias/nueva': ['/memorias', '/configuracion'],
    '/dashboard': ['/memorias', '/analisis-emocional'],
    '/analisis-emocional': ['/dashboard', '/memorias'],
    '/configuracion': ['/memorias', '/dashboard']
  };

  return routePatterns[currentRoute] || [];
}

/**
 * Hook simplificado para preload en hover
 */
export const useHoverPreload = () => {
  const { handleLinkHover, handleLinkLeave } = useSmartPreloading();

  const createHoverProps = useCallback((href: string) => ({
    onMouseEnter: () => handleLinkHover(href),
    onMouseLeave: () => handleLinkLeave(href)
  }), [handleLinkHover, handleLinkLeave]);

  return { createHoverProps };
};

/**
 * Hook para preload basado en Intersection Observer
 */
export const useViewportPreload = () => {
  const { registerLink } = useSmartPreloading();

  const linkRef = useCallback((element: HTMLAnchorElement | null) => {
    return registerLink(element);
  }, [registerLink]);

  return { linkRef };
};

/**
 * Componente HOC para añadir preload automático a links
 */
export const withSmartPreload = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<any, P & { href?: string }>((props, ref) => {
    const { createHoverProps } = useHoverPreload();
    const { linkRef } = useViewportPreload();

    const enhancedProps = {
      ...props,
      ...(props.href ? createHoverProps(props.href) : {}),
      ref: props.href ? linkRef : ref
    } as P & { href?: string };

    return <Component {...enhancedProps} />;
  });
};