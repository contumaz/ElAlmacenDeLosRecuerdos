import React, { useState, useCallback } from 'react';
import { Memory } from '../types';

/**
 * Estado global compartido para las memorias
 */
export const GLOBAL_STATE = {
  memories: [] as Memory[],
  allMemories: [] as Memory[],
  loading: false,
  loadingMore: false,
  error: null as string | null,
  initialized: false,
  initInProgress: false,
  currentPage: 1,
  hasMore: false,
  totalMemories: 0
};

/**
 * Set de listeners para sincronización de estado
 */
const stateListeners = new Set<(state: typeof GLOBAL_STATE) => void>();

/**
 * Interfaz para el estado local de memorias
 */
export interface MemoryState {
  memories: Memory[];
  allMemories: Memory[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  initialized: boolean;
  initInProgress: boolean;
  currentPage: number;
  hasMore: boolean;
  totalMemories: number;
}

/**
 * Hook para manejar el estado de las memorias con sincronización global
 * 
 * @returns {Object} Estado y función para actualizar el estado global
 * 
 * @example
 * ```tsx
 * const { localState, updateGlobalState } = useMemoryState();
 * 
 * // Actualizar estado global
 * updateGlobalState({ loading: true });
 * ```
 */
export const useMemoryState = () => {
  const [localState, setLocalState] = useState<MemoryState>({
    memories: GLOBAL_STATE.memories,
    allMemories: GLOBAL_STATE.allMemories,
    loading: GLOBAL_STATE.loading,
    loadingMore: GLOBAL_STATE.loadingMore,
    error: GLOBAL_STATE.error,
    initialized: GLOBAL_STATE.initialized,
    initInProgress: GLOBAL_STATE.initInProgress,
    currentPage: GLOBAL_STATE.currentPage,
    hasMore: GLOBAL_STATE.hasMore,
    totalMemories: GLOBAL_STATE.totalMemories
  });

  /**
   * Actualiza el estado global y notifica a todos los listeners
   * 
   * @param {Partial<MemoryState>} updates - Actualizaciones parciales del estado
   */
  const updateGlobalState = useCallback((updates: Partial<MemoryState>) => {
    // Actualizar estado global
    Object.assign(GLOBAL_STATE, updates);
    
    // Notificar a todos los listeners
    stateListeners.forEach(listener => {
      try {
        listener(GLOBAL_STATE);
      } catch (error) {
        console.error('[useMemoryState] Error en listener:', error);
      }
    });
  }, []);

  /**
   * Registra un listener para cambios de estado
   * 
   * @param {Function} listener - Función que se ejecuta cuando cambia el estado
   * @returns {Function} Función para desregistrar el listener
   */
  const subscribeToState = useCallback((listener: (state: typeof GLOBAL_STATE) => void) => {
    stateListeners.add(listener);
    
    // Retornar función de cleanup
    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  return {
    localState,
    updateGlobalState,
    subscribeToState,
    globalState: GLOBAL_STATE
  };
};

/**
 * Hook para sincronizar el estado local con el global
 * 
 * @returns {MemoryState} Estado sincronizado
 */
export const useSyncedMemoryState = (): MemoryState => {
  const [state, setState] = useState<MemoryState>({
    memories: GLOBAL_STATE.memories,
    allMemories: GLOBAL_STATE.allMemories,
    loading: GLOBAL_STATE.loading,
    loadingMore: GLOBAL_STATE.loadingMore,
    error: GLOBAL_STATE.error,
    initialized: GLOBAL_STATE.initialized,
    initInProgress: GLOBAL_STATE.initInProgress,
    currentPage: GLOBAL_STATE.currentPage,
    hasMore: GLOBAL_STATE.hasMore,
    totalMemories: GLOBAL_STATE.totalMemories
  });

  // Sincronizar con el estado global
  const { subscribeToState } = useMemoryState();
  
  // Suscribirse a cambios del estado global
  React.useEffect(() => {
    const unsubscribe = subscribeToState((globalState) => {
      setState({
        memories: globalState.memories,
        allMemories: globalState.allMemories,
        loading: globalState.loading,
        loadingMore: globalState.loadingMore,
        error: globalState.error,
        initialized: globalState.initialized,
        initInProgress: globalState.initInProgress,
        currentPage: globalState.currentPage,
        hasMore: globalState.hasMore,
        totalMemories: globalState.totalMemories
      });
    });

    return unsubscribe;
  }, [subscribeToState]);

  return state;
};