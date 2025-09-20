import { useEffect, useState, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook para observar la intersección de un elemento con el viewport
 */
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn => {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    initialIsIntersecting = false
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const frozenRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Si ya está congelado y visible, no hacer nada
    if (freezeOnceVisible && frozenRef.current) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [observerEntry] = entries;
      setEntry(observerEntry);
      setIsIntersecting(observerEntry.isIntersecting);

      // Congelar el estado si está configurado y el elemento es visible
      if (freezeOnceVisible && observerEntry.isIntersecting) {
        frozenRef.current = true;
        observerRef.current?.disconnect();
      }
    };

    const observerOptions = {
      threshold,
      root,
      rootMargin
    };

    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);
    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  // Reset frozen state when element changes
  useEffect(() => {
    frozenRef.current = false;
  }, [elementRef]);

  return { isIntersecting, entry };
};

/**
 * Hook para observar múltiples elementos
 */
export const useMultipleIntersectionObserver = (
  elementsRefs: React.RefObject<Element>[],
  options: UseIntersectionObserverOptions = {}
) => {
  const [entries, setEntries] = useState<Map<Element, IntersectionObserverEntry>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0,
    root = null,
    rootMargin = '0px'
  } = options;

  useEffect(() => {
    const elements = elementsRefs
      .map(ref => ref.current)
      .filter((el): el is Element => el !== null);

    if (elements.length === 0) return;

    const observerCallback = (observerEntries: IntersectionObserverEntry[]) => {
      setEntries(prev => {
        const newEntries = new Map(prev);
        observerEntries.forEach(entry => {
          newEntries.set(entry.target, entry);
        });
        return newEntries;
      });
    };

    const observerOptions = {
      threshold,
      root,
      rootMargin
    };

    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);
    
    elements.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [elementsRefs, threshold, root, rootMargin]);

  const getIsIntersecting = (element: Element | null): boolean => {
    if (!element) return false;
    return entries.get(element)?.isIntersecting ?? false;
  };

  const getEntry = (element: Element | null): IntersectionObserverEntry | null => {
    if (!element) return null;
    return entries.get(element) ?? null;
  };

  return {
    entries,
    getIsIntersecting,
    getEntry
  };
};

/**
 * Hook para lazy loading con threshold dinámico
 */
export const useLazyLoading = (
  elementRef: React.RefObject<Element>,
  options: {
    rootMargin?: string;
    priority?: boolean;
    onVisible?: () => void;
  } = {}
) => {
  const { rootMargin = '50px', priority = false, onVisible } = options;
  const [hasBeenVisible, setHasBeenVisible] = useState(priority);

  const { isIntersecting } = useIntersectionObserver(elementRef, {
    rootMargin: priority ? '0px' : rootMargin,
    threshold: 0.1,
    freezeOnceVisible: true
  });

  useEffect(() => {
    if (isIntersecting && !hasBeenVisible) {
      setHasBeenVisible(true);
      onVisible?.();
    }
  }, [isIntersecting, hasBeenVisible, onVisible]);

  return {
    isVisible: isIntersecting,
    hasBeenVisible,
    shouldLoad: hasBeenVisible || priority
  };
};

/**
 * Hook para scroll infinito
 */
export const useInfiniteScroll = (
  loadMore: () => void,
  options: {
    rootMargin?: string;
    threshold?: number;
    hasMore?: boolean;
    isLoading?: boolean;
  } = {}
) => {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    hasMore = true,
    isLoading = false
  } = options;

  const triggerRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(triggerRef, {
    rootMargin,
    threshold
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  return { triggerRef };
};