import React from 'react';
import { Search, Grid, List, CheckSquare, Square, Star, Trash2, Users } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactSortType } from '@/types/contactTypes';

interface ContactToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: ContactSortType;
  onSortChange: (sort: ContactSortType) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  isMultiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (action: string) => void;
}

export function ContactToolbar({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isMultiSelectMode,
  onToggleMultiSelect,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkAction
}: ContactToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Barra principal */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre, empresa, teléfono..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Controles de vista y selección */}
        <div className="flex items-center space-x-2">
          {/* Ordenamiento */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nombre A-Z</SelectItem>
              <SelectItem value="name-desc">Nombre Z-A</SelectItem>
              <SelectItem value="company-asc">Empresa A-Z</SelectItem>
              <SelectItem value="company-desc">Empresa Z-A</SelectItem>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="phone">Por teléfono</SelectItem>
            </SelectContent>
          </Select>

          {/* Vista */}
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-r-none border-r"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-l-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          {/* Selección múltiple */}
          <Button
            variant={isMultiSelectMode ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleMultiSelect}
          >
            {isMultiSelectMode ? (
              <CheckSquare className="w-4 h-4 mr-1" />
            ) : (
              <Square className="w-4 h-4 mr-1" />
            )}
            Seleccionar
          </Button>
        </div>
      </div>

      {/* Barra de selección múltiple */}
      {isMultiSelectMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            {/* Información de selección */}
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {selectedCount} de {totalCount} contactos seleccionados
              </span>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
                >
                  {selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </div>
            </div>

            {/* Acciones en lote */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('star')}
                disabled={selectedCount === 0}
                title="Marcar como favoritos"
              >
                <Star className="w-4 h-4 mr-1" />
                Favoritos
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('group')}
                disabled={selectedCount === 0}
                title="Crear grupo"
              >
                <Users className="w-4 h-4 mr-1" />
                Agrupar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('delete')}
                disabled={selectedCount === 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar seleccionados"
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

export default ContactToolbar;