import React from 'react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Grid, List, Search } from 'lucide-react';
import { ViewMode, SortType } from '@/types/photoTypes';

interface PhotoToolbarProps {
  searchTerm: string;
  sortBy: SortType;
  viewMode: ViewMode;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: SortType) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onImport: () => void;
  onExportAll: () => void;
  photosCount: number;
}

export function PhotoToolbar({
  searchTerm,
  sortBy,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onImport,
  onExportAll,
  photosCount
}: PhotoToolbarProps) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Lado izquierdo - Acciones principales */}
        <div className="flex gap-2">
          <Button onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Fotos
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportAll}
            disabled={photosCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Todas ({photosCount})
          </Button>
        </div>

        {/* Lado derecho - Controles de vista */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar fotos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Ordenar */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="size">Tamaño</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
            </SelectContent>
          </Select>

          {/* Modo de vista */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}