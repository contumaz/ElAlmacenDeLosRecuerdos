import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { DuplicateDetectionService } from '../utils/duplicateDetection';

interface FileImporterProps {
  acceptedTypes: string[];
  onImport: (data: any[], summary: ImportSummary, fileName?: string) => void;
  contentType: 'contact' | 'email' | 'whatsapp' | 'photo';
  maxFileSize?: number; // en MB
  title?: string;
  description?: string;
}

interface ImportSummary {
  total: number;
  new: number;
  duplicates: number;
  errors: string[];
}

interface ParsedFile {
  name: string;
  data: any[];
  errors: string[];
}

export const FileImporter: React.FC<FileImporterProps> = ({
  acceptedTypes,
  onImport,
  contentType,
  maxFileSize = 10,
  title = 'Importar Archivos',
  description = 'Selecciona los archivos que deseas importar'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);
  const [importPreview, setImportPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = acceptedTypes.some(type => 
        file.type.includes(type) || file.name.toLowerCase().endsWith(type)
      );
      const isValidSize = file.size <= maxFileSize * 1024 * 1024;
      return isValidType && isValidSize;
    });

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      processFiles(validFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const results: ParsedFile[] = [];

    for (const file of files) {
      try {
        const data = await parseFile(file);
        results.push({
          name: file.name,
          data: data,
          errors: []
        });
      } catch (error) {
        results.push({
          name: file.name,
          data: [],
          errors: [error instanceof Error ? error.message : 'Error desconocido']
        });
      }
    }

    setParseResults(results);
    
    // Combinar todos los datos y verificar duplicados
    const allData = results.flatMap(result => result.data);
    if (allData.length > 0) {
      const duplicateCheck = DuplicateDetectionService.processBatch(allData, contentType);
      setImportPreview(duplicateCheck);
    }
    
    setIsProcessing(false);
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsedData: any[] = [];

          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            parsedData = JSON.parse(content);
          } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            parsedData = parseCSV(content);
          } else if (file.name.endsWith('.txt')) {
            parsedData = parseTXT(content, contentType);
          } else if (file.name.endsWith('.eml') || file.name.endsWith('.mbox')) {
            parsedData = parseEmail(content);
          } else {
            throw new Error('Formato de archivo no soportado');
          }

          resolve(Array.isArray(parsedData) ? parsedData : [parsedData]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Parsing mejorado para CSV con manejo de comillas y comas dentro de campos
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    return lines.slice(1).map((line, index) => {
      try {
        const values = parseCSVLine(line);
        const obj: any = {};
        
        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          
          // Mapeo específico para WhatsApp CSV
           if (contentType === 'whatsapp') {
             switch (header) {
               case 'chat':
               case 'chatname':
               case 'grupo':
                 obj.chatName = value;
                 break;
               case 'sender':
               case 'remitente':
               case 'from':
               case 'de':
                 obj.sender = value;
                 break;
               case 'message':
               case 'mensaje':
               case 'text':
               case 'texto':
               case 'content':
               case 'contenido':
                 obj.message = value;
                 break;
               case 'timestamp':
               case 'date':
               case 'fecha':
               case 'time':
               case 'hora':
                 // Manejar timestamp Unix (formato del archivo modelo)
                 if (value && !isNaN(parseFloat(value))) {
                   const unixTimestamp = parseFloat(value);
                   obj.timestamp = new Date(unixTimestamp * 1000).toISOString();
                 } else {
                   obj.timestamp = value;
                 }
                 break;
               case 'type':
               case 'tipo':
               case 'messagetype':
                 obj.messageType = value || 'text';
                 break;
               case 'media':
                 // Detectar tipo de mensaje basado en media
                 if (value && value.trim()) {
                   obj.messageType = 'media';
                   obj.mediaInfo = value;
                 }
                 break;
               case 'isgroup':
               case 'esgrupo':
               case 'group':
                 obj.isGroupChat = value.toLowerCase() === 'true' || value === '1';
                 break;
               default:
                 obj[header] = value;
             }
           } else {
             obj[header] = value;
           }
        });
        
        // Validaciones y valores por defecto para WhatsApp
        if (contentType === 'whatsapp') {
          obj.chatName = obj.chatName || 'Chat importado';
          obj.sender = obj.sender || 'Desconocido';
          obj.message = obj.message || '';
          obj.messageType = obj.messageType || 'text';
          obj.isGroupChat = obj.isGroupChat || false;
          
          // Formatear timestamp si es necesario
          if (obj.timestamp && !obj.timestamp.includes('T')) {
            try {
              const date = new Date(obj.timestamp);
              if (!isNaN(date.getTime())) {
                obj.timestamp = date.toISOString();
              }
            } catch (e) {
              obj.timestamp = new Date().toISOString();
            }
          }
        }
        
        return obj;
      } catch (error) {
        console.warn(`Error parsing CSV line ${index + 2}:`, error);
        return null;
      }
    }).filter(Boolean);
  };

  const parseTXT = (content: string, type: string): any[] => {
    // Parsing específico según el tipo de contenido
    const lines = content.split('\n').filter(line => line.trim());
    
    if (type === 'whatsapp') {
      return parseWhatsAppTXT(lines);
    }
    
    return lines.map((line, index) => ({ id: index, content: line }));
  };

  const parseWhatsAppTXT = (lines: string[]): any[] => {
    const messages: any[] = [];
    const dateRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}:\d{2})\]\s*(.+?):\s*(.+)$/;
    
    lines.forEach(line => {
      const match = line.match(dateRegex);
      if (match) {
        messages.push({
          date: match[1],
          time: match[2],
          sender: match[3],
          message: match[4],
          timestamp: `${match[1]} ${match[2]}`
        });
      }
    });
    
    return messages;
  };

  const parseEmail = (content: string): any[] => {
    // Parsing básico de emails - se puede expandir
    const emailRegex = /From:\s*(.+?)\nSubject:\s*(.+?)\nDate:\s*(.+?)\n\n([\s\S]+?)(?=\n\nFrom:|$)/g;
    const emails: any[] = [];
    let match;
    
    while ((match = emailRegex.exec(content)) !== null) {
      emails.push({
        from: match[1].trim(),
        subject: match[2].trim(),
        date: match[3].trim(),
        body: match[4].trim()
      });
    }
    
    return emails;
  };

  const confirmImport = () => {
    if (importPreview && importPreview.newItems.length > 0) {
      const importedIds = DuplicateDetectionService.confirmImport(importPreview.newItems, contentType);
      
      const summary: ImportSummary = {
        total: importPreview.summary.total,
        new: importPreview.summary.new,
        duplicates: importPreview.summary.duplicates,
        errors: parseResults.flatMap(result => result.errors)
      };
      
      // Obtener el nombre del primer archivo procesado para usar como nombre de conversación
      const fileName = parseResults.length > 0 ? parseResults[0].name : undefined;
      
      onImport(importPreview.newItems, summary, fileName);
      resetImporter();
    }
  };

  const resetImporter = () => {
    setSelectedFiles([]);
    setParseResults([]);
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Área de carga de archivos */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : 'Seleccionar Archivos'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <p className="text-sm text-gray-500 mt-2">
          Formatos soportados: {acceptedTypes.join(', ')} | Tamaño máximo: {maxFileSize}MB
        </p>
      </div>

      {/* Resultados del procesamiento */}
      {parseResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Archivos Procesados</h4>
          {parseResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="font-medium">{result.name}</span>
                {result.errors.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {result.errors.length > 0 && (
                <div className="text-red-600 text-sm">
                  {result.errors.map((error, i) => (
                    <p key={i}>• {error}</p>
                  ))}
                </div>
              )}
              
              {result.data.length > 0 && (
                <p className="text-sm text-gray-600">
                  {result.data.length} elementos encontrados
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vista previa de importación */}
      {importPreview && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Vista Previa de Importación</h4>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importPreview.summary.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importPreview.summary.new}</div>
              <div className="text-sm text-gray-600">Nuevos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{importPreview.summary.duplicates}</div>
              <div className="text-sm text-gray-600">Duplicados</div>
            </div>
          </div>

          {importPreview.duplicates.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-orange-600 mb-2">Elementos Duplicados (se omitirán)</h5>
              <div className="max-h-32 overflow-y-auto text-sm text-gray-600">
                {importPreview.duplicates.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="py-1">
                    • {JSON.stringify(item).substring(0, 100)}...
                  </div>
                ))}
                {importPreview.duplicates.length > 5 && (
                  <div className="py-1 font-medium">
                    ... y {importPreview.duplicates.length - 5} más
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={confirmImport}
              disabled={importPreview.summary.new === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirmar Importación ({importPreview.summary.new} elementos)
            </button>
            <button
              onClick={resetImporter}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};