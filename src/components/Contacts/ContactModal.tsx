import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, Star, Edit3, Save, Trash2, Building2, User, Tag, Calendar, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactData, ContactCategory, CONTACT_CATEGORIES_CONFIG } from '@/types/contactTypes';

interface ContactModalProps {
  contact: ContactData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contactId: string, updates: Partial<ContactData>) => void;
  onDelete: (contactId: string) => void;
  onToggleStarred: (contactId: string) => void;
}

export function ContactModal({
  contact,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggleStarred
}: ContactModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<ContactData>>({});

  useEffect(() => {
    if (contact) {
      setEditedContact({
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        jobTitle: contact.jobTitle,
        category: contact.category,
        notes: contact.notes,
        tags: contact.tags
      });
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleSave = () => {
    if (contact) {
      onUpdate(contact.id, editedContact);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (contact && confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      onDelete(contact.id);
      onClose();
    }
  };

  const formatPhoneNumber = (phone: string) => {
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

  const categoryConfig = getCategoryConfig(contact.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {getInitials(contact)}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              {contact.company && (
                <p className="text-gray-600 flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {contact.company}
                </p>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                categoryConfig.color
              }`}>
                {categoryConfig.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStarred(contact.id)}
            >
              <Star className={`w-5 h-5 ${
                contact.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'
              }`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Acciones rápidas */}
          <div className="flex space-x-3">
            <Button
              className="flex-1"
              onClick={() => window.open(`tel:${contact.phoneNumber}`)}
            >
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </Button>
            
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://wa.me/${contact.phoneNumber.replace('+', '')}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información personal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Información Personal
              </h3>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <Input
                      value={editedContact.firstName || ''}
                      onChange={(e) => setEditedContact(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <Input
                      value={editedContact.lastName || ''}
                      onChange={(e) => setEditedContact(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Apellidos"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <Select
                      value={editedContact.category}
                      onValueChange={(value) => setEditedContact(prev => ({ ...prev, category: value as ContactCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_CATEGORIES_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre completo:</span>
                    <p className="font-medium">{contact.fullName}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <p className="font-medium">{formatPhoneNumber(contact.phoneNumber)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">WhatsApp ID:</span>
                    <p className="font-mono text-xs text-gray-500">{contact.whatsappId}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Información profesional */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Información Profesional
              </h3>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <Input
                      value={editedContact.company || ''}
                      onChange={(e) => setEditedContact(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Empresa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <Input
                      value={editedContact.jobTitle || ''}
                      onChange={(e) => setEditedContact(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="Cargo o puesto"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {contact.company ? (
                    <div>
                      <span className="text-gray-600">Empresa:</span>
                      <p className="font-medium">{contact.company}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Sin información de empresa</p>
                  )}
                  
                  {contact.jobTitle && (
                    <div>
                      <span className="text-gray-600">Cargo:</span>
                      <p className="font-medium">{contact.jobTitle}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <Tag className="w-4 h-4 mr-2" />
              Etiquetas
            </h3>
            
            {contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Sin etiquetas</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
            
            {isEditing ? (
              <Textarea
                value={editedContact.notes || ''}
                onChange={(e) => setEditedContact(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Añadir notas sobre este contacto..."
                rows={4}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
                {contact.notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">Sin notas</p>
                )}
              </div>
            )}
          </div>

          {/* Metadatos */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <Calendar className="w-4 h-4 mr-2" />
              Información del sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="text-gray-500">Importado:</span>
                <p>{new Date(contact.dateImported).toLocaleDateString('es-ES')}</p>
              </div>
              
              <div>
                <span className="text-gray-500">ID único:</span>
                <p className="font-mono text-xs">{contact.uniqueId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;