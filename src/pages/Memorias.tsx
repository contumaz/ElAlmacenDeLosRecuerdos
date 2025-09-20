import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  MoreVertical,
  SortAsc,
  SortDesc,
  Heart,
} from 'lucide-react';
// AudioPlayer import removido - componente no disponible
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProgressiveList, ProgressiveLoader } from '@/components/ProgressiveLoader';
import { useProgressiveList } from '@/hooks/useProgressiveLoading';
import { Layout } from '@/components/Layout/Layout';
import { useMemories } from '@/hooks/use-memories-hook';
import useAdvancedSearch from '@/hooks/useAdvancedSearch';
import { AdvancedSearchBar, ExportDialog, PreloadOnHover } from '@/components/LazyComponents';
import { usePreloadComponents } from '@/hooks/use-preload-components';
import { MemoryGridSkeleton } from '@/components/ui/SkeletonLoaders';
import { MemoryData as Memory } from '@/services/electronAPI';
import { THEMATIC_CATEGORIES } from '@/config/constants';

import MemoryListItem from '@/components/MemoryListItem';
import VirtualizedMemoryList from '@/components/VirtualizedMemoryList';
import { useSmartMemoization } from '@/hooks/useSmartMemoization';



const getCategoryDisplayName = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

export function Memorias() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const { 
    memories, 
    loading, 
    deleteMemory,
    exportMemories,
    importMemories,
    refreshMemories
  } = useMemories();
  
  const { 
    filters, 
    setFilters, 
    results,
    hasActiveFilters,
    availableTags,
    availableTypes,
    clearSearch
  } = useAdvancedSearch(memories);
  
  // Smart memoization hook para optimizar operaciones costosas
  const { createMemoizedValue, createMemoizedCallback } = useSmartMemoization({
    ttl: 3 * 60 * 1000, // 3 minutos para filtros de memorias
    maxSize: 100,
    enableMetrics: true
  });

  // Preload hooks para componentes pesados
  const { preloadExportDialog, preloadAdvancedSearch } = usePreloadComponents();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Memoización inteligente del filtrado y ordenamiento costoso
  const finalFilteredMemories = createMemoizedValue(
    () => {
      let filtered = results;

      // Filtrado por categoría temática o tipo desde la URL
      if (tipo && tipo !== 'todas') {
        if (THEMATIC_CATEGORIES.includes(tipo)) {
          // Es una categoría temática, filtrar por tags
          filtered = filtered.filter(m => m.tags?.includes(tipo));
        } else if (tipo === 'multimedia') {
          filtered = filtered.filter(m => ['audio', 'video', 'foto'].includes(m.type));
        } else {
          // Asumir que es un tipo de memoria
          filtered = filtered.filter(m => m.type === tipo);
        }
      }

      // Ordenamiento optimizado
      return filtered.sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
        }
        if (sortBy === 'title-asc') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'title-desc') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      });
    },
    [results, tipo, sortBy, results.length],
    { key: `filtered_memories_${tipo}_${sortBy}_${results.length}` }
  );

  // Progressive loading for better UX
  const {
    items: progressiveMemories,
    loadNextPage: loadMore,
    hasMore,
    isLoading: isProgressiveLoading
  } = useProgressiveList(
    async (page: number) => {
      const startIndex = page * (viewMode === 'grid' ? 12 : 20);
      const endIndex = startIndex + (viewMode === 'grid' ? 12 : 20);
      return finalFilteredMemories?.slice(startIndex, endIndex) || [];
    },
    {
      pageSize: viewMode === 'grid' ? 12 : 20
    }
  );

  // Navegación directa sin complicaciones - optimizada con memoización
  const handleVerMemoria = createMemoizedCallback((id: number) => {
    console.log('[Memorias] Navegando a ver memoria:', id);
    navigate(`/memorias/${id}`);
  }, [navigate]);

  const handleEditarMemoria = createMemoizedCallback((id: number) => {
    console.log('[Memorias] Navegando a editar memoria:', id);
    navigate(`/memorias/${id}/editar`);
  }, [navigate]);

  const handleNuevaMemoria = createMemoizedCallback(() => {
    console.log('[Memorias] Navegando a nueva memoria');
    navigate('/memorias/nueva');
  }, [navigate]);

  const handleTabChange = createMemoizedCallback((value: string) => {
    console.log('[Memorias] Cambiando tab:', value);
    const path = `/memorias${value !== 'todas' ? `/${value}` : ''}`;
    navigate(path);
  }, [navigate]);

  const handleDeleteMemory = createMemoizedCallback(async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta memoria?')) {
      await deleteMemory(id);
    }
  }, [deleteMemory]);

  const handleToggleFavorite = createMemoizedCallback(async (memory: any) => {
    // TODO: Implement toggle favorite functionality
    console.log('Toggle favorite for memory:', memory.id);
  }, []);

  const handleExportMemories = createMemoizedCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleImportMemories = createMemoizedCallback(async () => {
    const result = await window.electronAPI.showOpenDialog({
      title: 'Importar Memorias',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const importResult = await importMemories(result.filePaths[0]);
      if (importResult.success) {
        await refreshMemories();
        alert('Memorias importadas con éxito');
      } else {
        alert(`Error al importar: ${importResult.error}`);
      }
    }
  }, [importMemories, refreshMemories]);

  // Grid view renderer with progressive loading
  const renderGridView = () => {
    const memoriesToRender = (finalFilteredMemories?.length || 0) > 20 ? progressiveMemories : finalFilteredMemories || [];
    
    return (
      <ProgressiveList
        items={memoriesToRender}
        renderItem={(memory: any, index: number) => (
          <ProgressiveLoader
            key={memory.id}
            priority={index < 6} // Prioritize first 6 items
            loadingType="skeleton"
            className="h-full"
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleVerMemoria(memory.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {memory.titulo || 'Sin título'}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {memory.tipo || 'general'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {memory.contenido && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {memory.contenido.substring(0, 100)}...
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(memory.fechaCreacion).toLocaleDateString()}</span>
                    {memory.favorito && <Heart className="w-4 h-4 text-red-500 fill-current" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </ProgressiveLoader>
        )}
        loadMore={loadMore}
        hasMore={hasMore}
        isLoading={isProgressiveLoading}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        loadingComponent={<MemoryGridSkeleton count={4} />}
      />
    );
  };

  // List view renderer with advanced virtual scrolling
  const renderListView = () => {
    const memoriesToRender = finalFilteredMemories || [];
    
    return (
      <div className="h-[600px]">
        <VirtualizedMemoryList
          memories={memoriesToRender}
          containerHeight={600}
          onMemorySelect={(memory) => handleVerMemoria(memory.id)}
          onMemoryEdit={(memory) => handleEditarMemoria(memory.id)}
          onMemoryDelete={(memoryId) => handleDeleteMemory(parseInt(memoryId))}
          searchTerm={filters.query}
          filters={{
            tags: filters.tags,
            dateRange: (filters.dateFrom && filters.dateTo) ? {
              start: new Date(filters.dateFrom),
              end: new Date(filters.dateTo)
            } : undefined,
            type: filters.type ? [filters.type] : []
          }}
          showMetrics={process.env.NODE_ENV === 'development'}
          className="w-full"
        />
      </div>
    );
  };

  const breadcrumbs = [
    { label: 'Memorias', href: '/memorias' },
    ...(tipo && tipo !== 'todas' ? [{ label: getCategoryDisplayName(tipo) }] : [])
  ];



  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">
              {tipo ? `Memorias - ${getCategoryDisplayName(tipo)}` : 'Mis Memorias'}
            </h1>
            <p className="text-amber-600">
              Gestiona y explora todos tus recuerdos guardados
            </p>
          </div>
          <Button 
            onClick={handleNuevaMemoria}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Memoria
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <PreloadOnHover preloadFn={preloadExportDialog}>
                <DropdownMenuItem onClick={handleExportMemories}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Datos
                </DropdownMenuItem>
              </PreloadOnHover>
              <DropdownMenuItem onClick={handleImportMemories}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Datos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        <AdvancedSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearSearch}
          availableTags={availableTags}
          availableTypes={availableTypes}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Controles adicionales */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
                    <SelectItem value="date-asc">Fecha (más antiguo)</SelectItem>
                    <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tipo || 'todas'} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full grid-cols-${Math.min(THEMATIC_CATEGORIES.length, 8)} lg:grid-cols-${THEMATIC_CATEGORIES.length} gap-1 h-auto p-1`}>
              {THEMATIC_CATEGORIES.map(category => (
                <TabsTrigger key={category} value={category} className="text-xs px-2 py-1">
                  {getCategoryDisplayName(category)}
                </TabsTrigger>
              ))}
            </TabsList>

          <TabsContent value={tipo || 'todas'} className="mt-6">
            {loading ? (
              <MemoryGridSkeleton count={6} />
            ) : !finalFilteredMemories || !Array.isArray(finalFilteredMemories) || finalFilteredMemories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    No se encontraron memorias
                  </h3>
                  <p className="text-amber-600 mb-4">
                    {'Comienza creando tu primera memoria'}
                  </p>
                  <Button 
                    onClick={handleNuevaMemoria}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Memoria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderListView()
            )}
          </TabsContent>
        </Tabs>
        
        {/* Export Dialog */}
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          memories={finalFilteredMemories}
        />
      </div>
    </Layout>
  );
}



// Add default export for lazy loading compatibility
export default Memorias;
