import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare, 
  Heart,
  Lightbulb,
  Clock,
  Save,
  RefreshCw,
  Sparkles,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import electronService from '@/services/electronAPI';

/**
 * Interfaz para los mensajes del chat
 */
interface Message {
  /** ID único del mensaje */
  id: string;
  /** Contenido del mensaje */
  text: string;
  /** Remitente del mensaje */
  sender: 'user' | 'ai';
  /** Timestamp del mensaje */
  timestamp: Date;
  /** Emoción detectada (opcional) */
  emotion?: string;
  /** Confianza de la detección emocional (0-1) */
  confidence?: number;
  /** Metadatos adicionales */
  metadata?: any;
}

/**
 * Props para el componente AIChat
 */
interface AIChatProps {
  /** Modo de funcionamiento del chat */
  mode?: 'interview' | 'conversation' | 'memory-assistant';
  /** Perfil del usuario para personalización */
  userProfile?: any;
  /** Callback cuando se genera una memoria */
  onMemoryGenerated?: (memory: any) => void;
  /** Callback para guardar conversación */
  onConversationSave?: (messages: Message[]) => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Iniciar automáticamente la conversación */
  autoStart?: boolean;
  /** Preguntas sugeridas para mostrar */
  suggestedQuestions?: string[];
}

/**
 * Componente para mostrar badges de emociones detectadas
 * 
 * @param emotion - Emoción detectada
 * @param confidence - Nivel de confianza (0-1)
 * @returns Badge con la emoción y porcentaje de confianza
 */
const EmotionBadge = ({ emotion, confidence }: { emotion: string | undefined, confidence: number | undefined }) => {
  if (!emotion || !confidence || confidence < 0.3) return null;
  
  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'joy':
      case 'happiness':
      case 'happy':
        return 'bg-green-100 text-green-800';
      case 'sadness':
      case 'sad':
        return 'bg-blue-100 text-blue-800';
      case 'love':
      case 'affection':
        return 'bg-red-100 text-red-800';
      case 'surprise':
        return 'bg-yellow-100 text-yellow-800';
      case 'fear':
      case 'nervous':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={`${getEmotionColor(emotion)} text-xs`}>
      {emotion} ({Math.round(confidence * 100)}%)
    </Badge>
  );
};

/**
 * Componente de chat inteligente con IA para crear memorias
 * 
 * Proporciona una interfaz conversacional avanzada con múltiples modos:
 * - Interview: Entrevistas estructuradas para capturar memorias
 * - Conversation: Conversaciones libres con análisis emocional
 * - Memory Assistant: Asistente especializado en organización de recuerdos
 * 
 * Características principales:
 * - Análisis de emociones en tiempo real
 * - Generación automática de preguntas contextuales
 * - Guardado automático como memorias
 * - Interfaz adaptativa según el modo
 * - Preguntas sugeridas inteligentes
 * - Contexto conversacional persistente
 * 
 * @param props - Propiedades del componente
 * @returns Componente JSX de chat con IA
 * 
 * @example
 * ```tsx
 * <AIChat
 *   mode="interview"
 *   userProfile={userProfile}
 *   onMemoryGenerated={handleMemoryGenerated}
 *   autoStart={true}
 *   suggestedQuestions={["¿Cuál es tu recuerdo más feliz?"]}
 * />
 * ```
 */
export default function AIChat({
  mode = 'conversation',
  userProfile = {},
  onMemoryGenerated,
  onConversationSave,
  className = '',
  autoStart = false,
  suggestedQuestions = []
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [conversationContext, setConversationContext] = useState({
    topic: '',
    emotions: [] as string[],
    keyPoints: [] as string[],
    questionCount: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generar siguiente pregunta en modo entrevista
  const generateNextQuestion = useCallback(async () => {
    setIsTyping(true);
    
    try {
      const questionResult = await electronService.generateQuestions(
        'general',
        5
      );
      
      if (questionResult.success) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          text: questionResult.question,
          sender: 'ai',
          timestamp: new Date(),
          metadata: {
            category: questionResult.category,
            progress: questionResult.progress,
            isQuestion: true
          }
        };

        setMessages(prev => [...prev, aiMessage]);
        
        setConversationContext(prev => ({
          ...prev,
          questionCount: prev.questionCount + 1
        }));
      }
    } catch (error) {
      console.error('Error generando pregunta:', error);
      // Fallback con preguntas predefinidas
      const fallbackQuestions = [
        "¿Cuál es tu recuerdo más preciado de la infancia?",
        "¿Hay alguna persona que haya marcado tu vida de manera especial?",
        "¿Qué tradición familiar es más importante para ti?",
        "¿Cuál ha sido el momento más feliz de tu vida?",
        "¿Qué consejo le darías a las futuras generaciones?"
      ];
      
      const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: randomQuestion,
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          isQuestion: true,
          isFallback: true
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  // Inicialización automática si está configurada
  // Inicializar conversación con mensaje de bienvenida
  const initializeConversation = useCallback(async () => {
    const welcomeMessages = {
      interview: "¡Hola! Soy tu asistente de memorias personal. Estoy aquí para ayudarte a crear un hermoso legado de tus recuerdos. ¿Te gustaría comenzar con una entrevista sobre tu vida?",
      conversation: "¡Hola! Estoy aquí para escucharte y ayudarte a organizar tus pensamientos y recuerdos. ¿De qué te gustaría hablar hoy?",
      'memory-assistant': "¡Hola! Soy tu asistente para crear memorias. Puedo ayudarte a organizar tus recuerdos, sugerir preguntas interesantes y generar contenido personalizado. ¿En qué puedo ayudarte?"
    };

    const welcomeMessage: Message = {
      id: `ai_${Date.now()}`,
      text: welcomeMessages[mode],
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);

    // Si es modo entrevista, generar primera pregunta
    if (mode === 'interview') {
      setTimeout(() => {
        generateNextQuestion();
      }, 2000);
    }
  }, [mode, generateNextQuestion]);

  useEffect(() => {
    if (autoStart && messages.length === 0) {
      initializeConversation();
    }
  }, [autoStart, initializeConversation, messages.length]);

  // Enviar mensaje del usuario
  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Analizar emoción del mensaje del usuario
      setIsAnalyzing(true);
      const emotionResult = await electronService.analyzeEmotion(userMessage.text);
      
      if (emotionResult.success) {
        userMessage.emotion = emotionResult.emotion;
        userMessage.confidence = emotionResult.confidence;
        
        // Actualizar contexto emocional
        setConversationContext(prev => ({
          ...prev,
          emotions: [...new Set([...prev.emotions, emotionResult.emotion])]
        }));
      }

      setIsAnalyzing(false);

      // Generar respuesta de la IA
      const aiResponse = await generateAIResponse(userMessage.text, emotionResult);
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: aiResponse.response,
        sender: 'ai',
        timestamp: new Date(),
        metadata: aiResponse.metadata
      };

      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, emotion: userMessage.emotion, confidence: userMessage.confidence } : msg
      ).concat(aiMessage));

      // Actualizar contexto de conversación
      updateConversationContext(userMessage.text, aiResponse);

    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      toast.error('Error al procesar el mensaje');
    } finally {
      setIsTyping(false);
      setIsAnalyzing(false);
    }
  };

  // Generar respuesta de IA según el contexto
  const generateAIResponse = async (userText: string, emotionData: any) => {
    const context = {
      mode,
      sessionId,
      userProfile,
      conversationHistory: messages.slice(-5), // Últimos 5 mensajes para contexto
      currentEmotion: emotionData.emotion,
      emotionConfidence: emotionData.confidence,
      conversationContext
    };

    // Usar servicio de Electron para chat con IA
    const response = await electronService.chatWithAI(userText, context);
    
    if (response.success) {
      return {
        response: response.response,
        metadata: {
          conversationId: response.conversationId,
          generatedAt: new Date().toISOString()
        }
      };
    } else {
      // Fallback con respuestas inteligentes basadas en contexto
      return generateContextualResponse(userText, emotionData, context);
    }
  };

  // Generar respuesta contextual (fallback)
  const generateContextualResponse = (userText: string, emotionData: any, context: any) => {
    const responses = {
      interview: [
        "Esa es una memoria muy valiosa. ¿Puedes contarme más detalles sobre ese momento?",
        "Me encanta escuchar sobre eso. ¿Qué emociones sentías en ese momento?",
        "¡Qué interesante! ¿Cómo crees que esa experiencia te cambió?",
        "Es hermoso cómo describes eso. ¿Hay alguna persona especial que estuvo contigo?",
        "Gracias por compartir eso conmigo. ¿Qué aprendiste de esa experiencia?"
      ],
      conversation: [
        "Entiendo lo que me dices. ¿Te gustaría explorar ese tema más profundamente?",
        "Es interesante tu perspectiva. ¿Cómo te hace sentir pensar en eso?",
        "Aprecio que compartas eso conmigo. ¿Qué significado tiene para ti?",
        "Me parece que hay mucho que desentrañar ahí. ¿Quieres que hablemos más de ello?",
        "Gracias por confiar en mí. ¿Hay algo más que te gustaría añadir?"
      ],
      'memory-assistant': [
        "Eso suena como una memoria importante. ¿Te gustaría que te ayude a organizarla?",
        "Puedo ayudarte a capturar todos los detalles de esa experiencia. ¿Comenzamos?",
        "Es una historia fascinante. ¿Qué detalles crees que son más importantes preservar?",
        "Me parece que hay mucho valor en lo que compartes. ¿Cómo podemos estructurarlo mejor?",
        "Esa memoria merece ser preservada. ¿Te ayudo a crear un registro completo?"
      ]
    };

    // Respuesta adaptada a la emoción detectada
    const emotionResponses = {
      joy: "Me alegra mucho escuchar la felicidad en tus palabras. ",
      sadness: "Comprendo que puede ser difícil hablar de esto. Estoy aquí para escucharte. ",
      love: "Se nota el cariño en tu forma de expresarte. ",
      fear: "Entiendo que puede ser complicado. Vamos paso a paso. ",
      surprise: "¡Qué interesante! Me has sorprendido también. "
    };

    const emotionPrefix = emotionData.emotion && emotionData.confidence > 0.5 
      ? emotionResponses[emotionData.emotion as keyof typeof emotionResponses] || ""
      : "";

    const baseResponses = responses[mode];
    const selectedResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];

    return {
      response: emotionPrefix + selectedResponse,
      metadata: {
        isGenerated: true,
        emotionAdapted: !!emotionPrefix
      }
    };
  };

  // Actualizar contexto de conversación
  const updateConversationContext = (userText: string, aiResponse: any) => {
    setConversationContext(prev => ({
      ...prev,
      keyPoints: [...prev.keyPoints, userText.slice(0, 50)].slice(-10) // Últimos 10 puntos clave
    }));
  };

  // Usar pregunta sugerida
  const useSuggestedQuestion = (question: string) => {
    setInputText(question);
    textareaRef.current?.focus();
  };

  // Guardar conversación como memoria
  const saveAsMemory = () => {
    if (messages.length === 0) return;

    const memoryContent = messages
      .filter(m => m.sender === 'user')
      .map(m => m.text)
      .join('\n\n');

    const emotions = [...new Set(messages
      .filter(m => m.emotion && m.confidence && m.confidence > 0.3)
      .map(m => m.emotion))] as string[];

    const memory = {
      title: `Conversación del ${new Date().toLocaleDateString()}`,
      content: memoryContent,
      type: 'texto',
      tags: [`conversacion-ia`, mode, ...emotions],
      metadata: {
        conversationId: sessionId,
        messageCount: messages.length,
        emotions: emotions,
        mode: mode,
        generatedAt: new Date().toISOString()
      }
    };

    if (onMemoryGenerated) {
      onMemoryGenerated(memory);
    }

    toast.success('Conversación guardada como memoria');
  };

  // Manejar tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Obtener título según el modo
  const getTitle = () => {
    const titles = {
      interview: 'Entrevista Inteligente',
      conversation: 'Conversación con IA',
      'memory-assistant': 'Asistente de Memorias'
    };
    return titles[mode];
  };

  // Obtener icono según el modo
  const getIcon = () => {
    const icons = {
      interview: MessageSquare,
      conversation: Bot,
      'memory-assistant': Brain
    };
    const Icon = icons[mode];
    return <Icon className="w-5 h-5 text-purple-500" />;
  };

  return (
    <Card className={`w-full max-w-4xl h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
            {mode === 'interview' && (
              <Badge variant="outline" className="text-xs">
                Pregunta {conversationContext.questionCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button
                onClick={saveAsMemory}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Guardar
              </Button>
            )}
            <Button
              onClick={initializeConversation}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reiniciar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Área de mensajes */}
        <ScrollArea className="flex-1 border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                <p>Comienza una conversación para crear recuerdos únicos</p>
                <Button 
                  onClick={initializeConversation}
                  className="mt-4"
                  variant="outline"
                >
                  Iniciar Conversación
                </Button>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'ai' && (
                      <Bot className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    )}
                    {message.sender === 'user' && (
                      <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0 order-2" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <EmotionBadge emotion={message.emotion} confidence={message.confidence} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de escritura */}
            {(isTyping || isAnalyzing) && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isAnalyzing ? 'Analizando emociones...' : 'Escribiendo...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Preguntas sugeridas */}
        {suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputText(question);
                }}
                className="text-xs"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                {question.slice(0, 30)}...
              </Button>
            ))}
          </div>
        )}

        {/* Área de entrada */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            className="resize-none"
            rows={2}
            disabled={isTyping}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTyping}
            className="px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Estadísticas de la conversación */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
            <span>Mensajes: {messages.length}</span>
            {conversationContext.emotions.length > 0 && (
              <span>Emociones: {conversationContext.emotions.join(', ')}</span>
            )}
            <span>
              <Clock className="w-3 h-3 inline mr-1" />
              {messages[0]?.timestamp.toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { AIChat };
