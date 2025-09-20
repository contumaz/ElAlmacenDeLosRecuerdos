import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Brain, Eye, RotateCcw, AlertTriangle, CheckCircle, Settings, BarChart3, Shield, RefreshCw } from 'lucide-react';
import { useEmotionSettings } from '@/hooks/useEmotionSettings';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';

export const EmotionAnalysisSettings: React.FC = () => {
  const { settings, isLoading, updateSettings, resetSettings, toggleAutoInitialize } = useEmotionSettings();
  const { 
    isServiceReady, 
    emotionHistory, 
    isInitializing, 
    initializationProgress, 
    isEmotionAnalysisEnabled,
    initializeService 
  } = useEmotionAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Análisis Emocional IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Cargando configuración...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Análisis Emocional IA</span>
          </div>
          <div className="flex items-center space-x-2">
            {isServiceReady ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            ) : settings.enabled ? (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <Brain className="w-3 h-3 mr-1" />
                Inicializando
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600 border-gray-600">
                Desactivado
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Configura el análisis emocional automático de tus memorias usando IA local
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado del servicio */}
        {settings.enabled && (
          <Alert className={isServiceReady ? "border-green-200 bg-green-50" : isInitializing ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}>
            <AlertTriangle className={`w-4 h-4 ${isServiceReady ? 'text-green-600' : isInitializing ? 'text-blue-600' : 'text-yellow-600'}`} />
            <AlertDescription className={isServiceReady ? 'text-green-800' : isInitializing ? 'text-blue-800' : 'text-yellow-800'}>
              {isServiceReady 
                ? `Servicio activo. Se han analizado ${emotionHistory.length} memorias.`
                : isInitializing
                ? `Inicializando modelo de IA... ${initializationProgress.percentage}% - ${initializationProgress.message}`
                : 'El modelo de IA no está inicializado. Haz clic en "Inicializar IA" para comenzar.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de inicialización */}
        {settings.enabled && !isServiceReady && !isInitializing && (
          <div className="text-center py-4 border border-purple-200 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-3">
              El modelo de análisis emocional necesita ser inicializado
            </p>
            <Button 
              onClick={initializeService}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Inicializar IA
            </Button>
          </div>
        )}

        {/* Progreso de inicialización */}
        {settings.enabled && isInitializing && (
          <div className="space-y-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-blue-800">{initializationProgress.message}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${initializationProgress.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700 text-center">{initializationProgress.percentage}% completado</p>
          </div>
        )}

        {/* Configuración principal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Habilitar análisis emocional</h4>
              <p className="text-sm text-gray-500">
                Activa el análisis automático de emociones en tus memorias
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Mostrar en Dashboard</h4>
                  <p className="text-sm text-gray-500">
                    Muestra un resumen del análisis emocional en el dashboard principal
                  </p>
                </div>
                <Switch
                  checked={settings.showInDashboard}
                  onCheckedChange={(checked) => updateSettings({ showInDashboard: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Análisis automático</h4>
                  <p className="text-sm text-gray-500">
                    Analiza automáticamente las nuevas memorias al crearlas
                  </p>
                </div>
                <Switch
                  checked={settings.autoAnalyze}
                  onCheckedChange={(checked) => updateSettings({ autoAnalyze: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Inicialización automática</h4>
                  <p className="text-sm text-gray-500">
                    Inicializa automáticamente el modelo de IA al cargar la aplicación
                  </p>
                </div>
                <Switch
                  checked={settings.autoInitialize}
                  onCheckedChange={toggleAutoInitialize}
                />
              </div>
            </>
          )}
        </div>

        {/* Información adicional */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Privacidad y datos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• El análisis se realiza completamente en tu dispositivo</li>
                <li>• No se envían datos a servidores externos</li>
                <li>• Los resultados se almacenan localmente</li>
                <li>• Puedes eliminar todos los datos en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {emotionHistory.length > 0 && (
              <span>{emotionHistory.length} memorias analizadas</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              className="text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restablecer
            </Button>
            {settings.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/analisis-emocional', '_blank')}
                className="text-purple-600 hover:text-purple-900 border-purple-200 hover:border-purple-300"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver análisis completo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionAnalysisSettings;