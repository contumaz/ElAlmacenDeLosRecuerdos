export interface ContactData {
  id: string;
  fullName: string;
  givenName: string;
  phoneNumber: string;
  whatsappId: string;
  uniqueId: string;
  lid: string;
  
  // Campos extraídos y procesados
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  category: ContactCategory;
  tags: string[];
  notes: string;
  
  // Metadatos
  dateImported: string;
  isStarred: boolean;
  isBlocked: boolean;
  lastContact?: string;
}

export type ContactCategory = 
  | 'personal' 
  | 'work' 
  | 'business' 
  | 'media' 
  | 'service' 
  | 'family' 
  | 'friend' 
  | 'other';

export interface ContactFilters {
  searchTerm: string;
  category: ContactCategory | 'all';
  isStarred?: boolean;
  hasCompany?: boolean;
}

export type ContactSortType = 
  | 'name-asc' 
  | 'name-desc' 
  | 'company-asc' 
  | 'company-desc' 
  | 'recent' 
  | 'phone';

export interface ContactImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  color?: string;
  createdAt: string;
}

// Patrones para extraer información de empresa/trabajo del nombre
export const COMPANY_PATTERNS = [
  /\b(Planeta|Atresmedia|A3MEDIA|Antena3|TVE|Telemadrid|La Vanguardia)\b/i,
  /\b(Films?|Media|TV|Radio|Prensa)\b/i,
  /\b(Trabajo|Personal|Empresa)\b/i,
  /\((.*?)\)/g, // Contenido entre paréntesis
];

export const JOB_TITLE_PATTERNS = [
  /\b(Director|Directora|Manager|Jefe|Jefa|Coordinador|Coordinadora)\b/i,
  /\b(Abogad[ao]|Doctor|Doctora|Ingeniero|Ingeniera)\b/i,
  /\b(Periodista|Reportero|Reportera|Editor|Editora)\b/i,
  /\b(Productor|Productora|Realizador|Realizadora)\b/i,
];

export const CONTACT_CATEGORIES_CONFIG = {
  personal: { label: 'Personal', color: 'bg-blue-100 text-blue-800' },
  work: { label: 'Trabajo', color: 'bg-green-100 text-green-800' },
  business: { label: 'Negocio', color: 'bg-purple-100 text-purple-800' },
  media: { label: 'Medios', color: 'bg-red-100 text-red-800' },
  service: { label: 'Servicios', color: 'bg-yellow-100 text-yellow-800' },
  family: { label: 'Familia', color: 'bg-pink-100 text-pink-800' },
  friend: { label: 'Amigos', color: 'bg-indigo-100 text-indigo-800' },
  other: { label: 'Otros', color: 'bg-gray-100 text-gray-800' }
};

export default ContactData;