import React, { useMemo, useCallback, useState } from 'react';
import { useVirtualizedList, useRenderOptimization, withRenderOptimization } from '../hooks/useRenderOptimization';
import { useImageOptimization } from '../hooks/useRenderOptimization';
import { Memory } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Card, CardContent } from './ui/card';
import Badge from './ui/badge';
import Button from './ui/button';
import { Trash2, Edit, Eye, Heart } from 'lucide-react';

// Función para obtener el color de la emoción
const getEmotionColor = (emotion: string): string => {
  const emotionColors: Record<string, string> = {
    happy: 'text-yellow-600 border-yellow-300',
    sad: 'text-blue-600 border-blue-300',
    angry: 'text-red-600 border-red-300',
    excited: 'text-orange-600 border-orange-300',
    calm: 'text-green-600 border-green-300',
    anxious: 'text-purple-600 border-purple-300',
    neutral: 'text-gray-600 border-gray-300'
  };
  return emotionColors[emotion.toLowerCase()] || 'text-gray-600 border-gray-300';
};

interface OptimizedMemoryListProps {
  memories: Memory[];
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: number) => void;
  onView?: (memory: Memory) => void;
  onToggleFavorite?: (id: number) => void;
  itemHeight?: number;
  containerHeight?: number;
  showVirtualization?: boolean;
}

interface MemoryListItemProps {
  memory: Memory;
  style?: React.CSSProperties;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: number) => void;
  onView?: (memory: Memory) => void;
  onToggleFavorite?: (id: number) => void;
}

/**
 * Componente optimizado para mostrar una memoria individual
 */
const MemoryItem = React.memo<MemoryListItemProps>(({ memory, style, onEdit, onDelete, onView, onToggleFavorite }) => {
  // Optimización de imagen con lazy loading
  const { imgProps, isLoaded } = useImageOptimization(
    memory.imageUrl || '',
    {
      placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1lbW9yeTwvdGV4dD48L3N2Zz4=',
      quality: 80,
      format: 'webp'
    }
  );

  // Memoizar callbacks para evitar re-renders
  const handleEdit = useCallback(() => {
    onEdit?.(memory);
  }, [onEdit, memory]);

  const handleDelete = useCallback(() => {
    onDelete?.(memory.id);
  }, [onDelete, memory.id]);

  const handleView = useCallback(() => {
    onView?.(memory);
  }, [onView, memory]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.(memory.id);
  }, [onToggleFavorite, memory.id]);

  // Memoizar el contenido del texto para evitar re-procesamiento
  const truncatedContent = useMemo(() => {
    if (!memory.content) return '';
    return memory.content.length > 150 
      ? memory.content.substring(0, 150) + '...' 
      : memory.content;
  }, [memory.content]);

  // Memoizar el estado emocional
  const emotionBadge = useMemo(() => {
    if (!memory.emotion) return null;
    const { primary, confidence } = memory.emotion;
    return { dominant: primary, confidence };
  }, [memory.emotion]);

  return (
    <div style={style} className="p-2">
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Imagen optimizada */}
            {memory.imageUrl && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  {...imgProps}
                  alt={memory.title || 'Memory image'}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            )}
            
            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg truncate pr-2">
                  {memory.title || 'Untitled Memory'}
                </h3>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {memory.metadata?.category === 'favorite' && (
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  )}
                  {emotionBadge && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getEmotionColor(emotionBadge.dominant)}`}
                    >
                      {emotionBadge.dominant} ({Math.round(emotionBadge.confidence * 100)}%)
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {truncatedContent}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(memory.createdAt)}
                </span>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleView}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                    className="h-8 w-8 p-0"
                  >
                    <Heart className={`w-4 h-4 ${
                      memory.metadata?.category === 'favorite' ? 'text-red-500 fill-current' : 'text-gray-400'
                    }`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MemoryItem.displayName = 'MemoryItem';

/**
 * Lista optimizada de memorias con virtualización opcional
 */
const OptimizedMemoryListComponent: React.FC<OptimizedMemoryListProps> = ({
  memories,
  onEdit,
  onDelete,
  onView,
  onToggleFavorite,
  itemHeight = 140,
  containerHeight = 600,
  showVirtualization = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'emotion'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'recent'>('all');

  // Optimización de renderizado con memoización inteligente
  const { data: optimizedMemories } = useRenderOptimization(
    { memories, searchTerm, sortBy, filterBy },
    [memories, searchTerm, sortBy, filterBy],
    { debounceMs: 300, maxCacheSize: 10 }
  );

  // Filtrado y ordenamiento memoizado
  const processedMemories = useMemo(() => {
    let filtered = [...optimizedMemories.memories];

    // Filtrar por término de búsqueda
    if (optimizedMemories.searchTerm) {
      const term = optimizedMemories.searchTerm.toLowerCase();
      filtered = filtered.filter(memory => 
        memory.title?.toLowerCase().includes(term) ||
        memory.content?.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoría
    switch (optimizedMemories.filterBy) {
      case 'favorites':
        filtered = filtered.filter(memory => memory.isFavorite);
        break;
      case 'recent': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(memory => new Date(memory.createdAt) > weekAgo);
        break;
      }
    }

    // Ordenar
    switch (optimizedMemories.sortBy) {
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'emotion':
        filtered.sort((a, b) => {
          const aEmotion = a.emotionalAnalysis?.dominant || '';
          const bEmotion = b.emotionalAnalysis?.dominant || '';
          return aEmotion.localeCompare(bEmotion);
        });
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [optimizedMemories]);

  // Virtualización para listas grandes
  const {
    visibleItems,
    totalHeight,
    handleScroll,
    isScrolling
  } = useVirtualizedList(
    processedMemories,
    itemHeight,
    containerHeight,
    5 // overscan
  );

  // Callbacks memoizados
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((value: 'date' | 'title' | 'emotion') => {
    setSortBy(value);
  }, []);

  const handleFilterChange = useCallback((value: 'all' | 'favorites' | 'recent') => {
    setFilterBy(value);
  }, []);

  if (processedMemories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          {memories.length === 0 ? 'No memories found' : 'No memories match your search'}
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            onClick={() => setSearchTerm('')}
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de filtrado y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="emotion">Sort by Emotion</option>
          </select>
          
          <select
            value={filterBy}
            onChange={(e) => handleFilterChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Memories</option>
            <option value="favorites">Favorites</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      </div>

      {/* Lista virtualizada o normal */}
      {showVirtualization && processedMemories.length > 10 ? (
        <div
          className="overflow-auto border rounded-lg"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleItems.map(({ item: memory, index, top }) => (
              <MemoryItem
                key={memory.id}
                memory={memory}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  height: itemHeight
                }}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
          
          {/* Indicador de scroll */}
          {isScrolling && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              Scrolling...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {processedMemories.map((memory) => (
            <MemoryItem
              key={memory.id}
              memory={memory}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
      
      {/* Estadísticas */}
      <div className="text-sm text-gray-500 text-center py-2">
        Showing {processedMemories.length} of {memories.length} memories
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
};

// Aplicar optimizaciones HOC
export const OptimizedMemoryList = withRenderOptimization(
  OptimizedMemoryListComponent,
  {
    memo: true,
    profiler: process.env.NODE_ENV === 'development',
    errorBoundary: true
  }
);

OptimizedMemoryList.displayName = 'OptimizedMemoryList';