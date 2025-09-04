'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function PrestataireServices() {
  const [user, setUser] = useState(null);
  const [prestataire, setPrestataire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie: '',
    is_available: true
  });
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

      // Récupérer les données du prestataire
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (!prestataireData) {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      setPrestataire(prestataireData);
      await loadServices();
      setLoading(false);
    };

    checkPrestataire();
  }, [router]);

  const loadServices = async () => {
    try {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('prestataire_id', prestataire.id)
        .order('created_at', { ascending: false });

      setServices(servicesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        // Mise à jour
        await supabase
          .from('services')
          .update({
            nom: formData.nom,
            description: formData.description,
            prix: parseFloat(formData.prix),
            categorie: formData.categorie,
            is_available: formData.is_available
          })
          .eq('id', editingService.id);
      } else {
        // Création
        await supabase
          .from('services')
          .insert({
            prestataire_id: prestataire.id,
            nom: formData.nom,
            description: formData.description,
            prix: parseFloat(formData.prix),
            categorie: formData.categorie,
            is_available: formData.is_available
          });
      }

      setShowForm(false);
      setEditingService(null);
      setFormData({
        nom: '',
        description: '',
        prix: '',
        categorie: '',
        is_available: true
      });
      await loadServices();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      nom: service.nom,
      description: service.description,
      prix: service.prix.toString(),
      categorie: service.categorie,
      is_available: service.is_available
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);

        await loadServices();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleStatusChange = async (serviceId, isAvailable) => {
    try {
      await supabase
        .from('services')
        .update({ is_available: isAvailable })
        .eq('id', serviceId);

      await loadServices();
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
                🎯 Mes Services
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez vos services et offres
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos"
              >
                ➕ Ajouter un service
              </button>
              <Link href="/dashboard-prestataire" className="btn-aroos-outline">
                ← Retour au Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">🎯</div>
            <div className="text-2xl font-bold text-gray-800">{services.length}</div>
            <div className="text-gray-600">Services</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">✅</div>
            <div className="text-2xl font-bold text-gray-800">
              {services.filter(s => s.is_available).length}
            </div>
            <div className="text-gray-600">Disponibles</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">💰</div>
            <div className="text-2xl font-bold text-gray-800">
              {services.reduce((sum, s) => sum + (s.prix || 0), 0).toLocaleString()} Fdj
            </div>
            <div className="text-gray-600">Valeur totale</div>
          </div>
          <div className="stat-aroos animate-fade-in-up">
            <div className="icon-aroos">⭐</div>
            <div className="text-2xl font-bold text-gray-800">
              {(services.reduce((sum, s) => sum + (s.note_moyenne || 0), 0) / Math.max(services.length, 1)).toFixed(1)}
            </div>
            <div className="text-gray-600">Note moyenne</div>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <div className="section-aroos mb-8 animate-fade-in-up">
            <div className="form-aroos">
              <h3 className="text-xl font-bold mb-6">
                {editingService ? '✏️ Modifier le service' : '➕ Ajouter un service'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du service *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="input-aroos w-full"
                      placeholder="Ex: Photographie de mariage"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.categorie}
                      onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                      className="input-aroos w-full"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="photographie">Photographie</option>
                      <option value="video">Vidéo</option>
                      <option value="traiteur">Traiteur</option>
                      <option value="decoration">Décoration</option>
                      <option value="musique">Musique</option>
                      <option value="transport">Transport</option>
                      <option value="beaute">Beauté</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-aroos w-full"
                    rows="4"
                    placeholder="Décrivez votre service en détail..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (Fdj) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.prix}
                      onChange={(e) => setFormData({...formData, prix: e.target.value})}
                      className="input-aroos w-full"
                      placeholder="50000"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Service disponible
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-aroos">
                    {editingService ? '💾 Mettre à jour' : '➕ Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                      setFormData({
                        nom: '',
                        description: '',
                        prix: '',
                        categorie: '',
                        is_available: true
                      });
                    }}
                    className="btn-aroos-outline"
                  >
                    ❌ Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Liste des services */}
        <div className="section-aroos animate-fade-in-up">
          <h3 className="text-xl font-bold mb-6">📋 Mes Services</h3>
          
          {services.length === 0 ? (
            <div className="empty-state text-center py-8">
              <div className="empty-state-icon">🎯</div>
              <p className="text-gray-600 mb-4">Aucun service créé</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos"
              >
                Créer votre premier service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="card-hover p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold text-lg">{service.nom}</h4>
                    <span className={`badge-aroos ${
                      service.is_available ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {service.is_available ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Catégorie:</span>
                      <span className="font-medium">{service.categorie}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prix:</span>
                      <span className="font-bold text-pink-600">
                        {service.prix?.toLocaleString()} Fdj
                      </span>
                    </div>
                    {service.note_moyenne && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Note:</span>
                        <span className="font-medium">⭐ {service.note_moyenne}/5</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="btn-aroos-outline btn-sm flex-1"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleStatusChange(service.id, !service.is_available)}
                      className={`btn btn-sm ${
                        service.is_available ? 'btn-warning' : 'btn-success'
                      }`}
                    >
                      {service.is_available ? '🔴 Désactiver' : '✅ Activer'}
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="btn btn-error btn-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

