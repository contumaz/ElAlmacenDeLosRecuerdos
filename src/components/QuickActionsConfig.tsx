import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Badge from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  Info,
  CheckCircle
} from 'lucide-react';
import { useQuickActionsConfig, QuickAction } from '@/hooks/useQuickActionsConfig';
import { toast } from 'sonner';

interface QuickActionsConfigProps {
  className?: string;
}

export function QuickActionsConfig({ className }: QuickActionsConfigProps) {
  const {
    quickActions,
    isLoading,
    toggleAction,
    reorderActions,
    resetToDefault,
    getConfig
  } = useQuickActionsConfig();

  const [localActions, setLocalActions] = useState<QuickAction[]>(quickActions);
  const [hasChanges, setHasChanges] = useState(false);

  // Actualizar acciones locales cuando cambien las del hook
  React.useEffect(() => {
    setLocalActions(quickActions);
    setHasChanges(false);
  }, [quickActions]);

  // Manejar drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalActions(items);
    setHasChanges(true);
  };

  // Alternar habilitado/deshabilitado
  const handleToggle = (actionId: string) => {
    const updatedActions = localActions.map(action =>
      action.id === actionId ? { ...action, enabled: !action.enabled } : action
    );
    setLocalActions(updatedActions);
    setHasChanges(true);
  };

  // Guardar cambios
  const handleSaveChanges = () => {
    reorderActions(localActions);
    localActions.forEach(action => {
      const originalAction = quickActions.find(a => a.id === action.id);
      if (originalAction && originalAction.enabled !== action.enabled) {
        toggleAction(action.id);
      }
    });
    setHasChanges(false);
    toast.success('Configuración de acciones rápidas guardada');
  };

  // Descartar cambios
  const handleDiscardChanges = () => {
    setLocalActions(quickActions);
    setHasChanges(false);
    toast.info('Cambios descartados');
  };

  // Resetear a configuración por defecto
  const handleReset = () => {
    resetToDefault();
    setHasChanges(false);
    toast.success('Configuración restablecida a valores por defecto');
  };

  const config = getConfig();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Cargando configuración...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Configuración de Acciones Rápidas</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Personaliza qué acciones aparecen en el sidebar y dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Arrastra para reordenar y usa los interruptores para habilitar/deshabilitar acciones
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {config.enabledCount} de {config.totalCount} habilitadas
              </Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Resetear configuración?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto restaurará todas las acciones rápidas a su configuración por defecto.
                      Se perderán todos los cambios personalizados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Resetear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="quick-actions">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localActions.map((action, index) => (
                    <Draggable key={action.id} draggableId={action.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center space-x-3 p-3 bg-white border rounded-lg transition-all ${
                            snapshot.isDragging ? 'shadow-lg border-amber-300' : 'border-gray-200'
                          } ${!action.enabled ? 'opacity-60' : ''}`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              action.enabled ? 'bg-amber-100' : 'bg-gray-100'
                            }`}>
                              <action.icon className={`w-4 h-4 ${
                                action.enabled ? 'text-amber-600' : 'text-gray-400'
                              }`} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{action.name}</h4>
                                {action.enabled && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{action.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{action.href}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {action.enabled ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.enabled ? 'Visible' : 'Oculta'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <Switch
                              checked={action.enabled}
                              onCheckedChange={() => handleToggle(action.id)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {hasChanges && (
            <div className="flex items-center justify-between mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm text-amber-700 font-medium">
                  Tienes cambios sin guardar
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                  Descartar
                </Button>
                <Button size="sm" onClick={handleSaveChanges}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickActionsConfig;