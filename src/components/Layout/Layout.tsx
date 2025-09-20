import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import { NavigationIndicator } from './NavigationIndicator';

interface LayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Layout({ children, onSearch, breadcrumbs }: LayoutProps) {
  return (
    <div className="h-screen flex bg-amber-50/30 relative">
      {/* Indicador de navegación */}
      <NavigationIndicator />
      
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onSearch={onSearch} />

        {/* Breadcrumbs */}
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

        {/* Contenido */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
