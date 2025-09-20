import { useState, useCallback, useRef, useEffect } from 'react';
import loggingService, { LogLevel } from '@/services/LoggingService';

export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  context?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  metadata?: Record<string, any>;
  retryCount?: number;
  maxRetries?: number;
}

export interface ErrorHandlerState {
  currentError: ErrorInfo | null;
  errorHistory: ErrorInfo[];
  isLoading: boolean;
  retryInProgress: boolean;
}

export interface UseErrorHandlerReturn {
  // Estado
  state: ErrorHandlerState;
  
  // Funciones principales
  reportError: (error: Error | string, context?: string, metadata?: Record<string, any>) => string;
  reportWarning: (message: string, context?: string, metadata?: Record<string, any>) => string;
  reportInfo: (message: string, context?: string, metadata?: Record<string, any>) => string;
  
  // Manejo de errores
  clearError: (errorId?: string) => void;
  clearAllErrors: () => void;
  resolveError: (errorId: string) => void;
  retryOperation: (errorId: string, retryFn: () => Promise<void>) => Promise<boolean>;
  
  // Consultas
  getErrorById: (errorId: string) => ErrorInfo | undefined;
  getErrorsByContext: (context: string) => ErrorInfo[];
  getUnresolvedErrors: () => ErrorInfo[];
  getCriticalErrors: () => ErrorInfo[];
  
  // Utilidades
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  errorCount: number;
  
  // Configuración
  setMaxHistorySize: (size: number) => void;
  enableAutoRetry: (enabled: boolean) => void;
}

const useErrorHandler = (): UseErrorHandlerReturn => {
  const [state, setState] = useState<ErrorHandlerState>({
    currentError: null,
    errorHistory: [],
    isLoading: false,
    retryInProgress: false
  });
  
  const maxHistorySize = useRef(50);
  const autoRetryEnabled = useRef(true);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Limpiar timeouts al desmontar
  useEffect(() => {
    const timeouts = retryTimeouts.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);
  
  const generateErrorId = useCallback((): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  const determineSeverity = useCallback((error: Error | string, context?: string): ErrorInfo['severity'] => {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    
    // Errores críticos
    if (
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('connection') ||
      message.toLowerCase().includes('timeout') ||
      context === 'auth' ||
      context === 'encryption' ||
      context === 'backup'
    ) {
      return 'critical';
    }
    
    // Errores de alta severidad
    if (
      message.toLowerCase().includes('validation') ||
      message.toLowerCase().includes('permission') ||
      message.toLowerCase().includes('access') ||
      stack?.includes('TypeError') ||
      stack?.includes('ReferenceError')
    ) {
      return 'high';
    }
    
    // Errores de media severidad
    if (
      message.toLowerCase().includes('warning') ||
      message.toLowerCase().includes('deprecated') ||
      context === 'ui' ||
      context === 'component'
    ) {
      return 'medium';
    }
    
    return 'low';
  }, []);
  


  const addToHistory = useCallback((errorInfo: ErrorInfo) => {
    setState(prevState => {
      const newHistory = [errorInfo, ...prevState.errorHistory];
      
      // Mantener el límite de historial
      if (newHistory.length > maxHistorySize.current) {
        newHistory.splice(maxHistorySize.current);
      }
      
      return {
        ...prevState,
        errorHistory: newHistory,
        currentError: errorInfo.severity === 'critical' ? errorInfo : prevState.currentError
      };
    });
  }, []);
  
  const scheduleAutoRetry = useCallback((errorId: string) => {
    const timeout = setTimeout(() => {
      setState(prevState => {
        const error = prevState.errorHistory.find(e => e.id === errorId);
        if (error && !error.resolved && (error.retryCount || 0) < (error.maxRetries || 0)) {
          loggingService.info(`Auto-retry scheduled for error: ${errorId}`, 'ErrorHandler');
        }
        return prevState;
      });
      retryTimeouts.current.delete(errorId);
    }, 5000); // Retry después de 5 segundos
    
    retryTimeouts.current.set(errorId, timeout);
  }, []);

  const reportError = useCallback((error: Error | string, context?: string, metadata?: Record<string, any>): string => {
    const errorId = generateErrorId();
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    const severity = determineSeverity(error, context);
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      message,
      stack,
      context,
      timestamp: new Date(),
      severity,
      resolved: false,
      metadata,
      retryCount: 0,
      maxRetries: severity === 'critical' ? 3 : 1
    };
    
    // Log al servicio de logging
    loggingService.error(
      message,
      typeof error === 'string' ? undefined : error,
      context,
      {
        errorId,
        severity,
        ...metadata
      }
    );
    
    addToHistory(errorInfo);
    
    // Auto-retry para errores críticos si está habilitado
    if (autoRetryEnabled.current && severity === 'critical') {
      scheduleAutoRetry(errorId);
    }
    
    return errorId;
  }, [generateErrorId, determineSeverity, addToHistory, scheduleAutoRetry]);
  
  const reportWarning = useCallback((message: string, context?: string, metadata?: Record<string, any>): string => {
    const errorId = generateErrorId();
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      message,
      context,
      timestamp: new Date(),
      severity: 'medium',
      resolved: false,
      metadata
    };
    
    loggingService.warn(message, context, { errorId, ...metadata });
    addToHistory(errorInfo);
    
    return errorId;
  }, [generateErrorId, addToHistory]);
  
  const reportInfo = useCallback((message: string, context?: string, metadata?: Record<string, any>): string => {
    const errorId = generateErrorId();
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      message,
      context,
      timestamp: new Date(),
      severity: 'low',
      resolved: true, // Info messages are automatically resolved
      metadata
    };
    
    loggingService.info(message, context, { errorId, ...metadata });
    addToHistory(errorInfo);
    
    return errorId;
  }, [generateErrorId, addToHistory]);
  
  const clearError = useCallback((errorId?: string) => {
    setState(prevState => {
      if (!errorId) {
        // Limpiar error actual
        return {
          ...prevState,
          currentError: null
        };
      }
      
      // Limpiar error específico
      const updatedHistory = prevState.errorHistory.map(error => 
        error.id === errorId ? { ...error, resolved: true } : error
      );
      
      const currentError = prevState.currentError?.id === errorId ? null : prevState.currentError;
      
      return {
        ...prevState,
        currentError,
        errorHistory: updatedHistory
      };
    });
    
    // Cancelar retry si existe
    if (errorId && retryTimeouts.current.has(errorId)) {
      clearTimeout(retryTimeouts.current.get(errorId)!);
      retryTimeouts.current.delete(errorId);
    }
    
    loggingService.info(`Error cleared: ${errorId || 'current'}`, 'ErrorHandler');
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      currentError: null,
      errorHistory: prevState.errorHistory.map(error => ({ ...error, resolved: true }))
    }));
    
    // Cancelar todos los retries
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
    
    loggingService.info('All errors cleared', 'ErrorHandler');
  }, []);
  
  const resolveError = useCallback((errorId: string) => {
    setState(prevState => {
      const updatedHistory = prevState.errorHistory.map(error => 
        error.id === errorId ? { ...error, resolved: true } : error
      );
      
      const currentError = prevState.currentError?.id === errorId ? null : prevState.currentError;
      
      return {
        ...prevState,
        currentError,
        errorHistory: updatedHistory
      };
    });
    
    loggingService.info(`Error resolved: ${errorId}`, 'ErrorHandler');
  }, []);
  
  const retryOperation = useCallback(async (errorId: string, retryFn: () => Promise<void>): Promise<boolean> => {
    setState(prevState => ({ ...prevState, retryInProgress: true }));
    
    try {
      const error = state.errorHistory.find(e => e.id === errorId);
      if (!error) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      const currentRetryCount = (error.retryCount || 0) + 1;
      const maxRetries = error.maxRetries || 1;
      
      if (currentRetryCount > maxRetries) {
        loggingService.warn(`Max retries exceeded for error: ${errorId}`, 'ErrorHandler');
        return false;
      }
      
      // Actualizar contador de reintentos
      setState(prevState => ({
        ...prevState,
        errorHistory: prevState.errorHistory.map(e => 
          e.id === errorId ? { ...e, retryCount: currentRetryCount } : e
        )
      }));
      
      loggingService.info(`Retrying operation for error: ${errorId} (attempt ${currentRetryCount}/${maxRetries})`, 'ErrorHandler');
      
      await retryFn();
      
      // Marcar como resuelto si el retry fue exitoso
      resolveError(errorId);
      loggingService.info(`Retry successful for error: ${errorId}`, 'ErrorHandler');
      
      return true;
    } catch (retryError) {
      const newErrorId = reportError(
        retryError as Error,
        'retry',
        { originalErrorId: errorId, retryAttempt: true }
      );
      
      loggingService.error(`Retry failed for error: ${errorId}`, retryError as Error, 'ErrorHandler');
      return false;
    } finally {
      setState(prevState => ({ ...prevState, retryInProgress: false }));
    }
  }, [state.errorHistory, resolveError, reportError]);
  
  // Funciones de consulta
  const getErrorById = useCallback((errorId: string): ErrorInfo | undefined => {
    return state.errorHistory.find(error => error.id === errorId);
  }, [state.errorHistory]);
  
  const getErrorsByContext = useCallback((context: string): ErrorInfo[] => {
    return state.errorHistory.filter(error => error.context === context);
  }, [state.errorHistory]);
  
  const getUnresolvedErrors = useCallback((): ErrorInfo[] => {
    return state.errorHistory.filter(error => !error.resolved);
  }, [state.errorHistory]);
  
  const getCriticalErrors = useCallback((): ErrorInfo[] => {
    return state.errorHistory.filter(error => error.severity === 'critical' && !error.resolved);
  }, [state.errorHistory]);
  
  // Funciones de configuración
  const setMaxHistorySize = useCallback((size: number) => {
    maxHistorySize.current = size;
    loggingService.info(`Max history size set to: ${size}`, 'ErrorHandler');
  }, []);
  
  const enableAutoRetry = useCallback((enabled: boolean) => {
    autoRetryEnabled.current = enabled;
    loggingService.info(`Auto-retry ${enabled ? 'enabled' : 'disabled'}`, 'ErrorHandler');
  }, []);
  
  // Propiedades computadas
  const hasErrors = state.errorHistory.some(error => !error.resolved);
  const hasCriticalErrors = state.errorHistory.some(error => error.severity === 'critical' && !error.resolved);
  const errorCount = state.errorHistory.filter(error => !error.resolved).length;
  
  return {
    state,
    reportError,
    reportWarning,
    reportInfo,
    clearError,
    clearAllErrors,
    resolveError,
    retryOperation,
    getErrorById,
    getErrorsByContext,
    getUnresolvedErrors,
    getCriticalErrors,
    hasErrors,
    hasCriticalErrors,
    errorCount,
    setMaxHistorySize,
    enableAutoRetry
  };
};

export default useErrorHandler;