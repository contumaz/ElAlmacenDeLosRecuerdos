import React from 'react';
import { 
  FormSkeleton, 
  ChartSkeleton, 
  SearchResultsSkeleton,
  PageLoadingSkeleton,
  TableSkeleton
} from './ui/SkeletonLoaders';

// Componente de carga genérico con skeleton
export const ComponentLoader: React.FC<{ 
  name: string; 
  type?: 'form' | 'chart' | 'search' | 'page' | 'table' 
}> = ({ name, type = 'page' }) => {
  const skeletonComponents = {
    form: <FormSkeleton className="p-4" />,
    chart: <ChartSkeleton className="p-4" />,
    search: <SearchResultsSkeleton className="p-4" />,
    table: <TableSkeleton className="p-4" />,
    page: <PageLoadingSkeleton className="min-h-[200px]" />
  };

  return (
    <div className="w-full">
      <div className="sr-only">Cargando {name}...</div>
      {skeletonComponents[type]}
    </div>
  );
};

export default ComponentLoader;