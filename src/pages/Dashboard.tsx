import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Mic, 
  Image, 
  Video, 
  Clock, 
  Users, 
  Shield,
  MessageSquare,
  TrendingUp,
  Calendar,
  FileText,
  Bug,
  Share2,
  Contact,
  Mail,
  Phone,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMemories } from '@/hooks/use-memories-hook';
import { useAuth } from '@/hooks/use-auth-hook';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';
import { useEmotionSettings } from '@/hooks/useEmotionSettings';
import { useQuickActionsConfig } from '@/hooks/useQuickActionsConfig';
import { useSmartMemoization } from '@/hooks/useSmartMemoization';
import { Layout } from '@/components/Layout/Layout';
import EmotionVisualization from '@/components/EmotionVisualization';
import { DashboardStatsSkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoaders';
import { MemoryData as Memory } from '@/services/electronAPI';

interface DashboardStats {
  totalMemories: number;
  totalAudioTime: number;
  totalImages: number;
  totalVideos: number;
  recentActivity: number;
  emotionalMoments: {
    joy: number;
    nostalgia: number;
    love: number;
  };
}

export const Dashboard = React.memo(() => {
  const { memories, loading } = useMemories();
  const { user } = useAuth();
  const { 
    emotionHistory, 
    currentAnalysis, 
    getEmotionStatistics, 
    isServiceReady, 
    isInitializing, 
    initializationProgress, 
    isEmotionAnalysisEnabled,
    initializeService 
  } = useEmotionAnalysis();
  const { settings: emotionSettings } = useEmotionSettings();
  const { quickActions: userQuickActions } = useQuickActionsConfig();
  
  // Smart memoization hook para optimizar cálculos costosos
  const { createMemoizedValue, createMemoizedCallback } = useSmartMemoization({
    ttl: 5 * 60 * 1000, // 5 minutos para estadísticas del dashboard
    maxSize: 50,
    enableMetrics: true
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMemories: 0,
    totalAudioTime: 0,
    totalImages: 0,
    totalVideos: 0,
    recentActivity: 0,
    emotionalMoments: { joy: 0, nostalgia: 0, love: 0 }
  });

  // Memoización inteligente de estadísticas costosas
  const calculatedStats = createMemoizedValue(
    () => {
      const audioMemories = memories.filter(m => m.type === 'audio');
      const imageMemories = memories.filter(m => m.type === 'foto');
      const videoMemories = memories.filter(m => m.type === 'video');
      
      const totalAudioTime = audioMemories.reduce((total, memory) => {
        return total + (memory.metadata.duration || 0);
      }, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = memories.filter(memory => {
        return memory.date && new Date(memory.date) > weekAgo;
      }).length;

      // Análisis emocional básico
      const emotionalMoments = {
        joy: memories.filter(m => m.metadata?.emotion === 'joy').length,
        nostalgia: memories.filter(m => m.metadata?.emotion === 'nostalgia').length,
        love: memories.filter(m => m.metadata?.emotion === 'love').length
      };

      return {
        totalMemories: memories.length,
        totalAudioTime: Math.round(totalAudioTime / 60), // en minutos
        totalImages: imageMemories.length,
        totalVideos: videoMemories.length,
        recentActivity,
        emotionalMoments
      };
    },
    [memories, memories.length],
    { key: `dashboard_stats_${memories.length}_${Date.now() - (Date.now() % (60 * 1000))}` } // Cache por minuto
  );

  const calculateStats = createMemoizedCallback(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  useEffect(() => {
    if (memories.length > 0) {
      calculateStats();
    }
  }, [memories, calculateStats]);

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  const recentMemories = useMemo(() => 
    memories
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5),
    [memories]
  );

  const getTypeIcon = useCallback((type: Memory['type']) => {
    switch (type) {
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'foto': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  }, []);

  const getEmotionColor = useCallback((emotion?: string) => {
    switch (emotion) {
      case 'joy': return 'bg-yellow-100 text-yellow-800';
      case 'love': return 'bg-pink-100 text-pink-800';
      case 'nostalgia': return 'bg-purple-100 text-purple-800';
      case 'sadness': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Memoized values for JSX usage
  const audioPercentage = useMemo(() => 
    stats.totalMemories > 0 
      ? Math.round((memories.filter(m => m.type === 'audio').length / stats.totalMemories) * 100) 
      : 0, 
    [memories, stats.totalMemories]
  );

  const enabledQuickActions = createMemoizedValue(
    () => userQuickActions.filter(action => action.enabled),
    [userQuickActions],
    { key: `enabled_quick_actions_${userQuickActions.length}` }
  );

  const quickActionsRender = createMemoizedValue(
    () => userQuickActions
      .filter(action => action.enabled)
      .map((action) => (
        <Link key={action.id} to={action.href}>
          <Button variant="outline" className="h-20 flex flex-col items-center space-y-2 w-full">
            <action.icon className="w-6 h-6" />
            <span>{action.name}</span>
          </Button>
        </Link>
      )),
    [userQuickActions],
    { key: `quick_actions_render_${userQuickActions.length}` }
  );

  return (
    <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6">
        {/* Mensaje de bienvenida */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            ¡Bienvenido de nuevo, {user?.username}!
          </h1>
          <p className="text-amber-100">
            Tu almacén de recuerdos está seguro y listo para nuevas memorias.
          </p>
        </div>

        {/* Estadísticas principales */}
        {loading ? (
          <DashboardStatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Memorias</CardTitle>
                <Heart className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{stats.totalMemories}</div>
                <p className="text-xs text-amber-600">
                  +{stats.recentActivity} esta semana
                </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Audio</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {formatDuration(stats.totalAudioTime)}
              </div>
              <p className="text-xs text-amber-600">
                En {audioPercentage}% de memorias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fotos & Videos</CardTitle>
              <Image className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {stats.totalImages + stats.totalVideos}
              </div>
              <p className="text-xs text-amber-600">
                {stats.totalImages} fotos, {stats.totalVideos} videos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seguridad</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">100%</div>
              <p className="text-xs text-green-600">Cifrado activo</p>
            </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memorias recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Memorias Recientes</span>
              </CardTitle>
              <CardDescription>
                Tus últimos recuerdos guardados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton variant="list" />
              ) : recentMemories.length > 0 ? (
                <div className="space-y-3">
                  {recentMemories.map((memory) => (
                    <div key={memory.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-1 bg-amber-200 rounded">
                          {getTypeIcon(memory.type)}
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 truncate max-w-48">
                            {memory.title}
                          </p>
                          <p className="text-xs text-amber-600">
                            {memory.date ? new Date(memory.date).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </p>
                        </div>
                      </div>
                      {memory.metadata?.emotion && (
                        <Badge className={getEmotionColor(memory.metadata.emotion)}>
                          {memory.metadata.emotion}
                        </Badge>
                      )}
                    </div>
                  ))}
                  <Link to="/memorias">
                    <Button variant="outline" className="w-full mt-3">
                      Ver todas las memorias
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-amber-300 mx-auto mb-3" />
                  <p className="text-amber-600 mb-3">Aún no tienes memorias guardadas</p>
                  <Link to="/memorias">
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Crear primera memoria
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Análisis emocional simplificado */}
          {emotionSettings.enabled && emotionSettings.showInDashboard && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Análisis Emocional</span>
                  </div>
                  <Link to="/analisis-emocional">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver completo
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!isEmotionAnalysisEnabled ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">El análisis emocional está desactivado</p>
                    <Link to="/configuracion">
                      <Button variant="outline" size="sm">
                        Activar en Configuración
                      </Button>
                    </Link>
                  </div>
                ) : !isServiceReady && !isInitializing ? (
                  <div className="text-center py-4">
                    {emotionSettings.autoInitialize ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-600">Inicializando automáticamente...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-3">IA de análisis emocional no inicializada</p>
                        <Button 
                          onClick={initializeService}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          Inicializar IA
                        </Button>
                      </>
                    )}
                  </div>
                ) : isInitializing ? (
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{initializationProgress.message}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${initializationProgress.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{initializationProgress.percentage}%</p>
                    </div>
                  </div>
                ) : currentAnalysis ? (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {currentAnalysis.dominantEmotion === 'joy' && '😊'}
                        {currentAnalysis.dominantEmotion === 'sadness' && '😢'}
                        {currentAnalysis.dominantEmotion === 'anger' && '😠'}
                        {currentAnalysis.dominantEmotion === 'fear' && '😨'}
                        {currentAnalysis.dominantEmotion === 'surprise' && '😲'}
                        {currentAnalysis.dominantEmotion === 'disgust' && '🤢'}
                        {!['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'].includes(currentAnalysis.dominantEmotion) && '😐'}
                      </div>
                      <div>
                        <p className="font-medium capitalize text-gray-900">
                          {currentAnalysis.dominantEmotion}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round(currentAnalysis.confidence * 100)}% confianza
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-500">Sin datos emocionales</p>
                    <Link to="/memorias/nueva">
                      <Button variant="link" size="sm" className="text-xs mt-1">
                        Crear memoria para análisis
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Acciones rápidas */}
        {enabledQuickActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {quickActionsRender}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
});

Dashboard.displayName = 'Dashboard';
