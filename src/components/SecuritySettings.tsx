import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Badge from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Fingerprint,
  FileKey,
  Database,
  Activity,
  Timer,
  Users,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import electronService from '@/services/electronAPI';
import BackupSettings from './BackupSettings';

interface SecurityConfig {
  // Autenticación
  passwordStrength: 'weak' | 'medium' | 'strong';
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // minutos
  requirePasswordOnWake: boolean;
  
  // Cifrado
  encryptionLevel: 'basic' | 'advanced' | 'maximum';
  encryptFiles: boolean;
  encryptDatabase: boolean;
  encryptBackups: boolean;
  autoEncrypt: boolean;
  
  // Privacidad
  shareAnalytics: boolean;
  allowRemoteAccess: boolean;
  logActivity: boolean;
  auditRetention: number; // días
  
  // Backup y Recuperación
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupLocation: string;
  cloudBackupEnabled: boolean;
  
  // Acceso y Permisos
  allowGuestAccess: boolean;
  requireApprovalForNewUsers: boolean;
  defaultUserPermissions: 'read' | 'write' | 'admin';
  reviewModeTimeout: number; // minutos
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  resource: string;
  user: string;
  details: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SecuritySettingsProps {
  className?: string;
}

export default function SecuritySettings({ className = '' }: SecuritySettingsProps) {
  const [config, setConfig] = useState<SecurityConfig>({
    passwordStrength: 'medium',
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 60,
    requirePasswordOnWake: true,
    encryptionLevel: 'advanced',
    encryptFiles: true,
    encryptDatabase: true,
    encryptBackups: true,
    autoEncrypt: true,
    shareAnalytics: false,
    allowRemoteAccess: false,
    logActivity: true,
    auditRetention: 90,
    autoBackup: true,
    backupFrequency: 'weekly',
    backupLocation: '',
    cloudBackupEnabled: false,
    allowGuestAccess: false,
    requireApprovalForNewUsers: true,
    defaultUserPermissions: 'read',
    reviewModeTimeout: 30
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityScore, setSecurityScore] = useState(75);

  const calculateSecurityScore = useCallback(() => {
    let score = 0;
    
    // Autenticación (30 puntos)
    if (config.passwordStrength === 'strong') score += 15;
    else if (config.passwordStrength === 'medium') score += 10;
    else score += 5;
    
    if (config.twoFactorEnabled) score += 10;
    if (config.biometricEnabled) score += 5;
    
    // Cifrado (25 puntos)
    if (config.encryptionLevel === 'maximum') score += 15;
    else if (config.encryptionLevel === 'advanced') score += 10;
    else score += 5;
    
    if (config.encryptFiles) score += 3;
    if (config.encryptDatabase) score += 4;
    if (config.encryptBackups) score += 3;
    
    // Privacidad (20 puntos)
    if (!config.shareAnalytics) score += 5;
    if (!config.allowRemoteAccess) score += 5;
    if (config.logActivity) score += 5;
    if (config.auditRetention >= 90) score += 5;
    
    // Backup y Recuperación (15 puntos)
    if (config.autoBackup) score += 8;
    if (config.cloudBackupEnabled) score += 4;
    if (config.backupFrequency === 'daily') score += 3;
    
    // Acceso y Permisos (10 puntos)
    if (!config.allowGuestAccess) score += 3;
    if (config.requireApprovalForNewUsers) score += 4;
    if (config.defaultUserPermissions === 'read') score += 3;
    
    setSecurityScore(Math.min(score, 100));
  }, [config]);

  const loadSecurityConfig = useCallback(async () => {
    try {
      const result = await electronService.storage.getConfig('security_config');
      if (result.success && result.value) {
        setConfig(prev => ({ ...prev, ...result.value }));
      }
    } catch (error) {
      console.error('Error cargando configuración de seguridad:', error);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const result = await electronService.storage.getAuditLog();
      
      if (result.success) {
        const logs: AuditLogEntry[] = result.logs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          action: log.accion,
          resource: log.recurso,
          user: log.usuario_id || 'Sistema',
          details: log.detalles ? JSON.parse(log.detalles).username || '' : '',
          riskLevel: getRiskLevel(log.accion)
        }));
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error('Error cargando logs de auditoría:', error);
    }
  }, []);

  useEffect(() => {
    loadSecurityConfig();
    loadAuditLogs();
    calculateSecurityScore();
  }, [loadSecurityConfig, loadAuditLogs, calculateSecurityScore]);

  useEffect(() => {
    calculateSecurityScore();
  }, [calculateSecurityScore]);

  const saveSecurityConfig = async () => {
    setIsLoading(true);
    try {
      await electronService.storage.setConfig('security_config', config);
      await electronService.logAction(`Configuración de seguridad actualizada: ${Object.keys(config).join(', ')}`, { config });
      toast.success('Configuración de seguridad guardada');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (action: string): 'low' | 'medium' | 'high' => {
    const highRiskActions = ['login_failed', 'password_changed', 'user_created', 'permissions_changed'];
    const mediumRiskActions = ['login', 'logout', 'memory_deleted', 'config_changed'];
    
    if (highRiskActions.includes(action)) return 'high';
    if (mediumRiskActions.includes(action)) return 'medium';
    return 'low';
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await electronService.auth.changePassword?.(currentPassword, newPassword);
      if (result?.success) {
        toast.success('Contraseña cambiada exitosamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Actualizar fortaleza de contraseña
        const strength = getPasswordStrength(newPassword);
        setConfig(prev => ({ ...prev, passwordStrength: strength }));
        
        await electronService.logAction(`Contraseña cambiada - fortaleza: ${strength}`, { strength });
      } else {
        toast.error(result?.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score >= 4 && password.length >= 12) return 'strong';
    if (score >= 3 && password.length >= 8) return 'medium';
    return 'weak';
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar createBackup en storage service
      const result = { success: false, error: 'Backup no implementado' };
      if (result?.success) {
        toast.success('Backup creado exitosamente');
        await electronService.logAction(`Backup creado - encriptado: ${config.encryptBackups}`, { encrypted: config.encryptBackups });
      } else {
        toast.error('Error al crear backup');
      }
    } catch (error) {
      console.error('Error creando backup:', error);
      toast.error('Error al crear backup');
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSecurityScoreText = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bueno';
    if (score >= 50) return 'Regular';
    return 'Necesita Mejoras';
  };

  return (
    <Card className={`w-full max-w-6xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Configuración de Seguridad y Privacidad
          </div>
          <Badge className={`${getSecurityScoreColor(securityScore)} px-3 py-1`}>
            {getSecurityScoreText(securityScore)} - {securityScore}%
          </Badge>
        </CardTitle>
        <Progress value={securityScore} className="mt-2" />
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="authentication" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="authentication">Autenticación</TabsTrigger>
            <TabsTrigger value="encryption">Cifrado</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>
          </TabsList>

          {/* Autenticación */}
          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Cambiar Contraseña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Contraseña Actual</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Contraseña actual"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar contraseña"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showPasswords}
                      onCheckedChange={setShowPasswords}
                    />
                    <Label>Mostrar contraseñas</Label>
                  </div>
                  
                  <Button
                    onClick={changePassword}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </div>

                {newPassword && (
                  <div className="space-y-2">
                    <Label>Fortaleza de la contraseña:</Label>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={
                          getPasswordStrength(newPassword) === 'strong' ? 100 :
                          getPasswordStrength(newPassword) === 'medium' ? 66 : 33
                        } 
                        className="flex-1" 
                      />
                      <Badge variant={
                        getPasswordStrength(newPassword) === 'strong' ? 'default' :
                        getPasswordStrength(newPassword) === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {getPasswordStrength(newPassword)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Autenticación Avanzada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticación de dos factores</Label>
                    <p className="text-sm text-gray-500">Capa adicional de seguridad</p>
                  </div>
                  <Switch
                    checked={config.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticación biométrica</Label>
                    <p className="text-sm text-gray-500">Huella dactilar o reconocimiento facial</p>
                  </div>
                  <Switch
                    checked={config.biometricEnabled}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, biometricEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requerir contraseña al despertar</Label>
                    <p className="text-sm text-gray-500">Mayor seguridad en dispositivos compartidos</p>
                  </div>
                  <Switch
                    checked={config.requirePasswordOnWake}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, requirePasswordOnWake: checked }))
                    }
                  />
                </div>

                <div>
                  <Label>Tiempo de sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))
                    }
                    min={5}
                    max={480}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cifrado */}
          <TabsContent value="encryption" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Configuración de Cifrado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nivel de cifrado</Label>
                  <select
                    value={config.encryptionLevel}
                    onChange={(e) => 
                      setConfig(prev => ({ 
                        ...prev, 
                        encryptionLevel: e.target.value as 'basic' | 'advanced' | 'maximum'
                      }))
                    }
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option value="basic">Básico (AES-128)</option>
                    <option value="advanced">Avanzado (AES-256)</option>
                    <option value="maximum">Máximo (AES-256 + RSA)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cifrar archivos multimedia</Label>
                      <p className="text-sm text-gray-500">Proteger fotos, videos y audio</p>
                    </div>
                    <Switch
                      checked={config.encryptFiles}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, encryptFiles: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cifrar base de datos</Label>
                      <p className="text-sm text-gray-500">Proteger metadatos y configuraciones</p>
                    </div>
                    <Switch
                      checked={config.encryptDatabase}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, encryptDatabase: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cifrar backups</Label>
                      <p className="text-sm text-gray-500">Proteger copias de seguridad</p>
                    </div>
                    <Switch
                      checked={config.encryptBackups}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, encryptBackups: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cifrado automático</Label>
                      <p className="text-sm text-gray-500">Cifrar nuevos archivos automáticamente</p>
                    </div>
                    <Switch
                      checked={config.autoEncrypt}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, autoEncrypt: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacidad */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Configuración de Privacidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compartir datos de análisis</Label>
                    <p className="text-sm text-gray-500">Ayudar a mejorar la aplicación (anónimo)</p>
                  </div>
                  <Switch
                    checked={config.shareAnalytics}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, shareAnalytics: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir acceso remoto</Label>
                    <p className="text-sm text-gray-500">Acceder desde otros dispositivos</p>
                  </div>
                  <Switch
                    checked={config.allowRemoteAccess}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, allowRemoteAccess: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Registro de actividad</Label>
                    <p className="text-sm text-gray-500">Mantener log de todas las acciones</p>
                  </div>
                  <Switch
                    checked={config.logActivity}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, logActivity: checked }))
                    }
                  />
                </div>

                <div>
                  <Label>Retención de logs (días)</Label>
                  <Input
                    type="number"
                    value={config.auditRetention}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, auditRetention: parseInt(e.target.value) || 90 }))
                    }
                    min={7}
                    max={365}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup" className="space-y-6">
            <BackupSettings />
          </TabsContent>

          {/* Auditoría */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Logs de Auditoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          log.riskLevel === 'high' ? 'destructive' :
                          log.riskLevel === 'medium' ? 'secondary' : 'outline'
                        }>
                          {log.action}
                        </Badge>
                        <span className="text-sm">{log.resource}</span>
                        {log.details && (
                          <span className="text-xs text-gray-500">({log.details})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {log.timestamp.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {auditLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No hay logs de auditoría disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={loadSecurityConfig}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
          
          <Button 
            onClick={saveSecurityConfig} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>

        {/* Advertencias de seguridad */}
        {securityScore < 70 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Mejoras de Seguridad Recomendadas</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    {config.passwordStrength !== 'strong' && (
                      <li>• Usar una contraseña más fuerte</li>
                    )}
                    {!config.twoFactorEnabled && (
                      <li>• Habilitar autenticación de dos factores</li>
                    )}
                    {config.encryptionLevel !== 'maximum' && (
                      <li>• Aumentar el nivel de cifrado</li>
                    )}
                    {!config.autoBackup && (
                      <li>• Habilitar backup automático</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export { SecuritySettings };
