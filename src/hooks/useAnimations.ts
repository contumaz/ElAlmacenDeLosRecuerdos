import { useCallback, useEffect, useRef, useState } from 'react';

interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}

interface UseAnimationReturn {
  isVisible: boolean;
  isAnimating: boolean;
  triggerAnimation: () => void;
  resetAnimation: () => void;
  elementRef: React.RefObject<HTMLElement>;
}

/**
 * Hook for managing smooth animations with intersection observer
 */
export const useInViewAnimation = (
  animationClass: string,
  options: AnimationOptions & { threshold?: number; rootMargin?: string } = {}
): UseAnimationReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { threshold = 0.1, rootMargin = '0px', delay = 0 } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => {
            setIsVisible(true);
            setIsAnimating(true);
            element.classList.add(animationClass);
          }, delay);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [animationClass, threshold, rootMargin, delay, isVisible]);

  const triggerAnimation = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    setIsAnimating(true);
    element.classList.add(animationClass);
    
    // Reset animation state after animation completes
    const animationDuration = options.duration || 300;
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  }, [animationClass, options.duration]);

  const resetAnimation = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    element.classList.remove(animationClass);
    setIsVisible(false);
    setIsAnimating(false);
  }, [animationClass]);

  return {
    isVisible,
    isAnimating,
    triggerAnimation,
    resetAnimation,
    elementRef,
  };
};

/**
 * Hook for managing hover animations
 */
export const useHoverAnimation = (
  hoverClass: string,
  options: AnimationOptions = {}
) => {
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleMouseEnter = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    setIsHovered(true);
    element.classList.add(hoverClass);
  }, [hoverClass]);

  const handleMouseLeave = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    setIsHovered(false);
    element.classList.remove(hoverClass);
  }, [hoverClass]);

  return {
    isHovered,
    elementRef,
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
};

/**
 * Hook for staggered animations
 */
export const useStaggeredAnimation = (
  animationClass: string,
  itemCount: number,
  staggerDelay: number = 100
) => {
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const triggerStaggeredAnimation = useCallback(() => {
    itemRefs.current.forEach((element, index) => {
      if (!element) return;

      setTimeout(() => {
        element.classList.add(animationClass);
        setAnimatedItems(prev => new Set([...prev, index]));
      }, index * staggerDelay);
    });
  }, [animationClass, staggerDelay]);

  const resetStaggeredAnimation = useCallback(() => {
    itemRefs.current.forEach((element) => {
      if (element) {
        element.classList.remove(animationClass);
      }
    });
    setAnimatedItems(new Set());
  }, [animationClass]);

  const getItemRef = useCallback((index: number) => {
    return (element: HTMLElement | null) => {
      itemRefs.current[index] = element;
    };
  }, []);

  return {
    animatedItems,
    triggerStaggeredAnimation,
    resetStaggeredAnimation,
    getItemRef,
  };
};

/**
 * Hook for managing loading state animations
 */
export const useLoadingAnimation = (isLoading: boolean) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'loaded' | 'idle'>(
    isLoading ? 'loading' : 'idle'
  );

  useEffect(() => {
    if (isLoading) {
      setAnimationPhase('loading');
      setShowContent(false);
    } else {
      setAnimationPhase('loaded');
      // Small delay to allow loading animation to complete
      setTimeout(() => {
        setShowContent(true);
        setTimeout(() => {
          setAnimationPhase('idle');
        }, 300); // Match fade-in animation duration
      }, 100);
    }
  }, [isLoading]);

  return {
    showContent,
    animationPhase,
    shouldShowSkeleton: animationPhase === 'loading',
    shouldAnimateIn: animationPhase === 'loaded',
  };
};

/**
 * Utility function to create optimized CSS transitions
 */
export const createTransition = (
  properties: string[],
  duration: number = 300,
  easing: string = 'ease-out'
): string => {
  return properties
    .map(prop => `${prop} ${duration}ms ${easing}`)
    .join(', ');
};

/**
 * Utility function to add performance optimizations to animations
 */
export const optimizeAnimation = (element: HTMLElement) => {
  // Enable hardware acceleration
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  
  // Clean up after animation
  const cleanup = () => {
    element.style.willChange = 'auto';
  };
  
  return cleanup;
};

/**
 * Hook for managing page transitions
 */
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    setTransitionPhase('exit');
    
    // After exit animation completes
    setTimeout(() => {
      setTransitionPhase('enter');
      
      // After enter animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionPhase('idle');
      }, 300);
    }, 300);
  }, []);

  return {
    isTransitioning,
    transitionPhase,
    startTransition,
  };
};