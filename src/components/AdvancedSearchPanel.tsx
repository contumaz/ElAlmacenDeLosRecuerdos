import React, { useState } from 'react';
import { Search, Filter, Brain, Calendar, Tag, Zap, History, X } from 'lucide-react';
import { SearchFilters } from '@/hooks/useAdvancedSearch';
import { MemoryData } from '@/services/electronAPI';

interface AdvancedSearchPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  availableTags: string[];
  availableTypes: string[];
  searchHistory: string[];
  onAddToHistory: (query: string) => void;
  relatedMemories?: MemoryData[];
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableTags,
  availableTypes,
  searchHistory,
  onAddToHistory,
  relatedMemories = []
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const emotions = [
    { value: 'feliz', label: '😊 Feliz', color: 'text-yellow-600' },
    { value: 'triste', label: '😢 Triste', color: 'text-blue-600' },
    { value: 'enojado', label: '😠 Enojado', color: 'text-red-600' },
    { value: 'ansioso', label: '😰 Ansioso', color: 'text-purple-600' },
    { value: 'tranquilo', label: '😌 Tranquilo', color: 'text-green-600' },
    { value: 'emocionado', label: '🤩 Emocionado', color: 'text-orange-600' },
    { value: 'nostalgico', label: '🥺 Nostálgico', color: 'text-indigo-600' },
    { value: 'reflexivo', label: '🤔 Reflexivo', color: 'text-gray-600' }
  ];

  const handleQueryChange = (query: string) => {
    onFiltersChange({ query });
    if (query.trim() && !searchHistory.includes(query.trim())) {
      onAddToHistory(query.trim());
    }
  };

  const handleHistorySelect = (query: string) => {
    onFiltersChange({ query });
    setShowHistory(false);
  };

  const hasActiveFilters = filters.type || filters.tags.length > 0 || 
    filters.dateFrom || filters.dateTo || filters.emotion;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Búsqueda Principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar en tus memorias..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          {searchHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <History className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Historial de Búsquedas */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <History className="w-3 h-3" />
                Búsquedas recientes
              </div>
              {searchHistory.slice(0, 10).map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleHistorySelect(query)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center justify-between group"
                >
                  <span className="truncate">{query}</span>
                  <Search className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opciones de Búsqueda */}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.semanticSearch}
            onChange={(e) => onFiltersChange({ semanticSearch: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Brain className="w-4 h-4 text-purple-600" />
          <span>Búsqueda semántica</span>
        </label>

        <select
          value={filters.sortBy || 'relevance'}
          onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
          className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance">Relevancia</option>
          <option value="date">Fecha</option>
          <option value="title">Título</option>
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-1 text-sm rounded border transition-colors ${
            showAdvanced || hasActiveFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros avanzados
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[filters.type, ...filters.tags, filters.dateFrom, filters.dateTo, filters.emotion]
                .filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Panel de Filtros Avanzados */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-6 space-y-6">
          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de memoria
            </label>
            <select
              value={filters.type}
              onChange={(e) => onFiltersChange({ type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Emoción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado emocional
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {emotions.map(emotion => (
                <button
                  key={emotion.value}
                  onClick={() => onFiltersChange({ 
                    emotion: filters.emotion === emotion.value ? '' : emotion.value 
                  })}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    filters.emotion === emotion.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={emotion.color}>{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro por Etiquetas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Etiquetas
            </label>
            <div className="space-y-3">
              {/* Etiquetas seleccionadas */}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => onFiltersChange({ 
                          tags: filters.tags.filter(t => t !== tag) 
                        })}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Etiquetas disponibles */}
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !filters.tags.includes(tag))
                  .slice(0, 10)
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => onFiltersChange({ 
                        tags: [...filters.tags, tag] 
                      })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {tag}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memorias Relacionadas */}
      {relatedMemories.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            Memorias relacionadas
          </h3>
          <div className="space-y-2">
            {relatedMemories.slice(0, 3).map(memory => (
              <div
                key={memory.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="font-medium text-sm text-gray-900 truncate">
                  {memory.title}
                </div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {memory.content.substring(0, 100)}...
                </div>
                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memory.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPanel;