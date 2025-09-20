// Configuración centralizada de categorías temáticas
// Este archivo permite agregar nuevas categorías fácilmente

export interface ThematicCategory {
  key: string;
  label: string;
  icon: string;
  description?: string;
}

// Lista de categorías temáticas organizadas alfabéticamente
export const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    key: 'canciones',
    label: 'Canciones',
    icon: '🎵',
    description: 'Canciones que marcaron momentos especiales'
  },
  {
    key: 'conciertos',
    label: 'Conciertos',
    icon: '🎤',
    description: 'Experiencias en conciertos y eventos musicales'
  },
  {
    key: 'cuadros',
    label: 'Cuadros',
    icon: '🖼️',
    description: 'Obras de arte y pinturas significativas'
  },
  {
    key: 'esculturas',
    label: 'Esculturas',
    icon: '🗿',
    description: 'Esculturas y arte tridimensional'
  },
  {
    key: 'espectaculos',
    label: 'Espectáculos',
    icon: '🎭',
    description: 'Teatro, danza y otros espectáculos'
  },
  {
    key: 'etapas',
    label: 'Etapas',
    icon: '📅',
    description: 'Diferentes etapas de la vida'
  },
  {
    key: 'fechas',
    label: 'Fechas',
    icon: '📆',
    description: 'Fechas importantes y aniversarios'
  },
  {
    key: 'libros',
    label: 'Libros',
    icon: '📚',
    description: 'Libros que dejaron huella'
  },
  {
    key: 'momentos-unicos',
    label: 'Momentos únicos',
    icon: '✨',
    description: 'Momentos irrepetibles y especiales'
  },
  {
    key: 'peliculas',
    label: 'Películas',
    icon: '🎬',
    description: 'Películas memorables'
  },
  {
    key: 'personas',
    label: 'Personas',
    icon: '👥',
    description: 'Personas importantes en tu vida'
  },
  {
    key: 'poemas',
    label: 'Poemas',
    icon: '📝',
    description: 'Poesía y versos significativos'
  },
  {
    key: 'reflexiones',
    label: 'Reflexiones',
    icon: '💭',
    description: 'Pensamientos y reflexiones personales'
  },
  {
    key: 'viajes',
    label: 'Viajes',
    icon: '✈️',
    description: 'Aventuras y experiencias de viaje'
  }
];

// Función para obtener una categoría por su clave
export const getCategoryByKey = (key: string): ThematicCategory | undefined => {
  return THEMATIC_CATEGORIES.find(category => category.key === key);
};

// Función para obtener el nombre de visualización de una categoría
export const getCategoryDisplayName = (key: string): string => {
  const category = getCategoryByKey(key);
  return category ? category.label : key;
};

// Función para obtener todas las claves de categorías
export const getCategoryKeys = (): string[] => {
  return THEMATIC_CATEGORIES.map(category => category.key);
};

// Función para validar si una clave de categoría es válida
export const isValidCategoryKey = (key: string): boolean => {
  return THEMATIC_CATEGORIES.some(category => category.key === key);
};

// Mapeo de categorías para compatibilidad con el código existente
export const CATEGORY_MAPPING: Record<string, string> = {
  'canciones': 'Canciones',
  'conciertos': 'Conciertos',
  'cuadros': 'Cuadros',
  'esculturas': 'Esculturas',
  'espectaculos': 'Espectáculos',
  'etapas': 'Etapas',
  'fechas': 'Fechas',
  'libros': 'Libros',
  'momentos-unicos': 'Momentos únicos',
  'peliculas': 'Películas',
  'personas': 'Personas',
  'poemas': 'Poemas',
  'reflexiones': 'Reflexiones',
  'viajes': 'Viajes'
};