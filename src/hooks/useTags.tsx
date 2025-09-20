import { useState, useEffect, useMemo } from 'react';
import { useMemories } from './use-memories-hook';
import { MemoryData as Memory } from '@/services/electronAPI';

/**
 * Estadísticas de una etiqueta específica
 * @interface TagStats
 */
export interface TagStats {
  /** Nombre de la etiqueta */
  tag: string;
  /** Número de veces que se ha usado la etiqueta */
  count: number;
  /** Fecha de último uso de la etiqueta */
  lastUsed: string;
  /** IDs de las memorias que contienen esta etiqueta */
  memories: number[];
}

/**
 * Sugerencia de etiqueta generada automáticamente
 * @interface TagSuggestion
 */
export interface TagSuggestion {
  /** Nombre de la etiqueta sugerida */
  tag: string;
  /** Nivel de confianza de la sugerencia (0-1) */
  confidence: number;
  /** Fuente de la sugerencia */
  source: 'content' | 'existing' | 'similar';
}

/**
 * Hook personalizado para gestión avanzada de etiquetas
 * Proporciona funcionalidades de autocompletado, estadísticas y sugerencias inteligentes
 * 
 * @returns {Object} Objeto con funciones y datos para gestión de etiquetas
 * 
 * @example
 * ```tsx
 * const {
 *   allTags,
 *   popularTags,
 *   searchTags,
 *   getSuggestedTags,
 *   validateTag
 * } = useTags();
 * 
 * // Buscar etiquetas
 * const results = searchTags('familia');
 * 
 * // Obtener sugerencias
 * const suggestions = getSuggestedTags('Reunión familiar en casa de la abuela');
 * ```
 */
export function useTags() {
  const { memories } = useMemories();
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Extrae todas las etiquetas únicas del sistema con estadísticas completas
   * Calcula automáticamente el conteo, fecha de último uso y memorias asociadas
   * 
   * @returns {TagStats[]} Array de estadísticas de etiquetas ordenado por popularidad
   */
  const allTags = useMemo(() => {
    const tagMap = new Map<string, TagStats>();
    
    memories.forEach((memory) => {
      memory.tags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase().trim();
        
        if (tagMap.has(normalizedTag)) {
          const existing = tagMap.get(normalizedTag)!;
          existing.count += 1;
          existing.memories.push(memory.id);
          
          // Actualizar fecha si es más reciente
          if (memory.date && memory.date > existing.lastUsed) {
          existing.lastUsed = memory.date;
          }
        } else {
          tagMap.set(normalizedTag, {
            tag: normalizedTag,
            count: 1,
            lastUsed: memory.date || new Date().toISOString(),
            memories: [memory.id]
          });
        }
      });
    });
    
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [memories]);

  /**
   * Obtiene las etiquetas más populares del sistema
   * 
   * @returns {TagStats[]} Array de las 10 etiquetas más utilizadas
   */
  const popularTags = useMemo(() => {
    return allTags.slice(0, 10);
  }, [allTags]);

  /**
   * Obtiene las etiquetas utilizadas más recientemente
   * 
   * @returns {TagStats[]} Array de las 10 etiquetas más recientes ordenadas por fecha
   */
  const recentTags = useMemo(() => {
    return [...allTags]
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 10);
  }, [allTags]);

  /**
   * Busca etiquetas que coincidan con el término de búsqueda
   * Prioriza coincidencias exactas al inicio y luego por popularidad
   * 
   * @param {string} query - Término de búsqueda
   * @param {number} [limit=10] - Número máximo de resultados
   * @returns {string[]} Array de nombres de etiquetas que coinciden
   * 
   * @example
   * ```tsx
   * const results = searchTags('fam', 5); // ['familia', 'familiar']
   * ```
   */
  const searchTags = (query: string, limit: number = 10): string[] => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return allTags
      .filter(tagStat => 
        tagStat.tag.includes(normalizedQuery) ||
        tagStat.tag.startsWith(normalizedQuery)
      )
      .sort((a, b) => {
        // Priorizar coincidencias exactas al inicio
        const aStartsWith = a.tag.startsWith(normalizedQuery);
        const bStartsWith = b.tag.startsWith(normalizedQuery);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Luego por popularidad
        return b.count - a.count;
      })
      .slice(0, limit)
      .map(tagStat => tagStat.tag);
  };

  /**
   * Genera sugerencias inteligentes de etiquetas basadas en el contenido
   * Utiliza análisis de patrones y palabras clave para sugerir etiquetas relevantes
   * 
   * @param {string} content - Contenido de la memoria a analizar
   * @param {string} [title] - Título opcional de la memoria
   * @returns {TagSuggestion[]} Array de sugerencias con nivel de confianza
   * 
   * @example
   * ```tsx
   * const suggestions = generateContentSuggestions(
   *   'Reunión familiar en casa de la abuela para celebrar su cumpleaños',
   *   'Cumpleaños de la abuela'
   * );
   * // Retorna: [{ tag: 'familia', confidence: 0.9, source: 'content' }, ...]
   * ```
   */
  const generateContentSuggestions = (content: string, title?: string): TagSuggestion[] => {
    if (!content && !title) return [];
    
    const text = `${title || ''} ${content}`.toLowerCase();
    const suggestions: TagSuggestion[] = [];
    
    // Palabras clave comunes para memorias
    const keywordPatterns = {
      'familia': /\b(familia|familiar|padre|madre|hijo|hija|hermano|hermana|abuelo|abuela|tío|tía|primo|prima)\b/g,
      'trabajo': /\b(trabajo|oficina|jefe|compañero|proyecto|reunión|empresa|carrera)\b/g,
      'viaje': /\b(viaje|vacaciones|hotel|avión|playa|montaña|ciudad|país|turismo)\b/g,
      'celebración': /\b(cumpleaños|boda|fiesta|celebración|aniversario|graduación|navidad)\b/g,
      'amistad': /\b(amigo|amiga|amistad|compañero|conocido)\b/g,
      'amor': /\b(amor|pareja|novio|novia|esposo|esposa|cariño|romance)\b/g,
      'nostalgia': /\b(recuerdo|nostalgia|pasado|infancia|juventud|antes)\b/g,
      'logro': /\b(logro|éxito|triunfo|meta|objetivo|premio|reconocimiento)\b/g,
      'tristeza': /\b(tristeza|dolor|pérdida|despedida|llanto|pena)\b/g,
      'alegría': /\b(alegría|felicidad|sonrisa|risa|diversión|gozo)\b/g
    };
    
    // Buscar patrones en el texto
    Object.entries(keywordPatterns).forEach(([tag, pattern]) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        suggestions.push({
          tag,
          confidence: Math.min(matches.length * 0.3, 1),
          source: 'content'
        });
      }
    });
    
    // Buscar etiquetas similares existentes
    const words = text.split(/\s+/).filter(word => word.length > 3);
    words.forEach(word => {
      const similarTags = allTags.filter(tagStat => 
        tagStat.tag.includes(word) || word.includes(tagStat.tag)
      );
      
      similarTags.forEach(tagStat => {
        if (!suggestions.find(s => s.tag === tagStat.tag)) {
          suggestions.push({
            tag: tagStat.tag,
            confidence: 0.6,
            source: 'similar'
          });
        }
      });
    });
    
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  };

  /**
   * Obtiene todas las memorias que contienen una etiqueta específica
   * 
   * @param {string} tag - Etiqueta a buscar
   * @returns {Memory[]} Array de memorias que contienen la etiqueta
   * 
   * @example
   * ```tsx
   * const familyMemories = getMemoriesByTag('familia');
   * console.log(`Encontradas ${familyMemories.length} memorias familiares`);
   * ```
   */
  const getMemoriesByTag = (tag: string): Memory[] => {
    const normalizedTag = tag.toLowerCase().trim();
    return memories.filter(memory => 
      memory.tags.some(memoryTag => 
        memoryTag.toLowerCase().trim() === normalizedTag
      )
    );
  };

  /**
   * Obtiene etiquetas relacionadas que aparecen frecuentemente junto con la etiqueta dada
   * Utiliza análisis de co-ocurrencia para encontrar patrones de etiquetado
   * 
   * @param {string} tag - Etiqueta base para encontrar relacionadas
   * @param {number} [limit=5] - Número máximo de etiquetas relacionadas
   * @returns {string[]} Array de etiquetas relacionadas ordenadas por frecuencia
   * 
   * @example
   * ```tsx
   * const related = getRelatedTags('familia', 3);
   * // Podría retornar: ['celebración', 'nostalgia', 'alegría']
   * ```
   */
  const getRelatedTags = (tag: string, limit: number = 5): string[] => {
    const normalizedTag = tag.toLowerCase().trim();
    const relatedTagCounts = new Map<string, number>();
    
    // Encontrar memorias que contienen la etiqueta
    const memoriesWithTag = getMemoriesByTag(normalizedTag);
    
    // Contar co-ocurrencias de otras etiquetas
    memoriesWithTag.forEach(memory => {
      memory.tags.forEach(otherTag => {
        const normalizedOtherTag = otherTag.toLowerCase().trim();
        if (normalizedOtherTag !== normalizedTag) {
          relatedTagCounts.set(
            normalizedOtherTag, 
            (relatedTagCounts.get(normalizedOtherTag) || 0) + 1
          );
        }
      });
    });
    
    return Array.from(relatedTagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  };

  /**
   * Valida si una etiqueta cumple con los criterios de formato y longitud
   * 
   * @param {string} tag - Etiqueta a validar
   * @returns {Object} Objeto con resultado de validación y mensaje de error opcional
   * @returns {boolean} returns.isValid - Si la etiqueta es válida
   * @returns {string} [returns.error] - Mensaje de error si la etiqueta no es válida
   * 
   * @example
   * ```tsx
   * const result = validateTag('mi-etiqueta');
   * if (!result.isValid) {
   *   console.error(result.error);
   * }
   * ```
   */
  const validateTag = (tag: string): { isValid: boolean; error?: string } => {
    const trimmed = tag.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'La etiqueta no puede estar vacía' };
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'La etiqueta debe tener al menos 2 caracteres' };
    }
    
    if (trimmed.length > 30) {
      return { isValid: false, error: 'La etiqueta no puede tener más de 30 caracteres' };
    }
    
    if (!/^[\w\sáéíóúñü-]+$/i.test(trimmed)) {
      return { isValid: false, error: 'La etiqueta contiene caracteres no válidos' };
    }
    
    return { isValid: true };
  };

  /**
   * Normaliza una etiqueta eliminando espacios extra y convirtiendo a minúsculas
   * 
   * @param {string} tag - Etiqueta a normalizar
   * @returns {string} Etiqueta normalizada
   * 
   * @example
   * ```tsx
   * const normalized = normalizeTag('  FAMILIA  ');
   * console.log(normalized); // 'familia'
   * ```
   */
  const normalizeTag = (tag: string): string => {
    return tag.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  /**
   * Obtiene una clase CSS de color para una etiqueta basada en su hash
   * Genera colores consistentes para la misma etiqueta
   * 
   * @param {string} tag - Etiqueta para la cual obtener el color
   * @returns {string} Clase CSS de Tailwind para el color
   * 
   * @example
   * ```tsx
   * const colorClass = getTagColor('familia');
   * // Retorna: 'bg-blue-100 text-blue-800'
   * ```
   */
  const getTagColor = (tag: string): string => {
    // Generar color basado en hash del tag
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Establece un color personalizado para una etiqueta específica
   * Actualmente es un placeholder para futura implementación de persistencia
   * 
   * @param {string} tag - Etiqueta a la cual asignar el color
   * @param {string} color - Clase CSS de color a asignar
   * @returns {void}
   * 
   * @example
   * ```tsx
   * setTagColor('familia', 'bg-red-100 text-red-800');
   * ```
   */
  const setTagColor = (tag: string, color: string): void => {
    // Por ahora es un placeholder, se puede implementar persistencia más tarde
    console.log(`Setting color ${color} for tag ${tag}`);
  };

  /**
   * Agrega una nueva etiqueta al sistema después de validarla
   * 
   * @param {string} tag - Etiqueta a agregar
   * @returns {void}
   * 
   * @example
   * ```tsx
   * addTag('nueva-etiqueta');
   * ```
   */
  const addTag = (tag: string): void => {
    const validation = validateTag(tag);
    if (validation.isValid) {
      console.log(`Adding tag: ${tag}`);
      // Esta función sería implementada por el componente padre
    } else {
      console.warn(`Invalid tag: ${tag}`, validation.error);
    }
  };

  /**
   * Remueve una etiqueta del sistema
   * 
   * @param {string} tag - Etiqueta a remover
   * @returns {void}
   * 
   * @example
   * ```tsx
   * removeTag('etiqueta-obsoleta');
   * ```
   */
  const removeTag = (tag: string): void => {
    console.log(`Removing tag: ${tag}`);
    // Esta función sería implementada por el componente padre
  };

  /**
   * Obtiene las etiquetas más populares del sistema
   * 
   * @param {number} [limit=10] - Número máximo de etiquetas a retornar
   * @returns {TagStats[]} Array de estadísticas de etiquetas populares
   * 
   * @example
   * ```tsx
   * const top5 = getPopularTags(5);
   * ```
   */
  const getPopularTags = (limit: number = 10): TagStats[] => {
    return popularTags.slice(0, limit);
  };

  /**
   * Obtiene las etiquetas utilizadas más recientemente
   * 
   * @param {number} [limit=10] - Número máximo de etiquetas a retornar
   * @returns {TagStats[]} Array de estadísticas de etiquetas recientes
   * 
   * @example
   * ```tsx
   * const recent = getRecentTags(5);
   * ```
   */
  const getRecentTags = (limit: number = 10): TagStats[] => {
    return recentTags.slice(0, limit);
  };

  /**
   * Obtiene etiquetas sugeridas basadas en análisis de contenido
   * 
   * @param {string} content - Contenido a analizar
   * @param {string} [title] - Título opcional para análisis adicional
   * @returns {string[]} Array de etiquetas sugeridas
   * 
   * @example
   * ```tsx
   * const suggestions = getSuggestedTags('Reunión familiar', 'Cumpleaños');
   * ```
   */
  const getSuggestedTags = (content: string, title?: string): string[] => {
    const suggestions = generateContentSuggestions(content, title);
    return suggestions.map(s => s.tag);
  };

  // Actualizar estadísticas cuando cambien las memorias
  useEffect(() => {
    setTagStats(allTags);
  }, [allTags, setTagStats]);

  return {
    // Datos
    allTags: allTags.map(stat => stat.tag),
    tagStats,
    popularTags,
    recentTags,
    isLoading,
    
    // Funciones de búsqueda
    searchTags,
    generateContentSuggestions,
    getMemoriesByTag,
    getRelatedTags,
    
    // Funciones de gestión
    addTag,
    removeTag,
    getPopularTags,
    getRecentTags,
    getSuggestedTags,
    
    // Utilidades
    validateTag,
    normalizeTag,
    getTagColor,
    setTagColor,
    
    // Estadísticas
    totalTags: allTags.length,
    totalMemoriesWithTags: memories.filter(m => m.tags.length > 0).length
  };
}

export default useTags;