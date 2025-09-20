import React from 'react';
import { Check, X, Edit3, FolderPlus, Tag, Trash2, FileText } from 'lucide-react';
import Button from '@/components/ui/button';
import { PhotoData } from '@/types/photoTypes';

interface MultiSelectToolbarProps {
  selectedPhotos: PhotoData[];
  totalPhotos: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkRename: () => void;
  onBulkMove: () => void;
  onBulkTag: () => void;
  onBulkDelete: () => void;
  onCancel: () => void;
}

export function MultiSelectToolbar({
  selectedPhotos,
  totalPhotos,
  onSelectAll,
  onDeselectAll,
  onBulkRename,
  onBulkMove,
  onBulkTag,
  onBulkDelete,
  onCancel
}: MultiSelectToolbarProps) {
  const selectedCount = selectedPhotos.length;
  const allSelected = selectedCount === totalPhotos && totalPhotos > 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        {/* Información de selección */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedCount} de {totalPhotos} imágenes seleccionadas
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={allSelected ? onDeselectAll : onSelectAll}
            >
              {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </Button>
          </div>
        </div>

        {/* Acciones en lote */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkRename}
            disabled={selectedCount === 0}
            title="Renombrar seleccionadas"
          >
            <Edit3 className="w-4 h-4 mr-1" />
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            title="Cancelar selección"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Información adicional */}
      {selectedCount > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-6 text-sm text-blue-700">
            <span>
              Tamaño total: {formatTotalSize(selectedPhotos.reduce((sum, photo) => sum + photo.size, 0))}
            </span>
            <span>
              Tipos: {getUniqueTypes(selectedPhotos).join(', ')}
            </span>
            <span>
              Categorías: {getUniqueCategories(selectedPhotos).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares
function formatTotalSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getUniqueTypes(photos: PhotoData[]): string[] {
  const types = [...new Set(photos.map(photo => photo.type.split('/')[1].toUpperCase()))];
  return types.slice(0, 3); // Mostrar máximo 3 tipos
}

function getUniqueCategories(photos: PhotoData[]): string[] {
  const categories = [...new Set(photos.map(photo => photo.category))];
  return categories.slice(0, 3); // Mostrar máximo 3 categorías
}

export default MultiSelectToolbar;