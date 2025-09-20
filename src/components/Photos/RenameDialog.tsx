import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Hash, Calendar, Save, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoData } from '@/types/photoTypes';

interface RenameDialogProps {
  photos: PhotoData[];
  isOpen: boolean;
  onClose: () => void;
  onRename: (renamedPhotos: { id: string; newName: string }[]) => void;
}

type RenameMode = 'individual' | 'batch';
type NumberingFormat = 'sequential' | 'date' | 'custom';

interface BatchRenameSettings {
  baseName: string;
  numberingFormat: NumberingFormat;
  startNumber: number;
  digits: number;
  includeOriginalName: boolean;
  separator: string;
  prefix: string;
  suffix: string;
}

export function RenameDialog({ photos, isOpen, onClose, onRename }: RenameDialogProps) {
  const [mode, setMode] = useState<RenameMode>(photos.length === 1 ? 'individual' : 'batch');
  const [individualNames, setIndividualNames] = useState<{ [key: string]: string }>({});
  const [batchSettings, setBatchSettings] = useState<BatchRenameSettings>({
    baseName: 'imagen',
    numberingFormat: 'sequential',
    startNumber: 1,
    digits: 4,
    includeOriginalName: false,
    separator: '_',
    prefix: '',
    suffix: ''
  });
  const [preview, setPreview] = useState<{ id: string; currentName: string; newName: string }[]>([]);

  // Inicializar nombres individuales
  useEffect(() => {
    if (isOpen) {
      const names: { [key: string]: string } = {};
      photos.forEach(photo => {
        const nameWithoutExt = photo.originalName.replace(/\.[^/.]+$/, '');
        names[photo.id] = nameWithoutExt;
      });
      setIndividualNames(names);
    }
  }, [isOpen, photos]);

  // Generar preview de nombres
  useEffect(() => {
    if (mode === 'individual') {
      const newPreview = photos.map(photo => {
        const extension = photo.originalName.match(/\.[^/.]+$/)?.[0] || '';
        const newName = (individualNames[photo.id] || photo.originalName.replace(/\.[^/.]+$/, '')) + extension;
        return {
          id: photo.id,
          currentName: photo.originalName,
          newName
        };
      });
      setPreview(newPreview);
    } else {
      generateBatchPreview();
    }
  }, [mode, individualNames, batchSettings, photos]);

  // Función para detectar nombres duplicados y generar numeración inteligente
  const getSmartNumbering = useCallback((baseName: string, extension: string, allPhotos: PhotoData[], excludeIds: string[] = []) => {
    // Obtener todos los nombres existentes (excluyendo las fotos que se van a renombrar)
    const existingNames = allPhotos
      .filter(photo => !excludeIds.includes(photo.id))
      .map(photo => photo.originalName.toLowerCase());
    
    // Buscar el patrón: baseName + número + extension
    const pattern = new RegExp(`^${baseName.toLowerCase()}(?:_?(\d+))?${extension.toLowerCase()}$`);
    const numbers: number[] = [];
    
    existingNames.forEach(name => {
      const match = name.match(pattern);
      if (match) {
        const num = match[1] ? parseInt(match[1], 10) : 1;
        numbers.push(num);
      }
    });
    
    // Si no hay duplicados, devolver el nombre base
    if (numbers.length === 0) {
      return baseName + extension;
    }
    
    // Encontrar el siguiente número disponible
    const maxNumber = Math.max(...numbers);
    return `${baseName}_${(maxNumber + 1).toString().padStart(batchSettings.digits, '0')}${extension}`;
  }, [batchSettings.digits]);

  const generateBatchPreview = () => {
    const sortedPhotos = [...photos].sort((a, b) => {
      if (batchSettings.numberingFormat === 'date') {
        return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
      }
      return a.originalName.localeCompare(b.originalName);
    });

    // Obtener todas las fotos existentes para verificar duplicados
    // Nota: Necesitaríamos acceso a todas las fotos, no solo las seleccionadas
    // Por ahora usamos las fotos actuales como referencia
    const allExistingPhotos = photos; // Idealmente esto vendría de un contexto más amplio
    
    const newPreview = sortedPhotos.map((photo, index) => {
      const extension = photo.originalName.match(/\.[^/.]+$/)?.[0] || '';
      const nameWithoutExt = photo.originalName.replace(/\.[^/.]+$/, '');
      
      let number: string;
      if (batchSettings.numberingFormat === 'date') {
        const date = new Date(photo.dateTaken);
        number = date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + 
                date.toTimeString().slice(0, 8).replace(/:/g, '');
      } else {
        number = (batchSettings.startNumber + index).toString().padStart(batchSettings.digits, '0');
      }
      
      let baseName = '';
      
      if (batchSettings.prefix) {
        baseName += batchSettings.prefix + batchSettings.separator;
      }
      
      if (batchSettings.includeOriginalName) {
        baseName += nameWithoutExt + batchSettings.separator;
      }
      
      baseName += batchSettings.baseName + batchSettings.separator + number;
      
      if (batchSettings.suffix) {
        baseName += batchSettings.separator + batchSettings.suffix;
      }
      
      // Verificar duplicados y generar nombre inteligente
      const excludeIds = sortedPhotos.map(p => p.id); // Excluir las fotos que se están renombrando
      const smartName = getSmartNumbering(baseName, extension, allExistingPhotos, excludeIds);
      
      return {
        id: photo.id,
        currentName: photo.originalName,
        newName: smartName
      };
    });
    
    setPreview(newPreview);
  };

  const handleIndividualNameChange = (photoId: string, newName: string) => {
    setIndividualNames(prev => ({
      ...prev,
      [photoId]: newName
    }));
  };

  const handleBatchSettingChange = (key: keyof BatchRenameSettings, value: any) => {
    setBatchSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    const renamedPhotos = preview.map(item => ({
      id: item.id,
      newName: item.newName
    }));
    onRename(renamedPhotos);
    onClose();
  };

  const resetToOriginal = () => {
    if (mode === 'individual') {
      const names: { [key: string]: string } = {};
      photos.forEach(photo => {
        const nameWithoutExt = photo.originalName.replace(/\.[^/.]+$/, '');
        names[photo.id] = nameWithoutExt;
      });
      setIndividualNames(names);
    } else {
      setBatchSettings({
        baseName: 'imagen',
        numberingFormat: 'sequential',
        startNumber: 1,
        digits: 4,
        includeOriginalName: false,
        separator: '_',
        prefix: '',
        suffix: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Renombrar {photos.length === 1 ? 'imagen' : `${photos.length} imágenes`}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Selector de modo */}
            {photos.length > 1 && (
              <div className="mb-6">
                <Label className="text-base font-medium mb-3 block">Modo de renombrado</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="individual"
                      checked={mode === 'individual'}
                      onChange={(e) => setMode(e.target.value as RenameMode)}
                      className="text-blue-600"
                    />
                    <span>Individual</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="batch"
                      checked={mode === 'batch'}
                      onChange={(e) => setMode(e.target.value as RenameMode)}
                      className="text-blue-600"
                    />
                    <span>En lote</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de configuración */}
              <div>
                <h3 className="text-lg font-medium mb-4">Configuración</h3>
                
                {mode === 'individual' ? (
                  <div className="space-y-4">
                    {photos.map(photo => {
                      const extension = photo.originalName.match(/\.[^/.]+$/)?.[0] || '';
                      return (
                        <div key={photo.id} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {photo.originalName}
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              value={individualNames[photo.id] || ''}
                              onChange={(e) => handleIndividualNameChange(photo.id, e.target.value)}
                              placeholder="Nuevo nombre"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500">{extension}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="baseName">Nombre base</Label>
                      <Input
                        id="baseName"
                        value={batchSettings.baseName}
                        onChange={(e) => handleBatchSettingChange('baseName', e.target.value)}
                        placeholder="imagen"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="numberingFormat">Formato de numeración</Label>
                      <Select
                        value={batchSettings.numberingFormat}
                        onValueChange={(value) => handleBatchSettingChange('numberingFormat', value as NumberingFormat)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">Secuencial (0001, 0002...)</SelectItem>
                          <SelectItem value="date">Por fecha (YYYYMMDD_HHMMSS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {batchSettings.numberingFormat === 'sequential' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startNumber">Número inicial</Label>
                          <Input
                            id="startNumber"
                            type="number"
                            value={batchSettings.startNumber}
                            onChange={(e) => handleBatchSettingChange('startNumber', parseInt(e.target.value) || 1)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="digits">Dígitos</Label>
                          <Input
                            id="digits"
                            type="number"
                            value={batchSettings.digits}
                            onChange={(e) => handleBatchSettingChange('digits', parseInt(e.target.value) || 4)}
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prefix">Prefijo</Label>
                        <Input
                          id="prefix"
                          value={batchSettings.prefix}
                          onChange={(e) => handleBatchSettingChange('prefix', e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <Label htmlFor="suffix">Sufijo</Label>
                        <Input
                          id="suffix"
                          value={batchSettings.suffix}
                          onChange={(e) => handleBatchSettingChange('suffix', e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="separator">Separador</Label>
                      <Input
                        id="separator"
                        value={batchSettings.separator}
                        onChange={(e) => handleBatchSettingChange('separator', e.target.value)}
                        placeholder="_"
                        maxLength={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeOriginal"
                        checked={batchSettings.includeOriginalName}
                        onCheckedChange={(checked) => handleBatchSettingChange('includeOriginalName', checked)}
                      />
                      <Label htmlFor="includeOriginal">Incluir nombre original</Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Vista previa</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {preview.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-600 truncate">{item.currentName}</div>
                          <div className="font-medium text-blue-600 truncate">→ {item.newName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={resetToOriginal}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Renombrar {photos.length === 1 ? 'imagen' : `${photos.length} imágenes`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RenameDialog;