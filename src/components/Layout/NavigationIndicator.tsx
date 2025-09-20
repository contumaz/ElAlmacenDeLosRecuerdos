import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationIndicatorProps {
  className?: string;
}

export function NavigationIndicator({ className }: NavigationIndicatorProps) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular barra de progreso en navegación
    setIsNavigating(true);
    setProgress(0);
    
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isNavigating) return null;

  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50", className)}>
      <div 
        className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default NavigationIndicator;
