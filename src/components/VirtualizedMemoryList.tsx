import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { MemoryData } from '@/services/electronAPI';
import { useAdvancedVirtualScrolling, useItemMeasurement } from '@/hooks/useAdvancedVirtualScrolling';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSmartMemoization } from '@/hooks/useSmartMemoization';
import { Search, BarChart3, Clock, TrendingUp } from 'lucide-react';
import MemoryCard from './MemoryCard';
import VirtualScrollContainer from './VirtualScrollContainer';

// Type alias for compatibility
type Memory = MemoryData;

/**
 * Props para el componente de lista virtualizada de memorias
 */
export interface VirtualizedMemoryListProps {
  /** Lista de memorias a mostrar */
  memories: Memory[];
  /** Altura del contenedor */
  containerHeight: number;
  /** Función para manejar selección de memoria */
  onMemorySelect?: (memory: Memory) => void;
  /** Función para manejar edición de memoria */
  onMemoryEdit?: (memory: Memory) => void;
  /** Función para manejar eliminación de memoria */
  onMemoryDelete?: (memoryId: string) => void;
  /** Término de búsqueda para filtrar */
  searchTerm?: string;
  /** Filtros aplicados */
  filters?: {
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    type?: string[];
  };
  /** Mostrar métricas de rendimiento */
  showMetrics?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente de item de memoria virtualizado
 */
interface VirtualMemoryItemProps {
  memory: Memory;
  index: number;
  style: React.CSSProperties;
  onSelect?: (memory: Memory) => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memoryId: string) => void;
  onMeasure?: (index: number, height: number) => void;
}

const VirtualMemoryItem: React.FC<VirtualMemoryItemProps> = React.memo(({ 
  memory, 
  index, 
  style, 
  onSelect, 
  onEdit, 
  onDelete, 
  onMeasure 
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const { measureElement } = useItemMeasurement();
  const { createMemoizedCallback } = useSmartMemoization();

  // Medir el elemento cuando se monta o cambia
  useEffect(() => {
    if (itemRef.current && onMeasure) {
      const cleanup = measureElement(itemRef.current, index);
      return cleanup;
    }
  }, [measureElement, index, onMeasure]);

  const handleSelect = createMemoizedCallback(() => {
    if (onSelect) {
      onSelect(memory);
    }
  }, [memory, onSelect]);

  const handleEdit = createMemoizedCallback(() => {
    onEdit?.(memory);
  }, [memory, onEdit]);

  const handleDelete = createMemoizedCallback(() => {
    if (memory.id) {
      onDelete?.(memory.id.toString());
    }
  }, [memory.id, onDelete]);

  return (
    <div
      ref={itemRef}
      style={style}
      className="px-4 py-2"
    >
      <MemoryCard
        memory={memory}
        onView={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        style={{}}
      />
    </div>
  );
});

VirtualMemoryItem.displayName = 'VirtualMemoryItem';

/**
 * Componente de métricas de rendimiento
 */
interface PerformanceMetricsProps {
  metrics: {
    totalItems: number;
    visibleItems: number;
    renderTime: number;
    scrollPosition: number;
    scrollPercentage: number;
    isScrolling: boolean;
    isFastScrolling: boolean;
  };
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const {
    totalItems,
    visibleItems,
    renderTime,
    scrollPercentage,
    isScrolling,
    isFastScrolling
  } = metrics;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border text-sm">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Métricas de Rendimiento
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Items Totales
          </span>
          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
            {totalItems.toLocaleString()}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Items Visibles
          </span>
          <span className="font-mono font-medium text-green-600 dark:text-green-400">
            {visibleItems}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Tiempo Render
          </span>
          <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
            {renderTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Progreso
          </span>
          <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
            {scrollPercentage.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center gap-1 text-xs ${
          isScrolling ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
        }`}>
          <Clock className="w-3 h-3" />
          <span>{isScrolling ? 'Scrolling' : 'Idle'}</span>
        </div>
        
        <div className={`flex items-center gap-1 text-xs ${
          isFastScrolling ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
        }`}>
          <TrendingUp className="w-3 h-3" />
          <span>{isFastScrolling ? 'Fast Scroll' : 'Normal'}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Lista virtualizada de memorias con funcionalidades avanzadas
 */
export const VirtualizedMemoryList: React.FC<VirtualizedMemoryListProps> = ({
  memories,
  containerHeight,
  onMemorySelect,
  onMemoryEdit,
  onMemoryDelete,
  searchTerm = '',
  filters,
  showMetrics = false,
  className = ''
}) => {
  const { createMemoizedCallback } = useSmartMemoization();
  // Filtrar memorias según criterios
  const filteredMemories = useMemo(() => {
    let result = [...memories];

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(memory => 
        memory.title.toLowerCase().includes(term) ||
        memory.content.toLowerCase().includes(term) ||
        memory.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filtrar por tags
    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter(memory => 
        memory.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Filtrar por rango de fechas
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      result = result.filter(memory => {
        const memoryDate = new Date(memory.createdAt);
        return memoryDate >= start && memoryDate <= end;
      });
    }

    // Filtrar por tipo
    if (filters?.type && filters.type.length > 0) {
      result = result.filter(memory => 
        filters.type!.includes(memory.type || 'text')
      );
    }

    return result;
  }, [memories, searchTerm, filters]);

  // Configuración del virtual scrolling
  const virtualScrollConfig = useMemo(() => ({
    containerHeight: containerHeight - (showMetrics ? 120 : 0), // Espacio para métricas
    estimatedItemHeight: 200, // Altura estimada de cada MemoryCard
    overscan: 3,
    smoothScrolling: true,
    fastScrollThreshold: 800,
    dynamicHeight: true, // Habilitar alturas dinámicas
    padding: { top: 8, bottom: 8 }
  }), [containerHeight, showMetrics]);

  // Hook de virtual scrolling
  const {
    visibleItems,
    totalHeight,
    scrollElementRef,
    handleScroll,
    scrollToIndex,
    measureItem,
    metrics,
    resetMeasurements
  } = useAdvancedVirtualScrolling(filteredMemories, virtualScrollConfig);

  // Resetear mediciones cuando cambien las memorias
  useEffect(() => {
    resetMeasurements();
  }, [filteredMemories.length, resetMeasurements]);

  // Callback para medir items
  const handleItemMeasure = createMemoizedCallback((index: number, height: number) => {
    measureItem(index, height);
  }, [measureItem]);

  // Scroll a la primera memoria cuando cambien los filtros
  useEffect(() => {
    if (filteredMemories.length > 0) {
      scrollToIndex(0);
    }
  }, [searchTerm, filters, scrollToIndex, filteredMemories.length]);

  // Renderizar mensaje cuando no hay memorias
  if (filteredMemories.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <Search className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No se encontraron memorias
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          {searchTerm || filters ? 
            'Intenta ajustar los filtros o el término de búsqueda.' :
            'Aún no tienes memorias guardadas. ¡Crea tu primera memoria!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Métricas de rendimiento */}
      {showMetrics && (
        <div className="mb-4">
          <PerformanceMetrics metrics={metrics} />
        </div>
      )}

      {/* Lista virtualizada */}
      <div className="flex-1 relative">
        <VirtualScrollContainer
          height={virtualScrollConfig.containerHeight}
          className="w-full"
          onScroll={handleScroll}
        >
          <div
            ref={scrollElementRef}
            style={{ height: totalHeight }}
            className="relative"
          >
            {visibleItems.map(({ item: memory, index, top, height }) => (
              <VirtualMemoryItem
                key={memory.id}
                memory={memory}
                index={index}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  height
                }}
                onSelect={onMemorySelect}
                onEdit={onMemoryEdit}
                onDelete={onMemoryDelete}
                onMeasure={handleItemMeasure}
              />
            ))}
          </div>
        </VirtualScrollContainer>
      </div>

      {/* Indicador de scroll */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Mostrando {visibleItems.length} de {filteredMemories.length} memorias
        {filteredMemories.length !== memories.length && (
          <span className="ml-1">
            (filtradas de {memories.length} totales)
          </span>
        )}
      </div>
    </div>
  );
};



export default VirtualizedMemoryList;