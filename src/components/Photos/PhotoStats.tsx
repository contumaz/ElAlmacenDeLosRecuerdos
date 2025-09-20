import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Star, Archive, Tag } from 'lucide-react';
import { PhotoData } from '@/types/photoTypes';

interface PhotoStatsProps {
  photos: PhotoData[];
}

// Formatear tamaño de archivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function PhotoStats({ photos }: PhotoStatsProps) {
  const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
  const starredCount = photos.filter(p => p.isStarred).length;
  const categoriesCount = new Set(photos.map(p => p.category)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fotos</p>
              <p className="text-2xl font-bold">{photos.length}</p>
            </div>
            <Camera className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Favoritas</p>
              <p className="text-2xl font-bold">{starredCount}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamaño Total</p>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
            <Archive className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-2xl font-bold">{categoriesCount}</p>
            </div>
            <Tag className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}