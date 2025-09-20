import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useAuth } from './use-auth-hook';

/**
 * Configuración de rutas válidas del sistema
 * Separa rutas públicas de las protegidas que requieren autenticación
 */
const VALID_ROUTES = {
  /** Rutas accesibles sin autenticación */
  public: ['/login'],
  /** Rutas que requieren autenticación */
  protected: [
    '/',
    '/memorias',
    '/memorias/nueva',
    '/memorias/texto',
    '/memorias/audio', 
    '/memorias/foto',
    '/memorias/video',
    '/entrevistas',
    '/configuracion'
  ]
};

/** Tipos de memoria válidos para navegación */
const VALID_MEMORY_TYPES = ['texto', 'audio', 'foto', 'video'];

/**
 * Hook personalizado para navegación segura en la aplicación
 * Proporciona funciones de navegación con validación de rutas y autenticación
 * 
 * @returns {Object} Objeto con funciones de navegación y estado actual
 * 
 * @example
 * ```tsx
 * const {
 *   navigate,
 *   goBack,
 *   goHome,
 *   navigateToMemories,
 *   isNavigating,
 *   currentPath,
 *   canAccessRoute
 * } = useNavigation();
 * 
 * // Navegación segura
 * navigate('/memorias');
 * 
 * // Navegación específica a memorias
 * navigateToMemories('audio');
 * 
 * // Verificar acceso
 * if (canAccessRoute('/configuracion')) {
 *   navigate('/configuracion');
 * }
 * ```
 */
export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  // Validar si una ruta es válida
  const isValidRoute = useCallback((path: string): boolean => {
    // Verificar rutas públicas
    if (VALID_ROUTES.public.includes(path)) {
      return true;
    }

    // Verificar rutas protegidas
    if (VALID_ROUTES.protected.includes(path)) {
      return isAuthenticated;
    }

    // Verificar rutas dinámicas de memorias específicas
    const memoryViewMatch = path.match(/^\/memorias\/(\d+)$/);
    if (memoryViewMatch && isAuthenticated) {
      return true; // Ruta para ver memoria específica
    }

    const memoryEditMatch = path.match(/^\/memorias\/(\d+)\/editar$/);
    if (memoryEditMatch && isAuthenticated) {
      return true; // Ruta para editar memoria específica
    }

    // Verificar rutas de tipos de memorias
    const memoryTypeMatch = path.match(/^\/memorias\/([^/]+)$/);
    if (memoryTypeMatch) {
      const type = memoryTypeMatch[1];
      return VALID_MEMORY_TYPES.includes(type) && isAuthenticated;
    }

    return false;
  }, [isAuthenticated]);

  // Navegación segura con validación
  const safeNavigate = useCallback((
    to: string, 
    options?: { replace?: boolean; state?: any }
  ) => {
    setIsNavigating(true);

    try {
      // Validar que la ruta sea válida
      if (!isValidRoute(to)) {
        console.warn(`Intento de navegación a ruta inválida: ${to}`);
        setIsNavigating(false);
        return false;
      }

      // Verificar autenticación para rutas protegidas
      if (!VALID_ROUTES.public.includes(to) && !isAuthenticated) {
        navigate('/login', { replace: true });
        setIsNavigating(false);
        return false;
      }

      // Realizar navegación
      setTimeout(() => {
        navigate(to, options);
        setIsNavigating(false);
      }, 100); // Pequeño delay para feedback visual

      return true;
    } catch (error) {
      console.error('Error en navegación:', error);
      setIsNavigating(false);
      return false;
    }
  }, [navigate, isValidRoute, isAuthenticated]);

  // Navegación específica para memorias
  const navigateToMemories = useCallback((type?: string) => {
    if (type && !VALID_MEMORY_TYPES.includes(type)) {
      console.warn(`Tipo de memoria inválido: ${type}`);
      return safeNavigate('/memorias');
    }
    
    const path = type ? `/memorias/${type}` : '/memorias';
    return safeNavigate(path);
  }, [safeNavigate]);

  // Navegación con breadcrumbs automáticos
  const navigateWithBreadcrumbs = useCallback((to: string) => {
    const breadcrumbs = generateBreadcrumbs(to);
    return safeNavigate(to, { state: { breadcrumbs } });
  }, [safeNavigate]);

  // Ir atrás de forma segura
  const goBack = useCallback(() => {
    try {
      setIsNavigating(true);
      setTimeout(() => {
        navigate(-1);
        setIsNavigating(false);
      }, 100);
    } catch (error) {
      console.error('Error al ir atrás:', error);
      // Fallback al dashboard
      safeNavigate('/');
    }
  }, [navigate, safeNavigate]);

  // Ir al dashboard
  const goHome = useCallback(() => {
    return safeNavigate('/');
  }, [safeNavigate]);

  // Obtener información de la ruta actual
  const getCurrentRouteInfo = useCallback(() => {
    const { pathname } = location;
    
    return {
      path: pathname,
      isValid: isValidRoute(pathname),
      isProtected: !VALID_ROUTES.public.includes(pathname),
      breadcrumbs: generateBreadcrumbs(pathname),
      params,
      memoryType: params.tipo && VALID_MEMORY_TYPES.includes(params.tipo) ? params.tipo : null
    };
  }, [location, isValidRoute, params]);

  // Verificar si el usuario puede acceder a una ruta
  const canAccessRoute = useCallback((path: string): boolean => {
    if (VALID_ROUTES.public.includes(path)) {
      return true;
    }

    if (!isAuthenticated) {
      return false;
    }

    // Aquí se pueden añadir más validaciones de roles/permisos
    return isValidRoute(path);
  }, [isAuthenticated, isValidRoute]);

  return {
    // Navegación básica
    navigate: safeNavigate,
    goBack,
    goHome,
    
    // Navegación específica
    navigateToMemories,
    navigateWithBreadcrumbs,
    
    // Estado
    isNavigating,
    location,
    params,
    
    // Información de rutas
    getCurrentRouteInfo,
    isValidRoute,
    canAccessRoute,
    
    // Utilidades
    currentPath: location.pathname,
    isHomePage: location.pathname === '/',
    isMemoriesPage: location.pathname.startsWith('/memorias'),
    isLoginPage: location.pathname === '/login'
  };
}

// Función auxiliar para generar breadcrumbs
function generateBreadcrumbs(path: string) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Inicio', href: '/' }];

  let currentPath = '';
  
  for (const segment of segments) {
    currentPath += `/${segment}`;
    
    let label = segment;
    
    // Personalizar labels
    switch (segment) {
      case 'memorias':
        label = 'Memorias';
        break;
      case 'nueva':
        label = 'Nueva Memoria';
        break;
      case 'entrevistas':
        label = 'Entrevistas';
        break;
      case 'configuracion':
        label = 'Configuración';
        break;
      case 'texto':
        label = 'Textos';
        break;
      case 'audio':
        label = 'Audio';
        break;
      case 'foto':
        label = 'Fotos';
        break;
      case 'video':
        label = 'Videos';
        break;
      default:
        // Capitalizar primera letra
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

export default useNavigation;
