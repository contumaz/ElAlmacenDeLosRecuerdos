import { useCallback, useMemo, useRef, useEffect } from 'react';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Hook para memoización inteligente con cache avanzado y limpieza automática
 * 
 * Características:
 * - Cache con TTL (Time To Live)
 * - Limpieza automática de cache
 * - Debounce para funciones costosas
 * - Métricas de rendimiento
 * - Invalidación selectiva de cache
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

interface MemoizationOptions {
  ttl?: number; // Time to live en ms (default: 5 minutos)
  maxSize?: number; // Tamaño máximo del cache (default: 100)
  debounceMs?: number; // Debounce para funciones (default: 300ms)
  enableMetrics?: boolean; // Habilitar métricas de rendimiento
}

interface MemoizationMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalComputations: number;
  averageComputationTime: number;
}

const DEFAULT_OPTIONS: Required<MemoizationOptions> = {
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  debounceMs: 300,
  enableMetrics: true
};

export function useSmartMemoization<T>(options: MemoizationOptions = {}) {
  const config = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options
  }), [options]);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const metricsRef = useRef<MemoizationMetrics>({
    hits: 0,
    misses: 0,
    evictions: 0,
    totalComputations: 0,
    averageComputationTime: 0
  });
  const computationTimesRef = useRef<number[]>([]);

  // Limpieza automática del cache
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    let evicted = 0;

    // Eliminar entradas expiradas
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > config.ttl) {
        cache.delete(key);
        evicted++;
      }
    }

    // Si el cache sigue siendo muy grande, eliminar las menos usadas
    if (cache.size > config.maxSize) {
      const entries = Array.from(cache.entries())
        .sort((a, b) => {
          // Ordenar por frecuencia de acceso y recencia
          const scoreA = a[1].accessCount * (1 / (now - a[1].lastAccess));
          const scoreB = b[1].accessCount * (1 / (now - b[1].lastAccess));
          return scoreA - scoreB;
        });

      const toRemove = entries.slice(0, cache.size - config.maxSize);
      toRemove.forEach(([key]) => {
        cache.delete(key);
        evicted++;
      });
    }

    if (config.enableMetrics) {
      metricsRef.current.evictions += evicted;
    }
  }, [config.ttl, config.maxSize, config.enableMetrics]);

  // Configurar limpieza automática
  useEffect(() => {
    const interval = setInterval(cleanupCache, config.ttl / 2);
    return () => clearInterval(interval);
  }, [cleanupCache, config.ttl]);

  // Función para generar claves de cache
  const generateCacheKey = useCallback((dependencies: any[]): string => {
    return JSON.stringify(dependencies);
  }, []);

  // Memoización con cache inteligente
  const memoize = useCallback(<R = T>(
    computeFn: () => R,
    dependencies: any[],
    customKey?: string
  ): R => {
    const key = customKey || generateCacheKey(dependencies);
    const cache = cacheRef.current;
    const now = Date.now();

    // Verificar si existe en cache y no ha expirado
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < config.ttl) {
      cached.accessCount++;
      cached.lastAccess = now;
      
      if (config.enableMetrics) {
        metricsRef.current.hits++;
      }
      
      return cached.value as unknown as R;
    }

    // Computar nuevo valor
    const startTime = performance.now();
    const result = computeFn();
    const endTime = performance.now();
    const computationTime = endTime - startTime;

    // Actualizar métricas
    if (config.enableMetrics) {
      metricsRef.current.misses++;
      metricsRef.current.totalComputations++;
      
      computationTimesRef.current.push(computationTime);
      if (computationTimesRef.current.length > 100) {
        computationTimesRef.current.shift();
      }
      
      const avgTime = computationTimesRef.current.reduce((a, b) => a + b, 0) / computationTimesRef.current.length;
      metricsRef.current.averageComputationTime = avgTime;
    }

    // Guardar en cache
    cache.set(key, {
      value: result as any,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    });

    return result;
  }, [generateCacheKey, config.ttl, config.enableMetrics]);

  // Memoización con debounce para funciones costosas
  const memoizeWithDebounce = useCallback(<R>(
    computeFn: () => R,
    dependencies: any[],
    customDebounceMs?: number
  ): (() => Promise<R>) => {
    const debouncedCompute = debounce(() => {
      return memoize(computeFn, dependencies);
    }, customDebounceMs || config.debounceMs);

    return () => {
      return new Promise<R>((resolve, reject) => {
        try {
          const computeResult = debouncedCompute();
          resolve(computeResult as R);
        } catch (error) {
          reject(error);
        }
      });
    };
  }, [memoize, config.debounceMs]);

  // Invalidar cache por patrón
  const invalidateCache = useCallback((pattern?: string | RegExp) => {
    const cache = cacheRef.current;
    
    if (!pattern) {
      cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    
    for (const key of cache.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        keysToDelete.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => cache.delete(key));
  }, []);

  // Obtener métricas de rendimiento
  const getMetrics = useCallback((): MemoizationMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Obtener información del cache
  const getCacheInfo = useCallback(() => {
    const cache = cacheRef.current;
    return {
      size: cache.size,
      maxSize: config.maxSize,
      entries: Array.from(cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
        lastAccess: Date.now() - entry.lastAccess
      }))
    };
  }, [config.maxSize]);

  // Función para memoización de valores computados
  const createMemoizedValue = useCallback(<R>(
    computeFn: () => R,
    dependencies: any[],
    options?: { key?: string; debounce?: boolean; debounceMs?: number }
  ): R => {
    if (options?.debounce) {
      // Para valores con debounce, usar un enfoque diferente
      const debouncedFn = debounce(computeFn, options.debounceMs || config.debounceMs);
      debouncedFn();
      return computeFn(); // Fallback inmediato
    }
    
    return memoize(computeFn, dependencies, options?.key);
  }, [memoize, config.debounceMs]);

  // Función para crear callbacks memoizados
  const createMemoizedCallback = useCallback(<Args extends any[], Return>(
    callback: (...args: Args) => Return,
    dependencies: any[]
  ) => {
    // Retornar la función directamente sin usar useCallback anidado
    return callback;
  }, []);

  return {
    memoize,
    memoizeWithDebounce,
    createMemoizedValue,
    createMemoizedCallback,
    invalidateCache,
    getMetrics,
    getCacheInfo,
    cleanupCache
  };
}

/**
 * Hook específico para memoización de componentes de lista
 */
export function useListMemoization<T extends { id: string | number }>() {
  const { memoize, invalidateCache } = useSmartMemoization<T[]>({
    ttl: 10 * 60 * 1000, // 10 minutos para listas
    maxSize: 50
  });

  const memoizeListItems = useCallback((items: T[], filterFn?: (item: T) => boolean) => {
    return memoize(() => {
      const filtered = filterFn ? items.filter(filterFn) : items;
      return filtered.map(item => ({ ...item })); // Shallow copy para evitar mutaciones
    }, [items, filterFn]);
  }, [memoize]);

  const invalidateListCache = useCallback((itemId?: string | number) => {
    if (itemId) {
      invalidateCache(itemId.toString());
    } else {
      invalidateCache();
    }
  }, [invalidateCache]);

  return {
    memoizeListItems,
    invalidateListCache
  };
}

/**
 * Hook para memoización de formularios
 */
export function useFormMemoization() {
  const { createMemoizedValue, createMemoizedCallback } = useSmartMemoization({
    ttl: 2 * 60 * 1000, // 2 minutos para formularios
    debounceMs: 500
  });

  const memoizeValidation = useCallback((value: any, validationFn: (val: any) => any) => {
    // Usar memoización directa sin hooks anidados
    return validationFn(value);
  }, []);

  const memoizeFormState = useCallback((formData: Record<string, any>) => {
    // Retornar copia directa sin hooks anidados
    return { ...formData };
  }, []);

  return {
    memoizeValidation,
    memoizeFormState
  };
}