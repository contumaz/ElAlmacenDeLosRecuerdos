import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeDebug() {
  const { theme, density, setTheme, setDensity } = useTheme();
  const [domClasses, setDomClasses] = useState({ html: '', body: '' });

  // Actualizar clases del DOM en tiempo real
  useEffect(() => {
    const updateDomClasses = () => {
      setDomClasses({
        html: document.documentElement.className,
        body: document.body.className
      });
    };
    
    updateDomClasses();
    const interval = setInterval(updateDomClasses, 500);
    return () => clearInterval(interval);
  }, [theme, density]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 shadow-xl z-50 max-w-sm">
      <h3 className="font-bold mb-2 text-red-600">🔧 Debug de Tema</h3>
      
      <div className="mb-3 text-sm">
        <p><strong>Tema actual:</strong> <span className="text-blue-600">{theme}</span></p>
        <p><strong>Densidad actual:</strong> <span className="text-green-600">{density}</span></p>
        <p><strong>HTML classes:</strong> <span className="text-xs text-gray-600">{domClasses.html || 'ninguna'}</span></p>
        <p><strong>Body classes:</strong> <span className="text-xs text-gray-600">{domClasses.body || 'ninguna'}</span></p>
      </div>
      
      <div className="mb-2">
        <p className="text-sm font-medium mb-1">Cambiar tema:</p>
        <div className="flex gap-1 flex-wrap">
          <button 
            onClick={() => {
              console.log('🔄 Cambiando tema a light');
              setTheme('light');
            }}
            className={`px-2 py-1 text-xs rounded ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Claro
          </button>
          <button 
            onClick={() => {
              console.log('🔄 Cambiando tema a dark');
              setTheme('dark');
            }}
            className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Oscuro
          </button>
          <button 
            onClick={() => {
              console.log('🔄 Cambiando tema a warm');
              setTheme('warm');
            }}
            className={`px-2 py-1 text-xs rounded ${theme === 'warm' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Cálido
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-medium mb-1">Cambiar densidad:</p>
        <div className="flex gap-1 flex-wrap">
          <button 
            onClick={() => {
              console.log('🔄 Cambiando densidad a compact');
              setDensity('compact');
            }}
            className={`px-2 py-1 text-xs rounded ${density === 'compact' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Compacta
          </button>
          <button 
            onClick={() => {
              console.log('🔄 Cambiando densidad a comfortable');
              setDensity('comfortable');
            }}
            className={`px-2 py-1 text-xs rounded ${density === 'comfortable' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Cómoda
          </button>
          <button 
            onClick={() => {
              console.log('🔄 Cambiando densidad a spacious');
              setDensity('spacious');
            }}
            className={`px-2 py-1 text-xs rounded ${density === 'spacious' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Espaciosa
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <button 
          onClick={() => {
            console.log('🧪 Prueba directa de aplicación de tema');
            const html = document.documentElement;
            const body = document.body;
            html.classList.add('test-class');
            body.classList.add('test-class');
            console.log('HTML classes después de prueba:', html.className);
            console.log('Body classes después de prueba:', body.className);
          }}
          className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🧪 Prueba DOM directa
        </button>
      </div>
    </div>
  );
}