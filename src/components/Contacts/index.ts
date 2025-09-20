// Archivo de índice para exportar todos los componentes de Contacts
export { ContactToolbar } from './ContactToolbar';
export { ContactList } from './ContactList';
export { ContactModal } from './ContactModal';
export { ContactStats } from './ContactStats';
export { ImportDialog } from './ImportDialog';
export { ImportPreviewDialog } from './ImportPreviewDialog';

// Exportaciones por defecto
export { default as ContactToolbarDefault } from './ContactToolbar';
export { default as ContactListDefault } from './ContactList';
export { default as ContactModalDefault } from './ContactModal';
export { default as ContactStatsDefault } from './ContactStats';
export { default as ImportDialogDefault } from './ImportDialog';
export { default as ImportPreviewDialogDefault } from './ImportPreviewDialog';

// Re-exportar tipos
export type { ContactData, ContactFilters, ContactSortType } from '@/types/contactTypes';