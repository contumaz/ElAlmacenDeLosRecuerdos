import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Badge from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Download, 
  FileText,
  Heart,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  Volume2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import electronService from '@/services/electronAPI';
import { useMemories } from '@/hooks/use-memories-hook';

interface AudioRecorderProps {
  onTranscriptionComplete?: (transcription: string, audioBlob: Blob, emotion?: string, duration?: number) => void;
  maxDuration?: number; // en segundos
  showEmotionAnalysis?: boolean;
  autoTranscribe?: boolean;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  duration: number;
  audioBlob: Blob | null;
  transcription: string;
  emotion: string | { primary: string; confidence: number; emotions: any[] } | null;
  emotionConfidence: number;
  isProcessing: boolean;
  audioLevel: number;
  backupSaved: boolean;
}

const EmotionIcon = ({ emotion, confidence }: { emotion: string | null, confidence: number }) => {
  if (!emotion || confidence < 0.3) return <Meh className="w-4 h-4 text-gray-400" />;
  
  switch (emotion.toLowerCase()) {
    case 'joy':
    case 'happiness':
    case 'happy':
      return <Smile className="w-4 h-4 text-green-500" />;
    case 'sadness':
    case 'sad':
      return <Frown className="w-4 h-4 text-blue-500" />;
    case 'love':
    case 'affection':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'anger':
    case 'frustrated':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'fear':
    case 'nervous':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Meh className="w-4 h-4 text-gray-400" />;
  }
};

export default function AudioRecorder({
  onTranscriptionComplete,
  maxDuration = 300, // 5 minutos por defecto
  showEmotionAnalysis = true,
  autoTranscribe = true,
  className = ''
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isPlaying: false,
    duration: 0,
    audioBlob: null,
    transcription: '',
    emotion: null,
    emotionConfidence: 0,
    isProcessing: false,
    audioLevel: 0,
    backupSaved: false
  });

  const { selectSaveDirectory, saveFileToDirectory } = useMemories();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Función para limpiar recursos de audio
  const cleanupAudioResources = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.removeEventListener('ended', handleAudioEnded);
      audioElementRef.current.removeEventListener('error', handleAudioError);
      audioElementRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Función para analizar el nivel de audio en tiempo real
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcular el nivel promedio de audio
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalizar a 0-1
    
    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
    
    if (state.isRecording && !state.isPaused) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
    }
  }, [state.isRecording, state.isPaused]);

  // Función para configurar el análisis de audio
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Iniciar análisis
      analyzeAudioLevel();
    } catch (error) {
      console.error('Error configurando análisis de audio:', error);
    }
  }, [analyzeAudioLevel]);

  // Función para guardar copia de seguridad automática
  const saveBackup = useCallback(async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `grabacion-backup-${timestamp}.webm`;
      
      // Crear URL temporal para descarga
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setState(prev => ({ ...prev, backupSaved: true }));
      toast.success('Copia de seguridad guardada automáticamente');
    } catch (error) {
      console.error('Error guardando copia de seguridad:', error);
      toast.error('Error al guardar copia de seguridad');
    }
  }, []);

  // Detener grabación
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Limpiar recursos de reproducción si están activos
      if (state.isPlaying) {
        cleanupAudioResources();
      }
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false,
        isPlaying: false
      }));
    } catch (error) {
      console.error('Error al detener grabación:', error);
      toast.error('Error al detener la grabación');
    }
  }, [state.isPlaying, cleanupAudioResources]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopRecording();
      cleanupAudioResources();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopRecording, cleanupAudioResources]);

  // Manejadores de eventos de audio
  const handleAudioEnded = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleAudioError = (error: Event) => {
    console.error('Error en reproducción de audio:', error);
    setState(prev => ({ ...prev, isPlaying: false }));
    toast.error('Error al reproducir el audio');
  };

  // Iniciar grabación
  const startRecording = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Óptimo para reconocimiento de voz
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;

      mediaRecorder.start(1000); // Capturar datos cada segundo

      // Configurar análisis de audio en tiempo real
      setupAudioAnalysis(stream);

      // Iniciar temporizador
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1;
          
          // Detener automáticamente si se alcanza la duración máxima
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        isProcessing: false,
        duration: 0,
        transcription: '',
        emotion: null,
        emotionConfidence: 0,
        audioLevel: 0,
        backupSaved: false
      }));

      toast.success('🎙️ Grabación iniciada - Hablando se detecta el audio');
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      toast.error('Error al acceder al micrófono');
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Pausar/reanudar grabación
  const togglePause = () => {
    if (!mediaRecorderRef.current || !state.isRecording) {
      console.warn('No hay grabación activa para pausar/reanudar');
      return;
    }

    try {
      if (state.isPaused) {
        // Reanudar grabación
        if (mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
          
          // Reanudar temporizador solo si no está ya corriendo
          if (!timerRef.current) {
            timerRef.current = setInterval(() => {
              setState(prev => {
                const newDuration = prev.duration + 1;
                if (newDuration >= maxDuration) {
                  stopRecording();
                  return prev;
                }
                return { ...prev, duration: newDuration };
              });
            }, 1000);
          }
          
          setState(prev => ({ ...prev, isPaused: false }));
          toast.success('Grabación reanudada');
        }
      } else {
        // Pausar grabación
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
          
          // Pausar temporizador sin reiniciarlo
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setState(prev => ({ ...prev, isPaused: true }));
          toast.info('Grabación pausada');
        }
      }
    } catch (error) {
      console.error('Error al pausar/reanudar grabación:', error);
      toast.error('Error al pausar/reanudar la grabación');
    }
  };

  // Manejar fin de grabación
  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Guardar copia de seguridad automáticamente
    await saveBackup(audioBlob);
    
    setState(prev => ({ 
      ...prev, 
      audioBlob,
      isProcessing: autoTranscribe,
      audioLevel: 0
    }));

    // Transcribir automáticamente si está habilitado
    if (autoTranscribe) {
      await transcribeAudio(audioBlob);
    }

    toast.success(`Grabación completada (${formatTime(state.duration)})`);
  };

  // Transcribir audio
  const transcribeAudio = async (audioBlob?: Blob) => {
    const blob = audioBlob || state.audioBlob;
    if (!blob) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Mock de transcripción para desarrollo (reemplazar con servicio real)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
      
      const mockTranscription = 'Transcripción simulada del audio grabado. Esta funcionalidad será implementada con el servicio de transcripción real.';
      setState(prev => ({ ...prev, transcription: mockTranscription }));

      // Mock de análisis de emociones si está habilitado
      if (showEmotionAnalysis) {
        const mockEmotions = ['joy', 'neutral', 'calm', 'excited', 'focused'];
        const randomEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
        const mockConfidence = 0.7 + Math.random() * 0.3; // 70-100%
        
        setState(prev => ({ 
          ...prev, 
          emotion: randomEmotion,
          emotionConfidence: mockConfidence
        }));
      }

      // Callback con resultados
      if (onTranscriptionComplete) {
        const emotionString = typeof state.emotion === 'string' 
          ? state.emotion 
          : state.emotion?.primary || undefined;
        
        onTranscriptionComplete(
          mockTranscription, 
          blob, 
          emotionString,
          state.duration
        );
      }

      toast.success('Transcripción completada (modo simulación)');
    } catch (error) {
      console.error('Error en transcripción:', error);
      toast.error('Error al procesar la transcripción');
      setState(prev => ({ ...prev, transcription: 'Error en transcripción' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Reproducir/pausar audio
  const togglePlayback = async () => {
    if (!state.audioBlob) return;

    try {
      if (state.isPlaying) {
        // Pausar reproducción
        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        // Iniciar reproducción
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        
        audioUrlRef.current = URL.createObjectURL(state.audioBlob);
        audioElementRef.current = new Audio(audioUrlRef.current);
        
        audioElementRef.current.addEventListener('ended', handleAudioEnded);
        audioElementRef.current.addEventListener('error', handleAudioError);
        
        await audioElementRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error en reproducción:', error);
      setState(prev => ({ ...prev, isPlaying: false }));
      toast.error('Error al reproducir el audio');
    }
  };

  // Descargar audio
  const downloadAudio = async () => {
    if (!state.audioBlob) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `grabacion-${timestamp}.webm`;
      
      // Usar hook para guardar archivo
      const success = await saveFileToDirectory(state.audioBlob, filename);
      
      if (success) {
        toast.success('Audio guardado exitosamente');
      } else {
        // Fallback: descarga directa
        const url = URL.createObjectURL(state.audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Audio descargado');
      }
    } catch (error) {
      console.error('Error descargando audio:', error);
      toast.error('Error al descargar el audio');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Descargar transcripción
  const downloadTranscription = async () => {
    if (!state.transcription) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `transcripcion-${timestamp}.txt`;
      const content = `Transcripción de Audio\n\nFecha: ${new Date().toLocaleString()}\nDuración: ${formatTime(state.duration)}\n\n${state.transcription}`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const success = await saveFileToDirectory(blob, filename);
      
      if (success) {
        toast.success('Transcripción guardada exitosamente');
      } else {
        // Fallback: descarga directa
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Transcripción descargada');
      }
    } catch (error) {
      console.error('Error descargando transcripción:', error);
      toast.error('Error al descargar la transcripción');
    }
  };

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular progreso
  const progress = (state.duration / maxDuration) * 100;

  // Componente de visualización de forma de onda
  const WaveformVisualizer = () => {
    const bars = Array.from({ length: 20 }, (_, i) => {
      const height = state.isRecording && !state.isPaused 
        ? Math.max(20, state.audioLevel * 100 + Math.random() * 30) 
        : 20;
      return (
        <div
          key={i}
          className={`bg-gradient-to-t ${
            state.isRecording && !state.isPaused
              ? 'from-green-400 to-green-600 animate-pulse'
              : 'from-gray-300 to-gray-400'
          } rounded-full transition-all duration-150`}
          style={{
            width: '4px',
            height: `${height}px`,
            animationDelay: `${i * 50}ms`
          }}
        />
      );
    });

    return (
      <div className="flex items-center justify-center gap-1 h-20 bg-gray-50 rounded-lg p-4">
        {bars}
      </div>
    );
  };

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-orange-500" />
          Grabador de Audio Inteligente
          {state.isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              {state.isPaused ? '⏸️ Pausado' : '🔴 Grabando'}
            </Badge>
          )}
          {state.backupSaved && (
            <Badge variant="secondary" className="ml-2">
              <Save className="w-3 h-3 mr-1" />
              Guardado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Indicador de estado de grabación */}
        {state.isRecording && (
          <div className={`p-4 rounded-lg border-2 ${
            state.isPaused 
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className={`w-5 h-5 ${
                state.isPaused ? 'text-yellow-600' : 'text-green-600 animate-pulse'
              }`} />
              <span className="font-semibold">
                {state.isPaused 
                  ? '⏸️ Grabación pausada - Presiona play para continuar'
                  : '🎙️ Grabación activa - Se está detectando el audio'}
              </span>
            </div>
            <WaveformVisualizer />
          </div>
        )}

        {/* Estado y controles principales */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!state.isRecording ? (
              <Button
                onClick={startRecording}
                disabled={state.isProcessing}
                size="lg"
                className="bg-red-500 hover:bg-red-600"
              >
                <Mic className="w-4 h-4 mr-2" />
                Iniciar Grabación
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={togglePause}
                  variant="outline"
                  size="lg"
                  className={state.isPaused ? 'bg-green-50 hover:bg-green-100' : 'bg-yellow-50 hover:bg-yellow-100'}
                >
                  {state.isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Reanudar
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Detener y Guardar
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">
              {formatTime(state.duration)}
            </div>
            <div className="text-sm text-gray-500">
              Máx: {formatTime(maxDuration)}
            </div>
            {state.isRecording && (
              <div className="text-xs text-blue-600 mt-1">
                Nivel: {Math.round(state.audioLevel * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0:00</span>
            <span>{formatTime(maxDuration)}</span>
          </div>
        </div>

        {/* Controles de reproducción y descarga */}
        {state.audioBlob && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Save className="w-3 h-3 mr-1" />
                Copia de seguridad disponible
              </Badge>
              <span className="text-sm text-gray-600">
                Duración: {formatTime(state.duration)}
              </span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={togglePlayback}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100"
              >
                {state.isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Reproducir
                  </>
                )}
              </Button>
              
              <Button
                onClick={downloadAudio}
                variant="outline"
                size="sm"
                title="Descargar audio"
                className="bg-purple-50 hover:bg-purple-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>

              {state.transcription && (
                <Button
                  onClick={downloadTranscription}
                  variant="outline"
                  size="sm"
                  title="Guardar transcripción"
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar texto
                </Button>
              )}
              
              {!autoTranscribe && (
                <Button
                  onClick={() => transcribeAudio()}
                  disabled={state.isProcessing}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Transcribir
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Procesamiento */}
        {state.isProcessing && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700">
              {state.isRecording ? 'Preparando grabación...' : 'Procesando audio...'}
            </span>
          </div>
        )}

        {/* Análisis de emociones */}
        {showEmotionAnalysis && state.emotion && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <EmotionIcon emotion={typeof state.emotion === 'string' ? state.emotion : state.emotion?.primary || 'neutral'} confidence={state.emotionConfidence} />
            <span className="text-sm">
              <strong>Emoción detectada:</strong> {typeof state.emotion === 'string' ? state.emotion : state.emotion?.primary || 'neutral'}
            </span>
            <Badge variant="secondary" className="ml-auto">
              {Math.round(state.emotionConfidence * 100)}% confianza
            </Badge>
          </div>
        )}

        {/* Transcripción */}
        {state.transcription && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transcripción:
            </label>
            <Textarea
              value={state.transcription}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                transcription: e.target.value 
              }))}
              placeholder="La transcripción aparecerá aquí..."
              className="min-h-24"
            />
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Calidad óptima: Habla claramente cerca del micrófono</p>
          <p>• La transcripción y análisis se procesan localmente</p>
          <p>• Duración máxima: {formatTime(maxDuration)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { AudioRecorder };
