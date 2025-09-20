import { useCallback } from 'react';
import { Memory } from '../types';
import { useMemoryState } from './useMemoryState';

/**
 * Hook para operaciones de búsqueda y filtrado de memorias
 * 
 * @returns {Object} Funciones para buscar y filtrar memorias
 * 
 * @example
 * ```tsx
 * const { searchMemories, getMemoriesByTag, getMemoriesByType } = useMemorySearch();
 * 
 * // Buscar memorias
 * const results = searchMemories('importante');
 * 
 * // Filtrar por tag
 * const taggedMemories = getMemoriesByTag('trabajo');
 * 
 * // Filtrar por tipo
 * const textMemories = getMemoriesByType('texto');
 * ```
 */
export const useMemorySearch = () => {
  const { globalState } = useMemoryState();

  /**
   * Busca memorias por título, contenido o tags
   * 
   * @param {string} query - Término de búsqueda
   * @returns {Memory[]} Array de memorias que coinciden con la búsqueda
   */
  const searchMemories = useCallback((query: string): Memory[] => {
    if (!query.trim()) return globalState.memories;
    
    const lowercaseQuery = query.toLowerCase();
    return globalState.memories.filter(memory => 
      memory.title.toLowerCase().includes(lowercaseQuery) ||
      memory.content.toLowerCase().includes(lowercaseQuery) ||
      memory.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [globalState.memories]);

  /**
   * Obtiene todas las memorias que contienen un tag específico
   * 
   * @param {string} tag - Tag a buscar
   * @returns {Memory[]} Array de memorias que contienen el tag
   */
  const getMemoriesByTag = useCallback((tag: string): Memory[] => {
    return globalState.memories.filter(memory => memory.tags.includes(tag));
  }, [globalState.memories]);

  /**
   * Obtiene todas las memorias de un tipo específico
   * 
   * @param {Memory['type']} type - Tipo de memoria ('texto', 'imagen', 'audio', etc.)
   * @returns {Memory[]} Array de memorias del tipo especificado
   */
  const getMemoriesByType = useCallback((type: Memory['type']): Memory[] => {
    return globalState.memories.filter(memory => memory.type === type);
  }, [globalState.memories]);

  /**
   * Busca memorias por múltiples criterios
   * 
   * @param {Object} criteria - Criterios de búsqueda
   * @param {string} [criteria.query] - Término de búsqueda general
   * @param {string[]} [criteria.tags] - Tags específicos
   * @param {Memory['type'][]} [criteria.types] - Tipos de memoria
   * @param {boolean} [criteria.isEncrypted] - Si está cifrada o no
   * @param {Date} [criteria.dateFrom] - Fecha desde
   * @param {Date} [criteria.dateTo] - Fecha hasta
   * @returns {Memory[]} Array de memorias que coinciden con los criterios
   */
  const searchMemoriesByCriteria = useCallback((criteria: {
    query?: string;
    tags?: string[];
    types?: Memory['type'][];
    isEncrypted?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Memory[] => {
    let filteredMemories = globalState.memories;

    // Filtrar por query general
    if (criteria.query && criteria.query.trim()) {
      const lowercaseQuery = criteria.query.toLowerCase();
      filteredMemories = filteredMemories.filter(memory => 
        memory.title.toLowerCase().includes(lowercaseQuery) ||
        memory.content.toLowerCase().includes(lowercaseQuery) ||
        memory.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    }

    // Filtrar por tags específicos
    if (criteria.tags && criteria.tags.length > 0) {
      filteredMemories = filteredMemories.filter(memory => 
        criteria.tags!.some(tag => memory.tags.includes(tag))
      );
    }

    // Filtrar por tipos
    if (criteria.types && criteria.types.length > 0) {
      filteredMemories = filteredMemories.filter(memory => 
        criteria.types!.includes(memory.type)
      );
    }

    // Filtrar por estado de cifrado
    if (criteria.isEncrypted !== undefined) {
      filteredMemories = filteredMemories.filter(memory => 
        memory.isEncrypted === criteria.isEncrypted
      );
    }

    // Filtrar por rango de fechas
    if (criteria.dateFrom || criteria.dateTo) {
      filteredMemories = filteredMemories.filter(memory => {
        const memoryDate = new Date(memory.createdAt);
        
        if (criteria.dateFrom && memoryDate < criteria.dateFrom) {
          return false;
        }
        
        if (criteria.dateTo && memoryDate > criteria.dateTo) {
          return false;
        }
        
        return true;
      });
    }

    return filteredMemories;
  }, [globalState.memories]);

  /**
   * Obtiene todos los tags únicos de las memorias
   * 
   * @returns {string[]} Array de tags únicos
   */
  const getAllTags = useCallback((): string[] => {
    const allTags = globalState.memories.flatMap(memory => memory.tags);
    return [...new Set(allTags)].sort();
  }, [globalState.memories]);

  /**
   * Obtiene todos los tipos únicos de las memorias
   * 
   * @returns {Memory['type'][]} Array de tipos únicos
   */
  const getAllTypes = useCallback((): Memory['type'][] => {
    const allTypes = globalState.memories.map(memory => memory.type);
    return [...new Set(allTypes)].sort();
  }, [globalState.memories]);

  /**
   * Obtiene estadísticas de las memorias
   * 
   * @returns {Object} Objeto con estadísticas
   */
  const getMemoryStats = useCallback(() => {
    const memories = globalState.memories;
    const totalMemories = memories.length;
    const encryptedMemories = memories.filter(m => m.isEncrypted).length;
    const typeStats = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const tagStats = memories.flatMap(m => m.tags).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMemories,
      encryptedMemories,
      unencryptedMemories: totalMemories - encryptedMemories,
      typeStats,
      tagStats,
      totalTags: Object.keys(tagStats).length,
      totalTypes: Object.keys(typeStats).length
    };
  }, [globalState.memories]);

  /**
   * Ordena memorias por diferentes criterios
   * 
   * @param {Memory[]} memories - Array de memorias a ordenar
   * @param {'date' | 'title' | 'type' | 'updated'} sortBy - Criterio de ordenación
   * @param {'asc' | 'desc'} order - Orden ascendente o descendente
   * @returns {Memory[]} Array de memorias ordenadas
   */
  const sortMemories = useCallback((memories: Memory[], sortBy: 'date' | 'title' | 'type' | 'updated', order: 'asc' | 'desc' = 'desc'): Memory[] => {
    const sorted = [...memories].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, []);

  return {
    searchMemories,
    getMemoriesByTag,
    getMemoriesByType,
    searchMemoriesByCriteria,
    getAllTags,
    getAllTypes,
    getMemoryStats,
    sortMemories
  };
};