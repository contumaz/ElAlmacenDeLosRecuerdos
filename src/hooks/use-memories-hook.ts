import { useContext } from 'react';
import { MemoriesContext, MemoriesContextType } from './memories-context';

/**
 * Hook personalizado para acceder al contexto de memorias
 * Proporciona acceso completo a la funcionalidad de gestión de memorias
 * 
 * @returns {MemoriesContextType} Objeto con todas las funciones y estado de memorias
 * @throws {Error} Si se usa fuera del MemoriesProvider
 * 
 * @example
 * ```tsx
 * const {
 *   memories,
 *   loading,
 *   saveMemory,
 *   deleteMemory,
 *   searchMemories
 * } = useMemories();
 * ```
 */
export const useMemories = () => {
  const context = useContext(MemoriesContext);
  if (!context) {
    throw new Error('useMemories debe usarse dentro de MemoriesProvider');
  }
  return context;
};