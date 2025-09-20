import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class SafeDOMWrapper extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private componentId = `SafeDOMWrapper-${Date.now()}`;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('[SafeDOMWrapper] Error capturado:', error.message);
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`[SafeDOMWrapper:${this.componentId}] Error DOM capturado:`, error.message);
    
    // Solo hacer retry para errores DOM específicos
    if (this.isDOMRelatedError(error) && this.state.retryCount < 1) {
      console.log(`[SafeDOMWrapper:${this.componentId}] Programando retry automático...`);
      this.scheduleRetry();
    }

    this.setState({
      error,
      hasError: true
    });
  }

  private isDOMRelatedError(error: Error): boolean {
    const domErrorPatterns = [
      /removeChild/i,
      /insertBefore/i,
      /appendChild/i,
      /The node to be removed is not a child/i,
      /Failed to execute.*on.*Node/i
    ];
    
    return domErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  private scheduleRetry() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.retryTimeoutId = setTimeout(() => {
      console.log(`[SafeDOMWrapper:${this.componentId}] Ejecutando retry automático`);
      
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }, 1000);
  }

  componentWillUnmount() {
    console.log(`[SafeDOMWrapper:${this.componentId}] Desmontando wrapper`);
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetError = () => {
    console.log(`[SafeDOMWrapper:${this.componentId}] Reset manual`);
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0
    });
  }

  render() {
    if (this.state.hasError) {
      // Si hemos hecho retry, mostrar fallback final
      if (this.state.retryCount >= 1) {
        if (this.props.fallback) {
          return this.props.fallback;
        }
        
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-red-800">
                Error de Componente
              </h3>
            </div>
            
            <p className="text-red-700 mb-4">
              Se ha producido un error temporal. El componente se está recuperando automáticamente.
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Recargar Página
              </button>
            </div>
          </div>
        );
      }

      // Mostrar indicador de recuperación
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg m-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-800">
              Recuperando componente...
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeDOMWrapper;
