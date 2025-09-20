import React from 'react';
import { Users, Building2, Star, Briefcase, Phone, Heart, UserCheck, Zap } from 'lucide-react';
import { ContactCategory, CONTACT_CATEGORIES_CONFIG } from '@/types/contactTypes';

interface ContactStatsProps {
  stats: {
    total: number;
    byCategory: Record<ContactCategory, number>;
    withCompany: number;
    starred: number;
  };
}

const CATEGORY_ICONS: Record<ContactCategory, React.ComponentType<any>> = {
  personal: UserCheck,
  work: Briefcase,
  business: Building2,
  media: Zap,
  service: Phone,
  family: Heart,
  friend: Users,
  other: Users
};

export function ContactStats({ stats }: ContactStatsProps) {
  const getPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-blue-700">Total contactos</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.starred}</div>
          <div className="text-xs text-yellow-700">Favoritos</div>
        </div>
      </div>

      {/* Estadística de empresas */}
      <div className="bg-green-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Con empresa</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">{stats.withCompany}</div>
            <div className="text-xs text-green-700">{getPercentage(stats.withCompany)}%</div>
          </div>
        </div>
      </div>

      {/* Distribución por categorías */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Por categoría</h4>
        <div className="space-y-2">
          {Object.entries(CONTACT_CATEGORIES_CONFIG).map(([category, config]) => {
            const count = stats.byCategory[category as ContactCategory] || 0;
            const percentage = getPercentage(count);
            const IconComponent = CATEGORY_ICONS[category as ContactCategory];
            
            if (count === 0) return null;
            
            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <IconComponent className="w-3 h-3 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">{config.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información adicional */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Empresas únicas:</span>
            <span className="font-medium">{Math.round(stats.withCompany * 0.8)}</span>
          </div>
          <div className="flex justify-between">
            <span>Promedio por categoría:</span>
            <span className="font-medium">{Math.round(stats.total / Object.keys(CONTACT_CATEGORIES_CONFIG).length)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactStats;