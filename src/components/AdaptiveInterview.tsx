import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Badge from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft,
  Save, 
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Brain,
  Heart,
  User,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import electronService from '@/services/electronAPI';
import AudioRecorder from '@/components/AudioRecorder';

interface Question {
  id: string;
  text: string;
  category: string;
  followUps: string[];
  importance: number; // 1-10
  adaptivePrompts: {
    emotional: string[];
    contextual: string[];
    deepening: string[];
  };
}

interface Answer {
  questionId: string;
  question: string;
  text: string;
  audioBlob?: Blob;
  emotion?: string;
  emotionConfidence?: number;
  timestamp: Date;
  category: string;
  followUpGenerated?: string;
  aiInsights?: string[];
}

interface UserProfile {
  name: string;
  age?: number;
  interests: string[];
  emotionalProfile: 'reserved' | 'expressive' | 'balanced';
  preferredStyle: 'casual' | 'formal' | 'empathetic';
  completedCategories: string[];
  currentThemes: string[];
}

interface AdaptiveInterviewProps {
  initialProfile?: Partial<UserProfile>;
  onComplete?: (answers: Answer[], profile: UserProfile) => void;
  onSaveProgress?: (answers: Answer[], currentQuestion: number) => void;
  maxQuestions?: number;
  className?: string;
  autoSave?: boolean;
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'childhood_first',
    text: '¿Cuál es tu primer recuerdo de la infancia que viene a tu mente?',
    category: 'infancia',
    followUps: [
      '¿Qué edad tenías aproximadamente?',
      '¿Qué sentiste en ese momento?',
      '¿Quién más estaba contigo?'
    ],
    importance: 9,
    adaptivePrompts: {
      emotional: ['Noto cierta nostalgia en tu respuesta...', 'Parece que fue un momento muy especial...'],
      contextual: ['Esa época de tu vida suena fascinante...', 'Los recuerdos de la infancia son tan vívidos...'],
      deepening: ['¿Hay algo más de esa memoria que te gustaría compartir?', '¿Cómo crees que ese momento te marcó?']
    }
  },
  {
    id: 'family_parents',
    text: 'Háblame de tus padres. ¿Cómo los describirías?',
    category: 'familia',
    followUps: [
      '¿Qué aprendiste de cada uno?',
      '¿Cuál fue la lección más importante que te dieron?',
      '¿En qué te pareces a ellos?'
    ],
    importance: 10,
    adaptivePrompts: {
      emotional: ['Se nota el cariño cuando hablas de ellos...', 'Parece que tuviste una relación muy especial...'],
      contextual: ['Las relaciones familiares son tan importantes...', 'Cada familia tiene su propia dinámica...'],
      deepening: ['¿Hay alguna tradición familiar que recuerdes especialmente?', '¿Qué valores te transmitieron?']
    }
  },
  {
    id: 'achievements_proud',
    text: '¿Cuál ha sido el logro del que te sientes más orgulloso/a en tu vida?',
    category: 'logros',
    followUps: [
      '¿Qué obstáculos tuviste que superar?',
      '¿Quién te apoyó en el camino?',
      '¿Cómo cambió eso tu perspectiva?'
    ],
    importance: 8,
    adaptivePrompts: {
      emotional: ['Se nota el orgullo en tu voz...', 'Debe haber sido un momento muy satisfactorio...'],
      contextual: ['Los logros personales son únicos para cada persona...', 'El esfuerzo siempre vale la pena...'],
      deepening: ['¿Qué te motivó a perseguir ese objetivo?', '¿Celebraste de alguna manera especial?']
    }
  },
  {
    id: 'challenges_overcome',
    text: '¿Cuál ha sido el mayor desafío que has superado y cómo lo lograste?',
    category: 'desafios',
    followUps: [
      '¿Qué aprendiste de esa experiencia?',
      '¿Cambió tu forma de ver las dificultades?',
      '¿A quién acudiste en busca de apoyo?'
    ],
    importance: 9,
    adaptivePrompts: {
      emotional: ['Admiro tu fortaleza...', 'Debe haber sido muy difícil...'],
      contextual: ['Los desafíos nos hacen más fuertes...', 'Cada obstáculo es una oportunidad de crecimiento...'],
      deepening: ['¿Qué recursos internos descubriste?', '¿Cómo te ayudó esa experiencia en situaciones posteriores?']
    }
  },
  {
    id: 'love_relationships',
    text: 'Cuéntame sobre el amor en tu vida. ¿Cómo ha sido tu experiencia con las relaciones importantes?',
    category: 'amor',
    followUps: [
      '¿Qué has aprendido sobre el amor?',
      '¿Cuál fue tu primera gran historia de amor?',
      '¿Qué consejo darías sobre las relaciones?'
    ],
    importance: 8,
    adaptivePrompts: {
      emotional: ['El amor es una fuerza tan poderosa...', 'Se nota la emoción cuando hablas de esto...'],
      contextual: ['Las relaciones moldean mucho de quienes somos...', 'Cada historia de amor es única...'],
      deepening: ['¿Qué te ha enseñado el amor sobre ti mismo/a?', '¿Hay algún momento especial que recuerdes?']
    }
  }
];

export default function AdaptiveInterview({
  initialProfile = {},
  onComplete,
  onSaveProgress,
  maxQuestions = 15,
  className = '',
  autoSave = true
}: AdaptiveInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: initialProfile.name || 'Usuario',
    interests: initialProfile.interests || [],
    emotionalProfile: initialProfile.emotionalProfile || 'balanced',
    preferredStyle: initialProfile.preferredStyle || 'empathetic',
    completedCategories: [],
    currentThemes: [],
    ...initialProfile
  });

  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState<'intro' | 'questions' | 'followup' | 'complete'>('intro');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<string[]>([]);
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [pendingEmotion, setPendingEmotion] = useState<string | undefined>(undefined);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const generateAdaptiveQuestion = useCallback(async () => {
    setIsGeneratingNext(true);
    
    try {
      const result = await electronService.generateQuestions('interview', 1);
      
      if (result.success && result.question) {
        // Crear pregunta adaptativa basada en la respuesta de la IA
        const adaptiveQuestion: Question = {
          id: `adaptive_${Date.now()}`,
          text: result.question,
          category: result.category || 'general',
          followUps: [],
          importance: 7,
          adaptivePrompts: {
            emotional: ['Gracias por compartir eso conmigo...'],
            contextual: ['Es muy interesante lo que me cuentas...'],
            deepening: ['¿Te gustaría contarme más sobre eso?']
          }
        };

        // Insertar la pregunta adaptativa
        setQuestions(prev => {
          const newQuestions = [...prev];
          const insertIndex = Math.min(currentQuestionIndex + 1, newQuestions.length);
          newQuestions.splice(insertIndex, 0, adaptiveQuestion);
          return newQuestions;
        });
      }
    } catch (error) {
      console.error('Error generando pregunta adaptativa:', error);
    } finally {
      setIsGeneratingNext(false);
    }
  }, [currentQuestionIndex]);

  const initializeInterview = useCallback(async () => {
    setQuestions(DEFAULT_QUESTIONS);
    setInterviewPhase('questions');
    
    // Generar primera pregunta personalizada si es posible
    await generateAdaptiveQuestion();
  }, [generateAdaptiveQuestion]);

  // Inicialización
  useEffect(() => {
    initializeInterview();
  }, [initializeInterview]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [answers, currentQuestionIndex]);

  // Auto-save
  useEffect(() => {
    if (autoSave && answers.length > 0) {
      const timer = setTimeout(() => {
        onSaveProgress?.(answers, currentQuestionIndex);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [answers, currentQuestionIndex, autoSave, onSaveProgress]);

  const analyzeAnswer = async (answerText: string) => {
    setIsAnalyzing(true);
    
    try {
      // Análisis emocional
      const emotionResult = await electronService.analyzeEmotion(answerText);
      
      let emotion, emotionConfidence;
      if (emotionResult.success) {
        emotion = emotionResult.emotion;
        emotionConfidence = emotionResult.confidence;
        
        // Actualizar perfil emocional del usuario
        updateUserProfile(emotion, answerText);
      }

      return { emotion, emotionConfidence };
    } catch (error) {
      console.error('Error analizando respuesta:', error);
      return {};
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateUserProfile = (emotion: string, answerText: string) => {
    setUserProfile(prev => {
      const newProfile = { ...prev };
      
      // Actualizar temas actuales basado en palabras clave
      const keywords = extractKeywords(answerText);
      newProfile.currentThemes = [...new Set([...prev.currentThemes, ...keywords])].slice(-10);
      
      // Actualizar categorías completadas
      const currentCategory = getCurrentQuestion()?.category;
      if (currentCategory && !prev.completedCategories.includes(currentCategory)) {
        newProfile.completedCategories = [...prev.completedCategories, currentCategory];
      }
      
      return newProfile;
    });
  };

  const extractKeywords = (text: string): string[] => {
    const keywords = [
      'familia', 'madre', 'padre', 'hermano', 'hermana', 'hijo', 'hija',
      'trabajo', 'carrera', 'profesión', 'estudio', 'universidad',
      'amor', 'pareja', 'matrimonio', 'novio', 'novia',
      'viaje', 'aventura', 'vacaciones', 'país', 'ciudad',
      'música', 'arte', 'deporte', 'afición', 'hobby',
      'amistad', 'amigo', 'amiga', 'compañero',
      'casa', 'hogar', 'barrio', 'pueblo', 'ciudad'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).slice(0, 3);
  };

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Analizar respuesta (solo si no hay emoción pendiente del audio)
    const analysis = pendingEmotion ? { emotion: pendingEmotion, emotionConfidence: 0.8 } : await analyzeAnswer(currentAnswer);

    // Crear respuesta
    const answer: Answer = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      text: currentAnswer.trim(),
      timestamp: new Date(),
      category: currentQuestion.category,
      emotion: analysis.emotion,
      emotionConfidence: analysis.emotionConfidence,
      ...(pendingAudioBlob && { audioBlob: pendingAudioBlob })
    };

    // Generar follow-up adaptativo
    const followUp = generateAdaptiveFollowUp(answer, currentQuestion);
    if (followUp) {
      answer.followUpGenerated = followUp;
    }

    setAnswers(prev => [...prev, answer]);
    setCurrentAnswer('');
    setSessionInsights(prev => [...prev, generateInsight(answer)]);
    
    // Limpiar estado pendiente de audio
    setPendingAudioBlob(null);
    setPendingEmotion(undefined);

    // Avanzar a siguiente pregunta
    if (currentQuestionIndex < questions.length - 1 && answers.length < maxQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Generar pregunta adaptativa para la siguiente ronda
      if (Math.random() > 0.7) { // 30% probabilidad de generar pregunta adaptativa
        await generateAdaptiveQuestion();
      }
    } else {
      // Completar entrevista
      setInterviewPhase('complete');
      onComplete?.(answers, userProfile);
      toast.success('¡Entrevista completada! Gracias por compartir tus memorias.');
    }
  };

  const generateAdaptiveFollowUp = (answer: Answer, question: Question): string | undefined => {
    const { emotion, emotionConfidence } = answer;
    
    if (!emotion || !emotionConfidence || emotionConfidence < 0.4) {
      return question.followUps[Math.floor(Math.random() * question.followUps.length)];
    }

    // Generar follow-up basado en emoción
    if (emotion === 'joy' || emotion === 'happiness') {
      return '¡Me alegra escuchar esa felicidad en tu respuesta! ¿Hay algo más de ese momento que te gustaría compartir?';
    } else if (emotion === 'sadness') {
      return 'Comprendo que puede ser emotivo hablar de esto. ¿Te sientes cómodo/a compartiendo un poco más?';
    } else if (emotion === 'love') {
      return 'Se nota el cariño en tus palabras. ¿Qué hace que esa relación sea tan especial para ti?';
    } else if (emotion === 'surprise') {
      return 'Parece que fue una experiencia que te marcó. ¿Cómo cambió tu perspectiva?';
    }

    return question.adaptivePrompts.deepening[0];
  };

  const generateInsight = (answer: Answer): string => {
    const insights = [
      `Tu respuesta sobre ${answer.category} muestra una perspectiva muy reflexiva.`,
      `Las emociones que compartes son muy auténticas y valiosas.`,
      `Tu forma de expresarte revela mucha sabiduría personal.`,
      `Esta memoria será muy significativa para quienes la lean en el futuro.`,
      `Tu honestidad al compartir esto es realmente admirable.`
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  };

  const handleAudioComplete = (transcription: string, audioBlob: Blob, emotion?: string) => {
    setCurrentAnswer(transcription);
    setPendingAudioBlob(audioBlob);
    setPendingEmotion(emotion);
    setShowAudioRecorder(false);
    
    // Continuar al siguiente paso - handleAnswerSubmit se encargará de crear la respuesta con el audio
    handleAnswerSubmit();
  };

  const getCurrentQuestion = () => questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / maxQuestions) * 100;
  const currentQuestion = getCurrentQuestion();

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Restaurar respuesta anterior si existe
      const previousAnswer = answers[currentQuestionIndex - 1];
      if (previousAnswer) {
        setCurrentAnswer(previousAnswer.text);
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  if (interviewPhase === 'complete') {
    return (
      <Card className={`w-full max-w-4xl ${className}`}>
        <CardContent className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">¡Entrevista Completada!</h2>
          <p className="text-gray-600 mb-6">
            Has compartido {answers.length} memorias valiosas. Gracias por confiar en nosotros con tus recuerdos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{answers.length}</div>
              <div className="text-sm text-gray-500">Respuestas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userProfile.completedCategories.length}</div>
              <div className="text-sm text-gray-500">Categorías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{sessionInsights.length}</div>
              <div className="text-sm text-gray-500">Insights</div>
            </div>
          </div>
          <Button onClick={() => window.location.reload()}>
            Comenzar Nueva Entrevista
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Entrevista Adaptativa
            <Badge variant="outline" className="text-xs">
              {currentQuestionIndex + 1} de {maxQuestions}
            </Badge>
          </div>
          <div className="flex gap-2">
            {currentQuestionIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousQuestion}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Anterior
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAudioRecorder(!showAudioRecorder)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {showAudioRecorder ? 'Texto' : 'Audio'}
            </Button>
          </div>
        </CardTitle>
        
        <Progress value={progress} className="mt-2" />
        <p className="text-sm text-gray-500">
          Progreso: {Math.round(progress)}% completado
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pregunta actual */}
        {currentQuestion && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Badge className="mb-3 bg-purple-100 text-purple-800">
                    {currentQuestion.category}
                  </Badge>
                  <p className="text-lg text-purple-900 leading-relaxed">
                    {currentQuestion.text}
                  </p>
                  {isGeneratingNext && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-purple-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      Adaptando siguiente pregunta...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Respuestas anteriores */}
        {answers.length > 0 && (
          <ScrollArea className="h-48 border rounded-lg p-4 bg-gray-50" ref={scrollAreaRef}>
            <div className="space-y-4">
              {answers.slice(-3).map((answer, index) => (
                <div key={answer.questionId} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {answer.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {answer.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    {answer.question}
                  </p>
                  <p className="text-sm">{answer.text}</p>
                  {answer.emotion && answer.emotionConfidence && answer.emotionConfidence > 0.3 && (
                    <Badge className="mt-2 text-xs bg-green-100 text-green-800">
                      {answer.emotion} ({Math.round(answer.emotionConfidence * 100)}%)
                    </Badge>
                  )}
                  {answer.followUpGenerated && (
                    <p className="text-xs text-purple-600 mt-2 italic">
                      💭 {answer.followUpGenerated}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Grabador de audio o área de texto */}
        {showAudioRecorder ? (
          <AudioRecorder
            onTranscriptionComplete={handleAudioComplete}
            maxDuration={180} // 3 minutos
            showEmotionAnalysis={true}
            autoTranscribe={true}
          />
        ) : (
          <div className="space-y-4">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Escribe tu respuesta aquí... Tómate el tiempo que necesites para reflexionar."
              className="min-h-32 resize-none"
              disabled={isAnalyzing}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    Analizando respuesta...
                  </div>
                )}
                {currentAnswer && (
                  <span className="text-xs text-gray-500">
                    {currentAnswer.length} caracteres
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex >= questions.length - 1}
                >
                  Saltar
                </Button>
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim() || isAnalyzing}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Siguiente Pregunta
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Insights de la sesión */}
        {sessionInsights.length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Insight de la IA</span>
              </div>
              <p className="text-sm text-orange-700">
                {sessionInsights[sessionInsights.length - 1]}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de progreso */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-purple-600">{answers.length}</div>
            <div className="text-gray-500">Respuestas</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{userProfile.completedCategories.length}</div>
            <div className="text-gray-500">Categorías</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">
              {Math.round((answers.filter(a => a.emotionConfidence && a.emotionConfidence > 0.5).length / Math.max(answers.length, 1)) * 100)}%
            </div>
            <div className="text-gray-500">Emocional</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { AdaptiveInterview };
