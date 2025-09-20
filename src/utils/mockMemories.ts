import { Memory } from '../types';

// Memorias de ejemplo para testing de búsqueda avanzada
export const mockMemories: Memory[] = [
  {
    id: 1,
    title: 'Mi primer día de universidad',
    content: 'Recuerdo vívidamente mi primer día en la universidad. Estaba nervioso pero emocionado por comenzar esta nueva etapa de mi vida. El campus era enorme y me perdí varias veces tratando de encontrar mis aulas.',
    type: 'texto',
    metadata: {
      size: 1024,
      format: 'txt',
      date: '2023-09-15'
    },
    privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['universidad', 'educación', 'nervios', 'nuevo comienzo'],
    emotion: {
      primary: 'alegría',
      confidence: 0.92,
      emotions: {
        joy: 0.92,
        sadness: 0.05,
        anger: 0.02,
        fear: 0.03,
        surprise: 0.4,
        love: 0.7,
        nostalgia: 0.3
      }
    },
    createdAt: '2023-09-15T08:00:00Z',
    updatedAt: '2023-09-15T08:00:00Z'
  },
  {
    id: 2,
    title: 'Graduación de mi hermana',
    content: 'La ceremonia de graduación fue muy emotiva. Ver a mi hermana recibir su diploma después de tanto esfuerzo me llenó de orgullo. Toda la familia estaba presente para celebrar este logro.',
    type: 'foto',
    metadata: {
      size: 2048,
      format: 'jpg',
      date: '2023-06-20'
    },
    privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['familia', 'graduación', 'orgullo', 'celebración'],
    emotion: {
      primary: 'orgullo',
      confidence: 0.85,
      emotions: {
        joy: 0.2,
        sadness: 0.3,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.4,
        nostalgia: 0.85
      }
    },
    filePath: '/uploads/images/graduacion_hermana.jpg',
    createdAt: '2023-06-20T15:30:00Z',
    updatedAt: '2023-06-20T15:30:00Z'
  },
  {
    id: 3,
    title: 'Entrevista de trabajo importante',
    content: 'Hoy tuve la entrevista para el trabajo de mis sueños. Preparé durante semanas y creo que fue bien. El entrevistador parecía impresionado con mi experiencia en desarrollo web.',
    type: 'audio',
    privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['trabajo', 'entrevista', 'carrera', 'desarrollo web'],
    emotion: {
      primary: 'esperanza',
      confidence: 0.78,
      emotions: {
        joy: 0.6,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.1,
        surprise: 0.2,
        love: 0.3,
        nostalgia: 0.2
      }
    },
    filePath: '/uploads/audio/entrevista_reflexion.mp3',
    metadata: {
      duration: 180,
      size: 2048000,
      format: 'mp3',
      date: '2023-11-08'
    },
    createdAt: '2023-11-08T17:45:00Z',
    updatedAt: '2023-11-08T17:45:00Z'
  },
  {
    id: 4,
    title: 'Viaje a París con amigos',
    content: 'Increíble viaje a París con mis mejores amigos. Visitamos la Torre Eiffel, el Louvre y caminamos por los Campos Elíseos. La comida francesa es espectacular.',
    type: 'video',
    privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['viaje', 'París', 'amigos', 'turismo', 'Francia'],
    emotion: {
      primary: 'alegría',
      confidence: 0.90,
      emotions: {
        joy: 0.90,
        sadness: 0.05,
        anger: 0.02,
        fear: 0.03,
        surprise: 0.3,
        love: 0.6,
        nostalgia: 0.2
      }
    },
    filePath: '/uploads/videos/paris_trip.mp4',
    metadata: {
      duration: 300,
      size: 15728640,
      format: 'mp4',
      date: '2023-07-12',
      location: 'París, Francia'
    },
    createdAt: '2023-07-12T20:15:00Z',
    updatedAt: '2023-07-12T20:15:00Z'
  },
  {
    id: 5,
    title: 'Muerte de mi abuelo',
    content: 'Hoy falleció mi abuelo. Fue una persona muy importante en mi vida, siempre me contaba historias de su juventud y me enseñó muchos valores. Lo voy a extrañar mucho.',
    type: 'texto',
     privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['familia', 'pérdida', 'abuelo', 'duelo', 'recuerdos'],
    metadata: {
      size: 1024,
      format: 'txt',
      date: '2023-03-22'
    },
    emotion: {
      primary: 'tristeza',
      confidence: 0.75,
      emotions: {
        joy: 0.1,
        sadness: 0.75,
        anger: 0.2,
        fear: 0.3,
        surprise: 0.1,
        love: 0.2,
        nostalgia: 0.6
      }
    },
    createdAt: '2023-03-22T14:20:00Z',
    updatedAt: '2023-03-22T14:20:00Z'
  },
  {
    id: 6,
    title: 'Concierto de mi banda favorita',
    content: 'Por fin pude ver en vivo a mi banda favorita. El concierto fue espectacular, tocaron todas mis canciones preferidas. La energía del público era increíble.',
    type: 'audio',
    privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['música', 'concierto', 'banda', 'entretenimiento', 'rock'],
    emotion: {
      primary: 'euforia',
      confidence: 0.88,
      emotions: {
        joy: 0.88,
        sadness: 0.05,
        anger: 0.02,
        fear: 0.05,
        surprise: 0.7,
        love: 0.6,
        nostalgia: 0.2
      }
    },
    filePath: '/uploads/audio/concierto_grabacion.mp3',
    metadata: {
      duration: 240,
      size: 3072000,
      format: 'mp3',
      date: '2023-10-05'
    },
    createdAt: '2023-10-05T23:30:00Z',
    updatedAt: '2023-10-05T23:30:00Z'
  },
  {
    id: 7,
    title: 'Primer día como desarrollador',
    content: 'Comenzé mi nuevo trabajo como desarrollador frontend. El equipo es muy acogedor y los proyectos son desafiantes. Estoy emocionado por aprender nuevas tecnologías.',
    type: 'texto',
     privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['trabajo', 'desarrollo', 'frontend', 'tecnología', 'nuevo empleo'],
    metadata: {
      size: 1024,
      format: 'txt',
      date: '2023-12-01'
    },
    emotion: {
      primary: 'emoción',
      confidence: 0.70,
      emotions: {
        joy: 0.5,
        sadness: 0.3,
        anger: 0.1,
        fear: 0.2,
        surprise: 0.4,
        love: 0.6,
        nostalgia: 0.5
      }
    },
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2023-12-01T09:00:00Z'
  },
  {
    id: 8,
    title: 'Cumpleaños número 25',
    content: 'Celebré mis 25 años rodeado de familia y amigos. Fue una fiesta pequeña pero muy significativa. Reflexioné sobre todo lo que he logrado hasta ahora.',
    type: 'foto',
     privacyLevel: 1,
    encryptionLevel: 'none',
    tags: ['cumpleaños', 'celebración', 'familia', 'amigos', '25 años'],
    metadata: {
      size: 2048,
      format: 'jpg',
      date: '2023-08-18'
    },
    emotion: {
      primary: 'gratitud',
      confidence: 0.82,
      emotions: {
        joy: 0.7,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.05,
        surprise: 0.2,
        love: 0.8,
        nostalgia: 0.4
      }
    },
    filePath: '/uploads/images/cumple_25.jpg',
    createdAt: '2023-08-18T19:00:00Z',
    updatedAt: '2023-08-18T19:00:00Z'
  }
];

// Función para obtener todas las memorias de ejemplo
export const getAllMockMemories = (): Memory[] => {
  return mockMemories;
};

// Función para obtener tags únicos
export const getUniqueTags = (): string[] => {
  const allTags = mockMemories.flatMap(memory => memory.tags || []);
  return [...new Set(allTags)].sort();
};