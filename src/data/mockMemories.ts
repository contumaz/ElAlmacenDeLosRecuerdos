import { Memory } from '../types';

/**
 * Función que retorna un array de memorias de ejemplo para testing
 * @returns Array de memorias mock con diferentes tipos
 */
export const getAllMockMemories = (): Memory[] => {
  return [
    {
      id: 1,
      title: 'Mi primer día de universidad',
      content: 'Recuerdo vívidamente mi primer día en la universidad. Estaba nervioso pero emocionado por comenzar esta nueva etapa de mi vida.',
      type: 'texto',
      metadata: {
        date: '2020-09-15',
        location: 'Universidad Central',
        emotion: 'nerviosismo',
        category: 'educación'
      },
      privacyLevel: 1,
      tags: ['universidad', 'primer día', 'educación'],
      createdAt: '2020-09-15T08:00:00Z',
      updatedAt: '2020-09-15T08:00:00Z',
      encryptionLevel: 'none'
    },
    {
      id: 2,
      title: 'Grabación de la boda de mi hermana',
      content: 'Audio de los votos matrimoniales de mi hermana María. Un momento muy emotivo para toda la familia.',
      type: 'audio',
      audioUrl: '/mock-audio/wedding-vows.mp3',
      transcription: 'María, prometo amarte y respetarte todos los días de mi vida...',
      metadata: {
        duration: 180,
        size: 2048000,
        format: 'mp3',
        date: '2021-06-20',
        location: 'Iglesia San José',
        emotion: 'alegría',
        hasTranscription: true,
        category: 'familia'
      },
      privacyLevel: 2,
      tags: ['boda', 'familia', 'María', 'ceremonia'],
      createdAt: '2021-06-20T16:30:00Z',
      updatedAt: '2021-06-20T16:30:00Z',
      encryptionLevel: 'basic'
    },
    {
      id: 3,
      title: 'Foto del cumpleaños de mamá',
      content: 'Fotografía de la celebración del 60º cumpleaños de mamá. Toda la familia reunida en el jardín.',
      type: 'foto',
      imageUrl: '/mock-images/mom-birthday.jpg',
      metadata: {
        size: 1024000,
        format: 'jpg',
        date: '2021-08-12',
        location: 'Casa familiar',
        emotion: 'felicidad',
        category: 'celebración'
      },
      privacyLevel: 1,
      tags: ['cumpleaños', 'mamá', 'familia', 'celebración'],
      createdAt: '2021-08-12T19:00:00Z',
      updatedAt: '2021-08-12T19:00:00Z',
      encryptionLevel: 'none'
    },
    {
      id: 4,
      title: 'Video del primer paso de mi hijo',
      content: 'Video grabado cuando mi hijo dio sus primeros pasos. Un momento inolvidable que queríamos capturar.',
      type: 'video',
      videoUrl: '/mock-videos/first-steps.mp4',
      metadata: {
        duration: 45,
        size: 5120000,
        format: 'mp4',
        date: '2022-03-10',
        location: 'Sala de casa',
        emotion: 'orgullo',
        category: 'hitos'
      },
      privacyLevel: 3,
      tags: ['hijo', 'primeros pasos', 'hito', 'desarrollo'],
      createdAt: '2022-03-10T14:20:00Z',
      updatedAt: '2022-03-10T14:20:00Z',
      encryptionLevel: 'advanced'
    },
    {
      id: 5,
      title: 'Reflexiones sobre el año 2022',
      content: 'Este año ha sido de muchos cambios y aprendizajes. He crecido tanto personal como profesionalmente.',
      type: 'texto',
      metadata: {
        date: '2022-12-31',
        emotion: 'reflexión',
        category: 'personal'
      },
      privacyLevel: 2,
      tags: ['reflexión', '2022', 'crecimiento', 'año nuevo'],
      createdAt: '2022-12-31T23:45:00Z',
      updatedAt: '2022-12-31T23:45:00Z',
      encryptionLevel: 'basic'
    },
    {
      id: 6,
      title: 'Entrevista con el abuelo sobre la guerra',
      content: 'Grabación de audio donde el abuelo cuenta sus experiencias durante la guerra civil.',
      type: 'audio',
      audioUrl: '/mock-audio/grandpa-war-stories.mp3',
      transcription: 'Era el año 1936 cuando todo comenzó. Yo tenía apenas 18 años...',
      metadata: {
        duration: 1200,
        size: 8192000,
        format: 'mp3',
        date: '2020-11-11',
        location: 'Casa del abuelo',
        emotion: 'nostalgia',
        hasTranscription: true,
        category: 'historia familiar'
      },
      privacyLevel: 3,
      tags: ['abuelo', 'guerra civil', 'historia', 'testimonio'],
      createdAt: '2020-11-11T15:00:00Z',
      updatedAt: '2020-11-11T15:00:00Z',
      encryptionLevel: 'advanced'
    },
    {
      id: 7,
      title: 'Foto de la graduación universitaria',
      content: 'Momento de la entrega del diploma de ingeniería. Cuatro años de esfuerzo culminados.',
      type: 'foto',
      imageUrl: '/mock-images/graduation.jpg',
      metadata: {
        size: 2048000,
        format: 'jpg',
        date: '2024-06-15',
        location: 'Auditorio Universidad',
        emotion: 'logro',
        category: 'educación'
      },
      privacyLevel: 1,
      tags: ['graduación', 'universidad', 'logro', 'ingeniería'],
      createdAt: '2024-06-15T11:30:00Z',
      updatedAt: '2024-06-15T11:30:00Z',
      encryptionLevel: 'none'
    },
    {
      id: 8,
      title: 'Video del viaje a París',
      content: 'Compilación de momentos del viaje de luna de miel a París. Torre Eiffel, Louvre, y más.',
      type: 'video',
      videoUrl: '/mock-videos/paris-honeymoon.mp4',
      metadata: {
        duration: 300,
        size: 15360000,
        format: 'mp4',
        date: '2023-05-20',
        location: 'París, Francia',
        emotion: 'romance',
        category: 'viajes'
      },
      privacyLevel: 2,
      tags: ['París', 'luna de miel', 'viaje', 'romance'],
      createdAt: '2023-05-20T18:00:00Z',
      updatedAt: '2023-05-20T18:00:00Z',
      encryptionLevel: 'basic'
    }
  ];
};

// Exportación por defecto para compatibilidad
export default getAllMockMemories;