import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  queueLength: number;
  lastSync: Date | null;
  syncInProgress: boolean;
}

interface OfflineHook extends OfflineState {
  syncOfflineQueue: () => Promise<void>;
  clearCache: () => Promise<void>;
  getOfflineStatus: () => Promise<OfflineState>;
  registerServiceWorker: () => Promise<boolean>;
}

export const useOffline = (): OfflineHook => {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queueLength: 0,
    lastSync: null,
    syncInProgress: false
  });

  // Verificar conectividad real
  const checkRealConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.onLine) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // En desarrollo, simplemente verificar si navigator.onLine es true
      // ya que el servidor de desarrollo está disponible localmente
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        clearTimeout(timeoutId);
        return navigator.onLine;
      }
      
      // Para producción, intentar múltiples URLs
      const testUrls = ['/favicon.svg', '/'];
      
      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          if (response.ok || response.status === 200) {
            clearTimeout(timeoutId);
            return true;
          }
        } catch (urlError) {
          // Continuar con la siguiente URL
          continue;
        }
      }
      
      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      // Solo loggear si no es un error de abort
      if (error.name !== 'AbortError') {
        console.warn('Connectivity check failed:', error.message);
      }
      return false;
    }
  }, []);

  // Actualizar estado de conectividad
  const updateConnectivityState = useCallback(async () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isConnected = await checkRealConnectivity();
    
    setState(prev => ({
      ...prev,
      isOnline,
      isConnected
    }));
  }, [checkRealConnectivity]);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration.scope);

      // Escuchar actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
              console.log('New Service Worker available');
              // Notificar al usuario sobre la actualización disponible
              if (typeof window !== 'undefined' && window.confirm('Nueva versión disponible. ¿Recargar la página?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }, []);

  // Sincronizar cola offline
  const syncOfflineQueue = useCallback(async (): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) {
      console.warn('No Service Worker controller available');
      return;
    }

    setState(prev => ({ ...prev, syncInProgress: true }));

    try {
      const controller = navigator.serviceWorker?.controller;
      if (!controller) {
        throw new Error('No Service Worker controller available');
      }
      
      controller.postMessage({
        type: 'SYNC_OFFLINE_QUEUE'
      });

      setState(prev => ({
        ...prev,
        lastSync: new Date(),
        syncInProgress: false
      }));
    } catch (error) {
      console.error('Failed to sync offline queue:', error);
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, []);

  // Limpiar cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) {
      console.warn('No Service Worker controller available');
      return;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      const controller = navigator.serviceWorker?.controller;
      
      if (!controller) {
        reject(new Error('No Service Worker controller available'));
        return;
      }
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('Cache cleared successfully');
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };

      controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Obtener estado offline
  const getOfflineStatus = useCallback(async (): Promise<OfflineState> => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) {
      const onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
      return {
        isOnline: onlineStatus,
        isConnected: onlineStatus,
        queueLength: 0,
        lastSync: null,
        syncInProgress: false
      };
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      const controller = navigator.serviceWorker?.controller;
      
      if (!controller) {
        const fallbackOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        resolve({
          isOnline: fallbackOnline,
          isConnected: fallbackOnline,
          queueLength: 0,
          lastSync: null,
          syncInProgress: false
        });
        return;
      }
      
      messageChannel.port1.onmessage = (event) => {
        const { isOnline, queueLength } = event.data;
        const fallbackOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const newState = {
          isOnline: isOnline ?? fallbackOnline,
          isConnected: isOnline ?? fallbackOnline,
          queueLength: queueLength ?? 0,
          lastSync: null,
          syncInProgress: false
        };
        setState(prev => ({ ...prev, ...newState }));
        resolve(newState);
      };

      controller.postMessage(
        { type: 'GET_OFFLINE_STATUS' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Efectos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    // Registrar Service Worker al montar
    const initServiceWorker = async () => {
      try {
        await registerServiceWorker();
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    };
    
    initServiceWorker();

    // Event listeners para conectividad
    const handleOnline = () => {
      if (!mounted) return;
      console.log('Connection restored');
      updateConnectivityState();
      // Sincronizar automáticamente cuando se restaure la conexión
      setTimeout(() => {
        if (mounted) {
          syncOfflineQueue().catch(console.error);
        }
      }, 1000);
    };

    const handleOffline = () => {
      if (!mounted) return;
      console.log('Connection lost');
      updateConnectivityState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar conectividad inicial
    updateConnectivityState();

    // Verificar conectividad periódicamente
    const connectivityInterval = setInterval(() => {
      if (mounted) {
        updateConnectivityState();
      }
    }, 30000);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, [updateConnectivityState, syncOfflineQueue, registerServiceWorker]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    
    // Escuchar mensajes del Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'OFFLINE_OPERATION_QUEUED':
          setState(prev => ({
            ...prev,
            queueLength: data.count
          }));
          break;

        case 'OFFLINE_OPERATIONS_SYNCED':
          setState(prev => ({
            ...prev,
            queueLength: data.remaining,
            lastSync: new Date(),
            syncInProgress: false
          }));
          
          // Mostrar notificación de sincronización
          if (data.synced > 0) {
            console.log(`✅ ${data.synced} operaciones sincronizadas`);
            
            // Disparar evento personalizado para notificaciones
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('offlineSync', {
                detail: {
                  synced: data.synced,
                  remaining: data.remaining
                }
              }));
            }
          }
          break;

        case 'SYNC_ERROR':
          setState(prev => ({
            ...prev,
            syncInProgress: false
          }));
          console.error('Sync error:', data.error);
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Obtener estado inicial de la cola offline
    const getInitialOfflineStatus = async () => {
      try {
        await getOfflineStatus();
      } catch (error) {
        console.error('Failed to get initial offline status:', error);
      }
    };

    // Esperar un poco para que el SW esté listo
    const timer = setTimeout(() => {
      getInitialOfflineStatus().catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [getOfflineStatus]);

  return {
    ...state,
    syncOfflineQueue,
    clearCache,
    getOfflineStatus,
    registerServiceWorker
  };
};

export default useOffline;