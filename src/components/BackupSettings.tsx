import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import useBackup from '@/hooks/useBackup';
import {
  Download,
  Upload,
  Trash2,
  Clock,
  HardDrive,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

const BackupSettings: React.FC = () => {
  const {
    isBackingUp,
    isRestoring,
    backupHistory,
    config,
    stats,
    createBackup,
    restoreBackup,
    deleteBackup,
    updateConfig,
    refreshBackupHistory,
    formatBackupSize,
    formatBackupDate
  } = useBackup();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    updateConfig({ [key]: value });
  };

  const getBackupTypeIcon = (isIncremental: boolean) => {
    return isIncremental ? (
      <Badge variant="secondary" className="text-xs">
        <RefreshCw className="w-3 h-3 mr-1" />
        Incremental
      </Badge>
    ) : (
      <Badge variant="default" className="text-xs">
        <Database className="w-3 h-3 mr-1" />
        Completo
      </Badge>
    );
  };

  const getStorageUsagePercentage = () => {
    const maxStorage = 50 * 1024 * 1024; // 50MB límite estimado para localStorage
    return Math.min((stats.totalSize / maxStorage) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Configuración General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Backup
          </CardTitle>
          <CardDescription>
            Configura el sistema de backup automático para proteger tus memorias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Backup */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Crear backups automáticamente según el intervalo configurado
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={config.autoBackupEnabled}
              onCheckedChange={(checked) => handleConfigChange('autoBackupEnabled', checked)}
            />
          </div>

          {/* Intervalo de Backup */}
          {config.autoBackupEnabled && (
            <div className="space-y-2">
              <Label>Frecuencia de Backup</Label>
              <Select
                value={config.backupInterval.toString()}
                onValueChange={(value) => handleConfigChange('backupInterval', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Cada hora</SelectItem>
                  <SelectItem value="6">Cada 6 horas</SelectItem>
                  <SelectItem value="12">Cada 12 horas</SelectItem>
                  <SelectItem value="24">Cada 24 horas</SelectItem>
                  <SelectItem value="48">Cada 2 días</SelectItem>
                  <SelectItem value="168">Cada semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Configuración Avanzada */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              Configuración Avanzada
              <RefreshCw className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Máximo de Backups</Label>
                  <Select
                    value={config.maxBackups.toString()}
                    onValueChange={(value) => handleConfigChange('maxBackups', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 backups</SelectItem>
                      <SelectItem value="10">10 backups</SelectItem>
                      <SelectItem value="15">15 backups</SelectItem>
                      <SelectItem value="20">20 backups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compression">Compresión</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce el tamaño de los backups
                    </p>
                  </div>
                  <Switch
                    id="compression"
                    checked={config.compressionEnabled}
                    onCheckedChange={(checked) => handleConfigChange('compressionEnabled', checked)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Estadísticas de Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <div className="text-sm text-muted-foreground">Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatBackupSize(stats.totalSize)}</div>
              <div className="text-sm text-muted-foreground">Tamaño Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.lastBackup ? formatBackupDate(stats.lastBackup.getTime()) : 'Nunca'}
              </div>
              <div className="text-sm text-muted-foreground">Último Backup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.nextBackup && config.autoBackupEnabled ? formatBackupDate(stats.nextBackup.getTime()) : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Próximo Backup</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso de almacenamiento</span>
              <span>{getStorageUsagePercentage().toFixed(1)}%</span>
            </div>
            <Progress value={getStorageUsagePercentage()} className="h-2" />
            {getStorageUsagePercentage() > 80 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Almacenamiento casi lleno. Considera eliminar backups antiguos.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Crear o restaurar backups manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={createBackup}
              disabled={isBackingUp || isRestoring}
              className="flex items-center gap-2"
            >
              {isBackingUp ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isBackingUp ? 'Creando...' : 'Crear Backup'}
            </Button>
            
            <Button
              variant="outline"
              onClick={refreshBackupHistory}
              disabled={isBackingUp || isRestoring}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de Backups
          </CardTitle>
          <CardDescription>
            {backupHistory.length} backup{backupHistory.length !== 1 ? 's' : ''} disponible{backupHistory.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay backups disponibles</p>
              <p className="text-sm">Crea tu primer backup usando el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupHistory.map((backup, index) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatBackupDate(backup.timestamp)}
                        </span>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Más reciente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getBackupTypeIcon(backup.isIncremental)}
                        <span className="text-sm text-muted-foreground">
                          {formatBackupSize(backup.size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {backup.memories.length} memoria{backup.memories.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                      disabled={isBackingUp || isRestoring}
                      className="flex items-center gap-1"
                    >
                      {isRestoring ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      Restaurar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                      disabled={isBackingUp || isRestoring}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
export { BackupSettings };