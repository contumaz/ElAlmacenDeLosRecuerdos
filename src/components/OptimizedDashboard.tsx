import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useRenderOptimization, useResponsiveOptimization, withRenderOptimization } from '../hooks/useRenderOptimization';
import { PerformanceMonitor } from './PerformanceMonitor';
import { OptimizedMemoryList } from './OptimizedMemoryList';
import { OptimizedMemoryForm } from './OptimizedMemoryForm';
import { Memory } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Button from './ui/button';
import Badge from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Settings, 
  Heart, 
  Calendar,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface OptimizedDashboardProps {
  memories: Memory[];
  onCreateMemory: (memory: Partial<Memory>) => Promise<void>;
  onUpdateMemory: (id: number, memory: Partial<Memory>) => Promise<void>;
  onDeleteMemory: (id: number) => Promise<void>;
  onToggleFavorite: (id: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface DashboardStats {
  totalMemories: number;
  favoriteMemories: number;
  recentMemories: number;
  averageMemoriesPerWeek: number;
  topEmotions: Array<{ emotion: string; count: number }>;
  memoryTrends: Array<{ date: string; count: number }>;
}

const OptimizedDashboardComponent: React.FC<OptimizedDashboardProps> = ({
  memories,
  onCreateMemory,
  onUpdateMemory,
  onDeleteMemory,
  onToggleFavorite,
  isLoading = false,
  className = ''
}) => {
  // Optimización responsiva
  const { isMobile, isTablet } = useResponsiveOptimization();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState<'memories' | 'analytics' | 'settings'>('memories');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Cálculo optimizado de estadísticas
  const dashboardStats = useMemo((): DashboardStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Memorias recientes (última semana)
    const recentMemories = memories.filter(
      memory => new Date(memory.createdAt) > weekAgo
    ).length;
    
    // Memorias favoritas
    const favoriteMemories = memories.filter(memory => memory.metadata?.category === 'favorite').length;
    
    // Promedio de memorias por semana (últimos 3 meses)
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recentMemoriesForAverage = memories.filter(
      memory => new Date(memory.createdAt) > threeMonthsAgo
    );
    const averageMemoriesPerWeek = Math.round(recentMemoriesForAverage.length / 12);
    
    // Top emociones
    const emotionCounts: Record<string, number> = {};
    memories.forEach(memory => {
      if (memory.emotion?.primary) {
        const emotion = memory.emotion.primary;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    });
    
    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Tendencias de memorias (últimos 30 días)
    const memoryTrends: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = memories.filter(memory => {
        const memoryDate = new Date(memory.createdAt).toISOString().split('T')[0];
        return memoryDate === dateStr;
      }).length;
      memoryTrends.push({ date: dateStr, count });
    }
    
    return {
      totalMemories: memories.length,
      favoriteMemories,
      recentMemories,
      averageMemoriesPerWeek,
      topEmotions,
      memoryTrends
    };
  }, [memories]);

  // Callbacks optimizados
  const handleCreateMemory = useCallback(async (memory: Partial<Memory>) => {
    await onCreateMemory(memory);
    setShowCreateForm(false);
  }, [onCreateMemory]);

  const handleUpdateMemory = useCallback(async (memory: Partial<Memory>) => {
    if (editingMemory) {
      await onUpdateMemory(editingMemory.id, memory);
      setEditingMemory(null);
    }
  }, [onUpdateMemory, editingMemory]);

  const handleEditMemory = useCallback((memory: Memory) => {
    setEditingMemory(memory);
    setSelectedMemory(null);
  }, []);

  const handleViewMemory = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setEditingMemory(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMemory(null);
    setShowCreateForm(false);
  }, []);

  // Componente de estadísticas rápidas
  const QuickStats = React.memo(() => (
    <div className={`grid gap-4 ${
      isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4'
    }`}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Memories</p>
              <p className="text-2xl font-bold">{dashboardStats.totalMemories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold">{dashboardStats.favoriteMemories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold">{dashboardStats.recentMemories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!isMobile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Weekly Avg</p>
                <p className="text-2xl font-bold">{dashboardStats.averageMemoriesPerWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  ));

  // Componente de emociones principales
  const TopEmotions = React.memo(() => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Emotional Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardStats.topEmotions.map(({ emotion, count }) => (
            <div key={emotion} className="flex items-center justify-between">
              <span className="capitalize">{emotion}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(count / dashboardStats.totalMemories) * 100}%` 
                    }}
                  />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ));

  // Renderizado del contenido principal
  const renderMainContent = () => {
    if (showCreateForm) {
      return (
        <OptimizedMemoryForm
          onSave={handleCreateMemory}
          onCancel={handleCancelEdit}
          isLoading={isLoading}
        />
      );
    }

    if (editingMemory) {
      return (
        <OptimizedMemoryForm
          memory={editingMemory}
          onSave={handleUpdateMemory}
          onCancel={handleCancelEdit}
          isLoading={isLoading}
        />
      );
    }

    if (selectedMemory) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedMemory.title}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditMemory(selectedMemory)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMemory(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedMemory.imageUrl && (
                <img
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              )}
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedMemory.content}
              </p>
              {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMemory.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {!isMobile && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="memories" className="space-y-6">
            <QuickStats />
            <OptimizedMemoryList
              memories={memories}
              onEdit={handleEditMemory}
              onDelete={onDeleteMemory}
              onView={handleViewMemory}
              onToggleFavorite={onToggleFavorite}
              showVirtualization={memories.length > 20}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            }`}>
              <TopEmotions />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end space-x-1">
                    {dashboardStats.memoryTrends.slice(-14).map((trend, index) => (
                      <div
                        key={trend.date}
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max(trend.count * 20, 4)}px`,
                          opacity: 0.7 + (index / 14) * 0.3
                        }}
                        title={`${trend.date}: ${trend.count} memories`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Last 14 days activity
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Show Performance Monitor</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                    >
                      {showPerformanceMonitor ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  
                  {showPerformanceMonitor && (
                    <Suspense fallback={<div>Loading performance monitor...</div>}>
                      <PerformanceMonitor />
                    </Suspense>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Memory Dashboard
              </h1>
              {isLoading && (
                <Badge variant="outline" className="animate-pulse">
                  Syncing...
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {!showCreateForm && !editingMemory && !selectedMemory && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size={isMobile ? 'sm' : 'default'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isMobile ? 'New' : 'New Memory'}
                </Button>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderMainContent()}
      </div>
    </div>
  );
};

// Aplicar optimizaciones HOC
export const OptimizedDashboard = withRenderOptimization(
  OptimizedDashboardComponent,
  {
    memo: true,
    profiler: process.env.NODE_ENV === 'development',
    errorBoundary: true
  }
);

OptimizedDashboard.displayName = 'OptimizedDashboard';