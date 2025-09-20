import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { usePhotos } from '@/hooks/usePhotos';
import { PhotoData, ViewMode, FilterType, SortType } from '@/types/photoTypes';
import { PhotoStats } from '@/components/Photos/PhotoStats';
import { PhotoFilters } from '@/components/Photos/PhotoFilters';
import { AdvancedPhotoToolbar } from '@/components/Photos/AdvancedPhotoToolbar';
import { PhotoGallery } from '@/components/Photos/PhotoGallery';
import { PhotoModal } from '@/components/Photos/PhotoModal';
import { ImageEditor } from '@/components/Photos/ImageEditor';
import { RenameDialog } from '@/components/Photos/RenameDialog';
import { FolderManager } from '@/components/Photos/FolderManager';
import { TagManager } from '@/components/Photos/TagManager';
import { FolderSidebar } from '@/components/Photos/FolderSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';

export function Fotos() {
  const {
    // Estado básico
    photos,
    folders,
    selectedPhotos,
    isMultiSelectMode,
    
    // Funciones básicas
    handlePhotoImport,
    toggleStarred,
    toggleArchived,
    deletePhoto,
    addComment,
    addTags,
    changeCategory,
    exportPhotos,
    
    // Funciones de selección múltiple
    toggleMultiSelectMode,
    togglePhotoSelection,
    selectAllPhotos,
    deselectAllPhotos,
    getSelectedPhotos,
    
    // Funciones de carpetas
    createFolder,
    updateFolder,
    deleteFolder,
    movePhotosToFolder,
    
    // Funciones avanzadas
    bulkRename,
    bulkUpdateTags,
    bulkUpdateComments,
    bulkDeletePhotos,
    getAllTags,
    updatePhoto
  } = usePhotos();
  
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<PhotoData['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para modales avanzados
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoData | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
  // Estado para filtro de carpetas
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      console.log(`Importando ${files.length} archivos:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      try {
        await handlePhotoImport(files);
        console.log('Importación completada exitosamente');
      } catch (error) {
        console.error('Error durante la importación:', error);
        toast.error('Error al importar las fotos. Revisa la consola para más detalles.');
      }
      
      // Limpiar input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Funciones de manejo de estado
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter: FilterType) => {
    setFilterType(filter);
  };

  const handleCategoryChange = (category: PhotoData['category'] | 'all') => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sort: SortType) => {
    setSortBy(sort);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const exportAllPhotos = () => {
    exportPhotos();
  };

  // Alias para mantener compatibilidad con los componentes
  const toggleStar = toggleStarred;
  const toggleArchive = toggleArchived;
  const addTag = addTags;
  const exportPhoto = (photo: PhotoData) => {
    const exportData = {
      ...photo,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Almacén App',
        version: '1.0'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${photo.originalName.split('.')[0]}_metadata.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Foto exportada');
  };



  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obtener icono de categoría
  const getCategoryIcon = (category: PhotoData['category']) => {
    switch (category) {
      case 'selfie': return '🤳';
      case 'landscape': return '🏞️';
      case 'portrait': return '👤';
      case 'food': return '🍽️';
      case 'travel': return '✈️';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'pets': return '🐕';
      case 'events': return '🎉';
      default: return '📷';
    }
  };

  // Obtener fotos filtradas por carpeta
  const getPhotosInFolder = (folderId: string | null) => {
    if (folderId === null) {
      return photos; // Todas las fotos
    }
    
    if (folderId === 'unassigned') {
      // Fotos sin carpeta
      const assignedPhotoIds = new Set(
        folders.flatMap(folder => folder.photoIds)
      );
      return photos.filter(photo => !assignedPhotoIds.has(photo.id));
    }
    
    // Fotos de una carpeta específica
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    
    return photos.filter(photo => folder.photoIds.includes(photo.id));
  };

  // Filtrar y ordenar fotos
  const getFilteredAndSortedPhotos = () => {
    let filtered = getPhotosInFolder(selectedFolderId);

    // Aplicar filtro de tipo
    switch (filterType) {
      case 'starred':
        filtered = filtered.filter(photo => photo.isStarred);
        break;
      case 'archived':
        filtered = filtered.filter(photo => photo.isArchived);
        break;
      case 'recent': {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(photo => new Date(photo.dateImported) > oneWeekAgo);
        break;
      }
      case 'category':
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(photo => photo.category === selectedCategory);
        }
        break;
    }

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(photo =>
        photo.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        photo.comments.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime());
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.originalName.localeCompare(b.originalName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.originalName.localeCompare(a.originalName));
        break;
      case 'size-desc':
        filtered.sort((a, b) => b.size - a.size);
        break;
    }

    return filtered;
  };

  // Obtener nombre de la carpeta actual
  const getCurrentFolderName = () => {
    if (selectedFolderId === null) return 'Todas las fotos';
    if (selectedFolderId === 'unassigned') return 'Fotos sin carpeta';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : 'Carpeta desconocida';
  };

  const filteredPhotos = getFilteredAndSortedPhotos();
  const categories = ['selfie', 'landscape', 'portrait', 'food', 'travel', 'family', 'pets', 'events', 'other'] as const;
  const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);

  return (
    <>
      <Layout breadcrumbs={[{ label: 'Fotos del teléfono' }]}>
        <div className="flex h-screen bg-gray-50">
        {/* Sidebar de carpetas */}
        <FolderSidebar
          folders={folders}
          photos={photos}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onCreateFolder={() => setIsFolderManagerOpen(true)}
          onManageFolders={() => setIsFolderManagerOpen(true)}
        />
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Fotos del Teléfono</span>
                </h1>
                <p className="text-purple-100 text-sm">
                  {getCurrentFolderName()} • {filteredPhotos.length} imagen{filteredPhotos.length !== 1 ? 'es' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-sm">
                  Total: {photos.length} fotos • {folders.length} carpetas
                </p>
              </div>
            </div>
          </div>
          
          {/* Área de contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Barra de herramientas avanzada */}
            <AdvancedPhotoToolbar
              searchTerm={searchTerm}
              sortBy={sortBy}
              viewMode={viewMode}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              onViewModeChange={handleViewModeChange}
              onImport={handleFileInputClick}
              onExportAll={exportAllPhotos}
              photosCount={filteredPhotos.length}
              isMultiSelectMode={isMultiSelectMode}
              selectedCount={selectedPhotos.length}
              onToggleMultiSelect={toggleMultiSelectMode}
              onSelectAll={selectAllPhotos}
              onDeselectAll={deselectAllPhotos}
              onBulkRename={() => setIsRenameDialogOpen(true)}
              onBulkMove={() => setIsFolderManagerOpen(true)}
              onBulkTag={() => setIsTagManagerOpen(true)}
              onBulkDelete={() => {
                if (confirm(`¿Eliminar ${selectedPhotos.length} imagen${selectedPhotos.length !== 1 ? 'es' : ''}?`)) {
                  bulkDeletePhotos(selectedPhotos);
                }
              }}
              onOpenEditor={() => {
                const selected = getSelectedPhotos();
                if (selected.length === 1) {
                  setEditingPhoto(selected[0]);
                  setIsEditorOpen(true);
                }
              }}
              onManageFolders={() => setIsFolderManagerOpen(true)}
              hasSelection={selectedPhotos.length > 0}
            />

        {/* Input oculto para archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Filtros */}
        <PhotoFilters
          filterType={filterType}
          selectedCategory={selectedCategory}
          onFilterChange={handleFilterChange}
          onCategoryChange={handleCategoryChange}
        />

        {/* Estadísticas */}
        <PhotoStats photos={photos} />

        {/* Galería de fotos */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No hay fotos para mostrar</p>
              <p className="text-gray-400 mb-4">Importa algunas fotos para comenzar</p>
            </div>
          ) : (
            <PhotoGallery
              photos={filteredPhotos}
              viewMode={viewMode}
              onPhotoClick={setSelectedPhoto}
              onToggleStar={toggleStar}
              onToggleArchive={toggleArchive}
              onDeletePhoto={deletePhoto}
              isMultiSelectMode={isMultiSelectMode}
              selectedPhotos={selectedPhotos}
              onToggleSelect={togglePhotoSelection}
              onOpenEditor={(photo) => {
                setEditingPhoto(photo);
                setIsEditorOpen(true);
              }}
            />
          )}
        </div>





            {/* Información de ayuda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Información de Importación</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Formatos soportados:</strong> JPG, PNG, GIF, WebP, BMP</p>
                  <p><strong>Detección de duplicados:</strong> Se basa en nombre, tamaño y fecha de la foto</p>
                  <p><strong>Categorías automáticas:</strong> Se detectan según el nombre del archivo</p>
                  <p><strong>Metadatos:</strong> Se extraen dimensiones y fecha de creación cuando están disponibles</p>
                  <p><strong>Etiquetas:</strong> Añade palabras clave para facilitar la búsqueda</p>
                  <p><strong>Comentarios:</strong> Guarda recuerdos y contexto de tus fotos</p>
                  <p><strong>Privacidad:</strong> Todas las fotos se almacenan localmente en tu dispositivo</p>
                  <p><strong>Exportación:</strong> Los metadatos se exportan en JSON (sin las imágenes para reducir tamaño)</p>
                </div>
              </CardContent>
            </Card>
          </div>
         </div>
       </div>
     </Layout>
    
    {/* Modales fuera del Layout */}
    {/* Modal de foto seleccionada */}
    <PhotoModal
      photo={selectedPhoto}
      onClose={() => setSelectedPhoto(null)}
      onToggleStar={toggleStarred}
      onToggleArchive={toggleArchived}
      onDeletePhoto={deletePhoto}
      onAddComment={addComment}
      onAddTag={addTags}
      onChangeCategory={changeCategory}
      onExportPhoto={exportPhoto}
    />

    {/* Editor de imágenes */}
    {editingPhoto && (
      <ImageEditor
        photo={editingPhoto}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPhoto(null);
        }}
        onSave={(editedPhoto) => {
           updatePhoto(editedPhoto);
           setIsEditorOpen(false);
           setEditingPhoto(null);
         }}
      />
    )}

    {/* Diálogo de renombrado masivo */}
    <RenameDialog
      isOpen={isRenameDialogOpen}
      onClose={() => setIsRenameDialogOpen(false)}
      photos={getSelectedPhotos()}
      onRename={bulkRename}
    />

    {/* Gestor de carpetas */}
    <FolderManager
      isOpen={isFolderManagerOpen}
      onClose={() => setIsFolderManagerOpen(false)}
      photos={photos}
      folders={folders}
      selectedPhotos={getSelectedPhotos()}
      onCreateFolder={createFolder}
      onUpdateFolder={updateFolder}
      onDeleteFolder={deleteFolder}
      onMovePhotos={movePhotosToFolder}
    />

    {/* Gestor de etiquetas */}
    <TagManager
      isOpen={isTagManagerOpen}
      onClose={() => setIsTagManagerOpen(false)}
      photos={getSelectedPhotos()}
      allTags={getAllTags()}
      onUpdateTags={bulkUpdateTags}
       onUpdateComments={bulkUpdateComments}
     />
   </>
   );
}

export default Fotos;