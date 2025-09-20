import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = "",
  showDetails = true
}) => {
  const {
    isOnline,
    isConnected,
    queueLength,
    lastSync,
    syncInProgress,
    syncOfflineQueue,
    clearCache
  } = useOffline();

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showDetailsPanel, setShowDetailsState] = useState(false);

  // Mostrar notificación cuando cambie el estado
  useEffect(() => {
    if (!isOnline) {
      setNotificationMessage('Sin conexión - Trabajando offline');
      setShowNotification(true);
    } else if (isOnline && !isConnected) {
      setNotificationMessage('Conexión limitada - Verificando...');
      setShowNotification(true);
    } else if (isConnected && queueLength > 0) {
      setNotificationMessage(`Sincronizando ${queueLength} operaciones...`);
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [isOnline, isConnected, queueLength]);

  // Escuchar eventos de sincronización
  useEffect(() => {
    const handleOfflineSync = (event: CustomEvent) => {
      const { synced, remaining } = event.detail;
      setNotificationMessage(
        `✅ ${synced} operaciones sincronizadas${remaining > 0 ? ` (${remaining} pendientes)` : ''}`
      );
      setShowNotification(true);
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => setShowNotification(false), 3000);
    };

    window.addEventListener('offlineSync', handleOfflineSync as EventListener);
    return () => window.removeEventListener('offlineSync', handleOfflineSync as EventListener);
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50';
    if (!isConnected) return 'text-yellow-500 bg-yellow-50';
    if (queueLength > 0) return 'text-blue-500 bg-blue-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusIcon = () => {
    if (syncInProgress) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (!isConnected) return <AlertCircle className="w-4 h-4" />;
    if (queueLength > 0) return <Clock className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (syncInProgress) return 'Sincronizando...';
    if (!isOnline) return 'Sin conexión';
    if (!isConnected) return 'Conexión limitada';
    if (queueLength > 0) return `${queueLength} pendientes`;
    return 'Conectado';
  };

  const handleSync = async () => {
    try {
      await syncOfflineQueue();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el cache? Esto eliminará todos los datos offline.')) {
      try {
        await clearCache();
        setNotificationMessage('Cache limpiado exitosamente');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  return (
    <>
      {/* Indicador principal */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDetailsState(!showDetailsPanel)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${getStatusColor()}`}
          title={`Estado: ${getStatusText()}${lastSync ? ` - Última sincronización: ${lastSync.toLocaleTimeString()}` : ''}`}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
          {queueLength > 0 && (
            <span className="bg-current text-white rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] text-center">
              {queueLength}
            </span>
          )}
        </button>

        {/* Panel de detalles */}
        {showDetailsPanel && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {getStatusIcon()}
                  Estado de Conexión
                </h3>
                <button
                  onClick={() => setShowDetailsState(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Estado de red */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Red:</span>
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      isOnline ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isOnline ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>

                {/* Estado de servidor */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Servidor:</span>
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {isConnected ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>

                {/* Cola de operaciones */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Operaciones pendientes:</span>
                  <span className={`text-sm font-medium ${
                    queueLength > 0 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {queueLength}
                  </span>
                </div>

                {/* Última sincronización */}
                {lastSync && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Última sincronización:</span>
                    <span className="text-sm text-gray-600">
                      {lastSync.toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={handleSync}
                    disabled={syncInProgress || !isConnected}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncInProgress ? 'animate-spin' : ''}`} />
                    {syncInProgress ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  
                  <button
                    onClick={handleClearCache}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                  >
                    Limpiar Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notificación flotante */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className={`flex-shrink-0 ${getStatusColor().split(' ')[0]}`}>
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notificationMessage}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;