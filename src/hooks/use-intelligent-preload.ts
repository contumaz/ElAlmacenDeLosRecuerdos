import { useCallback, useRef, useState } from 'react';

type PreloadPriority = 'high' | 'normal' | 'low';

interface PreloadItem {
  id: string;
  loader: () => Promise<any>;
  priority: PreloadPriority;
  loaded: boolean;
}

/**
 * Hook para preload inteligente de componentes con cola de prioridades
 */
export const useIntelligentPreload = () => {
  const [queueLength, setQueueLength] = useState(0);
  const preloadQueue = useRef<Map<string, PreloadItem>>(new Map());
  const loadedComponents = useRef<Set<string>>(new Set());

  const addToPreloadQueue = useCallback((id: string, loader: () => Promise<any>, priority: PreloadPriority = 'normal') => {
    if (loadedComponents.current.has(id)) {
      return Promise.resolve();
    }

    const item: PreloadItem = {
      id,
      loader,
      priority,
      loaded: false
    };

    preloadQueue.current.set(id, item);
    setQueueLength(preloadQueue.current.size);

    // Ejecutar preload basado en prioridad
    const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 500;
    
    setTimeout(async () => {
      try {
        await loader();
        item.loaded = true;
        loadedComponents.current.add(id);
        preloadQueue.current.delete(id);
        setQueueLength(preloadQueue.current.size);
      } catch (error) {
        console.warn(`Failed to preload component ${id}:`, error);
        preloadQueue.current.delete(id);
        setQueueLength(preloadQueue.current.size);
      }
    }, delay);

    return loader();
  }, []);

  const isLoaded = useCallback((id: string) => {
    return loadedComponents.current.has(id);
  }, []);

  const clearQueue = useCallback(() => {
    preloadQueue.current.clear();
    setQueueLength(0);
  }, []);

  return {
    addToPreloadQueue,
    isLoaded,
    clearQueue,
    queueLength
  };
};