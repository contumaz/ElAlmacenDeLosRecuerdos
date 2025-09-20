import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { 
  Contact, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { FileImporter } from '../components/FileImporter';
import { useDuplicateDetection } from '../utils/duplicateDetection';

interface ContactData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  importedAt: string;
  hash: string;
}

export function Agenda() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { getStats } = useDuplicateDetection();

  // Generar hash único para detectar duplicados
  const generateContactHash = (contact: Omit<ContactData, 'id' | 'importedAt' | 'hash'>) => {
    const data = `${contact.name}-${contact.phone}-${contact.email}`.toLowerCase();
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  };

  // Verificar si el contacto ya existe
  const isDuplicate = (newContact: Omit<ContactData, 'id' | 'importedAt' | 'hash'>) => {
    const hash = generateContactHash(newContact);
    return contacts.some(contact => contact.hash === hash);
  };

  const handleImport = (importedContacts: any[], summary: any) => {
    // Agregar contactos importados a la lista existente
    const newContacts = importedContacts.map((contact, index) => ({
      id: crypto.randomUUID(),
      name: contact.name || contact.nombre || 'Sin nombre',
      phone: contact.phone || contact.telefono || contact.teléfono || '',
      email: contact.email || contact.correo || '',
      address: contact.address || contact.direccion || contact.dirección || '',
      notes: contact.notes || contact.notas || '',
      importedAt: new Date().toISOString(),
      hash: generateContactHash({
        name: contact.name || contact.nombre || 'Sin nombre',
        phone: contact.phone || contact.telefono || contact.teléfono || '',
        email: contact.email || contact.correo || '',
        address: contact.address || contact.direccion || contact.dirección || ''
      })
    }));
    
    setContacts(prev => [...prev, ...newContacts]);
    
    // Mostrar resumen de importación
    if (summary.new > 0) {
      toast.success(`${summary.new} contactos importados correctamente`);
    }
    if (summary.duplicates > 0) {
      toast.warning(`${summary.duplicates} contactos duplicados omitidos`);
    }
  };

  // Añadir nuevo contacto
  const handleAddContact = (formData: FormData) => {
    const contactData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      notes: formData.get('notes') as string
    };

    if (isDuplicate(contactData)) {
      toast.error('Este contacto ya existe en tu agenda');
      return;
    }

    const newContact: ContactData = {
      ...contactData,
      id: crypto.randomUUID(),
      importedAt: new Date().toISOString(),
      hash: generateContactHash(contactData)
    };

    setContacts(prev => [...prev, newContact]);
    setShowAddForm(false);
    toast.success('Contacto añadido correctamente');
  };

  // Editar contacto
  const handleEditContact = (formData: FormData) => {
    if (!editingContact) return;

    const updatedContact = {
      ...editingContact,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      notes: formData.get('notes') as string
    };

    setContacts(prev => prev.map(contact => 
      contact.id === editingContact.id ? updatedContact : contact
    ));
    setEditingContact(null);
    toast.success('Contacto actualizado correctamente');
  };

  // Eliminar contacto
  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
    toast.success('Contacto eliminado');
  };

  // Exportar contactos
  const handleExport = () => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-contactos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Agenda exportada correctamente');
  };

  // Filtrar contactos
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout breadcrumbs={[{ label: 'Agenda de Contactos' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center space-x-2">
            <Contact className="w-6 h-6" />
            <span>Agenda de Contactos</span>
          </h1>
          <p className="text-blue-100">
            Importa, gestiona y organiza todos tus contactos en un solo lugar
          </p>
        </div>

        {/* Sección de importación */}
        <Card>
          <CardHeader>
            <CardTitle>Importar Contactos</CardTitle>
            <CardDescription>
              Importa contactos desde archivos JSON o CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileImporter
              acceptedTypes={['.json', '.csv', 'application/json', 'text/csv']}
              onImport={handleImport}
              contentType="contact"
              maxFileSize={10}
              title="Importar Contactos"
              description="Selecciona archivos JSON o CSV con información de contactos"
            />
          </CardContent>
        </Card>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(true)}
            className="h-16 flex flex-col items-center space-y-1"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Contacto</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="h-16 flex flex-col items-center space-y-1"
          >
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-16"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contactos</p>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                </div>
                <Contact className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Con Teléfono</p>
                  <p className="text-2xl font-bold">
                    {contacts.filter(c => c.phone).length}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Con Email</p>
                  <p className="text-2xl font-bold">
                    {contacts.filter(c => c.email).length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de contactos */}
        <Card>
          <CardHeader>
            <CardTitle>Contactos ({filteredContacts.length})</CardTitle>
            <CardDescription>
              {searchTerm ? `Mostrando resultados para "${searchTerm}"` : 'Todos tus contactos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Contact className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {contacts.length === 0 
                    ? 'Aún no tienes contactos. Importa un archivo o añade uno manualmente.'
                    : 'No se encontraron contactos con ese criterio de búsqueda.'
                  }
                </p>
                {contacts.length === 0 && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir primer contacto
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                        <div className="space-y-1 mt-2">
                          {contact.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{contact.address}</span>
                            </div>
                          )}
                          {contact.notes && (
                            <p className="text-sm text-gray-500 mt-2">{contact.notes}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="mt-2">
                          Añadido: {new Date(contact.importedAt).toLocaleDateString('es-ES')}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingContact(contact)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario para añadir/editar contacto */}
        {(showAddForm || editingContact) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  if (editingContact) {
                    handleEditContact(formData);
                  } else {
                    handleAddContact(formData);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingContact?.name || ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={editingContact?.phone || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingContact?.email || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editingContact?.address || ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={editingContact?.notes || ''}
                    placeholder="Información adicional..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingContact ? 'Actualizar' : 'Guardar'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingContact(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Información de ayuda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Información de Importación</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Formatos soportados:</strong> JSON, CSV</p>
              <p><strong>Campos CSV esperados:</strong> name/nombre, phone/telefono, email/correo, address/direccion, notes/notas</p>
              <p><strong>Detección de duplicados:</strong> Se basa en nombre, teléfono y email</p>
              <p><strong>Seguridad:</strong> Todos los datos se almacenan localmente en tu dispositivo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Agenda;