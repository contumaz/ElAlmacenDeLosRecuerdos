import React from 'react';
import { MemoryData as Memory } from '@/services/electronAPI';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Mic, Camera, Video, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props para el componente MemoryCard
 */
interface MemoryCardProps {
  /** Datos de la memoria a mostrar */
  memory: Memory;
  /** Estilos CSS opcionales para el contenedor */
  style?: React.CSSProperties;
  /** Callback para ver la memoria */
  onView: (id: number) => void;
  /** Callback para editar la memoria */
  onEdit: (id: number) => void;
  /** Callback para eliminar la memoria */
  onDelete: (id: number) => void;
}

/**
 * Obtiene el icono correspondiente al tipo de memoria
 */
const getTypeIcon = (type: Memory['type']) => {
  switch (type) {
    case 'texto':
      return <FileText className="w-4 h-4" />;
    case 'audio':
      return <Mic className="w-4 h-4" />;
    case 'foto':
      return <Camera className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

/**
 * Obtiene las clases CSS de color para el badge del tipo de memoria
 */
const getTypeColor = (type: Memory['type']) => {
  switch (type) {
    case 'texto': return 'bg-blue-100 text-blue-800';
    case 'audio': return 'bg-green-100 text-green-800';
    case 'foto': return 'bg-purple-100 text-purple-800';
    case 'video': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtiene las clases CSS de color para el badge de emoción
 */
const getEmotionColor = (emotion: string) => {
  switch (emotion) {
    case 'joy': return 'bg-yellow-100 text-yellow-800';
    case 'love': return 'bg-pink-100 text-pink-800';
    case 'nostalgia': return 'bg-indigo-100 text-indigo-800';
    case 'sadness': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Formatea la duración en segundos a formato MM:SS
 */
const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Componente optimizado para mostrar una memoria en formato de tarjeta
 * Diseñado específicamente para uso con virtual scrolling
 */
const MemoryCard: React.FC<MemoryCardProps> = React.memo(({ 
  memory, 
  style, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const typeIcon = getTypeIcon(memory.type);
  const typeColor = getTypeColor(memory.type);
  const emotionColor = memory.metadata?.emotion ? getEmotionColor(memory.metadata.emotion) : null;
  const formattedDuration = formatDuration(memory.metadata?.duration);
  
  const formattedDate = memory.date ? new Date(memory.date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  const handleView = () => onView(memory.id);
  const handleEdit = () => onEdit(memory.id);
  const handleDelete = () => onDelete(memory.id);

  // Procesar tags para mostrar solo los primeros 3
  const visibleTags = memory.tags?.slice(0, 3) || [];
  const hiddenTagsCount = Math.max(0, (memory.tags?.length || 0) - 3);

  return (
    <div style={style}>
      <Card className={cn(
        "group h-full flex flex-col",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:-translate-y-1",
        "border border-gray-200 hover:border-blue-300",
        "bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={cn(
                typeColor,
                "transition-all duration-200 hover:scale-105"
              )}>
                {typeIcon}
                <span className="ml-1 capitalize">{memory.type}</span>
              </Badge>
              {memory.metadata?.emotion && emotionColor && (
                <Badge className={cn(
                  emotionColor,
                  "transition-all duration-200 hover:scale-105"
                )}>
                  {memory.metadata.emotion}
                </Badge>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-300 ease-out",
                    "hover:bg-blue-100 hover:scale-110"
                  )}
                >
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={handleView}
                  className="transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleEdit}
                  className="transition-colors duration-200 hover:bg-green-50 hover:text-green-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <CardTitle className={cn(
            "text-lg line-clamp-2",
            "transition-colors duration-200 group-hover:text-blue-700"
          )}>
            {memory.title}
          </CardTitle>
          
          {(memory.type === 'audio' || memory.type === 'video') && formattedDuration && (
            <div className={cn(
              "text-sm text-amber-600",
              "transition-all duration-200 hover:text-amber-700"
            )}>
              Duración: {formattedDuration}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 flex-1">
          <p className={cn(
            "text-sm text-gray-600 line-clamp-3 mb-4",
            "transition-colors duration-200 group-hover:text-gray-700"
          )}>
            {memory.content}
          </p>
          
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {visibleTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    "transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:border-blue-300"
                  )}
                >
                  {tag}
                </Badge>
              ))}
              {hiddenTagsCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="text-xs transition-all duration-200 hover:scale-105 hover:bg-gray-50"
                >
                  +{hiddenTagsCount}
                </Badge>
              )}
            </div>
          )}
          
          <div className={cn(
            "text-xs text-gray-500 mt-auto",
            "transition-colors duration-200 group-hover:text-gray-600"
          )}>
            {formattedDate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MemoryCard.displayName = 'MemoryCard';

export default MemoryCard;