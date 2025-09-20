import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import { useLazyLoading } from '../hooks/useIntersectionObserver';
import { LoadingCard, LoadingBar } from './ui/LoadingStates';
import { useProgressiveEnhancement } from '@/hooks/use-progressive-enhancement';

interface ProgressiveLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: boolean;
  rootMargin?: string;
  retryAttempts?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  loadingType?: 'skeleton' | 'spinner' | 'bar' | 'custom';
  minLoadTime?: number;
}

/**
 * Componente para carga progresiva con diferentes tipos de loading
 */
export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  fallback,
  priority = false,
  rootMargin = '50px',
  retryAttempts = 3,
  onLoad,
  onError,
  className = '',
  loadingType = 'skeleton',
  minLoadTime = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContentReady, setIsContentReady] = useState(priority);
  const [loadStartTime] = useState(Date.now());

  const { shouldLoad, hasBeenVisible } = useLazyLoading(containerRef, {
    rootMargin,
    priority,
    onVisible: () => {
      if (!isContentReady) {
        loadContent();
      }
    }
  });

  const [error, setError] = useState<Error | null>(null);

  const loadContent = async () => {
    try {
      // Simular carga de contenido
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsContentReady(true);
        onLoad?.();
      }, remainingTime);
    } catch (err) {
      setError(err as Error);
      onError?.(err as Error);
    }
  };

  const {
    isLoading,
    retry: hookRetry
  } = useProgressiveLoading(
    loadContent,
    {
      retryCount: retryAttempts,
      priority: !shouldLoad
    }
  );
  
  const retry = () => {
    setError(null);
    hookRetry();
  };

  const renderLoadingState = () => {
    if (fallback) return fallback;

    switch (loadingType) {
      case 'skeleton':
        return <LoadingCard />;
      case 'bar':
        return <LoadingBar />;
      case 'spinner':
        return (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      default:
        return <LoadingCard />;
    }
  };

  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-gray-600 mb-4">Error al cargar el contenido</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className={`progressive-loader ${className}`}>
      {error ? renderError() : 
       isLoading || !isContentReady ? renderLoadingState() : 
       children}
    </div>
  );
};

/**
 * Componente para listas progresivas
 */
interface ProgressiveListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  pageSize?: number;
  className?: string;
  itemClassName?: string;
  loadingComponent?: ReactNode;
}

export function ProgressiveList<T>({
  items,
  renderItem,
  loadMore,
  hasMore = false,
  isLoading = false,
  pageSize = 10,
  className = '',
  itemClassName = '',
  loadingComponent
}: ProgressiveListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { shouldLoad } = useLazyLoading(loadMoreRef, {
    rootMargin: '100px',
    onVisible: () => {
      if (hasMore && !isLoading && loadMore) {
        loadMore();
      } else if (visibleCount < items.length) {
        setVisibleCount(prev => Math.min(prev + pageSize, items.length));
      }
    }
  });

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className={`progressive-list ${className}`}>
      {visibleItems.map((item, index) => (
        <div key={index} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {(hasMore || visibleCount < items.length) && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {isLoading ? (
            loadingComponent || <LoadingCard />
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para imágenes progresivas
 */
interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { shouldLoad } = useLazyLoading(imgRef, {
    priority,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (shouldLoad && !isLoaded && !hasError) {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [shouldLoad, src, isLoaded, hasError, onLoad, onError]);

  return (
    <div className={`progressive-image relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          )}
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Error al cargar</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}
    </div>
  );
};