import { MemoryData } from './electronAPI';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeMetadata?: boolean;
  includeTags?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  selectedMemories?: number[]; // IDs de memorias específicas
  groupBy?: 'date' | 'type' | 'emotion' | 'none';
}

export interface ExportProgress {
  current: number;
  total: number;
  status: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  message: string;
}

class ExportService {
  private onProgress?: (progress: ExportProgress) => void;

  setProgressCallback(callback: (progress: ExportProgress) => void) {
    this.onProgress = callback;
  }

  private updateProgress(current: number, total: number, status: ExportProgress['status'], message: string) {
    if (this.onProgress) {
      this.onProgress({ current, total, status, message });
    }
  }

  async exportMemories(memories: MemoryData[], options: ExportOptions): Promise<void> {
    try {
      this.updateProgress(0, 100, 'preparing', 'Preparando exportación...');
      
      // Filtrar memorias según opciones
      let filteredMemories = this.filterMemories(memories, options);
      
      this.updateProgress(20, 100, 'processing', 'Procesando memorias...');
      
      // Agrupar si es necesario
      if (options.groupBy && options.groupBy !== 'none') {
        filteredMemories = this.groupMemories(filteredMemories, options.groupBy);
      }
      
      this.updateProgress(40, 100, 'generating', 'Generando archivo...');
      
      // Exportar según formato
      switch (options.format) {
        case 'json':
          await this.exportToJSON(filteredMemories, options);
          break;
        case 'csv':
          await this.exportToCSV(filteredMemories, options);
          break;
        case 'pdf':
          await this.exportToPDF(filteredMemories, options);
          break;
        default:
          throw new Error(`Formato no soportado: ${options.format}`);
      }
      
      this.updateProgress(100, 100, 'complete', 'Exportación completada');
    } catch (error) {
      this.updateProgress(0, 100, 'error', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }

  private filterMemories(memories: MemoryData[], options: ExportOptions): MemoryData[] {
    let filtered = [...memories];

    // Filtrar por IDs específicos
    if (options.selectedMemories && options.selectedMemories.length > 0) {
      filtered = filtered.filter(memory => options.selectedMemories!.includes(memory.id));
    }

    // Filtrar por rango de fechas
    if (options.dateRange) {
      const fromDate = new Date(options.dateRange.from);
      const toDate = new Date(options.dateRange.to);
      
      filtered = filtered.filter(memory => {
        const memoryDate = new Date(memory.date);
        return memoryDate >= fromDate && memoryDate <= toDate;
      });
    }

    return filtered;
  }

  private groupMemories(memories: MemoryData[], groupBy: string): MemoryData[] {
    // Para simplificar, mantenemos el orden pero podríamos agrupar
    switch (groupBy) {
      case 'date':
        return memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'type':
        return memories.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      case 'emotion':
        return memories.sort((a, b) => (a.metadata?.emotion || '').localeCompare(b.metadata?.emotion || ''));
      default:
        return memories;
    }
  }

  private async exportToJSON(memories: MemoryData[], options: ExportOptions): Promise<void> {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalMemories: memories.length,
      options: {
        includeMetadata: options.includeMetadata,
        includeTags: options.includeTags,
        groupBy: options.groupBy
      },
      memories: memories.map(memory => this.sanitizeMemoryForExport(memory, options))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `memorias_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async exportToCSV(memories: MemoryData[], options: ExportOptions): Promise<void> {
    const headers = ['ID', 'Título', 'Contenido', 'Fecha de Creación', 'Última Modificación'];
    
    if (options.includeTags) {
      headers.push('Etiquetas');
    }
    
    if (options.includeMetadata) {
      headers.push('Tipo', 'Emoción', 'Ubicación', 'Descripción');
    }

    const csvRows = [headers.join(',')];
    
    memories.forEach(memory => {
      const row = [
        `"${memory.id}"`,
        `"${this.escapeCsvValue(memory.title)}"`,
        `"${this.escapeCsvValue(memory.content)}"`,
        `"${memory.date}"`,
        `"${memory.date}"`
      ];
      
      if (options.includeTags) {
        row.push(`"${(memory.tags || []).join('; ')}"`);
      }
      
      if (options.includeMetadata) {
        row.push(
          `"${memory.type || ''}"`,
          `"${memory.metadata?.emotion || ''}"`,
          `"${memory.metadata?.location || ''}"`,
          `"${memory.metadata?.location || ''}"`
        );
      }
      
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `memorias_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async exportToPDF(memories: MemoryData[], options: ExportOptions): Promise<void> {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Título del documento
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mis Memorias', margin, yPosition);
    yPosition += lineHeight * 2;

    // Información de exportación
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Exportado el: ${new Date().toLocaleDateString('es-ES')}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Total de memorias: ${memories.length}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Procesar cada memoria
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Título de la memoria
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(memory.title, pageWidth - 2 * margin);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * lineHeight + 5;

      // Fecha
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Creado: ${new Date(memory.date).toLocaleDateString('es-ES')}`, margin, yPosition);
      yPosition += lineHeight + 3;

      // Contenido
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const contentLines = pdf.splitTextToSize(memory.content, pageWidth - 2 * margin);
      
      // Verificar si el contenido cabe en la página actual
      if (yPosition + contentLines.length * lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * lineHeight + 5;

      // Etiquetas (si están incluidas)
      if (options.includeTags && memory.tags && memory.tags.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Etiquetas: ${memory.tags.join(', ')}`, margin, yPosition);
        yPosition += lineHeight + 3;
      }

      // Metadatos (si están incluidos)
      if (options.includeMetadata) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        if (memory.type) {
          pdf.text(`Tipo: ${memory.type}`, margin, yPosition);
          yPosition += lineHeight;
        }
        
        if (memory.metadata?.emotion) {
        pdf.text(`Emoción: ${memory.metadata.emotion}`, margin, yPosition);
          yPosition += lineHeight;
        }
        
        if (memory.metadata?.location) {
        pdf.text(`Ubicación: ${memory.metadata.location}`, margin, yPosition);
          yPosition += lineHeight;
        }
      }

      // Separador entre memorias
      yPosition += lineHeight;
      if (i < memories.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight * 2;
      }

      // Actualizar progreso
      this.updateProgress(
        60 + Math.round((i / memories.length) * 35),
        100,
        'generating',
        `Procesando memoria ${i + 1} de ${memories.length}...`
      );
    }

    // Guardar el PDF
    pdf.save(`memorias_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private sanitizeMemoryForExport(memory: MemoryData, options: ExportOptions): any {
    const sanitized: any = {
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.type,
      tags: memory.tags,
      date: memory.date,
      createdAt: memory.date,
      updatedAt: memory.date
    };

    if (options.includeTags && memory.tags) {
      sanitized.tags = memory.tags;
    }

    // Agregar campos opcionales si existen
    if (memory.metadata?.emotion) {
      (sanitized as any).emotion = memory.metadata.emotion;
    }
    if (memory.metadata?.location) {
      (sanitized as any).location = memory.metadata.location;
    }

    return sanitized;
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    // Escapar comillas dobles duplicándolas
    return value.replace(/"/g, '""');
  }

  // Método para obtener estadísticas de exportación
  getExportStats(memories: MemoryData[]): {
    totalMemories: number;
    dateRange: { from: string; to: string };
    types: { [key: string]: number };
    emotions: { [key: string]: number };
    totalTags: number;
  } {
    const stats = {
      totalMemories: memories.length,
      dateRange: { from: '', to: '' },
      types: {} as { [key: string]: number },
      emotions: {} as { [key: string]: number },
      totalTags: 0
    };

    if (memories.length === 0) return stats;

    // Calcular rango de fechas
    const dates = memories.map(m => new Date(m.date || Date.now())).sort((a, b) => a.getTime() - b.getTime());
    stats.dateRange.from = dates[0].toISOString().split('T')[0];
    stats.dateRange.to = dates[dates.length - 1].toISOString().split('T')[0];

    // Contar tipos y emociones
    const allTags = new Set<string>();
    
    memories.forEach(memory => {
      // Tipos
      if (memory.type) {
        stats.types[memory.type] = (stats.types[memory.type] || 0) + 1;
      }
      
      // Emociones
      if (memory.metadata?.emotion) {
        stats.emotions[memory.metadata.emotion] = (stats.emotions[memory.metadata.emotion] || 0) + 1;
      }
      
      // Etiquetas
      if (memory.tags) {
        memory.tags.forEach(tag => allTags.add(tag));
      }
    });

    stats.totalTags = allTags.size;

    return stats;
  }
}

export const exportService = new ExportService();
export default ExportService;