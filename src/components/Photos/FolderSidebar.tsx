import React, { useState } from 'react';
import { Folder, FolderOpen, Image, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/button';
import { VirtualFolder } from './FolderManager';
import { PhotoData } from '@/types/photoTypes';

interface FolderSidebarProps {
  folders: VirtualFolder[];
  photos: PhotoData[];
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onManageFolders: () => void;
}

export function FolderSidebar({
  folders,
  photos,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onManageFolders
}: FolderSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Obtener fotos sin carpeta
  const getPhotosInFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.photoIds.length : 0;
  };

  const getUnassignedPhotos = () => {
    const assignedPhotoIds = new Set(
      folders.flatMap(folder => folder.photoIds)
    );
    return photos.filter(photo => !assignedPhotoIds.has(photo.id)).length;
  };

  const getColorClass = (colorValue?: string) => {
    return colorValue || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-col space-y-2">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <Folder className="w-4 h-4 text-blue-600" />
          </div>
          {folders.map(folder => (
            <div
              key={folder.id}
              className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer ${
                getColorClass(folder.color)
              } ${
                selectedFolderId === folder.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onFolderSelect(folder.id)}
              title={folder.name}
            >
              <Folder className="w-4 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Carpetas</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageFolders}
          >
            Gestionar
          </Button>
        </div>
      </div>

      {/* Lista de carpetas */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Todas las fotos */}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            selectedFolderId === null ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <div className="flex-shrink-0">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">Todas las fotos</p>
            <p className="text-sm text-gray-500">{photos.length} imágenes</p>
          </div>
        </div>

        {/* Fotos sin carpeta */}
        {getUnassignedPhotos() > 0 && (
          <div
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mt-1 ${
              selectedFolderId === 'unassigned' ? 'bg-orange-50 border border-orange-200' : ''
            }`}
            onClick={() => onFolderSelect('unassigned')}
          >
            <div className="flex-shrink-0">
              <Image className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">Sin carpeta</p>
              <p className="text-sm text-gray-500">{getUnassignedPhotos()} imágenes</p>
            </div>
          </div>
        )}

        {/* Separador */}
        {folders.length > 0 && (
          <div className="border-t border-gray-200 my-3" />
        )}

        {/* Carpetas personalizadas */}
        <div className="space-y-1">
          {folders.map(folder => {
            const photoCount = getPhotosInFolder(folder.id);
            return (
              <div
                key={folder.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-all ${
                  getColorClass(folder.color)
                } ${
                  selectedFolderId === folder.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                }`}
                onClick={() => onFolderSelect(folder.id)}
              >
                <div className="flex-shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-75">{photoCount} imágenes</p>
                    {folder.description && (
                      <p className="text-xs opacity-60 truncate max-w-20" title={folder.description}>
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vacío */}
        {folders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay carpetas</p>
            <p className="text-xs">Crea tu primera carpeta</p>
          </div>
        )}
      </div>

      {/* Footer con estadísticas */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Total carpetas:</span>
            <span className="font-medium">{folders.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total imágenes:</span>
            <span className="font-medium">{photos.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FolderSidebar;