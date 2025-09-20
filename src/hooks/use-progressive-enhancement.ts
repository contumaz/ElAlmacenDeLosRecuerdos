import { useState, useEffect } from 'react';

/**
 * Hook para progressive enhancement
 */
export const useProgressiveEnhancement = (features: string[]) => {
  const [supportedFeatures, setSupportedFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkFeatureSupport = () => {
      const supported = new Set<string>();

      features.forEach(feature => {
        switch (feature) {
          case 'intersectionObserver':
            if ('IntersectionObserver' in window) supported.add(feature);
            break;
          case 'webp': {
            const canvas = document.createElement('canvas');
            if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
              supported.add(feature);
            }
            break;
          }
          case 'serviceWorker':
            if ('serviceWorker' in navigator) supported.add(feature);
            break;
          case 'localStorage':
            try {
              localStorage.setItem('test', 'test');
              localStorage.removeItem('test');
              supported.add(feature);
            } catch {
              // localStorage not supported
            }
            break;
          default:
            if (feature in window) supported.add(feature);
        }
      });

      setSupportedFeatures(supported);
    };

    checkFeatureSupport();
  }, [features]);

  const isSupported = (feature: string) => supportedFeatures.has(feature);
  const hasAllFeatures = () => features.every(feature => supportedFeatures.has(feature));
  const getSupportedFeatures = () => Array.from(supportedFeatures);

  return {
    supportedFeatures,
    isSupported,
    hasAllFeatures,
    getSupportedFeatures
  };
};