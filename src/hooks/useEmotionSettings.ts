import { useState, useEffect } from 'react';

interface EmotionSettings {
  enabled: boolean;
  autoAnalyze: boolean;
  showInDashboard: boolean;
  autoInitialize: boolean;
}

const DEFAULT_SETTINGS: EmotionSettings = {
  enabled: true,
  autoAnalyze: true,
  showInDashboard: true,
  autoInitialize: false,
};

const STORAGE_KEY = 'emotionAnalysisSettings';

export const useEmotionSettings = () => {
  const [settings, setSettings] = useState<EmotionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
      
      // Mantener compatibilidad con la configuración anterior
      const oldEnabled = localStorage.getItem('emotionAnalysisEnabled');
      if (oldEnabled === 'false' && !stored) {
        setSettings(prev => ({ ...prev, enabled: false, showInDashboard: false }));
      }
    } catch (error) {
      console.warn('Error loading emotion settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar configuración en localStorage
  const updateSettings = (newSettings: Partial<EmotionSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      
      // Mantener compatibilidad con la configuración anterior
      localStorage.setItem('emotionAnalysisEnabled', updatedSettings.enabled.toString());
    } catch (error) {
      console.error('Error saving emotion settings:', error);
    }
  };

  // Funciones de conveniencia
  const enableAnalysis = () => updateSettings({ enabled: true });
  const disableAnalysis = () => updateSettings({ enabled: false, showInDashboard: false });
  const toggleDashboardDisplay = () => updateSettings({ showInDashboard: !settings.showInDashboard });
  const toggleAutoAnalyze = () => updateSettings({ autoAnalyze: !settings.autoAnalyze });
  const toggleAutoInitialize = () => updateSettings({ autoInitialize: !settings.autoInitialize });

  // Resetear a configuración por defecto
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('emotionAnalysisEnabled');
    } catch (error) {
      console.error('Error resetting emotion settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    enableAnalysis,
    disableAnalysis,
    toggleDashboardDisplay,
    toggleAutoAnalyze,
    toggleAutoInitialize,
    resetSettings,
  };
};

export default useEmotionSettings;