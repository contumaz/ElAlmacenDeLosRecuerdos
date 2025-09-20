import React from 'react';
import { 
  Upload, Download, Grid, List, Search, Edit3, FolderPlus, Tag, 
  Trash2, RotateCw, Eye, CheckSquare, Square, Settings 
} from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ViewMode, SortType } from '@/types/photoTypes';

interface AdvancedPhotoToolbarProps {
  // Búsqueda y filtros
  searchTerm: string;
  sortBy: SortType;
  viewMode: ViewMode;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: SortType) => void;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Acciones básicas
  onImport: () => void;
  onExportAll: () => void;
  photosCount: number;
  
  // Selección múltiple
  isMultiSelectMode: boolean;
  selectedCount: number;
  onToggleMultiSelect: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  
  // Acciones avanzadas
  onBulkRename: () => void;
  onBulkMove: () => void;
  onBulkTag: () => void;
  onBulkDelete: () => void;
  onOpenEditor: () => void;
  onManageFolders: () => void;
  
  // Estado
  hasSelection: boolean;
}

export function AdvancedPhotoToolbar({
  searchTerm,
  sortBy,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onImport,
  onExportAll,
  photosCount,
  isMultiSelectMode,
  selectedCount,
  onToggleMultiSelect,
  onSelectAll,
  onDeselectAll,
  onBulkRename,
  onBulkMove,
  onBulkTag,
  onBulkDelete,
  onOpenEditor,
  onManageFolders,
  hasSelection
}: AdvancedPhotoToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Barra principal */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Lado izquierdo - Acciones principales */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={onImport} className="flex-shrink-0">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onExportAll}
              disabled={photosCount === 0}
              className="flex-shrink-0"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar ({photosCount})
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onManageFolders}
              className="flex-shrink-0"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Carpetas
            </Button>
            
            <div className="w-px h-8 bg-gray-300 mx-1" />
            
            <Button
              variant={isMultiSelectMode ? 'default' : 'outline'}
              onClick={onToggleMultiSelect}
              className="flex-shrink-0"
            >
              {isMultiSelectMode ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Seleccionar
            </Button>
          </div>

          {/* Lado derecho - Controles de vista */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {/* Búsqueda */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar fotos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Ordenar */}
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Más recientes</SelectItem>
                <SelectItem value="date-asc">Más antiguos</SelectItem>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                <SelectItem value="size-desc">Tamaño mayor</SelectItem>
              </SelectContent>
            </Select>

            {/* Vista */}
            <div className="flex border border-gray-200 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-r-none border-r"
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

      {/* Barra de selección múltiple */}
      {isMultiSelectMode && (
        <div className="border-t border-gray-200 bg-blue-50 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Información de selección */}
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {selectedCount} de {photosCount} seleccionadas
              </span>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedCount === photosCount ? onDeselectAll : onSelectAll}
                >
                  {selectedCount === photosCount ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </Button>
              </div>
            </div>

            {/* Acciones en lote */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEditor}
                disabled={selectedCount !== 1}
                title="Editar imagen (solo una seleccionada)"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Editar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkRename}
                disabled={selectedCount === 0}
                title="Renombrar seleccionadas"
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Renombrar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkMove}
                disabled={selectedCount === 0}
                title="Mover a carpeta"
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                Mover
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkTag}
                disabled={selectedCount === 0}
                title="Añadir etiquetas"
              >
                <Tag className="w-4 h-4 mr-1" />
                Etiquetar
              </Button>
              
              <div className="w-px h-6 bg-gray-300" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                disabled={selectedCount === 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar seleccionadas"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedPhotoToolbar;