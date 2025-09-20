import React, { useState } from 'react';
import { Share2, Globe, Instagram, Twitter, Facebook, Linkedin, MessageCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Layout } from '@/components/Layout/Layout';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'other';
  title: string;
  content: string;
  date: string;
  url?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const PLATFORM_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  other: MessageCircle
};

const PLATFORM_COLORS = {
  instagram: 'bg-pink-100 text-pink-800',
  twitter: 'bg-blue-100 text-blue-800',
  facebook: 'bg-blue-100 text-blue-900',
  linkedin: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-800'
};

export function RedesSociales() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [showConnectOptions, setShowConnectOptions] = useState(false);

  const handleConnectPlatform = (platform: string) => {
    // Placeholder para futura implementación
    console.log(`Conectando con ${platform}...`);
    // Aquí se implementará la lógica de conexión con APIs de redes sociales
  };

  const handleImportPosts = () => {
    // Placeholder para futura implementación
    console.log('Importando publicaciones...');
    // Aquí se implementará la lógica de importación de publicaciones
  };

  return (
    <Layout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Redes Sociales' }
      ]}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-3">
            <Share2 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Redes Sociales</h1>
          </div>
          <p className="text-blue-100 text-lg leading-relaxed">
            Esta estantería servirá para recopilar y organizar todas las publicaciones que hemos realizado en redes sociales, 
            permitiendo acceder a ellas de manera centralizada.
          </p>
        </div>

        {/* Estado inicial - Sin publicaciones */}
        {posts.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información y próximas funcionalidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Funcionalidades Disponibles</span>
                </CardTitle>
                <CardDescription>
                  Características que estarán disponibles próximamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Instagram className="w-5 h-5 text-pink-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Conexión con Instagram</h4>
                      <p className="text-sm text-gray-600">Importa automáticamente tus publicaciones, stories y reels</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Twitter className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Integración con Twitter/X</h4>
                      <p className="text-sm text-gray-600">Sincroniza tus tweets y hilos importantes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Facebook className="w-5 h-5 text-blue-800 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Facebook & LinkedIn</h4>
                      <p className="text-sm text-gray-600">Recopila publicaciones profesionales y personales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-amber-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Análisis de Contenido</h4>
                      <p className="text-sm text-gray-600">IA local analizará el sentimiento y temas de tus publicaciones</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Comenzar</span>
                </CardTitle>
                <CardDescription>
                  Prepara tu espacio para las redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Share2 className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tu estantería está lista
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Próximamente podrás conectar tus cuentas de redes sociales y comenzar a importar tus publicaciones automáticamente.
                    </p>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setShowConnectOptions(!showConnectOptions)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Ver opciones de conexión
                      </Button>
                      
                      {showConnectOptions && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleConnectPlatform('Instagram')}
                            className="flex items-center space-x-2"
                          >
                            <Instagram className="w-4 h-4" />
                            <span>Instagram</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleConnectPlatform('Twitter')}
                            className="flex items-center space-x-2"
                          >
                            <Twitter className="w-4 h-4" />
                            <span>Twitter/X</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleConnectPlatform('Facebook')}
                            className="flex items-center space-x-2"
                          >
                            <Facebook className="w-4 h-4" />
                            <span>Facebook</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleConnectPlatform('LinkedIn')}
                            className="flex items-center space-x-2"
                          >
                            <Linkedin className="w-4 h-4" />
                            <span>LinkedIn</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vista con publicaciones (para futuro desarrollo) */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const PlatformIcon = PLATFORM_ICONS[post.platform];
              return (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PlatformIcon className="w-4 h-4" />
                        <CardTitle className="text-sm">{post.title}</CardTitle>
                      </div>
                      <Badge className={PLATFORM_COLORS[post.platform]}>
                        {post.platform}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{post.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(post.date).toLocaleDateString('es-ES')}</span>
                      {post.engagement && (
                        <div className="flex space-x-2">
                          <span>❤️ {post.engagement.likes}</span>
                          <span>💬 {post.engagement.comments}</span>
                          <span>🔄 {post.engagement.shares}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}