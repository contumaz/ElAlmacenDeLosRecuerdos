import { useCallback, useMemo } from 'react';
import { ElectronService } from '../services/electronAPI';
import loggingService from '../services/LoggingService';
import { useMemoryState } from './useMemoryState';
import { Memory } from '../types';

/**
 * Hook para manejar archivos y directorios de memorias
 * 
 * @returns {Object} Funciones para manejo de archivos y directorios
 * 
 * @example
 * ```tsx
 * const { 
 *   selectSaveDirectory, 
 *   saveFileToDirectory, 
 *   exportMemories, 
 *   importMemories 
 * } = useMemoryFiles();
 * 
 * // Seleccionar directorio de guardado
 * const directory = await selectSaveDirectory();
 * 
 * // Exportar memorias
 * await exportMemories(memories, 'json');
 * ```
 */
export const useMemoryFiles = () => {
  const { updateGlobalState, globalState } = useMemoryState();
  const electronService = useMemo(() => new ElectronService(), []);

  /**
   * Selecciona un directorio para guardar archivos
   * 
   * @returns {Promise<string | null>} Ruta del directorio seleccionado o null si se canceló
   */
  const selectSaveDirectory = useCallback(async (): Promise<string | null> => {
    try {
      console.log('[useMemoryFiles] Seleccionando directorio de guardado');
      
      // TODO: Implementar selección de directorio
       const result = { success: false, error: 'Selección de directorio no implementada' };
       
       if (result && result.success) {
         const selectedPath = '/tmp'; // Ruta temporal por defecto
        console.log('[useMemoryFiles] Directorio seleccionado:', selectedPath);
        
        loggingService.info('Directorio seleccionado', 'useMemoryFiles', {
          path: selectedPath
        });
        
        return selectedPath;
      }
      
      console.log('[useMemoryFiles] Selección de directorio cancelada');
      return null;
    } catch (error) {
      console.error('[useMemoryFiles] Error seleccionando directorio:', error);
      loggingService.error('Error seleccionando directorio', error as Error, 'useMemoryFiles');
      return null;
    }
  }, [electronService.system]);

  /**
   * Guarda un archivo en el directorio especificado
   * 
   * @param {string} filePath - Ruta completa del archivo a guardar
   * @param {string} content - Contenido del archivo
   * @param {string} [encoding='utf8'] - Codificación del archivo
   * @returns {Promise<boolean>} True si se guardó exitosamente
   */
  const saveFileToDirectory = useCallback(async (
    filePath: string, 
    content: string, 
    encoding: string = 'utf8'
  ): Promise<boolean> => {
    try {
      console.log('[useMemoryFiles] Guardando archivo:', filePath);
      
      const result = await electronService.system.saveFile(filePath, content, encoding);
      
      if (result.success) {
        console.log('[useMemoryFiles] Archivo guardado exitosamente');
        loggingService.info('Archivo guardado exitosamente', 'useMemoryFiles', {
          filePath,
          size: content.length
        });
        return true;
      } else {
        console.error('[useMemoryFiles] Error guardando archivo:', result.error);
        loggingService.error('Error guardando archivo', new Error(result.error || 'Error desconocido'), 'useMemoryFiles', {
          filePath
        });
        return false;
      }
    } catch (error) {
      console.error('[useMemoryFiles] Error guardando archivo:', error);
      loggingService.error('Error guardando archivo', error as Error, 'useMemoryFiles', {
        filePath
      });
      return false;
    }
  }, []);

  /**
   * Exporta memorias a un archivo
   * 
   * @param {Memory[]} memories - Memorias a exportar
   * @param {'json' | 'csv' | 'txt'} format - Formato de exportación
   * @param {string} [fileName] - Nombre del archivo (opcional)
   * @returns {Promise<boolean>} True si se exportó exitosamente
   */
  const exportMemories = useCallback(async (
    memories: Memory[], 
    format: 'json' | 'csv' | 'txt' = 'json',
    fileName?: string
  ): Promise<boolean> => {
    try {
      console.log(`[useMemoryFiles] Exportando ${memories.length} memorias en formato ${format}`);
      
      updateGlobalState({ loading: true, error: null });
      
      // Generar nombre de archivo si no se proporciona
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFileName = `memorias_${timestamp}.${format}`;
      const finalFileName = fileName || defaultFileName;
      
      let content: string;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(memories, null, 2);
          break;
          
        case 'csv': {
          // Crear CSV con las columnas principales
          const csvHeaders = ['ID', 'Título', 'Contenido', 'Tipo', 'Tags', 'Fecha Creación', 'Fecha Actualización'];
          const csvRows = memories.map(memory => [
            memory.id,
            `"${(memory.title || '').replace(/"/g, '""')}"`,
            `"${(memory.content || '').replace(/"/g, '""')}"`,
            memory.type || '',
            `"${(memory.tags || []).join(', ')}"`,
            memory.createdAt || '',
            memory.updatedAt || ''
          ]);
          
          content = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
          break;
        }
          
        case 'txt': {
          content = memories.map(memory => {
            const separator = '='.repeat(50);
            return [
              separator,
              `Título: ${memory.title || 'Sin título'}`,
              `Tipo: ${memory.type || 'Sin tipo'}`,
              `Tags: ${(memory.tags || []).join(', ') || 'Sin tags'}`,
              `Fecha: ${memory.createdAt || 'Sin fecha'}`,
              separator,
              memory.content || 'Sin contenido',
              '\n'
            ].join('\n');
          }).join('\n');
          break;
        }
          
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }
      
      // Seleccionar directorio de guardado
      const directory = await selectSaveDirectory();
      
      if (!directory) {
        console.log('[useMemoryFiles] Exportación cancelada por el usuario');
        updateGlobalState({ loading: false });
        return false;
      }
      
      // Construir ruta completa del archivo
      const filePath = `${directory}/${finalFileName}`;
      
      // Guardar archivo
      const success = await saveFileToDirectory(filePath, content);
      
      if (success) {
        console.log('[useMemoryFiles] Memorias exportadas exitosamente');
        loggingService.info('Memorias exportadas exitosamente', 'useMemoryFiles', {
          count: memories.length,
          format,
          filePath,
          size: content.length
        });
      }
      
      updateGlobalState({ loading: false });
      return success;
      
    } catch (error) {
      console.error('[useMemoryFiles] Error exportando memorias:', error);
      loggingService.error('Error exportando memorias', error as Error, 'useMemoryFiles', {
        count: memories.length,
        format
      });
      
      updateGlobalState({ 
        loading: false, 
        error: 'Error exportando memorias' 
      });
      
      return false;
    }
  }, [selectSaveDirectory, saveFileToDirectory, updateGlobalState]);

  /**
   * Importa memorias desde un archivo
   * 
   * @param {string} [filePath] - Ruta del archivo a importar (opcional, se abrirá diálogo si no se proporciona)
   * @returns {Promise<Memory[] | null>} Memorias importadas o null si falló
   */
  const importMemories = async (filePath?: string): Promise<{ success: boolean; error?: string; count?: number; }> => {
    try {
      console.log('[useMemoryFiles] Importando memorias');
      
      updateGlobalState({ loading: true, error: null });
      
      let targetFilePath = filePath;
      
      // Si no se proporciona ruta, abrir diálogo de selección
      if (!targetFilePath) {
        const result = await electronService.system.openFileDialog([
          { name: 'Archivos JSON', extensions: ['json'] },
          { name: 'Archivos de texto', extensions: ['txt'] },
          { name: 'Todos los archivos', extensions: ['*'] }
        ]);
        
        if (!result.success || !result.data) {
          console.log('[useMemoryFiles] Importación cancelada por el usuario');
          updateGlobalState({ loading: false });
          return null;
        }
        
        targetFilePath = result.data.filePath;
      }
      
      console.log('[useMemoryFiles] Leyendo archivo:', targetFilePath);
      
      // Leer contenido del archivo
      const fileContentResponse = await electronService.system.readFile(targetFilePath);
      
      if (!fileContentResponse.success || !fileContentResponse.data) {
        throw new Error('No se pudo leer el contenido del archivo');
      }
      
      const fileContent = fileContentResponse.data.content;
      
      // Determinar formato por extensión
      const extension = targetFilePath.split('.').pop()?.toLowerCase();
      let importedMemories: Memory[] = [];
      
      switch (extension) {
        case 'json': {
          try {
            const parsed = JSON.parse(fileContent);
            importedMemories = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            throw new Error('El archivo JSON no tiene un formato válido');
          }
          break;
        }
          
        case 'csv': {
          // Parsear CSV básico (implementación simple)
          const lines = fileContent.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una de datos');
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const dataLines = lines.slice(1);
          
          importedMemories = dataLines.map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            
            return {
              id: parseInt(values[0]) || Date.now() + index,
              title: values[1] || `Memoria ${index + 1}`,
              content: values[2] || '',
              type: 'texto' as const,
              tags: values[3] ? values[3].split(';') : [],
              createdAt: values[4] || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              privacyLevel: parseInt(values[5]) || 1,
              isEncrypted: false,
              encryptionLevel: 'none' as const,
              requiresPassword: false,
              metadata: {
                source: 'csv_import',
                importDate: new Date().toISOString()
              }
            } as Memory;
          });
          break;
        }
          
        case 'txt': {
          // Parsear archivo de texto simple (crear una memoria por archivo)
          const fileName = targetFilePath.split('/').pop() || 'archivo_importado.txt';
          importedMemories = [{
            id: Date.now(),
            title: fileName.replace(/\.[^/.]+$/, ''),
            content: fileContent,
            type: 'texto' as const,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            privacyLevel: 1,
            isEncrypted: false,
            encryptionLevel: 'none' as const,
            requiresPassword: false,
            metadata: {
              source: 'file_import',
              originalFileName: fileName,
              importDate: new Date().toISOString()
            }
          } as Memory];
          break;
        }
          
        default:
          throw new Error(`Formato de archivo no soportado: ${extension}`);
      }
      
      // Validar memorias importadas
      const validMemories = importedMemories.filter(memory => {
        return memory && typeof memory === 'object' && 
               (memory.title || memory.content);
      });
      
      if (validMemories.length === 0) {
        throw new Error('No se encontraron memorias válidas en el archivo');
      }
      
      console.log(`[useMemoryFiles] ${validMemories.length} memorias importadas exitosamente`);
      
      loggingService.info('Memorias importadas exitosamente', 'useMemoryFiles', {
        filePath: targetFilePath,
        count: validMemories.length,
        format: extension
      });
      
      updateGlobalState({ loading: false });
      return { success: true, count: validMemories.length };
      
    } catch (error) {
      console.error('[useMemoryFiles] Error importando memorias:', error);
      loggingService.error('Error importando memorias', error as Error, 'useMemoryFiles', {
        filePath
      });
      
      updateGlobalState({ 
        loading: false, 
        error: `Error importando memorias: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Error importando memorias' };
    }
  };

  // Wrapper para exportMemories que coincida con la interfaz del contexto
  const exportMemoriesWrapper = async (filePath: string): Promise<{ success: boolean; error?: string; }> => {
    try {
      // TODO: Implementar exportación a ruta específica
      // Por ahora, usar la función existente con memorias vacías
      const success = await exportMemories([], 'json', 'memorias_exportadas.json');
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error exportando memorias' };
    }
  };

  return {
     selectSaveDirectory,
     saveFileToDirectory,
     exportMemories: exportMemoriesWrapper,
     importMemories
   };
};