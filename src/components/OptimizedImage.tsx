import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useImageOptimization } from '../hooks/useImageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
  priority?: boolean; // Para imágenes críticas
  blur?: boolean; // Efecto blur mientras carga
  fadeIn?: boolean; // Animación de entrada
  retryCount?: number; // Número de reintentos en caso de error
  sizes?: string; // Responsive sizes
  srcSet?: string; // Responsive srcSet
}

export const OptimizedImage = React.memo<OptimizedImageProps>(({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  lazy = true,
  fallback,
  onLoad,
  onError,
  placeholder,
  loading,
  style,
  priority = false,
  blur = true,
  fadeIn = true,
  retryCount = 3,
  sizes,
  srcSet
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [retries, setRetries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const {
    getImageStatus,
    updateImageStatus,
    generateResponsiveSrcSet,
    optimizeImageFormat,
    preloadImage
  } = useImageOptimization();

  // Generar fuentes optimizadas usando el hook
  const optimizedSrc = optimizeImageFormat(src, 'auto');
  const responsiveSrcSet = generateResponsiveSrcSet(optimizedSrc);
  const finalSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  
  // Verificar estado en cache
  const cachedStatus = getImageStatus(optimizedSrc);
  
  useEffect(() => {
    if (cachedStatus.loaded && !isLoaded) {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
    } else if (cachedStatus.error && !hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [cachedStatus, isLoaded, hasError, onLoad]);

  // Inicializar estado de carga basado en prioridad
  useEffect(() => {
    if (isInView && !isLoaded && !hasError && !isLoading) {
      setIsLoading(true);
      updateImageStatus(optimizedSrc, { loading: true });
    }
  }, [isInView, isLoaded, hasError, isLoading, optimizedSrc, updateImageStatus]);

  // Generar URLs optimizadas con WebP y responsive
  const optimizedSources = useMemo(() => {
    if (!src) return { webp: '', fallback: src, srcSet: '', sizes: '' };
    
    // Si ya es una URL externa, no la modificamos
    if (src.startsWith('http') || src.startsWith('data:')) {
      return { webp: src, fallback: src, srcSet: srcSet || '', sizes: sizes || '' };
    }
    
    // Para archivos locales, generar versión WebP y responsive
    const basePath = src.replace(/\.[^/.]+$/, '');
    const extension = src.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      const webpSrc = `${basePath}.webp`;
      const responsiveSrcSet = srcSet || `${webpSrc} 1x, ${basePath}@2x.webp 2x`;
      const responsiveSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
      
      return {
        webp: webpSrc,
        fallback: src,
        srcSet: responsiveSrcSet,
        sizes: responsiveSizes
      };
    }
    
    return { webp: src, fallback: src, srcSet: srcSet || '', sizes: sizes || '' };
  }, [src, srcSet, sizes]);

  // Precargar imagen si es prioritaria
  useEffect(() => {
    if (priority && !cachedStatus.loaded && !cachedStatus.error) {
      preloadImage(optimizedSrc).catch(() => {
        // Error manejado por el hook
      });
    }
  }, [priority, optimizedSrc, preloadImage, cachedStatus]);
  
  // Configurar Intersection Observer mejorado
  useEffect(() => {
    if (!lazy || priority || isInView) return;
    
    const currentRef = imgRef.current;
    if (!currentRef) return;
    
    // Configuración optimizada del observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: priority ? '0px' : '100px', // Precargar antes para imágenes prioritarias
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsInView(true);
        setIsLoading(true);
        // Desconectar observer después de activar
        observerRef.current?.disconnect();
      }
    };
    
    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);
    observerRef.current.observe(currentRef);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority, isInView]);
  
  // Cleanup del observer
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    updateImageStatus(optimizedSrc, { loaded: true, error: false, loading: false });
    onLoad?.();
  }, [onLoad, optimizedSrc, updateImageStatus]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    
    // Intentar recargar si no se han agotado los reintentos
    if (retries < retryCount) {
      setTimeout(() => {
        setRetries(prev => prev + 1);
        setIsLoading(true);
        // Forzar recarga de la imagen
        if (imgRef.current) {
          imgRef.current.src = optimizedSrc;
        }
      }, Math.pow(2, retries) * 1000); // Backoff exponencial
    } else {
      setHasError(true);
      updateImageStatus(optimizedSrc, { loaded: false, error: true, loading: false });
      onError?.();
    }
  }, [onError, retries, retryCount, optimizedSrc, updateImageStatus]);

  // Placeholder por defecto con blur y animaciones
  const defaultPlaceholder = useMemo(() => {
    const baseClasses = `flex items-center justify-center bg-gray-100 ${className}`;
    const blurClasses = blur ? 'backdrop-blur-sm' : '';
    const animationClasses = fadeIn ? 'transition-all duration-300 ease-in-out' : '';
    
    return (
      <div 
        className={`${baseClasses} ${blurClasses} ${animationClasses}`}
        style={{ width, height, ...style }}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        )}
      </div>
    );
  }, [className, width, height, style, blur, fadeIn, isLoading]);

  // Error state con fallback mejorado
  if (hasError) {
    if (fallback) {
      return (
        <picture>
          <img
            ref={imgRef}
            src={fallback}
            alt={alt}
            className={`${className} ${fadeIn ? 'animate-pulse' : ''}`}
            width={width}
            height={height}
            style={style}
            onLoad={handleLoad}
            loading={loading || 'eager'}
          />
        </picture>
      );
    }
    
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-red-50 border border-red-200 ${className} ${fadeIn ? 'transition-all duration-300' : ''}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center text-red-600">
          <AlertCircle className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">Error al cargar ({retries}/{retryCount})</span>
        </div>
      </div>
    );
  }

  // Loading state (antes de que la imagen entre en viewport o mientras carga)
  if (!isInView || !isLoaded) {
    return (
      <div ref={imgRef} className="relative overflow-hidden">
        {placeholder || defaultPlaceholder}
        {isInView && (
          <picture className="absolute inset-0">
            <source 
              srcSet={responsiveSrcSet} 
              sizes={finalSizes}
              type="image/webp" 
            />
            <img
              ref={imgRef}
              src={optimizedSrc}
              alt={alt}
              className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${fadeIn ? 'transition-all duration-500 ease-out' : ''} ${blur && !isLoaded ? 'blur-sm' : ''}`}
              width={width}
              height={height}
              style={style}
              onLoad={handleLoad}
              onError={handleError}
              loading={loading || (lazy && !priority ? 'lazy' : 'eager')}
              sizes={finalSizes}
              srcSet={responsiveSrcSet}
            />
          </picture>
        )}
      </div>
    );
  }

  // Imagen cargada con optimizaciones completas
  return (
    <picture className={fadeIn ? 'animate-in fade-in duration-500' : ''}>
      <source 
        srcSet={optimizedSources.srcSet || optimizedSources.webp} 
        sizes={optimizedSources.sizes}
        type="image/webp" 
      />
      <img
        ref={imgRef}
        src={optimizedSources.fallback}
        alt={alt}
        className={`${className} ${fadeIn ? 'transition-all duration-300 ease-out' : ''}`}
        width={width}
        height={height}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading || (lazy && !priority ? 'lazy' : 'eager')}
        sizes={optimizedSources.sizes}
        srcSet={optimizedSources.srcSet}
        decoding="async"
      />
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;