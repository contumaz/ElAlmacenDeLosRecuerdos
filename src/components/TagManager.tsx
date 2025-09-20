import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Tag, Hash, TrendingUp, Clock, Palette } from 'lucide-react';
import { useTags } from '../hooks/useTags';

/**
 * Props para el componente TagManager
 */
interface TagManagerProps {
  /** Array de etiquetas actualmente seleccionadas */
  selectedTags: string[];
  /** Callback que se ejecuta cuando cambian las etiquetas seleccionadas */
  onTagsChange: (tags: string[]) => void;
  /** Texto placeholder para el input de nueva etiqueta */
  placeholder?: string;
  /** Número máximo de etiquetas permitidas */
  maxTags?: number;
  /** Si se debe mostrar el selector de color */
  showColorPicker?: boolean;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

/**
 * Interfaz para las sugerencias de etiquetas
 */
interface TagSuggestion {
  /** Nombre de la etiqueta */
  name: string;
  /** Número de veces que se ha usado la etiqueta */
  count: number;
  /** Color asignado a la etiqueta */
  color?: string;
  /** Categoría de la sugerencia */
  category: 'popular' | 'recent' | 'suggested' | 'available';
}

/**
 * Componente avanzado para gestión de etiquetas con sugerencias inteligentes
 * 
 * Proporciona una interfaz completa para agregar, remover y gestionar etiquetas
 * con funcionalidades como:
 * - Sugerencias inteligentes basadas en popularidad y uso reciente
 * - Selector de colores personalizado
 * - Validación de límites de etiquetas
 * - Autocompletado y filtrado en tiempo real
 * 
 * @param props - Propiedades del componente TagManager
 * @returns Componente JSX para gestión de etiquetas
 * 
 * @example
 * ```tsx
 * <TagManager
 *   selectedTags={tags}
 *   onTagsChange={setTags}
 *   maxTags={5}
 *   showColorPicker={true}
 *   placeholder="Agregar nueva etiqueta..."
 * />
 * ```
 */
export const TagManager: React.FC<TagManagerProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Agregar etiqueta...",
  maxTags = 10,
  showColorPicker = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    allTags,
    addTag,
    removeTag,
    getPopularTags,
    getRecentTags,
    getSuggestedTags,
    getTagColor,
    setTagColor
  } = useTags();

  // Colores predefinidos para etiquetas
  const tagColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  /**
   * Genera sugerencias inteligentes de etiquetas basadas en diferentes criterios
   * 
   * Combina etiquetas populares, recientes, sugeridas y disponibles
   * filtradas por el texto de entrada actual
   * 
   * @returns Array de sugerencias de etiquetas ordenadas por relevancia
   */
  const generateSuggestions = (): TagSuggestion[] => {
    const suggestions: TagSuggestion[] = [];
    const inputLower = inputValue.toLowerCase();
    
    // Tags populares
    const popularTags = getPopularTags(3);
    popularTags.forEach(tag => {
      if (tag.tag.toLowerCase().includes(inputLower) && !selectedTags.includes(tag.tag)) {
        suggestions.push({
          name: tag.tag,
          count: tag.count,
          category: 'popular',
          color: getTagColor(tag.tag)
        });
      }
    });
    
    // Tags recientes
    const recentTags = getRecentTags(3);
    recentTags.forEach(tag => {
      if (tag.tag.toLowerCase().includes(inputLower) && 
          !selectedTags.includes(tag.tag) && 
          !suggestions.find(s => s.name === tag.tag)) {
        suggestions.push({
          name: tag.tag,
          count: tag.count,
          category: 'recent',
          color: getTagColor(tag.tag)
        });
      }
    });
    
    // Tags sugeridas basadas en contenido
    const suggestedTags = getSuggestedTags('', '');
    suggestedTags.forEach(tag => {
      if (tag.toLowerCase().includes(inputLower) && 
          !selectedTags.includes(tag) && 
          !suggestions.find(s => s.name === tag)) {
        suggestions.push({
          name: tag,
          count: 0,
          category: 'suggested',
          color: getTagColor(tag)
        });
      }
    });
    
    // Tags disponibles
    const availableTags = allTags.filter(tag => 
      tag.toLowerCase().includes(inputLower) && 
      !selectedTags.includes(tag) &&
      !suggestions.find(s => s.name === tag)
    ).slice(0, 5);
    
    availableTags.forEach(tag => {
      suggestions.push({
        name: tag,
        count: 0,
        category: 'available',
        color: getTagColor(tag)
      });
    });
    
    return suggestions.slice(0, 8);
  };

  /**
   * Maneja la adición de una nueva etiqueta
   * 
   * @param tagName - Nombre de la etiqueta a agregar
   * @param color - Color opcional para la etiqueta
   */
  const handleAddTag = (tagName: string, color?: string) => {
    if (tagName.trim() && 
        !selectedTags.includes(tagName.trim()) && 
        selectedTags.length < maxTags) {
      
      const newTag = tagName.trim();
      addTag(newTag);
      
      if (color) {
        setTagColor(newTag, color);
      }
      
      onTagsChange([...selectedTags, newTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  /**
   * Maneja la eliminación de una etiqueta seleccionada
   * 
   * @param tagToRemove - Nombre de la etiqueta a eliminar
   */
  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  /**
   * Maneja los eventos de teclado en el input de etiquetas
   * 
   * @param e - Evento de teclado
   */
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue, selectedColor);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  /**
   * Obtiene el icono correspondiente a una categoría de sugerencia
   * 
   * @param category - Categoría de la sugerencia
   * @returns Componente JSX del icono
   */
  const getCategoryIcon = (category: TagSuggestion['category']) => {
    switch (category) {
      case 'popular': return <TrendingUp className="w-3 h-3" />;
      case 'recent': return <Clock className="w-3 h-3" />;
      case 'suggested': return <Hash className="w-3 h-3" />;
      default: return <Tag className="w-3 h-3" />;
    }
  };

  /**
   * Obtiene la etiqueta de texto para una categoría de sugerencia
   * 
   * @param category - Categoría de la sugerencia
   * @returns Texto descriptivo de la categoría
   */
  const getCategoryLabel = (category: TagSuggestion['category']) => {
    switch (category) {
      case 'popular': return 'Popular';
      case 'recent': return 'Reciente';
      case 'suggested': return 'Sugerida';
      default: return 'Disponible';
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = generateSuggestions();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Tags seleccionadas */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedTags.map((tag) => {
          const tagColor = getTagColor(tag);
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: tagColor }}
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Input para nueva etiqueta */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              onFocus={() => setShowSuggestions(true)}
              placeholder={selectedTags.length >= maxTags ? `Máximo ${maxTags} etiquetas` : placeholder}
              disabled={selectedTags.length >= maxTags}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          {showColorPicker && (
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-gray-500" />
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Seleccionar color"
              />
            </div>
          )}
          
          <button
            onClick={() => handleAddTag(inputValue, selectedColor)}
            disabled={!inputValue.trim() || selectedTags.length >= maxTags}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {/* Colores predefinidos */}
        {showColorPicker && (
          <div className="flex gap-1 mt-2">
            {tagColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={`Seleccionar color ${color}`}
              />
            ))}
          </div>
        )}

        {/* Sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Sugerencias inteligentes
              </h4>
              
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${index}`}
                    onClick={() => handleAddTag(suggestion.name, suggestion.color)}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-400">
                        {getCategoryIcon(suggestion.category)}
                      </div>
                      <span 
                        className="text-sm font-medium px-2 py-1 rounded text-white"
                        style={{ backgroundColor: suggestion.color || '#6B7280' }}
                      >
                        {suggestion.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{getCategoryLabel(suggestion.category)}</span>
                      {suggestion.count > 0 && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                          {suggestion.count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contador de etiquetas */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {selectedTags.length}/{maxTags} etiquetas
      </div>
    </div>
  );
};

export default TagManager;