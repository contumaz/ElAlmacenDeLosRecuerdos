# Configuración de Categorías Temáticas

Este directorio contiene la configuración centralizada para las categorías temáticas del sistema de memorias.

## Archivo: `categories.ts`

Contiene la definición de todas las categorías temáticas disponibles en el sistema.

### Estructura de una Categoría

```typescript
interface ThematicCategory {
  key: string;        // Identificador único (usado en URLs y base de datos)
  label: string;      // Nombre mostrado al usuario
  icon: string;       // Emoji o icono para la categoría
  description?: string; // Descripción opcional de la categoría
}
```

## Cómo Agregar una Nueva Categoría

### Paso 1: Agregar la categoría al array

Edita el archivo `categories.ts` y agrega la nueva categoría al array `THEMATIC_CATEGORIES`, manteniendo el orden alfabético:

```typescript
export const THEMATIC_CATEGORIES: ThematicCategory[] = [
  // ... categorías existentes ...
  {
    key: 'nueva-categoria',
    label: 'Nueva Categoría',
    icon: '🆕',
    description: 'Descripción de la nueva categoría'
  },
  // ... más categorías ...
];
```

### Paso 2: Actualizar el mapeo (si es necesario)

Si necesitas compatibilidad con código legacy, agrega la nueva categoría al `CATEGORY_MAPPING`:

```typescript
export const CATEGORY_MAPPING: Record<string, string> = {
  // ... mapeos existentes ...
  'nueva-categoria': 'Nueva Categoría',
};
```

### Paso 3: ¡Listo!

La nueva categoría aparecerá automáticamente en:
- ✅ Navegación lateral (Sidebar)
- ✅ Pestañas de filtrado en la página de Memorias
- ✅ Selector de categoría al crear nuevas memorias
- ✅ Breadcrumbs y títulos de página

## Funciones Utilitarias Disponibles

- `getCategoryByKey(key: string)`: Obtiene una categoría por su clave
- `getCategoryDisplayName(key: string)`: Obtiene el nombre de visualización
- `getCategoryKeys()`: Obtiene todas las claves de categorías
- `isValidCategoryKey(key: string)`: Valida si una clave es válida

## Consideraciones

### Claves de Categoría
- Usa kebab-case (palabras separadas por guiones)
- Evita caracteres especiales
- Mantén consistencia con el patrón existente

### Iconos
- Usa emojis para mejor compatibilidad
- Elige iconos que representen claramente la categoría
- Mantén consistencia visual

### Orden Alfabético
- Siempre mantén las categorías ordenadas alfabéticamente por `label`
- Esto mejora la experiencia del usuario

## Ejemplo Completo

```typescript
// Agregar una nueva categoría "Deportes"
{
  key: 'deportes',
  label: 'Deportes',
  icon: '⚽',
  description: 'Memorias relacionadas con actividades deportivas'
}
```

Esta categoría aparecerá automáticamente como:
- Enlace en sidebar: `/memorias/deportes`
- Pestaña de filtro: "Deportes"
- Opción en selector: "⚽ Deportes"