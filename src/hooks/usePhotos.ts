import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PhotoData, PhotoFilters, PhotoImportSummary } from '@/types/photoTypes';
import { VirtualFolder } from '@/components/Photos/FolderManager';

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [folders, setFolders] = useState<VirtualFolder[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Generar hash único para detectar duplicados
  const generatePhotoHash = useCallback((file: File, dateTaken: string) => {
    const data = `${file.name}-${file.size}-${dateTaken}`.toLowerCase();
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }, []);

  // Verificar si la foto ya existe
  const isDuplicate = useCallback((hash: string) => {
    return photos.some(photo => photo.hash === hash);
  }, [photos]);

  // Detectar categoría automáticamente
  const detectCategory = useCallback((filename: string): PhotoData['category'] => {
    const name = filename.toLowerCase();
    if (name.includes('selfie') || name.includes('front')) return 'selfie';
    if (name.includes('landscape') || name.includes('sunset') || name.includes('mountain')) return 'landscape';
    if (name.includes('portrait') || name.includes('person')) return 'portrait';
    if (name.includes('food') || name.includes('meal') || name.includes('restaurant')) return 'food';
    if (name.includes('travel') || name.includes('vacation') || name.includes('trip')) return 'travel';
    if (name.includes('family') || name.includes('mom') || name.includes('dad')) return 'family';
    if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return 'pets';
    if (name.includes('party') || name.includes('event') || name.includes('celebration')) return 'events';
    return 'other';
  }, []);

  // Extraer metadatos EXIF mejorado
  const extractMetadata = useCallback((file: File): Promise<Partial<PhotoData>> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Intentar extraer fecha de creación de diferentes fuentes
        let dateTaken = new Date().toISOString();
        
        // 1. Usar fecha de modificación del archivo si está disponible
        if (file.lastModified) {
          dateTaken = new Date(file.lastModified).toISOString();
        }
        
        // 2. Intentar extraer de nombre del archivo (formato común: IMG_YYYYMMDD_HHMMSS)
        const dateFromName = extractDateFromFilename(file.name);
        if (dateFromName) {
          dateTaken = dateFromName;
        }
        
        // 3. Para archivos JPEG, intentar leer metadatos básicos del header
        if (file.type === 'image/jpeg') {
          extractJPEGDate(file).then(jpegDate => {
            if (jpegDate) {
              dateTaken = jpegDate;
            }
            
            resolve({
              width: img.width,
              height: img.height,
              dateTaken
            });
          }).catch(() => {
            resolve({
              width: img.width,
              height: img.height,
              dateTaken
            });
          });
        } else {
          resolve({
            width: img.width,
            height: img.height,
            dateTaken
          });
        }
        
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        resolve({
          dateTaken: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString()
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);
  
  // Extraer fecha del nombre del archivo
  const extractDateFromFilename = useCallback((filename: string): string | null => {
    // Patrones comunes de fecha en nombres de archivo
    const patterns = [
      /IMG_([0-9]{8})_([0-9]{6})/, // IMG_20231225_143022
      /([0-9]{4})-([0-9]{2})-([0-9]{2})_([0-9]{2})-([0-9]{2})-([0-9]{2})/, // 2023-12-25_14-30-22
      /([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})/, // 20231225_143022
      /([0-9]{8})_([0-9]{6})/ // 20231225_143022
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        try {
          let dateStr = '';
          if (match[1] && match[1].length === 8) {
            // Formato YYYYMMDD
            const year = match[1].substring(0, 4);
            const month = match[1].substring(4, 6);
            const day = match[1].substring(6, 8);
            const time = match[2] || '120000';
            const hour = time.substring(0, 2);
            const minute = time.substring(2, 4);
            const second = time.substring(4, 6);
            dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          } else if (match[1] && match[2] && match[3]) {
            // Formato separado YYYY-MM-DD
            const hour = match[4] || '12';
            const minute = match[5] || '00';
            const second = match[6] || '00';
            dateStr = `${match[1]}-${match[2]}-${match[3]}T${hour}:${minute}:${second}`;
          }
          
          if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        } catch (e) {
          console.warn('Error parsing date from filename:', e);
        }
      }
    }
    
    return null;
  }, []);
  
  // Extraer fecha de archivos JPEG (básico)
  const extractJPEGDate = useCallback((file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(arrayBuffer);
          
          // Buscar marcador EXIF en JPEG
          let offset = 2; // Saltar SOI marker
          
          while (offset < dataView.byteLength - 4) {
            const marker = dataView.getUint16(offset);
            
            if (marker === 0xFFE1) { // APP1 marker (EXIF)
              const length = dataView.getUint16(offset + 2);
              const exifData = new DataView(arrayBuffer, offset + 4, length - 2);
              
              // Buscar string "Exif" en los datos
              if (exifData.byteLength > 6) {
                const exifString = String.fromCharCode(
                  exifData.getUint8(0),
                  exifData.getUint8(1),
                  exifData.getUint8(2),
                  exifData.getUint8(3)
                );
                
                if (exifString === 'Exif') {
                  // Aquí podríamos implementar parsing EXIF completo
                  // Por ahora, usar fecha de modificación del archivo
                  resolve(file.lastModified ? new Date(file.lastModified).toISOString() : null);
                  return;
                }
              }
              break;
            }
            
            offset += 2 + dataView.getUint16(offset + 2);
          }
          
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      };
      
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file.slice(0, 65536)); // Leer solo los primeros 64KB
    });
  }, []);

  // Convertir archivo a base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  // Manejar importación de fotos desde FileImporter
  const handleImport = useCallback((importedPhotos: any[], summary: any) => {
    const newPhotos = importedPhotos.map((photo, index) => ({
      id: crypto.randomUUID(),
      filename: photo.filename || photo.name || `foto_${index + 1}.jpg`,
      originalName: photo.originalName || photo.name || `foto_${index + 1}.jpg`,
      size: photo.size || 0,
      type: photo.type || 'image/jpeg',
      dateTaken: photo.dateTaken || photo.date || new Date().toISOString(),
      dateImported: new Date().toISOString(),
      width: photo.width,
      height: photo.height,
      location: photo.location,
      tags: [],
      comments: '',
      isStarred: false,
      isArchived: false,
      category: detectCategory(photo.name || photo.filename || ''),
      base64Data: photo.base64Data || photo.url || photo.src,
      hash: photo.hash || generatePhotoHash(photo, photo.dateTaken || new Date().toISOString())
    }));
    
    setPhotos(prev => [...prev, ...newPhotos]);
    
    if (summary.new > 0) {
      toast.success(`${summary.new} fotos importadas correctamente`);
    }
    if (summary.duplicates > 0) {
      toast.warning(`${summary.duplicates} fotos duplicadas omitidas`);
    }
  }, [detectCategory, generatePhotoHash]);

  // Manejar importación directa de archivos
  const handlePhotoImport = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const importedPhotos: PhotoData[] = [];
      let duplicatesCount = 0;

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.warning(`${file.name} no es una imagen válida`);
          continue;
        }

        const metadata = await extractMetadata(file);
        const hash = generatePhotoHash(file, metadata.dateTaken || new Date().toISOString());
        
        if (isDuplicate(hash)) {
          duplicatesCount++;
          continue;
        }

        const base64Data = await fileToBase64(file);
        
        const photoData: PhotoData = {
          id: crypto.randomUUID(),
          filename: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`,
          originalName: file.name,
          size: file.size,
          type: file.type,
          dateTaken: metadata.dateTaken || new Date().toISOString(),
          dateImported: new Date().toISOString(),
          width: metadata.width,
          height: metadata.height,
          tags: [],
          comments: '',
          isStarred: false,
          isArchived: false,
          category: detectCategory(file.name),
          base64Data,
          hash
        };

        importedPhotos.push(photoData);
      }

      setPhotos(prev => [...prev, ...importedPhotos]);
      
      if (importedPhotos.length > 0) {
        toast.success(`${importedPhotos.length} fotos importadas correctamente`);
      }
      if (duplicatesCount > 0) {
        toast.warning(`${duplicatesCount} fotos duplicadas omitidas`);
      }
    } catch (error) {
      toast.error('Error al importar las fotos');
    }
  }, [extractMetadata, generatePhotoHash, isDuplicate, fileToBase64, detectCategory]);

  // Marcar como favorita
  const toggleStarred = useCallback((id: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, isStarred: !photo.isStarred } : photo
    ));
  }, []);

  // Archivar foto
  const toggleArchived = useCallback((id: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, isArchived: !photo.isArchived } : photo
    ));
  }, []);

  // Eliminar foto
  const deletePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
    toast.success('Foto eliminada');
  }, []);

  // Añadir comentario
  const addComment = useCallback((id: string, comment: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, comments: comment } : photo
    ));
    toast.success('Comentario guardado');
  }, []);

  // Añadir etiquetas
  const addTags = useCallback((id: string, tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, tags } : photo
    ));
    toast.success('Etiquetas guardadas');
  }, []);

  // Cambiar categoría
  const changeCategory = useCallback((id: string, category: PhotoData['category']) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, category } : photo
    ));
    toast.success('Categoría actualizada');
  }, []);

  // Exportar fotos
  const exportPhotos = useCallback(() => {
    const exportData = photos.map(photo => ({
      ...photo,
      base64Data: undefined // Excluir datos base64 para reducir tamaño
    }));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fotos-metadata-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Metadatos de fotos exportados');
  }, [photos]);

  // Filtrar y ordenar fotos
  const getFilteredAndSortedPhotos = useCallback((filters: PhotoFilters) => {
    let filtered = photos;

    // Aplicar filtro de tipo
    switch (filters.filterType) {
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
        if (filters.selectedCategory !== 'all') {
          filtered = filtered.filter(photo => photo.category === filters.selectedCategory);
        }
        break;
    }

    // Aplicar búsqueda
    if (filters.searchTerm) {
      filtered = filtered.filter(photo =>
        photo.originalName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        photo.tags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        photo.comments.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        photo.category.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    switch (filters.sortType) {
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
  }, [photos]);

  // Funciones de selección múltiple
  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    if (isMultiSelectMode) {
      setSelectedPhotos([]);
    }
  }, [isMultiSelectMode]);

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  }, []);

  const selectAllPhotos = useCallback(() => {
    setSelectedPhotos(photos.map(p => p.id));
  }, [photos]);

  const deselectAllPhotos = useCallback(() => {
    setSelectedPhotos([]);
  }, []);

  const getSelectedPhotos = useCallback(() => {
    return photos.filter(p => selectedPhotos.includes(p.id));
  }, [photos, selectedPhotos]);

  // Funciones de carpetas
  const createFolder = useCallback((folder: Omit<VirtualFolder, 'id' | 'createdAt'>) => {
    const newFolder: VirtualFolder = {
      ...folder,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
    toast.success(`Carpeta "${folder.name}" creada`);
  }, []);

  const updateFolder = useCallback((folderId: string, updates: Partial<VirtualFolder>) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, ...updates } : folder
    ));
    toast.success('Carpeta actualizada');
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    toast.success('Carpeta eliminada');
  }, []);

  const movePhotosToFolder = useCallback((photoIds: string[], folderId: string) => {
    // Remover fotos de otras carpetas
    setFolders(prev => prev.map(folder => ({
      ...folder,
      photoIds: folder.photoIds.filter(id => !photoIds.includes(id))
    })));
    
    // Añadir fotos a la carpeta destino
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, photoIds: [...folder.photoIds, ...photoIds] }
        : folder
    ));
    
    const folderName = folders.find(f => f.id === folderId)?.name || 'carpeta';
    toast.success(`${photoIds.length} imagen${photoIds.length !== 1 ? 'es' : ''} movida${photoIds.length !== 1 ? 's' : ''} a "${folderName}"`);
  }, [folders]);

  // Funciones de renombrado
  const bulkRename = useCallback((renamedPhotos: { id: string; newName: string }[]) => {
    setPhotos(prev => prev.map(photo => {
      const renamed = renamedPhotos.find(r => r.id === photo.id);
      return renamed ? { ...photo, originalName: renamed.newName } : photo;
    }));
    toast.success(`${renamedPhotos.length} imagen${renamedPhotos.length !== 1 ? 'es' : ''} renombrada${renamedPhotos.length !== 1 ? 's' : ''}`);
  }, []);

  // Funciones de etiquetado
  const bulkUpdateTags = useCallback((photoIds: string[], tags: string[]) => {
    setPhotos(prev => prev.map(photo => 
      photoIds.includes(photo.id) ? { ...photo, tags } : photo
    ));
    toast.success(`Etiquetas actualizadas en ${photoIds.length} imagen${photoIds.length !== 1 ? 'es' : ''}`);
  }, []);

  const bulkUpdateComments = useCallback((photoIds: string[], comments: string) => {
    setPhotos(prev => prev.map(photo => 
      photoIds.includes(photo.id) ? { ...photo, comments } : photo
    ));
    toast.success(`Comentarios actualizados en ${photoIds.length} imagen${photoIds.length !== 1 ? 'es' : ''}`);
  }, []);

  // Función de eliminación múltiple
  const bulkDeletePhotos = useCallback((photoIds: string[]) => {
    setPhotos(prev => prev.filter(photo => !photoIds.includes(photo.id)));
    // Remover de carpetas
    setFolders(prev => prev.map(folder => ({
      ...folder,
      photoIds: folder.photoIds.filter(id => !photoIds.includes(id))
    })));
    setSelectedPhotos([]);
    toast.success(`${photoIds.length} imagen${photoIds.length !== 1 ? 'es' : ''} eliminada${photoIds.length !== 1 ? 's' : ''}`);
  }, []);

  // Obtener todos los tags únicos
  const getAllTags = useCallback(() => {
    const allTags = photos.flatMap(photo => photo.tags);
    return [...new Set(allTags)].sort();
  }, [photos]);

  // Actualizar una foto específica
  const updatePhoto = useCallback((updatedPhoto: PhotoData) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
    toast.success('Foto actualizada correctamente');
  }, []);

  return {
    // Estado básico
    photos,
    folders,
    selectedPhotos,
    isMultiSelectMode,
    
    // Funciones básicas
    handleImport,
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
   };
}