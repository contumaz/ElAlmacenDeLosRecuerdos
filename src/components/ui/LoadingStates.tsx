import React from 'react';
import { useLoadingAnimation, useInViewAnimation } from '@/hooks/useAnimations';
import { Skeleton } from './skeleton-component';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
        aria-label="Loading"
      />
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1 items-center justify-center', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

interface LoadingBarProps {
  progress?: number;
  className?: string;
  animated?: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ 
  progress = 0, 
  className,
  animated = true 
}) => {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div 
        className={cn(
          'bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out',
          animated && 'animate-shimmer'
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  className,
  showAvatar = true,
  lines = 3 
}) => {
  const { elementRef } = useInViewAnimation('animate-fade-in', { delay: 100 });

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={cn(
        'p-4 border border-gray-200 rounded-lg bg-white shadow-sm',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <Skeleton variant="circular" width="40px" height="40px" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="75%" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i}
              variant="text" 
              width={i === lines - 1 ? '60%' : '100%'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface LoadingGridProps {
  items?: number;
  columns?: number;
  className?: string;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({ 
  items = 6,
  columns = 3,
  className 
}) => {
  return (
    <div 
      className={cn(
        'grid gap-4',
        `grid-cols-1 md:grid-cols-${columns}`,
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{
            animationDelay: `${i * 100}ms`
          } as React.CSSProperties}
        >
          <LoadingCard />
        </div>
      ))}
    </div>
  );
};

interface LoadingListProps {
  items?: number;
  className?: string;
  showNumbers?: boolean;
}

export const LoadingList: React.FC<LoadingListProps> = ({ 
  items = 5,
  className,
  showNumbers = false 
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg animate-fade-in"
          style={{
            animationDelay: `${i * 50}ms`
          } as React.CSSProperties}
        >
          {showNumbers && (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-500">
              {i + 1}
            </div>
          )}
          <Skeleton variant="circular" width="32px" height="32px" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
          <Skeleton variant="rectangular" width="60px" height="24px" />
        </div>
      ))}
    </div>
  );
};

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  rows = 5,
  columns = 4,
  className 
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="grid gap-4 p-4 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width="80%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4 p-4 border-b border-gray-100 animate-fade-in"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            animationDelay: `${rowIndex * 50}ms`
          } as React.CSSProperties}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`}
              variant={colIndex === 0 ? 'text' : 'rectangular'}
              width={colIndex === 0 ? '90%' : '70%'}
              height={colIndex === 0 ? undefined : '20px'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible,
  message = 'Loading...',
  className 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      'animate-fade-in',
      className
    )}>
      <div className="bg-white rounded-lg p-6 shadow-xl animate-scale-in">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

interface SmartLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({ 
  isLoading,
  children,
  fallback,
  className 
}) => {
  const { showContent, shouldShowSkeleton, shouldAnimateIn } = useLoadingAnimation(isLoading);

  return (
    <div className={cn('relative', className)}>
      {shouldShowSkeleton && (
        <div className="animate-fade-in">
          {fallback || <LoadingCard />}
        </div>
      )}
      
      {showContent && (
        <div className={cn(
          'transition-all duration-300',
          shouldAnimateIn ? 'animate-fade-in opacity-100' : 'opacity-0'
        )}>
          {children}
        </div>
      )}
    </div>
  );
};

// Export all components
export default {
  LoadingSpinner,
  LoadingDots,
  LoadingBar,
  LoadingCard,
  LoadingGrid,
  LoadingList,
  LoadingTable,
  LoadingOverlay,
  SmartLoading,
};