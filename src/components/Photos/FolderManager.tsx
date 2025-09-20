import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, Edit3, Trash2, Move, Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoData } from '@/types/photoTypes';

export interface VirtualFolder {
  id: string;
  name: string;
  description?: string;
  photoIds: string[];
  createdAt: string;
  color?: string;
}

interface FolderManagerProps {
  photos: PhotoData[];
  selectedPhotos: PhotoData[];
  folders: VirtualFolder[];
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folder: Omit<VirtualFolder, 'id' | 'createdAt'>) => void;
  onUpdateFolder: (folderId: string, updates: Partial<VirtualFolder>) => void;
  onDeleteFolder: (folderId: string) => void;
  onMovePhotos: (photoIds: string[], folderId: string) => void;
}

const FOLDER_COLORS = [
  { name: 'Azul', value: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Verde', value: 'bg-green-100 text-green-800 border-green-200' },
  { name: 'Amarillo', value: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { name: 'Rojo', value: 'bg-red-100 text-red-800 border-red-200' },
  { name: 'Púrpura', value: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Rosa', value: 'bg-pink-100 text-pink-800 border-pink-200' },
  { name: 'Gris', value: 'bg-gray-100 text-gray-800 border-gray-200' }
];

export function FolderManager({
  photos,
  selectedPhotos,
  folders,
  isOpen,
  onClose,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMovePhotos
}: FolderManagerProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingFolder, setEditingFolder] = useState<VirtualFolder | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: FOLDER_COLORS[0].value
  });
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setEditingFolder(null);
      setNewFolder({
        name: '',
        description: '',
        color: FOLDER_COLORS[0].value
      });
      setSelectedFolderId('');
    }
  }, [isOpen]);

  const handleCreateFolder = () => {
    if (newFolder.name.trim()) {
      onCreateFolder({
        name: newFolder.name.trim(),
        description: newFolder.description.trim(),
        photoIds: [],
        color: newFolder.color
      });
      setNewFolder({
        name: '',
        description: '',
        color: FOLDER_COLORS[0].value
      });
      setMode('list');
    }
  };

  const handleEditFolder = (folder: VirtualFolder) => {
    setEditingFolder(folder);
    setNewFolder({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || FOLDER_COLORS[0].value
    });
    setMode('edit');
  };

  const handleUpdateFolder = () => {
    if (editingFolder && newFolder.name.trim()) {
      onUpdateFolder(editingFolder.id, {
        name: newFolder.name.trim(),
        description: newFolder.description.trim(),
        color: newFolder.color
      });
      setMode('list');
      setEditingFolder(null);
    }
  };

  const handleMovePhotos = () => {
    if (selectedFolderId && selectedPhotos.length > 0) {
      onMovePhotos(selectedPhotos.map(p => p.id), selectedFolderId);
      onClose();
    }
  };

  const getFolderPhotoCount = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.photoIds.length : 0;
  };

  const getColorClass = (colorValue: string) => {
    return colorValue || FOLDER_COLORS[0].value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Crear carpeta' : 
             mode === 'edit' ? 'Editar carpeta' : 
             selectedPhotos.length > 0 ? `Mover ${selectedPhotos.length} imágenes` : 'Gestionar carpetas'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'list' && (
            <div className="space-y-4">
              {/* Botón crear carpeta */}
              <Button
                onClick={() => setMode('create')}
                className="w-full justify-start"
                variant="outline"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Crear nueva carpeta
              </Button>

              {/* Lista de carpetas */}
              <div className="space-y-3">
                {folders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay carpetas creadas</p>
                    <p className="text-sm">Crea tu primera carpeta para organizar tus imágenes</p>
                  </div>
                ) : (
                  folders.map(folder => (
                    <div
                      key={folder.id}
                      className={`border rounded-lg p-4 ${getColorClass(folder.color)} ${
                        selectedPhotos.length > 0 ? 'cursor-pointer hover:shadow-md' : ''
                      } ${
                        selectedFolderId === folder.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (selectedPhotos.length > 0) {
                          setSelectedFolderId(folder.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Folder className="w-5 h-5" />
                            <h3 className="font-medium">{folder.name}</h3>
                            {selectedFolderId === folder.id && selectedPhotos.length > 0 && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          {folder.description && (
                            <p className="text-sm opacity-75 mt-1">{folder.description}</p>
                          )}
                          <p className="text-xs opacity-60 mt-2">
                            {getFolderPhotoCount(folder.id)} imágenes
                          </p>
                        </div>
                        
                        {selectedPhotos.length === 0 && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFolder(folder);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar la carpeta "${folder.name}"? Las imágenes no se eliminarán.`)) {
                                  onDeleteFolder(folder.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Nombre de la carpeta</Label>
                <Input
                  id="folderName"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vacaciones 2024"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="folderDescription">Descripción (opcional)</Label>
                <Input
                  id="folderDescription"
                  value={newFolder.description}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la carpeta"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Color de la carpeta</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {FOLDER_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`p-3 rounded-lg border-2 text-sm font-medium ${
                        color.value
                      } ${
                        newFolder.color === color.value ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setNewFolder(prev => ({ ...prev, color: color.value }))}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {selectedPhotos.length > 0 && mode === 'list' && (
              <p className="text-sm text-gray-600">
                {selectedPhotos.length} imagen{selectedPhotos.length !== 1 ? 'es' : ''} seleccionada{selectedPhotos.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            {mode === 'list' ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  {selectedPhotos.length > 0 ? 'Cancelar' : 'Cerrar'}
                </Button>
                {selectedPhotos.length > 0 && (
                  <Button
                    onClick={handleMovePhotos}
                    disabled={!selectedFolderId}
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Mover a carpeta
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode('list')}>Cancelar</Button>
                <Button
                  onClick={mode === 'create' ? handleCreateFolder : handleUpdateFolder}
                  disabled={!newFolder.name.trim()}
                >
                  {mode === 'create' ? 'Crear carpeta' : 'Guardar cambios'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FolderManager;