import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp, Heart, Brain } from 'lucide-react';
import { useEmotionAnalysis, EmotionHistory, EmotionTrend } from '@/hooks/useEmotionAnalysis';
import emotionAnalysisService from '@/services/EmotionAnalysisService';

interface EmotionVisualizationProps {
  className?: string;
  showControls?: boolean;
  height?: number;
}

type ChartType = 'bar' | 'pie' | 'line' | 'area';
type TimePeriod = '7d' | '30d' | '90d' | 'all';

const EmotionVisualization: React.FC<EmotionVisualizationProps> = React.memo(({
  className = '',
  showControls = true,
  height = 400
}) => {
  const {
    emotionHistory,
    emotionTrends,
    getEmotionStatistics,
    filterHistoryByDateRange
  } = useEmotionAnalysis();

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // Filtrar datos por período de tiempo
  const filteredHistory = useMemo(() => {
    if (timePeriod === 'all') return emotionHistory;
    
    const now = new Date();
    const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return filterHistoryByDateRange(startDate, now);
  }, [emotionHistory, timePeriod, filterHistoryByDateRange]);

  // Obtener estadísticas de los datos filtrados
  const statistics = useMemo(() => {
    const analyses = filteredHistory.map(item => item.analysis);
    return emotionAnalysisService.getEmotionStatistics(analyses);
  }, [filteredHistory]);

  // Preparar datos para gráficos de barras y circular
  const chartData = useMemo(() => {
    return statistics.emotionTrends.map(trend => ({
      emotion: trend.emotion,
      percentage: Math.round(trend.percentage * 100) / 100,
      count: statistics.emotionCounts[trend.emotion] || 0,
      color: emotionAnalysisService.getEmotionColor(trend.emotion)
    }));
  }, [statistics]);

  // Preparar datos para gráfico de líneas/área (tendencias temporales)
  const timelineData = useMemo(() => {
    const groupedByDate = new Map<string, Record<string, number>>();
    
    filteredHistory.forEach(item => {
      const date = item.analysis.timestamp.toISOString().split('T')[0];
      const emotion = item.analysis.dominantEmotion;
      
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, {});
      }
      
      const dayData = groupedByDate.get(date)!;
      dayData[emotion] = (dayData[emotion] || 0) + 1;
    });
    
    return Array.from(groupedByDate.entries())
      .map(([date, emotions]) => ({
        date,
        ...emotions,
        total: Object.values(emotions).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredHistory]);

  // Obtener emociones únicas para el gráfico de líneas
  const uniqueEmotions = useMemo(() => {
    const emotions = new Set<string>();
    filteredHistory.forEach(item => emotions.add(item.analysis.dominantEmotion));
    return Array.from(emotions);
  }, [filteredHistory]);

  // Memoizar funciones de renderizado de gráficos
  const renderBarChart = useCallback(() => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="emotion" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value, name) => [
            name === 'percentage' ? `${value}%` : value,
            name === 'percentage' ? 'Porcentaje' : 'Cantidad'
          ]}
          labelFormatter={(label) => `Emoción: ${label}`}
        />
        <Bar 
          dataKey="percentage" 
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ), [chartData, height]);

  // Renderizar gráfico circular
  const renderPieChart = useCallback(() => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.emotion}: ${entry.percentage}%`}
          outerRadius={Math.min(height * 0.35, 120)}
          fill="#8884d8"
          dataKey="percentage"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
      </PieChart>
    </ResponsiveContainer>
  ), [chartData, height]);

  // Renderizar gráfico de líneas
  const renderLineChart = useCallback(() => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
          formatter={(value, name) => [value, name]}
        />
        {uniqueEmotions.slice(0, 5).map((emotion, index) => (
          <Line
            key={emotion}
            type="monotone"
            dataKey={emotion}
            stroke={emotionAnalysisService.getEmotionColor(emotion)}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  ), [timelineData, uniqueEmotions, height]);

  // Renderizar gráfico de área
  const renderAreaChart = useCallback(() => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
          formatter={(value, name) => [value, name]}
        />
        {uniqueEmotions.slice(0, 3).map((emotion, index) => (
          <Area
            key={emotion}
            type="monotone"
            dataKey={emotion}
            stackId="1"
            stroke={emotionAnalysisService.getEmotionColor(emotion)}
            fill={emotionAnalysisService.getEmotionColor(emotion)}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  ), [timelineData, uniqueEmotions, height]);

  // Renderizar el gráfico según el tipo seleccionado
  const renderChart = useCallback(() => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  }, [chartType, renderBarChart, renderPieChart, renderLineChart, renderAreaChart]);

  // Memoizar función para seleccionar emoción
  const handleEmotionSelect = useCallback((emotion: string) => {
    setSelectedEmotion(selectedEmotion === emotion ? null : emotion);
  }, [selectedEmotion]);

  if (filteredHistory.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No hay datos de análisis emocional para mostrar.
            <br />
            Comienza escribiendo algunas memorias para ver tus tendencias emocionales.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controles */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análisis Emocional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Tipo de gráfico:</label>
                <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Barras
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        Circular
                      </div>
                    </SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Período:</label>
                <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 días</SelectItem>
                    <SelectItem value="30d">30 días</SelectItem>
                    <SelectItem value="90d">90 días</SelectItem>
                    <SelectItem value="all">Todo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emoción dominante</p>
                <p className="text-2xl font-bold">{statistics.mostFrequentEmotion}</p>
              </div>
              <Heart 
                className="h-8 w-8" 
                style={{ color: emotionAnalysisService.getEmotionColor(statistics.mostFrequentEmotion) }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confianza promedio</p>
                <p className="text-2xl font-bold">{Math.round(statistics.averageConfidence * 100)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de análisis</p>
                <p className="text-2xl font-bold">{filteredHistory.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución Emocional</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Lista de emociones */}
      <Card>
        <CardHeader>
          <CardTitle>Emociones Detectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statistics.emotionTrends.map((trend) => (
              <Badge
                key={trend.emotion}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                style={{
                  backgroundColor: `${emotionAnalysisService.getEmotionColor(trend.emotion)}20`,
                  borderColor: emotionAnalysisService.getEmotionColor(trend.emotion),
                  color: emotionAnalysisService.getEmotionColor(trend.emotion)
                }}
                onClick={() => handleEmotionSelect(trend.emotion)}
              >
                {trend.emotion} ({Math.round(trend.percentage)}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

EmotionVisualization.displayName = 'EmotionVisualization';

export default EmotionVisualization;