import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageCache {
  [key: string]: {
    loaded: boolean;
    error: boolean;
    timestamp: number;
  };
}

interface UseImageOptimizationOptions {
  initialPreloadImages?: string[];
  cacheTimeout?: number; // en milisegundos
  maxCacheSize?: number;
  enablePrefetch?: boolean;
}

interface ImageStatus {
  loaded: boolean;
  error: boolean;
  loading: boolean;
}

// Cache global para imágenes
const imageCache: ImageCache = {};
const preloadedImages = new Set<string>();

export const useImageOptimization = (options: UseImageOptimizationOptions = {}) => {
  const {
    initialPreloadImages = [],
    cacheTimeout = 30 * 60 * 1000, // 30 minutos por defecto
    maxCacheSize = 100,
    enablePrefetch = true
  } = options;

  const [imageStatuses, setImageStatuses] = useState<{ [key: string]: ImageStatus }>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpiar cache antiguo
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const keys = Object.keys(imageCache);
    
    if (keys.length > maxCacheSize) {
      // Eliminar las más antiguas
      const sortedKeys = keys.sort((a, b) => imageCache[a].timestamp - imageCache[b].timestamp);
      const toDelete = sortedKeys.slice(0, keys.length - maxCacheSize);
      
      toDelete.forEach(key => {
        delete imageCache[key];
        preloadedImages.delete(key);
      });
    }
    
    // Eliminar imágenes expiradas
    keys.forEach(key => {
      if (now - imageCache[key].timestamp > cacheTimeout) {
        delete imageCache[key];
        preloadedImages.delete(key);
      }
    });
  }, [cacheTimeout, maxCacheSize]);

  // Precargar una imagen
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Si ya está en cache y es válida, resolver inmediatamente
      if (imageCache[src] && imageCache[src].loaded) {
        resolve();
        return;
      }

      // Si ya se está precargando, no duplicar
      if (preloadedImages.has(src)) {
        resolve();
        return;
      }

      preloadedImages.add(src);
      
      const img = new Image();
      
      img.onload = () => {
        imageCache[src] = {
          loaded: true,
          error: false,
          timestamp: Date.now()
        };
        resolve();
      };
      
      img.onerror = () => {
        imageCache[src] = {
          loaded: false,
          error: true,
          timestamp: Date.now()
        };
        preloadedImages.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      img.src = src;
    });
  }, []);

  // Precargar múltiples imágenes
  const preloadMultipleImages = useCallback(async (sources: string[]) => {
    if (!enablePrefetch) return;
    
    try {
      abortControllerRef.current = new AbortController();
      
      // Precargar en lotes para no sobrecargar la red
      const batchSize = 3;
      for (let i = 0; i < sources.length; i += batchSize) {
        const batch = sources.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(src => preloadImage(src))
        );
        
        // Verificar si se canceló la operación
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn('Error preloading images:', error);
    }
  }, [enablePrefetch, preloadImage]);

  // Obtener estado de una imagen
  const getImageStatus = useCallback((src: string): ImageStatus => {
    const cached = imageCache[src];
    if (cached) {
      return {
        loaded: cached.loaded,
        error: cached.error,
        loading: false
      };
    }
    
    return imageStatuses[src] || {
      loaded: false,
      error: false,
      loading: false
    };
  }, [imageStatuses]);

  // Actualizar estado de imagen
  const updateImageStatus = useCallback((src: string, status: Partial<ImageStatus>) => {
    setImageStatuses(prev => ({
      ...prev,
      [src]: { ...prev[src], ...status }
    }));
    
    // Actualizar cache si la imagen se cargó o falló
    if (status.loaded !== undefined || status.error !== undefined) {
      imageCache[src] = {
        loaded: status.loaded || false,
        error: status.error || false,
        timestamp: Date.now()
      };
    }
  }, []);

  // Generar srcSet responsive
  const generateResponsiveSrcSet = useCallback((baseSrc: string, sizes: number[] = [480, 768, 1024, 1280]) => {
    if (baseSrc.startsWith('http') || baseSrc.startsWith('data:')) {
      return baseSrc; // No modificar URLs externas
    }
    
    const basePath = baseSrc.replace(/\.[^/.]+$/, '');
    const extension = baseSrc.split('.').pop()?.toLowerCase();
    
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return baseSrc;
    }
    
    return sizes
      .map(size => `${basePath}-${size}w.webp ${size}w`)
      .join(', ');
  }, []);

  // Optimizar formato de imagen
  const optimizeImageFormat = useCallback((src: string, format: 'webp' | 'avif' | 'auto' = 'auto') => {
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    
    const basePath = src.replace(/\.[^/.]+$/, '');
    const extension = src.split('.').pop()?.toLowerCase();
    
    if (!['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return src;
    }
    
    // Detectar soporte del navegador
    if (format === 'auto') {
      // Verificar soporte AVIF
      const canvas = document.createElement('canvas');
      const avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      
      if (avifSupported) {
        return `${basePath}.avif`;
      }
      
      // Fallback a WebP
      return `${basePath}.webp`;
    }
    
    return `${basePath}.${format}`;
  }, []);

  // Efecto para precargar imágenes iniciales
  useEffect(() => {
    if (initialPreloadImages.length > 0) {
      preloadMultipleImages(initialPreloadImages);
    }
    
    // Limpiar cache periódicamente
    const cleanupInterval = setInterval(cleanCache, 5 * 60 * 1000); // cada 5 minutos
    
    return () => {
      clearInterval(cleanupInterval);
      abortControllerRef.current?.abort();
    };
  }, [initialPreloadImages, preloadMultipleImages, cleanCache]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    preloadImage,
    preloadMultipleImages,
    getImageStatus,
    updateImageStatus,
    generateResponsiveSrcSet,
    optimizeImageFormat,
    cleanCache,
    cacheSize: Object.keys(imageCache).length
  };
};

export default useImageOptimization;