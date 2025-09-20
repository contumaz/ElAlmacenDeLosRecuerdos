import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Configuración avanzada para virtual scrolling
 */
export interface VirtualScrollConfig {
  /** Altura del contenedor */
  containerHeight: number;
  /** Altura estimada de cada item (para items dinámicos) */
  estimatedItemHeight: number;
  /** Número de items extra a renderizar fuera del viewport */
  overscan?: number;
  /** Habilitar scroll suave */
  smoothScrolling?: boolean;
  /** Umbral para detectar scroll rápido */
  fastScrollThreshold?: number;
  /** Debounce para recálculo de posiciones */
  recalculateDebounce?: number;
  /** Habilitar medición dinámica de alturas */
  dynamicHeight?: boolean;
  /** Padding superior e inferior */
  padding?: { top?: number; bottom?: number };
}

/**
 * Item virtualizado con información de posición
 */
export interface VirtualizedItem<T> {
  item: T;
  index: number;
  top: number;
  height: number;
  isVisible: boolean;
}

/**
 * Rango visible en el viewport
 */
export interface VisibleRange {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

/**
 * Métricas de rendimiento del virtual scrolling
 */
export interface VirtualScrollMetrics {
  totalItems: number;
  visibleItems: number;
  renderTime: number;
  scrollPosition: number;
  scrollPercentage: number;
  isScrolling: boolean;
  isFastScrolling: boolean;
}

/**
 * Hook avanzado para virtual scrolling con soporte para alturas dinámicas
 */
export const useAdvancedVirtualScrolling = <T>(
  items: T[],
  config: VirtualScrollConfig
) => {
  const {
    containerHeight,
    estimatedItemHeight,
    overscan = 5,
    smoothScrolling = true,
    fastScrollThreshold = 1000,
    recalculateDebounce = 100,
    dynamicHeight = false,
    padding = { top: 0, bottom: 0 }
  } = config;

  // Estados principales
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const [renderTime, setRenderTime] = useState(0);

  // Referencias para optimización
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const itemOffsetsRef = useRef<number[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const recalculateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTopRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const renderStartTimeRef = useRef(0);

  // Calcular offsets de items con soporte para alturas dinámicas
  const calculateItemOffsets = useCallback(() => {
    const offsets: number[] = [];
    let currentOffset = padding.top || 0;
    
    for (let i = 0; i < items.length; i++) {
      offsets[i] = currentOffset;
      const itemHeight = dynamicHeight 
        ? (itemHeightsRef.current.get(i) || estimatedItemHeight)
        : estimatedItemHeight;
      currentOffset += itemHeight;
    }
    
    itemOffsetsRef.current = offsets;
    return offsets;
  }, [items.length, estimatedItemHeight, dynamicHeight, padding.top]);

  // Encontrar el índice del item en una posición específica
  const findItemIndex = useCallback((offset: number) => {
    const offsets = itemOffsetsRef.current;
    let left = 0;
    let right = offsets.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midOffset = offsets[mid];
      
      if (midOffset === offset) return mid;
      if (midOffset < offset) left = mid + 1;
      else right = mid - 1;
    }
    
    return Math.max(0, right);
  }, []);

  // Calcular rango visible optimizado
  const visibleRange = useMemo((): VisibleRange => {
    if (items.length === 0) {
      return {
        startIndex: 0,
        endIndex: -1,
        offsetY: 0
      };
    }
    
    const offsets = calculateItemOffsets();
    
    const startIndex = Math.max(0, findItemIndex(scrollTop) - overscan);
    const endOffset = scrollTop + containerHeight;
    let endIndex = findItemIndex(endOffset) + overscan;
    
    endIndex = Math.min(items.length - 1, endIndex);
    
    return {
      startIndex,
      endIndex,
      offsetY: offsets[startIndex] || 0
    };
  }, [scrollTop, containerHeight, items.length, overscan, calculateItemOffsets, findItemIndex]);

  // Generar items visibles con información completa
  const visibleItems = useMemo((): VirtualizedItem<T>[] => {
    renderStartTimeRef.current = performance.now();
    
    const result: VirtualizedItem<T>[] = [];
    const offsets = itemOffsetsRef.current;
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i >= items.length || i < 0) break;
      
      const itemHeight = dynamicHeight 
        ? (itemHeightsRef.current.get(i) || estimatedItemHeight)
        : estimatedItemHeight;
      
      result.push({
        item: items[i],
        index: i,
        top: offsets[i] || 0,
        height: itemHeight,
        isVisible: true
      });
    }
    
    // Medir tiempo de renderizado
    const renderDuration = performance.now() - renderStartTimeRef.current;
    setRenderTime(renderDuration);
    
    return result;
  }, [items, visibleRange, estimatedItemHeight, dynamicHeight]);

  // Calcular altura total con soporte para alturas dinámicas
  const totalHeight = useMemo(() => {
    if (items.length === 0) return (padding.top || 0) + (padding.bottom || 0);
    
    calculateItemOffsets();
    const offsets = itemOffsetsRef.current;
    const lastOffset = offsets[items.length - 1] || 0;
    const lastItemHeight = dynamicHeight 
      ? (itemHeightsRef.current.get(items.length - 1) || estimatedItemHeight)
      : estimatedItemHeight;
    
    return lastOffset + lastItemHeight + (padding.bottom || 0);
  }, [items.length, estimatedItemHeight, dynamicHeight, padding.bottom, padding.top, calculateItemOffsets]);

  // Manejar scroll con detección de velocidad
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const newScrollTop = element.scrollTop;
    
    // Calcular velocidad de scroll
    const now = performance.now();
    const timeDelta = now - lastScrollTimeRef.current;
    const scrollDelta = Math.abs(newScrollTop - scrollTop);
    const velocity = timeDelta > 0 ? scrollDelta / timeDelta : 0;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    setIsFastScrolling(velocity > fastScrollThreshold);
    
    lastScrollTimeRef.current = now;
    
    // Limpiar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Detectar fin de scroll
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      setIsFastScrolling(false);
    }, 150);
  }, [scrollTop, fastScrollThreshold]);

  // Registrar altura de un item específico
  const measureItem = useCallback((index: number, height: number) => {
    if (!dynamicHeight) return;
    
    const currentHeight = itemHeightsRef.current.get(index);
    if (currentHeight !== height) {
      itemHeightsRef.current.set(index, height);
      
      // Debounce recálculo de offsets
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
      
      recalculateTimeoutRef.current = setTimeout(() => {
        calculateItemOffsets();
      }, recalculateDebounce);
    }
  }, [dynamicHeight, calculateItemOffsets, recalculateDebounce]);

  // Scroll programático a un índice específico
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) return;
    
    const offsets = calculateItemOffsets();
    const itemOffset = offsets[index] || 0;
    const itemHeight = dynamicHeight 
      ? (itemHeightsRef.current.get(index) || estimatedItemHeight)
      : estimatedItemHeight;
    
    let scrollTo = itemOffset;
    
    switch (align) {
      case 'center':
        scrollTo = itemOffset - (containerHeight - itemHeight) / 2;
        break;
      case 'end':
        scrollTo = itemOffset - containerHeight + itemHeight;
        break;
    }
    
    scrollTo = Math.max(0, Math.min(scrollTo, totalHeight - containerHeight));
    
    if (smoothScrolling) {
      scrollElementRef.current.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    } else {
      scrollElementRef.current.scrollTop = scrollTo;
    }
  }, [items.length, calculateItemOffsets, dynamicHeight, estimatedItemHeight, containerHeight, totalHeight, smoothScrolling]);

  // Scroll a un offset específico
  const scrollToOffset = useCallback((offset: number) => {
    if (!scrollElementRef.current) return;
    
    const clampedOffset = Math.max(0, Math.min(offset, totalHeight - containerHeight));
    
    if (smoothScrolling) {
      scrollElementRef.current.scrollTo({
        top: clampedOffset,
        behavior: 'smooth'
      });
    } else {
      scrollElementRef.current.scrollTop = clampedOffset;
    }
  }, [totalHeight, containerHeight, smoothScrolling]);

  // Métricas de rendimiento
  const metrics = useMemo((): VirtualScrollMetrics => {
    const scrollPercentage = totalHeight > containerHeight 
      ? (scrollTop / (totalHeight - containerHeight)) * 100
      : 0;
    
    return {
      totalItems: items.length,
      visibleItems: visibleItems.length,
      renderTime,
      scrollPosition: scrollTop,
      scrollPercentage: Math.min(100, Math.max(0, scrollPercentage)),
      isScrolling,
      isFastScrolling
    };
  }, [items.length, visibleItems.length, renderTime, scrollTop, totalHeight, containerHeight, isScrolling, isFastScrolling]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (recalculateTimeoutRef.current) clearTimeout(recalculateTimeoutRef.current);
    };
  }, []);

  // Recalcular offsets cuando cambien los items
  useEffect(() => {
    calculateItemOffsets();
  }, [calculateItemOffsets]);

  return {
    // Elementos principales
    visibleItems,
    totalHeight,
    visibleRange,
    
    // Referencias y handlers
    scrollElementRef,
    handleScroll,
    
    // Funciones de control
    scrollToIndex,
    scrollToOffset,
    measureItem,
    
    // Estado y métricas
    metrics,
    isScrolling,
    isFastScrolling,
    
    // Utilidades
    getItemHeight: (index: number) => {
      return dynamicHeight 
        ? (itemHeightsRef.current.get(index) || estimatedItemHeight)
        : estimatedItemHeight;
    },
    
    resetMeasurements: () => {
      itemHeightsRef.current.clear();
      calculateItemOffsets();
    }
  };
};

/**
 * Hook simplificado para casos de uso básicos
 */
export const useSimpleVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  return useAdvancedVirtualScrolling(items, {
    containerHeight,
    estimatedItemHeight: itemHeight,
    overscan,
    dynamicHeight: false,
    smoothScrolling: true
  });
};

/**
 * Interface para props del componente wrapper de virtual scrolling
 */
export interface VirtualScrollContainerProps {
  height: number;
  className?: string;
  children: React.ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Hook para medir automáticamente la altura de elementos
 */
export const useItemMeasurement = () => {
  const measureRef = useRef<(index: number, height: number) => void>();
  
  const setMeasureCallback = useCallback((callback: (index: number, height: number) => void) => {
    measureRef.current = callback;
  }, []);
  
  const measureElement = useCallback((element: HTMLElement | null, index: number) => {
    if (!element || !measureRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && measureRef.current) {
        measureRef.current(index, entry.contentRect.height);
      }
    });
    
    resizeObserver.observe(element);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  return {
    setMeasureCallback,
    measureElement
  };
};