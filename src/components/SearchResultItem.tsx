import React from 'react';
import { FileText, Calendar, Tag } from 'lucide-react';
import { MemoryData as Memory } from '@/services/electronAPI';

interface SearchResultItemProps {
  memory: Memory;
  onClick: (memory: Memory) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ memory, onClick }) => {

  // Función para obtener el icono del tipo de memoria
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'texto': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'audio': return <span className="text-green-500">🎵</span>;
      case 'video': return <span className="text-purple-500">🎬</span>;
      case 'foto': return <span className="text-orange-500">📷</span>;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Función para truncar contenido
  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  // Obtener fecha de la memoria
  const getMemoryDate = (): string => {
    if (memory.metadata?.date) {
      return memory.metadata.date;
    }
    return memory.createdAt || new Date().toISOString();
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(memory)}
    >
      {/* Header con título y score */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getTypeIcon(memory.type)}
          <h3 className="font-semibold text-gray-900 text-lg">
            {memory.title}
          </h3>
        </div>
      </div>

      {/* Contenido */}
      <div className="mb-3">
        <p className="text-gray-700 leading-relaxed">
          {truncateContent(memory.content)}
        </p>
      </div>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {memory.tags.slice(0, 5).map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {memory.tags.length > 5 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{memory.tags.length - 5} más
            </span>
          )}
        </div>
      )}

      {/* Footer con fecha y emoción */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(getMemoryDate())}</span>
          </div>
          
          {memory.metadata?.emotion && (
            <div className="flex items-center gap-1">
              <span>😊</span>
              <span className="capitalize">
                {typeof memory.metadata.emotion === 'string' 
                  ? memory.metadata.emotion 
                  : (memory.metadata.emotion as any)?.primary || 'neutral'
                }
              </span>
              <span className="text-xs">
                ({Math.round(
                  (typeof memory.metadata.emotion === 'object' && (memory.metadata.emotion as any)?.confidence 
                    ? (memory.metadata.emotion as any).confidence 
                    : 0.5
                  ) * 100
                )}%)
              </span>
            </div>
          )}
        </div>

        <div className="text-xs">
          Privacidad: Nivel {memory.privacyLevel}
        </div>
      </div>

      {/* Información adicional para archivos */}
      {memory.filePath && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            📁 {memory.filePath.split('/').pop()}
            {memory.metadata?.size && (
              <span className="ml-2">
                ({(memory.metadata.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultItem;