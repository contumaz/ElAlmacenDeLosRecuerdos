import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Palette, 
  Volume2, 
  Lock, 
  Globe, 
  Save,
  Monitor,
  Moon,
  Sun,
  Heart,
  Shield,
  Clock,
  User,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/Layout/Layout';
import { useAuth } from '@/hooks/use-auth-hook';
import { useTheme } from '@/hooks/useTheme';
import { ThemeDebug } from '@/components/ThemeDebug';
import { Config } from '@/types';
import SecuritySettings from '@/components/SecuritySettings';
import EmotionAnalysisSettings from '@/components/EmotionAnalysisSettings';
import QuickActionsConfig from '@/components/QuickActionsConfig';

export function Configuracion() {
  const { user } = useAuth();
  const { theme, density, setTheme, setDensity } = useTheme();
  const [config, setConfig] = useState<Config>({
    theme: theme,
    language: 'es',
    autoSave: true,
    recordingQuality: 'high',
    privacyLevel: 1,
    sessionTimeout: 60,
    density: density
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      // Cargar configuración desde la API o localStorage
      let savedConfig;
      if (window.electronAPI && window.electronAPI.storage) {
        savedConfig = await window.electronAPI.storage.getConfig('userConfig', config);
      } else {
        // Fallback para navegador
        const stored = localStorage.getItem('userConfig');
        savedConfig = stored ? JSON.parse(stored) : config;
      }
      setConfig(savedConfig);
    } catch (error) {
      console.error('Error loading config:', error);
      // Usar configuración por defecto en caso de error
      setConfig(config);
    }
  }, [config]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI && window.electronAPI.storage) {
        await window.electronAPI.storage.setConfig('userConfig', config);
        // Log de actividad solo en Electron
        if (window.electronAPI.security) {
          await window.electronAPI.security.logActivity(`Configuración actualizada - tema: ${config.theme}, privacidad: ${config.privacyLevel}`);
        }
      } else {
        // Fallback para navegador
        localStorage.setItem('userConfig', JSON.stringify(config));
      }
      setHasChanges(false);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof Config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Aplicar cambios inmediatamente para tema y densidad
    if (key === 'theme') {
      setTheme(value);
    } else if (key === 'density') {
      setDensity(value);
    }
  };

  const handlePasswordChange = async () => {
    // Implementar cambio de contraseña
    alert('Funcionalidad de cambio de contraseña próximamente');
  };

  const exportData = async () => {
    try {
      if (window.electronAPI && window.electronAPI.showSaveDialog) {
        const result = await window.electronAPI.showSaveDialog({
          defaultPath: `almacen_backup_${new Date().toISOString().split('T')[0]}.zip`,
          filters: [
            { name: 'Archivos ZIP', extensions: ['zip'] }
          ]
        });

        if (!result.canceled && result.filePath) {
          // Crear backup
          if (window.electronAPI.security) {
            await window.electronAPI.security.createBackup();
          }
          alert('Datos exportados exitosamente');
        }
      } else {
        // Fallback para navegador - descargar configuración como JSON
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `almacen_config_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Configuración exportada exitosamente');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    }
  };

  const resetSettings = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
      const defaultConfig: Config = {
        theme: 'warm',
        language: 'es',
        autoSave: true,
        recordingQuality: 'high',
        privacyLevel: 1,
        sessionTimeout: 60,
        density: 'comfortable'
      };
      setConfig(defaultConfig);
      setHasChanges(true);
    }
  };

  const breadcrumbs = [{ label: 'Configuración' }];

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Configuración</h1>
            <p className="text-amber-600">
              Personaliza la aplicación según tus preferencias
            </p>
          </div>
          {hasChanges && (
            <Button 
              onClick={saveConfig}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
            <TabsTrigger value="acciones">Acciones</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
            <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configuración General</span>
                </CardTitle>
                <CardDescription>
                  Ajustes básicos de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autoguardado</Label>
                    <p className="text-sm text-amber-600">
                      Guarda automáticamente tus cambios mientras escribes
                    </p>
                  </div>
                  <Switch
                    checked={config.autoSave}
                    onCheckedChange={(checked) => updateConfig('autoSave', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Idioma de la interfaz</Label>
                  <Select value={config.language} onValueChange={(value) => updateConfig('language', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Tiempo de sesión (minutos)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.sessionTimeout]}
                      onValueChange={(value) => updateConfig('sessionTimeout', value[0])}
                      max={240}
                      min={15}
                      step={15}
                      className="w-64"
                    />
                    <p className="text-sm text-amber-600">
                      {config.sessionTimeout} minutos de inactividad antes de cerrar sesión
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Análisis Emocional */}
            <EmotionAnalysisSettings />
          </TabsContent>

          <TabsContent value="apariencia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Apariencia</span>
                </CardTitle>
                <CardDescription>
                  Personaliza el aspecto visual de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema de color</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        config.theme === 'light' ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                      }`}
                      onClick={() => updateConfig('theme', 'light')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Sun className="w-4 h-4" />
                        <span className="font-medium">Claro</span>
                      </div>
                      <div className="h-8 bg-gradient-to-r from-white to-gray-100 rounded border" />
                    </div>

                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        config.theme === 'dark' ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                      }`}
                      onClick={() => updateConfig('theme', 'dark')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Moon className="w-4 h-4" />
                        <span className="font-medium">Oscuro</span>
                      </div>
                      <div className="h-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded border" />
                    </div>

                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        config.theme === 'warm' ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                      }`}
                      onClick={() => updateConfig('theme', 'warm')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">Cálido</span>
                      </div>
                      <div className="h-8 bg-gradient-to-r from-amber-100 to-orange-200 rounded border" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Densidad de la interfaz</Label>
                  <Select 
                    value={config.density} 
                    onValueChange={(value) => updateConfig('density', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacta</SelectItem>
                      <SelectItem value="comfortable">Cómoda</SelectItem>
                      <SelectItem value="spacious">Espaciosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acciones" className="space-y-6">
            <QuickActionsConfig />
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5" />
                  <span>Configuración de Audio</span>
                </CardTitle>
                <CardDescription>
                  Ajustes para grabación y reproducción de audio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Calidad de grabación</Label>
                  <Select 
                    value={config.recordingQuality} 
                    onValueChange={(value) => updateConfig('recordingQuality', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja (16 kHz)</SelectItem>
                      <SelectItem value="medium">Media (32 kHz)</SelectItem>
                      <SelectItem value="high">Alta (44.1 kHz)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-amber-600">
                    Mayor calidad = archivos más grandes
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Nivel de volumen</Label>
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    min={0}
                    step={5}
                    className="w-64"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancelación de ruido</Label>
                    <p className="text-sm text-amber-600">
                      Reduce el ruido de fondo durante la grabación
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Eco cancelación</Label>
                    <p className="text-sm text-amber-600">
                      Elimina el eco en las grabaciones
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="cuenta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Mi Cuenta</span>
                </CardTitle>
                <CardDescription>
                  Gestiona tu información personal y de acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input 
                      id="username" 
                      value={user?.username || ''} 
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ''} 
                      className="mt-1"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <Label>Rol de usuario</Label>
                    <Input 
                      value={user?.role || ''} 
                      className="mt-1 capitalize"
                      disabled
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Seguridad de la cuenta</Label>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={handlePasswordChange}>
                      <Lock className="w-4 h-4 mr-2" />
                      Cambiar contraseña
                    </Button>
                    <p className="text-sm text-amber-600">
                      Última modificación: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Información de la cuenta</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-amber-600">Fecha de registro:</span>
                      <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'No disponible'}</p>
                    </div>
                    <div>
                      <span className="text-amber-600">Último acceso:</span>
                      <p>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción global */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetSettings} className="text-red-600 border-red-200 hover:bg-red-50">
                Restablecer configuración
              </Button>
              
              {hasChanges && (
                <Button 
                  onClick={saveConfig}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar todos los cambios
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Componente de debug para probar temas */}
      <ThemeDebug />
    </Layout>
  );
}
