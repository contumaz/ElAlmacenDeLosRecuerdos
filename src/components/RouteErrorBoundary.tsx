import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Hook para usar dentro del error boundary
function ErrorBoundaryFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoHome = () => {
    resetError();
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    resetError();
    navigate(-1);
  };

  const handleRetry = () => {
    resetError();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo y título de error */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-900">Error de navegación</h1>
            <p className="text-red-700">Hubo un problema al cargar esta página</p>
          </div>
        </div>

        {/* Tarjeta de error */}
        <Card className="shadow-xl border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-900">
              Error en: {location.pathname}
            </CardTitle>
            <CardDescription>
              {error.message || 'Error desconocido en la navegación'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Acciones */}
            <div className="grid gap-3">
              <Button 
                onClick={handleRetry}
                className="w-full justify-start"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="w-full justify-start"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </Button>
              
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="w-full justify-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver atrás
              </Button>
            </div>

            {/* Información de ayuda */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium mb-2">💡 Qué puedes hacer:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Reintentar puede resolver problemas temporales</li>
                <li>• Verificar la conexión a internet</li>
                <li>• Usar el menú de navegación principal</li>
                <li>• Contactar soporte si el problema persiste</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log específico para errores de routing
    console.error('RouteErrorBoundary capturó un error de navegación:', error);
    console.error('Error info:', errorInfo);

    // Intentar enviar a servicio de logging
    this.logRoutingError(error, errorInfo);
  }

  private logRoutingError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        type: 'routing_error',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Log local si electronAPI está disponible
      if (window.electronAPI?.security?.logActivity) {
        await window.electronAPI.security.logActivity(`Error de routing: ${this.state.error?.message}`);
      }
    } catch (logError) {
      console.error('Failed to log routing error:', logError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
