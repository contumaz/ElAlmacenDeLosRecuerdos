/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Config } from '@/types';

/** Tipos de tema disponibles en la aplicación */
type Theme = 'light' | 'dark' | 'warm';

/** Tipos de densidad de interfaz disponibles */
type Density = 'compact' | 'comfortable' | 'spacious';

/**
 * Contexto de tema y densidad de la aplicación
 * Proporciona funciones para cambiar el tema y la densidad de la interfaz
 */
interface ThemeContextType {
  /** Tema actual de la aplicación */
  theme: Theme;
  /** Densidad actual de la interfaz */
  density: Density;
  /** Función para cambiar el tema */
  setTheme: (theme: Theme) => void;
  /** Función para cambiar la densidad */
  setDensity: (density: Density) => void;
  /** Función para aplicar configuración completa de tema */
  applyTheme: (config: Config) => void;
}

/**
 * Contexto React para el manejo de temas
 * Proporciona acceso global al estado del tema y funciones de control
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Proveedor de contexto para temas y densidad de interfaz
 * Maneja la aplicación de temas al DOM y persistencia en almacenamiento
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto
 * @returns {JSX.Element} Proveedor de contexto con funcionalidad de temas
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  console.log('🚀 ThemeProvider montado!');
  
  // Debug temporal
  if (typeof window !== 'undefined') {
    (window as any).themeDebug = {
      mounted: true,
      timestamp: new Date().toISOString()
    };
  }
  const [theme, setThemeState] = useState<Theme>('warm');
  const [density, setDensityState] = useState<Density>('comfortable');

  // Aplicar tema al DOM
  const applyThemeToDOM = (newTheme: Theme) => {
    const html = document.documentElement;
    const body = document.body;
    
    // Remover clases de tema anteriores del html y body
    html.classList.remove('light', 'dark', 'warm');
    body.classList.remove('light', 'dark', 'warm');
    
    // Agregar nueva clase de tema al html y body
    html.classList.add(newTheme);
    body.classList.add(newTheme);
    
    console.log(`🎨 Tema aplicado: ${newTheme}`);
    console.log('HTML classes:', html.classList.toString());
    console.log('Body classes:', body.classList.toString());
  };

  // Aplicar densidad al DOM
  const applyDensityToDOM = (newDensity: Density) => {
    const html = document.documentElement;
    const body = document.body;
    
    // Remover clases de densidad anteriores del html y body
    html.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    
    // Agregar nueva clase de densidad al html y body
    html.classList.add(`density-${newDensity}`);
    body.classList.add(`density-${newDensity}`);
    
    console.log(`📏 Densidad aplicada: ${newDensity}`);
    console.log('HTML classes:', html.classList.toString());
    console.log('Body classes:', body.classList.toString());
  };

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
  }, []);

  const setDensity = useCallback((newDensity: Density) => {
    setDensityState(newDensity);
    applyDensityToDOM(newDensity);
  }, []);

  const applyTheme = (config: Config) => {
    if (config.theme && config.theme !== theme) {
      setTheme(config.theme as Theme);
    }
    if (config.density && config.density !== density) {
      setDensity(config.density as Density);
    }
  };

  // Cargar tema inicial desde localStorage
  useEffect(() => {
    console.log('🎨 ThemeProvider: Inicializando...');
    const loadInitialTheme = async () => {
      try {
        let savedConfig;
        if (window.electronAPI && window.electronAPI.storage) {
          savedConfig = await window.electronAPI.storage.getConfig('userConfig', {
            theme: 'warm',
            density: 'comfortable'
          });
        } else {
          const stored = localStorage.getItem('userConfig');
          savedConfig = stored ? JSON.parse(stored) : {
            theme: 'warm',
            density: 'comfortable'
          };
        }
        
        if (savedConfig.theme) {
          setTheme(savedConfig.theme as Theme);
        }
        if (savedConfig.density) {
          setDensity(savedConfig.density as Density);
        }
      } catch (error) {
        console.error('Error loading theme config:', error);
        // Aplicar tema por defecto
        setTheme('warm');
        setDensity('comfortable');
      }
    };

    loadInitialTheme();
  }, [setTheme, setDensity]);

  // Aplicar tema inicial al montar
  useEffect(() => {
    applyThemeToDOM(theme);
    applyDensityToDOM(density);
  }, [theme, density]);

  return (
    <ThemeContext.Provider value={{
      theme,
      density,
      setTheme,
      setDensity,
      applyTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de temas
 * Proporciona acceso a la configuración de tema y densidad de la aplicación
 * 
 * @returns {ThemeContextType} Objeto con tema actual, densidad y funciones de control
 * @throws {Error} Si se usa fuera del ThemeProvider
 * 
 * @example
 * ```tsx
 * const { theme, density, setTheme, setDensity } = useTheme();
 * 
 * // Cambiar tema
 * setTheme('dark');
 * 
 * // Cambiar densidad
 * setDensity('compact');
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}