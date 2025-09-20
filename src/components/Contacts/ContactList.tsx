import React from 'react';
import { Phone, Mail, Building2, Star, Check, User, MapPin } from 'lucide-react';
import Button from '@/components/ui/button';
import { ContactData, CONTACT_CATEGORIES_CONFIG } from '@/types/contactTypes';

interface ContactListProps {
  contacts: ContactData[];
  viewMode: 'grid' | 'list';
  isMultiSelectMode: boolean;
  selectedContacts: string[];
  onContactClick: (contact: ContactData) => void;
  onToggleSelect: (contactId: string) => void;
  onToggleStarred: (contactId: string) => void;
}

export function ContactList({
  contacts,
  viewMode,
  isMultiSelectMode,
  selectedContacts,
  onContactClick,
  onToggleSelect,
  onToggleStarred
}: ContactListProps) {
  const formatPhoneNumber = (phone: string) => {
    // Formatear número de teléfono para mejor legibilidad
    if (phone.startsWith('+34')) {
      return phone.replace('+34', '+34 ').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  const getInitials = (contact: ContactData) => {
    const first = contact.firstName.charAt(0).toUpperCase();
    const last = contact.lastName ? contact.lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getCategoryConfig = (category: string) => {
    return CONTACT_CATEGORIES_CONFIG[category as keyof typeof CONTACT_CATEGORIES_CONFIG] || 
           CONTACT_CATEGORIES_CONFIG.other;
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {contacts.map((contact) => {
          const isSelected = selectedContacts.includes(contact.id);
          const categoryConfig = getCategoryConfig(contact.category);
          
          return (
            <div
              key={contact.id}
              className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
              }`}
              onClick={() => {
                if (isMultiSelectMode) {
                  onToggleSelect(contact.id);
                } else {
                  onContactClick(contact);
                }
              }}
            >
              <div className="p-4">
                {/* Header con avatar y selección */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Checkbox de selección */}
                    {isMultiSelectMode && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    )}
                    
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(contact)}
                    </div>
                  </div>
                  
                  {/* Estrella de favorito */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStarred(contact.id);
                    }}
                    className="p-1"
                  >
                    <Star className={`w-4 h-4 ${
                      contact.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'
                    }`} />
                  </Button>
                </div>

                {/* Información del contacto */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    {contact.company && (
                      <p className="text-sm text-gray-600 truncate flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {contact.company}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="flex items-center truncate">
                      <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                      {formatPhoneNumber(contact.phoneNumber)}
                    </p>
                  </div>
                  
                  {/* Categoría */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      categoryConfig.color
                    }`}>
                      {categoryConfig.label}
                    </span>
                    
                    {contact.jobTitle && (
                      <span className="text-xs text-gray-500 truncate max-w-20" title={contact.jobTitle}>
                        {contact.jobTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {contacts.map((contact, index) => {
          const isSelected = selectedContacts.includes(contact.id);
          const categoryConfig = getCategoryConfig(contact.category);
          
          return (
            <div
              key={contact.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => {
                if (isMultiSelectMode) {
                  onToggleSelect(contact.id);
                } else {
                  onContactClick(contact);
                }
              }}
            >
              <div className="flex items-center space-x-4">
                {/* Checkbox de selección */}
                {isMultiSelectMode && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                )}
                
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getInitials(contact)}
                </div>
                
                {/* Información principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        {contact.isStarred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {formatPhoneNumber(contact.phoneNumber)}
                        </span>
                        
                        {contact.company && (
                          <span className="flex items-center truncate">
                            <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{contact.company}</span>
                          </span>
                        )}
                        
                        {contact.jobTitle && (
                          <span className="text-gray-500 truncate">
                            {contact.jobTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Categoría y acciones */}
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        categoryConfig.color
                      }`}>
                        {categoryConfig.label}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStarred(contact.id);
                        }}
                        className="p-1"
                      >
                        <Star className={`w-4 h-4 ${
                          contact.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'
                        }`} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{contact.tags.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContactList;