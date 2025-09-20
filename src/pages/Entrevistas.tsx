import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Mic, 
  MicOff, 
  Send, 
  Pause,
  Play,
  Square,
  Bot,
  User,
  Heart,
  Clock,
  Volume2,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout } from '@/components/Layout/Layout';
import { Interview, ConversationResponse, EmotionAnalysis } from '@/types';
import AIChat from '@/components/AIChat';
import AdaptiveInterview from '@/components/AdaptiveInterview';

interface ActiveInterview {
  id: string;
  title: string;
  currentQuestion: string;
  questionIndex: number;
  totalQuestions: number;
  responses: ConversationResponse[];
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  emotionalProfile: EmotionAnalysis;
}

export function Entrevistas() {
  const navigate = useNavigate();
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterview, setActiveInterview] = useState<ActiveInterview | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewTemplate, setInterviewTemplate] = useState('general');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeInterview?.responses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInterviews = async () => {
    // Simular carga de entrevistas desde la API
    const mockInterviews: Interview[] = [
      {
        id: 1,
        title: 'Mi infancia en el pueblo',
        description: 'Recuerdos de la niñez y familia',
        questions: ['¿Dónde creciste?', '¿Quién fue tu mejor amigo?'],
        responses: [],
        duration: 1800,
        status: 'completed',
        emotionalProfile: {
          primary: 'nostalgia',
          confidence: 0.8,
          emotions: { joy: 0.3, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.1, love: 0.4, nostalgia: 0.8 }
        },
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:30:00Z'
      }
    ];
    setInterviews(mockInterviews);
  };

  const interviewTemplates = {
    general: {
      name: 'Entrevista General',
      description: 'Preguntas generales sobre la vida',
      questions: [
        '¿Podrías contarme sobre tu lugar de nacimiento y cómo era cuando eras niño/a?',
        '¿Quién ha sido la persona más importante en tu vida y por qué?',
        '¿Cuál es tu recuerdo más feliz de la infancia?',
        '¿Qué tradiciones familiares recuerdas con más cariño?',
        '¿Hay alguna lección de vida que quisieras compartir con las futuras generaciones?'
      ]
    },
    familia: {
      name: 'Historia Familiar',
      description: 'Enfocado en la familia y ancestros',
      questions: [
        '¿Qué sabes sobre tus abuelos y bisabuelos?',
        '¿Cómo se conocieron tus padres?',
        '¿Qué recuerdos tienes de las reuniones familiares?',
        '¿Hay alguna historia familiar que se cuente de generación en generación?',
        '¿Qué valores familiares consideras más importantes?'
      ]
    },
    juventud: {
      name: 'Juventud y Formación',
      description: 'Sobre la juventud, estudios y primeros trabajos',
      questions: [
        '¿Cómo fue tu experiencia en la escuela?',
        '¿Cuál fue tu primer trabajo?',
        '¿Qué planes tenías para tu futuro cuando eras joven?',
        '¿Hubo algún momento que cambió el curso de tu vida?',
        '¿Qué consejos le darías a tu yo más joven?'
      ]
    }
  };

  const startNewInterview = () => {
    const template = interviewTemplates[interviewTemplate as keyof typeof interviewTemplates];
    const newInterview: ActiveInterview = {
      id: `interview_${Date.now()}`,
      title: `${template.name} - ${new Date().toLocaleDateString('es-ES')}`,
      currentQuestion: template.questions[0],
      questionIndex: 0,
      totalQuestions: template.questions.length,
      responses: [],
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      emotionalProfile: {
        primary: 'neutral',
        confidence: 0,
        emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, love: 0, nostalgia: 0 }
      }
    };
    
    setActiveInterview(newInterview);
  };

  const startRecording = async () => {
    if (!activeInterview) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        
        // Procesar la respuesta de audio
        await processAudioResponse(audioBlob);
      };
      
      mediaRecorder.start();
      setActiveInterview(prev => prev ? { ...prev, isRecording: true, recordingTime: 0 } : null);
      
      // Contador de tiempo
      recordingIntervalRef.current = setInterval(() => {
        setActiveInterview(prev => prev ? { ...prev, recordingTime: prev.recordingTime + 1 } : null);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error al acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && activeInterview?.isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setActiveInterview(prev => prev ? { ...prev, isRecording: false } : null);
    }
  };

  const processAudioResponse = async (audioBlob: Blob) => {
    if (!activeInterview) return;

    setIsLoading(true);
    try {
      // Simular transcripción y análisis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTranscription = "Esta es una transcripción simulada de la respuesta de audio. Contiene recuerdos emotivos y significativos.";
      const mockEmotion: EmotionAnalysis = {
        primary: 'nostalgia',
        confidence: 0.75,
        emotions: { joy: 0.2, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.05, love: 0.3, nostalgia: 0.75 }
      };

      const response: ConversationResponse = {
        question: activeInterview.currentQuestion,
        answer: mockTranscription,
        audioFile: `audio_${Date.now()}.wav`,
        emotion: mockEmotion,
        timestamp: new Date().toISOString()
      };

      // Añadir respuesta y generar siguiente pregunta
      const updatedResponses = [...activeInterview.responses, response];
      const nextQuestionIndex = activeInterview.questionIndex + 1;
      
      if (nextQuestionIndex < activeInterview.totalQuestions) {
        const template = interviewTemplates[interviewTemplate as keyof typeof interviewTemplates];
        const nextQuestion = await generateFollowUpQuestion(response, template.questions[nextQuestionIndex]);
        
        setActiveInterview(prev => prev ? {
          ...prev,
          responses: updatedResponses,
          currentQuestion: nextQuestion,
          questionIndex: nextQuestionIndex,
          recordingTime: 0
        } : null);
      } else {
        // Entrevista completa
        await saveInterview(updatedResponses);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFollowUpQuestion = async (lastResponse: ConversationResponse, baseQuestion: string): Promise<string> => {
    // Simular generación de pregunta de seguimiento con IA
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const followUps = [
      `Muy interesante. ${baseQuestion}`,
      `Me gustaría profundizar más. ${baseQuestion}`,
      `Eso me recuerda... ${baseQuestion}`,
      `Continuando con esa idea, ${baseQuestion.toLowerCase()}`
    ];
    
    return followUps[Math.floor(Math.random() * followUps.length)];
  };

  const sendTextResponse = async () => {
    if (!activeInterview || !messageInput.trim()) return;

    const mockEmotion: EmotionAnalysis = {
      primary: 'joy',
      confidence: 0.6,
      emotions: { joy: 0.6, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.1, love: 0.2, nostalgia: 0.0 }
    };

    const response: ConversationResponse = {
      question: activeInterview.currentQuestion,
      answer: messageInput.trim(),
      emotion: mockEmotion,
      timestamp: new Date().toISOString()
    };

    const updatedResponses = [...activeInterview.responses, response];
    const nextQuestionIndex = activeInterview.questionIndex + 1;
    
    if (nextQuestionIndex < activeInterview.totalQuestions) {
      const template = interviewTemplates[interviewTemplate as keyof typeof interviewTemplates];
      const nextQuestion = await generateFollowUpQuestion(response, template.questions[nextQuestionIndex]);
      
      setActiveInterview(prev => prev ? {
        ...prev,
        responses: updatedResponses,
        currentQuestion: nextQuestion,
        questionIndex: nextQuestionIndex
      } : null);
    } else {
      await saveInterview(updatedResponses);
    }

    setMessageInput('');
  };

  const saveInterview = async (responses: ConversationResponse[]) => {
    // Simular guardado de entrevista
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('¡Entrevista completada y guardada exitosamente!');
    setActiveInterview(null);
    loadInterviews();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      joy: 'bg-yellow-100 text-yellow-800',
      love: 'bg-pink-100 text-pink-800',
      nostalgia: 'bg-purple-100 text-purple-800',
      sadness: 'bg-blue-100 text-blue-800',
      neutral: 'bg-gray-100 text-gray-800'
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  if (activeInterview) {
    return (
      <Layout breadcrumbs={[{ label: 'Entrevistas', href: '/entrevistas' }, { label: 'Entrevista Activa' }]}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header de entrevista activa */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>{activeInterview.title}</span>
                  </CardTitle>
                  <CardDescription>
                    Pregunta {activeInterview.questionIndex + 1} de {activeInterview.totalQuestions}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">Duración total</p>
                  <p className="font-semibold">
                    {formatTime(activeInterview.responses.reduce((total, r) => total + (r.audioFile ? 60 : 30), 0))}
                  </p>
                </div>
              </div>
              <Progress 
                value={(activeInterview.questionIndex + 1) / activeInterview.totalQuestions * 100} 
                className="mt-4"
              />
            </CardHeader>
          </Card>

          {/* Chat de conversación */}
          <Card className="h-96">
            <CardContent className="p-0 h-full flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Pregunta actual de la IA */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-blue-900">{activeInterview.currentQuestion}</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">IA · Ahora</p>
                    </div>
                  </div>

                  {/* Respuestas anteriores */}
                  {activeInterview.responses.map((response, index) => (
                    <div key={index} className="space-y-4">
                      {/* Pregunta anterior */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-900">{response.question}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Respuesta del usuario */}
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="flex-1 text-right">
                          <div className="bg-amber-100 rounded-lg p-3 inline-block max-w-md">
                            <p className="text-amber-900">{response.answer}</p>
                            {response.audioFile && (
                              <div className="flex items-center justify-end space-x-2 mt-2">
                                <Volume2 className="w-4 h-4 text-amber-600" />
                                <span className="text-xs text-amber-600">Audio grabado</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <Badge className={getEmotionColor(response.emotion.primary)}>
                              {response.emotion.primary}
                            </Badge>
                            <p className="text-xs text-amber-600">
                              {new Date(response.timestamp).toLocaleTimeString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Controles de respuesta */}
              <div className="border-t p-4 space-y-4">
                {/* Grabación de audio */}
                <div className="flex items-center justify-center space-x-4">
                  {!activeInterview.isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Responder con Audio
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-red-600">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                        <span className="font-semibold">{formatTime(activeInterview.recordingTime)}</span>
                      </div>
                      <Button onClick={stopRecording} variant="destructive">
                        <Square className="w-4 h-4 mr-2" />
                        Detener
                      </Button>
                    </div>
                  )}
                </div>

                {/* Respuesta por texto */}
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="O escribe tu respuesta aquí..."
                    onKeyPress={(e) => e.key === 'Enter' && sendTextResponse()}
                    disabled={isLoading || activeInterview.isRecording}
                  />
                  <Button 
                    onClick={sendTextResponse}
                    disabled={!messageInput.trim() || isLoading || activeInterview.isRecording}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {isLoading && (
                  <div className="text-center text-amber-600">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>Procesando respuesta...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbs={[{ label: 'Entrevistas' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Entrevistas con IA</h1>
            <p className="text-amber-600">
              Crea conversaciones guiadas para capturar tus recuerdos más importantes
            </p>
          </div>
        </div>

        {/* Entrevista Inteligente con IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-500" />
              <span>Entrevista Inteligente</span>
              <Badge className="bg-purple-100 text-purple-800 text-xs">Nuevo</Badge>
            </CardTitle>
            <CardDescription>
              Conversación adaptativa con IA que se ajusta a tus emociones y respuestas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIChat
              mode="interview"
              userProfile={{
                name: 'Usuario',
                preferredTopics: ['familia', 'infancia', 'carrera'],
                emotionalProfile: 'balanced'
              }}
              onMemoryGenerated={(memory) => {
                console.log('Memoria generada:', memory);
                // Aquí se podría integrar con el sistema de memorias
              }}
              autoStart={false}
              suggestedQuestions={[
                "¿Cuál es tu primer recuerdo de la infancia?",
                "Háblame de tu familia",
                "¿Cuál ha sido tu mayor logro?",
                "¿Qué consejo darías a tu yo más joven?"
              ]}
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Entrevista Adaptativa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Entrevista Adaptativa</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Inteligente</Badge>
            </CardTitle>
            <CardDescription>
              Sistema avanzado que adapta las preguntas según tus respuestas y emociones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdaptiveInterview
              initialProfile={{
                name: 'Usuario',
                emotionalProfile: 'balanced',
                preferredStyle: 'empathetic',
                interests: ['familia', 'viajes', 'trabajo']
              }}
              onComplete={(answers, profile) => {
                console.log('Entrevista completada:', answers, profile);
                // Aquí se podrían guardar las respuestas como memorias
              }}
              onSaveProgress={(answers, currentQuestion) => {
                console.log('Progreso guardado:', answers.length, currentQuestion);
              }}
              maxQuestions={10}
              autoSave={true}
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Nueva entrevista */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nueva Entrevista</span>
            </CardTitle>
            <CardDescription>
              Selecciona un tipo de entrevista para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={interviewTemplate} onValueChange={setInterviewTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interviewTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-gray-600">{template.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">
                Vista previa de preguntas:
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {interviewTemplates[interviewTemplate as keyof typeof interviewTemplates].questions.slice(0, 3).map((question, index) => (
                  <li key={index}>• {question}</li>
                ))}
                {interviewTemplates[interviewTemplate as keyof typeof interviewTemplates].questions.length > 3 && (
                  <li className="text-amber-600">
                    ... y {interviewTemplates[interviewTemplate as keyof typeof interviewTemplates].questions.length - 3} preguntas más
                  </li>
                )}
              </ul>
            </div>

            <Button onClick={startNewInterview} className="w-full bg-amber-600 hover:bg-amber-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comenzar Entrevista
            </Button>
          </CardContent>
        </Card>

        {/* Entrevistas anteriores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Entrevistas Anteriores</span>
            </CardTitle>
            <CardDescription>
              Revisa y gestiona tus entrevistas completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-amber-300 mx-auto mb-3" />
                <p className="text-amber-600 mb-3">Aún no tienes entrevistas realizadas</p>
                <p className="text-sm text-amber-500">Comienza tu primera entrevista para crear recuerdos duraderos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.id} className="border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">{interview.title}</h4>
                        <p className="text-sm text-amber-600">{interview.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-amber-500">
                            {new Date(interview.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          <span className="text-xs text-amber-500">
                            {Math.floor(interview.duration / 60)} minutos
                          </span>
                          <Badge className={getEmotionColor(interview.emotionalProfile.primary)}>
                            {interview.emotionalProfile.primary}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
