/**
 * Bundle Optimization Utilities
 * Herramientas para optimizar la división de código y carga de chunks
 */

// Configuración de chunks críticos vs no críticos
export const CHUNK_PRIORITIES = {
  critical: [
    'react-vendor',
    'router-vendor',
    'ui-vendor',
    'components'
  ],
  normal: [
    'pages',
    'hooks',
    'services'
  ],
  lazy: [
    'charts-vendor',
    'emotion-analysis',
    'configuration',
    'heavy-components',
    'memory-components'
  ]
} as const;

// Mapeo de rutas a chunks para preload inteligente
export const ROUTE_CHUNK_MAP = {
  '/': ['dashboard', 'components'],
  '/memorias': ['memories', 'memory-components', 'hooks'],
  '/memorias/nueva': ['pages', 'heavy-components', 'optimization-hooks'],
  '/memorias/:id': ['memory-components', 'hooks'],
  '/analisis-emocional': ['emotion-analysis', 'charts-vendor', 'chart-components'],
  '/configuracion': ['configuration', 'heavy-components'],
  '/dashboard': ['dashboard', 'chart-components', 'charts-vendor']
} as const;

// Configuración de preload por prioridad
export const PRELOAD_STRATEGIES = {
  immediate: {
    chunks: CHUNK_PRIORITIES.critical,
    timing: 'onLoad'
  },
  hover: {
    chunks: CHUNK_PRIORITIES.normal,
    timing: 'onHover',
    delay: 100
  },
  idle: {
    chunks: CHUNK_PRIORITIES.lazy,
    timing: 'onIdle',
    delay: 2000
  }
} as const;

/**
 * Determina qué chunks precargar basado en la ruta actual
 */
export const getChunksForRoute = (route: string): readonly string[] => {
  // Buscar coincidencia exacta primero
  if (route in ROUTE_CHUNK_MAP) {
    return ROUTE_CHUNK_MAP[route as keyof typeof ROUTE_CHUNK_MAP];
  }
  
  // Buscar coincidencias con parámetros
  for (const [pattern, chunks] of Object.entries(ROUTE_CHUNK_MAP)) {
    if (pattern.includes(':') && route.match(pattern.replace(/:[^/]+/g, '[^/]+'))) {
      return chunks;
    }
  }
  
  return [];
};

/**
 * Calcula el tamaño estimado de chunks para optimizar la carga
 */
export const ESTIMATED_CHUNK_SIZES = {
  'react-vendor': 650, // KB
  'vendor': 1800,
  'ui-vendor': 200,
  'charts-vendor': 60,
  'router-vendor': 50,
  'state-vendor': 30,
  'crypto-vendor': 65,
  'components': 180,
  'pages': 110,
  'hooks': 65,
  'memory-components': 11,
  'lazy-components': 6,
  'heavy-components': 25,
  'chart-components': 15,
  'services': 20
} as const;

/**
 * Estrategia de carga progresiva basada en el ancho de banda
 */
export const getBandwidthStrategy = (): 'fast' | 'medium' | 'slow' => {
  if (typeof navigator === 'undefined') return 'medium';
  
  // @ts-expect-error - Navigator connection API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return 'medium';
  
  const { effectiveType, downlink } = connection;
  
  if (effectiveType === '4g' && downlink > 10) return 'fast';
  if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 10)) return 'medium';
  return 'slow';
};

/**
 * Configuración de carga basada en ancho de banda
 */
export const BANDWIDTH_STRATEGIES = {
  fast: {
    maxConcurrentChunks: 6,
    preloadDistance: 500,
    aggressivePreload: true,
    chunkTimeout: 5000
  },
  medium: {
    maxConcurrentChunks: 3,
    preloadDistance: 300,
    aggressivePreload: false,
    chunkTimeout: 8000
  },
  slow: {
    maxConcurrentChunks: 2,
    preloadDistance: 100,
    aggressivePreload: false,
    chunkTimeout: 15000
  }
} as const;

/**
 * Utilidad para precargar chunks de forma inteligente
 */
export class ChunkPreloader {
  private loadedChunks = new Set<string>();
  private loadingChunks = new Set<string>();
  private strategy = getBandwidthStrategy();
  
  constructor() {
    this.strategy = getBandwidthStrategy();
  }
  
  async preloadChunk(chunkName: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    if (this.loadedChunks.has(chunkName) || this.loadingChunks.has(chunkName)) {
      return;
    }
    
    const config = BANDWIDTH_STRATEGIES[this.strategy];
    
    // Limitar chunks concurrentes
    if (this.loadingChunks.size >= config.maxConcurrentChunks && priority !== 'high') {
      return;
    }
    
    this.loadingChunks.add(chunkName);
    
    try {
      // Simular preload con link rel="modulepreload"
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = `/js/${chunkName}-[hash].js`; // Vite reemplazará el hash
      document.head.appendChild(link);
      
      // Timeout basado en la estrategia
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Chunk ${chunkName} timeout`));
        }, config.chunkTimeout);
        
        link.onload = () => {
          clearTimeout(timeout);
          resolve(void 0);
        };
        
        link.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Failed to load chunk ${chunkName}`));
        };
      });
      
      this.loadedChunks.add(chunkName);
    } catch (error) {
      console.warn(`Failed to preload chunk ${chunkName}:`, error);
    } finally {
      this.loadingChunks.delete(chunkName);
    }
  }
  
  preloadRouteChunks(route: string): Promise<void[]> {
    const chunks = getChunksForRoute(route);
    return Promise.all(chunks.map(chunk => this.preloadChunk(chunk, 'normal')));
  }
  
  getLoadingStats() {
    return {
      loaded: this.loadedChunks.size,
      loading: this.loadingChunks.size,
      strategy: this.strategy,
      totalEstimatedSize: Array.from(this.loadedChunks)
        .reduce((total, chunk) => total + (ESTIMATED_CHUNK_SIZES[chunk as keyof typeof ESTIMATED_CHUNK_SIZES] || 0), 0)
    };
  }
}

// Instancia global del preloader
export const chunkPreloader = new ChunkPreloader();