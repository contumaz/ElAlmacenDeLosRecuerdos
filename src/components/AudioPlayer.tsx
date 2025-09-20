import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Button from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { validateAudioFile, generateAudioErrorMessage, logAudioError, logAudioLoadStart, logAudioReady } from '@/utils/audioValidation';
import audioFileService from '@/services/AudioFileService';

interface AudioPlayerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  memory?: any; // Para acceder a los datos de la memoria
}

export default function AudioPlayer({ 
  audioUrl, 
  audioBlob, 
  className = '',
  size = 'md',
  memory
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Configurar audio cuando cambie la fuente
  useEffect(() => {
    const setupAudio = async () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }

      const src = audioUrl || (audioBlob ? URL.createObjectURL(audioBlob) : null);
      if (!src) return;

      // Validar archivo de audio antes de proceder
      const validation = validateAudioFile(src);
      const memoryTitle = memory?.title || 'Sin título';
      
      console.log('AudioPlayer - Configurando audio:', {
        src,
        memoryTitle,
        validation: validation.isValid ? 'válido' : validation.error
      });

      if (audioUrl || audioBlob) {
        const audio = new Audio();
        
        audio.addEventListener('loadstart', () => {
          logAudioLoadStart('AudioPlayer', memoryTitle, src, validation);
        });

        audio.addEventListener('canplay', () => {
          logAudioReady('AudioPlayer', memoryTitle, src, audio.duration);
        });
        
        if (audioBlob) {
          audio.src = URL.createObjectURL(audioBlob);
        } else if (audioUrl) {
          // Usar el servicio de archivos de audio para obtener una URL reproducible
          const playableUrl = await audioFileService.getAudioUrl(audioUrl, memory);
          if (playableUrl) {
            audio.src = playableUrl;
          } else {
            audio.src = audioUrl;
          }
        }

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
          setIsLoading(false);
          console.log('AudioPlayer - Metadatos cargados:', {
            memory: memory?.title || 'Sin título',
            duration: audio.duration
          });
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

        audio.addEventListener('error', (e) => {
          const audioElement = e.target as HTMLAudioElement;
          const validation = validateAudioFile(src);
          
          logAudioError('AudioPlayer', memoryTitle, src, audioElement.error, validation);
          
          const errorMessage = generateAudioErrorMessage(memoryTitle, src, validation);
          toast.error(errorMessage + '. Verifica que el archivo existe y es accesible.');
          setIsLoading(false);
        });

        audioRef.current = audio;
        setIsLoading(true);

        return () => {
          if (audioBlob) {
            URL.revokeObjectURL(audio.src);
          }
          audio.remove();
        };
      }
    };
    
    setupAudio();
  }, [audioUrl, audioBlob, memory]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error reproduciendo audio:', {
            error,
            url: audioUrl || 'blob',
            memory: memory?.title || 'Sin título'
          });
          
          const errorMessage = `Error al reproducir audio: ${memory?.title || 'archivo'}`;
          toast.error(errorMessage);
        });
      }
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (!audioUrl && !audioBlob) {
    return null;
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={handlePlay}
        disabled={isLoading}
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Volume2 className={`${iconSize} animate-pulse`} />
        ) : isPlaying ? (
          <Pause className={iconSize} />
        ) : (
          <Play className={iconSize} />
        )}
      </Button>

      {size !== 'sm' && duration > 0 && (
        <>
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          <div className="text-xs text-gray-500 flex-shrink-0 min-w-fit">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </>
      )}
    </div>
  );
}

// Estilos CSS para el slider
const sliderStyles = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #f59e0b;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #f59e0b;
  cursor: pointer;
  border: none;
}
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);
}