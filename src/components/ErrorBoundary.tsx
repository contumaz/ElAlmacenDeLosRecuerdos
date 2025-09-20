import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Download } from 'lucide-react';
import loggingService from '@/services/LoggingService';
import { toast } from 'sonner';

const serializeError = (error: Error): string => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(errorInfo, null, 2);
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  autoRecoveryAttempted: boolean;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private autoRecoveryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      autoRecoveryAttempted: false,
      lastErrorTime: 0
    };
    
    this.resetError = this.resetError.bind(this);
    this.setupAutoRecovery();
  }

  resetError = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      autoRecoveryAttempted: false,
      lastErrorTime: 0
    });
    
    loggingService.info('Error boundary reset', 'ErrorBoundary');
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generar ID único para el error
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = Date.now();
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: currentTime
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capturar información adicional del error
    this.setState({
      errorInfo
    });

    // Log completo del error usando el servicio de logging
    loggingService.error(
      `React Error Boundary: ${error.message}`,
      error,
      'ErrorBoundary',
      {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        url: window.location.href,
        userAgent: navigator.userAgent,
        retryCount: this.retryCount
      }
    );
    
    // Intentar recuperación automática para ciertos tipos de errores
    this.attemptAutoRecovery(error);
    
    // Log adicional para debugging y monitoreo
    this.logErrorToService(error, errorInfo);
  }

  private setupAutoRecovery = () => {
    // Configurar recuperación automática después de 10 segundos para errores no críticos
    this.autoRecoveryTimeout = null;
  };

  private attemptAutoRecovery = (error: Error) => {
    // Solo intentar recuperación automática una vez y para errores específicos
    if (this.state.autoRecoveryAttempted) return;
    
    const isRecoverableError = (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch')
    );
    
    if (isRecoverableError && this.retryCount === 0) {
      loggingService.info('Attempting auto-recovery for recoverable error', 'ErrorBoundary', {
        errorType: error.name,
        errorMessage: error.message
      });
      
      this.setState({ autoRecoveryAttempted: true });
      
      // Intentar recuperación después de 3 segundos
      setTimeout(() => {
        this.handleRetry();
        toast.info('Intentando recuperación automática...');
      }, 3000);
    }
  };

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Datos adicionales para el log
      const errorData = {
        error: serializeError(error),
        errorInfo: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        retryCount: this.retryCount,
        autoRecoveryAttempted: this.state.autoRecoveryAttempted
      };
      
      // Intentar usar electronAPI para log local
      if (window.electronAPI?.security?.logActivity) {
        await window.electronAPI.security.logActivity(
          `ErrorBoundary: ${error.message} (ID: ${this.state.errorId})`
        );
      }
      
      // Log adicional en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 ErrorBoundary - Error Details');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Full Error Data:', errorData);
        console.groupEnd();
      }
    } catch (logError) {
      loggingService.error('Failed to log error to external service', logError as Error, 'ErrorBoundary');
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorToClipboard = async () => {
    try {
      const errorText = this.state.error ? serializeError(this.state.error) : 'Error desconocido';
      await navigator.clipboard.writeText(errorText);
      toast.success('Error copiado al portapapeles');
      
      loggingService.info('Error copied to clipboard', 'ErrorBoundary', {
        errorId: this.state.errorId
      });
    } catch (err) {
      toast.error('No se pudo copiar el error');
      loggingService.error('Failed to copy error to clipboard', err as Error, 'ErrorBoundary');
    }
  };

  private downloadErrorReport = () => {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        error: this.state.error ? serializeError(this.state.error) : 'Error desconocido',
        componentStack: this.state.errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        retryCount: this.retryCount,
        autoRecoveryAttempted: this.state.autoRecoveryAttempted,
        logs: loggingService.getLogs({ limit: 20 })
      };
      
      const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-report-${this.state.errorId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Reporte de error descargado');
      loggingService.info('Error report downloaded', 'ErrorBoundary', {
        errorId: this.state.errorId
      });
    } catch (err) {
      toast.error('No se pudo descargar el reporte');
      loggingService.error('Failed to download error report', err as Error, 'ErrorBoundary');
    }
  };

  private getErrorSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
    if (!this.state.error) return 'low';
    
    const error = this.state.error;
    const message = error.message.toLowerCase();
    
    if (
      error.name === 'ChunkLoadError' ||
      message.includes('network') ||
      message.includes('fetch')
    ) {
      return 'medium';
    }
    
    if (
      message.includes('memory') ||
      message.includes('stack overflow') ||
      this.retryCount >= this.maxRetries
    ) {
      return 'critical';
    }
    
    return 'high';
  };

  componentWillUnmount() {
    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Si se proporciona un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            {/* Logo y título de error */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-900">¡Oops! Algo salió mal</h1>
                <p className="text-lg text-red-700">El Almacén de los Recuerdos encontró un problema</p>
              </div>
            </div>

            {/* Tarjeta de error */}
            <Card className="shadow-xl border-red-200">
              <CardHeader>
                <CardTitle className="text-xl text-red-900 flex items-center">
                  <Bug className="w-5 h-5 mr-2" />
                  Error en la Aplicación
                </CardTitle>
                <CardDescription>
                  Se produjo un error inesperado. No te preocupes, tus datos están seguros.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mensaje del error */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">
                    {this.state.error?.message || 'Error desconocido'}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-red-600 mt-2">
                      ID del error: {this.state.errorId}
                    </p>
                  )}
                </div>

                {/* Indicador de severidad */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  this.getErrorSeverity() === 'critical' ? 'bg-red-100 text-red-800' :
                  this.getErrorSeverity() === 'high' ? 'bg-orange-100 text-orange-800' :
                  this.getErrorSeverity() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  Severidad: {this.getErrorSeverity().toUpperCase()}
                </div>

                {/* Acciones principales */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {canRetry && (
                    <Button 
                      onClick={this.handleRetry}
                      className="flex-1"
                      variant="default"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar ({this.maxRetries - this.retryCount} intentos)
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir al inicio
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recargar página
                  </Button>
                </div>

                {/* Acciones adicionales */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={this.copyErrorToClipboard}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar error
                  </Button>
                  
                  <Button
                    onClick={this.downloadErrorReport}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar reporte
                  </Button>
                </div>

                {/* Información técnica en desarrollo */}
                {isDevelopment && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-red-900 hover:text-red-700">
                      Detalles técnicos (modo desarrollo)
                    </summary>
                    <div className="mt-2 p-4 bg-gray-100 rounded border">
                      <div className="space-y-4">
                        {/* Información del error */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h4>
                          <pre className="text-xs overflow-auto max-h-40 text-gray-800 bg-white p-2 rounded border">
                            {serializeError(this.state.error)}
                          </pre>
                        </div>
                        
                        {/* Component Stack */}
                        {this.state.errorInfo && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Component Stack:</h4>
                            <pre className="text-xs overflow-auto max-h-40 text-gray-600 bg-white p-2 rounded border">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                        
                        {/* Logs recientes */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Logs:</h4>
                          <div className="max-h-32 overflow-auto bg-white p-2 rounded border">
                            {loggingService.getLogs({ limit: 5 }).map((log, index) => (
                              <div key={index} className="text-xs mb-1">
                                <span className={`font-medium ${
                                  log.level === 3 ? 'text-red-600' :
                                  log.level === 2 ? 'text-yellow-600' :
                                  log.level === 1 ? 'text-blue-600' :
                                  'text-gray-600'
                                }`}>
                                  [{log.timestamp.toLocaleTimeString()}]
                                </span>
                                <span className="ml-2">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Métricas de rendimiento */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Info:</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Retry Count: {this.retryCount}/{this.maxRetries}</div>
                            <div>Auto Recovery: {this.state.autoRecoveryAttempted ? 'Attempted' : 'Not attempted'}</div>
                            <div>Error Time: {new Date(this.state.lastErrorTime).toLocaleString()}</div>
                            <div>Memory Usage: {(performance as any).memory?.usedJSHeapSize ? 
                              `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                {/* Consejos para el usuario */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">💡 Sugerencias:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Recargar la página suele resolver problemas temporales</li>
                    <li>• Verifica tu conexión a internet</li>
                    <li>• Si el problema persiste, contacta al soporte técnico</li>
                    {this.state.errorId && (
                      <li>• Proporciona el ID del error al reportar: {this.state.errorId}</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}