import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trash2,
  Mic,
  Image,
  Video,
  FileText,
  Tag,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Badge from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layout } from '@/components/Layout/Layout';
import { useMemories } from '@/hooks/use-memories-hook';
import { useValidation } from '@/hooks/useValidation';
import { MemoryData as Memory } from '@/services/electronAPI';
import { toast } from 'sonner';

export const EditarMemoria = React.memo(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { memories, loading, saveMemory, deleteMemory } = useMemories();
  
  const [memoria, setMemoria] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Hook de validación
  const validation = useValidation();
  
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'texto' | 'audio' | 'foto' | 'video'>('texto');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState(1);
  
  // Validación en tiempo real para título
  useEffect(() => {
    if (title.trim()) {
      const timer = setTimeout(() => {
        validation.validateTextInput(title.trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, validation]);
  
  // Validación en tiempo real para contenido
  useEffect(() => {
    if (content.trim()) {
      const timer = setTimeout(() => {
        validation.validateTextInput(content.trim());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, validation]);

  // Memoized values para evitar llamar hooks dentro de JSX
  const createdAtFormatted = useMemo(() => {
    return memoria ? new Date(memoria.createdAt).toLocaleDateString() : '';
  }, [memoria]);

  const updatedAtFormatted = useMemo(() => {
    return memoria && memoria.updatedAt !== memoria.createdAt 
      ? new Date(memoria.updatedAt).toLocaleDateString() 
      : null;
  }, [memoria]);

  const titleClassName = useMemo(() => {
    return `text-lg ${
      validation.validationState.errors.some(e => e.includes('título') || e.includes('title')) 
        ? 'border-red-500 focus:border-red-500' 
        : validation.validationState.warnings.some(w => w.includes('título') || w.includes('title'))
        ? 'border-yellow-500 focus:border-yellow-500'
        : ''
    }`;
  }, [validation.validationState]);

  const contentClassName = useMemo(() => {
    return `resize-y ${
      validation.validationState.errors.some(e => e.includes('contenido') || e.includes('content')) 
        ? 'border-red-500 focus:border-red-500' 
        : validation.validationState.warnings.some(w => w.includes('contenido') || w.includes('content'))
        ? 'border-yellow-500 focus:border-yellow-500'
        : ''
    }`;
  }, [validation.validationState]);

  const tagsClassName = useMemo(() => {
    return `flex-1 ${
      validation.validationState.errors.some(e => e.includes('etiqueta') || e.includes('tag')) 
        ? 'border-red-500 focus:border-red-500' 
        : validation.validationState.warnings.some(w => w.includes('etiqueta') || w.includes('tag'))
        ? 'border-yellow-500 focus:border-yellow-500'
        : ''
    }`;
  }, [validation.validationState]);

  // Buscar y cargar la memoria por ID
  useEffect(() => {
    if (id && memories.length > 0) {
      const memoriaEncontrada = memories.find(m => m.id.toString() === id);
      if (memoriaEncontrada) {
        setMemoria(memoriaEncontrada);
        // Llenar el formulario con datos existentes
        setTitle(memoriaEncontrada.title);
        setContent(memoriaEncontrada.content);
        setType(memoriaEncontrada.type);
        setTags(memoriaEncontrada.tags || []);
        setPrivacyLevel(memoriaEncontrada.privacyLevel || 1);
      }
    }
  }, [id, memories]);

  const handleGoBack = useCallback(() => {
    if (memoria) {
      navigate(`/memorias/${memoria.id}`);
    } else {
      navigate('/memorias');
    }
  }, [memoria, navigate]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTag = tagInput.trim();
      // Validar etiqueta antes de añadir
      const tagValidation = validation.validateTag(newTag);
       if (tagValidation.success) {
        setTags([...tags, newTag]);
        setTagInput('');
      } else {
        console.warn('Etiqueta inválida:', tagValidation.errors);
      }
    }
  }, [tagInput, tags, validation]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSave = useCallback(async () => {
    if (!memoria) return;
    
    // Validaciones
    if (!title.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    if (!content.trim()) {
      toast.error('El contenido es requerido');
      return;
    }

    // Validar memoria completa antes de guardar
    const memoryToValidate = {
      id: memoria.id,
      title: title.trim(),
      content: content.trim(),
      tags,
      updatedAt: new Date().toISOString()
    };

    const memoryValidation = await validation.validateUpdateMemory(memoryToValidate);
    if (!memoryValidation.success) {
      console.error('Errores de validación:', memoryValidation.errors);
      toast.error('Por favor corrige los errores antes de guardar');
      return;
    }

    setIsSaving(true);

    try {
      const memoriaActualizada: Partial<Memory> = {
        ...memoria,
        title: validation.sanitizeData(title.trim()),
        content: validation.sanitizeData(content.trim()),
        type,
        tags: validation.sanitizeData(tags),
        privacyLevel,
        updatedAt: new Date().toISOString(),
        // Mantener campos existentes
        filePath: memoria.filePath,
        audioUrl: memoria.audioUrl,
        imageUrl: memoria.imageUrl,
        videoUrl: memoria.videoUrl,
        metadata: memoria.metadata
      };

      const success = await saveMemory(memoriaActualizada);
      
      if (success) {
        toast.success('Memoria actualizada exitosamente');
        console.log('Memoria actualizada exitosamente con validación');
        navigate(`/memorias/${memoria.id}`);
      } else {
        toast.error('Error al actualizar la memoria');
      }
    } catch (error) {
      console.error('Error guardando memoria:', error);
      toast.error('Error al actualizar la memoria');
    } finally {
      setIsSaving(false);
    }
  }, [memoria, title, content, type, tags, privacyLevel, validation, saveMemory, navigate]);

  const handleDelete = useCallback(async () => {
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
  }, [memoria, deleteMemory, navigate]);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'foto': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  }, []);

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

  if (!memoria) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se encontró la memoria solicitada. Es posible que haya sido eliminada o que el enlace sea incorrecto.
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-amber-900">Editar Memoria</h1>
            <p className="text-amber-600">Modifica los detalles de tu memoria</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Formulario de edición */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(type)}
              Editando memoria de {type}
            </CardTitle>
            <CardDescription>
              Creada el {createdAtFormatted}
              {updatedAtFormatted && (
                <span> • Última edición: {updatedAtFormatted}</span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de tu memoria..."
                className={titleClassName}
              />
              {validation.validationState.errors.filter(e => e.includes('título') || e.includes('title')).map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {error}
                </p>
              ))}
              {validation.validationState.warnings.filter(w => w.includes('título') || w.includes('title')).map((warning, index) => (
                <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warning}
                </p>
              ))}
            </div>

            {/* Tipo de memoria */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Memoria</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Texto
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio
                    </div>
                  </SelectItem>
                  <SelectItem value="foto">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Foto
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Nota: Cambiar el tipo no afectará los archivos multimedia asociados
              </p>
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <Label htmlFor="content">Contenido *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe aquí el contenido de tu memoria..."
                rows={10}
                className={contentClassName}
              />
              {validation.validationState.errors.filter(e => e.includes('contenido') || e.includes('content')).map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {error}
                </p>
              ))}
              {validation.validationState.warnings.filter(w => w.includes('contenido') || w.includes('content')).map((warning, index) => (
                <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warning}
                </p>
              ))}
            </div>

            {/* Archivos multimedia (solo mostrar si existen) */}
            {(memoria.audioUrl || memoria.imageUrl || memoria.videoUrl) && (
              <div className="space-y-2">
                <Label>Archivos Multimedia</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {memoria.audioUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Audio adjunto</span>
                    </div>
                  )}
                  {memoria.imageUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Imagen adjunta</span>
                    </div>
                  )}
                  {memoria.videoUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Video adjunto</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Los archivos multimedia no se pueden editar desde aquí. Para cambiarlos, elimina esta memoria y crea una nueva.
                  </p>
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Añadir etiqueta..."
                    className={tagsClassName}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <Tag className="w-4 h-4 mr-2" />
                    Añadir
                  </Button>
                </div>
                
                {validation.validationState.errors.filter(e => e.includes('etiqueta') || e.includes('tag')).map((error, index) => (
                  <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </p>
                ))}
                {validation.validationState.warnings.filter(w => w.includes('etiqueta') || w.includes('tag')).map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {warning}
                  </p>
                ))}
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nivel de privacidad */}
            <div className="space-y-2">
              <Label htmlFor="privacy">Nivel de Privacidad</Label>
              <Select 
                value={privacyLevel.toString()} 
                onValueChange={(value) => setPrivacyLevel(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Público - Visible para toda la familia</SelectItem>
                  <SelectItem value="2">Familiar - Solo familiares directos</SelectItem>
                  <SelectItem value="3">Íntimo - Solo personas seleccionadas</SelectItem>
                  <SelectItem value="4">Privado - Solo para mí</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado de validación general */}
            {(validation.validationState.errors.length > 0 || validation.validationState.warnings.length > 0) && (
              <Card className={`border-l-4 ${
                 validation.validationState.errors.length > 0 
                  ? 'border-l-red-500 bg-red-50' 
                  : 'border-l-yellow-500 bg-yellow-50'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    {validation.validationState.errors.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className={`font-medium ${
                        validation.validationState.errors.length > 0 ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {validation.validationState.errors.length > 0 ? 'Errores de validación' : 'Advertencias de validación'}
                      </h4>
                      <p className={`text-sm ${
                        validation.validationState.errors.length > 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {validation.validationState.errors.length > 0 
                          ? 'Corrige los errores antes de guardar los cambios'
                          : 'Revisa las advertencias para mejorar la calidad de la memoria'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón de guardar */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !title.trim() || !content.trim() || validation.validationState.errors.length > 0}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
});

EditarMemoria.displayName = 'EditarMemoria';

export default EditarMemoria;
