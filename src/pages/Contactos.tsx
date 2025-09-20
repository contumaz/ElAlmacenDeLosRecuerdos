import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useContacts } from '@/hooks/useContacts';
import { ContactData, ContactFilters, ContactSortType, CONTACT_CATEGORIES_CONFIG } from '@/types/contactTypes';
import {
  ContactToolbar,
  ContactList,
  ContactModal,
  ContactStats,
  ImportDialog,
  ImportPreviewDialog
} from '@/components/Contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Upload, Search, Filter, Star, Building2 } from 'lucide-react';
import { Layout } from '@/components/Layout';

export function Contactos() {
  const {
    contacts,
    groups,
    selectedContacts,
    isMultiSelectMode,
    stats,
    parseCSV,
    importContactsFromCSV,
    importContactsWithMapping,
    searchContacts,
    updateContact,
    deleteContact,
    toggleStarred,
    toggleMultiSelectMode,
    toggleContactSelection,
    selectAllContacts,
    deselectAllContacts,
    createGroup
  } = useContacts();

  // Estados locales
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<string[][]>([]);
  const [filters, setFilters] = useState<ContactFilters>({
    searchTerm: '',
    category: 'all'
  });
  const [sortBy, setSortBy] = useState<ContactSortType>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener contactos filtrados
  const filteredContacts = searchContacts(filters, sortBy);

  // Manejar importación de archivo
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    try {
        const content = await file.text();
        const csvData = parseCSV(content);
        
        // Mostrar vista previa para mapeo de campos
        setImportPreviewData(csvData);
        setIsImportPreviewOpen(true);
      
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error('Error al procesar el archivo CSV');
    }

    // Limpiar input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Manejar confirmación de importación
  const handleImportConfirm = async (mapping: any) => {
    try {
      const summary = await importContactsWithMapping(importPreviewData, mapping);
      setIsImportPreviewOpen(false);
      setImportPreviewData([]);
      
      // Mostrar resumen de importación
      setIsImportDialogOpen(true);
      
    } catch (error) {
      console.error('Error al importar contactos:', error);
      toast.error('Error al importar los contactos');
    }
  };

  // Manejar búsqueda
  const handleSearchChange = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  // Manejar filtros
  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Manejar acciones en lote
  const handleBulkAction = (action: string) => {
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    
    switch (action) {
      case 'star':
        selectedContacts.forEach(id => toggleStarred(id));
        toast.success(`${selectedContacts.length} contactos marcados como favoritos`);
        break;
      case 'delete':
        if (confirm(`¿Eliminar ${selectedContacts.length} contactos seleccionados?`)) {
          selectedContacts.forEach(id => deleteContact(id));
          deselectAllContacts();
        }
        break;
      case 'group':
        const groupName = prompt('Nombre del nuevo grupo:');
        if (groupName) {
          createGroup(groupName, undefined, selectedContacts);
          deselectAllContacts();
        }
        break;
    }
  };

  return (
    <>
      <Layout>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar con estadísticas y filtros */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header del sidebar */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-600" />
                Agenda de Contactos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} contactos • {groups.length} grupos
              </p>
            </div>

            {/* Estadísticas */}
            <div className="p-6 border-b border-gray-200">
              <ContactStats stats={stats} />
            </div>

            {/* Filtros rápidos */}
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Filtros rápidos</h3>
              
              {/* Filtro por categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas las categorías</option>
                  {Object.entries(CONTACT_CATEGORIES_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtros adicionales */}
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange('isStarred', 
                    filters.isStarred === true ? undefined : true
                  )}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    filters.isStarred === true 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Solo favoritos ({stats.starred})
                </button>
                
                <button
                  onClick={() => handleFilterChange('hasCompany', 
                    filters.hasCompany === true ? undefined : true
                  )}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    filters.hasCompany === true 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Con empresa ({stats.withCompany})
                </button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header principal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Agenda de Contactos</h1>
                  <p className="text-blue-100 mt-1">
                    {filteredContacts.length} contactos mostrados
                    {filters.searchTerm && ` • Búsqueda: "${filters.searchTerm}"`}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Barra de herramientas */}
            <div className="bg-white border-b border-gray-200 p-4">
              <ContactToolbar
                searchTerm={filters.searchTerm}
                onSearchChange={handleSearchChange}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isMultiSelectMode={isMultiSelectMode}
                onToggleMultiSelect={toggleMultiSelectMode}
                selectedCount={selectedContacts.length}
                totalCount={filteredContacts.length}
                onSelectAll={() => selectAllContacts(filteredContacts.map(c => c.id))}
                onDeselectAll={deselectAllContacts}
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Lista de contactos */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  {contacts.length === 0 ? (
                    <div>
                      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay contactos
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Importa tu primer archivo CSV para comenzar
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Importar Contactos
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron contactos
                      </h3>
                      <p className="text-gray-600">
                        Intenta ajustar los filtros de búsqueda
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ContactList
                  contacts={filteredContacts}
                  viewMode={viewMode}
                  isMultiSelectMode={isMultiSelectMode}
                  selectedContacts={selectedContacts}
                  onContactClick={setSelectedContact}
                  onToggleSelect={toggleContactSelection}
                  onToggleStarred={toggleStarred}
                />
              )}
            </div>
          </div>
        </div>
      </Layout>

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Modal de contacto */}
      <ContactModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdate={updateContact}
        onDelete={deleteContact}
        onToggleStarred={toggleStarred}
      />

      {/* Diálogo de vista previa de importación */}
       <ImportPreviewDialog
         isOpen={isImportPreviewOpen}
         onClose={() => {
           setIsImportPreviewOpen(false);
           setImportPreviewData([]);
         }}
         csvData={importPreviewData}
         onConfirmImport={handleImportConfirm}
       />

      {/* Diálogo de importación */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />
    </>
  );
}

export default Contactos;