import { pipeline } from '@xenova/transformers';
import { useAIWorker } from '../hooks/useAIWorker';

export interface EmotionResult {
  label: string;
  score: number;
}

export interface EmotionAnalysis {
  emotions: EmotionResult[];
  dominantEmotion: string;
  confidence: number;
  timestamp: Date;
}

export interface LoadingProgress {
  stage: 'downloading' | 'initializing' | 'ready' | 'error';
  percentage: number;
  message: string;
}

type ProgressCallback = (progress: LoadingProgress) => void;

class EmotionAnalysisService {
  private classifier: any | null = null;
  private isInitializing = false;
  private cache = new Map<string, EmotionAnalysis>();
  private readonly maxCacheSize = 100;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private currentProgress: LoadingProgress = {
    stage: 'downloading',
    percentage: 0,
    message: 'Preparando descarga del modelo...'
  };
  private aiWorker: ReturnType<typeof useAIWorker> | null = null;
  private useWebWorker = true; // Flag para habilitar/deshabilitar Web Worker

  /**
   * Inicializa el pipeline de análisis emocional
   */
  private async initializeClassifier(): Promise<any> {
    if (this.classifier) {
      return this.classifier;
    }

    if (this.isInitializing) {
      // Esperar a que termine la inicialización
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.classifier!;
    }

    try {
      this.isInitializing = true;
      
      // Simular progreso de descarga
      this.updateProgress({
        stage: 'downloading',
        percentage: 10,
        message: 'Descargando modelo de IA (10%)'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateProgress({
        stage: 'downloading',
        percentage: 30,
        message: 'Descargando modelo de IA (30%)'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateProgress({
        stage: 'downloading',
        percentage: 60,
        message: 'Descargando modelo de IA (60%)'
      });
      
      console.log('Inicializando modelo de análisis emocional...');
      
      this.updateProgress({
        stage: 'initializing',
        percentage: 80,
        message: 'Inicializando pipeline de IA (80%)'
      });
      
      this.classifier = await pipeline(
        'text-classification',
        'j-hartmann/emotion-english-distilroberta-base'
      );
      
      this.updateProgress({
        stage: 'ready',
        percentage: 100,
        message: 'Modelo cargado y listo'
      });
      
      console.log('Modelo de análisis emocional inicializado correctamente');
      return this.classifier;
    } catch (error) {
      console.error('Error al inicializar el modelo de análisis emocional:', error);
      this.updateProgress({
        stage: 'error',
        percentage: 0,
        message: 'Error al cargar el modelo'
      });
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Analiza las emociones en un texto
   */
  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    if (!text || text.trim().length === 0) {
      return {
        emotions: [],
        dominantEmotion: 'neutral',
        confidence: 0,
        timestamp: new Date()
      };
    }

    // Verificar cache
    const cacheKey = text.trim().toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Intentar usar Web Worker primero si está habilitado
      if (this.useWebWorker && this.canUseWebWorker()) {
        return await this.analyzeEmotionWithWorker(text, cacheKey);
      }
      
      // Fallback al modelo original
      return await this.analyzeEmotionWithModel(text, cacheKey);
    } catch (error) {
      console.error('Error al analizar emociones:', error);
      return {
        emotions: [],
        dominantEmotion: 'neutral',
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Analiza emociones usando Web Worker
   */
  private async analyzeEmotionWithWorker(text: string, cacheKey: string): Promise<EmotionAnalysis> {
    try {
      // Crear worker si no existe
      if (!this.aiWorker) {
        this.aiWorker = this.createWorkerInstance();
      }

      const workerResult = await this.aiWorker.analyzeEmotion(text);
      
      // Convertir resultado del worker al formato esperado
      const emotions: EmotionResult[] = Object.entries(workerResult.emotions)
        .map(([label, score]) => ({ label, score: Number(score) }))
        .sort((a, b) => b.score - a.score);
      
      const analysis: EmotionAnalysis = {
        emotions,
        dominantEmotion: workerResult.dominantEmotion,
        confidence: workerResult.confidence,
        timestamp: new Date()
      };

      // Guardar en cache
      this.addToCache(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.warn('Error con Web Worker, usando fallback:', error);
      // Si falla el worker, usar el modelo original
      return await this.analyzeEmotionWithModel(text, cacheKey);
    }
  }

  /**
   * Analiza emociones usando el modelo original
   */
  private async analyzeEmotionWithModel(text: string, cacheKey: string): Promise<EmotionAnalysis> {
    const classifier = await this.initializeClassifier();
    const results = await classifier(text) as EmotionResult[];
    
    // Ordenar por puntuación descendente
    const sortedEmotions = results.sort((a, b) => b.score - a.score);
    
    const analysis: EmotionAnalysis = {
      emotions: sortedEmotions,
      dominantEmotion: sortedEmotions[0]?.label || 'neutral',
      confidence: sortedEmotions[0]?.score || 0,
      timestamp: new Date()
    };

    // Guardar en cache
    this.addToCache(cacheKey, analysis);
    
    return analysis;
  }

  /**
   * Verifica si se puede usar Web Worker
   */
  private canUseWebWorker(): boolean {
    return typeof Worker !== 'undefined' && typeof window !== 'undefined';
  }

  /**
   * Crea una instancia del worker mejorado (simulado para uso en clase)
   */
  private createWorkerInstance() {
    // Como no podemos usar el hook directamente en una clase,
    // creamos una implementación similar con las nuevas funcionalidades
    let worker: Worker | null = null;
    const pendingRequests = new Map<string, { 
      resolve: (result: any) => void; 
      reject: (error: Error) => void;
      type: 'emotion' | 'batch' | 'sentiment';
    }>();

    const initWorker = () => {
      if (!worker) {
        worker = new Worker(
          new URL('../workers/ai-worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (event) => {
          const { type, payload, requestId } = event.data;
          
          // Manejar mensajes de progreso
          if (type === 'PROGRESS' && requestId) {
            // Emitir evento de progreso para análisis en lote
            if (typeof window !== 'undefined') {
              const progressEvent = new CustomEvent('batch-analysis-progress', {
                detail: { requestId, progress: payload }
              });
              window.dispatchEvent(progressEvent);
            }
            return;
          }
          
          if (requestId && pendingRequests.has(requestId)) {
            const { resolve, reject } = pendingRequests.get(requestId)!;
            pendingRequests.delete(requestId);
            
            if (type === 'ERROR') {
              reject(new Error(payload.message || 'Worker error'));
              return;
            }
            
            switch (type) {
              case 'EMOTION_ANALYSIS_RESULT':
                resolve(payload);
                break;
              case 'BATCH_EMOTION_ANALYSIS_RESULT':
                resolve(payload);
                break;
              case 'SENTIMENT_ANALYSIS_RESULT':
                resolve(payload);
                break;
              default:
                reject(new Error(`Tipo de respuesta no soportado: ${type}`));
            }
          }
        };
        
        worker.onerror = (error) => {
          console.error('Error en AI Worker:', error);
        };
      }
    };

    return {
      analyzeEmotion: async (text: string): Promise<EmotionAnalysis> => {
        return new Promise<EmotionAnalysis>((resolve, reject) => {
          initWorker();
          if (!worker) {
            reject(new Error('No se pudo inicializar el worker'));
            return;
          }

          const requestId = `emotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          pendingRequests.set(requestId, { resolve, reject, type: 'emotion' });

          worker.postMessage({
            type: 'ANALYZE_EMOTION',
            payload: { text },
            requestId
          });

          // Timeout
          setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('Timeout en análisis de emociones'));
            }
          }, 30000);
        });
      },
      
      analyzeBatchEmotions: async (texts: string[]): Promise<any> => {
        return new Promise((resolve, reject) => {
          initWorker();
          if (!worker) {
            reject(new Error('No se pudo inicializar el worker'));
            return;
          }

          const requestId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          pendingRequests.set(requestId, { resolve, reject, type: 'batch' });

          worker.postMessage({
            type: 'ANALYZE_BATCH_EMOTIONS',
            payload: { texts },
            requestId
          });

          // Timeout más largo para análisis en lote
          setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('Timeout en análisis de emociones en lote'));
            }
          }, 120000); // 2 minutos
        });
      },
      
      analyzeSentiment: async (text: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          initWorker();
          if (!worker) {
            reject(new Error('No se pudo inicializar el worker'));
            return;
          }

          const requestId = `sentiment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          pendingRequests.set(requestId, { resolve, reject, type: 'sentiment' });

          worker.postMessage({
            type: 'ANALYZE_SENTIMENT',
            payload: { text },
            requestId
          });

          // Timeout
          setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              pendingRequests.delete(requestId);
              reject(new Error('Timeout en análisis de sentimientos'));
            }
          }, 30000);
        });
      },
      
      isWorkerReady: () => worker !== null,
      
      getWorkerStatus: () => ({
        ready: worker !== null,
        pendingRequests: pendingRequests.size
      })
    };
  }

  /**
   * Analiza las emociones en una transcripción de audio
   */
  async analyzeAudioEmotion(transcription: string): Promise<EmotionAnalysis> {
    // Para transcripciones de audio, aplicamos el mismo análisis de texto
    // pero podríamos añadir procesamiento específico para audio en el futuro
    return this.analyzeEmotion(transcription);
  }

  /**
   * Analiza múltiples textos en lote usando Web Worker optimizado
   */
  async analyzeBatch(texts: string[]): Promise<EmotionAnalysis[]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    try {
      // Intentar usar Web Worker para análisis en lote si está habilitado
      if (this.useWebWorker && this.canUseWebWorker()) {
        return await this.analyzeBatchWithWorker(texts);
      }
      
      // Fallback: análisis secuencial con el modelo original
      return await this.analyzeBatchSequential(texts);
    } catch (error) {
      console.error('Error en análisis en lote:', error);
      // Fallback en caso de error
      return await this.analyzeBatchSequential(texts);
    }
  }

  /**
   * Analiza múltiples textos usando Web Worker optimizado
   */
  private async analyzeBatchWithWorker(texts: string[]): Promise<EmotionAnalysis[]> {
    try {
      // Crear worker si no existe
      if (!this.aiWorker) {
        this.aiWorker = this.createWorkerInstance();
      }

      const batchResult = await this.aiWorker.analyzeBatchEmotions(texts);
      
      // Convertir resultados del worker al formato esperado
      return batchResult.results.map(result => {
        const emotions = Object.entries(result.emotions)
          .map(([label, score]) => ({ label, score: Number(score) }))
          .sort((a, b) => b.score - a.score);
        
        return {
          emotions,
          dominantEmotion: result.dominantEmotion,
          confidence: result.confidence,
          timestamp: new Date()
        };
      });
    } catch (error) {
      console.warn('Error con Web Worker en lote, usando fallback:', error);
      return await this.analyzeBatchSequential(texts);
    }
  }

  /**
   * Analiza múltiples textos de forma secuencial (fallback)
   */
  private async analyzeBatchSequential(texts: string[]): Promise<EmotionAnalysis[]> {
    const results: EmotionAnalysis[] = [];
    
    for (const text of texts) {
      try {
        const analysis = await this.analyzeEmotion(text);
        results.push(analysis);
      } catch (error) {
        console.error('Error al analizar texto en lote:', error);
        results.push({
          emotions: [],
          dominantEmotion: 'neutral',
          confidence: 0,
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }

  /**
   * Analiza el sentimiento de un texto usando Web Worker
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    processingTime: number;
  }> {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        processingTime: 0
      };
    }

    try {
      // Intentar usar Web Worker si está habilitado
      if (this.useWebWorker && this.canUseWebWorker()) {
        // Crear worker si no existe
        if (!this.aiWorker) {
          this.aiWorker = this.createWorkerInstance();
        }

        return await this.aiWorker.analyzeSentiment(text);
      }
      
      // Fallback: análisis básico de sentimientos
      return this.analyzeSentimentFallback(text);
    } catch (error) {
      console.error('Error al analizar sentimientos:', error);
      return this.analyzeSentimentFallback(text);
    }
  }

  /**
   * Análisis de sentimientos básico (fallback)
   */
  private analyzeSentimentFallback(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    processingTime: number;
  } {
    const startTime = performance.now();
    
    // Palabras positivas y negativas básicas
    const positiveWords = ['bueno', 'excelente', 'genial', 'fantástico', 'increíble', 'perfecto', 'maravilloso'];
    const negativeWords = ['malo', 'terrible', 'horrible', 'pésimo', 'desastroso', 'awful', 'disgusting'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;
    let confidence = 0;
    
    if (totalSentimentWords > 0) {
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = positiveCount / totalSentimentWords;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = negativeCount / totalSentimentWords;
      }
      confidence = Math.abs(positiveCount - negativeCount) / totalSentimentWords;
    }
    
    const processingTime = performance.now() - startTime;
    
    return {
      sentiment,
      score,
      confidence,
      processingTime
    };
  }

  /**
   * Obtiene estadísticas emocionales de un conjunto de análisis
   */
  getEmotionStatistics(analyses: EmotionAnalysis[]): {
    emotionCounts: Record<string, number>;
    averageConfidence: number;
    mostFrequentEmotion: string;
    emotionTrends: { emotion: string; percentage: number }[];
  } {
    if (analyses.length === 0) {
      return {
        emotionCounts: {},
        averageConfidence: 0,
        mostFrequentEmotion: 'neutral',
        emotionTrends: []
      };
    }

    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;

    analyses.forEach(analysis => {
      const emotion = analysis.dominantEmotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      totalConfidence += analysis.confidence;
    });

    const averageConfidence = totalConfidence / analyses.length;
    const mostFrequentEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

    const emotionTrends = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        percentage: (count / analyses.length) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      emotionCounts,
      averageConfidence,
      mostFrequentEmotion,
      emotionTrends
    };
  }

  /**
   * Añade un análisis al cache
   */
  private addToCache(key: string, analysis: EmotionAnalysis): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Eliminar el elemento más antiguo
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, analysis);
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica si el servicio está listo
   */
  isReady(): boolean {
    return this.classifier !== null && !this.isInitializing;
  }

  /**
   * Obtiene el progreso actual de carga
   */
  getCurrentProgress(): LoadingProgress {
    return { ...this.currentProgress };
  }

  /**
   * Suscribe un callback para recibir actualizaciones de progreso
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    // Enviar progreso actual inmediatamente
    callback(this.currentProgress);
    
    // Retornar función para desuscribirse
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Actualiza el progreso y notifica a los callbacks
   */
  private updateProgress(progress: LoadingProgress): void {
    this.currentProgress = { ...progress };
    
    // Notificar callbacks
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error en callback de progreso:', error);
      }
    });
    
    // Emitir evento del DOM para el hook
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('emotion-analysis-progress', {
        detail: {
          progress: progress.percentage,
          stage: progress.stage,
          message: progress.message
        }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Inicia la inicialización del servicio si no está ya iniciado
   */
  async initialize(): Promise<void> {
    if (!this.classifier && !this.isInitializing) {
      await this.initializeClassifier();
    }
  }

  /**
   * Mapea emociones a colores para visualización
   */
  getEmotionColor(emotion: string): string {
    const colorMap: Record<string, string> = {
      joy: '#FFD700',
      happiness: '#FFD700',
      love: '#FF69B4',
      surprise: '#FF6347',
      anger: '#DC143C',
      sadness: '#4169E1',
      fear: '#8A2BE2',
      disgust: '#32CD32',
      neutral: '#808080',
      optimism: '#FFA500',
      pessimism: '#696969'
    };
    
    return colorMap[emotion.toLowerCase()] || '#808080';
  }

  /**
   * Habilita o deshabilita el uso de Web Worker
   */
  setWebWorkerEnabled(enabled: boolean): void {
    this.useWebWorker = enabled;
    if (!enabled && this.aiWorker) {
      // Limpiar worker si se deshabilita
      this.aiWorker = null;
    }
  }

  /**
   * Verifica si el Web Worker está habilitado
   */
  isWebWorkerEnabled(): boolean {
    return this.useWebWorker && this.canUseWebWorker();
  }

  /**
   * Obtiene información sobre el estado del servicio
   */
  getServiceInfo(): {
    isReady: boolean;
    webWorkerEnabled: boolean;
    webWorkerAvailable: boolean;
    cacheSize: number;
    maxCacheSize: number;
  } {
    return {
      isReady: this.isReady(),
      webWorkerEnabled: this.useWebWorker,
      webWorkerAvailable: this.canUseWebWorker(),
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize
    };
  }
}

// Instancia singleton
const emotionAnalysisService = new EmotionAnalysisService();
export default emotionAnalysisService;