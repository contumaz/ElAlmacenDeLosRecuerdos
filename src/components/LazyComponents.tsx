import React, { lazy, Suspense } from 'react';
import { ComponentLoader } from './ComponentLoader';
import { createAdvancedLazyComponent } from '@/utils/lazyUtils';
import { usePreloadComponents } from '@/hooks/use-preload-components';

// Advanced lazy loading de componentes pesados con cache inteligente
export const ExportDialog = createAdvancedLazyComponent(
  () => import('./ExportDialog'),
  {
    cacheKey: 'export-dialog',
    fallback: <ComponentLoader name="Exportador" type="form" />,
    priority: 'low', // Se carga solo cuando se necesita
    cacheStrategy: 'session',
    retryAttempts: 2
  }
);

export const AdvancedSearchBar = createAdvancedLazyComponent(
  () => import('./AdvancedSearchBar'),
  {
    cacheKey: 'advanced-search',
    fallback: <ComponentLoader name="Búsqueda Avanzada" type="search" />,
    priority: 'normal', // Preload moderado
    cacheStrategy: 'memory',
    preloadDistance: 300
  }
);

export const ChartContainer = createAdvancedLazyComponent(
  () => import('./ui/chart').then(module => ({ default: module.ChartContainer })),
  {
    cacheKey: 'chart-container',
    fallback: <ComponentLoader name="Gráfico" type="chart" />,
    priority: 'normal',
    cacheStrategy: 'memory',
    retryAttempts: 3
  }
);

// Lazy loading tradicional como fallback
const LazyExportDialogFallback = lazy(() => import('./ExportDialog'));
const LazyAdvancedSearchBarFallback = lazy(() => import('./AdvancedSearchBar'));
const LazyChartFallback = lazy(() => import('./ui/chart').then(module => ({ default: module.ChartContainer })));

// Componentes con Suspense wrapper (mantener compatibilidad)
export const ExportDialogLegacy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Exportador" type="form" />}>
    <LazyExportDialogFallback {...props} />
  </Suspense>
);

export const AdvancedSearchBarLegacy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Búsqueda Avanzada" type="search" />}>
    <LazyAdvancedSearchBarFallback {...props} />
  </Suspense>
);

export const ChartContainerLegacy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Gráfico" type="chart" />}>
    <LazyChartFallback {...props} />
  </Suspense>
);

// Lazy loading para componentes de análisis emocional
const LazyEmotionVisualization = lazy(() => 
  import('../pages/AnalisisEmocional').then(module => ({
    default: module.default
  }))
);

export const EmotionVisualization: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Análisis Emocional" type="chart" />}>
    <LazyEmotionVisualization {...props} />
  </Suspense>
);

// Lazy loading para componentes de configuración
const LazyConfigurationPanel = lazy(() => 
  import('../pages/Configuracion').then(module => ({
    default: module.Configuracion
  }))
);

export const ConfigurationPanel: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Configuración" type="form" />}>
    <LazyConfigurationPanel {...props} />
  </Suspense>
);

// Lazy loading para componentes multimedia
const LazyAudioPlayer = lazy(() => 
  import('./AudioPlayer').catch(() => ({
    default: () => <div className="p-4 text-center text-amber-600">Reproductor no disponible</div>
  }))
);

export const AudioPlayer: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Reproductor de Audio" type="page" />}>
    <LazyAudioPlayer {...props} />
  </Suspense>
);

// Lazy loading para formularios
const LazyTagManager = lazy(() => 
  import('./TagManager').catch(() => ({
    default: () => <div className="p-4 text-center text-amber-600">Gestor de etiquetas no disponible</div>
  }))
);

export const TagManager: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader name="Gestor de Etiquetas" type="form" />}>
    <LazyTagManager {...props} />
  </Suspense>
);



// Componente para precargar en hover
export const PreloadOnHover: React.FC<{
  children: React.ReactNode;
  preloadFn: () => Promise<any>;
}> = ({ children, preloadFn }) => {
  const handleMouseEnter = () => {
    preloadFn().catch(() => {});
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
};

// Re-exportar utilidades para compatibilidad
export { ComponentLoader };