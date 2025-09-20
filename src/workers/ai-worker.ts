// Web Worker para procesamiento de IA en background
// Evita bloquear el hilo principal durante análisis emocional
// Versión mejorada con procesamiento en lote y análisis avanzado

// Interfaces para comunicación con el Web Worker
export interface EmotionAnalysisRequest {
  type: 'ANALYZE_EMOTION';
  payload: {
    text: string;
  };
  requestId: string;
}

export interface BatchEmotionAnalysisRequest {
  type: 'ANALYZE_BATCH_EMOTIONS';
  payload: {
    texts: string[];
  };
  requestId: string;
}

export interface SentimentAnalysisRequest {
  type: 'ANALYZE_SENTIMENT';
  payload: {
    text: string;
  };
  requestId: string;
}

export interface EmotionAnalysisResponse {
  type: 'EMOTION_ANALYSIS_RESULT';
  payload: {
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
      trust: number;
      anticipation: number;
    };
    dominantEmotion: string;
    confidence: number;
    processingTime: number;
  };
  requestId: string;
}

export interface BatchEmotionAnalysisResponse {
  type: 'BATCH_EMOTION_ANALYSIS_RESULT';
  payload: {
    results: {
      text: string;
      emotions: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        disgust: number;
        trust: number;
        anticipation: number;
      };
      dominantEmotion: string;
      confidence: number;
    }[];
    totalProcessed: number;
    averageProcessingTime: number;
    processingTime: number;
    errors: string[];
  };
  requestId: string;
}

export interface SentimentAnalysisResponse {
  type: 'SENTIMENT_ANALYSIS_RESULT';
  payload: {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    processingTime: number;
  };
  requestId: string;
}

export interface ProgressResponse {
  type: 'PROGRESS';
  payload: {
    current: number;
    total: number;
    message: string;
  };
  requestId: string;
}

export interface ErrorResponse {
  type: 'ERROR';
  payload: {
    message: string;
    stack?: string;
  };
  requestId: string;
}

export type WorkerMessage = EmotionAnalysisRequest | BatchEmotionAnalysisRequest | SentimentAnalysisRequest;
export type WorkerResponse = EmotionAnalysisResponse | BatchEmotionAnalysisResponse | SentimentAnalysisResponse | ProgressResponse | ErrorResponse;

// Diccionario expandido de palabras clave emocionales
const emotionKeywords = {
  joy: [
    // Español
    'feliz', 'alegre', 'contento', 'dichoso', 'eufórico', 'gozoso', 'radiante', 'jubiloso',
    'satisfecho', 'pleno', 'exultante', 'regocijado', 'animado', 'entusiasmado',
    // Inglés
    'happy', 'joy', 'glad', 'cheerful', 'delighted', 'ecstatic', 'elated', 'euphoric',
    'blissful', 'content', 'pleased', 'thrilled', 'excited', 'upbeat'
  ],
  sadness: [
    // Español
    'triste', 'melancólico', 'deprimido', 'desanimado', 'abatido', 'doliente', 'pesaroso',
    'afligido', 'desconsolado', 'lamentable', 'nostálgico', 'sombrio', 'decaído',
    // Inglés
    'sad', 'depressed', 'melancholy', 'gloomy', 'sorrowful', 'mournful', 'dejected',
    'downcast', 'blue', 'heartbroken', 'grief', 'despair', 'miserable'
  ],
  anger: [
    // Español
    'enojado', 'furioso', 'molesto', 'irritado', 'iracundo', 'colérico', 'indignado',
    'rabioso', 'airado', 'enfurecido', 'exasperado', 'hostil', 'agresivo',
    // Inglés
    'angry', 'mad', 'furious', 'irritated', 'annoyed', 'enraged', 'livid',
    'outraged', 'hostile', 'aggressive', 'wrathful', 'incensed', 'irate'
  ],
  fear: [
    // Español
    'miedo', 'temor', 'asustado', 'nervioso', 'temeroso', 'aterrado', 'pánico',
    'angustiado', 'inquieto', 'preocupado', 'ansioso', 'espantado', 'horrorizado',
    // Inglés
    'afraid', 'scared', 'fear', 'terrified', 'frightened', 'anxious', 'worried',
    'nervous', 'panicked', 'alarmed', 'apprehensive', 'uneasy', 'dread'
  ],
  surprise: [
    // Español
    'sorprendido', 'asombrado', 'impresionado', 'estupefacto', 'pasmado', 'atónito',
    'boquiabierto', 'maravillado', 'desconcertado', 'perplejo',
    // Inglés
    'surprised', 'amazed', 'astonished', 'stunned', 'shocked', 'bewildered',
    'astounded', 'flabbergasted', 'dumbfounded', 'startled', 'taken aback'
  ],
  disgust: [
    // Español
    'asco', 'repugnancia', 'disgusto', 'náusea', 'aversión', 'repulsión',
    'desprecio', 'desdén', 'hastío', 'fastidio',
    // Inglés
    'disgust', 'repulsive', 'revolting', 'nauseating', 'sickening', 'loathing',
    'contempt', 'disdain', 'abhorrence', 'revulsion'
  ],
  trust: [
    // Español
    'confianza', 'seguro', 'tranquilo', 'sereno', 'confiado', 'esperanzado',
    'optimista', 'positivo', 'seguridad', 'fe', 'credibilidad',
    // Inglés
    'trust', 'confident', 'secure', 'calm', 'peaceful', 'hopeful',
    'optimistic', 'positive', 'faith', 'belief', 'reliable'
  ],
  anticipation: [
    // Español
    'expectativa', 'esperanza', 'anticipación', 'ilusión', 'anhelo', 'deseo',
    'ansia', 'ganas', 'emoción', 'expectante', 'impaciente',
    // Inglés
    'anticipation', 'hope', 'expectation', 'eagerness', 'excitement', 'longing',
    'yearning', 'desire', 'looking forward', 'eager', 'impatient'
  ]
};

// Palabras de intensidad para ajustar puntuaciones
const intensityWords = {
  high: ['muy', 'extremadamente', 'increíblemente', 'sumamente', 'tremendamente', 'enormemente',
         'very', 'extremely', 'incredibly', 'tremendously', 'enormously', 'utterly'],
  medium: ['bastante', 'algo', 'un poco', 'moderadamente', 'relativamente',
           'quite', 'somewhat', 'rather', 'moderately', 'relatively'],
  low: ['apenas', 'ligeramente', 'levemente', 'poco', 'slightly', 'barely', 'mildly']
};

// Función mejorada de análisis emocional
function analyzeEmotion(text: string) {
  const startTime = performance.now();
  
  if (!text || text.trim().length === 0) {
    return {
      emotions: {
        joy: 0, sadness: 0, anger: 0, fear: 0,
        surprise: 0, disgust: 0, trust: 0, anticipation: 0
      },
      dominantEmotion: 'neutral',
      confidence: 0,
      processingTime: performance.now() - startTime
    };
  }

  const words = text.toLowerCase().split(/\s+/);
  const emotions = {
    joy: 0, sadness: 0, anger: 0, fear: 0,
    surprise: 0, disgust: 0, trust: 0, anticipation: 0
  };

  // Analizar cada palabra
  words.forEach((word, index) => {
    // Buscar coincidencias emocionales
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const matchStrength = keywords.reduce((strength, keyword) => {
        if (word.includes(keyword)) {
          return Math.max(strength, keyword.length / word.length);
        }
        return strength;
      }, 0);

      if (matchStrength > 0) {
        let intensity = 1;
        
        // Verificar palabras de intensidad cercanas
        const contextWords = words.slice(Math.max(0, index - 2), index + 3);
        contextWords.forEach(contextWord => {
          if (intensityWords.high.some(iw => contextWord.includes(iw))) {
            intensity = 1.5;
          } else if (intensityWords.medium.some(iw => contextWord.includes(iw))) {
            intensity = 1.2;
          } else if (intensityWords.low.some(iw => contextWord.includes(iw))) {
            intensity = 0.7;
          }
        });

        emotions[emotion as keyof typeof emotions] += matchStrength * intensity;
      }
    });
  });

  // Normalizar puntuaciones
  const totalWords = Math.max(words.length, 1);
  Object.keys(emotions).forEach(emotion => {
    emotions[emotion as keyof typeof emotions] = 
      Math.min(emotions[emotion as keyof typeof emotions] / totalWords, 1);
  });

  // Encontrar emoción dominante
  const emotionEntries = Object.entries(emotions);
  const dominantEntry = emotionEntries.reduce((a, b) => 
    emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
  );
  
  const dominantEmotion = dominantEntry[0];
  const confidence = emotions[dominantEmotion as keyof typeof emotions];
  const processingTime = performance.now() - startTime;

  return {
    emotions,
    dominantEmotion,
    confidence: Math.min(confidence * 1.5, 1), // Ajustar confianza
    processingTime
  };
}

// Función de análisis de sentimientos
function analyzeSentiment(text: string) {
  const startTime = performance.now();
  
  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral' as const,
      score: 0,
      confidence: 0,
      processingTime: performance.now() - startTime
    };
  }

  const positiveWords = [
    // Español
    'bueno', 'excelente', 'fantástico', 'maravilloso', 'perfecto', 'increíble',
    'genial', 'estupendo', 'magnífico', 'extraordinario', 'fabuloso', 'espectacular',
    // Inglés
    'good', 'excellent', 'fantastic', 'wonderful', 'perfect', 'amazing',
    'great', 'awesome', 'magnificent', 'extraordinary', 'fabulous', 'spectacular'
  ];

  const negativeWords = [
    // Español
    'malo', 'terrible', 'horrible', 'pésimo', 'awful', 'desastroso',
    'lamentable', 'deplorable', 'nefasto', 'catastrófico', 'espantoso',
    // Inglés
    'bad', 'terrible', 'horrible', 'awful', 'disastrous', 'deplorable',
    'dreadful', 'appalling', 'atrocious', 'catastrophic', 'ghastly'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;

  words.forEach(word => {
    positiveWords.forEach(posWord => {
      if (word.includes(posWord)) {
        positiveScore += posWord.length / word.length;
      }
    });
    
    negativeWords.forEach(negWord => {
      if (word.includes(negWord)) {
        negativeScore += negWord.length / word.length;
      }
    });
  });

  const totalScore = positiveScore + negativeScore;
  const netScore = (positiveScore - negativeScore) / Math.max(words.length, 1);
  
  let sentiment: 'positive' | 'negative' | 'neutral';
  let confidence: number;

  if (Math.abs(netScore) < 0.1) {
    sentiment = 'neutral';
    confidence = 1 - Math.abs(netScore) * 10;
  } else if (netScore > 0) {
    sentiment = 'positive';
    confidence = Math.min(netScore * 5, 1);
  } else {
    sentiment = 'negative';
    confidence = Math.min(Math.abs(netScore) * 5, 1);
  }

  return {
    sentiment,
    score: netScore,
    confidence,
    processingTime: performance.now() - startTime
  };
}

// Función de procesamiento en lote
function analyzeBatchEmotions(texts: string[], requestId: string) {
  const startTime = performance.now();
  const results = [];
  const errors: string[] = [];
  let totalProcessingTime = 0;
  
  for (let i = 0; i < texts.length; i++) {
    // Enviar progreso cada 10 elementos o en el último
    if (i % 10 === 0 || i === texts.length - 1) {
      const progressResponse: ProgressResponse = {
        type: 'PROGRESS',
        payload: {
          current: i + 1,
          total: texts.length,
          message: `Procesando texto ${i + 1} de ${texts.length}`
        },
        requestId
      };
      self.postMessage(progressResponse);
    }
    
    try {
      const textStartTime = performance.now();
      const analysis = analyzeEmotion(texts[i]);
      const textProcessingTime = performance.now() - textStartTime;
      totalProcessingTime += textProcessingTime;
      
      results.push({
        text: texts[i],
        emotions: analysis.emotions,
        dominantEmotion: analysis.dominantEmotion,
        confidence: analysis.confidence
      });
    } catch (error) {
      errors.push(`Error procesando texto ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      // Agregar resultado por defecto en caso de error
      results.push({
        text: texts[i],
        emotions: {
          joy: 0, sadness: 0, anger: 0, fear: 0,
          surprise: 0, disgust: 0, trust: 0, anticipation: 0
        },
        dominantEmotion: 'neutral',
        confidence: 0
      });
    }
  }
  
  const processingTime = performance.now() - startTime;
  const averageProcessingTime = results.length > 0 ? totalProcessingTime / results.length : 0;
  
  return {
    results,
    totalProcessed: results.length,
    averageProcessingTime,
    processingTime,
    errors
  };
}

// Escuchar mensajes del hilo principal
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, requestId } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_EMOTION': {
        const { text } = payload;
        const result = analyzeEmotion(text);
        
        const response: EmotionAnalysisResponse = {
          type: 'EMOTION_ANALYSIS_RESULT',
          payload: result,
          requestId
        };
        
        self.postMessage(response);
        break;
      }
      
      case 'ANALYZE_BATCH_EMOTIONS': {
        const { texts } = payload;
        
        if (!Array.isArray(texts) || texts.length === 0) {
          throw new Error('Se requiere un array de textos no vacío');
        }
        
        if (texts.length > 1000) {
          throw new Error('Máximo 1000 textos por lote');
        }
        
        const result = analyzeBatchEmotions(texts, requestId);
        
        const response: BatchEmotionAnalysisResponse = {
          type: 'BATCH_EMOTION_ANALYSIS_RESULT',
          payload: {
            results: result.results,
            totalProcessed: result.totalProcessed,
            averageProcessingTime: result.averageProcessingTime,
            processingTime: result.processingTime,
            errors: result.errors
          },
          requestId
        };
        
        self.postMessage(response);
        break;
      }
      
      case 'ANALYZE_SENTIMENT': {
        const { text } = payload;
        const result = analyzeSentiment(text);
        
        const response: SentimentAnalysisResponse = {
          type: 'SENTIMENT_ANALYSIS_RESULT',
          payload: result,
          requestId
        };
        
        self.postMessage(response);
        break;
      }
      
      default:
        throw new Error(`Tipo de mensaje no soportado: ${type}`);
    }
  } catch (error) {
    console.error('Error en AI Worker:', error);
    
    const errorResponse: ErrorResponse = {
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Error desconocido en el procesamiento',
        stack: error instanceof Error ? error.stack : undefined
      },
      requestId
    };
    
    self.postMessage(errorResponse);
  }
});

// Manejar errores no capturados
self.addEventListener('error', (event) => {
  console.error('Error no capturado en AI Worker:', event.error);
  
  const errorResponse: ErrorResponse = {
    type: 'ERROR',
    payload: {
      message: 'Error crítico en el Web Worker',
      stack: event.error?.stack
    },
    requestId: 'unknown'
  };
  
  self.postMessage(errorResponse);
});

// Manejar promesas rechazadas
self.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada en AI Worker:', event.reason);
  
  const errorResponse: ErrorResponse = {
    type: 'ERROR',
    payload: {
      message: 'Error en promesa no manejada',
      stack: event.reason?.stack
    },
    requestId: 'unknown'
  };
  
  self.postMessage(errorResponse);
  
  // Prevenir que el error se propague
  event.preventDefault();
});

// Mensaje de inicialización
console.log('🤖 AI Worker inicializado correctamente');
console.log('📊 Funcionalidades disponibles:');
console.log('  - Análisis emocional individual');
console.log('  - Análisis emocional en lote');
console.log('  - Análisis de sentimientos');
console.log('  - Procesamiento con indicadores de progreso');

// Los tipos ya están exportados arriba