import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Database } from 'lucide-react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToMemories = () => {
    navigate('/memorias');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <div className="text-8xl font-bold text-amber-300 mb-4">404</div>
            <h1 className="text-3xl font-bold text-amber-900">Página no encontrada</h1>
            <p className="text-lg text-amber-700 mt-2">
              La página que buscas no existe en El Almacén de los Recuerdos
            </p>
          </div>
        </div>

        {/* Tarjeta de opciones */}
        <Card className="shadow-xl border-amber-200">
          <CardHeader>
            <CardTitle className="text-xl text-amber-900 text-center">
              ¿Qué te gustaría hacer?
            </CardTitle>
            <CardDescription className="text-center">
              Te ayudamos a encontrar lo que buscas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botones de navegación */}
            <div className="grid gap-3">
              <Button 
                onClick={handleGoHome}
                className="w-full justify-start h-12"
                variant="default"
              >
                <Home className="w-5 h-5 mr-3" />
                Ir al Dashboard
              </Button>
              
              <Button 
                onClick={handleGoToMemories}
                variant="outline"
                className="w-full justify-start h-12"
              >
                <Database className="w-5 h-5 mr-3" />
                Ver mis Memorias
              </Button>
              
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="w-full justify-start h-12"
              >
                <ArrowLeft className="w-5 h-5 mr-3" />
                Volver atrás
              </Button>
            </div>

            {/* Información de ayuda */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-800 font-medium mb-2">💡 Sugerencias:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Verifica que la URL esté escrita correctamente</li>
                <li>• La página podría haber sido movida o eliminada</li>
                <li>• Usa el menú de navegación para encontrar lo que buscas</li>
                <li>• Si el problema persiste, contacta al soporte técnico</li>
              </ul>
            </div>

            {/* Enlaces rápidos */}
            <div className="pt-4 border-t border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-3">Enlaces rápidos:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => navigate('/memorias/nueva')}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                >
                  Crear nueva memoria
                </Button>
                <Button 
                  onClick={() => navigate('/entrevistas')}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                >
                  Entrevistas
                </Button>
                <Button 
                  onClick={() => navigate('/configuracion')}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                >
                  Configuración
                </Button>
                <Button 
                  onClick={() => navigate('/memorias')}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                >
                  Todas las memorias
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NotFound;
