import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook para navegación con feedback visual
export function useNavigationWithFeedback() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithFeedback = (to: string, options?: any) => {
    setIsNavigating(true);
    
    // Pequeño delay para mostrar feedback visual
    setTimeout(() => {
      navigate(to, options);
      setIsNavigating(false);
    }, 150);
  };

  return {
    navigate: navigateWithFeedback,
    isNavigating
  };
}