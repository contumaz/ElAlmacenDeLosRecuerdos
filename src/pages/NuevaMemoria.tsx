import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Upload, 
  X,
  FileText,
  Image,
  Video,
  Tag,
  Heart
} from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import TagManager from '@/components/TagManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Badge from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/Layout/Layout';
import { THEMATIC_CATEGORIES } from '@/config/categories';
import { useMemories } from '@/hooks/use-memories-hook';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';
import { useValidation } from '@/hooks/useValidation';
import { useTranscription } from '@/hooks/useTranscription';
import { useSmartMemoization } from '@/hooks/useSmartMemoization';
import EmotionVisualization from '@/components/EmotionVisualization';
import { Memory } from '@/types';
import { FolderOpen } from 'lucide-react';
import AudioFileService from '@/services/AudioFileService';
import { toast } from 'sonner';



export function NuevaMemoria() {
  const navigate = useNavigate();
  const { saveMemory, selectSaveDirectory, saveFileToDirectory, setNavigating } = useMemories();
  
  const [memoryType, setMemoryType] = useState<Memory['type']>('texto');
  const [category, setCategory] = useState<string>(''); // Nueva categoría temática
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  
  // Hook de validación
  const {
    validateMemory,
    validateCreateMemory,
    validateTextInput,
    validateMediaFile,
    validationState
  } = useValidation();

  const {
    transcript,
    isTranscribing,
    startTranscription,
    stopTranscription,
    resetTranscript,
    hasRecognitionSupport,
  } = useTranscription();
  
  // Estado de grabación de audio (simplificado)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioTranscription, setAudioTranscription] = useState<string>('');
  const [audioEmotion, setAudioEmotion] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  // Hook de análisis emocional
  const {
    analyzeText,
    analyzeAudio,
    emotionHistory,
    isServiceReady
  } = useEmotionAnalysis();
  
  // Referencias para archivos y montaje
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Hook de memoización inteligente
  const { createMemoizedValue, createMemoizedCallback } = useSmartMemoization({
    ttl: 300000, // 5 minutos
    maxSize: 100,
    enableMetrics: true
  });

  // Memoización de validaciones complejas
  const memoizedValidation = createMemoizedValue(
    () => {
      if (!title.trim() || !content.trim()) return null;
      return {
        titleValid: title.trim().length >= 3 && title.trim().length <= 100,
        contentValid: content.trim().length >= 10,
        tagsValid: tags.length <= 10,
        categoryValid: category !== ''
      };
    },
    [title, content, tags, category],
    { key: 'validation-state' }
  );

  // Memoización de datos de memoria preparados
  const memoizedMemoryData = createMemoizedValue(
    () => ({
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      type: memoryType,
      tags,
      privacyLevel,
      filePath: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encryptionLevel: 'none' as const,
      metadata: {
        size: audioBlob?.size || content.length,
        format: memoryType === 'audio' ? 'audio/webm' : 'text/plain',
        emotion: audioEmotion || undefined,
        hasTranscription: !!audioTranscription,
        duration: memoryType === 'audio' ? (audioDuration > 0 ? audioDuration : 1) : undefined,
        savedDirectory: selectedDirectory || undefined,
        category: category || undefined
      }
    }),
    [title, content, memoryType, tags, privacyLevel, audioBlob, audioEmotion, audioTranscription, audioDuration, selectedDirectory, category],
    { key: 'memory-data' }
  );

  // Memoización de análisis emocional
  const memoizedEmotionAnalysis = createMemoizedValue(
    () => {
      if (!emotionHistory.length) return null;
      const latest = emotionHistory[emotionHistory.length - 1];
      return {
        emotion: latest.analysis.dominantEmotion,
        confidence: Math.round(latest.analysis.confidence * 100),
        timestamp: latest.analysis.timestamp
      };
    },
    [emotionHistory],
    { key: 'emotion-analysis' }
  );

  // Cleanup para evitar actualizaciones después del desmontaje
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      setContent(transcript);
    }
  }, [transcript]);

  // Callbacks memoizados
  const handleTagsChange = createMemoizedCallback(
    (newTags: string[]) => {
      setTags(newTags);
    },
    []
  );

  // Función para analizar emoción manualmente
  const handleAnalyzeEmotion = createMemoizedCallback(
    () => {
      if (content.trim() && isServiceReady) {
        analyzeText(content);
      }
    },
    [content, isServiceReady, analyzeText]
  );

  // Handler para cuando se completa la transcripción de audio
  const handleAudioTranscriptionComplete = createMemoizedCallback(
    async (transcription: string, blob: Blob, emotion?: string, duration?: number) => {
      setAudioBlob(blob);
      setAudioTranscription(transcription);
      setContent(transcription); // Auto-llenar contenido con transcripción
      if (emotion) {
        setAudioEmotion(emotion);
      }
      if (duration) {
        setAudioDuration(duration);
      }
      
      // Analizar emoción del audio transcrito
      if (transcription.trim() && isServiceReady) {
        try {
          await analyzeAudio(transcription);
        } catch (error) {
          console.error('Error al analizar emoción del audio:', error);
        }
      }
    },
    [isServiceReady, analyzeAudio]
  );

  // Seleccionar directorio de guardado
  const handleSelectDirectory = createMemoizedCallback(
    async () => {
      try {
        const directory = await selectSaveDirectory();
        if (directory) {
          setSelectedDirectory(directory);
        }
      } catch (error) {
        console.error('Error selecting directory:', error);
      }
    },
    [selectSaveDirectory]
  );



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileValidation = validateMediaFile(file);
      
      if (fileValidation.success) {
        console.log('File selected:', file);
        // Aquí manejarías la subida del archivo
      } else {
        alert(fileValidation.errors.join('\n'));
        // Limpiar el input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const analyzeEmotion = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeText(content);
    } catch (error) {
      console.error('Error al analizar emoción:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Análisis en tiempo real del contenido
  React.useEffect(() => {
    if (content.trim() && isServiceReady) {
      const timeoutId = setTimeout(() => {
        analyzeText(content);
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    }
  }, [content, isServiceReady, analyzeText]);

  // Validación en tiempo real del título
  React.useEffect(() => {
    if (title.trim()) {
      const timeoutId = setTimeout(() => {
        validateTextInput(title);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [title, validateTextInput]);

  // Validación en tiempo real del contenido
  React.useEffect(() => {
    if (content.trim()) {
      const timeoutId = setTimeout(() => {
        validateTextInput(content);
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    }
  }, [content, validateTextInput]);

  const handleSave = createMemoizedCallback(
    async () => {
      // Usar datos memoizados para mejor rendimiento
      const memoryData = { ...memoizedMemoryData };

      const validation = validateCreateMemory(memoryData);
      
      const validationResult = await validation;
      if (!validationResult.success) {
        alert('Errores de validación:\n' + validationResult.errors.join('\n'));
        return;
      }

      setIsSaving(true);
      try {
        let filePath = undefined;

        // Si hay audio grabado, guardarlo primero
        if (audioBlob && memoryType === 'audio') {
          const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.webm`;
          const savedPath = await saveFileToDirectory(audioBlob, fileName, selectedDirectory);
          if (savedPath) {
            filePath = savedPath;
          }
        }

        // Preparar datos finales de la memoria
        const finalMemoryData = {
          ...memoizedMemoryData,
          filePath: filePath || memoizedMemoryData.filePath,
          updatedAt: new Date().toISOString()
        };

        const success = await saveMemory(finalMemoryData);
        
        if (success) {
          // Si es una memoria de audio, guardar también en localStorage para reproducción
          if (audioBlob && memoryType === 'audio') {
            // Generar un ID temporal basado en timestamp si no existe
            const memoryId = memoryData.id || Date.now();
            await AudioFileService.saveAudioForPlayback(memoryId, audioBlob);
            console.log(`Audio guardado para reproducción con ID: ${memoryId}`);
          }
          
          // Marcar que se está navegando para prevenir actualizaciones de estado
          setNavigating(true);
          
          // Mostrar feedback inmediato
          toast.success('¡Memoria guardada exitosamente!');
          
          // Navegación inmediata forzando refresh completo
          window.location.href = '/memorias';
        } else if (isMountedRef.current) {
          toast.error('Error al guardar la memoria');
        }
      } catch (error) {
        console.error('Error saving memory:', error);
        toast.error('Error al guardar la memoria');
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [memoizedMemoryData, validateCreateMemory, audioBlob, memoryType, title, selectedDirectory, saveFileToDirectory, saveMemory, setNavigating, isMountedRef]
  );



  const breadcrumbs = [
    { label: 'Memorias', href: '/memorias' },
    { label: 'Nueva Memoria' }
  ];

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Nueva Memoria</h1>
            <p className="text-amber-600">Crea un nuevo recuerdo para tu almacén personal</p>
            {selectedDirectory && (
              <p className="text-sm text-gray-500 mt-1">
                Guardando en: {selectedDirectory.split('/').pop() || selectedDirectory}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSelectDirectory}
              variant="outline"
              size="sm"
              title="Seleccionar directorio donde guardar archivos"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {selectedDirectory ? 'Cambiar directorio' : 'Seleccionar directorio'}
            </Button>
          </div>
        </div>

        {/* Selección de tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Memoria</CardTitle>
            <CardDescription>Selecciona qué tipo de recuerdo quieres crear</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={memoryType} onValueChange={(value) => setMemoryType(value as Memory['type'])}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="texto" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Texto</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center space-x-2">
                  <Mic className="w-4 h-4" />
                  <span>Audio</span>
                </TabsTrigger>
                <TabsTrigger value="foto" className="flex items-center space-x-2">
                  <Image className="w-4 h-4" />
                  <span>Foto</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selección de categoría temática */}
        <Card>
          <CardHeader>
            <CardTitle>Categoría Temática</CardTitle>
            <CardDescription>Selecciona la categoría que mejor describe tu memoria</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {THEMATIC_CATEGORIES.map(category => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.icon} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Contenido para cada tipo */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={memoryType} onValueChange={(value) => setMemoryType(value as Memory['type'])}>
              <div className="mt-6">
                <TabsContent value="texto" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título de la memoria</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Mi primer día de escuela"
                      className={`mt-1 ${
                        validationState.errors.some(error => error.includes('title')) ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {validationState.errors.some(error => error.includes('title')) && (
                      <p className="text-red-500 text-sm mt-1">{validationState.errors.find(error => error.includes('title'))}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escribe tu recuerdo aquí..."
                      className={`mt-1 min-h-40 ${
                        validationState.errors.some(error => error.includes('content')) ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {validationState.errors.some(error => error.includes('content')) && (
                      <p className="text-red-500 text-sm mt-1">{validationState.errors.find(error => error.includes('content'))}</p>
                    )}
                    {validationState.warnings.some(warning => warning.includes('content')) && (
                      <p className="text-yellow-600 text-sm mt-1">{validationState.warnings.find(warning => warning.includes('content'))}</p>
                    )}
                  </div>
                  
                  {/* Controles de análisis emocional */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleAnalyzeEmotion}
                        disabled={!content.trim() || isAnalyzing || !isServiceReady}
                        variant="outline"
                      >
                        {isAnalyzing ? 'Analizando...' : 'Analizar Emoción'}
                      </Button>
                      
                      <Button
                        onClick={analyzeEmotion}
                        disabled={!isServiceReady}
                        variant="outline"
                        size="sm"
                      >
                        Analizar Emoción
                      </Button>
                    </div>
                    
                    {!isServiceReady && (
                      <p className="text-sm text-amber-600">Cargando servicio de análisis...</p>
                    )}
                  </div>
                  
                  {/* Mostrar emoción actual */}
                  {emotionHistory.length > 0 && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800">Última Emoción Detectada</h4>
                            <p className="text-lg font-bold text-blue-600">
                              {emotionHistory[emotionHistory.length - 1]?.analysis.dominantEmotion} ({Math.round((emotionHistory[emotionHistory.length - 1]?.analysis.confidence || 0) * 100)}%)
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-blue-100">
                            😊
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título de la grabación</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Recuerdos de la abuela"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <Button onClick={startTranscription} disabled={isTranscribing}>
                      <Mic className="mr-2 h-4 w-4" /> Iniciar Grabación
                    </Button>
                    <Button onClick={stopTranscription} disabled={!isTranscribing}>
                      <Square className="mr-2 h-4 w-4" /> Detener Grabación
                    </Button>
                    <Button onClick={resetTranscript} variant="ghost">
                      <X className="mr-2 h-4 w-4" /> Limpiar
                    </Button>
                  </div>

                  {isTranscribing && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
                      <Mic className="h-4 w-4 animate-pulse" />
                      <span>Grabando...</span>
                    </div>
                  )}

                  {!hasRecognitionSupport && (
                    <p className="mt-4 text-sm text-yellow-500">
                      Tu navegador no soporta el reconocimiento de voz.
                    </p>
                  )}

                  {/* Mostrar transcripción si existe */}
                  {transcript && (
                    <div className="mt-4">
                      <Label>Transcripción automática</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="La transcripción de tu audio aparecerá aquí..."
                        className="mt-1 h-32"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="foto" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título de la foto</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Cumpleaños de mamá"
                      className="mt-1"
                    />
                  </div>

                  {/* Área de subida de archivos */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="text-amber-700 mb-4">Selecciona una imagen desde tu dispositivo</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Seleccionar Foto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe la foto y los recuerdos asociados..."
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del video</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Vacaciones en la playa"
                      className="mt-1"
                    />
                  </div>

                  {/* Área de subida de videos */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="text-amber-700 mb-4">Selecciona un video desde tu dispositivo</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Seleccionar Video
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe el video y los recuerdos asociados..."
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Visualización de emociones */}
        {emotionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Análisis Emocional</CardTitle>
              <CardDescription>Historial y tendencias de emociones detectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionVisualization 
                showControls={true}
                height={300}
              />
            </CardContent>
          </Card>
        )}

        {/* Etiquetas y configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Adicional</CardTitle>
            <CardDescription>Añade etiquetas y configura la privacidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Etiquetas con TagManager */}
            <div>
              <Label>Etiquetas</Label>
              <TagManager
                selectedTags={tags}
                onTagsChange={handleTagsChange}
                placeholder="Añadir etiqueta..."
                className="mt-1"
              />
              {validationState.errors.some(error => error.includes('tag')) && (
                <p className="text-red-500 text-sm mt-1">{validationState.errors.find(error => error.includes('tag'))}</p>
              )}
              {validationState.warnings.some(warning => warning.includes('tag')) && (
                <p className="text-yellow-600 text-sm mt-1">{validationState.warnings.find(warning => warning.includes('tag'))}</p>
              )}
            </div>

            {/* Nivel de privacidad */}
            <div>
              <Label>Nivel de Privacidad</Label>
              <Select value={privacyLevel.toString()} onValueChange={(value) => setPrivacyLevel(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Privado - Solo yo</SelectItem>
                  <SelectItem value="2">Familiar - Familia cercana</SelectItem>
                  <SelectItem value="3">Íntimo - Personas de confianza</SelectItem>
                  <SelectItem value="4">Abierto - Todos los usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estado de validación general */}
        {(validationState.isValidating || Object.keys(validationState.errors).length > 0) && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {validationState.isValidating && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {validationState.isValidating ? 'Validando...' : 'Estado de Validación'}
                  </h4>
                  {Object.keys(validationState.errors).length > 0 && (
                    <p className="text-red-600 text-sm">
                      {Object.keys(validationState.errors).length} error(es) encontrado(s)
                    </p>
                  )}
                  {Object.keys(validationState.warnings).length > 0 && (
                    <p className="text-yellow-600 text-sm">
                      {Object.keys(validationState.warnings).length} advertencia(s)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/memorias')}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim() || isSaving || validationState.isValidating || Object.keys(validationState.errors).length > 0}
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
                Guardar Memoria
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
