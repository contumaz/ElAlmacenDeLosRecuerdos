import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2, Hash, Search, Check } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { PhotoData } from '@/types/photoTypes';

interface TagManagerProps {
  photos: PhotoData[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTags: (photoIds: string[], tags: string[]) => void;
  onUpdateComments: (photoIds: string[], comments: string) => void;
  allTags: string[]; // Tags existentes en todas las fotos
}

interface TagInput {
  value: string;
  isNew: boolean;
}

export function TagManager({
  photos,
  isOpen,
  onClose,
  onUpdateTags,
  onUpdateComments,
  allTags
}: TagManagerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [comments, setComments] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && photos.length > 0) {
      // Si es una sola foto, cargar sus tags y comentarios
      if (photos.length === 1) {
        setSelectedTags([...photos[0].tags]);
        setComments(photos[0].comments);
        setMode('replace');
      } else {
        // Para múltiples fotos, empezar vacío
        setSelectedTags([]);
        setComments('');
        setMode('add');
      }
      setNewTag('');
      setTagFilter('');
    }
  }, [isOpen, photos]);

  // Obtener tags comunes entre las fotos seleccionadas
  const getCommonTags = () => {
    if (photos.length === 0) return [];
    if (photos.length === 1) return photos[0].tags;
    
    return photos[0].tags.filter(tag => 
      photos.every(photo => photo.tags.includes(tag))
    );
  };

  // Obtener tags sugeridos filtrados
  const getFilteredSuggestions = () => {
    if (!tagFilter) return allTags.slice(0, 10);
    
    return allTags
      .filter(tag => 
        tag.toLowerCase().includes(tagFilter.toLowerCase()) &&
        !selectedTags.includes(tag)
      )
      .slice(0, 10);
  };

  // Añadir tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTag('');
      setTagFilter('');
      setShowSuggestions(false);
    }
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Manejar entrada de nuevo tag
  const handleNewTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Aplicar cambios
  const handleApply = () => {
    const photoIds = photos.map(p => p.id);
    
    // Actualizar tags
    if (mode === 'replace') {
      onUpdateTags(photoIds, selectedTags);
    } else {
      // Modo añadir: combinar tags existentes con nuevos
      const existingTags = photos.length === 1 ? photos[0].tags : [];
      const combinedTags = [...new Set([...existingTags, ...selectedTags])];
      onUpdateTags(photoIds, combinedTags);
    }
    
    // Actualizar comentarios si hay cambios
    if (comments.trim() !== '' || photos.length === 1) {
      if (mode === 'replace' || photos.length === 1) {
        onUpdateComments(photoIds, comments);
      } else {
        // Modo añadir: añadir al comentario existente
        const existingComment = photos.length === 1 ? photos[0].comments : '';
        const newComment = existingComment ? 
          `${existingComment}\n${comments}` : comments;
        onUpdateComments(photoIds, newComment);
      }
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const commonTags = getCommonTags();
  const suggestions = getFilteredSuggestions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {photos.length === 1 
              ? `Editar etiquetas - ${photos[0].originalName}`
              : `Etiquetar ${photos.length} imágenes`
            }
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Modo de aplicación */}
          {photos.length > 1 && (
            <div>
              <Label className="text-base font-medium mb-3 block">Modo de aplicación</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="add"
                    checked={mode === 'add'}
                    onChange={(e) => setMode(e.target.value as 'add' | 'replace')}
                    className="text-blue-600"
                  />
                  <span>Añadir a existentes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={(e) => setMode(e.target.value as 'add' | 'replace')}
                    className="text-blue-600"
                  />
                  <span>Reemplazar existentes</span>
                </label>
              </div>
            </div>
          )}

          {/* Tags comunes (solo para múltiples fotos) */}
          {photos.length > 1 && commonTags.length > 0 && (
            <div>
              <Label className="text-base font-medium mb-3 block">Tags comunes</Label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Añadir nuevos tags */}
          <div>
            <Label htmlFor="newTag" className="text-base font-medium mb-3 block">
              {mode === 'add' ? 'Añadir etiquetas' : 'Etiquetas'}
            </Label>
            
            <div className="relative">
              <Input
                id="newTag"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setTagFilter(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={handleNewTagKeyPress}
                onFocus={() => setShowSuggestions(newTag.length > 0)}
                placeholder="Escribe una etiqueta y presiona Enter"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              {/* Sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => addTag(suggestion)}
                    >
                      <Hash className="w-3 h-3 text-gray-400" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Tags seleccionados */}
            {selectedTags.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="default" className="text-sm">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div>
            <Label htmlFor="comments" className="text-base font-medium mb-3 block">
              {mode === 'add' && photos.length > 1 ? 'Añadir comentario' : 'Comentarios'}
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={mode === 'add' && photos.length > 1 
                ? 'Comentario que se añadirá a las imágenes seleccionadas'
                : 'Comentarios sobre la imagen'
              }
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Resumen de cambios */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de cambios</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Imágenes afectadas:</strong> {photos.length}
              </p>
              {selectedTags.length > 0 && (
                <p>
                  <strong>Etiquetas {mode === 'add' ? 'a añadir' : 'finales'}:</strong> {selectedTags.join(', ')}
                </p>
              )}
              {comments.trim() && (
                <p>
                  <strong>Comentario {mode === 'add' && photos.length > 1 ? 'a añadir' : 'final'}:</strong> {comments.length > 50 ? comments.substring(0, 50) + '...' : comments}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTags.length > 0 || comments.trim() ? (
              <span className="text-green-600 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Cambios listos para aplicar
              </span>
            ) : (
              'Añade etiquetas o comentarios para continuar'
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={selectedTags.length === 0 && !comments.trim()}
            >
              <Tag className="w-4 h-4 mr-2" />
              Aplicar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TagManager;