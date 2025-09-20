import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, Move, Save, Undo } from 'lucide-react';
import Button from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PhotoData } from '@/types/photoTypes';

interface ImageEditorProps {
  photo: PhotoData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedPhoto: PhotoData) => void;
}

interface ImageTransform {
  rotation: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export function ImageEditor({ photo, isOpen, onClose, onSave }: ImageEditorProps) {
  const [transform, setTransform] = useState<ImageTransform>({
    rotation: 0,
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageTransform[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resetear transformaciones cuando se abre el editor
  useEffect(() => {
    if (isOpen) {
      const initialTransform = {
        rotation: 0,
        scale: 1,
        translateX: 0,
        translateY: 0
      };
      setTransform(initialTransform);
      setHistory([initialTransform]);
    }
  }, [isOpen]);

  // Guardar estado en historial
  const saveToHistory = (newTransform: ImageTransform) => {
    setHistory(prev => [...prev, newTransform]);
  };

  // Deshacer última acción
  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setTransform(newHistory[newHistory.length - 1]);
    }
  };

  // Rotar imagen
  const rotate = (degrees: number) => {
    const newTransform = {
      ...transform,
      rotation: (transform.rotation + degrees) % 360
    };
    setTransform(newTransform);
    saveToHistory(newTransform);
  };

  // Cambiar zoom
  const zoom = (factor: number) => {
    const newScale = Math.max(0.1, Math.min(5, transform.scale * factor));
    const newTransform = {
      ...transform,
      scale: newScale
    };
    setTransform(newTransform);
    saveToHistory(newTransform);
  };

  // Ajustar a pantalla
  const fitToScreen = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // padding
    const containerHeight = container.clientHeight - 40;
    
    const imageWidth = photo.width || 800;
    const imageHeight = photo.height || 600;
    
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // No ampliar más del tamaño original
    
    const newTransform = {
      ...transform,
      scale: newScale,
      translateX: 0,
      translateY: 0
    };
    setTransform(newTransform);
    saveToHistory(newTransform);
  };

  // Manejar arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - transform.translateX,
      y: e.clientY - transform.translateY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newTransform = {
      ...transform,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y
    };
    setTransform(newTransform);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      saveToHistory(transform);
    }
  };

  // Manejar zoom con slider
  const handleZoomSlider = (value: number[]) => {
    const newTransform = {
      ...transform,
      scale: value[0] / 100
    };
    setTransform(newTransform);
  };

  // Aplicar transformaciones a la imagen real
  const applyTransformations = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensiones después de la rotación
        const angle = (transform.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(angle));
        const sin = Math.abs(Math.sin(angle));
        
        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        if (!ctx) {
          resolve(photo.base64Data);
          return;
        }
        
        // Limpiar canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mover al centro y aplicar rotación
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        
        // Dibujar imagen centrada
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Convertir a base64
        const newBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(newBase64);
      };
      
      img.onerror = () => {
        resolve(photo.base64Data);
      };
      
      img.src = photo.base64Data;
    });
  }, [photo.base64Data, transform.rotation]);

  // Guardar cambios
  const handleSave = async () => {
    try {
      // Solo aplicar transformaciones si hay rotación
      let newBase64Data = photo.base64Data;
      let newWidth = photo.width;
      let newHeight = photo.height;
      
      if (transform.rotation !== 0) {
        newBase64Data = await applyTransformations();
        
        // Intercambiar dimensiones si la rotación es de 90° o 270°
        if (Math.abs(transform.rotation) === 90 || Math.abs(transform.rotation) === 270) {
          newWidth = photo.height;
          newHeight = photo.width;
        }
      }
      
      const editedPhoto: PhotoData = {
        ...photo,
        base64Data: newBase64Data,
        width: newWidth,
        height: newHeight,
        comments: photo.comments + (photo.comments ? ' | ' : '') + 
          `Editada: ${transform.rotation !== 0 ? `rotación ${transform.rotation}°` : 'sin cambios'}`
      };
      
      onSave(editedPhoto);
      onClose();
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      // Guardar sin transformaciones en caso de error
      const editedPhoto = {
        ...photo,
        comments: photo.comments + (photo.comments ? ' | ' : '') + 'Error al aplicar transformaciones'
      };
      onSave(editedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  const imageStyle = {
    transform: `rotate(${transform.rotation}deg) scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.2s ease'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header con controles */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold truncate">{photo.originalName}</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Zoom:</span>
            <div className="w-32">
              <Slider
                value={[transform.scale * 100]}
                onValueChange={handleZoomSlider}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-300 w-12">{Math.round(transform.scale * 100)}%</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => rotate(-90)} title="Rotar izquierda">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => rotate(90)} title="Rotar derecha">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoom(1.2)} title="Acercar">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoom(0.8)} title="Alejar">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={fitToScreen} title="Ajustar a pantalla">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length <= 1} title="Deshacer">
            <Undo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <Button variant="ghost" size="sm" onClick={handleSave} title="Guardar cambios">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} title="Cerrar">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área de imagen */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-gray-800"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={photo.base64Data}
          alt={photo.originalName}
          style={imageStyle}
          onMouseDown={handleMouseDown}
          onDragStart={(e) => e.preventDefault()}
          className="max-w-none select-none"
        />
      </div>

      {/* Footer con información */}
      <div className="bg-gray-900 text-white p-2 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
          <span>Rotación: {transform.rotation}°</span>
          <span>Zoom: {Math.round(transform.scale * 100)}%</span>
          <span>Posición: ({Math.round(transform.translateX)}, {Math.round(transform.translateY)})</span>
          <span>Dimensiones: {photo.width} × {photo.height}px</span>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;