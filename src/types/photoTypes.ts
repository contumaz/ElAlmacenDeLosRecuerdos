export interface PhotoData {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  dateTaken: string;
  dateImported: string;
  width?: number;
  height?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  tags: string[];
  comments: string;
  isStarred: boolean;
  isArchived: boolean;
  category: 'selfie' | 'landscape' | 'portrait' | 'food' | 'travel' | 'family' | 'pets' | 'events' | 'other';
  base64Data: string;
  hash: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterType = 'all' | 'starred' | 'archived' | 'recent' | 'category';
export type SortType = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc';

export const PHOTO_CATEGORIES = ['selfie', 'landscape', 'portrait', 'food', 'travel', 'family', 'pets', 'events', 'other'] as const;

export interface PhotoImportSummary {
  new: number;
  duplicates: number;
  errors: number;
}

export interface PhotoFilters {
  searchTerm: string;
  filterType: FilterType;
  selectedCategory: PhotoData['category'] | 'all';
  sortType: SortType;
}