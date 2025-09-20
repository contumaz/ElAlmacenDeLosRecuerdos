import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Settings, BarChart3, PieChart, Calendar, Download, RefreshCw } from 'lucide-react';
import { useEmotionAnalysis } from '../hooks/useEmotionAnalysis';
import EmotionVisualization from '../components/EmotionVisualization';
import emotionAnalysisService, { EmotionAnalysis as ServiceEmotionAnalysis } from '../services/EmotionAnalysisService';
import { EmotionAnalysis as TypesEmotionAnalysis } from '../types';

interface LoadingProgress {
  stage: 'downloading' | 'initializing' | 'ready' | 'error';
  percentage: number;
  message: string;
}

const AnalisisEmocional: React.FC = () => {
  const { 
    currentAnalysis, 
    emotionHistory, 
    isServiceReady, 
    analyzeText, 
    emotionTrends 
  } = useEmotionAnalysis();
  
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    stage: 'downloading',
    percentage: 0,
    message: 'Iniciando descarga del modelo...'
  });
  
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('emotionAnalysisEnabled') !== 'false';
  });
  
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (!isEnabled) return;
    
    const checkProgress = () => {
      const service = emotionAnalysisService;
      
      if (service.isReady()) {
        setLoadingProgress({
          stage: 'ready',
          percentage: 100,
          message: 'Modelo cargado y listo'
        });
        return;
      }
      
      // Simular progreso basado en tiempo transcurrido
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(90, (elapsed / 30000) * 100); // 30 segundos para 90%
        
        if (progress < 30) {
          setLoadingProgress({
            stage: 'downloading',
            percentage: progress,
            message: `Descargando modelo de IA (${Math.round(progress)}%)`
          });
        } else if (progress < 70) {
          setLoadingProgress({
            stage: 'initializing',
            percentage: progress,
            message: `Inicializando pipeline (${Math.round(progress)}%)`
          });
        } else {
          setLoadingProgress({
            stage: 'initializing',
            percentage: progress,
            message: `Preparando análisis (${Math.round(progress)}%)`
          });
        }
        
        if (service.isReady()) {
          clearInterval(interval);
          setLoadingProgress({
            stage: 'ready',
            percentage: 100,
            message: 'Modelo cargado y listo'
          });
        }
      }, 500);
      
      return () => clearInterval(interval);
    };
    
    checkProgress();
  }, [isEnabled]);

  const handleToggleService = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem('emotionAnalysisEnabled', newState.toString());
    
    if (!newState) {
      setLoadingProgress({
        stage: 'downloading',
        percentage: 0,
        message: 'Servicio deshabilitado'
      });
    }
  };

  const handleTestAnalysis = async () => {
    if (!testText.trim() || !isServiceReady) return;
    
    try {
      const result = await analyzeText(testText);
      setTestResult(result);
    } catch (error) {
      console.error('Error en análisis de prueba:', error);
    }
  };

  const trends = emotionTrends;
  const stats = emotionHistory.reduce((acc, entry) => {
    const emotion = (entry.analysis as any).primary || (entry.analysis as any).dominantEmotion || 'neutral';
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Análisis Emocional IA</h1>
                <p className="text-gray-600">Comprende las emociones en tus memorias</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleService}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                {isEnabled ? 'Habilitado' : 'Deshabilitado'}
              </button>
            </div>
          </div>
        </div>

        {/* Estado del Servicio */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Estado del Servicio</h3>
              
              {!isEnabled ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Análisis emocional deshabilitado</span>
                </div>
              ) : loadingProgress.stage === 'ready' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Modelo cargado y funcionando</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{loadingProgress.message}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress.percentage}%` }}
                    ></div>
                  </div>
                  
                  <button
                    onClick={handleToggleService}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancelar y deshabilitar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEnabled && isServiceReady && (
          <>
            {/* Emoción Actual */}
            {currentAnalysis && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emoción Dominante Actual</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'joy' && '😊'}
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'sadness' && '😢'}
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'anger' && '😠'}
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'fear' && '😨'}
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'surprise' && '😲'}
                    {((currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion) === 'disgust' && '🤢'}
                  </div>
                  <div>
                    <p className="text-xl font-medium capitalize text-gray-900">
                      {(currentAnalysis as any).primary || (currentAnalysis as any).dominantEmotion}
                    </p>
                    <p className="text-gray-600">
                      Confianza: {Math.round(currentAnalysis.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prueba de Análisis */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prueba el Análisis</h3>
              <div className="space-y-4">
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Escribe un texto para analizar sus emociones..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleTestAnalysis}
                  disabled={!testText.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analizar Texto
                </button>
                
                {testResult && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">
                      Emoción detectada: <span className="capitalize">{testResult.emotion}</span>
                    </p>
                    <p className="text-purple-700">
                      Confianza: {Math.round(testResult.confidence * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Distribución de Emociones */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Distribución de Emociones</h3>
                </div>
                
                {Object.keys(stats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats).map(([emotion, count]) => {
                      const percentage = (count / emotionHistory.length) * 100;
                      return (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="capitalize text-gray-700">{emotion}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay datos de emociones aún
                  </p>
                )}
              </div>

              {/* Tendencias */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tendencias Recientes</h3>
                </div>
                
                {trends.length > 0 ? (
                  <div className="space-y-3">
                    {trends.slice(0, 5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize text-gray-900">{trend.emotion}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(trend.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {Math.round(trend.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay tendencias disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Visualización Completa */}
            {emotionHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Historial Emocional</h3>
                </div>
                <EmotionVisualization />
              </div>
            )}
          </>
        )}

        {!isEnabled && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Análisis Emocional Deshabilitado
            </h3>
            <p className="text-gray-600 mb-6">
              Habilita el análisis emocional para comenzar a entender las emociones en tus memorias.
            </p>
            <button
              onClick={handleToggleService}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Habilitar Análisis Emocional
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalisisEmocional;