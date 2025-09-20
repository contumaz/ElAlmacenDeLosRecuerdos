/**
 * Servicio de Auditoría y Respaldo para Electron API
 * Maneja logs de auditoría y operaciones de respaldo
 */

import { APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  path: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed' | 'in_progress';
}

export interface BackupOptions {
  includeMedia?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  destination?: string;
}

export class AuditBackupService {
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
   * Registra una entrada en el log de auditoría
   */
  async logAuditEntry(action: string, details: any, userId?: string): Promise<APIResponse<AuditLogEntry>> {
    loggingService.info('Registrando entrada de auditoría', 'AuditBackupService', {
      action,
      userId,
      hasDetails: !!details
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web usando localStorage
      try {
        const auditEntry: AuditLogEntry = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          action,
          userId,
          details,
          ipAddress: 'N/A (Web)',
          userAgent: navigator.userAgent
        };
        
        // Guardar en localStorage
        const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        existingLogs.push(auditEntry);
        
        // Mantener solo los últimos 1000 logs para evitar llenar el localStorage
        if (existingLogs.length > 1000) {
          existingLogs.splice(0, existingLogs.length - 1000);
        }
        
        localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
        
        loggingService.info('Entrada de auditoría registrada (modo web)', 'AuditBackupService', {
          id: auditEntry.id,
          action
        });
        
        return {
          success: true,
          data: auditEntry,
          message: 'Entrada de auditoría registrada (modo web)'
        };
      } catch (error) {
        console.error('Error registrando entrada de auditoría:', error);
        loggingService.error(
          'Error registrando entrada de auditoría (modo web)', 
          error instanceof Error ? error : new Error('Error registrando entrada de auditoría (modo web)'), 
          'AuditBackupService', 
          { action }
        );
        return {
          success: false,
          error: 'Error registrando entrada de auditoría'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.audit.logEntry(action, details, userId);
      if (result.success) {
        loggingService.info('Entrada de auditoría registrada exitosamente', 'AuditBackupService', {
          id: result.data?.id,
          action
        });
      } else {
        loggingService.warn('Fallo registrando entrada de auditoría', 'AuditBackupService', {
          action,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error registrando entrada de auditoría:', error);
      loggingService.error(
        'Error registrando entrada de auditoría', 
        error instanceof Error ? error : new Error('Error registrando entrada de auditoría'), 
        'AuditBackupService', 
        {
          action,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno registrando entrada de auditoría'
      };
    }
  }

  /**
   * Obtiene entradas del log de auditoría
   */
  async getAuditLogs(limit?: number, offset?: number, filter?: { action?: string; userId?: string; dateFrom?: string; dateTo?: string }): Promise<APIResponse<{ logs: AuditLogEntry[]; total: number }>> {
    loggingService.info('Obteniendo logs de auditoría', 'AuditBackupService', {
      limit,
      offset,
      filter
    });
    
    if (!this.electronAPI) {
      // Fallback para modo web usando localStorage
      try {
        const allLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        let filteredLogs = allLogs;
        
        // Aplicar filtros
        if (filter) {
          filteredLogs = allLogs.filter(log => {
            if (filter.action && log.action !== filter.action) return false;
            if (filter.userId && log.userId !== filter.userId) return false;
            if (filter.dateFrom && log.timestamp < filter.dateFrom) return false;
            if (filter.dateTo && log.timestamp > filter.dateTo) return false;
            return true;
          });
        }
        
        // Ordenar por timestamp descendente
        filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Aplicar paginación
        const startIndex = offset || 0;
        const endIndex = limit ? startIndex + limit : filteredLogs.length;
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
        
        loggingService.info('Logs de auditoría obtenidos (modo web)', 'AuditBackupService', {
          total: filteredLogs.length,
          returned: paginatedLogs.length
        });
        
        return {
          success: true,
          data: {
            logs: paginatedLogs,
            total: filteredLogs.length
          },
          message: 'Logs de auditoría obtenidos (modo web)'
        };
      } catch (error) {
        console.error('Error obteniendo logs de auditoría:', error);
        loggingService.error(
          'Error obteniendo logs de auditoría (modo web)', 
          error instanceof Error ? error : new Error('Error obteniendo logs de auditoría (modo web)'), 
          'AuditBackupService'
        );
        return {
          success: false,
          error: 'Error obteniendo logs de auditoría'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.audit.getLogs(limit, offset, filter);
      if (result.success) {
        loggingService.info('Logs de auditoría obtenidos exitosamente', 'AuditBackupService', {
          total: result.data?.total,
          returned: result.data?.logs?.length
        });
      } else {
        loggingService.warn('Fallo obteniendo logs de auditoría', 'AuditBackupService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      loggingService.error(
        'Error obteniendo logs de auditoría', 
        error instanceof Error ? error : new Error('Error obteniendo logs de auditoría'), 
        'AuditBackupService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno obteniendo logs de auditoría'
      };
    }
  }

  /**
   * Crea un respaldo de los datos
   */
  async createBackup(options?: BackupOptions): Promise<APIResponse<BackupInfo>> {
    loggingService.info('Creando respaldo', 'AuditBackupService', { options });
    
    if (!this.electronAPI) {
      // Fallback para modo web - exportar datos como JSON
      try {
        const backupData = {
          timestamp: new Date().toISOString(),
          auditLogs: JSON.parse(localStorage.getItem('auditLogs') || '[]'),
          memories: JSON.parse(localStorage.getItem('memories') || '[]'),
          userConfig: JSON.parse(localStorage.getItem('userConfig') || '{}'),
          version: '1.0.0'
        };
        
        const backupJson = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const backupInfo: BackupInfo = {
          id: `backup_${Date.now()}`,
          timestamp: new Date().toISOString(),
          size: backupJson.length,
          path: 'Descarga iniciada',
          type: 'full',
          status: 'completed'
        };
        
        loggingService.info('Respaldo creado (modo web)', 'AuditBackupService', {
          id: backupInfo.id,
          size: backupInfo.size
        });
        
        return {
          success: true,
          data: backupInfo,
          message: 'Respaldo creado y descarga iniciada (modo web)'
        };
      } catch (error) {
        console.error('Error creando respaldo:', error);
        loggingService.error(
          'Error creando respaldo (modo web)', 
          error instanceof Error ? error : new Error('Error creando respaldo (modo web)'), 
          'AuditBackupService'
        );
        return {
          success: false,
          error: 'Error creando respaldo'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.backup.create(options);
      if (result.success) {
        loggingService.info('Respaldo creado exitosamente', 'AuditBackupService', {
          id: result.data?.id,
          size: result.data?.size,
          path: result.data?.path
        });
      } else {
        loggingService.warn('Fallo creando respaldo', 'AuditBackupService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error creando respaldo:', error);
      loggingService.error(
        'Error creando respaldo', 
        error instanceof Error ? error : new Error('Error creando respaldo'), 
        'AuditBackupService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno creando respaldo'
      };
    }
  }

  /**
   * Restaura datos desde un respaldo
   */
  async restoreBackup(backupPath: string): Promise<APIResponse<{ restored: number; skipped: number }>> {
    loggingService.info('Restaurando respaldo', 'AuditBackupService', { backupPath });
    
    if (!this.electronAPI) {
      // En modo web, necesitamos que el usuario seleccione el archivo
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
                const backupData = JSON.parse(e.target?.result as string);
                
                let restored = 0;
                const skipped = 0;
                
                // Restaurar audit logs
                if (backupData.auditLogs) {
                  localStorage.setItem('auditLogs', JSON.stringify(backupData.auditLogs));
                  restored += backupData.auditLogs.length;
                }
                
                // Restaurar memories
                if (backupData.memories) {
                  localStorage.setItem('memories', JSON.stringify(backupData.memories));
                  restored += backupData.memories.length;
                }
                
                // Restaurar user config
                if (backupData.userConfig) {
                  localStorage.setItem('userConfig', JSON.stringify(backupData.userConfig));
                  restored += 1;
                }
                
                loggingService.info('Respaldo restaurado (modo web)', 'AuditBackupService', {
                  restored,
                  skipped
                });
                
                resolve({
                  success: true,
                  data: { restored, skipped },
                  message: 'Respaldo restaurado exitosamente (modo web)'
                });
              } catch (error) {
                loggingService.error(
                  'Error parseando archivo de respaldo', 
                  error instanceof Error ? error : new Error('Error parseando archivo de respaldo'), 
                  'AuditBackupService'
                );
                resolve({
                  success: false,
                  error: 'Error parseando archivo de respaldo. Verifique que sea un archivo de respaldo válido.'
                });
              }
            };
            reader.onerror = () => {
              loggingService.error(
                'Error leyendo archivo de respaldo', 
                new Error('Error leyendo archivo de respaldo'), 
                'AuditBackupService'
              );
              resolve({
                success: false,
                error: 'Error leyendo el archivo de respaldo'
              });
            };
            reader.readAsText(file);
          } else {
            resolve({
              success: false,
              error: 'No se seleccionó ningún archivo de respaldo'
            });
          }
        };
        
        input.click();
      });
    }
    
    try {
      const result = await this.electronAPI.backup.restore(backupPath);
      if (result.success) {
        loggingService.info('Respaldo restaurado exitosamente', 'AuditBackupService', {
          restored: result.data?.restored,
          skipped: result.data?.skipped
        });
      } else {
        loggingService.warn('Fallo restaurando respaldo', 'AuditBackupService', {
          backupPath,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error restaurando respaldo:', error);
      loggingService.error(
        'Error restaurando respaldo', 
        error instanceof Error ? error : new Error('Error restaurando respaldo'), 
        'AuditBackupService', 
        {
          backupPath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno restaurando respaldo'
      };
    }
  }

  /**
   * Lista los respaldos disponibles
   */
  async listBackups(): Promise<APIResponse<BackupInfo[]>> {
    loggingService.info('Listando respaldos disponibles', 'AuditBackupService');
    
    if (!this.electronAPI) {
      // En modo web, no podemos listar archivos del sistema
      loggingService.warn('Listado de respaldos no disponible en modo web', 'AuditBackupService');
      return {
        success: true,
        data: [],
        message: 'Listado de respaldos no disponible en modo web. Los respaldos se descargan como archivos JSON.'
      };
    }
    
    try {
      const result = await this.electronAPI.backup.list();
      if (result.success) {
        loggingService.info('Respaldos listados exitosamente', 'AuditBackupService', {
          count: result.data?.length || 0
        });
      } else {
        loggingService.warn('Fallo listando respaldos', 'AuditBackupService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error listando respaldos:', error);
      loggingService.error(
        'Error listando respaldos', 
        error instanceof Error ? error : new Error('Error listando respaldos'), 
        'AuditBackupService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno listando respaldos'
      };
    }
  }

  /**
   * Elimina un respaldo
   */
  async deleteBackup(backupId: string): Promise<APIResponse<object>> {
    loggingService.info('Eliminando respaldo', 'AuditBackupService', { backupId });
    
    if (!this.electronAPI) {
      // En modo web, no podemos eliminar archivos del sistema
      loggingService.warn('Eliminación de respaldos no disponible en modo web', 'AuditBackupService');
      return {
        success: false,
        error: 'La eliminación de respaldos no está disponible en modo web'
      };
    }
    
    try {
      const result = await this.electronAPI.backup.delete(backupId);
      if (result.success) {
        loggingService.info('Respaldo eliminado exitosamente', 'AuditBackupService', {
          backupId
        });
      } else {
        loggingService.warn('Fallo eliminando respaldo', 'AuditBackupService', {
          backupId,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error eliminando respaldo:', error);
      loggingService.error(
        'Error eliminando respaldo', 
        error instanceof Error ? error : new Error('Error eliminando respaldo'), 
        'AuditBackupService', 
        {
          backupId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno eliminando respaldo'
      };
    }
  }

  /**
   * Programa respaldos automáticos
   */
  async scheduleBackup(schedule: { frequency: 'daily' | 'weekly' | 'monthly'; time: string; options?: BackupOptions }): Promise<APIResponse<{ scheduleId: string }>> {
    loggingService.info('Programando respaldo automático', 'AuditBackupService', { schedule });
    
    if (!this.electronAPI) {
      // En modo web, no podemos programar tareas del sistema
      loggingService.warn('Programación de respaldos no disponible en modo web', 'AuditBackupService');
      return {
        success: false,
        error: 'La programación de respaldos automáticos no está disponible en modo web'
      };
    }
    
    try {
      const result = await this.electronAPI.backup.schedule(schedule);
      if (result.success) {
        loggingService.info('Respaldo programado exitosamente', 'AuditBackupService', {
          scheduleId: result.data?.scheduleId,
          frequency: schedule.frequency
        });
      } else {
        loggingService.warn('Fallo programando respaldo', 'AuditBackupService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error programando respaldo:', error);
      loggingService.error(
        'Error programando respaldo', 
        error instanceof Error ? error : new Error('Error programando respaldo'), 
        'AuditBackupService', 
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno programando respaldo'
      };
    }
  }
}