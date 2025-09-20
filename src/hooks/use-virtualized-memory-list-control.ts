import { useRef, useCallback } from 'react';

/**
 * Hook para controlar la lista virtualizada externamente
 */
export const useVirtualizedMemoryListControl = () => {
  const scrollToTopRef = useRef<(() => void) | null>(null);
  const scrollToMemoryRef = useRef<((memoryId: string) => void) | null>(null);

  const scrollToTop = useCallback(() => {
    scrollToTopRef.current?.();
  }, []);

  const scrollToMemory = useCallback((memoryId: string) => {
    scrollToMemoryRef.current?.(memoryId);
  }, []);

  const registerControls = useCallback((
    scrollToTopFn: () => void,
    scrollToMemoryFn: (memoryId: string) => void
  ) => {
    scrollToTopRef.current = scrollToTopFn;
    scrollToMemoryRef.current = scrollToMemoryFn;
  }, []);

  return {
    scrollToTop,
    scrollToMemory,
    registerControls
  };
};