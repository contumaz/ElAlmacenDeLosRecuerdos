/**
 * Tipos e interfaces compartidos para los servicios de Electron
 */

// Tipos para datos de memoria
export interface MemoryData {
  id?: number;
  title: string;
  content: string;
  type: 'texto' | 'audio' | 'foto' | 'video';
  tags: string[];
  date?: string;
  filePath?: string;
  audioUrl?: string;
  audioFile?: File;
  imageUrl?: string;
  imageFile?: File;
  videoUrl?: string;
  videoFile?: File;
  encryptionLevel?: 'none' | 'basic' | 'advanced';
  requiresPassword?: boolean;
  isEncrypted?: boolean;
  privacyLevel?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    duration?: number;
    size?: number;
    format?: string;
    location?: string;
    date?: string;
    emotion?: string;
    hasTranscription?: boolean;
    savedDirectory?: string;
  };
}

// Configuración de usuario
export interface UserConfig {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  autoSave: boolean;
  notifications: boolean;
  backupEnabled: boolean;
  maxStorageSize: number;
}

// Respuestas de API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Respuesta de autenticación
export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: string;
    authenticated: boolean;
  };
  token?: string;
  error?: string;
}

// Respuesta de transcripción
export interface TranscriptionResponse {
  success: boolean;
  text: string;
  transcription: string;
  error?: string | null;
}

// Respuesta de análisis de emoción
export interface EmotionAnalysisResponse {
  success: boolean;
  emotion?: {
    primary: string;
    confidence: number;
    emotions: {
      joy: number;
      sadness: number;
      nostalgia: number;
      neutral: number;
    };
  };
  error?: string;
}

// Respuesta de chat con IA
export interface ChatResponse {
  success: boolean;
  response?: string;
  timestamp?: string;
  error?: string;
}

// Respuesta de generación de preguntas
export interface QuestionsResponse {
  success: boolean;
  questions?: string[];
  category?: string;
  adaptationLevel?: string;
  error?: string;
}

// Entrada de log de auditoría
export interface AuditLogEntry {
  id: number;
  action: string;
  timestamp: string;
  details: string;
  userId?: number;
  ipAddress?: string;
}

// Respuesta de log de auditoría
export interface AuditLogResponse {
  success: boolean;
  logs: AuditLogEntry[];
  error?: string;
}

// Respuesta de backup
export interface BackupResponse {
  success: boolean;
  message?: string;
  filename?: string;
  error?: string;
}

// Parámetros de paginación
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
  error?: string;
}