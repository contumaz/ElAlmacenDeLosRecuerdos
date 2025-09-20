import React from 'react';
import { Skeleton } from './skeleton-component';
import { cn } from '@/lib/utils';

// Memory Card Skeleton
export const MemoryCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)}>
      <div className="flex items-start justify-between">
        <Skeleton variant="text" width="60%" height="1.25rem" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex items-center justify-between pt-2">
        <div className="flex space-x-2">
          <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
          <Skeleton variant="rectangular" width={80} height={20} className="rounded-full" />
        </div>
        <Skeleton variant="text" width={80} />
      </div>
    </div>
  );
};

// Memory Grid Skeleton
export const MemoryGridSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MemoryCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Search Results Skeleton
export const SearchResultsSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height="1.5rem" />
        <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 border rounded">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="80%" height="1.25rem" />
              <Skeleton variant="text" lines={2} />
              <div className="flex space-x-2">
                <Skeleton variant="rectangular" width={50} height={16} className="rounded-full" />
                <Skeleton variant="rectangular" width={70} height={16} className="rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height="1.25rem" />
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={`row-${rowIndex}`} 
            className="grid gap-4 py-2 border-b border-gray-100"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                variant="text" 
                height="1rem"
                width={colIndex === 0 ? '80%' : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width="60%" height="1rem" />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
          <Skeleton variant="text" width="40%" height="2rem" />
          <Skeleton variant="text" width="80%" height="0.875rem" />
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{ 
  height?: number; 
  className?: string;
  variant?: 'default' | 'list' | 'bar' | 'pie';
}> = ({ height = 300, className, variant = 'default' }) => {
  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height="1rem" />
              <Skeleton variant="text" width="40%" height="0.75rem" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height="1.5rem" />
        <div className="flex space-x-2">
          <Skeleton variant="rectangular" width={80} height={32} className="rounded" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={height} 
          className="rounded"
        />
      </div>
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ 
  fields?: number; 
  className?: string 
}> = ({ fields = 5, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="30%" height="1rem" />
          <Skeleton variant="rectangular" width="100%" height={40} className="rounded" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton variant="rectangular" width={100} height={40} className="rounded" />
        <Skeleton variant="rectangular" width={80} height={40} className="rounded" />
      </div>
    </div>
  );
};

// Page Loading Skeleton
export const PageLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="space-y-3">
        <Skeleton variant="text" width="40%" height="2rem" />
        <Skeleton variant="text" width="60%" height="1rem" />
      </div>
      
      {/* Navigation/Tabs */}
      <div className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" width={100} height={36} className="rounded" />
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <MemoryGridSkeleton count={6} />
      </div>
    </div>
  );
};