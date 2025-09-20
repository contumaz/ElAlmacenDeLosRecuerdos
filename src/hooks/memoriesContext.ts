import { createContext } from 'react';
import { Memory } from '../types';

/**
 * Interfaz para el contexto de memorias
 */
export interface MemoriesContextType {
  // Estado
  memories: Memory[];
  loading: boolean;
  error: string | null;
  navigating: boolean;
  
  // Operaciones CRUD
  saveMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  getMemoryById: (id: string) => Promise<Memory | null>;
  
  // Búsqueda y filtrado
  searchMemories: (query: string) => Memory[];
  getMemoriesByTag: (tag: string) => Memory[];
  getMemoriesByType: (type: Memory['type']) => Memory[];
  
  // Paginación
  loadMemoriesPage: (page: number, filters?: any) => Promise<void>;
  loadMoreMemories: (filters?: any) => Promise<void>;
  refreshMemories: () => void;
  
  // Archivos
  exportMemories: (memories: Memory[], format: 'json' | 'csv' | 'txt', fileName?: string) => Promise<boolean>;
  importMemories: (filePath?: string) => Promise<Memory[] | null>;
  
  // Navegación
  setNavigating: (navigating: boolean) => void;
}

/**
 * Contexto de memorias
 */
export const MemoriesContext = createContext<MemoriesContextType | undefined>(undefined);