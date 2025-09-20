import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Memory } from '@/types';
import { MemoryData } from '@/services/electronAPI';

/**
 * Interfaz para los filtros de búsqueda avanzada
 */
export interface SearchFilters {
  /** Consulta de texto para búsqueda */
  query: string;
  /** Tipo de memoria a filtrar */
  type: string;
  /** Array de etiquetas para filtrar */
  tags: string[];
  /** Fecha de inicio para filtro temporal */
  dateFrom: string;
  /** Fecha de fin para filtro temporal */
  dateTo: string;
  /** Emoción asociada a la memoria */
  emotion?: string;
  /** Activar búsqueda semántica avanzada */
  semanticSearch?: boolean;
  /** Criterio de ordenamiento de resultados */
  sortBy?: 'relevance' | 'date' | 'title';
}

/**
 * Interfaz para los resultados de búsqueda
 */
export interface SearchResult {
  /** Memoria encontrada */
  item: Memory;
  /** Puntuación de relevancia */
  score?: number;
  /** Coincidencias encontradas */
  matches?: any[];
}

/**
 * Hook personalizado para búsqueda avanzada de memorias
 * Proporciona funcionalidades de búsqueda fuzzy, semántica y filtrado avanzado
 * 
 * @param {MemoryData[]} memories - Array de memorias para buscar
 * @returns {Object} Objeto con funciones y estado de búsqueda
 * 
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   filters,
 *   setFilters,
 *   results,
 *   clearSearch
 * } = useAdvancedSearch(memories);
 * 
 * // Realizar búsqueda
 * setSearchQuery('familia');
 * 
 * // Aplicar filtros
 * setFilters({ type: 'photo', tags: ['celebración'] });
 * ```
 */
const useAdvancedSearch = (memories: MemoryData[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    tags: [],
    dateFrom: '',
    dateTo: '',
    emotion: '',
    semanticSearch: false,
    sortBy: 'relevance'
  });

  // Sincronizar searchQuery con filters.query
  const effectiveQuery = searchQuery || filters.query;

  // Configuración de Fuse.js para búsqueda fuzzy
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'content', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'metadata.description', weight: 0.1 }
    ],
    threshold: filters.semanticSearch ? 0.4 : 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    findAllMatches: true
  }), [filters.semanticSearch]);

  // Instancia de Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(memories, fuseOptions);
  }, [memories, fuseOptions]);

  /**
   * Obtiene la fecha de una memoria desde sus metadatos o fecha de creación
   * 
   * @param {MemoryData} memory - Memoria de la cual obtener la fecha
   * @returns {Date} Fecha de la memoria
   */
  const getMemoryDate = useCallback((memory: MemoryData): Date => {
    if (memory.metadata?.date) {
      return new Date(memory.metadata.date);
    }
    return new Date(memory.date);
  }, []);

  /**
   * Filtra memorias por rango de fechas
   * 
   * @param {MemoryData} memory - Memoria a evaluar
   * @returns {boolean} True si la memoria está dentro del rango de fechas
   */
  const filterByDate = useCallback((memory: MemoryData): boolean => {
    if (!filters.dateFrom && !filters.dateTo) return true;
    
    const memoryDate = getMemoryDate(memory);
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (memoryDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo el día
      if (memoryDate > toDate) return false;
    }
    
    return true;
  }, [filters.dateFrom, filters.dateTo, getMemoryDate]);

  /**
   * Filtra memorias por tipo específico
   * 
   * @param {MemoryData} memory - Memoria a evaluar
   * @returns {boolean} True si la memoria coincide con el tipo filtrado
   */
  const filterByType = useCallback((memory: MemoryData): boolean => {
    if (!filters.type) return true;
    return memory.type === filters.type;
  }, [filters.type]);

  /**
   * Filtra memorias que contengan todas las etiquetas especificadas
   * 
   * @param {MemoryData} memory - Memoria a evaluar
   * @returns {boolean} True si la memoria contiene todas las etiquetas filtradas
   */
  const filterByTags = useCallback((memory: MemoryData): boolean => {
    if (filters.tags.length === 0) return true;
    if (!memory.tags || !Array.isArray(memory.tags)) return false;
    return filters.tags.every(tag => 
      memory.tags.some(memoryTag => 
        memoryTag.toLowerCase().includes(tag.toLowerCase())
      )
    );
  }, [filters.tags]);

  /**
   * Filtra memorias por emoción asociada
   * 
   * @param {MemoryData} memory - Memoria a evaluar
   * @returns {boolean} True si la memoria tiene la emoción especificada
   */
  const filterByEmotion = useCallback((memory: MemoryData): boolean => {
    if (!filters.emotion) return true;
    return memory.metadata?.emotion === filters.emotion;
  }, [filters.emotion]);

  /**
   * Realiza búsqueda semántica avanzada con puntuación por relevancia
   * Analiza coincidencias exactas, palabras clave y metadatos
   * 
   * @param {string} query - Consulta de búsqueda
   * @param {MemoryData[]} memories - Array de memorias a buscar
   * @returns {MemoryData[]} Memorias ordenadas por relevancia con puntuación
   * 
   * @example
   * ```tsx
   * const results = semanticSearch('familia celebración', memories);
   * ```
   */
  const semanticSearch = useCallback((query: string, memories: MemoryData[]): MemoryData[] => {
    if (!query.trim()) return memories;

    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    return memories.map(memory => {
      let score = 0;
      const content = `${memory.title} ${memory.content}`.toLowerCase();
      const tags = (memory.tags || []).join(' ').toLowerCase();
      
      // Búsqueda exacta de frases
      if (content.includes(query.toLowerCase())) {
        score += 10;
      }
      
      // Búsqueda por palabras clave
      queryWords.forEach(word => {
        const titleMatches = (memory.title.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        const contentMatches = (memory.content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        const tagMatches = (tags.match(new RegExp(word, 'g')) || []).length;
        
        score += titleMatches * 3 + contentMatches * 2 + tagMatches * 4;
      });
      
      // Bonus por coincidencias en metadatos
      if (memory.metadata?.location) {
        const descMatches = queryWords.filter(word => 
          memory.metadata.location.toLowerCase().includes(word)
        ).length;
        score += descMatches * 1.5;
      }
      
      return { ...memory, searchScore: score };
    })
    .filter(memory => memory.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
  }, []);

  /**
   * Calcula la similitud entre dos memorias usando el índice de Jaccard
   * Compara las palabras únicas de título y contenido
   * 
   * @param {MemoryData} memory1 - Primera memoria a comparar
   * @param {MemoryData} memory2 - Segunda memoria a comparar
   * @returns {number} Índice de similitud entre 0 y 1
   * 
   * @example
   * ```tsx
   * const similarity = calculateSimilarity(memory1, memory2);
   * console.log(`Similitud: ${(similarity * 100).toFixed(1)}%`);
   * ```
   */
  const calculateSimilarity = useCallback((memory1: MemoryData, memory2: MemoryData): number => {
    const getWords = (memory: MemoryData) => {
      const text = `${memory.title} ${memory.content}`.toLowerCase();
      return new Set(text.split(/\s+/).filter(word => word.length > 2));
    };
    
    const words1 = getWords(memory1);
    const words2 = getWords(memory2);
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }, []);

  /**
   * Obtiene memorias relacionadas basadas en similitud de contenido
   * 
   * @param {MemoryData} targetMemory - Memoria de referencia
   * @param {number} [limit=5] - Número máximo de memorias relacionadas
   * @returns {MemoryData[]} Array de memorias relacionadas ordenadas por similitud
   * 
   * @example
   * ```tsx
   * const related = getRelatedMemories(currentMemory, 3);
   * ```
   */
  const getRelatedMemories = useCallback((targetMemory: MemoryData, limit: number = 5): MemoryData[] => {
    return memories
      .filter(memory => memory.id !== targetMemory.id)
      .map(memory => ({
        ...memory,
        similarity: calculateSimilarity(targetMemory, memory)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }, [memories, calculateSimilarity]);

  // Función principal de búsqueda
  const results = useMemo(() => {
    let filteredMemories = memories;

    // Aplicar filtros básicos
    filteredMemories = filteredMemories.filter(memory => {
      return filterByType(memory) && 
             filterByTags(memory) && 
             filterByDate(memory) &&
             filterByEmotion(memory);
    });

    // Aplicar búsqueda de texto si hay query
    if (effectiveQuery.trim()) {
      if (filters.semanticSearch) {
        // Usar búsqueda semántica avanzada
        filteredMemories = semanticSearch(effectiveQuery, filteredMemories);
      } else {
        // Usar Fuse.js tradicional
        const fuseResults = fuse.search(effectiveQuery);
        const searchedIds = new Set(fuseResults.map(result => result.item.id));
        filteredMemories = filteredMemories.filter(memory => searchedIds.has(memory.id));
        
        // Ordenar por relevancia (score de Fuse.js)
        const scoreMap = new Map(fuseResults.map(result => [result.item.id, result.score || 0]));
        filteredMemories.sort((a, b) => (scoreMap.get(a.id) || 1) - (scoreMap.get(b.id) || 1));
      }
    } else {
      // Sin búsqueda, aplicar ordenamiento según preferencia
      switch (filters.sortBy) {
        case 'date':
          filteredMemories.sort((a, b) => {
            const dateA = getMemoryDate(a);
            const dateB = getMemoryDate(b);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'title':
          filteredMemories.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'relevance':
        default:
          // Mantener orden original o por fecha si no hay búsqueda
          filteredMemories.sort((a, b) => {
            const dateA = getMemoryDate(a);
            const dateB = getMemoryDate(b);
            return dateB.getTime() - dateA.getTime();
          });
          break;
      }
    }

    return filteredMemories;
  }, [memories, effectiveQuery, filters, fuse, filterByDate, filterByType, filterByTags, filterByEmotion, semanticSearch, getMemoryDate]);

  /**
   * Actualiza los filtros de búsqueda de forma parcial
   * 
   * @param {Partial<SearchFilters>} newFilters - Filtros a actualizar
   * @returns {void}
   * 
   * @example
   * ```tsx
   * updateFilters({ type: 'photo', semanticSearch: true });
   * ```
   */
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Limpia todos los filtros y consultas de búsqueda
   * 
   * @returns {void}
   * 
   * @example
   * ```tsx
   * clearSearch(); // Resetea toda la búsqueda
   * ```
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({
      query: '',
      type: '',
      tags: [],
      dateFrom: '',
      dateTo: ''
    });
  }, []);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return effectiveQuery.trim() !== '' || 
           filters.type !== '' || 
           filters.tags.length > 0 || 
           filters.dateFrom !== '' || 
           filters.dateTo !== '';
  }, [effectiveQuery, filters]);

  // Obtener tags únicos de todas las memorias
  const availableTags = useMemo(() => {
    const allTags = memories.flatMap(memory => 
      (memory.tags && Array.isArray(memory.tags)) ? memory.tags : []
    );
    return [...new Set(allTags)];
  }, [memories]);

  // Obtener tipos únicos de todas las memorias
  const availableTypes = useMemo(() => {
    const allTypes = memories.map(memory => memory.type);
    return [...new Set(allTypes)];
  }, [memories]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters: updateFilters,
    results,
    isSearching: false, // Para compatibilidad
    clearSearch,
    totalResults: results.length,
    hasActiveFilters,
    availableTags,
    availableTypes,
    getRelatedMemories,
    calculateSimilarity,
    semanticSearch
  };
};

export default useAdvancedSearch;