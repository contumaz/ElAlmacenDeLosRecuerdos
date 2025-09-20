import { useRef, useCallback, useEffect } from 'react';
import type { 
  WorkerMessage, 
  WorkerResponse,
  EmotionAnalysisRequest, 
  BatchEmotionAnalysisRequest,
  SentimentAnalysisRequest,
  EmotionAnalysisResponse, 
  BatchEmotionAnalysisResponse,
  SentimentAnalysisResponse,
  ProgressResponse,
  ErrorResponse 
} from '../workers/ai-worker';
// import { SentimentResult } from '../types';
import type { EmotionAnalysis } from '../services/EmotionAnalysisService';

interface UseAIWorkerOptions {
  onEmotionAnalysisComplete?: (result: EmotionAnalysisResponse['payload']) => void;
  onBatchAnalysisProgress?: (progress: ProgressResponse['payload']) => void;
  onBatchAnalysisComplete?: (result: BatchEmotionAnalysisResponse['payload']) => void;
  onSentimentAnalysisComplete?: (result: SentimentAnalysisResponse['payload']) => void;
  onError?: (error: ErrorResponse['payload']) => void;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  processingTime: number;
}

interface BatchEmotionResult {
  results: EmotionAnalysis[];
  totalProcessed: number;
  averageProcessingTime: number;
  errors: Array<{ index: number; error: string }>;
}

interface AIWorkerHook {
  analyzeEmotion: (text: string) => Promise<EmotionAnalysis>;
  analyzeBatchEmotions: (texts: string[]) => Promise<BatchEmotionResult>;
  analyzeSentiment: (text: string) => Promise<SentimentResult>;
  isWorkerReady: () => boolean;
  getWorkerStatus: () => { ready: boolean; pendingRequests: number };
}

export function useAIWorker(options: UseAIWorkerOptions = {}): AIWorkerHook {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { 
    resolve: (result: any) => void; 
    reject: (error: Error) => void;
    type: 'emotion' | 'batch' | 'sentiment';
  }>>(new Map());

  // Inicializar worker
  useEffect(() => {
    const requests = pendingRequests.current;
    
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
        type: 'module'
      });
    }

    const handleMessage = (event: MessageEvent) => {
      const { type, payload, requestId } = event.data;
      const pendingRequest = requests.get(requestId);
      
      if (!pendingRequest) {
        console.warn('Received response for unknown request:', requestId);
        return;
      }
      
      const { resolve, reject } = pendingRequest;
      
      if (payload.error) {
        requests.delete(requestId);
        reject(new Error(payload.error));
        return;
      }
      
      switch (type) {
        case 'EMOTION_ANALYSIS_RESULT': {
          requests.delete(requestId);
          const emotionPayload = payload as EmotionAnalysisResponse['payload'];
          
          const emotionResult: EmotionAnalysis = {
            emotions: Object.entries(emotionPayload.emotions || {}).map(([label, score]) => ({
              label,
              score: Number(score)
            })),
            dominantEmotion: emotionPayload.dominantEmotion || 'neutral',
            confidence: emotionPayload.confidence,
            timestamp: new Date()
          };
          
          options.onEmotionAnalysisComplete?.(emotionPayload);
          resolve(emotionResult);
          break;
        }
        
        case 'BATCH_EMOTION_ANALYSIS_RESULT': {
          requests.delete(requestId);
          const batchPayload = payload as BatchEmotionAnalysisResponse['payload'];
          
          const results = batchPayload.results.map((result) => {
            return {
              emotions: Object.entries(result.emotions || {}).map(([label, score]) => ({
                label,
                score: Number(score)
              })),
              dominantEmotion: result.dominantEmotion || 'neutral',
              confidence: result.confidence,
              timestamp: new Date()
            } as EmotionAnalysis;
          });
          
          const batchResult: BatchEmotionResult = {
            results,
            totalProcessed: batchPayload.totalProcessed,
            averageProcessingTime: batchPayload.averageProcessingTime,
            errors: batchPayload.errors.map((error, index) => ({ index, error }))
          };
          
          options.onBatchAnalysisComplete?.(batchPayload);
          resolve(batchResult);
          break;
        }
        
        case 'SENTIMENT_ANALYSIS_RESULT': {
          requests.delete(requestId);
          const sentimentPayload = payload as SentimentAnalysisResponse['payload'];
          
          const sentimentResult: SentimentResult = {
            sentiment: sentimentPayload.sentiment,
            score: sentimentPayload.score,
            confidence: sentimentPayload.confidence,
            processingTime: sentimentPayload.processingTime
          };
          
          options.onSentimentAnalysisComplete?.(sentimentPayload);
          resolve(sentimentResult);
          break;
        }
        
        default:
          requests.delete(requestId);
          reject(new Error(`Tipo de respuesta no soportado: ${type}`));
      }
    };
    
    workerRef.current.onmessage = handleMessage;

    // Manejar errores del worker
    workerRef.current.onerror = (error) => {
      console.error('Error en AI Worker:', error);
      options.onError?.({
        message: 'Error en el Web Worker de IA'
      });
    };

    // Cleanup al desmontar
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      requests.clear();
    };
  }, [options]);

  // Función para analizar emociones
  const analyzeEmotion = useCallback(async (text: string): Promise<EmotionAnalysis> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      if (!text || text.trim().length === 0) {
        reject(new Error('El texto no puede estar vacío'));
        return;
      }

      const requestId = Math.random().toString(36).substr(2, 9);
      const request: EmotionAnalysisRequest = {
        type: 'ANALYZE_EMOTION',
        payload: { text: text.trim() },
        requestId
      };

      // Store the resolve/reject functions
      pendingRequests.current.set(requestId, { resolve, reject, type: 'emotion' });

      // Send request to worker
      workerRef.current.postMessage(request);

      // Set timeout for request
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Timeout: El análisis de emociones tardó demasiado'));
        }
      }, 30000); // 30 second timeout
    });
  }, []);

  // Función para analizar emociones en lote
  const analyzeBatchEmotions = useCallback(async (texts: string[]): Promise<BatchEmotionResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      if (!Array.isArray(texts) || texts.length === 0) {
        reject(new Error('Se requiere un array de textos no vacío'));
        return;
      }

      if (texts.length > 1000) {
        reject(new Error('Máximo 1000 textos por lote'));
        return;
      }

      const validTexts = texts.filter(text => text && text.trim().length > 0);
      if (validTexts.length === 0) {
        reject(new Error('No hay textos válidos para procesar'));
        return;
      }

      const requestId = Math.random().toString(36).substr(2, 9);
      const request: BatchEmotionAnalysisRequest = {
        type: 'ANALYZE_BATCH_EMOTIONS',
        payload: { texts: validTexts },
        requestId
      };

      // Store the resolve/reject functions
      pendingRequests.current.set(requestId, { resolve, reject, type: 'batch' });

      // Send request to worker
      workerRef.current.postMessage(request);

      // Set timeout for batch request (longer timeout)
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Timeout: El análisis en lote tardó demasiado'));
        }
      }, 120000); // 2 minute timeout for batch processing
    });
  }, []);

  // Función para analizar sentimientos
  const analyzeSentiment = useCallback(async (text: string): Promise<SentimentResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      if (!text || text.trim().length === 0) {
        reject(new Error('El texto no puede estar vacío'));
        return;
      }

      const requestId = Math.random().toString(36).substr(2, 9);
      const request: SentimentAnalysisRequest = {
        type: 'ANALYZE_SENTIMENT',
        payload: { text: text.trim() },
        requestId
      };

      // Store the resolve/reject functions
      pendingRequests.current.set(requestId, { resolve, reject, type: 'sentiment' });

      // Send request to worker
      workerRef.current.postMessage(request);

      // Set timeout for request
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Timeout: El análisis de sentimientos tardó demasiado'));
        }
      }, 30000); // 30 second timeout
    });
  }, []);

  // Función para verificar si el worker está disponible
  const isWorkerReady = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  // Función para obtener el estado del worker
  const getWorkerStatus = useCallback(() => {
    return {
      ready: workerRef.current !== null,
      pendingRequests: pendingRequests.current.size
    };
  }, []);

  return {
    analyzeEmotion,
    analyzeBatchEmotions,
    analyzeSentiment,
    isWorkerReady,
    getWorkerStatus
  };
};

export default useAIWorker;