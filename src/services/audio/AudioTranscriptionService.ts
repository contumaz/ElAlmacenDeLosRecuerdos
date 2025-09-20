/**
 * Servicio de Transcripción de Audio para Electron API
 * Maneja la transcripción de audio usando Web Speech API como fallback
 */

import { APIResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export class AudioTranscriptionService {
  private electronAPI: any = null;
  private recognition: any = null;
  private isListening: boolean = false;

  constructor(electronAPI: any) {
    this.electronAPI = electronAPI;
    this.initializeWebSpeechAPI();
  }

  /**
   * Inicializa la Web Speech API para modo web
   */
  private initializeWebSpeechAPI(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES';
      }
    }
  }

  /**
   * Verifica si Electron está disponible
   */
  isElectronAvailable(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Verifica si la Web Speech API está disponible
   */
  isWebSpeechAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Transcribe un archivo de audio
   */
  async transcribeAudio(audioPath: string): Promise<APIResponse<{ text: string }>> {
    loggingService.info('Iniciando transcripción de audio', 'AudioTranscriptionService', { audioPath });
    
    if (!this.electronAPI) {
      // En modo web, no podemos transcribir archivos directamente
      // Solo podemos usar reconocimiento de voz en tiempo real
      loggingService.warn('Transcripción de archivos no disponible en modo web', 'AudioTranscriptionService');
      return {
        success: false,
        error: 'La transcripción de archivos de audio no está disponible en modo web. Use el reconocimiento de voz en tiempo real.'
      };
    }
    
    try {
      const result = await this.electronAPI.audio.transcribeAudio(audioPath);
      if (result.success) {
        loggingService.info('Audio transcrito exitosamente', 'AudioTranscriptionService', {
          audioPath,
          textLength: result.data?.text?.length || 0
        });
      } else {
        loggingService.warn('Fallo en la transcripción de audio', 'AudioTranscriptionService', {
          audioPath,
          error: result.error
        });
      }
      return result;
    } catch (error) {
      console.error('Error transcribiendo audio:', error);
      loggingService.error(
        'Error transcribiendo audio', 
        error instanceof Error ? error : new Error('Error transcribiendo audio'), 
        'AudioTranscriptionService', 
        {
          audioPath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return {
        success: false,
        error: 'Error interno durante la transcripción'
      };
    }
  }

  /**
   * Inicia el reconocimiento de voz en tiempo real (Web Speech API)
   */
  async startVoiceRecognition(): Promise<APIResponse<{ sessionId: string }>> {
    loggingService.info('Iniciando reconocimiento de voz', 'AudioTranscriptionService');
    
    if (!this.isWebSpeechAvailable()) {
      loggingService.error(
        'Web Speech API no disponible', 
        new Error('Web Speech API no está disponible en este navegador'), 
        'AudioTranscriptionService'
      );
      return {
        success: false,
        error: 'El reconocimiento de voz no está disponible en este navegador'
      };
    }
    
    if (this.isListening) {
      loggingService.warn('El reconocimiento de voz ya está activo', 'AudioTranscriptionService');
      return {
        success: false,
        error: 'El reconocimiento de voz ya está activo'
      };
    }
    
    try {
      // Si tenemos Electron API, usarla
      if (this.electronAPI) {
        const result = await this.electronAPI.audio.startVoiceRecognition();
        if (result.success) {
          loggingService.info('Reconocimiento de voz iniciado (Electron)', 'AudioTranscriptionService', {
            sessionId: result.data?.sessionId
          });
        }
        return result;
      }
      
      // Fallback a Web Speech API
      return new Promise((resolve) => {
        const sessionId = `web_speech_${Date.now()}`;
        
        this.recognition.onstart = () => {
          this.isListening = true;
          loggingService.info('Reconocimiento de voz iniciado (Web Speech API)', 'AudioTranscriptionService', {
            sessionId
          });
          resolve({
            success: true,
            data: { sessionId },
            message: 'Reconocimiento de voz iniciado'
          });
        };
        
        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          loggingService.error(
            'Error en reconocimiento de voz', 
            new Error(`Web Speech API error: ${event.error}`), 
            'AudioTranscriptionService', 
            { sessionId, errorType: event.error }
          );
          resolve({
            success: false,
            error: `Error en reconocimiento de voz: ${event.error}`
          });
        };
        
        this.recognition.start();
      });
    } catch (error) {
      console.error('Error iniciando reconocimiento de voz:', error);
      loggingService.error(
        'Error iniciando reconocimiento de voz', 
        error instanceof Error ? error : new Error('Error iniciando reconocimiento de voz'), 
        'AudioTranscriptionService'
      );
      return {
        success: false,
        error: 'Error interno al iniciar el reconocimiento de voz'
      };
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  async stopVoiceRecognition(): Promise<APIResponse<{ text: string }>> {
    loggingService.info('Deteniendo reconocimiento de voz', 'AudioTranscriptionService');
    
    try {
      // Si tenemos Electron API, usarla
      if (this.electronAPI) {
        const result = await this.electronAPI.audio.stopVoiceRecognition();
        if (result.success) {
          loggingService.info('Reconocimiento de voz detenido (Electron)', 'AudioTranscriptionService', {
            textLength: result.data?.text?.length || 0
          });
        }
        return result;
      }
      
      // Fallback a Web Speech API
      if (!this.isListening) {
        loggingService.warn('El reconocimiento de voz no está activo', 'AudioTranscriptionService');
        return {
          success: false,
          error: 'El reconocimiento de voz no está activo'
        };
      }
      
      return new Promise((resolve) => {
        let finalTranscript = '';
        
        this.recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
        };
        
        this.recognition.onend = () => {
          this.isListening = false;
          loggingService.info('Reconocimiento de voz detenido (Web Speech API)', 'AudioTranscriptionService', {
            textLength: finalTranscript.length
          });
          resolve({
            success: true,
            data: { text: finalTranscript.trim() },
            message: 'Reconocimiento de voz completado'
          });
        };
        
        this.recognition.stop();
      });
    } catch (error) {
      console.error('Error deteniendo reconocimiento de voz:', error);
      loggingService.error(
        'Error deteniendo reconocimiento de voz', 
        error instanceof Error ? error : new Error('Error deteniendo reconocimiento de voz'), 
        'AudioTranscriptionService'
      );
      return {
        success: false,
        error: 'Error interno al detener el reconocimiento de voz'
      };
    }
  }

  /**
   * Obtiene el estado actual del reconocimiento de voz
   */
  getRecognitionStatus(): { isListening: boolean; isAvailable: boolean } {
    return {
      isListening: this.isListening,
      isAvailable: this.isWebSpeechAvailable() || this.isElectronAvailable()
    };
  }

  /**
   * Configura el idioma para el reconocimiento de voz
   */
  setRecognitionLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
      loggingService.info('Idioma de reconocimiento configurado', 'AudioTranscriptionService', { language });
    }
  }

  /**
   * Obtiene los idiomas soportados para reconocimiento de voz
   */
  getSupportedLanguages(): string[] {
    // Lista de idiomas comúnmente soportados por Web Speech API
    return [
      'es-ES', // Español (España)
      'es-MX', // Español (México)
      'es-AR', // Español (Argentina)
      'en-US', // Inglés (Estados Unidos)
      'en-GB', // Inglés (Reino Unido)
      'fr-FR', // Francés
      'de-DE', // Alemán
      'it-IT', // Italiano
      'pt-BR', // Portugués (Brasil)
      'pt-PT'  // Portugués (Portugal)
    ];
  }
}