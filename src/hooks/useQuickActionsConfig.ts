import { useState, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Contact,
  Mail,
  Phone,
  Camera,
  Shield,
  Users,
  Bug
} from 'lucide-react';

export interface QuickAction {
  id: string;
  name: string;
  href: string;
  icon: any;
  description: string;
  enabled: boolean;
  order: number;
}

// Acciones rápidas por defecto
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'nueva-memoria',
    name: 'Nueva Memoria',
    href: '/memorias/nueva',
    icon: Heart,
    description: 'Crear una nueva memoria',
    enabled: true,
    order: 1
  },
  {
    id: 'entrevista-ia',
    name: 'Entrevista IA',
    href: '/entrevistas/nueva',
    icon: MessageSquare,
    description: 'Nueva entrevista con IA',
    enabled: true,
    order: 2
  },
  {
    id: 'redes-sociales',
    name: 'Redes Sociales',
    href: '/redes-sociales',
    icon: Share2,
    description: 'Gestionar redes sociales',
    enabled: true,
    order: 3
  },
  {
    id: 'agenda',
    name: 'Agenda',
    href: '/agenda',
    icon: Contact,
    description: 'Ver agenda',
    enabled: true,
    order: 4
  },
  {
    id: 'correo',
    name: 'Correo',
    href: '/correo',
    icon: Mail,
    description: 'Gestionar correo',
    enabled: true,
    order: 5
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: Phone,
    description: 'WhatsApp',
    enabled: true,
    order: 6
  },
  {
    id: 'fotos',
    name: 'Fotos',
    href: '/fotos',
    icon: Camera,
    description: 'Gestionar fotos',
    enabled: true,
    order: 7
  },
  {
    id: 'backup',
    name: 'Backup',
    href: '/seguridad',
    icon: Shield,
    description: 'Seguridad y backup',
    enabled: true,
    order: 8
  },
  {
    id: 'familiares',
    name: 'Familiares',
    href: '/usuarios',
    icon: Users,
    description: 'Gestionar familiares',
    enabled: true,
    order: 9
  },
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    icon: Bug,
    description: 'Herramientas de testing',
    enabled: false,
    order: 10
  }
];

const STORAGE_KEY = 'quickActionsConfig';

export function useQuickActionsConfig() {
  const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Combinar con acciones por defecto para asegurar que nuevas acciones aparezcan
        const mergedActions = DEFAULT_QUICK_ACTIONS.map(defaultAction => {
          const savedAction = parsedConfig.find((action: QuickAction) => action.id === defaultAction.id);
          return savedAction ? { ...defaultAction, ...savedAction } : defaultAction;
        });
        setQuickActions(mergedActions.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading quick actions config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar configuración en localStorage
  const saveConfig = (actions: QuickAction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
      setQuickActions(actions);
    } catch (error) {
      console.error('Error saving quick actions config:', error);
    }
  };

  // Obtener acciones habilitadas ordenadas
  const getEnabledActions = () => {
    return quickActions
      .filter(action => action.enabled)
      .sort((a, b) => a.order - b.order);
  };

  // Obtener acciones para el sidebar (limitadas)
  const getSidebarActions = (limit: number = 9) => {
    return getEnabledActions().slice(0, limit);
  };

  // Obtener acciones para el dashboard
  const getDashboardActions = () => {
    return getEnabledActions();
  };

  // Actualizar una acción específica
  const updateAction = (actionId: string, updates: Partial<QuickAction>) => {
    const updatedActions = quickActions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    );
    saveConfig(updatedActions);
  };

  // Reordenar acciones
  const reorderActions = (newOrder: QuickAction[]) => {
    const reorderedActions = newOrder.map((action, index) => ({
      ...action,
      order: index + 1
    }));
    saveConfig(reorderedActions);
  };

  // Habilitar/deshabilitar acción
  const toggleAction = (actionId: string) => {
    updateAction(actionId, { 
      enabled: !quickActions.find(a => a.id === actionId)?.enabled 
    });
  };

  // Resetear a configuración por defecto
  const resetToDefault = () => {
    saveConfig(DEFAULT_QUICK_ACTIONS);
  };

  // Obtener configuración actual
  const getConfig = () => {
    return {
      actions: quickActions,
      enabledCount: quickActions.filter(a => a.enabled).length,
      totalCount: quickActions.length
    };
  };

  return {
    quickActions,
    isLoading,
    getEnabledActions,
    getSidebarActions,
    getDashboardActions,
    updateAction,
    reorderActions,
    toggleAction,
    resetToDefault,
    getConfig,
    saveConfig
  };
}

export default useQuickActionsConfig;