import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  ContactData, 
  ContactCategory, 
  ContactFilters, 
  ContactSortType, 
  ContactImportSummary,
  ContactGroup,
  COMPANY_PATTERNS,
  JOB_TITLE_PATTERNS
} from '@/types/contactTypes';

export function useContacts() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Función para procesar y extraer información del nombre completo
  const processContactName = useCallback((fullName: string, givenName: string) => {
    let firstName = givenName || '';
    let lastName = '';
    let company = '';
    let jobTitle = '';
    let category: ContactCategory = 'other';
    const tags: string[] = [];

    // Limpiar el nombre completo
    let cleanName = fullName.trim();
    
    // Extraer información entre paréntesis (a menudo contiene empresa o descripción)
    const parenthesesMatches = cleanName.match(/\(([^)]+)\)/g);
    if (parenthesesMatches) {
      parenthesesMatches.forEach(match => {
        const content = match.replace(/[()]/g, '').trim();
        if (content.length > 0) {
          // Si parece ser una empresa o trabajo
          if (content.toLowerCase().includes('trabajo') || 
              content.toLowerCase().includes('empresa') ||
              content.toLowerCase().includes('personal')) {
            tags.push(content);
          } else {
            company = content;
          }
        }
      });
      // Remover paréntesis del nombre
      cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
    }

    // Detectar empresas conocidas en el nombre
    COMPANY_PATTERNS.forEach(pattern => {
      const matches = cleanName.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!company && match.length > 2) {
            company = match;
          }
        });
      }
    });

    // Detectar títulos profesionales
    JOB_TITLE_PATTERNS.forEach(pattern => {
      const matches = cleanName.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!jobTitle && match.length > 3) {
            jobTitle = match;
          }
        });
      }
    });

    // Determinar categoría basada en el contenido
    const lowerName = cleanName.toLowerCase();
    if (company || lowerName.includes('trabajo') || lowerName.includes('empresa')) {
      category = 'work';
    } else if (lowerName.includes('personal') || lowerName.includes('familia')) {
      category = 'personal';
    } else if (lowerName.includes('tv') || lowerName.includes('media') || 
               lowerName.includes('periodista') || lowerName.includes('radio')) {
      category = 'media';
    } else if (lowerName.includes('doctor') || lowerName.includes('abogad') ||
               lowerName.includes('servicio') || lowerName.includes('reparacion')) {
      category = 'service';
    }

    // Extraer nombre y apellido si no tenemos givenName
    if (!firstName) {
      const nameParts = cleanName.split(' ').filter(part => 
        part.length > 0 && 
        !COMPANY_PATTERNS.some(pattern => pattern.test(part)) &&
        !JOB_TITLE_PATTERNS.some(pattern => pattern.test(part))
      );
      
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        if (nameParts.length > 1) {
          lastName = nameParts.slice(1).join(' ');
        }
      }
    }

    return {
      firstName: firstName || 'Sin nombre',
      lastName,
      company,
      jobTitle,
      category,
      tags
    };
  }, []);

  // Función para parsear CSV y devolver datos estructurados
  const parseCSV = useCallback((csvContent: string): string[][] => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const data: string[][] = [];
    
    for (const line of lines) {
      // Parseo simple de CSV - puede mejorarse para casos más complejos
      const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
      data.push(values);
    }
    
    return data;
  }, []);

  // Función para importar contactos con mapeo de columnas personalizado
  const importContactsWithMapping = useCallback(async (
    csvData: string[][],
    columnMappings: Array<{
      originalName: string;
      displayName: string;
      targetField: keyof ContactData | 'ignore';
      isEnabled: boolean;
      order: number;
    }>
  ): Promise<ContactImportSummary> => {
    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const newContacts: ContactData[] = [];
    const existingPhones = new Set(contacts.map(c => c.phoneNumber));
    
    // Crear mapeo de índices de columnas
    const fieldMapping: Record<string, number> = {};
    columnMappings.forEach((mapping, index) => {
      if (mapping.isEnabled && mapping.targetField !== 'ignore') {
        fieldMapping[mapping.targetField] = index;
      }
    });

    // Procesar filas de datos (omitir header)
    for (let i = 1; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue; // Saltar filas vacías
        }

        // Extraer datos según el mapeo
        const fullName = row[fieldMapping.fullName] || '';
        const givenName = row[fieldMapping.givenName] || '';
        const phoneNumber = row[fieldMapping.phoneNumber] || '';
        const whatsappId = row[fieldMapping.whatsappId] || '';
        const uniqueId = row[fieldMapping.uniqueId] || '';
        const lid = row[fieldMapping.lid] || '';
        const company = row[fieldMapping.company] || '';
        const jobTitle = row[fieldMapping.jobTitle] || '';
        const notes = row[fieldMapping.notes] || '';
        
        // Validar campos requeridos
        if (!fullName && !givenName) {
          errors++;
          errorDetails.push(`Fila ${i + 1}: Falta nombre`);
          continue;
        }
        
        if (!phoneNumber) {
          errors++;
          errorDetails.push(`Fila ${i + 1}: Falta número de teléfono`);
          continue;
        }
        
        // Verificar duplicados por teléfono
        if (existingPhones.has(phoneNumber)) {
          duplicates++;
          continue;
        }

        // Procesar información del contacto
        const processedInfo = processContactName(fullName || givenName, givenName);
        
        const contact: ContactData = {
          id: crypto.randomUUID(),
          fullName: (fullName || givenName).trim(),
          givenName: givenName.trim(),
          phoneNumber: phoneNumber.trim(),
          whatsappId: whatsappId.trim(),
          uniqueId: uniqueId.trim(),
          lid: lid.trim(),
          ...processedInfo,
          // Sobrescribir con datos del mapeo si están disponibles
          company: company.trim() || processedInfo.company,
          jobTitle: jobTitle.trim() || processedInfo.jobTitle,
          notes: notes.trim(),
          dateImported: new Date().toISOString(),
          isStarred: false,
          isBlocked: false
        };

        newContacts.push(contact);
        existingPhones.add(phoneNumber);
        imported++;
        
      } catch (error) {
        errors++;
        errorDetails.push(`Fila ${i + 1}: Error de procesamiento - ${error}`);
      }
    }

    // Añadir nuevos contactos
    setContacts(prev => [...prev, ...newContacts]);
    
    const summary: ContactImportSummary = {
      total: csvData.length - 1,
      imported,
      duplicates,
      errors,
      errorDetails
    };

    // Mostrar notificación
    if (imported > 0) {
      toast.success(`${imported} contactos importados correctamente`);
    }
    if (duplicates > 0) {
      toast.warning(`${duplicates} contactos duplicados omitidos`);
    }
    if (errors > 0) {
      toast.error(`${errors} errores durante la importación`);
    }

    return summary;
  }, [contacts, processContactName]);

  // Función legacy para compatibilidad
  const importContactsFromCSV = useCallback(async (csvContent: string): Promise<ContactImportSummary> => {
    const csvData = parseCSV(csvContent);
    
    if (csvData.length === 0) {
      return {
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 1,
        errorDetails: ['Archivo CSV vacío o inválido']
      };
    }
    
    // Mapeo automático para compatibilidad
    const headers = csvData[0];
    const autoMappings = headers.map((header, index) => {
      let targetField: keyof ContactData | 'ignore' = 'ignore';
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('fullname') || lowerHeader.includes('zfullname')) {
        targetField = 'fullName';
      } else if (lowerHeader.includes('givenname') || lowerHeader.includes('zgivenname')) {
        targetField = 'givenName';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('zphonenumber')) {
        targetField = 'phoneNumber';
      } else if (lowerHeader.includes('whatsapp') || lowerHeader.includes('zwhatsappid')) {
        targetField = 'whatsappId';
      } else if (lowerHeader.includes('uniqueid') || lowerHeader.includes('zuniqueid')) {
        targetField = 'uniqueId';
      } else if (lowerHeader.includes('lid') || lowerHeader.includes('zlid')) {
        targetField = 'lid';
      }
      
      return {
        originalName: header,
        displayName: header,
        targetField,
        isEnabled: targetField !== 'ignore',
        order: index
      };
    });
    
    return importContactsWithMapping(csvData, autoMappings);
  }, [parseCSV, importContactsWithMapping]);

  // Función de búsqueda avanzada
  const searchContacts = useCallback((filters: ContactFilters, sortBy: ContactSortType = 'name-asc') => {
    let filtered = contacts;

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.fullName.toLowerCase().includes(searchLower) ||
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.phoneNumber.includes(searchLower) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
        (contact.jobTitle && contact.jobTitle.toLowerCase().includes(searchLower)) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        contact.notes.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoría
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(contact => contact.category === filters.category);
    }

    // Filtro por favoritos
    if (filters.isStarred !== undefined) {
      filtered = filtered.filter(contact => contact.isStarred === filters.isStarred);
    }

    // Filtro por empresa
    if (filters.hasCompany !== undefined) {
      filtered = filtered.filter(contact => 
        filters.hasCompany ? !!contact.company : !contact.company
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.fullName.localeCompare(b.fullName);
        case 'name-desc':
          return b.fullName.localeCompare(a.fullName);
        case 'company-asc':
          return (a.company || '').localeCompare(b.company || '');
        case 'company-desc':
          return (b.company || '').localeCompare(a.company || '');
        case 'recent':
          return new Date(b.dateImported).getTime() - new Date(a.dateImported).getTime();
        case 'phone':
          return a.phoneNumber.localeCompare(b.phoneNumber);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contacts]);

  // Funciones de gestión de contactos
  const updateContact = useCallback((contactId: string, updates: Partial<ContactData>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    ));
    toast.success('Contacto actualizado');
  }, []);

  const deleteContact = useCallback((contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    toast.success('Contacto eliminado');
  }, []);

  const toggleStarred = useCallback((contactId: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, isStarred: !contact.isStarred }
        : contact
    ));
  }, []);

  // Funciones de selección múltiple
  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    if (isMultiSelectMode) {
      setSelectedContacts([]);
    }
  }, [isMultiSelectMode]);

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const selectAllContacts = useCallback((contactIds: string[]) => {
    setSelectedContacts(contactIds);
  }, []);

  const deselectAllContacts = useCallback(() => {
    setSelectedContacts([]);
  }, []);

  // Funciones de grupos
  const createGroup = useCallback((name: string, description?: string, contactIds: string[] = []) => {
    const newGroup: ContactGroup = {
      id: crypto.randomUUID(),
      name,
      description,
      contactIds,
      createdAt: new Date().toISOString()
    };
    setGroups(prev => [...prev, newGroup]);
    toast.success(`Grupo "${name}" creado`);
    return newGroup;
  }, []);

  // Estadísticas
  const stats = useMemo(() => {
    const byCategory = contacts.reduce((acc, contact) => {
      acc[contact.category] = (acc[contact.category] || 0) + 1;
      return acc;
    }, {} as Record<ContactCategory, number>);

    const withCompany = contacts.filter(c => c.company).length;
    const starred = contacts.filter(c => c.isStarred).length;

    return {
      total: contacts.length,
      byCategory,
      withCompany,
      starred
    };
  }, [contacts]);

  return {
    // Estado
    contacts,
    groups,
    selectedContacts,
    isMultiSelectMode,
    stats,
    
    // Funciones principales
    parseCSV,
    importContactsFromCSV,
    importContactsWithMapping,
    searchContacts,
    updateContact,
    deleteContact,
    toggleStarred,
    
    // Selección múltiple
    toggleMultiSelectMode,
    toggleContactSelection,
    selectAllContacts,
    deselectAllContacts,
    
    // Grupos
    createGroup
  };
}

export default useContacts;