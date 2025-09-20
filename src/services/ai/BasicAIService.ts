/**
 * Servicio de IA Básica para Electron API
 * Maneja funciones básicas de IA como análisis de emociones, chat y generación de preguntas
 */

import { APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export interface EmotionAnalysisResult {
  emotion: string;
  confidence: number;
  emotions: { [key: string]: number };
}

export interface ChatResponse {
  response: string;
  context?: string;
}

export interface QuestionGenerationResult {
  questions: string[];
  topic?: string;
}

export class BasicAIService {
  private electronAPI: any = null;

  constructor(electronAPI: any) {
    this.electronAPI = electronAPI;
  }

  /**
   * Verifica si Electron está disponible
   */
  isElectronAvailable(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Analiza las emociones en un texto
   */
  async analyzeEmotion(text: string): Promise<APIResponse<EmotionAnalysisResult>> {
    loggingService.info('Iniciando análisis de emociones', 'BasicAIService', {
      textLength: text.length
    });
    
    if (!this.electronAPI) {
      // Fallback básico para modo web usando análisis de palabras clave
      try {
        const result = this.basicEmotionAnalysis(text);
        loggingService.info('Análisis de emociones completado (modo web)', 'BasicAIService', {
          emotion: result.emotion,
          confidence: result.confidence
        });
        return {
          success: true,
          data: result,
          message: 'Análisis de emociones completado (análisis básico)'
        };
      } catch (error) {
        console.error('Error en análisis básico de emociones:', error);
        loggingService.error(
          'Error en análisis básico de emociones', 
          error instanceof Error ? error : new Error('Error en análisis básico de emociones'), 
          'BasicAIService'
        );
        return {
          success: false,
          error: 'Error en el análisis de emociones'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.ai.analyzeEmotion(text);
      if (result.success) {
        loggingService.info('Análisis de emociones completado', 'BasicAIService', {
          emotion: result.data?.emotion,
          confidence: result.data?.confidence
        });
      } else {
        loggingService.warn('Fallo en análisis de emociones', 'BasicAIService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error analizando emociones:', error);
      loggingService.error(
        'Error analizando emociones', 
        error instanceof Error ? error : new Error('Error analizando emociones'), 
        'BasicAIService', 
        {
          textLength: text.length,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno en el análisis de emociones'
      };
    }
  }

  /**
   * Análisis básico de emociones usando palabras clave (fallback)
   */
  private basicEmotionAnalysis(text: string): EmotionAnalysisResult {
    const emotionKeywords = {
      alegria: ['feliz', 'contento', 'alegre', 'divertido', 'emocionado', 'genial', 'fantástico', 'maravilloso', 'excelente'],
      tristeza: ['triste', 'deprimido', 'melancólico', 'desanimado', 'abatido', 'dolido', 'lamentable', 'desafortunado'],
      enojo: ['enojado', 'furioso', 'molesto', 'irritado', 'indignado', 'rabioso', 'frustrado', 'enfadado'],
      miedo: ['miedo', 'asustado', 'temeroso', 'nervioso', 'ansioso', 'preocupado', 'inquieto', 'aterrado'],
      sorpresa: ['sorprendido', 'asombrado', 'impresionado', 'inesperado', 'increíble', 'wow', 'impactante'],
      neutral: ['normal', 'regular', 'común', 'ordinario', 'típico', 'estándar']
    };
    
    const textLower = text.toLowerCase();
    const emotions: { [key: string]: number } = {};
    
    // Contar coincidencias de palabras clave
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
      emotions[emotion] = count;
    }
    
    // Encontrar la emoción dominante
    let dominantEmotion = 'neutral';
    let maxCount = 0;
    
    for (const [emotion, count] of Object.entries(emotions)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    }
    
    // Calcular confianza basada en la densidad de palabras emocionales
    const totalWords = text.split(/\s+/).length;
    const confidence = Math.min(maxCount / totalWords * 2, 1); // Máximo 1.0
    
    // Normalizar puntuaciones
    const totalEmotions = Object.values(emotions).reduce((sum, count) => sum + count, 0);
    const normalizedEmotions: { [key: string]: number } = {};
    
    for (const [emotion, count] of Object.entries(emotions)) {
      normalizedEmotions[emotion] = totalEmotions > 0 ? count / totalEmotions : 0;
    }
    
    return {
      emotion: dominantEmotion,
      confidence: confidence,
      emotions: normalizedEmotions
    };
  }

  /**
   * Realiza una consulta de chat básica
   */
  async chat(message: string, context?: string): Promise<APIResponse<ChatResponse>> {
    loggingService.info('Iniciando chat', 'BasicAIService', {
      messageLength: message.length,
      hasContext: !!context
    });
    
    if (!this.electronAPI) {
      // Fallback básico para modo web con respuestas predefinidas
      try {
        const response = this.basicChatResponse(message);
        loggingService.info('Chat completado (modo web)', 'BasicAIService', {
          responseLength: response.response.length
        });
        return {
          success: true,
          data: response,
          message: 'Respuesta generada (modo básico)'
        };
      } catch (error) {
        console.error('Error en chat básico:', error);
        loggingService.error(
          'Error en chat básico', 
          error instanceof Error ? error : new Error('Error en chat básico'), 
          'BasicAIService'
        );
        return {
          success: false,
          error: 'Error en el chat'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.ai.chat(message, context);
      if (result.success) {
        loggingService.info('Chat completado', 'BasicAIService', {
          responseLength: result.data?.response?.length || 0
        });
      } else {
        loggingService.warn('Fallo en chat', 'BasicAIService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error en chat:', error);
      loggingService.error(
        'Error en chat', 
        error instanceof Error ? error : new Error('Error en chat'), 
        'BasicAIService', 
        {
          messageLength: message.length,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno en el chat'
      };
    }
  }

  /**
   * Respuesta básica de chat usando patrones predefinidos (fallback)
   */
  private basicChatResponse(message: string): ChatResponse {
    const messageLower = message.toLowerCase();
    
    // Patrones de respuesta básicos
    const patterns = [
      {
        keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos'],
        responses: [
          '¡Hola! ¿En qué puedo ayudarte hoy?',
          '¡Saludos! Estoy aquí para asistirte.',
          '¡Hola! ¿Cómo puedo ser de ayuda?'
        ]
      },
      {
        keywords: ['gracias', 'muchas gracias', 'te agradezco'],
        responses: [
          '¡De nada! Siempre es un placer ayudar.',
          'No hay de qué. ¿Necesitas algo más?',
          '¡Con gusto! Estoy aquí cuando me necesites.'
        ]
      },
      {
        keywords: ['ayuda', 'ayúdame', 'necesito ayuda'],
        responses: [
          'Por supuesto, estoy aquí para ayudarte. ¿Qué necesitas?',
          '¡Claro! Cuéntame en qué puedo asistirte.',
          'Estoy listo para ayudar. ¿Cuál es tu consulta?'
        ]
      },
      {
        keywords: ['adiós', 'hasta luego', 'nos vemos', 'chau'],
        responses: [
          '¡Hasta luego! Que tengas un buen día.',
          '¡Nos vemos! Vuelve cuando necesites ayuda.',
          '¡Adiós! Fue un placer ayudarte.'
        ]
      }
    ];
    
    // Buscar patrón coincidente
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (messageLower.includes(keyword)) {
          const randomResponse = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
          return {
            response: randomResponse,
            context: 'basic_pattern_match'
          };
        }
      }
    }
    
    // Respuesta por defecto
    const defaultResponses = [
      'Entiendo tu mensaje. ¿Podrías ser más específico sobre lo que necesitas?',
      'Interesante. ¿Puedes contarme más detalles?',
      'Comprendo. ¿Hay algo específico en lo que pueda ayudarte?',
      'Gracias por compartir eso conmigo. ¿Qué más te gustaría saber?'
    ];
    
    return {
      response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      context: 'default_response'
    };
  }

  /**
   * Genera preguntas basadas en un tema o texto
   */
  async generateQuestions(topic: string, count: number = 5): Promise<APIResponse<QuestionGenerationResult>> {
    loggingService.info('Generando preguntas', 'BasicAIService', {
      topic: topic.substring(0, 50) + '...',
      count
    });
    
    if (!this.electronAPI) {
      // Fallback básico para modo web
      try {
        const result = this.basicQuestionGeneration(topic, count);
        loggingService.info('Preguntas generadas (modo web)', 'BasicAIService', {
          questionCount: result.questions.length
        });
        return {
          success: true,
          data: result,
          message: 'Preguntas generadas (modo básico)'
        };
      } catch (error) {
        console.error('Error generando preguntas básicas:', error);
        loggingService.error(
          'Error generando preguntas básicas', 
          error instanceof Error ? error : new Error('Error generando preguntas básicas'), 
          'BasicAIService'
        );
        return {
          success: false,
          error: 'Error generando preguntas'
        };
      }
    }
    
    try {
      const result = await this.electronAPI.ai.generateQuestions(topic, count);
      if (result.success) {
        loggingService.info('Preguntas generadas', 'BasicAIService', {
          questionCount: result.data?.questions?.length || 0
        });
      } else {
        loggingService.warn('Fallo generando preguntas', 'BasicAIService', {
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error generando preguntas:', error);
      loggingService.error(
        'Error generando preguntas', 
        error instanceof Error ? error : new Error('Error generando preguntas'), 
        'BasicAIService', 
        {
          topic: topic.substring(0, 50),
          count,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno generando preguntas'
      };
    }
  }

  /**
   * Generación básica de preguntas usando plantillas (fallback)
   */
  private basicQuestionGeneration(topic: string, count: number): QuestionGenerationResult {
    const questionTemplates = [
      `¿Qué opinas sobre ${topic}?`,
      `¿Cuál es tu experiencia con ${topic}?`,
      `¿Cómo te hace sentir ${topic}?`,
      `¿Qué aspectos de ${topic} te interesan más?`,
      `¿Qué has aprendido sobre ${topic}?`,
      `¿Cuáles son los beneficios de ${topic}?`,
      `¿Qué desafíos has enfrentado con ${topic}?`,
      `¿Cómo describirías ${topic} a alguien más?`,
      `¿Qué te motivó a interesarte en ${topic}?`,
      `¿Qué cambiarías sobre ${topic}?`
    ];
    
    // Seleccionar preguntas aleatorias sin repetir
    const selectedQuestions: string[] = [];
    const availableTemplates = [...questionTemplates];
    
    for (let i = 0; i < Math.min(count, availableTemplates.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableTemplates.length);
      selectedQuestions.push(availableTemplates[randomIndex]);
      availableTemplates.splice(randomIndex, 1);
    }
    
    return {
      questions: selectedQuestions,
      topic: topic
    };
  }
}