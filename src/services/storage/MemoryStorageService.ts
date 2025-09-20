/**
 * Servicio de Almacenamiento de Memorias para Electron API
 * Maneja CRUD de memorias y operaciones de archivo
 */

import { MemoryData, PaginationParams, APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export class MemoryStorageService {
  private electronAPI: any = null;

  constructor(electronAPI: any) {
    this.electronAPI = electronAPI;
  }

  /**
   * Verifica si Electron está disponible
   */
  isElectronAvailable(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Obtiene memorias del localStorage (fallback para modo web)
   */
  private getLocalMemories(): MemoryData[] {
    try {
      const stored = localStorage.getItem('almacen_memories');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error obteniendo memorias locales:', error);
      return [];
    }
  }

  /**
   * Registra actividad en el log local
   */
  private logActivity(activity: string): void {
    try {
      const activities = JSON.parse(localStorage.getItem('almacen_activities') || '[]');
      activities.push({
        activity,
        timestamp: new Date().toISOString()
      });
      // Mantener solo las últimas 100 actividades
      if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
      }
      localStorage.setItem('almacen_activities', JSON.stringify(activities));
    } catch (error) {
      console.error('Error registrando actividad:', error);
    }
  }

  /**
   * Guarda una nueva memoria
   */
  async saveMemory(memoryData: MemoryData): Promise<boolean> {
    loggingService.info('Iniciando guardado de memoria', 'MemoryStorageService', {
      memoryId: memoryData.id,
      type: memoryData.type,
      title: memoryData.title?.substring(0, 50) + '...'
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web usando localStorage
      try {
        const memories = this.getLocalMemories();
        const newMemory = {
          ...memoryData,
          id: Date.now(),
          date: new Date().toISOString()
        };
        memories.push(newMemory);
        localStorage.setItem('almacen_memories', JSON.stringify(memories));
        
        // Log de actividad
        this.logActivity(`Memoria guardada: ${memoryData.title} (${memoryData.type})`);
        loggingService.info('Memoria guardada exitosamente (modo web)', 'MemoryStorageService', {
          memoryId: newMemory.id,
          type: newMemory.type
        });
        
        return true;
      } catch (error) {
        console.error('Error guardando memoria en localStorage:', error);
        loggingService.error(
          'Error guardando memoria en localStorage', 
          error instanceof Error ? error : new Error('Error guardando memoria en localStorage'), 
          'MemoryStorageService', 
          {
            error: error instanceof Error ? error.message : String(error),
            memoryType: memoryData.type
          }
        );
        return false;
      }
    }
    
    try {
      const result = await this.electronAPI.storage.saveMemory(memoryData);
      if (result.success) {
        loggingService.info('Memoria guardada exitosamente', 'MemoryStorageService', {
          memoryId: memoryData.id,
          type: memoryData.type
        });
      } else {
        loggingService.warn('Fallo al guardar memoria', 'MemoryStorageService', {
          memoryId: memoryData.id,
          error: result.error
        });
      }
      return result.success;
    } catch (error) {
      console.error('Error guardando memoria:', error);
      loggingService.error(
        'Error guardando memoria', 
        error instanceof Error ? error : new Error('Error guardando memoria'), 
        'MemoryStorageService', 
        {
          memoryId: memoryData.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      return false;
    }
  }

  /**
   * Carga memorias con soporte de paginación
   */
  async loadMemories(limit?: number, offset?: number): Promise<MemoryData[]> {
    loggingService.info('Cargando memorias', 'MemoryStorageService', { limit, offset });
    
    if (!this.electronAPI) {
      // Fallback para modo web con paginación
      const allMemories = this.getLocalMemories();
      
      let result: MemoryData[];
      if (limit !== undefined && offset !== undefined) {
        result = allMemories.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        result = allMemories.slice(0, limit);
      } else {
        result = allMemories;
      }
      
      loggingService.info('Memorias cargadas (modo web)', 'MemoryStorageService', {
        count: result.length,
        totalAvailable: allMemories.length
      });
      
      return result;
    }
    
    try {
      const result = await this.electronAPI.storage.loadMemories({ limit, offset });
      const memories = result.memories || [];
      loggingService.info('Memorias cargadas exitosamente', 'MemoryStorageService', {
        count: memories.length,
        limit,
        offset
      });
      return memories;
    } catch (error) {
      console.error('Error cargando memorias:', error);
      loggingService.error(
        'Error cargando memorias', 
        error instanceof Error ? error : new Error('Error cargando memorias'), 
        'MemoryStorageService', 
        {
          error: error instanceof Error ? error.message : String(error),
          limit,
          offset
        }
      );
      return [];
    }
  }

  /**
   * Obtiene el total de memorias disponibles
   */
  async getTotalMemoriesCount(): Promise<number> {
    if (!this.electronAPI) {
      // Fallback para modo web
      return this.getLocalMemories().length;
    }
    
    try {
      const result = await this.electronAPI.storage.getTotalMemoriesCount();
      return result.count || 0;
    } catch (error) {
      console.error('Error obteniendo total de memorias:', error);
      return 0;
    }
  }

  /**
   * Obtiene una memoria específica por ID
   */
  async getMemoryById(memoryId: number): Promise<MemoryData | null> {
    loggingService.info('Cargando memoria por ID', 'MemoryStorageService', { memoryId });
    
    if (!this.electronAPI) {
      // Fallback para modo web
      try {
        const memories = this.getLocalMemories();
        const memory = memories.find(m => m.id === memoryId);
        if (memory) {
          loggingService.info('Memoria encontrada (modo web)', 'MemoryStorageService', { memoryId });
          return memory;
        } else {
          loggingService.warn('Memoria no encontrada (modo web)', 'MemoryStorageService', { memoryId });
          return null;
        }
      } catch (error) {
        console.error('Error obteniendo memoria por ID:', error);
        loggingService.error(
          'Error obteniendo memoria por ID (modo web)', 
          error instanceof Error ? error : new Error('Error obteniendo memoria por ID (modo web)'), 
          'MemoryStorageService', 
          {
            memoryId,
            error: error instanceof Error ? error.message : String(error)
          }
        );
        return null;
      }
    }
    
    try {
      const result = await this.electronAPI.storage.getMemoryById(memoryId);
      if (result.success && result.memory) {
        loggingService.info('Memoria cargada exitosamente', 'MemoryStorageService', { memoryId });
        return result.memory;
      } else {
        loggingService.warn('Memoria no encontrada', 'MemoryStorageService', {
          memoryId,
          error: result.error
        });
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo memoria por ID:', error);
      loggingService.error(
        'Error obteniendo memoria por ID', 
        error instanceof Error ? error : new Error('Error obteniendo memoria por ID'), 
        'MemoryStorageService', 
        {
          memoryId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      return null;
    }
  }

  /**
   * Elimina una memoria del almacenamiento
   */
  async deleteMemory(memoryId: number): Promise<boolean> {
    loggingService.info('Iniciando eliminación de memoria', 'MemoryStorageService', { memoryId });
    
    if (!this.electronAPI) {
      // Fallback para modo web
      try {
        const memories = this.getLocalMemories();
        const filteredMemories = memories.filter(m => m.id !== memoryId);
        localStorage.setItem('almacen_memories', JSON.stringify(filteredMemories));
        
        this.logActivity(`Memoria eliminada: ID ${memoryId}`);
        loggingService.info('Memoria eliminada exitosamente (modo web)', 'MemoryStorageService', { memoryId });
        
        return true;
      } catch (error) {
        console.error('Error eliminando memoria:', error);
        loggingService.error(
          'Error eliminando memoria (modo web)', 
          error instanceof Error ? error : new Error('Error eliminando memoria (modo web)'), 
          'MemoryStorageService', 
          { memoryId }
        );
        return false;
      }
    }
    
    try {
      const result = await this.electronAPI.storage.deleteMemory(memoryId);
      if (result.success) {
        loggingService.info('Memoria eliminada exitosamente', 'MemoryStorageService', { memoryId });
      } else {
        loggingService.warn('Fallo al eliminar memoria', 'MemoryStorageService', {
          memoryId,
          error: result.error
        });
      }
      return result.success;
    } catch (error) {
      console.error('Error eliminando memoria:', error);
      loggingService.error(
        'Error eliminando memoria', 
        error instanceof Error ? error : new Error('Error eliminando memoria'), 
        'MemoryStorageService', 
        {
          memoryId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return false;
    }
  }

  /**
   * Actualiza una memoria existente
   */
  async updateMemory(memoryData: MemoryData): Promise<boolean> {
    loggingService.info('Actualizando memoria', 'MemoryStorageService', {
      memoryId: memoryData.id,
      type: memoryData.type
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web
      try {
        const memories = this.getLocalMemories();
        const index = memories.findIndex(m => m.id === memoryData.id);
        if (index !== -1) {
          memories[index] = {
            ...memoryData,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('almacen_memories', JSON.stringify(memories));
          
          this.logActivity(`Memoria actualizada: ${memoryData.title}`);
          loggingService.info('Memoria actualizada exitosamente (modo web)', 'MemoryStorageService', {
            memoryId: memoryData.id
          });
          
          return true;
        } else {
          loggingService.warn('Memoria no encontrada para actualizar (modo web)', 'MemoryStorageService', {
            memoryId: memoryData.id
          });
          return false;
        }
      } catch (error) {
        console.error('Error actualizando memoria:', error);
        loggingService.error(
          'Error actualizando memoria (modo web)', 
          error instanceof Error ? error : new Error('Error actualizando memoria (modo web)'), 
          'MemoryStorageService', 
          { memoryId: memoryData.id }
        );
        return false;
      }
    }
    
    try {
      const result = await this.electronAPI.storage.updateMemory(memoryData);
      if (result.success) {
        loggingService.info('Memoria actualizada exitosamente', 'MemoryStorageService', {
          memoryId: memoryData.id
        });
      } else {
        loggingService.warn('Fallo al actualizar memoria', 'MemoryStorageService', {
          memoryId: memoryData.id,
          error: result.error
        });
      }
      return result.success;
    } catch (error) {
      console.error('Error actualizando memoria:', error);
      loggingService.error(
        'Error actualizando memoria', 
        error instanceof Error ? error : new Error('Error actualizando memoria'), 
        'MemoryStorageService', 
        {
          memoryId: memoryData.id,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return false;
    }
  }
}