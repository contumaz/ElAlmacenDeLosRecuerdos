import { useCallback, useMemo } from 'react';
import { Memory } from '../types';
import electronService from '../services/electronAPI';
import loggingService from '../services/LoggingService';
import { useMemoryState } from './useMemoryState';
import { useValidation } from './useValidation';

/**
 * Hook para operaciones CRUD de memorias
 * 
 * @returns {Object} Funciones para guardar, eliminar y obtener memorias
 * 
 * @example
 * ```tsx
 * const { saveMemory, deleteMemory, getMemoryById } = useMemoryOperations();
 * 
 * // Guardar memoria
 * const success = await saveMemory({
 *   title: 'Mi memoria',
 *   content: 'Contenido',
 *   type: 'texto'
 * });
 * ```
 */
export const useMemoryOperations = () => {
  const { updateGlobalState, globalState } = useMemoryState();
  const { validateMemory, sanitizeData } = useValidation();


  /**
   * Guarda una memoria en el sistema con validación y cifrado automático
   * 
   * @param {Partial<Memory>} memoryData - Datos de la memoria a guardar
   * @returns {Promise<boolean>} Promise que resuelve true si se guardó correctamente
   */
  const saveMemory = useCallback(async (memoryData: Partial<Memory>): Promise<boolean> => {
    console.log('[useMemoryOperations] Guardando memoria:', memoryData.type);
    loggingService.info('Iniciando guardado de memoria', 'useMemoryOperations', {
      memoryId: memoryData.id,
      type: memoryData.type,
      title: memoryData.title?.substring(0, 50) + '...',
      isEncrypted: memoryData.isEncrypted
    });
    
    try {
      updateGlobalState({ error: null });
      
      // Crear memoria temporal para validación
      const tempMemory: Memory = {
        id: memoryData.id || Date.now(),
        title: memoryData.title || 'Sin título',
        content: memoryData.content || '',
        type: memoryData.type || 'texto',
        tags: memoryData.tags || [],
        filePath: memoryData.filePath,
        isEncrypted: memoryData.isEncrypted || false,
        encryptionLevel: memoryData.encryptionLevel || 'none',
        requiresPassword: memoryData.requiresPassword || false,
        privacyLevel: memoryData.privacyLevel || 1,
        createdAt: memoryData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...memoryData.metadata,
          date: memoryData.createdAt || new Date().toISOString()
        }
      };
      
      // VALIDACIÓN PREVIA AL GUARDADO
      console.log('[useMemoryOperations] Validando memoria antes de guardar...');
      const validationResult = await validateMemory(tempMemory);
      
      if (!validationResult.success) {
        console.error('[useMemoryOperations] Memoria no válida:', validationResult.errors);
        loggingService.warn('Memoria no válida durante guardado', 'useMemoryOperations', {
          memoryId: tempMemory.id,
          errors: validationResult.errors
        });
        const errorMessage = validationResult.errors.join(', ');
        updateGlobalState({ error: `Error de validación: ${errorMessage}` });
        return false;
      }
      
      // Sanitizar datos de entrada
      const sanitizedTitle = sanitizeData(tempMemory.title);
      const sanitizedContent = sanitizeData(tempMemory.content);
      
      // Verificar si la sanitización cambió los datos
      if (sanitizedTitle !== tempMemory.title || sanitizedContent !== tempMemory.content) {
        console.log('[useMemoryOperations] Datos sanitizados durante el guardado');
      }
      
      const memoryToSave: Memory = {
        id: tempMemory.id || Date.now(),
        title: sanitizedTitle,
        content: sanitizedContent,
        type: tempMemory.type,
        tags: tempMemory.tags,
        filePath: tempMemory.filePath,
        isEncrypted: tempMemory.isEncrypted,
        encryptionLevel: tempMemory.encryptionLevel,
        requiresPassword: tempMemory.requiresPassword,
        privacyLevel: memoryData.privacyLevel || 1,
        createdAt: tempMemory.metadata?.date || new Date().toISOString(),
        metadata: tempMemory.metadata,
        updatedAt: new Date().toISOString()
      };
      
      // TODO: Implementar cifrado automático cuando sea necesario

      const result = await electronService.storage.saveMemory(memoryToSave);
      
      if (result) {
        console.log('[useMemoryOperations] Memoria guardada correctamente');
        loggingService.info('Memoria guardada exitosamente', 'useMemoryOperations', {
          memoryId: memoryToSave.id,
          type: memoryToSave.type,
          isEncrypted: memoryToSave.isEncrypted
        });
        
        return true;
      } else {
        // Fallback web
        const webMemories = JSON.parse(localStorage.getItem('web_memories') || '[]');
        const existingIndex = webMemories.findIndex((m: Memory) => m.id === memoryToSave.id);
        
        if (existingIndex >= 0) {
          webMemories[existingIndex] = memoryToSave;
        } else {
          webMemories.unshift(memoryToSave);
        }
        
        localStorage.setItem('web_memories', JSON.stringify(webMemories));
        updateGlobalState({ memories: webMemories });
        return true;
      }
    } catch (err) {
      console.error('[useMemoryOperations] Error guardando:', err);
      loggingService.error('Error guardando memoria', new Error('Error guardando memoria'), 'useMemoryOperations', {
        memoryId: memoryData.id,
        error: err instanceof Error ? err.message : String(err)
      });
      updateGlobalState({ error: 'Error guardando memoria' });
      return false;
    }
  }, [updateGlobalState, sanitizeData, validateMemory]);

  /**
   * Elimina una memoria del sistema por su ID
   * 
   * @param {number} id - ID único de la memoria a eliminar
   * @returns {Promise<boolean>} Promise que resuelve true si se eliminó correctamente
   */
  const deleteMemory = useCallback(async (id: number): Promise<boolean> => {
    console.log('[useMemoryOperations] Eliminando memoria:', id);
    loggingService.info('Iniciando eliminación de memoria', 'useMemoryOperations', { memoryId: id });
    
    try {
      updateGlobalState({ error: null });
      
      const result = await electronService.storage.deleteMemory(id);
      
      if (result) {
        console.log('[useMemoryOperations] Memoria eliminada, actualizando lista');
        loggingService.info('Memoria eliminada exitosamente', 'useMemoryOperations', { memoryId: id });
        const newMemories = globalState.memories.filter(m => m.id !== id);
        updateGlobalState({ memories: newMemories });
        return true;
      } else {
        // Fallback web
        const webMemories = JSON.parse(localStorage.getItem('web_memories') || '[]');
        const filteredMemories = webMemories.filter((m: Memory) => m.id !== id);
        localStorage.setItem('web_memories', JSON.stringify(filteredMemories));
        updateGlobalState({ memories: filteredMemories });
        return true;
      }
    } catch (err) {
      console.error('[useMemoryOperations] Error eliminando:', err);
      loggingService.error('Error eliminando memoria', new Error('Error eliminando memoria'), 'useMemoryOperations', {
         memoryId: id,
         error: err instanceof Error ? err.message : String(err)
       });
      updateGlobalState({ error: 'Error eliminando memoria' });
      return false;
    }
  }, [updateGlobalState, globalState.memories]);

  /**
   * Obtiene una memoria específica por su ID
   * 
   * @param {number} id - ID único de la memoria
   * @returns {Promise<Memory | undefined>} Promise que resuelve con la memoria o undefined si no se encuentra
   */
  const getMemoryById = useCallback(async (id: number): Promise<Memory | undefined> => {
    // Primero buscar en las memorias ya cargadas
    const existingMemory = globalState.memories.find(memory => memory.id === id);
    if (existingMemory) {
      return existingMemory;
    }
    
    // Si no está en las memorias cargadas, intentar cargarla desde el servidor
    try {
      console.log(`[useMemoryOperations] Cargando memoria individual con ID: ${id}`);
      const result = await electronService.storage.getMemoryById(id);
      
      if (result) {
        const memory = {
          ...result,
          privacyLevel: 1,
          createdAt: result.metadata?.date || new Date().toISOString(),
          updatedAt: result.metadata?.date || new Date().toISOString(),
          isEncrypted: result.isEncrypted || false,
          encryptionLevel: result.encryptionLevel || 'none',
          requiresPassword: result.requiresPassword || false
        } as Memory;
        
        // TODO: Implementar descifrado cuando sea necesario
        
        return memory;
      } else {
        // Fallback web - buscar en localStorage
        const webMemories = JSON.parse(localStorage.getItem('web_memories') || '[]');
        return webMemories.find((m: Memory) => m.id === id);
      }
    } catch (error) {
      console.error('[useMemoryOperations] Error cargando memoria individual:', error);
      return undefined;
    }
  }, [globalState.memories]);

  return {
    saveMemory,
    deleteMemory,
    getMemoryById
  };
};