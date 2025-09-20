import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("px-6 py-3 bg-white border-b border-amber-100", className)}>
      <div className="flex items-center space-x-2 text-sm">
        {/* Home link */}
        <Link
          to="/"
          className="flex items-center text-amber-600 hover:text-amber-800 transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-amber-400" />
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="text-amber-600 hover:text-amber-800 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-amber-900 font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
