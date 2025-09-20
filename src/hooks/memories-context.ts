import { createContext } from 'react';
import { MemoryData as Memory } from '@/services/electronAPI';

/**
 * Tipo de contexto para la gestión de memorias
 * Proporciona todas las funciones y estados necesarios para manejar memorias
 * @interface MemoriesContextType
 */
export interface MemoriesContextType {
  /** Array de memorias actualmente cargadas */
  memories: Memory[];
  /** Estado de carga general */
  loading: boolean;
  /** Mensaje de error si existe */
  error: string | null;
  
  // Propiedades para paginación
  /** Página actual en la paginación */
  currentPage: number;
  /** Indica si hay más memorias por cargar */
  hasMore: boolean;
  /** Total de memorias disponibles */
  totalMemories: number;
  /** Estado de carga para más memorias */
  loadingMore: boolean;
  
  // Funciones principales de gestión
  /** Carga memorias con filtros opcionales */
  loadMemories: (filters?: any) => Promise<void>;
  /** Guarda una nueva memoria o actualiza una existente */
  saveMemory: (memory: Partial<Memory>) => Promise<boolean>;
  /** Elimina una memoria por ID */
  deleteMemory: (id: number) => Promise<boolean>;
  /** Busca memorias por texto */
  searchMemories: (query: string) => Memory[];
  /** Obtiene una memoria específica por ID */
  getMemoryById: (id: number) => Promise<Memory | undefined>;
  /** Filtra memorias por etiqueta */
  getMemoriesByTag: (tag: string) => Memory[];
  /** Filtra memorias por tipo */
  getMemoriesByType: (type: Memory['type']) => Memory[];
  /** Recarga todas las memorias */
  refreshMemories: () => void;
  /** Selecciona directorio para guardar archivos */
  selectSaveDirectory: () => Promise<string | null>;
  /** Guarda archivo en directorio específico */
  saveFileToDirectory: (content: Blob | string, fileName: string, directoryPath?: string) => Promise<string | null>;
  /** Establece estado de navegación */
  setNavigating: (navigating: boolean) => void;
  
  // Funciones de paginación
  /** Carga una página específica de memorias */
  loadMemoriesPage: (page: number, filters?: any) => Promise<void>;
  /** Carga más memorias (paginación infinita) */
  loadMoreMemories: (filters?: any) => Promise<void>;
  /** Resetea la paginación al inicio */
  resetPagination: () => void;
  
  // Funciones de import/export
  /** Exporta memorias a un archivo */
  exportMemories: (filePath: string) => Promise<{ success: boolean; error?: string; }>;
  /** Importa memorias desde un archivo */
  importMemories: (filePath: string) => Promise<{ success: boolean; error?: string; count?: number; }>;
}

/**
 * Contexto de React para la gestión global de memorias
 * @constant {React.Context<MemoriesContextType | null>}
 */
export const MemoriesContext = createContext<MemoriesContextType | null>(null);