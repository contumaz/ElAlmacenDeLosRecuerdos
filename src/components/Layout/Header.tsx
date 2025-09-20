import React, { useState } from 'react';
import { Search, Bell, Shield, Wifi, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth-hook';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export function Header({ onSearch, className }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const notifications = [
    {
      id: 1,
      title: 'Backup completado',
      message: 'Tu backup cifrado se ha guardado correctamente',
      time: '5 min',
      type: 'success'
    },
    {
      id: 2,
      title: 'Nueva memoria transcrita',
      message: 'Tu grabación de audio ha sido transcrita',
      time: '1 hora',
      type: 'info'
    }
  ];

  return (
    <header className={cn("bg-white border-b border-amber-200 px-6 py-4", className)}>
      <div className="flex items-center justify-between">
        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar en tus recuerdos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
            />
          </form>
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center space-x-4">
          {/* Estado de conexión */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs font-medium">Sin conexión</span>
              </div>
            )}
          </div>

          {/* Indicador de seguridad */}
          <div className="flex items-center space-x-1 text-green-600">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">Seguro</span>
          </div>

          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-amber-600" />
                {notifications.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h3 className="font-semibold text-amber-900 mb-2">Notificaciones</h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-amber-600">No hay notificaciones nuevas</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex-col items-start p-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{notification.title}</span>
                          <span className="text-xs text-amber-600">{notification.time}</span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1">{notification.message}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Información del usuario */}
          <div className="flex items-center space-x-2 pl-4 border-l border-amber-200">
            <div className="text-right">
              <p className="text-sm font-medium text-amber-900">{user?.username}</p>
              <p className="text-xs text-amber-600 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
