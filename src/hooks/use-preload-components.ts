import { useIntelligentPreload } from './use-intelligent-preload';

// Hook avanzado para precargar componentes con estrategias inteligentes
export const usePreloadComponents = () => {
  const { addToPreloadQueue, queueLength } = useIntelligentPreload();

  const preloadExportDialog = () => {
    addToPreloadQueue('export-dialog', () => import('../components/ExportDialog'), 'low');
    return import('../components/ExportDialog');
  };
  const preloadAdvancedSearch = () => {
    addToPreloadQueue('advanced-search', () => import('../components/AdvancedSearchBar'), 'normal');
    return import('../components/AdvancedSearchBar');
  };
  const preloadChart = () => {
    addToPreloadQueue('chart-container', () => import('../components/ui/chart'), 'normal');
    return import('../components/ui/chart');
  };
  const preloadEmotionAnalysis = () => {
    addToPreloadQueue('emotion-analysis', () => import('../pages/AnalisisEmocional'), 'normal');
    return import('../pages/AnalisisEmocional');
  };
  const preloadConfiguration = () => {
    addToPreloadQueue('configuration', () => import('../pages/Configuracion'), 'low');
    return import('../pages/Configuracion');
  };

  const preloadCritical = () => {
    // Precargar componentes críticos con alta prioridad
    addToPreloadQueue('advanced-search', () => import('../components/AdvancedSearchBar'), 'high');
  };

  const preloadAll = () => {
    // Precargar todos los componentes con prioridades apropiadas
    addToPreloadQueue('export-dialog', () => import('../components/ExportDialog'), 'low');
    addToPreloadQueue('advanced-search', () => import('../components/AdvancedSearchBar'), 'normal');
    addToPreloadQueue('chart-container', () => import('../components/ui/chart'), 'normal');
    addToPreloadQueue('emotion-analysis', () => import('../pages/AnalisisEmocional'), 'normal');
    addToPreloadQueue('configuration', () => import('../pages/Configuracion'), 'low');
  };

  return {
    preloadExportDialog,
    preloadAdvancedSearch,
    preloadChart,
    preloadEmotionAnalysis,
    preloadConfiguration,
    preloadCritical,
    preloadAll,
    queueLength
  };
};

// Hook legacy para compatibilidad
export const usePreloadComponentsLegacy = () => {
  const preloadExportDialog = () => import('../components/ExportDialog');
  const preloadAdvancedSearch = () => import('../components/AdvancedSearchBar');
  const preloadChart = () => import('../components/ui/chart');
  const preloadEmotionAnalysis = () => import('../pages/AnalisisEmocional');
  const preloadConfiguration = () => import('../pages/Configuracion');
  
  return {
    preloadExportDialog,
    preloadAdvancedSearch,
    preloadChart,
    preloadEmotionAnalysis,
    preloadConfiguration
  };
};