import React from 'react';
import { Star, Archive, Trash2, MessageSquare, Tag, Calendar, Check, Edit3 } from 'lucide-react';
import Button from '@/components/ui/button';
import { PhotoData, ViewMode } from '@/types/photoTypes';

interface PhotoGalleryProps {
  photos: PhotoData[];
  viewMode: ViewMode;
  onPhotoClick: (photo: PhotoData) => void;
  onToggleStar: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  // Selección múltiple
  isMultiSelectMode?: boolean;
  selectedPhotos?: string[];
  onToggleSelect?: (photoId: string) => void;
  onOpenEditor?: (photo: PhotoData) => void;
}

// Formatear tamaño de archivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

export function PhotoGallery({ 
  photos, 
  viewMode, 
  onPhotoClick, 
  onToggleStar, 
  onToggleArchive, 
  onDeletePhoto,
  isMultiSelectMode = false,
  selectedPhotos = [],
  onToggleSelect,
  onOpenEditor
}: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron fotos</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.includes(photo.id);
          
          return (
            <div key={photo.id} className="relative group">
              <div 
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
                onClick={() => {
                  if (isMultiSelectMode && onToggleSelect) {
                    onToggleSelect(photo.id);
                  } else {
                    onPhotoClick(photo);
                  }
                }}
              >
                <img
                  src={photo.base64Data}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Error loading image:', photo.originalName);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Checkbox de selección */}
                {isMultiSelectMode && (
                  <div className="absolute top-2 left-2">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                )}
                
                {/* Indicadores de estado */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {photo.isStarred && (
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  )}
                  {photo.isArchived && (
                    <Archive className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              {/* Overlay con acciones */}
              {!isMultiSelectMode && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {onOpenEditor && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditor(photo);
                        }}
                        title="Editar imagen"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(photo.id);
                  }}
                >
                  <Star className={`w-4 h-4 ${photo.isStarred ? 'text-yellow-400 fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(photo.id);
                  }}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePhoto(photo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="space-y-4">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
              onClick={() => onPhotoClick(photo)}
            >
              <img
                src={photo.base64Data}
                alt={photo.originalName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Error loading image:', photo.originalName);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{photo.originalName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <span>{getCategoryIcon(photo.category)}</span>
                  {photo.category}
                </span>
                <span>{formatFileSize(photo.size)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(photo.dateImported).toLocaleDateString()}
                </span>
                {photo.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {photo.tags.length}
                  </span>
                )}
                {photo.comments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {photo.comments.length}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {photo.isStarred && (
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
              )}
              {photo.isArchived && (
                <Archive className="w-5 h-5 text-gray-400" />
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleStar(photo.id)}
              >
                <Star className={`w-4 h-4 ${photo.isStarred ? 'text-yellow-400 fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleArchive(photo.id)}
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeletePhoto(photo.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}