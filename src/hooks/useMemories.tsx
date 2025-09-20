import React from 'react';
import { MemoriesContext, MemoriesContextType } from './memories-context';
import { useMemoryState } from './useMemoryState';
import { useMemoryOperations } from './useMemoryOperations';
import { useMemorySearch } from './useMemorySearch';
import { useMemoryPagination } from './useMemoryPagination';
import { useMemoryFiles } from './useMemoryFiles';
import { useAuth } from './use-auth-hook';
import { ElectronService } from '../services/electronAPI';



/**
 * Proveedor del contexto de memorias
 * Integra todos los hooks especializados en una interfaz unificada
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Proveedor del contexto
 */
export const MemoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Hooks especializados
  const { globalState, updateGlobalState } = useMemoryState();
  const { saveMemory, deleteMemory, getMemoryById } = useMemoryOperations();
  const { searchMemories, getMemoriesByTag, getMemoriesByType } = useMemorySearch();
  const { loadMemoriesPage, loadMoreMemories, refreshMemories } = useMemoryPagination();
  const { exportMemories, importMemories } = useMemoryFiles();
  
  // Estado local para navegación
  const [navigating, setNavigating] = React.useState(false);
  
  // Crear el valor del contexto
  const contextValue: MemoriesContextType = {
    // Estado
    memories: globalState.memories,
    loading: globalState.loading,
    error: globalState.error,
    currentPage: globalState.currentPage || 1,
    hasMore: globalState.hasMore || false,
    totalMemories: globalState.totalMemories || 0,
    loadingMore: globalState.loadingMore || false,
    
    // Funciones principales de gestión
    loadMemories: async (filters?: any) => {
      await loadMemoriesPage(1, filters);
    },
    saveMemory,
    deleteMemory,
    searchMemories,
    getMemoryById,
    getMemoriesByTag,
    getMemoriesByType,
    refreshMemories,
    selectSaveDirectory: async () => null, // TODO: Implementar
    saveFileToDirectory: async () => null, // TODO: Implementar
    setNavigating,
    
    // Funciones de paginación
    loadMemoriesPage,
    loadMoreMemories,
    resetPagination: () => {
      // TODO: Implementar reset de paginación
    },
    
    // Funciones de import/export
    exportMemories,
    importMemories
  };
  
  return (
    <MemoriesContext.Provider value={contextValue}>
      {children}
    </MemoriesContext.Provider>
  );
};

// El hook useMemories se encuentra ahora en useMemoriesContext.ts
