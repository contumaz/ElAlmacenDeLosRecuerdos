import React, { useState, useEffect, useRef, memo } from 'react';
import { Loader2, ImageOff, RefreshCw } from 'lucide-react';
import { useImageOptimization } from '../hooks/useImageOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  fadeIn?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'skeleton',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  format = 'auto',
  onLoad,
  onError,
  retryCount = 3,
  fadeIn = true,
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  decoding = 'async'
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const {
    getImageStatus,
    updateImageStatus,
    generateResponsiveSrcSet,
    optimizeImageFormat
  } = useImageOptimization();

  // Configurar Intersection Observer
  useEffect(() => {
    if (priority || isInView) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: priority ? '0px' : '50px',
        threshold: 0.1
      }
    );
    
    observerRef.current = observer;
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Generar URLs optimizadas
  const optimizedSrc = optimizeImageFormat(src, format);
  const responsiveSrcSet = generateResponsiveSrcSet(optimizedSrc);
  
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

  // Manejar carga de imagen
  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    updateImageStatus(optimizedSrc, { loaded: true, error: false, loading: false });
    onLoad?.();
  };

  // Manejar error de carga
  const handleError = () => {
    setIsLoading(false);
    
    if (retries < retryCount) {
      // Reintentar con delay exponencial
      const delay = Math.pow(2, retries) * 1000;
      setTimeout(() => {
        setRetries(prev => prev + 1);
        setIsLoading(true);
        if (imgRef.current) {
          imgRef.current.src = optimizedSrc;
        }
      }, delay);
    } else {
      setHasError(true);
      updateImageStatus(optimizedSrc, { loaded: false, error: true, loading: false });
      onError?.(new Error(`Failed to load image after ${retryCount} retries`));
    }
  };

  // Manejar retry manual
  const handleRetry = () => {
    setHasError(false);
    setRetries(0);
    setIsLoading(true);
    if (imgRef.current) {
      imgRef.current.src = optimizedSrc;
    }
  };

  // Iniciar carga cuando esté en vista
  useEffect(() => {
    if (isInView && !isLoaded && !hasError && !isLoading) {
      setIsLoading(true);
      updateImageStatus(optimizedSrc, { loading: true });
    }
  }, [isInView, isLoaded, hasError, isLoading, optimizedSrc, updateImageStatus]);

  // Estilos base
  const baseStyles = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
    objectFit,
    transition: fadeIn ? 'opacity 0.3s ease-in-out' : undefined
  };

  // Renderizar placeholder blur
  const renderBlurPlaceholder = () => {
    if (!blurDataURL) return null;
    
    return (
      <img
        src={blurDataURL}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        style={baseStyles}
        aria-hidden="true"
      />
    );
  };

  // Renderizar skeleton placeholder
  const renderSkeletonPlaceholder = () => (
    <div
      className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse ${
        isLoaded ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-300`}
      style={baseStyles}
      aria-hidden="true"
    >
      <div className="flex items-center justify-center h-full">
        {isLoading && (
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        )}
      </div>
    </div>
  );

  // Renderizar estado de error
  const renderErrorState = () => (
    <div
      className={`absolute inset-0 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 ${
        fadeIn ? 'animate-fadeIn' : ''
      }`}
      style={baseStyles}
    >
      <ImageOff className="w-12 h-12 mb-2" />
      <p className="text-sm text-center mb-2">Error al cargar imagen</p>
      <button
        onClick={handleRetry}
        className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        type="button"
      >
        <RefreshCw className="w-3 h-3" />
        Reintentar ({retries}/{retryCount})
      </button>
    </div>
  );

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={baseStyles}
      ref={imgRef}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <>
          {placeholder === 'blur' && renderBlurPlaceholder()}
          {placeholder === 'skeleton' && renderSkeletonPlaceholder()}
        </>
      )}

      {/* Estado de error */}
      {hasError && renderErrorState()}

      {/* Imagen principal */}
      {isInView && !hasError && (
        <img
          src={optimizedSrc}
          srcSet={responsiveSrcSet}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${fadeIn ? 'transition-opacity duration-300' : ''}`}
          style={{
            ...baseStyles,
            objectFit
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          decoding={decoding}
          draggable={false}
        />
      )}

      {/* Indicador de carga */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;