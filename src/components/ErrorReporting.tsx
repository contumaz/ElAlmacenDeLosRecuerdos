import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Button from './ui/button';
import Badge from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, Bug, Info, XCircle, Download, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import useErrorHandler from '../hooks/useErrorHandler';
import loggingService, { LogLevel, LogEntry } from '../services/LoggingService';
import { toast } from 'sonner';

interface ErrorStats {
  total: number;
  byLevel: Record<string, number>;
  byContext: Record<string, number>;
  recent: number;
}

interface ErrorTrend {
  date: string;
  errors: number;
  warnings: number;
  info: number;
}

const ErrorReporting: React.FC = () => {
  const { state, clearAllErrors } = useErrorHandler();
  const [filter, setFilter] = useState({
    level: 'all',
    context: 'all',
    dateRange: '24h',
    search: ''
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Colores para los gráficos
  const COLORS = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981'
  };

  // Cargar logs del servicio de logging
  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = loggingService.getLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Error al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar errores y logs
  const filteredErrors = useMemo(() => {
    return state.errorHistory.filter(error => {
      if (filter.level !== 'all' && error.severity !== filter.level) return false;
      if (filter.context !== 'all' && error.context !== filter.context) return false;
      if (filter.search && !error.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      
      // Filtro por fecha
      const now = Date.now();
      const errorTime = error.timestamp;
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      if (filter.dateRange !== 'all') {
        const range = timeRanges[filter.dateRange as keyof typeof timeRanges];
        if (now - errorTime.getTime() > range) return false;
      }
      
      return true;
    });
  }, [state.errorHistory, filter]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter.level !== 'all' && log.level !== filter.level) return false;
      if (filter.context !== 'all' && log.context !== filter.context) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      
      const now = Date.now();
      const logTime = new Date(log.timestamp).getTime();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      if (filter.dateRange !== 'all') {
        const range = timeRanges[filter.dateRange as keyof typeof timeRanges];
        if (now - logTime > range) return false;
      }
      
      return true;
    });
  }, [logs, filter]);

  // Calcular estadísticas
  const stats: ErrorStats = useMemo(() => {
    const allItems = [...filteredErrors, ...filteredLogs];
    const byLevel: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    
    allItems.forEach(item => {
      const level = item.severity || item.level;
      const context = item.context || 'unknown';
      
      byLevel[level] = (byLevel[level] || 0) + 1;
      byContext[context] = (byContext[context] || 0) + 1;
    });
    
    const recent = allItems.filter(item => {
      const timestamp = item.timestamp || new Date(item.timestamp).getTime();
      return Date.now() - timestamp < 60 * 60 * 1000; // última hora
    }).length;
    
    return {
      total: allItems.length,
      byLevel,
      byContext,
      recent
    };
  }, [filteredErrors, filteredLogs]);

  // Datos para gráficos de tendencias
  const trendData: ErrorTrend[] = useMemo(() => {
    const days = 7;
    const data: ErrorTrend[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === dateStr;
      });
      
      const dayErrors = state.errorHistory.filter(error => {
        const errorDate = new Date(error.timestamp).toISOString().split('T')[0];
        return errorDate === dateStr;
      });
      
      data.push({
        date: dateStr,
        errors: [...dayErrors, ...dayLogs.filter(l => l.level === 'error')].length,
        warnings: dayLogs.filter(l => l.level === 'warning').length,
        info: dayLogs.filter(l => l.level === 'info').length
      });
    }
    
    return data;
  }, [logs, state.errorHistory]);

  // Datos para gráfico de pastel
  const pieData = Object.entries(stats.byLevel).map(([level, count]) => ({
    name: level,
    value: count,
    color: COLORS[level as keyof typeof COLORS] || '#6b7280'
  }));

  // Exportar reporte
  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      errors: filteredErrors,
      logs: filteredLogs,
      trends: trendData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Reporte exportado exitosamente');
  };

  // Limpiar logs
  const clearLogs = () => {
    loggingService.clearLogs();
    clearAllErrors();
    setLogs([]);
    toast.success('Logs limpiados exitosamente');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default'
    };
    
    return (
      <Badge variant={(variants[severity as keyof typeof variants] as any) || 'outline'}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Error Reporting Dashboard</h2>
          <p className="text-muted-foreground">Monitoreo y análisis de errores del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.byLevel.error || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.byLevel.warning || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Hora</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nivel</label>
              <Select value={filter.level} onValueChange={(value) => setFilter(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Contexto</label>
              <Select value={filter.context} onValueChange={(value) => setFilter(prev => ({ ...prev, context: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.keys(stats.byContext).map(context => (
                    <SelectItem key={context} value={context}>{context}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filter.dateRange} onValueChange={(value) => setFilter(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="all">Todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Buscar en mensajes..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Errores (7 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="errors" stroke={COLORS.error} strokeWidth={2} />
                  <Line type="monotone" dataKey="warnings" stroke={COLORS.warning} strokeWidth={2} />
                  <Line type="monotone" dataKey="info" stroke={COLORS.info} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Por Nivel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Por Contexto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats.byContext).map(([context, count]) => ({ context, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="context" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.info} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Errores ({filteredErrors.length + filteredLogs.length} eventos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...filteredErrors, ...filteredLogs]
                  .sort((a, b) => (b.timestamp || new Date(b.timestamp).getTime()) - (a.timestamp || new Date(a.timestamp).getTime()))
                  .map((item, index) => {
                    const severity = item.severity || item.level;
                    const timestamp = item.timestamp || new Date(item.timestamp).getTime();
                    
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getSeverityIcon(severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityBadge(severity)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(timestamp).toLocaleString()}
                            </span>
                            {item.context && (
                              <Badge variant="outline">{item.context}</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{item.message}</p>
                          {item.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">Stack trace</summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {item.stack}
                              </pre>
                            </details>
                          )}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">Metadata</summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(item.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {filteredErrors.length === 0 && filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron eventos con los filtros aplicados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorReporting;