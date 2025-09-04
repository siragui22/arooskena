'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function MariagePage() {
  const [user, setUser] = useState(null);
  const [mariage, setMariage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom_mariage: '',
    date_mariage: '',
    lieu_ceremonie: '',
    lieu_reception: '',
    budget_total: '',
    nombre_invites: '',
    theme: ''
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

      // Récupérer le mariage de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        const { data: mariageData } = await supabase
          .from('mariages')
          .select('*')
          .eq('maries_id', userData.id)
          .single();

        setMariage(mariageData);
        
        if (mariageData) {
          setFormData({
            nom_mariage: mariageData.nom_mariage || '',
            date_mariage: mariageData.date_mariage || '',
            lieu_ceremonie: mariageData.lieu_ceremonie || '',
            lieu_reception: mariageData.lieu_reception || '',
            budget_total: mariageData.budget_total || '',
            nombre_invites: mariageData.nombre_invites || '',
            theme: mariageData.theme || ''
          });
        }
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        if (mariage) {
          // Mettre à jour le mariage existant
          await supabase
            .from('mariages')
            .update({
              nom_mariage: formData.nom_mariage,
              date_mariage: formData.date_mariage,
              lieu_ceremonie: formData.lieu_ceremonie,
              lieu_reception: formData.lieu_reception,
              budget_total: parseFloat(formData.budget_total) || 0,
              nombre_invites: parseInt(formData.nombre_invites) || 0,
              theme: formData.theme
            })
            .eq('id', mariage.id);
        } else {
          // Créer un nouveau mariage
          const { data: newMariage } = await supabase
            .from('mariages')
            .insert([{
              maries_id: userData.id,
              nom_mariage: formData.nom_mariage,
              date_mariage: formData.date_mariage,
              lieu_ceremonie: formData.lieu_ceremonie,
              lieu_reception: formData.lieu_reception,
              budget_total: parseFloat(formData.budget_total) || 0,
              nombre_invites: parseInt(formData.nombre_invites) || 0,
              theme: formData.theme,
              status: 'planification'
            }])
            .select()
            .single();

          setMariage(newMariage);
        }

        alert('Mariage sauvegardé avec succès ! ✅');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mariage:', error);
      alert('Erreur lors de la sauvegarde du mariage');
    } finally {
      setSaving(false);
    }
  };

  const calculateDaysUntilWedding = () => {
    if (!mariage?.date_mariage) return null;
    const weddingDate = new Date(mariage.date_mariage);
    const today = new Date();
    const diffTime = weddingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  const daysUntilWedding = calculateDaysUntilWedding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Mon Mariage
              </h1>
              <p className="text-gray-600 text-lg">
                Planifiez et organisez votre mariage de rêve
              </p>
            </div>
            <Link href="/dashboard" className="btn-aroos-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {!mariage && !showForm ? (
          /* Écran d'accueil - pas de mariage créé */
          <div className="section-aroos text-center py-16 animate-fade-in-up">
            <div className="max-w-md mx-auto">
              <div className="empty-state-icon animate-pulse-slow">💒</div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Commencez à planifier votre mariage
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Créez votre projet de mariage et accédez à tous nos outils de planification
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos btn-lg"
              >
                Créer mon projet de mariage
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations du mariage */}
            <div className="lg:col-span-2">
              {showForm ? (
                /* Formulaire de création/modification */
                <div className="form-aroos animate-fade-in-up">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="icon-aroos mr-3">💒</span>
                    {mariage ? 'Modifier mon mariage' : 'Créer mon projet de mariage'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Nom du mariage *</span>
                        </label>
                        <input
                          type="text"
                          name="nom_mariage"
                          value={formData.nom_mariage}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="Ex: Mariage de Sarah et Ahmed"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Date du mariage *</span>
                        </label>
                        <input
                          type="date"
                          name="date_mariage"
                          value={formData.date_mariage}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Lieu de la cérémonie</span>
                        </label>
                        <input
                          type="text"
                          name="lieu_ceremonie"
                          value={formData.lieu_ceremonie}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="Mosquée, Église, Mairie..."
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Lieu de réception</span>
                        </label>
                        <input
                          type="text"
                          name="lieu_reception"
                          value={formData.lieu_reception}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="Salle, Restaurant, Hôtel..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Budget total (€)</span>
                        </label>
                        <input
                          type="number"
                          name="budget_total"
                          value={formData.budget_total}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="0"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Nombre d'invités</span>
                        </label>
                        <input
                          type="number"
                          name="nombre_invites"
                          value={formData.nombre_invites}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="0"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Thème</span>
                        </label>
                        <input
                          type="text"
                          name="theme"
                          value={formData.theme}
                          onChange={handleChange}
                          className="input input-bordered input-aroos"
                          placeholder="Ex: Traditionnel, Moderne, Vintage..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="btn-aroos-outline"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn-aroos"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="loader-aroos w-4 h-4 mr-2"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          mariage ? 'Mettre à jour' : 'Créer le projet'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Affichage des informations du mariage */
                <div className="section-aroos animate-fade-in-up">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                      {mariage.nom_mariage}
                    </h2>
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn-aroos-outline btn-sm"
                    >
                      ✏️ Modifier
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Date du mariage</label>
                        <p className="font-medium">
                          {new Date(mariage.date_mariage).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Lieu de la cérémonie</label>
                        <p className="font-medium">{mariage.lieu_ceremonie || 'Non défini'}</p>
                      </div>
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Lieu de réception</label>
                        <p className="font-medium">{mariage.lieu_reception || 'Non défini'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Budget total</label>
                        <p className="font-medium">{mariage.budget_total}€</p>
                      </div>
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Nombre d'invités</label>
                        <p className="font-medium">{mariage.nombre_invites} personnes</p>
                      </div>
                      <div className="notification-aroos">
                        <label className="text-sm text-gray-600">Thème</label>
                        <p className="font-medium">{mariage.theme || 'Non défini'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Compte à rebours */}
              {mariage && daysUntilWedding !== null && (
                <div className="counter-aroos animate-slide-in-right">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="icon-aroos mr-2">⏰</span>
                    Compte à rebours
                  </h3>
                  <div className="text-center">
                    <div className="counter-aroos-number">
                      {daysUntilWedding > 0 ? daysUntilWedding : 0}
                    </div>
                    <div className="text-gray-600">
                      {daysUntilWedding > 0 ? 'jours restants' : 'C\'est aujourd\'hui ! 🎉'}
                    </div>
                  </div>
                </div>
              )}

              {/* Statut du mariage */}
              {mariage && (
                <div className="section-aroos animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="icon-aroos mr-2">📊</span>
                    Statut
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Planification</span>
                      <div className={`badge-aroos ${mariage.status === 'planification' ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                        {mariage.status === 'planification' ? 'En cours' : 'Terminé'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Organisation</span>
                      <div className={`badge-aroos ${mariage.status === 'en_cours' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        {mariage.status === 'en_cours' ? 'En cours' : 'À venir'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mariage</span>
                      <div className={`badge-aroos ${mariage.status === 'termine' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {mariage.status === 'termine' ? 'Terminé' : 'À venir'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div className="section-aroos animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="icon-aroos mr-2">⚡</span>
                  Actions rapides
                </h3>
                <div className="space-y-3">
                  <Link href="/dashboard/taches" className="btn-aroos-outline w-full">
                    📋 Gérer les tâches
                  </Link>
                  <Link href="/dashboard/budget" className="btn-aroos-outline w-full">
                    💰 Gérer le budget
                  </Link>
                  <Link href="/dashboard/invites" className="btn-aroos-outline w-full">
                    👥 Gérer les invités
                  </Link>
                  <Link href="/dashboard/favoris" className="btn-aroos-outline w-full">
                    ❤️ Mes prestataires favoris
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
