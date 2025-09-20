import { useState, useEffect, useCallback } from 'react';
import BackupService, { BackupData, BackupConfig } from '@/services/BackupService';
import { toast } from 'sonner';

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Date;
  nextBackup?: Date;
}

export interface UseBackupReturn {
  // Estado
  isBackingUp: boolean;
  isRestoring: boolean;
  backupHistory: BackupData[];
  config: BackupConfig;
  stats: BackupStats;
  
  // Funciones de backup
  createBackup: () => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  
  // Configuración
  updateConfig: (newConfig: Partial<BackupConfig>) => void;
  
  // Utilidades
  refreshBackupHistory: () => void;
  formatBackupSize: (size: number) => string;
  formatBackupDate: (timestamp: number) => string;
}

const useBackup = (): UseBackupReturn => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupData[]>([]);
  const [config, setConfig] = useState<BackupConfig>(BackupService.getConfig());
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0
  });

  // Cargar historial de backups
  const refreshBackupHistory = useCallback(() => {
    try {
      const history = BackupService.getBackupHistory();
      const backupStats = BackupService.getBackupStats();
      
      setBackupHistory(history);
      setStats(backupStats);
    } catch (error) {
      console.error('Error refreshing backup history:', error);
      toast.error('Error al cargar el historial de backups');
    }
  }, []);

  // Crear backup manual
  const createBackup = useCallback(async () => {
    if (isBackingUp) {
      toast.warning('Ya hay un backup en progreso');
      return;
    }

    setIsBackingUp(true);
    try {
      const backup = await BackupService.createBackup(true);
      if (backup) {
        refreshBackupHistory();
        toast.success('Backup creado exitosamente');
      } else {
        toast.info('No hay cambios para respaldar');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear el backup');
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp, refreshBackupHistory]);

  // Restaurar backup
  const restoreBackup = useCallback(async (backupId: string) => {
    if (isRestoring) {
      toast.warning('Ya hay una restauración en progreso');
      return;
    }

    // Confirmar con el usuario
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres restaurar este backup? Esto sobrescribirá todos los datos actuales.'
    );
    
    if (!confirmed) {
      return;
    }

    setIsRestoring(true);
    try {
      const success = await BackupService.restoreBackup(backupId);
      if (success) {
        // La página se recargará automáticamente después de la restauración
        toast.success('Restauración iniciada, recargando...');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Error al restaurar el backup');
      setIsRestoring(false);
    }
  }, [isRestoring]);

  // Eliminar backup
  const deleteBackup = useCallback(async (backupId: string) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este backup? Esta acción no se puede deshacer.'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const success = BackupService.deleteBackup(backupId);
      if (success) {
        refreshBackupHistory();
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar el backup');
    }
  }, [refreshBackupHistory]);

  // Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<BackupConfig>) => {
    try {
      BackupService.updateConfig(newConfig);
      const updatedConfig = BackupService.getConfig();
      setConfig(updatedConfig);
      
      // Actualizar estadísticas si cambió la configuración
      refreshBackupHistory();
    } catch (error) {
      console.error('Error updating backup config:', error);
      toast.error('Error al actualizar la configuración');
    }
  }, [refreshBackupHistory]);

  // Formatear tamaño de backup
  const formatBackupSize = useCallback((size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }, []);

  // Formatear fecha de backup
  const formatBackupDate = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    refreshBackupHistory();
  }, [refreshBackupHistory]);

  // Efecto para actualizar estadísticas periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = BackupService.getBackupStats();
      setStats(newStats);
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Efecto para escuchar cambios en localStorage (backups automáticos)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'almacen_backups' || e.key === 'almacen_backup_config') {
        refreshBackupHistory();
        setConfig(BackupService.getConfig());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshBackupHistory]);

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      // Limpiar cualquier operación pendiente
      setIsBackingUp(false);
      setIsRestoring(false);
    };
  }, []);

  return {
    // Estado
    isBackingUp,
    isRestoring,
    backupHistory,
    config,
    stats,
    
    // Funciones de backup
    createBackup,
    restoreBackup,
    deleteBackup,
    
    // Configuración
    updateConfig,
    
    // Utilidades
    refreshBackupHistory,
    formatBackupSize,
    formatBackupDate
  };
};

export default useBackup;