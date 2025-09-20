import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { 
  Mail, 
  Upload, 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Paperclip,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { FileImporter } from '../components/FileImporter';
import { useDuplicateDetection } from '../utils/duplicateDetection';

interface EmailData {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  annotations: string;
  importedAt: string;
  hash: string;
  folder: string;
}

type FilterType = 'all' | 'unread' | 'starred' | 'archived' | 'attachments';

export function Correo() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [showAnnotationForm, setShowAnnotationForm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getStats } = useDuplicateDetection();

  // Generar hash único para detectar duplicados
  const generateEmailHash = (email: Omit<EmailData, 'id' | 'importedAt' | 'hash' | 'annotations' | 'isRead' | 'isStarred' | 'isArchived'>) => {
    const data = `${email.from}-${email.subject}-${email.date}`.toLowerCase();
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  };

  // Verificar si el email ya existe
  const isDuplicate = (newEmail: Omit<EmailData, 'id' | 'importedAt' | 'hash' | 'annotations' | 'isRead' | 'isStarred' | 'isArchived'>) => {
    const hash = generateEmailHash(newEmail);
    return emails.some(email => email.hash === hash);
  };

  const handleImport = (importedEmails: any[], summary: any) => {
    // Agregar emails importados a la lista existente
    const newEmails = importedEmails.map((email, index) => ({
      id: crypto.randomUUID(),
      from: email.from || email.sender || 'Desconocido',
      to: email.to || email.recipient || '',
      subject: email.subject || email.title || 'Sin asunto',
      body: email.body || email.content || email.message || '',
      date: email.date || email.timestamp || new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isArchived: false,
      hasAttachments: email.hasAttachments || email.attachments?.length > 0 || false,
      annotations: '',
      importedAt: new Date().toISOString(),
      hash: generateEmailHash(email),
      folder: email.folder || email.label || 'Inbox'
    }));
    
    setEmails(prev => [...prev, ...newEmails]);
    
    // Mostrar resumen de importación
    if (summary.new > 0) {
      toast.success(`${summary.new} emails importados correctamente`);
    }
    if (summary.duplicates > 0) {
      toast.warning(`${summary.duplicates} emails duplicados omitidos`);
    }
  };

  // Marcar como leído/no leído
  const toggleReadStatus = (id: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, isRead: !email.isRead } : email
    ));
  };

  // Marcar como favorito
  const toggleStarred = (id: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  // Archivar email
  const toggleArchived = (id: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, isArchived: !email.isArchived } : email
    ));
  };

  // Eliminar email
  const deleteEmail = (id: string) => {
    setEmails(prev => prev.filter(email => email.id !== id));
    toast.success('Email eliminado');
  };

  // Añadir anotación
  const handleAddAnnotation = (id: string, annotation: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, annotations: annotation } : email
    ));
    setShowAnnotationForm(null);
    toast.success('Anotación guardada');
  };

  // Exportar emails
  const handleExport = () => {
    const dataStr = JSON.stringify(emails, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `correos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Correos exportados correctamente');
  };

  // Filtrar emails
  const getFilteredEmails = () => {
    let filtered = emails;

    // Aplicar filtro de tipo
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(email => !email.isRead);
        break;
      case 'starred':
        filtered = filtered.filter(email => email.isStarred);
        break;
      case 'archived':
        filtered = filtered.filter(email => email.isArchived);
        break;
      case 'attachments':
        filtered = filtered.filter(email => email.hasAttachments);
        break;
    }

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredEmails = getFilteredEmails();

  return (
    <Layout breadcrumbs={[{ label: 'Correo Electrónico' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center space-x-2">
            <Mail className="w-6 h-6" />
            <span>Correo Electrónico</span>
          </h1>
          <p className="text-green-100">
            Importa, organiza y anota tus correos electrónicos desde backups
          </p>
        </div>

        {/* Sección de importación */}
        <Card>
          <CardHeader>
            <CardTitle>Importar Correos Electrónicos</CardTitle>
            <CardDescription>
              Importa tus correos desde archivos de backup de diferentes servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileImporter
              acceptedTypes={['.json', '.csv', '.mbox', '.eml', 'application/json', 'text/csv', 'application/mbox', 'message/rfc822']}
              onImport={handleImport}
              contentType="email"
              maxFileSize={50}
              title="Importar Correos Electrónicos"
              description="Selecciona archivos JSON, CSV, MBOX o EML con tus correos electrónicos"
            />
          </CardContent>
        </Card>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={emails.length === 0}
            className="h-16 flex flex-col items-center space-y-1"
          >
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-16"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Todos
            </Button>
            <Button
              variant={filterType === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('unread')}
            >
              No leídos
            </Button>
          </div>
        </div>

        {/* Filtros adicionales */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === 'starred' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('starred')}
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritos
          </Button>
          <Button
            variant={filterType === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('archived')}
          >
            <Archive className="w-4 h-4 mr-1" />
            Archivados
          </Button>
          <Button
            variant={filterType === 'attachments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('attachments')}
          >
            <Paperclip className="w-4 h-4 mr-1" />
            Con adjuntos
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Emails</p>
                  <p className="text-2xl font-bold">{emails.length}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">No Leídos</p>
                  <p className="text-2xl font-bold">
                    {emails.filter(e => !e.isRead).length}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Favoritos</p>
                  <p className="text-2xl font-bold">
                    {emails.filter(e => e.isStarred).length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Con Adjuntos</p>
                  <p className="text-2xl font-bold">
                    {emails.filter(e => e.hasAttachments).length}
                  </p>
                </div>
                <Paperclip className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de emails */}
        <Card>
          <CardHeader>
            <CardTitle>Emails ({filteredEmails.length})</CardTitle>
            <CardDescription>
              {searchTerm ? `Mostrando resultados para "${searchTerm}"` : `Filtro: ${filterType}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {emails.length === 0 
                    ? 'Aún no tienes emails importados. Importa un backup de tu servicio de correo.'
                    : 'No se encontraron emails con ese criterio de búsqueda o filtro.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmails.map((email) => (
                  <div 
                    key={email.id} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                      !email.isRead ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{email.from}</span>
                          {email.hasAttachments && <Paperclip className="w-4 h-4 text-gray-400" />}
                          {!email.isRead && <Badge variant="secondary">Nuevo</Badge>}
                          {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {email.isArchived && <Archive className="w-4 h-4 text-gray-500" />}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{email.subject}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {email.body.substring(0, 150)}{email.body.length > 150 ? '...' : ''}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(email.date).toLocaleDateString('es-ES')}</span>
                          </div>
                          <Badge variant="outline">{email.folder}</Badge>
                          {email.annotations && (
                            <Badge variant="secondary">Con anotaciones</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReadStatus(email.id);
                          }}
                        >
                          {email.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarred(email.id);
                          }}
                        >
                          <Star className={`w-4 h-4 ${email.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchived(email.id);
                          }}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEmail(email.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Detalles expandidos */}
                    {selectedEmail?.id === email.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Para:</Label>
                            <p className="text-sm text-gray-600">{email.to || 'No especificado'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Contenido completo:</Label>
                            <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                              {email.body || 'Sin contenido'}
                            </div>
                          </div>
                          {email.annotations && (
                            <div>
                              <Label className="text-sm font-medium">Anotaciones:</Label>
                              <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                {email.annotations}
                              </p>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAnnotationForm(email.id)}
                            >
                              {email.annotations ? 'Editar anotación' : 'Añadir anotación'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de anotación */}
        {showAnnotationForm && (
          <Card>
            <CardHeader>
              <CardTitle>Añadir Anotación</CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const annotation = formData.get('annotation') as string;
                  handleAddAnnotation(showAnnotationForm, annotation);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="annotation">Anotación</Label>
                  <Textarea
                    id="annotation"
                    name="annotation"
                    placeholder="Escribe tu anotación sobre este email..."
                    defaultValue={emails.find(e => e.id === showAnnotationForm)?.annotations || ''}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAnnotationForm(null)}
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
              <p><strong>Formatos soportados:</strong> JSON, CSV, MBOX, EML</p>
              <p><strong>Servicios compatibles:</strong> Gmail, Outlook, Thunderbird, Apple Mail</p>
              <p><strong>Campos CSV esperados:</strong> from/de, to/para, subject/asunto, body/contenido, date/fecha</p>
              <p><strong>Detección de duplicados:</strong> Se basa en remitente, asunto y fecha</p>
              <p><strong>Funciones:</strong> Marcar como leído, favoritos, archivar, anotar</p>
              <p><strong>Seguridad:</strong> Todos los datos se almacenan localmente en tu dispositivo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Correo;