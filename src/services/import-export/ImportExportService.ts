/**
 * Servicio de Importación/Exportación para Electron API
 * Maneja operaciones de importar y exportar datos
 */

import { MemoryData, APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export class ImportExportService {
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
   * Importa datos desde un archivo
   */
  async importData(): Promise<APIResponse<{ count: number }>> {
    loggingService.info('Iniciando importación de datos', 'ImportExportService');
    
    if (!this.electronAPI) {
      // Fallback para modo web usando input file
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const data = JSON.parse(e.target?.result as string);
                if (Array.isArray(data)) {
                  // Obtener memorias existentes
                  const existingMemories = JSON.parse(localStorage.getItem('almacen_memories') || '[]');
                  
                  // Agregar nuevas memorias con IDs únicos
                  const newMemories = data.map((memory: any) => ({
                    ...memory,
                    id: Date.now() + Math.random(),
                    importedAt: new Date().toISOString()
                  }));
                  
                  const allMemories = [...existingMemories, ...newMemories];
                  localStorage.setItem('almacen_memories', JSON.stringify(allMemories));
                  
                  loggingService.info('Datos importados exitosamente (modo web)', 'ImportExportService', {
                    count: newMemories.length
                  });
                  
                  resolve({
                    success: true,
                    data: { count: newMemories.length },
                    message: `${newMemories.length} memorias importadas exitosamente`
                  });
                } else {
                  loggingService.error(
                    'Formato de archivo inválido para importación', 
                    new Error('El archivo no contiene un array de memorias'), 
                    'ImportExportService'
                  );
                  resolve({
                    success: false,
                    error: 'Formato de archivo inválido. Se esperaba un array de memorias.'
                  });
                }
              } catch (error) {
                console.error('Error parseando archivo JSON:', error);
                loggingService.error(
                  'Error parseando archivo JSON', 
                  error instanceof Error ? error : new Error('Error parseando archivo JSON'), 
                  'ImportExportService'
                );
                resolve({
                  success: false,
                  error: 'Error parseando el archivo JSON'
                });
              }
            };
            reader.readAsText(file);
          } else {
            resolve({
              success: false,
              error: 'No se seleccionó ningún archivo'
            });
          }
        };
        input.click();
      });
    }
    
    try {
      const result = await this.electronAPI.importExport.importData();
      if (result.success) {
        loggingService.info('Datos importados exitosamente', 'ImportExportService', {
          count: result.data?.count || 0
        });
      } else {
        loggingService.warn('Fallo en la importación de datos', 'ImportExportService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error importando datos:', error);
      loggingService.error(
        'Error importando datos', 
        error instanceof Error ? error : new Error('Error importando datos'), 
        'ImportExportService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno durante la importación'
      };
    }
  }

  /**
   * Exporta datos a un archivo
   */
  async exportData(): Promise<APIResponse<{ path: string }>> {
    loggingService.info('Iniciando exportación de datos', 'ImportExportService');
    
    if (!this.electronAPI) {
      // Fallback para modo web usando descarga de archivo
      try {
        const memories = JSON.parse(localStorage.getItem('almacen_memories') || '[]');
        
        if (memories.length === 0) {
          loggingService.warn('No hay memorias para exportar (modo web)', 'ImportExportService');
          return {
            success: false,
            error: 'No hay memorias para exportar'
          };
        }
        
        const dataStr = JSON.stringify(memories, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `almacen_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        loggingService.info('Datos exportados exitosamente (modo web)', 'ImportExportService', {
          count: memories.length
        });
        
        return {
          success: true,
          data: { path: 'Descarga iniciada' },
          message: `${memories.length} memorias exportadas exitosamente`
        };
      } catch (error) {
        console.error('Error exportando datos:', error);
        loggingService.error(
          'Error exportando datos (modo web)', 
          error instanceof Error ? error : new Error('Error exportando datos (modo web)'), 
          'ImportExportService'
        );
        return {
          success: false,
          error: 'Error interno durante la exportación'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.importExport.exportData();
      if (result.success) {
        loggingService.info('Datos exportados exitosamente', 'ImportExportService', {
          path: result.data?.path
        });
      } else {
        loggingService.warn('Fallo en la exportación de datos', 'ImportExportService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error exportando datos:', error);
      loggingService.error(
        'Error exportando datos', 
        error instanceof Error ? error : new Error('Error exportando datos'), 
        'ImportExportService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno durante la exportación'
      };
    }
  }

  /**
   * Exporta memorias específicas
   */
  async exportMemories(memoryIds: number[]): Promise<APIResponse<{ path: string }>> {
    loggingService.info('Iniciando exportación de memorias específicas', 'ImportExportService', {
      count: memoryIds.length
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web
      try {
        const allMemories = JSON.parse(localStorage.getItem('almacen_memories') || '[]');
        const selectedMemories = allMemories.filter((memory: MemoryData) => 
          memoryIds.includes(memory.id)
        );
        
        if (selectedMemories.length === 0) {
          loggingService.warn('No se encontraron memorias para exportar (modo web)', 'ImportExportService');
          return {
            success: false,
            error: 'No se encontraron memorias para exportar'
          };
        }
        
        const dataStr = JSON.stringify(selectedMemories, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `almacen_selected_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        loggingService.info('Memorias específicas exportadas exitosamente (modo web)', 'ImportExportService', {
          count: selectedMemories.length
        });
        
        return {
          success: true,
          data: { path: 'Descarga iniciada' },
          message: `${selectedMemories.length} memorias exportadas exitosamente`
        };
      } catch (error) {
        console.error('Error exportando memorias específicas:', error);
        loggingService.error(
          'Error exportando memorias específicas (modo web)', 
          error instanceof Error ? error : new Error('Error exportando memorias específicas (modo web)'), 
          'ImportExportService'
        );
        return {
          success: false,
          error: 'Error interno durante la exportación'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.importExport.exportMemories(memoryIds);
      if (result.success) {
        loggingService.info('Memorias específicas exportadas exitosamente', 'ImportExportService', {
          count: memoryIds.length,
          path: result.data?.path
        });
      } else {
        loggingService.warn('Fallo en la exportación de memorias específicas', 'ImportExportService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error exportando memorias específicas:', error);
      loggingService.error(
        'Error exportando memorias específicas', 
        error instanceof Error ? error : new Error('Error exportando memorias específicas'), 
        'ImportExportService', 
        {
          memoryIds,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno durante la exportación'
      };
    }
  }

  /**
   * Valida el formato de un archivo de importación
   */
  async validateImportFile(filePath: string): Promise<APIResponse<{ isValid: boolean; memoryCount: number }>> {
    loggingService.info('Validando archivo de importación', 'ImportExportService', { filePath });
    
    if (!this.electronAPI) {
      // En modo web, la validación se hace durante el proceso de importación
      return {
        success: true,
        data: { isValid: true, memoryCount: 0 },
        message: 'Validación no disponible en modo web'
      };
    }
    
    try {
      const result = await this.electronAPI.importExport.validateImportFile(filePath);
      if (result.success) {
        loggingService.info('Archivo de importación validado', 'ImportExportService', {
          filePath,
          isValid: result.data?.isValid,
          memoryCount: result.data?.memoryCount
        });
      } else {
        loggingService.warn('Fallo en la validación del archivo', 'ImportExportService', {
          filePath,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error validando archivo de importación:', error);
      loggingService.error(
        'Error validando archivo de importación', 
        error instanceof Error ? error : new Error('Error validando archivo de importación'), 
        'ImportExportService', 
        {
          filePath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno durante la validación'
      };
    }
  }
}