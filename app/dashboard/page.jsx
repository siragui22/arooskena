'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mariage, setMariage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    taches: 0,
    budget: 0,
    invites: 0,
    favoris: 0
  });
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      setUser(user);

      // Récupérer le profil utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        setProfile(profileData);

        // Récupérer le mariage
        const { data: mariageData } = await supabase
          .from('mariages')
          .select('*')
          .eq('maries_id', userData.id)
          .single();

        setMariage(mariageData);

        // Récupérer les statistiques
        if (mariageData) {
          const { data: tachesData } = await supabase
            .from('taches_mariage')
            .select('*')
            .eq('mariage_id', mariageData.id);

          const { data: invitesData } = await supabase
            .from('invites')
            .select('*')
            .eq('mariage_id', mariageData.id);

          const { data: favorisData } = await supabase
            .from('favoris')
            .select('*')
            .eq('user_id', userData.id);

          setStats({
            taches: tachesData?.length || 0,
            budget: mariageData.budget_total || 0,
            invites: invitesData?.length || 0,
            favoris: favorisData?.length || 0
          });
        }
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  const calculateDaysUntilWedding = () => {
    if (!mariage?.date_mariage) return null;
    const weddingDate = new Date(mariage.date_mariage);
    const today = new Date();
    const diffTime = weddingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilWedding = calculateDaysUntilWedding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header avec animation */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Bienvenue, {profile?.first_name || user?.email?.split('@')[0]} !
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez votre mariage de rêve avec Arooskena
              </p>
            </div>
            <div className="profile-card">
              <div className="profile-avatar">
                {(profile?.first_name || user?.email?.charAt(0) || 'U').toUpperCase()}
              </div>
              <h3 className="font-semibold text-gray-800">{profile?.first_name || 'Utilisateur'}</h3>
              <p className="text-sm text-gray-600 capitalize">{profile?.role || 'couple'}</p>
            </div>
          </div>
        </div>

        {/* Compte à rebours si mariage créé */}
        {mariage && daysUntilWedding !== null && (
          <div className="counter-aroos animate-slide-in-right mb-8">
            <div className="counter-aroos-number">
              {daysUntilWedding > 0 ? daysUntilWedding : 0}
            </div>
            <div className="text-gray-600 text-lg">
              {daysUntilWedding > 0 ? 'jours restants' : 'C\'est aujourd\'hui ! 🎉'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {mariage.nom_mariage} - {new Date(mariage.date_mariage).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="icon-aroos">📋</div>
            <div className="text-2xl font-bold text-gray-800">{stats.taches}</div>
            <div className="text-gray-600">Tâches</div>
          </div>
          
          <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="icon-aroos">💰</div>
            <div className="text-2xl font-bold text-gray-800">{stats.budget}€</div>
            <div className="text-gray-600">Budget</div>
          </div>
          
          <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="icon-aroos">👥</div>
            <div className="text-2xl font-bold text-gray-800">{stats.invites}</div>
            <div className="text-gray-600">Invités</div>
          </div>
          
          <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="icon-aroos">❤️</div>
            <div className="text-2xl font-bold text-gray-800">{stats.favoris}</div>
            <div className="text-gray-600">Favoris</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section gauche */}
          <div className="space-y-6">
            {/* Gestion du mariage */}
            <div className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="icon-aroos mr-3">💒</span>
                Mon Mariage
              </h2>
              
              {!mariage ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💒</div>
                  <h3 className="text-xl font-semibold mb-2">Commencez votre projet</h3>
                  <p className="text-gray-600 mb-4">
                    Créez votre projet de mariage pour accéder à tous nos outils
                  </p>
                  <Link href="/dashboard/mariage" className="btn-aroos">
                    Créer mon projet
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{mariage.nom_mariage}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(mariage.date_mariage).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className={`badge-aroos ${mariage.status === 'planification' ? 'bg-yellow-500' : mariage.status === 'en_cours' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {mariage.status === 'planification' ? 'Planification' : 
                       mariage.status === 'en_cours' ? 'En cours' : 'Terminé'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-semibold ml-2">{mariage.budget_total}€</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Invités:</span>
                      <span className="font-semibold ml-2">{mariage.nombre_invites}</span>
                    </div>
                  </div>
                  
                  <Link href="/dashboard/mariage" className="btn-aroos-outline w-full">
                    Gérer mon mariage
                  </Link>
                </div>
              )}
            </div>

            {/* Tâches récentes */}
            <div className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="icon-aroos mr-3">📝</span>
                Tâches récentes
              </h2>
              
              {stats.taches === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <p className="text-gray-600 mb-4">Aucune tâche créée</p>
                  <Link href="/dashboard/taches" className="btn-aroos-outline">
                    Créer ma première tâche
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tâches à faire</span>
                    <span className="font-semibold">{stats.taches}</span>
                  </div>
                  <div className="progress-aroos h-2">
                    <div className="progress-aroos-fill" style={{ width: '60%' }}></div>
                  </div>
                  <Link href="/dashboard/taches" className="btn-aroos-outline w-full">
                    Voir toutes les tâches
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Section droite */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="icon-aroos mr-3">⚡</span>
                Actions rapides
              </h2>
              
              <div className="grid grid-cols-1 gap-3">
                <Link href="/dashboard/profile" className="card-hover p-4 rounded-lg flex items-center">
                  <span className="text-2xl mr-3">👤</span>
                  <div>
                    <h3 className="font-semibold">Mon Profil</h3>
                    <p className="text-sm text-gray-600">Gérer mes informations</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/budget" className="card-hover p-4 rounded-lg flex items-center">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <h3 className="font-semibold">Budget</h3>
                    <p className="text-sm text-gray-600">Suivre mes dépenses</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/invites" className="card-hover p-4 rounded-lg flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <h3 className="font-semibold">Invités</h3>
                    <p className="text-sm text-gray-600">Gérer ma liste d'invités</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/favoris" className="card-hover p-4 rounded-lg flex items-center">
                  <span className="text-2xl mr-3">❤️</span>
                  <div>
                    <h3 className="font-semibold">Favoris</h3>
                    <p className="text-sm text-gray-600">Mes prestataires favoris</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Conseils et astuces */}
            <div className="section-aroos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="icon-aroos mr-3">💡</span>
                Conseils du jour
              </h2>
              
              <div className="space-y-4">
                <div className="notification-aroos">
                  <h4 className="font-semibold mb-1">Planifiez tôt !</h4>
                  <p className="text-sm text-gray-600">
                    Les meilleurs prestataires sont réservés 12 à 18 mois à l'avance.
                  </p>
                </div>
                
                <div className="notification-aroos">
                  <h4 className="font-semibold mb-1">Budget réaliste</h4>
                  <p className="text-sm text-gray-600">
                    Prévoyez 10% de marge pour les imprévus dans votre budget.
                  </p>
                </div>
                
                <div className="notification-aroos">
                  <h4 className="font-semibold mb-1">Photographe prioritaire</h4>
                  <p className="text-sm text-gray-600">
                    Réservez votre photographe en premier, c'est souvent le plus demandé.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        {!mariage && (
          <div className="section-aroos text-center mt-8">
            <div className="empty-state-icon animate-pulse-slow">💒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Prêt à commencer votre aventure ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Créez votre projet de mariage et accédez à tous nos outils de planification, 
              de gestion de budget et d'organisation pour un mariage parfait.
            </p>
            <Link href="/dashboard/mariage" className="btn-aroos btn-lg">
              Créer mon projet de mariage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
