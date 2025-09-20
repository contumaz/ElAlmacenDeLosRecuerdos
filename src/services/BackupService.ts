// Tipo Memory definido localmente para evitar dependencias
interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
  images?: string[];
  location?: string;
  participants?: string[];
}
import { toast } from 'sonner';
import loggingService from './LoggingService';

export interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  memories: Memory[];
  checksum: string;
  isIncremental: boolean;
  previousBackupId?: string;
  size: number;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number; // en horas
  maxBackups: number;
  compressionEnabled: boolean;
}

class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private backupTimer: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'almacen_backups';
  private readonly CONFIG_KEY = 'almacen_backup_config';
  private readonly VERSION = '1.0.0';

  private constructor() {
    this.config = this.loadConfig();
    this.initializeAutoBackup();
  }

  /**
   * Obtiene la instancia singleton del servicio de backup
   * @returns BackupService - Instancia única del servicio
   * @example
   * const backupService = BackupService.getInstance();
   */
  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private loadConfig(): BackupConfig {
    try {
      const savedConfig = localStorage.getItem(this.CONFIG_KEY);
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Error loading backup config:', error);
    }
    
    // Configuración por defecto
    return {
      autoBackupEnabled: true,
      backupInterval: 24, // 24 horas
      maxBackups: 10,
      compressionEnabled: true
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving backup config:', error);
    }
  }

  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private compressData(data: string): string {
    if (!this.config.compressionEnabled) return data;
    
    // Implementación básica de compresión usando LZ-string simulado
    try {
      return btoa(data);
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return data;
    }
  }

  private decompressData(data: string): string {
    if (!this.config.compressionEnabled) return data;
    
    try {
      return atob(data);
    } catch (error) {
      console.warn('Decompression failed, assuming uncompressed data:', error);
      return data;
    }
  }

  private getStoredBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading backups:', error);
      return [];
    }
  }

  private saveBackups(backups: BackupData[]): void {
    try {
      // Mantener solo el número máximo de backups
      const limitedBackups = backups
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.config.maxBackups);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedBackups));
    } catch (error) {
      console.error('Error saving backups:', error);
      throw new Error('Failed to save backup');
    }
  }

  private getMemoriesFromStorage(): Memory[] {
    try {
      const stored = localStorage.getItem('almacen_memories');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading memories for backup:', error);
      return [];
    }
  }

  private calculateBackupSize(memories: Memory[]): number {
    const dataString = JSON.stringify(memories);
    return new Blob([dataString]).size;
  }

  private hasMemoriesChanged(currentMemories: Memory[], lastBackup?: BackupData): boolean {
    if (!lastBackup) return true;
    
    const currentChecksum = this.generateChecksum(JSON.stringify(currentMemories));
    return currentChecksum !== lastBackup.checksum;
  }

  /**
   * Crea un nuevo backup de las memorias
   * @param isManual - Indica si el backup es manual o automático
   * @returns Promise<BackupData | null> - Datos del backup creado o null si no hay cambios
   * @example
   * const backup = await backupService.createBackup(true);
   * if (backup) {
   *   console.log(`Backup creado: ${backup.id}`);
   * }
   */
  async createBackup(isManual: boolean = false): Promise<BackupData | null> {
    loggingService.info('backup_create_start', 'BackupService.createBackup', {
      isManual
    });
    
    try {
      const memories = this.getMemoriesFromStorage();
      const backups = this.getStoredBackups();
      const lastBackup = backups[0]; // El más reciente

      // Verificar si hay cambios para backup incremental
      if (!isManual && !this.hasMemoriesChanged(memories, lastBackup)) {
        loggingService.info('backup_skipped_no_changes', 'BackupService.createBackup');
        console.log('No changes detected, skipping backup');
        return null;
      }

      const memoriesString = JSON.stringify(memories);
      const compressedData = this.compressData(memoriesString);
      const checksum = this.generateChecksum(memoriesString);
      
      const backup: BackupData = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: this.VERSION,
        memories: memories,
        checksum: checksum,
        isIncremental: !!lastBackup,
        previousBackupId: lastBackup?.id,
        size: this.calculateBackupSize(memories)
      };

      const updatedBackups = [backup, ...backups];
      this.saveBackups(updatedBackups);

      if (isManual) {
        toast.success(`Backup creado exitosamente (${(backup.size / 1024).toFixed(1)} KB)`);
      }

      loggingService.info('backup_created_success', 'BackupService.createBackup', {
        backupId: backup.id,
        size: backup.size,
        memoriesCount: memories.length,
        isIncremental: backup.isIncremental
      });
      
      console.log('Backup created:', backup.id);
      return backup;
    } catch (error) {
      loggingService.error('backup_create_failed', error instanceof Error ? error : new Error('backup_create_failed'), 'BackupService.createBackup', {
        isManual
      });
      
      console.error('Error creating backup:', error);
      if (isManual) {
        toast.error('Error al crear el backup');
      }
      throw error;
    }
  }

  /**
   * Restaura un backup específico
   * @param backupId - ID único del backup a restaurar
   * @returns Promise<boolean> - true si se restauró exitosamente, false en caso contrario
   * @example
   * const success = await backupService.restoreBackup('backup_123');
   * if (success) {
   *   console.log('Backup restaurado exitosamente');
   * }
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    loggingService.info('backup_restore_start', 'BackupService.restoreBackup', {
      backupId
    });
    
    try {
      const backups = this.getStoredBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Validar integridad del backup
      const memoriesString = JSON.stringify(backup.memories);
      const calculatedChecksum = this.generateChecksum(memoriesString);
      
      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Backup integrity check failed');
      }

      // Restaurar memorias
      localStorage.setItem('almacen_memories', memoriesString);
      
      loggingService.info('backup_restored_success', 'BackupService.restoreBackup', {
        backupId,
        memoriesCount: backup.memories.length
      });
      
      toast.success('Backup restaurado exitosamente');
      
      // Recargar la página para reflejar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      loggingService.error('backup_restore_failed', error instanceof Error ? error : new Error('backup_restore_failed'), 'BackupService.restoreBackup', {
        backupId
      });
      
      console.error('Error restoring backup:', error);
      toast.error('Error al restaurar el backup: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Obtiene el historial de backups ordenado por fecha
   * @returns BackupData[] - Array de backups ordenados del más reciente al más antiguo
   * @example
   * const history = backupService.getBackupHistory();
   * console.log(`Total de backups: ${history.length}`);
   */
  getBackupHistory(): BackupData[] {
    return this.getStoredBackups().sort((a, b) => b.timestamp - a.timestamp);
  }

  deleteBackup(backupId: string): boolean {
    loggingService.info('backup_delete_start', 'BackupService.deleteBackup', {
      backupId
    });
    
    try {
      const backups = this.getStoredBackups();
      const filteredBackups = backups.filter(b => b.id !== backupId);
      
      if (filteredBackups.length === backups.length) {
        throw new Error('Backup not found');
      }
      
      this.saveBackups(filteredBackups);
      
      loggingService.info('backup_deleted_success', 'BackupService.deleteBackup', {
        backupId
      });
      
      toast.success('Backup eliminado');
      return true;
    } catch (error) {
      loggingService.error('backup_delete_failed', error instanceof Error ? error : new Error('backup_delete_failed'), 'BackupService.deleteBackup', {
        backupId
      });
      
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar el backup');
      return false;
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // Reinicializar auto backup si cambió la configuración
    this.initializeAutoBackup();
    
    toast.success('Configuración de backup actualizada');
  }

  private initializeAutoBackup(): void {
    // Limpiar timer existente
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    if (!this.config.autoBackupEnabled) {
      return;
    }

    // Configurar nuevo timer
    const intervalMs = this.config.backupInterval * 60 * 60 * 1000; // Convertir horas a ms
    
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup(false);
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, intervalMs);

    console.log(`Auto backup initialized: every ${this.config.backupInterval} hours`);
  }

  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    lastBackup?: Date;
    nextBackup?: Date;
  } {
    const backups = this.getStoredBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const lastBackup = backups[0];
    
    let nextBackup: Date | undefined;
    if (this.config.autoBackupEnabled && lastBackup) {
      const nextBackupTime = lastBackup.timestamp + (this.config.backupInterval * 60 * 60 * 1000);
      nextBackup = new Date(nextBackupTime);
    }

    return {
      totalBackups: backups.length,
      totalSize,
      lastBackup: lastBackup ? new Date(lastBackup.timestamp) : undefined,
      nextBackup
    };
  }

  // Método para limpiar recursos al destruir el servicio
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}

export default BackupService.getInstance();