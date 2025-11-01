'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import UserHeader from '@/components/dashboard/UserHeader';
import AnnuairesSection from '@/components/dashboard/AnnuairesSection';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [mariage, setMariage] = useState(null);
  const [prestataire, setPrestataire] = useState(null);
  const [lieuReception, setLieuReception] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    taches: 0,
    budget: 0,
    invites: 0,
    favoris: 0
  });
  const [annuaires, setAnnuaires] = useState({
    prestataires: [],
    lieux: []
  });
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      // Attendre que l'authentification soit initialisée
      if (authLoading) return;
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      if (userData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        // Si pas de profil, en créer un
        if (!profileData) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userData.id,
              first_name: '',
              last_name: '',
              phone: ''
            })
            .select()
            .single();
          
          if (insertError) {
            console.error("Erreur lors de la création du profil:", insertError);
          } else {
            setProfile(newProfile);
          }
        } else {
          setProfile(profileData);
        }

        // Récupérer le mariage
        const { data: mariageData } = await supabase
          .from('mariages')
          .select('*')
          .eq('maries_id', userData.id)
          .single();

        setMariage(mariageData);

        // Charger les annuaires selon le rôle
        if (['prestataire', 'entreprise', 'admin'].includes(userData.roles?.name)) {
          // Charger les prestataires
          const { data: prestatairesData } = await supabase
            .from('prestataires')
            .select(`
              *,
              categories(name, label),
              subscription_types(name, price)
            `)
            .eq('user_id', userData.id);

          setAnnuaires(prev => ({ ...prev, prestataires: prestatairesData || [] }));
          if (prestatairesData && prestatairesData.length > 0) {
            setPrestataire(prestatairesData[0]);
          }

          // Charger les lieux de réception
          const { data: lieuxData } = await supabase
            .from('lieux_reception')
            .select(`
              *,
              lieu_types(name, label),
              lieu_subscription_types(name, price)
            `)
            .eq('user_id', userData.id);

          setAnnuaires(prev => ({ ...prev, lieux: lieuxData || [] }));
          if (lieuxData && lieuxData.length > 0) {
            setLieuReception(lieuxData[0]);
          }
        }

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

    loadDashboardData();
  }, [authLoading, user, userData, router]);

  if (authLoading || loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg" 
        text="Chargement de votre dashboard..." 
      />
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
        {/* Header utilisateur */}
        <UserHeader user={user} userData={userData} profile={profile} />

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


        {/* Section Annuaires (prestataire, entreprise, admin) */}
        {['prestataire', 'entreprise', 'admin'].includes(userData?.roles?.name) && (
          <AnnuairesSection 
            annuaires={annuaires} 
            userRole={userData?.roles?.name} 
          />
        )}

        {/* Sections spécifiques au rôle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section gauche */}
          <div className="space-y-6">
            {/* Gestion du mariage - Uniquement pour marie */}
            {userData?.roles?.name === 'marie' && (
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
            )}

            {/* Tâches récentes - Uniquement pour marie */}
            {userData?.roles?.name === 'marie' && (
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
            )}
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
                {/* Bouton Mon Entreprise pour les prestataires */}
                {userData?.roles?.name === 'prestataire' && (
                  <Link href={prestataire ? "/prestataires" : "/prestataires/setup"} className="card-hover p-4 rounded-lg flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <span className="text-2xl mr-3">🏢</span>
                    <div>
                      <h3 className="font-semibold text-blue-800">Mon Entreprise</h3>
                      <p className="text-sm text-blue-600">
                        {prestataire ? 'Gérer mon annuaire' : 'Créer mon annuaire'}
                      </p>
                    </div>
                  </Link>
                )}
                
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
