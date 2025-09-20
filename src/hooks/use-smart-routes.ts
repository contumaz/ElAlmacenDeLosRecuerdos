import React from 'react';
import { SmartRoute } from '../components/SmartRouter';

// Tipos para las opciones de ruta
interface SmartRouteOptions {
  preloadRelated?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

// Hook para crear rutas optimizadas
export const useSmartRoutes = () => {
  const createRoute = (
    path: string, 
    element: React.ReactElement, 
    options?: SmartRouteOptions
  ): React.ReactElement => {
    return React.createElement(SmartRoute, {
      key: path,
      path,
      element,
      ...options
    });
  };

  return { createRoute };
};