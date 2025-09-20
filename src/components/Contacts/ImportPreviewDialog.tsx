import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, ArrowUp, ArrowDown, Edit3, Check, RotateCcw, Upload } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ContactData } from '@/types/contactTypes';

interface ColumnMapping {
  originalName: string;
  displayName: string;
  targetField: keyof ContactData | 'ignore';
  isEnabled: boolean;
  order: number;
}

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  csvData: string[][];
  onConfirmImport: (columnMappings: ColumnMapping[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'fullName', label: 'Nombre Completo' },
  { value: 'givenName', label: 'Nombre de Pila' },
  { value: 'phoneNumber', label: 'Teléfono' },
  { value: 'whatsappId', label: 'WhatsApp ID' },
  { value: 'uniqueId', label: 'ID Único' },
  { value: 'lid', label: 'LID' },
  { value: 'company', label: 'Empresa' },
  { value: 'jobTitle', label: 'Cargo' },
  { value: 'notes', label: 'Notas' },
  { value: 'ignore', label: 'No Importar' }
];

export function ImportPreviewDialog({
  isOpen,
  onClose,
  csvData,
  onConfirmImport
}: ImportPreviewDialogProps) {
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [tempDisplayName, setTempDisplayName] = useState('');

  // Inicializar mapeos de columnas cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && csvData.length > 0) {
      const headers = csvData[0];
      const initialMappings: ColumnMapping[] = headers.map((header, index) => {
        // Mapeo automático inteligente basado en el nombre de la columna
        let targetField: keyof ContactData | 'ignore' = 'ignore';
        let displayName = header;
        
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('fullname') || lowerHeader.includes('zfullname')) {
          targetField = 'fullName';
          displayName = 'Nombre Completo';
        } else if (lowerHeader.includes('givenname') || lowerHeader.includes('zgivenname')) {
          targetField = 'givenName';
          displayName = 'Nombre de Pila';
        } else if (lowerHeader.includes('phone') || lowerHeader.includes('zphonenumber')) {
          targetField = 'phoneNumber';
          displayName = 'Teléfono';
        } else if (lowerHeader.includes('whatsapp') || lowerHeader.includes('zwhatsappid')) {
          targetField = 'whatsappId';
          displayName = 'WhatsApp ID';
        } else if (lowerHeader.includes('uniqueid') || lowerHeader.includes('zuniqueid')) {
          targetField = 'uniqueId';
          displayName = 'ID Único';
        } else if (lowerHeader.includes('lid') || lowerHeader.includes('zlid')) {
          targetField = 'lid';
          displayName = 'LID';
        }

        return {
          originalName: header,
          displayName,
          targetField,
          isEnabled: targetField !== 'ignore',
          order: index
        };
      });
      
      setColumnMappings(initialMappings);
    }
  }, [isOpen, csvData]);

  if (!isOpen || csvData.length === 0) return null;

  const headers = csvData[0];
  const sampleRows = csvData.slice(1, 4); // Mostrar 3 filas de ejemplo
  const totalRows = csvData.length - 1;
  const enabledColumns = columnMappings.filter(col => col.isEnabled);

  // Manejar cambio de orden de columnas
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newMappings = [...columnMappings];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newMappings.length) {
      [newMappings[index], newMappings[targetIndex]] = [newMappings[targetIndex], newMappings[index]];
      // Actualizar órdenes
      newMappings.forEach((mapping, idx) => {
        mapping.order = idx;
      });
      setColumnMappings(newMappings);
    }
  };

  // Manejar cambio de habilitación de columna
  const toggleColumn = (index: number) => {
    const newMappings = [...columnMappings];
    newMappings[index].isEnabled = !newMappings[index].isEnabled;
    setColumnMappings(newMappings);
  };

  // Manejar cambio de campo objetivo
  const changeTargetField = (index: number, newTarget: keyof ContactData | 'ignore') => {
    const newMappings = [...columnMappings];
    newMappings[index].targetField = newTarget;
    newMappings[index].isEnabled = newTarget !== 'ignore';
    setColumnMappings(newMappings);
  };

  // Manejar edición de nombre de columna
  const startEditing = (index: number) => {
    setEditingColumn(index);
    setTempDisplayName(columnMappings[index].displayName);
  };

  const saveDisplayName = () => {
    if (editingColumn !== null) {
      const newMappings = [...columnMappings];
      newMappings[editingColumn].displayName = tempDisplayName;
      setColumnMappings(newMappings);
      setEditingColumn(null);
      setTempDisplayName('');
    }
  };

  const cancelEditing = () => {
    setEditingColumn(null);
    setTempDisplayName('');
  };

  // Resetear a configuración automática
  const resetToDefaults = () => {
    const headers = csvData[0];
    const defaultMappings: ColumnMapping[] = headers.map((header, index) => {
      let targetField: keyof ContactData | 'ignore' = 'ignore';
      let displayName = header;
      
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('fullname') || lowerHeader.includes('zfullname')) {
        targetField = 'fullName';
        displayName = 'Nombre Completo';
      } else if (lowerHeader.includes('givenname') || lowerHeader.includes('zgivenname')) {
        targetField = 'givenName';
        displayName = 'Nombre de Pila';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('zphonenumber')) {
        targetField = 'phoneNumber';
        displayName = 'Teléfono';
      } else if (lowerHeader.includes('whatsapp') || lowerHeader.includes('zwhatsappid')) {
        targetField = 'whatsappId';
        displayName = 'WhatsApp ID';
      } else if (lowerHeader.includes('uniqueid') || lowerHeader.includes('zuniqueid')) {
        targetField = 'uniqueId';
        displayName = 'ID Único';
      } else if (lowerHeader.includes('lid') || lowerHeader.includes('zlid')) {
        targetField = 'lid';
        displayName = 'LID';
      }

      return {
        originalName: header,
        displayName,
        targetField,
        isEnabled: targetField !== 'ignore',
        order: index
      };
    });
    
    setColumnMappings(defaultMappings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vista Previa de Importación</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalRows} contactos • {enabledColumns.length} columnas seleccionadas
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetear
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden flex">
          {/* Panel de configuración de columnas */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Configuración de Columnas</h3>
              
              <div className="space-y-3">
                {columnMappings.map((mapping, index) => (
                  <div
                    key={mapping.originalName}
                    className={`border rounded-lg p-3 bg-white ${
                      mapping.isEnabled ? 'border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    {/* Header de la columna */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={mapping.isEnabled}
                          onCheckedChange={() => toggleColumn(index)}
                        />
                        
                        {editingColumn === index ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              value={tempDisplayName}
                              onChange={(e) => setTempDisplayName(e.target.value)}
                              className="h-6 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveDisplayName();
                                if (e.key === 'Escape') cancelEditing();
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveDisplayName}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-gray-900">
                              {mapping.displayName}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(index)}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Controles de orden */}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveColumn(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveColumn(index, 'down')}
                          disabled={index === columnMappings.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Información de la columna */}
                    <div className="text-xs text-gray-600 mb-2">
                      Original: <span className="font-mono">{mapping.originalName}</span>
                    </div>
                    
                    {/* Selector de campo objetivo */}
                    <select
                      value={mapping.targetField}
                      onChange={(e) => changeTargetField(index, e.target.value as keyof ContactData | 'ignore')}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      disabled={!mapping.isEnabled}
                    >
                      {FIELD_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vista previa de datos */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Vista Previa de Datos</h3>
              
              {/* Tabla de vista previa */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {columnMappings
                          .filter(mapping => mapping.isEnabled)
                          .map((mapping, index) => (
                            <th
                              key={mapping.originalName}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                            >
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {mapping.displayName}
                                </div>
                                <div className="text-xs text-gray-500 normal-case">
                                  → {FIELD_OPTIONS.find(opt => opt.value === mapping.targetField)?.label}
                                </div>
                              </div>
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sampleRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {columnMappings
                            .filter(mapping => mapping.isEnabled)
                            .map((mapping) => {
                              const cellValue = row[columnMappings.indexOf(mapping)] || '';
                              return (
                                <td
                                  key={mapping.originalName}
                                  className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                                >
                                  <div className="max-w-xs truncate" title={cellValue}>
                                    {cellValue}
                                  </div>
                                </td>
                              );
                            })
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {totalRows > 3 && (
                  <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                    ... y {totalRows - 3} filas más
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{enabledColumns.length}</span> columnas seleccionadas de <span className="font-medium">{columnMappings.length}</span>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={() => onConfirmImport(columnMappings)}
              disabled={enabledColumns.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar {totalRows} Contactos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportPreviewDialog;