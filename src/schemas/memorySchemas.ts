import { z } from 'zod';

// Esquema para análisis emocional
export const emotionAnalysisSchema = z.object({
  primary: z.string().min(1, 'La emoción primaria es requerida'),
  confidence: z.number().min(0).max(1, 'La confianza debe estar entre 0 y 1'),
  emotions: z.object({
    joy: z.number().min(0).max(1),
    sadness: z.number().min(0).max(1),
    anger: z.number().min(0).max(1),
    fear: z.number().min(0).max(1),
    surprise: z.number().min(0).max(1),
    love: z.number().min(0).max(1),
    nostalgia: z.number().min(0).max(1)
  })
});

// Esquema para metadatos de memoria
export const memoryMetadataSchema = z.object({
  duration: z.number().positive().optional(),
  size: z.number().positive().optional(),
  format: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  emotion: z.string().optional(),
  hasTranscription: z.boolean().optional(),
  savedDirectory: z.string().optional()
});

// Esquema base para memoria
export const memorySchema = z.object({
  id: z.number().positive('El ID debe ser un número positivo'),
  title: z.string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  content: z.string()
    .min(1, 'El contenido es requerido')
    .max(50000, 'El contenido no puede exceder 50,000 caracteres'),
  type: z.enum(['texto', 'audio', 'foto', 'video'], {
    message: 'Tipo de memoria inválido'
  }),
  filePath: z.string().optional(),
  audioUrl: z.string().url('URL de audio inválida').optional().or(z.literal('')),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  videoUrl: z.string().url('URL de video inválida').optional().or(z.literal('')),
  metadata: memoryMetadataSchema,
  privacyLevel: z.number()
    .min(1, 'El nivel de privacidad mínimo es 1')
    .max(5, 'El nivel de privacidad máximo es 5'),
  emotion: emotionAnalysisSchema.optional(),
  tags: z.array(z.string().trim().min(1, 'Las etiquetas no pueden estar vacías'))
    .max(20, 'Máximo 20 etiquetas permitidas'),
  createdAt: z.string().datetime('Fecha de creación inválida'),
  updatedAt: z.string().datetime('Fecha de actualización inválida'),
  isEncrypted: z.boolean().optional(),
  encryptionLevel: z.enum(['none', 'basic', 'advanced']).optional(),
  requiresPassword: z.boolean().optional()
});

// Esquema para crear nueva memoria (sin ID)
export const createMemorySchema = memorySchema.omit({ id: true, createdAt: true, updatedAt: true });

// Esquema para actualizar memoria (campos opcionales)
export const updateMemorySchema = memorySchema.partial().required({ id: true });

// Esquema para usuario
export const userSchema = z.object({
  id: z.number().positive(),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['admin', 'albacea', 'familiar']),
  createdAt: z.string().datetime(),
  lastLogin: z.string().datetime().optional(),
  avatar: z.string().url('URL de avatar inválida').optional()
});

// Esquema para configuración
export const configSchema = z.object({
  theme: z.enum(['light', 'dark', 'warm']),
  language: z.string().min(2, 'Código de idioma inválido'),
  autoSave: z.boolean(),
  recordingQuality: z.enum(['low', 'medium', 'high']),
  privacyLevel: z.number().min(1).max(5),
  sessionTimeout: z.number().positive('El timeout de sesión debe ser positivo')
});

// Esquema para datos cifrados
export const encryptedDataSchema = z.object({
  data: z.string().min(1, 'Los datos cifrados son requeridos'),
  iv: z.string().min(1, 'El vector de inicialización es requerido'),
  salt: z.string().min(1, 'El salt es requerido'),
  hmac: z.string().min(1, 'El HMAC es requerido'),
  timestamp: z.number().positive('Timestamp inválido')
});

// Esquema para configuración de cifrado
export const encryptionConfigSchema = z.object({
  algorithm: z.string().min(1, 'El algoritmo es requerido'),
  keySize: z.number().positive('El tamaño de clave debe ser positivo'),
  iterations: z.number().positive('Las iteraciones deben ser positivas'),
  autoEncrypt: z.boolean(),
  encryptPrivateMemories: z.boolean(),
  requirePasswordForDecryption: z.boolean()
});

// Esquema para validación de archivos multimedia
export const mediaFileSchema = z.object({
  name: z.string().min(1, 'El nombre del archivo es requerido'),
  size: z.number().positive('El tamaño del archivo debe ser positivo').max(100 * 1024 * 1024, 'El archivo no puede exceder 100MB'),
  type: z.string().regex(/^(image|audio|video)\//i, 'Tipo de archivo no soportado'),
  lastModified: z.number().positive().optional()
});

// Esquema para validación de entrada de texto
export const textInputSchema = z.string()
  .trim()
  .min(1, 'El texto no puede estar vacío')
  .max(10000, 'El texto no puede exceder 10,000 caracteres')
  .refine(
    (text) => !/[<>"'&]/.test(text),
    'El texto contiene caracteres no permitidos'
  );

// Esquema para validación de etiquetas
export const tagSchema = z.string()
  .trim()
  .min(1, 'La etiqueta no puede estar vacía')
  .max(50, 'La etiqueta no puede exceder 50 caracteres')
  .regex(/^[a-zA-Z0-9\s\-_áéíóúñü]+$/i, 'La etiqueta contiene caracteres no válidos');

// Tipos TypeScript derivados de los esquemas
export type Memory = z.infer<typeof memorySchema>;
export type CreateMemory = z.infer<typeof createMemorySchema>;
export type UpdateMemory = z.infer<typeof updateMemorySchema>;
export type User = z.infer<typeof userSchema>;
export type Config = z.infer<typeof configSchema>;
export type EncryptedData = z.infer<typeof encryptedDataSchema>;
export type EncryptionConfig = z.infer<typeof encryptionConfigSchema>;
export type MediaFile = z.infer<typeof mediaFileSchema>;
export type EmotionAnalysis = z.infer<typeof emotionAnalysisSchema>;
export type MemoryMetadata = z.infer<typeof memoryMetadataSchema>;

// Funciones de validación rápida
export const validateMemory = (data: unknown) => memorySchema.safeParse(data);
export const validateCreateMemory = (data: unknown) => createMemorySchema.safeParse(data);
export const validateUpdateMemory = (data: unknown) => updateMemorySchema.safeParse(data);
export const validateUser = (data: unknown) => userSchema.safeParse(data);
export const validateConfig = (data: unknown) => configSchema.safeParse(data);
export const validateMediaFile = (data: unknown) => mediaFileSchema.safeParse(data);
export const validateTextInput = (data: unknown) => textInputSchema.safeParse(data);
export const validateTag = (data: unknown) => tagSchema.safeParse(data);