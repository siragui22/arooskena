'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function TachesPage() {
  const [user, setUser] = useState(null);
  const [mariage, setMariage] = useState(null);
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTache, setEditingTache] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_limite: '',
    priorite: 'normale',
    status: 'a_faire'
  });
  const router = useRouter();

  // Tâches prédéfinies pour les mariages
  const tachesPredifinies = [
    { titre: 'Réserver le lieu de réception', priorite: 'haute', description: 'Contacter et réserver le lieu de réception' },
    { titre: 'Choisir et réserver le photographe', priorite: 'haute', description: 'Sélectionner un photographe professionnel' },
    { titre: 'Commander les alliances', priorite: 'normale', description: 'Acheter ou commander les alliances' },
    { titre: 'Envoyer les faire-part', priorite: 'normale', description: 'Préparer et envoyer les invitations' },
    { titre: 'Réserver le traiteur', priorite: 'haute', description: 'Choisir et réserver le service de restauration' },
    { titre: 'Organiser la liste de mariage', priorite: 'basse', description: 'Créer la liste des cadeaux souhaités' },
    { titre: 'Réserver la musique/DJ', priorite: 'normale', description: 'Sélectionner l\'animation musicale' },
    { titre: 'Choisir les robes et costumes', priorite: 'normale', description: 'Acheter ou louer les tenues' },
    { titre: 'Organiser le transport', priorite: 'basse', description: 'Réserver les véhicules pour le jour J' },
    { titre: 'Préparer la cérémonie religieuse', priorite: 'haute', description: 'Contacter l\'officiant et organiser la cérémonie' }
  ];

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
          // Récupérer les tâches du mariage
          const { data: tachesData } = await supabase
            .from('taches_mariage')
            .select('*')
            .eq('mariage_id', mariageData.id)
            .order('date_limite', { ascending: true });

          setTaches(tachesData || []);
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

    if (!mariage) {
      alert('Veuillez d\'abord créer un projet de mariage');
      return;
    }

    try {
      if (editingTache) {
        // Mettre à jour la tâche existante
        await supabase
          .from('taches_mariage')
          .update({
            titre: formData.titre,
            description: formData.description,
            date_limite: formData.date_limite,
            priorite: formData.priorite,
            status: formData.status
          })
          .eq('id', editingTache.id);

        setTaches(taches.map(t => t.id === editingTache.id ? { ...t, ...formData } : t));
      } else {
        // Créer une nouvelle tâche
        const { data: newTache } = await supabase
          .from('taches_mariage')
          .insert([{
            mariage_id: mariage.id,
            titre: formData.titre,
            description: formData.description,
            date_limite: formData.date_limite,
            priorite: formData.priorite,
            status: formData.status
          }])
          .select()
          .single();

        setTaches([...taches, newTache]);
      }

      setFormData({
        titre: '',
        description: '',
        date_limite: '',
        priorite: 'normale',
        status: 'a_faire'
      });
      setShowForm(false);
      setEditingTache(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tâche:', error);
      alert('Erreur lors de la sauvegarde de la tâche');
    }
  };

  const handleEdit = (tache) => {
    setEditingTache(tache);
    setFormData({
      titre: tache.titre,
      description: tache.description || '',
      date_limite: tache.date_limite || '',
      priorite: tache.priorite,
      status: tache.status
    });
    setShowForm(true);
  };

  const handleDelete = async (tacheId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await supabase
          .from('taches_mariage')
          .delete()
          .eq('id', tacheId);

        setTaches(taches.filter(t => t.id !== tacheId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleStatusChange = async (tacheId, newStatus) => {
    try {
      await supabase
        .from('taches_mariage')
        .update({ status: newStatus })
        .eq('id', tacheId);

      setTaches(taches.map(t => t.id === tacheId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const addPredifinie = async (tache) => {
    if (!mariage) {
      alert('Veuillez d\'abord créer un projet de mariage');
      return;
    }

    try {
      const { data: newTache } = await supabase
        .from('taches_mariage')
        .insert([{
          mariage_id: mariage.id,
          titre: tache.titre,
          description: tache.description,
          priorite: tache.priorite,
          status: 'a_faire'
        }])
        .select()
        .single();

      setTaches([...taches, newTache]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tâche prédéfinie:', error);
      alert('Erreur lors de l\'ajout de la tâche');
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'urgente': return 'badge-error';
      case 'haute': return 'badge-warning';
      case 'normale': return 'badge-info';
      case 'basse': return 'badge-success';
      default: return 'badge-outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'terminee': return 'badge-success';
      case 'en_cours': return 'badge-warning';
      case 'a_faire': return 'badge-outline';
      default: return 'badge-outline';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader-aroos"></div>
      </div>
    );
  }

  if (!mariage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="section-aroos text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="empty-state-icon">📋</div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Créez d'abord votre projet de mariage
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Vous devez créer un projet de mariage avant de pouvoir gérer vos tâches
              </p>
              <Link href="/dashboard/mariage" className="btn-aroos btn-lg">
                Créer mon projet
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tachesAFaire = taches.filter(t => t.status === 'a_faire').length;
  const tachesEnCours = taches.filter(t => t.status === 'en_cours').length;
  const tachesTerminees = taches.filter(t => t.status === 'terminee').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                Mes Tâches
              </h1>
              <p className="text-gray-600 text-lg">
                Organisez et suivez vos tâches de mariage
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos"
              >
                ➕ Ajouter une tâche
              </button>
              <Link href="/dashboard" className="btn-aroos-outline">
                ← Retour au Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Statistiques */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="icon-aroos">📋</div>
                <div className="text-2xl font-bold text-gray-800">{tachesAFaire}</div>
                <div className="text-gray-600">À faire</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="icon-aroos">🔄</div>
                <div className="text-2xl font-bold text-gray-800">{tachesEnCours}</div>
                <div className="text-gray-600">En cours</div>
              </div>
              
              <div className="stat-aroos animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="icon-aroos">✅</div>
                <div className="text-2xl font-bold text-gray-800">{tachesTerminees}</div>
                <div className="text-gray-600">Terminées</div>
              </div>
            </div>
          </div>

          {/* Formulaire d'ajout/modification */}
          {showForm && (
            <div className="lg:col-span-4">
              <div className="form-aroos animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="icon-aroos mr-3">✏️</span>
                  {editingTache ? 'Modifier la tâche' : 'Ajouter une nouvelle tâche'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Titre *</span>
                      </label>
                      <input
                        type="text"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        className="input input-bordered input-aroos"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Date limite</span>
                      </label>
                      <input
                        type="date"
                        name="date_limite"
                        value={formData.date_limite}
                        onChange={handleChange}
                        className="input input-bordered input-aroos"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Priorité</span>
                      </label>
                      <select
                        name="priorite"
                        value={formData.priorite}
                        onChange={handleChange}
                        className="select select-bordered input-aroos"
                      >
                        <option value="basse">Basse</option>
                        <option value="normale">Normale</option>
                        <option value="haute">Haute</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Statut</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="select select-bordered input-aroos"
                      >
                        <option value="a_faire">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="terminee">Terminée</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Description</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="textarea textarea-bordered input-aroos h-24"
                      placeholder="Détails de la tâche..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTache(null);
                        setFormData({
                          titre: '',
                          description: '',
                          date_limite: '',
                          priorite: 'normale',
                          status: 'a_faire'
                        });
                      }}
                      className="btn-aroos-outline"
                    >
                      Annuler
                    </button>
                    <button type="submit" className="btn-aroos">
                      {editingTache ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tâches prédéfinies */}
          <div className="lg:col-span-1">
            <div className="section-aroos animate-slide-in-right">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="icon-aroos mr-2">📝</span>
                Tâches prédéfinies
              </h3>
              <div className="space-y-3">
                {tachesPredifinies.map((tache, index) => (
                  <div key={index} className="card-hover p-4 rounded-lg">
                    <h4 className="card-title text-sm font-semibold">{tache.titre}</h4>
                    <p className="text-xs text-gray-600 mt-1">{tache.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <div className={`badge ${getPrioriteColor(tache.priorite)} badge-sm`}>
                        {tache.priorite}
                      </div>
                      <button
                        onClick={() => addPredifinie(tache)}
                        className="btn-aroos btn-xs"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des tâches */}
          <div className="lg:col-span-3">
            <div className="section-aroos animate-fade-in-up">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="icon-aroos mr-2">📋</span>
                Mes tâches
              </h3>
              
              {taches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <p className="text-gray-600 mb-4">Aucune tâche créée pour le moment</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Ajoutez des tâches prédéfinies ou créez vos propres tâches
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-aroos-outline"
                  >
                    Créer ma première tâche
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {taches.map((tache) => (
                    <div key={tache.id} className="card-hover p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="card-title text-base font-semibold">{tache.titre}</h4>
                          {tache.description && (
                            <p className="text-sm text-gray-600 mt-1">{tache.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <div className={`badge ${getPrioriteColor(tache.priorite)} badge-sm`}>
                              {tache.priorite}
                            </div>
                            <div className={`badge ${getStatusColor(tache.status)} badge-sm`}>
                              {tache.status === 'a_faire' ? 'À faire' : 
                               tache.status === 'en_cours' ? 'En cours' : 'Terminée'}
                            </div>
                            {tache.date_limite && (
                              <span className="text-xs text-gray-500">
                                📅 {new Date(tache.date_limite).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <select
                            value={tache.status}
                            onChange={(e) => handleStatusChange(tache.id, e.target.value)}
                            className="select select-bordered select-sm input-aroos"
                          >
                            <option value="a_faire">À faire</option>
                            <option value="en_cours">En cours</option>
                            <option value="terminee">Terminée</option>
                          </select>
                          
                          <button
                            onClick={() => handleEdit(tache)}
                            className="btn-aroos-outline btn-sm"
                          >
                            ✏️
                          </button>
                          
                          <button
                            onClick={() => handleDelete(tache.id)}
                            className="btn btn-error btn-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
