import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, FileText } from 'lucide-react';
import { SearchFilters } from '@/hooks/useAdvancedSearch';
import { useTags } from '@/hooks/useTags';

interface AdvancedSearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  availableTags: string[];
  availableTypes: string[];
  hasActiveFilters: boolean;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableTags,
  availableTypes,
  hasActiveFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const { searchTags, popularTags, recentTags } = useTags();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ query: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ type: e.target.value });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ dateFrom: e.target.value });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ dateTo: e.target.value });
  };

  const handleAddTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      onFiltersChange({ tags: [...filters.tags, tag] });
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  const handleTagInputFocus = () => {
    setShowTagSuggestions(tagInput.length > 0);
  };

  const handleTagInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowTagSuggestions(false), 200);
  };

  // Get filtered tag suggestions
  const tagSuggestions = tagInput.length > 0 
    ? searchTags(tagInput, 10).filter(tag => !filters.tags.includes(tag))
    : [];

  // Get popular and recent tags for quick access
  const popularTagsFiltered = popularTags.filter(tagStat => !filters.tags.includes(tagStat.tag)).slice(0, 5);
  const recentTagsFiltered = recentTags.filter(tagStat => !filters.tags.includes(tagStat.tag)).slice(0, 5);

  const handleRemoveTag = (tagToRemove: string) => {
    onFiltersChange({ 
      tags: filters.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput.trim());
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'texto': return <FileText className="w-4 h-4" />;
      case 'audio': return <span className="w-4 h-4 text-center">🎵</span>;
      case 'video': return <span className="w-4 h-4 text-center">🎬</span>;
      case 'foto': return <span className="w-4 h-4 text-center">📷</span>;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'texto': return 'Texto';
      case 'audio': return 'Audio';
      case 'video': return 'Video';
      case 'foto': return 'Foto';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Barra de búsqueda principal */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar en memorias..."
            value={filters.query}
            onChange={handleQueryChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[filters.type, ...filters.tags, filters.dateFrom, filters.dateTo].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Tipo de memoria
            </label>
            <select
              value={filters.type}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={handleDateFromChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={handleDateToChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            
            {/* Input para agregar tags con autocompletado */}
            <div className="relative mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar o agregar tag..."
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyPress={handleTagInputKeyPress}
                  onFocus={handleTagInputFocus}
                  onBlur={handleTagInputBlur}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleAddTag(tagInput.trim())}
                  disabled={!tagInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar
                </button>
              </div>
              
              {/* Dropdown de sugerencias */}
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {tagSuggestions.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-sm text-gray-700">{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags seleccionados */}
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Sugerencias inteligentes de tags */}
            <div className="space-y-3">
              {/* Tags populares */}
              {popularTagsFiltered.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-orange-500">🔥</span>
                    Tags populares:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularTagsFiltered.map(tagStat => (
                      <button
                        key={tagStat.tag}
                        onClick={() => handleAddTag(tagStat.tag)}
                        className="px-2 py-1 text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
                      >
                        {tagStat.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags recientes */}
              {recentTagsFiltered.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-green-500">⏰</span>
                    Tags recientes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentTagsFiltered.map(tagStat => (
                      <button
                        key={tagStat.tag}
                        onClick={() => handleAddTag(tagStat.tag)}
                        className="px-2 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
                      >
                        {tagStat.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Todos los tags disponibles */}
              {availableTags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Todos los tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !filters.tags.includes(tag) && !popularTagsFiltered.some(pt => pt.tag === tag) && !recentTagsFiltered.some(rt => rt.tag === tag))
                      .slice(0, 8)
                      .map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;