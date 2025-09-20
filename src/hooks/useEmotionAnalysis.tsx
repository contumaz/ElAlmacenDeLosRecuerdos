import { useState, useEffect, useCallback, useRef } from 'react';
import emotionAnalysisService, { EmotionAnalysis, EmotionResult } from '@/services/EmotionAnalysisService';
import { useMemories } from './use-memories-hook';
import { useEmotionSettings } from './useEmotionSettings';

export interface EmotionHistory {
  id: string;
  text: string;
  analysis: EmotionAnalysis;
  memoryId?: string;
}

export interface EmotionTrend {
  date: string;
  emotion: string;
  confidence: number;
  count: number;
  percentage: number;
}

export interface InitializationProgress {
  percentage: number;
  message: string;
}

export interface UseEmotionAnalysisReturn {
  // Estado actual
  isAnalyzing: boolean;
  currentAnalysis: EmotionAnalysis | null;
  error: string | null;
  isServiceReady: boolean;
  isInitializing: boolean;
  initializationProgress: InitializationProgress;
  
  // Configuración
  isEmotionAnalysisEnabled: boolean;
  setEmotionAnalysisEnabled: (enabled: boolean) => void;
  
  // Historial y tendencias
  emotionHistory: EmotionHistory[];
  emotionTrends: EmotionTrend[];
  
  // Funciones de análisis
  analyzeText: (text: string, memoryId?: string) => Promise<EmotionAnalysis | null>;
  analyzeAudio: (transcription: string, memoryId?: string) => Promise<EmotionAnalysis | null>;
  analyzeBatch: (texts: string[]) => Promise<EmotionAnalysis[]>;
  
  // Inicialización manual
  initializeService: () => Promise<void>;
  
  // Análisis en tiempo real
  startRealTimeAnalysis: (text: string, debounceMs?: number) => void;
  stopRealTimeAnalysis: () => void;
  isRealTimeActive: boolean;
  
  // Gestión de historial
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  getEmotionStatistics: () => ReturnType<typeof emotionAnalysisService.getEmotionStatistics>;
  
  // Filtros y búsqueda
  filterHistoryByEmotion: (emotion: string) => EmotionHistory[];
  filterHistoryByDateRange: (startDate: Date, endDate: Date) => EmotionHistory[];
  searchHistory: (query: string) => EmotionHistory[];
}

export const useEmotionAnalysis = (): UseEmotionAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<EmotionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState<InitializationProgress>({
    percentage: 0,
    message: 'Preparando inicialización...'
  });
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistory[]>([]);
  const [emotionTrends, setEmotionTrends] = useState<EmotionTrend[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [isEmotionAnalysisEnabled, setIsEmotionAnalysisEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem('emotion-analysis-enabled');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  const realTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { memories } = useMemories();
  const { settings } = useEmotionSettings();

  // Función para activar/desactivar análisis emocional
  const setEmotionAnalysisEnabled = useCallback((enabled: boolean) => {
    setIsEmotionAnalysisEnabledState(enabled);
    try {
      localStorage.setItem('emotion-analysis-enabled', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error al guardar configuración de análisis emocional:', error);
    }
  }, []);

  // Función para inicializar el servicio manualmente
  const initializeService = useCallback(async () => {
    if (isInitializing || isServiceReady) return;
    
    setIsInitializing(true);
    setError(null);
    setInitializationProgress({ percentage: 0, message: 'Iniciando carga del modelo...' });
    
    // Escuchar eventos de progreso
    const handleProgress = (event: CustomEvent) => {
      setInitializationProgress({
        percentage: event.detail.progress || 0,
        message: event.detail.message || 'Cargando modelo...'
      });
    };
    
    try {
      window.addEventListener('emotion-analysis-progress', handleProgress as EventListener);
      
      await emotionAnalysisService.initialize();
      setIsServiceReady(true);
      setInitializationProgress({ percentage: 100, message: 'Modelo cargado correctamente' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al inicializar el servicio';
      setError(errorMessage);
      console.error('Error al inicializar servicio de análisis emocional:', err);
    } finally {
      setIsInitializing(false);
      window.removeEventListener('emotion-analysis-progress', handleProgress as EventListener);
    }
  }, [isInitializing, isServiceReady]);

  // Verificar estado del servicio solo cuando está habilitado
  useEffect(() => {
    if (isEmotionAnalysisEnabled) {
      setIsServiceReady(emotionAnalysisService.isReady());
    }
  }, [isEmotionAnalysisEnabled]);

  // Inicialización automática basada en configuración
  useEffect(() => {
    const shouldAutoInitialize = settings.enabled && settings.autoInitialize && !isServiceReady && !isInitializing;
    
    if (shouldAutoInitialize) {
      console.log('Inicializando automáticamente el servicio de análisis emocional...');
      initializeService();
    }
  }, [settings.enabled, settings.autoInitialize, isServiceReady, isInitializing, initializeService]);

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('emotion-analysis-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setEmotionHistory(parsed.map((item: any) => ({
          ...item,
          analysis: {
            ...item.analysis,
            timestamp: new Date(item.analysis.timestamp)
          }
        })));
      }
    } catch (error) {
      console.error('Error al cargar historial de emociones:', error);
    }
  }, []);

  // Guardar historial en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('emotion-analysis-history', JSON.stringify(emotionHistory));
    } catch (error) {
      console.error('Error al guardar historial de emociones:', error);
    }
  }, [emotionHistory]);

  // Calcular tendencias emocionales
  useEffect(() => {
    const calculateTrends = () => {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentHistory = emotionHistory.filter(
        item => item.analysis.timestamp >= last30Days
      );
      
      const trendMap = new Map<string, { emotion: string; confidence: number; count: number }>();
      
      recentHistory.forEach(item => {
        const dateKey = item.analysis.timestamp.toISOString().split('T')[0];
        const emotion = item.analysis.dominantEmotion;
        
        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, {
            emotion,
            confidence: item.analysis.confidence,
            count: 1
          });
        } else {
          const existing = trendMap.get(dateKey)!;
          existing.count += 1;
          existing.confidence = (existing.confidence + item.analysis.confidence) / 2;
        }
      });
      
      const totalCount = Array.from(trendMap.values()).reduce((sum, data) => sum + data.count, 0);
      
      const trends: EmotionTrend[] = Array.from(trendMap.entries()).map(
        ([date, data]) => ({
          date,
          ...data,
          percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0
        })
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setEmotionTrends(trends);
    };
    
    calculateTrends();
  }, [emotionHistory]);

  // Función principal de análisis de texto
  const analyzeText = useCallback(async (
    text: string, 
    memoryId?: string
  ): Promise<EmotionAnalysis | null> => {
    if (!text.trim()) return null;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await emotionAnalysisService.analyzeEmotion(text);
      setCurrentAnalysis(analysis);
      
      // Añadir al historial
      const historyItem: EmotionHistory = {
        id: Date.now().toString(),
        text: text.trim(),
        analysis,
        memoryId
      };
      
      setEmotionHistory(prev => [historyItem, ...prev].slice(0, 1000)); // Limitar a 1000 elementos
      
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en análisis emocional:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Análisis de audio (transcripción)
  const analyzeAudio = useCallback(async (
    transcription: string, 
    memoryId?: string
  ): Promise<EmotionAnalysis | null> => {
    if (!transcription.trim()) return null;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await emotionAnalysisService.analyzeAudioEmotion(transcription);
      setCurrentAnalysis(analysis);
      
      // Añadir al historial
      const historyItem: EmotionHistory = {
        id: Date.now().toString(),
        text: transcription.trim(),
        analysis,
        memoryId
      };
      
      setEmotionHistory(prev => [historyItem, ...prev].slice(0, 1000));
      
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en análisis emocional de audio:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Análisis en lote
  const analyzeBatch = useCallback(async (texts: string[]): Promise<EmotionAnalysis[]> => {
    if (texts.length === 0) return [];
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analyses = await emotionAnalysisService.analyzeBatch(texts);
      
      // Añadir todos al historial
      const historyItems: EmotionHistory[] = analyses.map((analysis, index) => ({
        id: `${Date.now()}-${index}`,
        text: texts[index].trim(),
        analysis
      }));
      
      setEmotionHistory(prev => [...historyItems, ...prev].slice(0, 1000));
      
      return analyses;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en análisis emocional en lote:', err);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Análisis en tiempo real con debounce
  const startRealTimeAnalysis = useCallback((text: string, debounceMs = 1000) => {
    setIsRealTimeActive(true);
    
    if (realTimeTimeoutRef.current) {
      clearTimeout(realTimeTimeoutRef.current);
    }
    
    realTimeTimeoutRef.current = setTimeout(() => {
      if (text.trim().length > 10) { // Solo analizar si hay suficiente texto
        analyzeText(text);
      }
    }, debounceMs);
  }, [analyzeText]);

  // Detener análisis en tiempo real
  const stopRealTimeAnalysis = useCallback(() => {
    setIsRealTimeActive(false);
    if (realTimeTimeoutRef.current) {
      clearTimeout(realTimeTimeoutRef.current);
      realTimeTimeoutRef.current = null;
    }
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setEmotionHistory([]);
    emotionAnalysisService.clearCache();
  }, []);

  // Remover elemento del historial
  const removeFromHistory = useCallback((id: string) => {
    setEmotionHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // Obtener estadísticas
  const getEmotionStatistics = useCallback(() => {
    const analyses = emotionHistory.map(item => item.analysis);
    return emotionAnalysisService.getEmotionStatistics(analyses);
  }, [emotionHistory]);

  // Filtrar por emoción
  const filterHistoryByEmotion = useCallback((emotion: string): EmotionHistory[] => {
    return emotionHistory.filter(item => 
      item.analysis.dominantEmotion.toLowerCase() === emotion.toLowerCase()
    );
  }, [emotionHistory]);

  // Filtrar por rango de fechas
  const filterHistoryByDateRange = useCallback((startDate: Date, endDate: Date): EmotionHistory[] => {
    return emotionHistory.filter(item => {
      const itemDate = item.analysis.timestamp;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [emotionHistory]);

  // Buscar en historial
  const searchHistory = useCallback((query: string): EmotionHistory[] => {
    if (!query.trim()) return emotionHistory;
    
    const lowerQuery = query.toLowerCase();
    return emotionHistory.filter(item => 
      item.text.toLowerCase().includes(lowerQuery) ||
      item.analysis.dominantEmotion.toLowerCase().includes(lowerQuery)
    );
  }, [emotionHistory]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (realTimeTimeoutRef.current) {
        clearTimeout(realTimeTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    isAnalyzing,
    currentAnalysis,
    error,
    isServiceReady,
    isInitializing,
    initializationProgress,
    emotionHistory,
    emotionTrends,
    
    // Configuración
    isEmotionAnalysisEnabled,
    setEmotionAnalysisEnabled,
    
    // Funciones de análisis
    analyzeText,
    analyzeAudio,
    analyzeBatch,
    
    // Inicialización
    initializeService,
    
    // Tiempo real
    startRealTimeAnalysis,
    stopRealTimeAnalysis,
    isRealTimeActive,
    
    // Gestión
    clearHistory,
    removeFromHistory,
    getEmotionStatistics,
    
    // Filtros
    filterHistoryByEmotion,
    filterHistoryByDateRange,
    searchHistory
  };
};