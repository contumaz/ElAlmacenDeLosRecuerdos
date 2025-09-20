import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Calendar,
  Users,
  Settings,
  FileText,
  Mic,
  Image,
  Video,
  Heart,
  MessageSquare,
  Database,
  LogOut,
  TrendingUp,
  Share2,
  Contact,
  Mail,
  Phone,
  Camera,
  Shield
} from 'lucide-react';
import { THEMATIC_CATEGORIES } from '@/config/categories';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth-hook';
import { useNavigation } from '@/hooks/useNavigation';
import { useQuickActionsConfig } from '@/hooks/useQuickActionsConfig';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Vista general de tus recuerdos'
  },
  {
    name: 'Mis Memorias',
    href: '/memorias',
    icon: Heart,
    description: 'Gestiona todos tus recuerdos',
    children: [
      { name: 'Todas', href: '/memorias', icon: FileText },
      ...THEMATIC_CATEGORIES.map(category => ({
        name: category.label,
        href: `/memorias/${category.key}`,
        icon: FileText // Usamos un icono genérico por ahora, se puede mejorar
      }))
    ]
  },
  {
    name: 'Entrevistas',
    href: '/entrevistas',
    icon: MessageSquare,
    description: 'Conversaciones con la IA'
  },
  {
    name: 'Análisis Emocional',
    href: '/analisis-emocional',
    icon: TrendingUp,
    description: 'Análisis de emociones con IA'
  },

];

const quickActions = [
  {
    name: 'Nueva Memoria',
    href: '/memorias/nueva',
    icon: Heart,
    description: 'Crear nueva memoria'
  },
  {
    name: 'Entrevista IA',
    href: '/entrevistas/nueva',
    icon: MessageSquare,
    description: 'Nueva entrevista con IA'
  },
  {
    name: 'Redes Sociales',
    href: '/redes-sociales',
    icon: Share2,
    description: 'Gestionar redes sociales'
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Contact,
    description: 'Ver agenda'
  },
  {
    name: 'Correo',
    href: '/correo',
    icon: Mail,
    description: 'Gestionar correo'
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: Phone,
    description: 'WhatsApp'
  },
  {
    name: 'Fotos',
    href: '/fotos',
    icon: Camera,
    description: 'Gestionar fotos'
  },
  {
    name: 'Contactos',
    href: '/contactos',
    icon: Users,
    description: 'Agenda de contactos'
  },
  {
    name: 'Backup',
    href: '/seguridad',
    icon: Shield,
    description: 'Seguridad y backup'
  },
  {
    name: 'Familiares',
    href: '/usuarios',
    icon: Users,
    description: 'Gestionar familiares'
  }
];

const bottomNavigation = [
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    description: 'Ajustes de la aplicación'
  }
];

export function Sidebar({ className }: SidebarProps) {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { currentPath, isNavigating } = useNavigation();
  const { quickActions: userQuickActions } = useQuickActionsConfig();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar navegación al login incluso si hay error
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200", className)}>
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-amber-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-900">El Almacén</h1>
            <p className="text-sm text-amber-700">de los Recuerdos</p>
          </div>
        </div>
      </div>

      {/* Usuario actual */}
      <div className="p-4 border-b border-amber-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-amber-600 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-amber-200 text-amber-900"
                    : "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
            
            {/* Subnavegación */}
            {item.children && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.name}
                    to={child.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-1 text-xs font-medium rounded transition-colors",
                        isActive
                          ? "bg-amber-200 text-amber-900"
                          : "text-amber-600 hover:bg-amber-100 hover:text-amber-800"
                      )
                    }
                  >
                    <child.icon className="w-4 h-4 mr-2" />
                    {child.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Acciones Rápidas */}
        {userQuickActions.filter(action => action.enabled).length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 mb-3 text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {userQuickActions
                .filter(action => action.enabled)
                .map((action) => (
                  <NavLink
                    key={action.id}
                    to={action.href}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center p-2 text-xs font-medium rounded-lg transition-colors text-center",
                        isActive
                          ? "bg-amber-200 text-amber-900"
                          : "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                      )
                    }
                  >
                    <action.icon className="w-4 h-4 mb-1" />
                    <span className="text-xs leading-tight">{action.name}</span>
                  </NavLink>
                ))
              }
            </div>
          </div>
        )}

        <div className="my-4 border-t border-amber-200" />

        {/* Navegación inferior */}
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-amber-200 text-amber-900"
                  : "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Botón de cerrar sesión */}
      <div className="p-4 border-t border-amber-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-amber-700 hover:bg-amber-100 hover:text-amber-900"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
