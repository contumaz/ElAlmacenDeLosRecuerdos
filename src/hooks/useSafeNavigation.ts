import React, { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';

/**
 * Hook de navegación segura que previene errores DOM críticos
 * durante transiciones de componentes React
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  
  // Cleanup automático al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const safeNavigate = useCallback((to: string, options?: any) => {
    return new Promise<void>((resolve) => {
      if (!isMountedRef.current) {
        console.warn('[useSafeNavigation] Componente desmontado, cancelando navegación');
        resolve();
        return;
      }
      
      // Forzar flush de actualizaciones pendientes ANTES de navegación
      try {
        flushSync(() => {
          // Permitir que React complete cualquier actualización pendiente
        });
      } catch (error) {
        console.warn('[useSafeNavigation] Error en flushSync:', error);
      }
      
      // Delay mínimo pero crítico para evitar conflictos DOM
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            navigate(to, options);
            console.log('[useSafeNavigation] Navegación exitosa a:', to);
          } catch (error) {
            console.error('[useSafeNavigation] Error en navegación:', error);
          }
        } else {
          console.warn('[useSafeNavigation] Componente desmontado durante delay, navegación cancelada');
        }
        resolve();
      }, 15); // 15ms es el mínimo efectivo para React 18
      
      // Cleanup del timeout si el componente se desmonta
      const originalCleanup = isMountedRef.current;
      if (originalCleanup) {
        const cleanup = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        
        // Registrar cleanup global si está disponible
        if (typeof window !== 'undefined' && (window as any).domCleaner) {
          (window as any).domCleaner.addCleanup(cleanup);
        }
      }
    });
  }, [navigate]);
  
  /**
   * Navegación inmediata para casos donde no hay riesgo DOM
   */
  const immediateNavigate = useCallback((to: string, options?: any) => {
    if (isMountedRef.current) {
      navigate(to, options);
    }
  }, [navigate]);
  
  /**
   * Verificar si el componente está montado
   */
  const isMounted = useCallback(() => isMountedRef.current, []);
  
  return { 
    safeNavigate, 
    immediateNavigate,
    isMountedRef,
    isMounted
  };
}

/**
 * HOC para envolver componentes con navegación segura automática
 */
export function withSafeNavigation<T extends object>(Component: React.ComponentType<T>) {
  return function SafeNavigationWrapper(props: T) {
    const navigation = useSafeNavigation();
    
    return React.createElement(Component, { 
      ...props, 
      safeNavigation: navigation 
    } as T & { safeNavigation: ReturnType<typeof useSafeNavigation> });
  };
}
