import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  Share2, 
  Heart,
  Calendar,
  Tag,
  User,
  Clock,
  Mic,
  Image,
  Video,
  FileText,
  Volume2,
  VolumeX,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/Layout/Layout';
import { useMemories } from '@/hooks/use-memories-hook';
import { MemoryData as Memory } from '@/services/electronAPI';
import { toast } from 'sonner';
import { generateAudioErrorMessage, logAudioError, logAudioLoadStart, logAudioReady } from '@/utils/audioValidation';
import { OptimizedImage } from '@/components/OptimizedImage';
// AudioFileService y AudioPlayer imports removidos - servicios no disponibles

// Función para validar archivos de audio
const validateAudioFile = (audioPath?: string) => {
  const validation = {
    isValid: false,
    error: '',
    details: {}
  };

  if (!audioPath) {
    validation.error = 'No se proporcionó ruta de audio';
    return validation;
  }

  // Validar que la ruta no esté vacía
  if (audioPath.trim() === '') {
    validation.error = 'Ruta de audio vacía';
    return validation;
  }

  // Validar extensión de archivo
  const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.mp4'];
  const hasValidExtension = validExtensions.some(ext => 
    audioPath.toLowerCase().includes(ext)
  );
  
  if (!hasValidExtension) {
    validation.error = 'Extensión de archivo no válida';
    validation.details = { path: audioPath, validExtensions };
    return validation;
  }

  validation.isValid = true;
  return validation;
};

export function VerMemoria() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMemoryById, deleteMemory } = useMemories();
  
  const [memoria, setMemoria] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar la memoria por ID
  useEffect(() => {
    const loadMemoria = async () => {
      if (!id) {
        setError('ID de memoria no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const memoriaEncontrada = await getMemoryById(parseInt(id));
        
        if (memoriaEncontrada) {
          setMemoria(memoriaEncontrada);
        } else {
          setError('Memoria no encontrada');
        }
      } catch (err) {
        console.error('Error cargando memoria:', err);
        setError('Error al cargar la memoria');
      } finally {
        setLoading(false);
      }
    };

    loadMemoria();
  }, [id, getMemoryById]);

  // El AudioPlayer maneja su propio cleanup automáticamente

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (memoria) {
      navigate(`/memorias/${memoria.id}/editar`);
    }
  };

  const handleDelete = async () => {
    if (!memoria) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar esta memoria? Esta acción no se puede deshacer.')) {
      try {
        const success = await deleteMemory(memoria.id);
        if (success) {
          toast.success('Memoria eliminada exitosamente');
          navigate('/memorias');
        } else {
          toast.error('Error al eliminar la memoria');
        }
      } catch (error) {
        console.error('Error eliminando memoria:', error);
        toast.error('Error al eliminar la memoria');
      }
    }
  };

  const handleDownload = () => {
    if (!memoria) return;
    
    // Crear contenido para descargar
    const contenido = `
# ${memoria.title}

**Tipo:** ${memoria.type}
**Fecha:** ${new Date(memoria.createdAt).toLocaleDateString()}
**Etiquetas:** ${memoria.tags.join(', ')}

## Contenido

${memoria.content}

---
Generado por El Almacén de los Recuerdos
    `.trim();
    
    const blob = new Blob([contenido], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria-${memoria.title.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Memoria descargada exitosamente');
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'foto': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'audio': return 'bg-purple-100 text-purple-800';
      case 'foto': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
            <p className="text-amber-600">Cargando memoria...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || (!loading && !memoria)) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'No se encontró la memoria solicitada. Es posible que haya sido eliminada o que el enlace sea incorrecto.'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header con acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button 
            onClick={handleGoBack} 
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={handleDelete} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Tarjeta principal de la memoria */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-amber-900">
                  {memoria.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${getTypeColor(memoria.type)} flex items-center gap-1`}>
                    {getTypeIcon(memoria.type)}
                    {memoria.type}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(memoria.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="text-right text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Creada: {new Date(memoria.createdAt).toLocaleString()}
                </div>
                {memoria.updatedAt !== memoria.createdAt && (
                  <div className="flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Editada: {new Date(memoria.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Multimedia (si existe) */}
            {memoria.type === 'audio' && (memoria.filePath || memoria.audioUrl) && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                       <div className="flex items-center gap-2 mb-3">
                         <Volume2 className="w-5 h-5 text-blue-600" />
                         <span className="font-medium text-blue-800">Reproducir Audio</span>
                       </div>
                       <audio 
                          controls 
                          className="w-full" 
                          preload="metadata"
                          onLoadStart={() => {
                            const audioPath = memoria.filePath || memoria.audioUrl;
                            const validation = validateAudioFile(audioPath);
                            logAudioLoadStart('VerMemoria', memoria.title, audioPath, validation);
                          }}
                          onCanPlay={(e) => {
                            const audioPath = memoria.filePath || memoria.audioUrl;
                            const duration = (e.target as HTMLAudioElement).duration;
                            logAudioReady('VerMemoria', memoria.title, audioPath, duration);
                          }}
                          onError={(e) => {
                            const audioPath = memoria.filePath || memoria.audioUrl;
                            const validation = validateAudioFile(audioPath);
                            const audioElement = e.currentTarget;
                            
                            logAudioError('VerMemoria', memoria.title, audioPath, audioElement.error, validation);
                            
                            const container = audioElement.parentNode as HTMLElement;
                            
                            // Evitar duplicar mensajes de error
                            if (!container.querySelector('.audio-error-message')) {
                              audioElement.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'audio-error-message text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200';
                              
                              const fileName = audioPath ? audioPath.split('/').pop() || audioPath : 'No especificado';
                              const errorMessage = generateAudioErrorMessage(memoria.title, audioPath, validation);
                              
                              errorDiv.innerHTML = `
                                <strong>⚠️ ${errorMessage}</strong><br/>
                                <span class="text-xs">Archivo: ${fileName}</span><br/>
                                <span class="text-xs text-gray-500">Ruta: ${audioPath || 'No especificada'}</span><br/>
                                <span class="text-xs text-gray-500">Verifica que el archivo existe y es un formato de audio válido.</span>
                              `;
                              container.appendChild(errorDiv);
                              
                              // Mostrar toast con información del error
                              toast.error(`${errorMessage} (${fileName})`);
                            }
                          }}
                       >
                         <source src={memoria.filePath || memoria.audioUrl} type="audio/mpeg" />
                         <source src={memoria.filePath || memoria.audioUrl} type="audio/wav" />
                         <source src={memoria.filePath || memoria.audioUrl} type="audio/ogg" />
                         <source src={memoria.filePath || memoria.audioUrl} type="audio/webm" />
                         <source src={memoria.filePath || memoria.audioUrl} type="audio/mp4" />
                         <div className="text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200 mt-2">
                           <strong>Audio no disponible</strong><br/>
                           Tu navegador no soporta la reproducción de audio o el archivo no está disponible.<br/>
                           <span className="text-xs text-gray-600">Archivo: {memoria.filePath || memoria.audioUrl}</span>
                         </div>
                       </audio>
                     </div>
                    {memoria.metadata?.duration && (
                      <span className="text-sm text-gray-600">
                        Duración: {Math.round(memoria.metadata.duration)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {memoria.type === 'foto' && memoria.imageUrl && (
              <div className="text-center">
                <OptimizedImage 
                  src={memoria.imageUrl} 
                  alt={memoria.title}
                  className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                  style={{ maxHeight: '500px' }}
                  loading="eager"
                />
              </div>
            )}

            {memoria.type === 'video' && memoria.videoUrl && (
              <div className="text-center">
                <video 
                  controls 
                  className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                  style={{ maxHeight: '500px' }}
                >
                  <source src={memoria.videoUrl} type="video/mp4" />
                  Tu navegador no soporta la reproducción de video.
                </video>
              </div>
            )}

            {/* Contenido principal */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Contenido</h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {memoria.content}
              </div>
            </div>

            {/* Etiquetas */}
            {memoria.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {memoria.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadatos adicionales */}
            {memoria.metadata && Object.keys(memoria.metadata).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-3">Información Técnica</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {memoria.metadata.size && (
                    <div>
                      <span className="font-medium">Tamaño:</span> {(memoria.metadata.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                  {memoria.metadata.format && (
                    <div>
                      <span className="font-medium">Formato:</span> {memoria.metadata.format}
                    </div>
                  )}
                  {memoria.metadata.location && (
                    <div>
                      <span className="font-medium">Ubicación:</span> {memoria.metadata.location}
                    </div>
                  )}
                  {memoria.metadata.emotion && (
                    <div>
                      <span className="font-medium">Emoción:</span> {memoria.metadata.emotion}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default VerMemoria;
