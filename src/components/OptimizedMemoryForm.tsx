import React, { useState, useCallback, useMemo } from 'react';
import { useOptimizedForm, useResponsiveOptimization, withRenderOptimization } from '../hooks/useRenderOptimization';
import { Memory } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Button from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import Badge from './ui/badge';
import { Save, X, Upload, Mic, MicOff, Camera, Heart } from 'lucide-react';

interface OptimizedMemoryFormProps {
  memory?: Partial<Memory>;
  onSave: (memory: Partial<Memory>) => Promise<void>;
  onCancel: () => void;
  onAudioRecord?: (audioBlob: Blob) => Promise<string>;
  onImageUpload?: (file: File) => Promise<string>;
  isLoading?: boolean;
  className?: string;
}

interface FormData {
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  imageUrl?: string;
  audioUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const OptimizedMemoryFormComponent: React.FC<OptimizedMemoryFormProps> = ({
  memory,
  onSave,
  onCancel,
  onAudioRecord,
  onImageUpload,
  isLoading = false,
  className = ''
}) => {
  // Optimización responsiva
  const { isMobile, isTablet } = useResponsiveOptimization();
  
  // Estado inicial del formulario
  const initialFormData: FormData = useMemo(() => ({
    title: memory?.title || '',
    content: memory?.content || '',
    tags: memory?.tags || [],
    isFavorite: memory?.metadata?.category === 'favorite' || false,
    imageUrl: memory?.imageUrl,
    audioUrl: memory?.audioUrl
  }), [memory]);

  // Formulario optimizado con validación y debounce
  const {
    values,
    errors,
    touched,
    isValid,
    setValue,
    resetForm
  } = useOptimizedForm(initialFormData, (formValues) => {
    const validationErrors: Record<keyof FormData, string> = {
      title: '',
      content: '',
      tags: '',
      isFavorite: '',
      imageUrl: '',
      audioUrl: '',
      location: ''
    };
    
    if (!formValues.title || formValues.title.length < 3) {
      validationErrors.title = 'Title must be at least 3 characters';
    }
    if (!formValues.content || formValues.content.length < 10) {
      validationErrors.content = 'Content must be at least 10 characters';
    }
    
    return validationErrors;
  });

  // Derived state
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialFormData);
  }, [values, initialFormData]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValue(name as keyof FormData, value);
  }, [setValue]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Handle blur if needed
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    await onSave({
      ...memory,
      ...values,
      updatedAt: new Date().toISOString()
    });
  }, [isValid, onSave, memory, values]);

  const setFieldValue = useCallback((field: keyof FormData, value: any) => {
    setValue(field, value);
  }, [setValue]);



  // Estados locales para funcionalidades adicionales
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(memory?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  // Callbacks optimizados
  const handleTagAdd = useCallback((tag: string) => {
    if (tag.trim() && !values.tags.includes(tag.trim())) {
      setFieldValue('tags', [...values.tags, tag.trim()]);
      setNewTag('');
    }
  }, [values.tags, setFieldValue]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    setFieldValue('tags', values.tags.filter(tag => tag !== tagToRemove));
  }, [values.tags, setFieldValue]);

  const handleTagKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleTagAdd(newTag);
    }
  }, [newTag, handleTagAdd]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    setIsUploading(true);
    try {
      // Crear preview local
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Subir imagen
      const imageUrl = await onImageUpload(file);
      setFieldValue('imageUrl', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, setFieldValue]);

  const handleAudioRecord = useCallback(async () => {
    if (!onAudioRecord) return;

    if (isRecording) {
      // Detener grabación (implementación simplificada)
      setIsRecording(false);
      setRecordingTime(0);
    } else {
      // Iniciar grabación
      setIsRecording(true);
      // Aquí iría la lógica real de grabación de audio
    }
  }, [isRecording, onAudioRecord]);

  const handleFavoriteToggle = useCallback(() => {
    setFieldValue('isFavorite', !values.isFavorite);
  }, [values.isFavorite, setFieldValue]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    resetForm();
    onCancel();
  }, [isDirty, resetForm, onCancel]);

  // Renderizado condicional para móvil
  const renderMobileLayout = () => (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter memory title..."
          className={errors.title && touched.title ? 'border-red-500' : ''}
        />
        {errors.title && touched.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      {/* Contenido */}
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          name="content"
          value={values.content}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your memory..."
          rows={6}
          className={errors.content && touched.content ? 'border-red-500' : ''}
        />
        {errors.content && touched.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content}</p>
        )}
      </div>

      {/* Controles multimedia */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAudioRecord}
          disabled={!onAudioRecord}
          className={isRecording ? 'bg-red-100 border-red-300' : ''}
        >
          {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
          {isRecording ? `Recording ${recordingTime}s` : 'Record'}
        </Button>

        <label className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || !onImageUpload}
            asChild
          >
            <span>
              <Camera className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Photo'}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFavoriteToggle}
          className={values.isFavorite ? 'bg-red-100 border-red-300' : ''}
        >
          <Heart className={`w-4 h-4 mr-2 ${values.isFavorite ? 'fill-current text-red-500' : ''}`} />
          Favorite
        </Button>
      </div>

      {/* Preview de imagen */}
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setImagePreview(null);
              setFieldValue('imageUrl', undefined);
            }}
            className="absolute top-2 right-2 bg-white bg-opacity-80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {values.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleTagRemove(tag)}
            >
              {tag}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleTagKeyPress}
          placeholder="Add tags (press Enter or comma)"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={!isValid || isLoading || isUploading}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Memory'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  // Renderizado para desktop/tablet
  const renderDesktopLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna izquierda - Contenido principal */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter memory title..."
            className={errors.title && touched.title ? 'border-red-500' : ''}
          />
          {errors.title && touched.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            name="content"
            value={values.content}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Write your memory..."
            rows={12}
            className={errors.content && touched.content ? 'border-red-500' : ''}
          />
          {errors.content && touched.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>
      </div>

      {/* Columna derecha - Multimedia y metadatos */}
      <div className="space-y-4">
        {/* Controles multimedia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Media & Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAudioRecord}
                disabled={!onAudioRecord}
                className={isRecording ? 'bg-red-100 border-red-300' : ''}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? `${recordingTime}s` : 'Record'}
              </Button>

              <label className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading || !onImageUpload}
                  asChild
                >
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Photo
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFavoriteToggle}
              className={`w-full ${values.isFavorite ? 'bg-red-100 border-red-300' : ''}`}
            >
              <Heart className={`w-4 h-4 mr-2 ${values.isFavorite ? 'fill-current text-red-500' : ''}`} />
              {values.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview de imagen */}
        {imagePreview && (
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setFieldValue('imageUrl', undefined);
                  }}
                  className="absolute top-2 right-2 bg-white bg-opacity-80"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {values.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => handleTagRemove(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tags (press Enter or comma)"
            />
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid || isLoading || isUploading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Memory'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{memory?.id ? 'Edit Memory' : 'Create New Memory'}</span>
          {isDirty && (
            <Badge variant="outline" className="text-xs">
              Unsaved changes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </CardContent>
    </Card>
  );
};

// Aplicar optimizaciones HOC
export const OptimizedMemoryForm = withRenderOptimization(
  OptimizedMemoryFormComponent,
  {
    memo: true,
    profiler: process.env.NODE_ENV === 'development',
    errorBoundary: true
  }
);

OptimizedMemoryForm.displayName = 'OptimizedMemoryForm';