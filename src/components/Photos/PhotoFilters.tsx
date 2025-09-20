import React from 'react';
import Button from '@/components/ui/button';
import { Star, Calendar, Archive, Filter } from 'lucide-react';
import { FilterType, PhotoData, PHOTO_CATEGORIES } from '@/types/photoTypes';

interface PhotoFiltersProps {
  filterType: FilterType;
  selectedCategory: PhotoData['category'] | 'all';
  onFilterChange: (filterType: FilterType) => void;
  onCategoryChange: (category: PhotoData['category'] | 'all') => void;
}

// Obtener icono de categoría
const getCategoryIcon = (category: PhotoData['category']) => {
  switch (category) {
    case 'selfie': return '🤳';
    case 'landscape': return '🏞️';
    case 'portrait': return '👤';
    case 'food': return '🍽️';
    case 'travel': return '✈️';
    case 'family': return '👨‍👩‍👧‍👦';
    case 'pets': return '🐕';
    case 'events': return '🎉';
    default: return '📷';
  }
};

export function PhotoFilters({ 
  filterType, 
  selectedCategory, 
  onFilterChange, 
  onCategoryChange 
}: PhotoFiltersProps) {
  return (
    <>
      {/* Filtros principales */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            Todas
          </Button>
          <Button
            variant={filterType === 'starred' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('starred')}
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritas
          </Button>
          <Button
            variant={filterType === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('recent')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Recientes
          </Button>
          <Button
            variant={filterType === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('archived')}
          >
            <Archive className="w-4 h-4 mr-1" />
            Archivadas
          </Button>
          <Button
            variant={filterType === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('category')}
          >
            <Filter className="w-4 h-4 mr-1" />
            Por categoría
          </Button>
        </div>
      </div>

      {/* Filtro de categorías */}
      {filterType === 'category' && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('all')}
            >
              Todas las categorías
            </Button>
            {PHOTO_CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category)}
              >
                <span className="mr-1">{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}