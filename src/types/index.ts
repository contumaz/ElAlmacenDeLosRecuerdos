// Tipos para El Almacén de los Recuerdos

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'albacea' | 'familiar';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export interface Memory {
  id: number;
  title: string;
  content: string;
  type: 'texto' | 'audio' | 'foto' | 'video';
  filePath?: string;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  transcription?: string;
  metadata: {
    duration?: number;
    size?: number;
    format?: string;
    location?: string;
    date?: string;
    emotion?: string;
    hasTranscription?: boolean;
    savedDirectory?: string;
    category?: string;
  };
  privacyLevel: number;
  emotion?: EmotionAnalysis;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Propiedades de cifrado
  isEncrypted?: boolean;
  encryptionLevel: 'none' | 'basic' | 'advanced';
  requiresPassword?: boolean;
}

export interface EmotionAnalysis {
  primary: string;
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    love: number;
    nostalgia: number;
  };
}

export interface Conversation {
  id: number;
  userId: number;
  question: string;
  response: string;
  context: any;
  emotionDetected?: string;
  timestamp: string;
  memoryId?: number;
}

export interface Interview {
  id: number;
  title: string;
  description: string;
  questions: string[];
  responses: ConversationResponse[];
  duration: number;
  status: 'in_progress' | 'completed' | 'paused';
  emotionalProfile: EmotionAnalysis;
  createdAt: string;
  completedAt?: string;
}

export interface ConversationResponse {
  question: string;
  answer: string;
  audioFile?: string;
  emotion: EmotionAnalysis;
  timestamp: string;
}

export interface Permission {
  id: number;
  userId: number;
  accessType: string;
  resources: string[];
  active: boolean;
}

export interface AudioRecording {
  blob: Blob;
  duration: number;
  waveformData: number[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  questions: string[];
  category: string;
}

export interface Config {
  theme: 'light' | 'dark' | 'warm';
  language: string;
  autoSave: boolean;
  recordingQuality: 'low' | 'medium' | 'high';
  privacyLevel: number;
  sessionTimeout: number;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  details?: any;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  encrypted: boolean;
  memoriesCount: number;
}

// Tipos para el sistema de cifrado
export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
  autoEncrypt: boolean;
  encryptPrivateMemories: boolean;
  requirePasswordForDecryption: boolean;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  hmac: string;
  timestamp: number;
}

export interface SecuritySettings {
  masterKeySet: boolean;
  autoLockTimeout: number; // minutos
  requirePasswordOnStartup: boolean;
  encryptBackups: boolean;
  encryptionStrength: 'standard' | 'high' | 'maximum';
  biometricUnlock: boolean;
}

export interface EncryptionStatus {
  isUnlocked: boolean;
  hasEncryptedMemories: boolean;
  encryptedCount: number;
  lastUnlockTime?: string;
  sessionTimeout: number;
}
