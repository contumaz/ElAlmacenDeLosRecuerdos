/**
 * Servicio de Utilidades del Sistema para Electron API
 * Maneja funciones del sistema como información de plataforma, guardado de archivos, etc.
 */

import { APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
  isElectron: boolean;
}

export interface FileInfo {
  path: string;
  size: number;
  created: string;
}

export class SystemUtilsService {
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
   * Obtiene información de la plataforma
   */
  async getPlatformInfo(): Promise<APIResponse<PlatformInfo>> {
    loggingService.info('Obteniendo información de plataforma', 'SystemUtilsService');
    
    if (!this.electronAPI) {
      // Fallback para modo web usando navigator
      try {
        const platformInfo: PlatformInfo = {
          platform: navigator.platform || 'Web',
          arch: (navigator as any).userAgentData?.platform || 'unknown',
          version: navigator.userAgent,
          isElectron: false
        };
        
        loggingService.info('Información de plataforma obtenida (modo web)', 'SystemUtilsService', {
          platform: platformInfo.platform,
          isElectron: platformInfo.isElectron
        });
        
        return {
          success: true,
          data: platformInfo,
          message: 'Información de plataforma obtenida (modo web)'
        };
      } catch (error) {
        console.error('Error obteniendo información de plataforma:', error);
        loggingService.error(
          'Error obteniendo información de plataforma (modo web)', 
          error instanceof Error ? error : new Error('Error obteniendo información de plataforma (modo web)'), 
          'SystemUtilsService'
        );
        return {
          success: false,
          error: 'Error obteniendo información de plataforma'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.system.getPlatformInfo();
      if (result.success) {
        loggingService.info('Información de plataforma obtenida', 'SystemUtilsService', {
          platform: result.data?.platform,
          isElectron: result.data?.isElectron
        });
      } else {
        loggingService.warn('Fallo obteniendo información de plataforma', 'SystemUtilsService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error obteniendo información de plataforma:', error);
      loggingService.error(
        'Error obteniendo información de plataforma', 
        error instanceof Error ? error : new Error('Error obteniendo información de plataforma'), 
        'SystemUtilsService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno obteniendo información de plataforma'
      };
    }
  }

  /**
   * Guarda un archivo en el sistema
   */
  async saveFile(fileName: string, content: string, mimeType?: string): Promise<APIResponse<FileInfo>> {
    loggingService.info('Guardando archivo', 'SystemUtilsService', {
      fileName,
      contentLength: content.length,
      mimeType
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web usando descarga de archivo
      try {
        const blob = new Blob([content], { type: mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const fileInfo: FileInfo = {
          path: 'Descarga iniciada',
          size: content.length,
          created: new Date().toISOString()
        };
        
        loggingService.info('Archivo guardado (modo web)', 'SystemUtilsService', {
          fileName,
          size: fileInfo.size
        });
        
        return {
          success: true,
          data: fileInfo,
          message: 'Descarga de archivo iniciada'
        };
      } catch (error) {
        console.error('Error guardando archivo:', error);
        loggingService.error(
          'Error guardando archivo (modo web)', 
          error instanceof Error ? error : new Error('Error guardando archivo (modo web)'), 
          'SystemUtilsService', 
          { fileName }
        );
        return {
          success: false,
          error: 'Error guardando archivo'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.system.saveFile(fileName, content, mimeType);
      if (result.success) {
        loggingService.info('Archivo guardado exitosamente', 'SystemUtilsService', {
          fileName,
          path: result.data?.path,
          size: result.data?.size
        });
      } else {
        loggingService.warn('Fallo guardando archivo', 'SystemUtilsService', {
          fileName,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error guardando archivo:', error);
      loggingService.error(
        'Error guardando archivo', 
        error instanceof Error ? error : new Error('Error guardando archivo'), 
        'SystemUtilsService', 
        {
          fileName,
          contentLength: content.length,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno guardando archivo'
      };
    }
  }

  /**
   * Lee un archivo del sistema
   */
  async readFile(filePath: string): Promise<APIResponse<{ content: string; info: FileInfo }>> {
    loggingService.info('Leyendo archivo', 'SystemUtilsService', { filePath });
    
    if (!this.electronAPI) {
      // En modo web, no podemos leer archivos del sistema directamente
      // Solo podemos usar input file para que el usuario seleccione
      loggingService.warn('Lectura de archivos del sistema no disponible en modo web', 'SystemUtilsService');
      return {
        success: false,
        error: 'La lectura de archivos del sistema no está disponible en modo web. Use un input de archivo para que el usuario seleccione.'
      };
    }
    
    try {
      const result = await this.electronAPI.system.readFile(filePath);
      if (result.success) {
        loggingService.info('Archivo leído exitosamente', 'SystemUtilsService', {
          filePath,
          contentLength: result.data?.content?.length || 0
        });
      } else {
        loggingService.warn('Fallo leyendo archivo', 'SystemUtilsService', {
          filePath,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      loggingService.error(
        'Error leyendo archivo', 
        error instanceof Error ? error : new Error('Error leyendo archivo'), 
        'SystemUtilsService', 
        {
          filePath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno leyendo archivo'
      };
    }
  }

  /**
   * Abre un diálogo para seleccionar archivo
   */
  async openFileDialog(filters?: { name: string; extensions: string[] }[]): Promise<APIResponse<{ filePath: string; content: string }>> {
    loggingService.info('Abriendo diálogo de archivo', 'SystemUtilsService', { filters });
    
    if (!this.electronAPI) {
      // Fallback para modo web usando input file
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        
        if (filters && filters.length > 0) {
          const extensions = filters.flatMap(f => f.extensions.map(ext => `.${ext}`));
          input.accept = extensions.join(',');
        }
        
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              loggingService.info('Archivo seleccionado (modo web)', 'SystemUtilsService', {
                fileName: file.name,
                size: file.size
              });
              resolve({
                success: true,
                data: {
                  filePath: file.name,
                  content: content
                },
                message: 'Archivo seleccionado exitosamente'
              });
            };
            reader.onerror = () => {
              loggingService.error(
                'Error leyendo archivo seleccionado', 
                new Error('Error leyendo archivo seleccionado'), 
                'SystemUtilsService'
              );
              resolve({
                success: false,
                error: 'Error leyendo el archivo seleccionado'
              });
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
      const result = await this.electronAPI.system.openFileDialog(filters);
      if (result.success) {
        loggingService.info('Archivo seleccionado exitosamente', 'SystemUtilsService', {
          filePath: result.data?.filePath
        });
      } else {
        loggingService.warn('Fallo en selección de archivo', 'SystemUtilsService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error abriendo diálogo de archivo:', error);
      loggingService.error(
        'Error abriendo diálogo de archivo', 
        error instanceof Error ? error : new Error('Error abriendo diálogo de archivo'), 
        'SystemUtilsService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno abriendo diálogo de archivo'
      };
    }
  }

  /**
   * Cierra la aplicación (solo en Electron)
   */
  async quitApp(): Promise<APIResponse<object>> {
    loggingService.info('Cerrando aplicación', 'SystemUtilsService');
    
    if (!this.electronAPI) {
      // En modo web, no podemos cerrar la ventana del navegador por seguridad
      loggingService.warn('Cierre de aplicación no disponible en modo web', 'SystemUtilsService');
      return {
        success: false,
        error: 'El cierre de aplicación no está disponible en modo web'
      };
    }
    
    try {
      const result = await this.electronAPI.system.quitApp();
      if (result.success) {
        loggingService.info('Aplicación cerrada exitosamente', 'SystemUtilsService');
      } else {
        loggingService.warn('Fallo cerrando aplicación', 'SystemUtilsService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error cerrando aplicación:', error);
      loggingService.error(
        'Error cerrando aplicación', 
        error instanceof Error ? error : new Error('Error cerrando aplicación'), 
        'SystemUtilsService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno cerrando aplicación'
      };
    }
  }

  /**
   * Obtiene información del directorio de trabajo
   */
  async getWorkingDirectory(): Promise<APIResponse<{ path: string; writable: boolean }>> {
    loggingService.info('Obteniendo directorio de trabajo', 'SystemUtilsService');
    
    if (!this.electronAPI) {
      // En modo web, no tenemos acceso al sistema de archivos
      return {
        success: true,
        data: {
          path: 'Web Browser',
          writable: false
        },
        message: 'Directorio de trabajo (modo web)'
      };
    }
    
    try {
      const result = await this.electronAPI.system.getWorkingDirectory();
      if (result.success) {
        loggingService.info('Directorio de trabajo obtenido', 'SystemUtilsService', {
          path: result.data?.path,
          writable: result.data?.writable
        });
      } else {
        loggingService.warn('Fallo obteniendo directorio de trabajo', 'SystemUtilsService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error obteniendo directorio de trabajo:', error);
      loggingService.error(
        'Error obteniendo directorio de trabajo', 
        error instanceof Error ? error : new Error('Error obteniendo directorio de trabajo'), 
        'SystemUtilsService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno obteniendo directorio de trabajo'
      };
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(filePath: string): Promise<APIResponse<{ exists: boolean }>> {
    loggingService.info('Verificando existencia de archivo', 'SystemUtilsService', { filePath });
    
    if (!this.electronAPI) {
      // En modo web, no podemos verificar archivos del sistema
      return {
        success: false,
        error: 'La verificación de archivos del sistema no está disponible en modo web'
      };
    }
    
    try {
      const result = await this.electronAPI.system.fileExists(filePath);
      if (result.success) {
        loggingService.info('Verificación de archivo completada', 'SystemUtilsService', {
          filePath,
          exists: result.data?.exists
        });
      } else {
        loggingService.warn('Fallo verificando archivo', 'SystemUtilsService', {
          filePath,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error verificando archivo:', error);
      loggingService.error(
        'Error verificando archivo', 
        error instanceof Error ? error : new Error('Error verificando archivo'), 
        'SystemUtilsService', 
        {
          filePath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno verificando archivo'
      };
    }
  }
}