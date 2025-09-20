/**
 * Servicio para manejar archivos de audio en modo web
 * Convierte rutas de archivos a URLs reproducibles
 */

class AudioFileService {
  private audioCache = new Map<string, string>();

  /**
   * Obtiene una URL reproducible para un archivo de audio
   */
  async getAudioUrl(filePath: string, memory?: any): Promise<string | null> {
    // Si ya está en caché, devolverlo
    if (this.audioCache.has(filePath)) {
      return this.audioCache.get(filePath)!;
    }

    try {
      // Si es una URL web válida, devolverla directamente
      if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
        return filePath;
      }

      // Para archivos locales en modo web, intentar recuperar desde localStorage
      const audioData = localStorage.getItem(`audio_${memory?.id}`);
      if (audioData) {
        // Convertir base64 a blob
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/webm' });
        
        const url = URL.createObjectURL(blob);
        this.audioCache.set(filePath, url);
        return url;
      }

      // Si no se encuentra el archivo, intentar crear un audio de prueba
      console.warn('Audio file not found, creating test audio');
      return this.createTestAudio();
      
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  }

  /**
   * Guarda un archivo de audio en localStorage para reproducción posterior
   */
  async saveAudioForPlayback(memoryId: number, audioBlob: Blob): Promise<void> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      const base64String = btoa(binaryString);
      
      localStorage.setItem(`audio_${memoryId}`, base64String);
      console.log(`Audio saved for memory ${memoryId}`);
    } catch (error) {
      console.error('Error saving audio for playback:', error);
    }
  }

  /**
   * Crea un audio de prueba para testing
   */
  private createTestAudio(): string {
    // Crear un audio silencioso de 1 segundo para testing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
    
    // Llenar con silencio
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = 0;
    }

    // Convertir a WAV blob
    const wavBlob = this.bufferToWav(buffer);
    return URL.createObjectURL(wavBlob);
  }

  /**
   * Convierte AudioBuffer a WAV Blob
   */
  private bufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // PCM data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Limpia URLs del caché para liberar memoria
   */
  clearCache(): void {
    this.audioCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioCache.clear();
  }
}

export default new AudioFileService();