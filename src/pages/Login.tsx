import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  Shield, 
  Database,
  Heart,
  Lock,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth-hook';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      const success = await login(credentials);
      if (success) {
        navigate('/');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error al conectar con el sistema');
    }
  };

  const handleInputChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">El Almacén</h1>
            <p className="text-lg text-amber-700">de los Recuerdos</p>
            <p className="text-sm text-amber-600 mt-2">
              Tu archivo personal seguro para crear legados digitales
            </p>
          </div>
        </div>

        {/* Tarjeta de login */}
        <Card className="shadow-xl border-amber-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center text-amber-900">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Accede a tu almacén de recuerdos personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de usuario */}
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="pl-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo de contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="pl-10 pr-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-amber-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Recordarme */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-amber-700">
                  Recordar mi sesión
                </Label>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Botón de login */}
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Accediendo...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Acceder
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información de seguridad */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900">Completamente Seguro</h4>
                <p className="text-xs text-amber-700">
                  Cifrado AES-256 • Almacenamiento local • Sin conexión a internet requerida
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Características principales */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Memorias</h4>
              <p className="text-xs text-amber-600">Guarda textos, audio y fotos</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">IA Local</h4>
              <p className="text-xs text-amber-600">Entrevistas inteligentes</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Privado</h4>
              <p className="text-xs text-amber-600">100% cifrado y local</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-amber-600">
            ¿Primera vez? La aplicación creará tu cuenta automáticamente.
          </p>
          <p className="text-xs text-amber-500">
            Versión 1.0.0 • Desarrollado con ❤️ para preservar memorias
          </p>
        </div>
      </div>
    </div>
  );
}
