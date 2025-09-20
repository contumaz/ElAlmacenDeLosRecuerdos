import React, { useState } from 'react';
import { X, Star, Archive, Trash2, Download, Calendar, Camera, Tag, MessageSquare, Plus } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoData, PHOTO_CATEGORIES } from '@/types/photoTypes';

interface PhotoModalProps {
  photo: PhotoData | null;
  onClose: () => void;
  onToggleStar: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  onAddComment: (id: string, comment: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onChangeCategory: (id: string, category: PhotoData['category']) => void;
  onExportPhoto: (photo: PhotoData) => void;
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

export function PhotoModal({ 
  photo, 
  onClose, 
  onToggleStar, 
  onToggleArchive, 
  onDeletePhoto, 
  onAddComment, 
  onAddTag, 
  onChangeCategory, 
  onExportPhoto 
}: PhotoModalProps) {
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);

  if (!photo) return null;

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(photo.id, newComment.trim());
      setNewComment('');
      setShowCommentForm(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(photo.id, newTag.trim());
      setNewTag('');
      setShowTagForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate">{photo.originalName}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Imagen */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={photo.base64Data}
                alt={photo.originalName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error loading image in modal:', photo.originalName, photo);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully in modal:', photo.originalName);
                }}
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant={photo.isStarred ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggleStar(photo.id)}
              >
                <Star className={`w-4 h-4 mr-1 ${photo.isStarred ? 'fill-current' : ''}`} />
                {photo.isStarred ? 'Quitar favorito' : 'Marcar favorito'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleArchive(photo.id)}
              >
                <Archive className="w-4 h-4 mr-1" />
                {photo.isArchived ? 'Desarchivar' : 'Archivar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportPhoto(photo)}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDeletePhoto(photo.id);
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
          
          {/* Información y metadatos */}
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Información</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Fecha tomada: {new Date(photo.dateTaken).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Fecha importada: {new Date(photo.dateImported).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span>Tamaño: {formatFileSize(photo.size)}</span>
                </div>
                {photo.width && photo.height && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📐</span>
                    <span>Dimensiones: {photo.width} × {photo.height}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Categoría */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Categoría</h3>
              <Select
                value={photo.category}
                onValueChange={(value) => onChangeCategory(photo.id, value as PhotoData['category'])}
              >
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{getCategoryIcon(photo.category)}</span>
                      {photo.category.charAt(0).toUpperCase() + photo.category.slice(1)}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      <span className="flex items-center gap-2">
                        <span>{getCategoryIcon(category)}</span>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Etiquetas</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagForm(!showTagForm)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {showTagForm && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva etiqueta"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Agregar
                  </Button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {photo.tags.length === 0 && (
                  <p className="text-sm text-gray-500">No hay etiquetas</p>
                )}
              </div>
            </div>
            
            {/* Comentarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Comentarios</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentForm(!showCommentForm)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {showCommentForm && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" onClick={handleAddComment}>
                    Agregar comentario
                  </Button>
                </div>
              )}
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {photo.comments ? (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{photo.comments}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay comentarios</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}