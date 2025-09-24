'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function PrestataireDashboard() {
  const [user, setUser] = useState(null);
  const [prestataire, setPrestataire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    totalDemandes: 0,
    totalAvis: 0,
    noteMoyenne: 0
  });
  const [services, setServices] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const checkPrestataire = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Vérifier si l'utilisateur est prestataire
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (!userData || userData.roles?.name !== 'prestataire') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await loadData();
      setLoading(false);
    };

    checkPrestataire();
  }, [router]);

  const loadData = async () => {
    try {
      // Récupérer les données du prestataire
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        const { data: prestataireData } = await supabase
          .from('prestataires')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        setPrestataire(prestataireData);

        if (prestataireData) {
          // Charger les statistiques
          const [servicesCount, avisCount] = await Promise.all([
            supabase.from('services').select('*', { count: 'exact' }).eq('prestataire_id', prestataireData.id),
            supabase.from('avis').select('*', { count: 'exact' }).eq('prestataire_id', prestataireData.id)
          ]);

          // Calculer la note moyenne
          const { data: avisData } = await supabase
            .from('avis')
            .select('note')
            .eq('prestataire_id', prestataireData.id);

          const noteMoyenne = avisData && avisData.length > 0 
            ? avisData.reduce((sum, avis) => sum + avis.note, 0) / avisData.length 
            : 0;

          setStats({
            totalServices: servicesCount.count || 0,
            totalDemandes: 0, // À implémenter avec une table de demandes
            totalAvis: avisCount.count || 0,
            noteMoyenne: Math.round(noteMoyenne * 10) / 10
          });

          // Charger les services
          const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('prestataire_id', prestataireData.id)
            .order('created_at', { ascending: false });

          setServices(servicesData || []);

          // Charger les demandes (placeholder)
          setDemandes([]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleServiceStatusChange = async (serviceId, isAvailable) => {
    try {
      await supabase
        .from('services')
        .update({ is_available: isAvailable })
        .eq('id', serviceId);

      // Recharger les données
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                🏢 Espace Prestataire
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez vos services et demandes
              </p>
            </div>
            <Link href="/dashboard" className="btn-aroos-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {/* Informations du prestataire */}
        {prestataire && (
          <div className="section-aroos mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{prestataire.nom_entreprise}</h2>
                <p className="text-gray-600">{prestataire.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`badge-aroos ${prestataire.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {prestataire.is_verified ? 'Vérifié' : 'En attente de vérification'}
                  </span>
                  <span className="badge-aroos bg-blue-500">{prestataire.categorie}</span>
                  <span className="badge-aroos bg-purple-500">{prestataire.subscription_type}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{stats.noteMoyenne}/5</div>
                <div className="text-gray-600">Note moyenne</div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="section-aroos mb-8">
          <div className="flex space-x-4 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'services', label: 'Mes Services', icon: '🛠️' },
              { id: 'demandes', label: 'Demandes', icon: '📋' },
              { id: 'avis', label: 'Avis', icon: '⭐' },
              { id: 'profile', label: 'Profil', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-aroosPink border-b-2 border-aroosPink'
                    : 'text-gray-600 hover:text-aroosPink'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="icon-aroos">🛠️</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalServices}</div>
                <div className="text-gray-600">Services</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="icon-aroos">📋</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalDemandes}</div>
                <div className="text-gray-600">Demandes</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="icon-aroos">⭐</div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalAvis}</div>
                <div className="text-gray-600">Avis</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="icon-aroos">📈</div>
                <div className="text-2xl font-bold text-gray-800">{stats.noteMoyenne}/5</div>
                <div className="text-gray-600">Note moyenne</div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="section-aroos">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="icon-aroos mr-2">⚡</span>
                  Actions rapides
                </h3>
                <div className="space-y-3">
                  <button className="btn-aroos-outline w-full">
                    ➕ Ajouter un service
                  </button>
                  <button className="btn-aroos-outline w-full">
                    📋 Voir les demandes
                  </button>
                  <button className="btn-aroos-outline w-full">
                    ⭐ Gérer les avis
                  </button>
                  <button className="btn-aroos-outline w-full">
                    📊 Voir les statistiques
                  </button>
                </div>
              </div>

              <div className="section-aroos">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="icon-aroos mr-2">📈</span>
                  Activité récente
                </h3>
                <div className="space-y-3">
                  <div className="notification-aroos">
                    <p className="text-sm">2 nouvelles demandes aujourd'hui</p>
                  </div>
                  <div className="notification-aroos">
                    <p className="text-sm">1 nouvel avis reçu</p>
                  </div>
                  <div className="notification-aroos">
                    <p className="text-sm">Votre profil a été consulté 15 fois</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="section-aroos">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center">
                <span className="icon-aroos mr-2">🛠️</span>
                Mes Services
              </h3>
              <Link href="/dashboard-prestataire/services" className="btn-aroos">
                ➕ Gérer mes services
              </Link>
            </div>
            
            {services.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛠️</div>
                <p className="text-gray-600 mb-4">Aucun service créé pour le moment</p>
                <Link href="/dashboard-prestataire/services" className="btn-aroos-outline">
                  Créer mon premier service
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.slice(0, 6).map((service) => (
                  <div key={service.id} className="card-hover p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">{service.nom}</h4>
                      <span className={`badge-aroos ${
                        service.is_available ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {service.is_available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-pink-600">
                        {service.prix?.toLocaleString()} Fdj
                      </span>
                      <Link href="/dashboard-prestataire/services" className="btn-aroos-outline btn-sm">
                        Gérer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {services.length > 6 && (
              <div className="text-center mt-6">
                <Link href="/dashboard-prestataire/services" className="btn-aroos-outline">
                  Voir tous mes services ({services.length})
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'demandes' && (
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">📋</span>
              Demandes de clients
            </h3>
            
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="text-gray-600 mb-4">Aucune demande pour le moment</p>
              <p className="text-sm text-gray-500">
                Les demandes de clients apparaîtront ici
              </p>
            </div>
          </div>
        )}

        {activeTab === 'avis' && (
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">⭐</span>
              Avis des clients
            </h3>
            
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <p className="text-gray-600 mb-4">Aucun avis pour le moment</p>
              <p className="text-sm text-gray-500">
                Les avis de vos clients apparaîtront ici
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="section-aroos">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="icon-aroos mr-2">👤</span>
              Mon Profil Prestataire
            </h3>
            
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <p className="text-gray-600 mb-4">Gestion du profil à venir</p>
              <button className="btn-aroos-outline">
                Modifier mon profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
