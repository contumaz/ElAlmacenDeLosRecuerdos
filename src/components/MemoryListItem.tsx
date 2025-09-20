import React, { useMemo, useCallback } from 'react';
import { MemoryData as Memory } from '@/services/electronAPI';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Mic, Camera, Video, Eye, Edit, Download, Trash2 } from 'lucide-react';
import { validateAudioFile, generateAudioErrorMessage, logAudioError, logAudioLoadStart, logAudioReady } from '@/utils/audioValidation';
import { useSmartMemoization } from '@/hooks/useSmartMemoization';
import { useInViewAnimation, useHoverAnimation } from '@/hooks/useAnimations';
import { cn } from '@/lib/utils';

/**
 * Props para el componente MemoryListItem
 */
interface MemoryListItemProps {
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
 * 
 * @param type - Tipo de memoria (texto, audio, foto, video)
 * @returns Componente JSX del icono
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
 * 
 * @param type - Tipo de memoria
 * @returns String con las clases CSS de color
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
 * 
 * @param emotion - Emoción detectada en la memoria
 * @returns String con las clases CSS de color
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
 * 
 * @param seconds - Duración en segundos
 * @returns String formateado como MM:SS o cadena vacía si no hay duración
 */
const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};



/**
 * Componente optimizado para mostrar un elemento de memoria en una lista
 * 
 * Renderiza una tarjeta con información completa de la memoria incluyendo:
 * - Tipo e icono correspondiente
 * - Título y contenido truncado
 * - Etiquetas y metadatos
 * - Reproductor de audio integrado (para memorias de audio)
 * - Menú de acciones (ver, editar, eliminar)
 * - Análisis de emociones visualizado
 * 
 * Optimizado con React.memo y useMemo para evitar re-renders innecesarios
 * 
 * @param props - Propiedades del componente
 * @returns Componente JSX de elemento de memoria
 * 
 * @example
 * ```tsx
 * <MemoryListItem
 *   memory={memoryData}
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   style={{ height: 200 }}
 * />
 * ```
 */
const MemoryListItem: React.FC<MemoryListItemProps> = React.memo(({ memory, style, onView, onEdit, onDelete }) => {
  const { createMemoizedValue, createMemoizedCallback } = useSmartMemoization({
    ttl: 10 * 60 * 1000, // 10 minutos para elementos de lista
    maxSize: 200,
    enableMetrics: true
  });

  // Memoización inteligente de valores calculados con cache avanzado
  const typeIcon = createMemoizedValue(
    () => getTypeIcon(memory.type),
    [memory.type],
    { key: `typeIcon_${memory.type}` }
  );
  
  const typeColor = createMemoizedValue(
    () => getTypeColor(memory.type),
    [memory.type],
    { key: `typeColor_${memory.type}` }
  );
  
  const emotionColor = createMemoizedValue(
    () => memory.metadata?.emotion ? getEmotionColor(memory.metadata.emotion) : null,
    [memory.metadata?.emotion],
    { key: `emotionColor_${memory.metadata?.emotion || 'none'}` }
  );
  
  const formattedDuration = createMemoizedValue(
    () => formatDuration(memory.metadata?.duration),
    [memory.metadata?.duration],
    { key: `duration_${memory.metadata?.duration || 0}` }
  );
  
  const formattedDate = createMemoizedValue(
    () => memory.date ? new Date(memory.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null,
    [memory.date],
    { key: `date_${memory.date}` }
  );

  // Memoización inteligente de callbacks con estabilidad mejorada
  const handleView = createMemoizedCallback(
    () => onView(memory.id),
    [onView, memory.id]
  );
  
  const handleEdit = createMemoizedCallback(
    () => onEdit(memory.id),
    [onEdit, memory.id]
  );
  
  const handleDelete = createMemoizedCallback(
    () => onDelete(memory.id),
    [onDelete, memory.id]
  );

  // Memoización de propiedades complejas del audio
  const audioProps = createMemoizedValue(
    () => ({
      src: memory.filePath || memory.audioUrl,
      isAudioMemory: memory.type === 'audio',
      hasValidAudio: !!(memory.filePath || memory.audioUrl),
      validation: memory.filePath || memory.audioUrl ? validateAudioFile(memory.filePath || memory.audioUrl) : null
    }),
    [memory.type, memory.filePath, memory.audioUrl],
    { key: `audio_${memory.id}` }
  );

  // Memoización de tags procesados
  const processedTags = createMemoizedValue(
    () => {
      if (!memory.tags || !Array.isArray(memory.tags) || memory.tags.length === 0) {
        return { visible: [], hidden: 0 };
      }
      return {
        visible: memory.tags.slice(0, 3),
        hidden: Math.max(0, memory.tags.length - 3)
      };
    },
    [memory.tags],
    { key: `tags_${memory.id}_${memory.tags?.length || 0}` }
  );

  // Animation hooks for enhanced UX
  const { elementRef: cardRef } = useInViewAnimation('animate-fade-in', { 
    delay: 100,
    threshold: 0.1 
  });
  
  const { elementRef: hoverRef, hoverProps } = useHoverAnimation('animate-scale-in');

  return (
    <div style={style}>
      <Card 
        ref={(el) => {
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (hoverRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={cn(
          "group h-full flex flex-col",
          "transition-all duration-300 ease-out",
          "hover:shadow-xl hover:-translate-y-1",
          "border border-gray-200 hover:border-blue-300",
          "bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
        )}
        {...hoverProps}
      >
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
                  "transition-all duration-200 hover:scale-105 animate-bounce-in"
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
                    "hover:bg-blue-100 hover:scale-110",
                    "transform-gpu"
                  )}
                >
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="animate-slide-in-from-top">
                <DropdownMenuItem 
                  onClick={handleView}
                  className="transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2 transition-transform duration-200 hover:scale-110" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleEdit}
                  className="transition-colors duration-200 hover:bg-green-50 hover:text-green-700"
                >
                  <Edit className="w-4 h-4 mr-2 transition-transform duration-200 hover:scale-110" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="transition-colors duration-200 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2 opacity-50" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2 transition-transform duration-200 hover:scale-110" />
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
              "transition-all duration-200 hover:text-amber-700 hover:scale-105",
              "animate-fade-in"
            )}>
              Duración: {formattedDuration}
            </div>
          )}
          
          {audioProps.isAudioMemory && audioProps.hasValidAudio && (
            <div className={cn(
              "mt-2 p-3 rounded-lg border",
              "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",
              "transition-all duration-300 hover:shadow-md hover:from-blue-100 hover:to-purple-100",
              "animate-slide-in-from-bottom"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Mic className={cn(
                  "w-4 h-4 text-blue-600",
                  "transition-transform duration-200 hover:scale-110"
                )} />
                <span className="text-sm font-medium text-blue-800">Audio</span>
              </div>
              <audio 
                 controls 
                 className="w-full" 
                 preload="metadata"
                 onLoadStart={() => {
                   logAudioLoadStart('MemoryListItem', memory.title, audioProps.src, audioProps.validation);
                 }}
                 onCanPlay={(e) => {
                   const duration = (e.target as HTMLAudioElement).duration;
                   logAudioReady('MemoryListItem', memory.title, audioProps.src, duration);
                 }}
                 onError={(e) => {
                   const audioElement = e.currentTarget;
                   
                   logAudioError('MemoryListItem', memory.title, audioProps.src, audioElement.error, audioProps.validation);
                   
                   const container = audioElement.parentNode as HTMLElement;
                   
                   if (!container.querySelector('.audio-error-message')) {
                     audioElement.style.display = 'none';
                     const errorDiv = document.createElement('div');
                     errorDiv.className = 'audio-error-message text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200';
                     
                     const errorMessage = generateAudioErrorMessage(memory.title, audioProps.src, audioProps.validation);
                     const fileName = audioProps.src ? audioProps.src.split('/').pop() || audioProps.src : 'No especificado';
                     
                     errorDiv.innerHTML = `
                       <div class="flex items-start gap-2">
                         <span class="text-red-500 font-bold">⚠️</span>
                         <div>
                           <strong>Audio no disponible</strong><br/>
                           <span class="text-xs text-gray-600">Memoria: ${memory.title}</span><br/>
                           <span class="text-xs text-gray-600">Archivo: ${fileName}</span><br/>
                           <span class="text-xs text-red-500">Error: ${errorMessage}</span>
                         </div>
                       </div>
                     `;
                     container.appendChild(errorDiv);
                   }
                 }}
              >
                <source src={audioProps.src} type="audio/mpeg" />
                <source src={audioProps.src} type="audio/wav" />
                <source src={audioProps.src} type="audio/ogg" />
                <source src={audioProps.src} type="audio/webm" />
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded mt-2">
                  Tu navegador no soporta la reproducción de audio o el archivo no está disponible.
                  <br />
                  <span className="text-xs text-gray-600">Archivo: {audioProps.src}</span>
                </div>
              </audio>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <p className={cn(
            "text-sm text-gray-600 line-clamp-3 mb-4",
            "transition-colors duration-200 group-hover:text-gray-700"
          )}>
            {memory.content}
          </p>
          
          {processedTags.visible.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {processedTags.visible.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    "transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:border-blue-300",
                    "animate-fade-in"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  } as React.CSSProperties}
                >
                  {tag}
                </Badge>
              ))}
              {processedTags.hidden > 0 && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    "transition-all duration-200 hover:scale-105 hover:bg-gray-50",
                    "animate-bounce-in"
                  )}
                >
                  +{processedTags.hidden}
                </Badge>
              )}
            </div>
          )}
          
          <div className={cn(
            "text-xs text-gray-500",
            "transition-colors duration-200 group-hover:text-gray-600"
          )}>
            {formattedDate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MemoryListItem.displayName = 'MemoryListItem';

export default MemoryListItem;