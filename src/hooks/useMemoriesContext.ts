import { useContext } from 'react';
import { MemoriesContext, MemoriesContextType } from './memoriesContext';

/**
 * Hook para usar el contexto de memorias
 * 
 * @returns {MemoriesContextType} Contexto de memorias
 * @throws {Error} Si se usa fuera del MemoriesProvider
 */
export const useMemories = (): MemoriesContextType => {
  const context = useContext(MemoriesContext);
  
  if (!context) {
    throw new Error('useMemories debe usarse dentro de MemoriesProvider');
  }
  
  return context;
};