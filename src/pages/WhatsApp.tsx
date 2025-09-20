import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/ui/badge';
import { 
  MessageCircle, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  User,
  Edit3,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { FileImporter } from '../components/FileImporter';
import { useDuplicateDetection } from '../utils/duplicateDetection';

interface WhatsAppMessage {
  id: string;
  chatName: string;
  sender: string;
  message: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'contact' | 'location';
  isGroupChat: boolean;
  isStarred: boolean;
  isArchived: boolean;
  comments: string;
  importedAt: string;
  hash: string;
  contactName?: string;
  personalNotes?: string;
}

interface ChatSummary {
  chatName: string;
  contactName: string;
  personalNotes: string;
  messageCount: number;
  lastMessage: string;
  lastTimestamp: string;
  isStarred: boolean;
  isArchived: boolean;
}

type FilterType = 'all' | 'individual' | 'starred' | 'archived';

export function WhatsApp() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ contactName: '', personalNotes: '' });
  const { getStats } = useDuplicateDetection();

  // Generar hash único para detectar duplicados
  const generateMessageHash = (message: Omit<WhatsAppMessage, 'id' | 'importedAt' | 'hash' | 'comments' | 'isStarred' | 'isArchived'>) => {
    const data = `${message.chatName}-${message.sender}-${message.message}-${message.timestamp}`.toLowerCase();
    
    // Usar TextEncoder para manejar caracteres Unicode correctamente
    try {
      // Convertir a UTF-8 bytes y luego a base64 de forma segura
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    } catch (error) {
      // Fallback: usar un hash simple basado en código de caracteres
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 16);
    }
  };

  // Verificar si el mensaje ya existe
  const isDuplicate = (newMessage: Omit<WhatsAppMessage, 'id' | 'importedAt' | 'hash' | 'comments' | 'isStarred' | 'isArchived'>) => {
    const hash = generateMessageHash(newMessage);
    return messages.some(message => message.hash === hash);
  };

  // Detectar tipo de mensaje
  const detectMessageType = (message: string): WhatsAppMessage['messageType'] => {
    if (message.includes('imagen omitida') || message.includes('image omitted')) return 'image';
    if (message.includes('video omitido') || message.includes('video omitted')) return 'video';
    if (message.includes('audio omitido') || message.includes('audio omitted')) return 'audio';
    if (message.includes('documento omitido') || message.includes('document omitted')) return 'document';
    if (message.includes('contacto omitido') || message.includes('contact omitted')) return 'contact';
    if (message.includes('ubicación omitida') || message.includes('location omitted')) return 'location';
    return 'text';
  };

  // Manejar importación de archivo
  const handleImport = (importedMessages: any[], summary: any, fileName?: string) => {
    // Generar nombre de chat único basado en el archivo
    const chatName = fileName 
      ? fileName.replace(/\.(csv|txt|json)$/i, '').replace(/_/g, ' ')
      : `Chat importado ${new Date().toLocaleDateString()}`;
    
    // Agregar mensajes importados a la lista existente
    const newMessages = importedMessages.map((message, index) => ({
      id: crypto.randomUUID(),
      chatName: chatName, // Usar el mismo nombre para todos los mensajes del archivo
      sender: message.sender || message.from || 'Desconocido',
      message: message.message || message.text || message.content || '',
      timestamp: message.timestamp || message.date || new Date().toISOString(),
      messageType: message.type || detectMessageType(message.message || ''),
      isGroupChat: message.isGroup || message.isGroupChat || false,
      isStarred: false,
      isArchived: false,
      comments: '',
      importedAt: new Date().toISOString(),
      hash: generateMessageHash(message),
      contactName: chatName,
      personalNotes: ''
    }));
    
    setMessages(prev => [...prev, ...newMessages]);
    
    // Mostrar resumen de importación
    if (newMessages.length > 0) {
      toast.success(`Conversación "${chatName}" importada: ${newMessages.length} mensajes`);
    }
    if (summary.duplicates > 0) {
      toast.warning(`${summary.duplicates} mensajes duplicados omitidos`);
    }
  };

  // Obtener chats individuales únicos
  const getIndividualChats = (): ChatSummary[] => {
    const chatMap = new Map<string, ChatSummary>();
    
    // Solo procesar chats individuales
    const individualMessages = messages.filter(m => !m.isGroupChat);
    
    individualMessages.forEach(message => {
      const existing = chatMap.get(message.chatName);
      if (!existing || new Date(message.timestamp) > new Date(existing.lastTimestamp)) {
        chatMap.set(message.chatName, {
          chatName: message.chatName,
          contactName: message.contactName || message.chatName,
          personalNotes: message.personalNotes || '',
          messageCount: individualMessages.filter(m => m.chatName === message.chatName).length,
          lastMessage: message.message,
          lastTimestamp: message.timestamp,
          isStarred: individualMessages.some(m => m.chatName === message.chatName && m.isStarred),
          isArchived: individualMessages.every(m => m.chatName === message.chatName && m.isArchived)
        });
      }
    });
    
    let chats = Array.from(chatMap.values());
    
    // Aplicar filtros
    switch (filterType) {
      case 'starred':
        chats = chats.filter(chat => chat.isStarred);
        break;
      case 'archived':
        chats = chats.filter(chat => chat.isArchived);
        break;
      case 'individual':
      case 'all':
      default:
        // Mostrar todos los chats individuales
        break;
    }
    
    // Aplicar búsqueda
    if (searchTerm) {
      chats = chats.filter(chat =>
        chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.chatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.personalNotes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return chats.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
  };

  const individualChats = getIndividualChats();

  return (
    <Layout breadcrumbs={[{ label: 'WhatsApp' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center space-x-2">
            <MessageCircle className="w-6 h-6" />
            <span>WhatsApp - Gestión de Chats</span>
          </h1>
          <p className="text-green-100">
            Importa y gestiona tus conversaciones individuales de WhatsApp
          </p>
        </div>

        {/* Barra de herramientas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileImporter
            acceptedTypes={['.txt', '.json', '.csv', 'text/plain', 'application/json', 'text/csv']}
            onImport={handleImport}
            contentType="whatsapp"
            maxFileSize={100}
            title="Importar Chat"
            description="Selecciona archivos TXT, JSON o CSV"
          />
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar contactos..."
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
          </div>
        </div>

        {/* Lista de chats individuales */}
        <Card>
          <CardHeader>
            <CardTitle>Chats Individuales ({individualChats.length})</CardTitle>
            <CardDescription>
              {searchTerm ? `Mostrando resultados para "${searchTerm}"` : `Filtro: ${filterType}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {individualChats.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {messages.length === 0 
                    ? 'Aún no tienes chats importados. Exporta un chat desde WhatsApp e impórtalo aquí.'
                    : 'No se encontraron chats individuales con ese criterio de búsqueda o filtro.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {individualChats.map((chat) => (
                  <div 
                    key={chat.chatName} 
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingChat === chat.chatName ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="contactName" className="text-sm font-medium">
                                Nombre del contacto
                              </Label>
                              <Input
                                id="contactName"
                                value={editForm.contactName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, contactName: e.target.value }))}
                                placeholder="Nombre del contacto"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="personalNotes" className="text-sm font-medium">
                                Notas personales
                              </Label>
                              <Textarea
                                id="personalNotes"
                                value={editForm.personalNotes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, personalNotes: e.target.value }))}
                                placeholder="Añade notas sobre este contacto..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Actualizar mensajes con nueva información
                                  setMessages(prev => prev.map(msg => 
                                    msg.chatName === chat.chatName 
                                      ? { ...msg, contactName: editForm.contactName, personalNotes: editForm.personalNotes }
                                      : msg
                                  ));
                                  setEditingChat(null);
                                  toast.success('Información actualizada');
                                }}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingChat(null)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary">
                                <User className="w-3 h-3 mr-1" />
                                {chat.contactName}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {chat.messageCount} mensajes
                              </span>
                              {chat.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                              {chat.isArchived && <Archive className="w-4 h-4 text-gray-500" />}
                            </div>
                            <div className="mb-2">
                              <span className="text-xs text-gray-500">
                                Último mensaje: {new Date(chat.lastTimestamp).toLocaleString('es-ES')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {chat.lastMessage.length > 150 
                                ? `${chat.lastMessage.substring(0, 150)}...` 
                                : chat.lastMessage
                              }
                            </p>
                            {chat.personalNotes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <strong>Notas:</strong> {chat.personalNotes}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditForm({ 
                              contactName: chat.contactName, 
                              personalNotes: chat.personalNotes 
                            });
                            setEditingChat(chat.chatName);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Alternar estado de favorito para todos los mensajes del chat
                            setMessages(prev => prev.map(msg => 
                              msg.chatName === chat.chatName 
                                ? { ...msg, isStarred: !chat.isStarred }
                                : msg
                            ));
                            toast.success(chat.isStarred ? 'Eliminado de favoritos' : 'Añadido a favoritos');
                          }}
                        >
                          <Star className={`w-4 h-4 ${chat.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Alternar estado de archivado para todos los mensajes del chat
                            setMessages(prev => prev.map(msg => 
                              msg.chatName === chat.chatName 
                                ? { ...msg, isArchived: !chat.isArchived }
                                : msg
                            ));
                            toast.success(chat.isArchived ? 'Chat desarchivado' : 'Chat archivado');
                          }}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que quieres eliminar el chat con ${chat.contactName}?`)) {
                              setMessages(prev => prev.filter(msg => msg.chatName !== chat.chatName));
                              toast.success('Chat eliminado');
                            }
                          }}
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
              <p><strong>Formatos soportados:</strong> TXT (exportación de WhatsApp), JSON, CSV</p>
              <p><strong>Cómo exportar desde WhatsApp:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Abre el chat que quieres exportar</li>
                <li>Toca los tres puntos &gt; Más &gt; Exportar chat</li>
                <li>Selecciona "Sin archivos multimedia" para archivos más pequeños</li>
                <li>Guarda el archivo .txt e impórtalo aquí</li>
              </ul>
              <p><strong>Formato CSV:</strong> Para archivos CSV, usa estas columnas:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>fecha</code>: Timestamp Unix (ej: 1705316600.0)</li>
                <li><code>mensaje</code>: Contenido del mensaje</li>
                <li><code>media</code>: Información de archivos multimedia (opcional)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Nota:</strong> También soporta formatos alternativos con columnas como chatName, sender, timestamp, etc.
              </p>
              <p className="mt-2">
                <a 
                  href="/ejemplo-whatsapp.csv" 
                  download="ejemplo-whatsapp.csv"
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  📥 Descargar archivo CSV de ejemplo
                </a>
              </p>
              <p><strong>Gestión de contactos:</strong> Haz clic en el icono de edición para personalizar nombres y añadir notas</p>
              <p><strong>Seguridad:</strong> Todos los datos se almacenan localmente en tu dispositivo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default WhatsApp;