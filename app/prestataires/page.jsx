'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { cachedFetch } from '@/utils/cache';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function PrestataireAnnuaire() {
  const { user, userData, loading: authLoading, initialized } = useAuth();
  const [prestataire, setPrestataire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [formData, setFormData] = useState({
    nom_entreprise: '',
    description: '',
    categorie_id: '',
    subcategorie_id: '',
    telephone_fixe: '',
    whatsapp: '',
    email: '',
    website: '',
    prix_min: '',
    prix_max: '',
    subscription_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [images, setImages] = useState([]);
  
  // Données de référence pour les adresses
  const regions = [
    { id: 'djibouti', name: 'Djibouti' },
    { id: 'ali_sabieh', name: 'Ali Sabieh' },
    { id: 'dikhil', name: 'Dikhil' },
    { id: 'tadjourah', name: 'Tadjourah' },
    { id: 'obock', name: 'Obock' },
    { id: 'arta', name: 'Arta' }
  ];

  const communes = {
    djibouti: [
      { id: 'djibouti_ville', name: 'Djibouti Ville' },
      { id: 'balbala', name: 'Balbala' },
      { id: 'boulaos', name: 'Boulaos' },
      { id: 'ras-dika', name: 'Ras Dika' }
    ],
    ali_sabieh: [
      { id: 'ali_sabieh_ville', name: 'Ali Sabieh Ville' },
      { id: 'holhol', name: 'Holhol' },
      { id: 'dikhil_commune', name: 'Dikhil' }
    ],
    dikhil: [
      { id: 'dikhil_ville', name: 'Dikhil Ville' },
      { id: 'yoboki', name: 'Yoboki' },
      { id: 'as_eyla', name: 'As Eyla' }
    ],
    tadjourah: [
      { id: 'tadjourah_ville', name: 'Tadjourah Ville' },
      { id: 'randa', name: 'Randa' },
      { id: 'day', name: 'Day' }
    ],
    obock: [
      { id: 'obock_ville', name: 'Obock Ville' },
      { id: 'khor_angar', name: 'Khor Angar' },
      { id: 'mouloud', name: 'Mouloud' }
    ],
    arta: [
      { id: 'arta_ville', name: 'Arta Ville' },
      { id: 'wea', name: 'Wea' },
      { id: 'godoria', name: 'Godoria' }
    ]
  };
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    adresse: '',
    commune: '',
    region: '',
    pays: 'Djibouti'
  });
  const [imageForm, setImageForm] = useState({
    files: [],
    mainImageIndex: 0
  });
  const [uploading, setUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
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
      setUserData(userData);
      await loadData(userData.id);
      
      // Vérifier si l'annuaire vient d'être créé
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('created') === 'true') {
        setShowSuccessMessage(true);
        // Supprimer le paramètre de l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      setLoading(false);
    };

    checkPrestataire();
  }, [router]);

  const loadData = async (userId) => {
    try {
      // Charger les données du prestataire
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select(`
          *,
          categories(name, label),
          subcategories(name, label),
          subscription_types(name, description, price)
        `)
        .eq('user_id', userId)
        .single();

      setPrestataire(prestataireData);

      // Si l'annuaire existe, charger les données associées
      if (prestataireData) {
        // Charger l'adresse unique via la table centralisée `adresses`
        let primaryAddress = null;
        if (prestataireData.adresse_id) {
          const { data: addressRow } = await supabase
            .from('adresses')
            .select('*')
            .eq('id', prestataireData.adresse_id)
            .single();
          primaryAddress = addressRow || null;
        }

        if (primaryAddress) {
          setAddresses([primaryAddress]);
        } else {
          // Fallback lecture legacy pour compatibilité (lecture seule)
          const { data: legacyAddrs } = await supabase
            .from('prestataire_adresses')
            .select('*')
            .eq('prestataire_id', prestataireData.id)
            .order('created_at', { ascending: false });
          const tagged = (legacyAddrs || []).map(a => ({ ...a, _legacy: true }));
          setAddresses(tagged);
        }

        // Charger les images
        const { data: imagesData } = await supabase
          .from('prestataire_images')
          .select('*')
          .eq('prestataire_id', prestataireData.id)
          .order('is_main', { ascending: false })
          .order('created_at', { ascending: false });

        setImages(imagesData || []);

        // Remplir le formulaire avec les données existantes
        setFormData({
          nom_entreprise: prestataireData.nom_entreprise || '',
          description: prestataireData.description || '',
          categorie_id: prestataireData.categorie_id || '',
          subcategorie_id: prestataireData.subcategorie_id || '',
          telephone_fixe: prestataireData.telephone_fixe || '',
          whatsapp: prestataireData.whatsapp || '',
          email: prestataireData.email || '',
          website: prestataireData.website || '',
          prix_min: prestataireData.prix_min || '',
          prix_max: prestataireData.prix_max || '',
          subscription_id: prestataireData.subscription_id || ''
        });
      }

      // Charger les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData || []);

      // Charger les sous-catégories
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      setSubcategories(subcategoriesData || []);

      // Charger les types d'abonnement
      const { data: subscriptionData } = await supabase
        .from('subscription_types')
        .select('*')
        .order('price');

      setSubscriptionTypes(subscriptionData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (prestataire) {
        // Mise à jour
        const { error } = await supabase
          .from('prestataires')
          .update({
            nom_entreprise: formData.nom_entreprise,
            description: formData.description,
            categorie_id: formData.categorie_id || null,
            subcategorie_id: formData.subcategorie_id || null,
            telephone_fixe: formData.telephone_fixe,
            whatsapp: formData.whatsapp,
            email: formData.email,
            website: formData.website,
            prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
            prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
            subscription_id: formData.subscription_id || null
          })
          .eq('id', prestataire.id);

        if (error) throw error;
      } else {
        // Création
        const { data: newPrestataire, error } = await supabase
          .from('prestataires')
          .insert({
            user_id: userData.id,
            nom_entreprise: formData.nom_entreprise,
            description: formData.description,
            categorie_id: formData.categorie_id || null,
            subcategorie_id: formData.subcategorie_id || null,
            telephone_fixe: formData.telephone_fixe,
            whatsapp: formData.whatsapp,
            email: formData.email,
            website: formData.website,
            prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
            prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
            subscription_id: formData.subscription_id || null
          })
          .select()
          .single();

        if (error) throw error;
        setPrestataire(newPrestataire);
      }

      setShowForm(false);
      setEditingMode(false);
      await loadData(userData.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Insérer une adresse dans la table centralisée `adresses`
      const { data: insertedAddress, error: insertAddressError } = await supabase
        .from('adresses')
        .insert({
          adresse: addressForm.adresse,
          commune: addressForm.commune,
          region: addressForm.region,
          pays: addressForm.pays
        })
        .select()
        .single();

      if (insertAddressError) {
        console.error('❌ Erreur lors de l\'insertion dans adresses:', insertAddressError);
        throw insertAddressError;
      }

      // Associer l'adresse au prestataire via la FK
      const { error: updatePrestataireError } = await supabase
        .from('prestataires')
        .update({ adresse_id: insertedAddress.id })
        .eq('id', prestataire.id);

      if (updatePrestataireError) {
        console.error('❌ Erreur lors de l\'association adresse -> prestataire:', updatePrestataireError);
        throw updatePrestataireError;
      }

      setShowAddressForm(false);
      setAddressForm({
        adresse: '',
        commune: '',
        region: '',
        pays: 'Djibouti'
      });
      await loadData(userData.id);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'adresse:', error);
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    
    if (imageForm.files.length === 0) {
      alert('Veuillez sélectionner au moins une image');
      return;
    }

    // Vérifier la taille des fichiers (max 5MB par image)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    const oversizedFiles = imageForm.files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`Les images suivantes sont trop volumineuses (max 5MB) :\n${oversizedFiles.map(f => f.name).join('\n')}`);
      return;
    }

    // Vérifier les formats acceptés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = imageForm.files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert(`Les formats suivants ne sont pas acceptés :\n${invalidFiles.map(f => f.name).join('\n')}\n\nFormats acceptés : JPG, PNG, GIF, WebP`);
      return;
    }

    setUploading(true);
    
    try {
      // Upload de tous les fichiers vers Supabase Storage
      const uploadPromises = imageForm.files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${prestataire.id}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prestataires_images')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('prestataires_images')
          .getPublicUrl(fileName);
        
        return {
          prestataire_id: prestataire.id,
          url: publicUrl,
          is_main: index === imageForm.mainImageIndex
        };
      });
      
      const imagesToInsert = await Promise.all(uploadPromises);
      
      // Insérer toutes les images dans la base de données
      const { error: insertError } = await supabase
        .from('prestataire_images')
        .insert(imagesToInsert);
      
      if (insertError) throw insertError;

      setShowImageForm(false);
      setImageForm({
        files: [],
        mainImageIndex: 0
      });
      await loadData(userData.id);
      
      alert(`${imageForm.files.length} image(s) ajoutée(s) avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      alert('Erreur lors de l\'upload des images. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      try {
        // Détacher l'adresse du prestataire, puis supprimer l'adresse
        const { error: detachError } = await supabase
          .from('prestataires')
          .update({ adresse_id: null })
          .eq('id', prestataire.id);

        if (detachError) {
          console.error('❌ Erreur lors du détachement de l\'adresse:', detachError);
        }

        const { error: deleteAddrError } = await supabase
          .from('adresses')
          .delete()
          .eq('id', addressId);

        if (deleteAddrError) {
          console.warn('⚠️ Erreur lors de la suppression de l\'adresse:', deleteAddrError);
        }

        await loadData(userData.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      try {
        // Extraire le nom du fichier de l'URL
        const fileName = imageUrl.split('/').pop();
        
        // Supprimer l'image du storage
        const { error: storageError } = await supabase.storage
          .from('prestataires_images')
          .remove([fileName]);

        if (storageError) {
          console.warn('Erreur lors de la suppression du fichier storage:', storageError);
        }

        // Supprimer l'enregistrement de la base de données
        await supabase
          .from('prestataire_images')
          .delete()
          .eq('id', imageId);

        await loadData(userData.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
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
        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="section-aroos mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">🎉</span>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Félicitations !</h3>
                  <p className="text-green-700">
                    Votre annuaire d'entreprise a été créé avec succès. 
                    Il sera visible dans notre annuaire public une fois vérifié.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="btn-aroos-outline btn-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="header-aroos animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                🏢 Mon Annuaire d'Entreprise
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez votre profil prestataire et vos informations
              </p>
            </div>
            <Link href="/dashboard" className="btn-aroos-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {/* Logique conditionnelle */}
        {!prestataire ? (
          /* Annuaire n'existe pas - Invitation à créer */
          <div className="section-aroos text-center py-12">
            <div className="empty-state-icon text-6xl mb-6">🏢</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Créez votre annuaire d'entreprise
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Remplissez votre profil prestataire pour apparaître dans notre annuaire et 
              attirer de nouveaux clients. Ajoutez vos informations, photos, adresses et 
              décrivez vos services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/prestataires/setup" className="btn-aroos btn-lg">
                🚀 Créer mon annuaire (Assistant)
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="btn-aroos-outline btn-lg"
              >
                ⚡ Création rapide
              </button>
            </div>
          </div>
        ) : (
          /* Annuaire existe - Affichage et gestion */
          <div className="space-y-8">
            {/* Informations principales */}
            <div className="section-aroos">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="icon-aroos mr-3">🏢</span>
                  Informations de l'entreprise
                </h2>
                <button
                  onClick={() => setEditingMode(!editingMode)}
                  className="btn-aroos-outline"
                >
                  {editingMode ? '👁️ Voir' : '✏️ Modifier'}
                </button>
              </div>

              {editingMode ? (
                /* Mode édition */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l'entreprise *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nom_entreprise}
                        onChange={(e) => setFormData({...formData, nom_entreprise: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="Ex: Studio Photo Djibouti"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="contact@entreprise.dj"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description de l'entreprise
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="input-aroos w-full"
                      rows="4"
                      placeholder="Décrivez votre entreprise, vos spécialités, votre expérience..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={formData.categorie_id}
                        onChange={(e) => setFormData({...formData, categorie_id: e.target.value, subcategorie_id: ''})}
                        className="input-aroos w-full"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sous-catégorie
                      </label>
                      <select
                        value={formData.subcategorie_id}
                        onChange={(e) => setFormData({...formData, subcategorie_id: e.target.value})}
                        className="input-aroos w-full"
                        disabled={!formData.categorie_id}
                      >
                        <option value="">Sélectionner une sous-catégorie</option>
                        {subcategories
                          .filter(sub => sub.category_id === formData.categorie_id)
                          .map(subcategory => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone fixe
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone_fixe}
                        onChange={(e) => setFormData({...formData, telephone_fixe: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="+253 XX XX XX XX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="+253 XX XX XX XX"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site web
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="https://www.entreprise.dj"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type d'abonnement
                      </label>
                      <select
                        value={formData.subscription_id}
                        onChange={(e) => setFormData({...formData, subscription_id: e.target.value})}
                        className="input-aroos w-full"
                      >
                        <option value="">Sélectionner un abonnement</option>
                        {subscriptionTypes.map(subscription => (
                          <option key={subscription.id} value={subscription.id}>
                            {subscription.name} - {subscription.price} Fdj
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix minimum (Fdj)
                      </label>
                      <input
                        type="number"
                        value={formData.prix_min}
                        onChange={(e) => setFormData({...formData, prix_min: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="50000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix maximum (Fdj)
                      </label>
                      <input
                        type="number"
                        value={formData.prix_max}
                        onChange={(e) => setFormData({...formData, prix_max: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="200000"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button type="submit" className="btn-aroos">
                      💾 Sauvegarder
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMode(false)}
                      className="btn-aroos-outline"
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode affichage */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{prestataire.nom_entreprise}</h3>
                      <p className="text-gray-600 mt-2">{prestataire.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="font-medium">{prestataire.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Téléphone:</span>
                        <span className="font-medium">{prestataire.telephone_fixe || 'Non renseigné'}</span>
                      </div>
                      {prestataire.whatsapp && (
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">WhatsApp:</span>
                          <span className="font-medium text-green-600">📱 {prestataire.whatsapp}</span>
                        </div>
                      )}
                      {prestataire.website && (
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">Site web:</span>
                          <a href={prestataire.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            {prestataire.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="badge-aroos bg-blue-500">
                      {prestataire.categories?.label || 'Catégorie non définie'}
                    </div>
                    {prestataire.subcategories?.label && (
                      <div className="badge-aroos bg-gray-500">
                        {prestataire.subcategories.label}
                      </div>
                    )}
                    {prestataire.subscription_types?.name && (
                      <div className="badge-aroos bg-purple-500">
                        {prestataire.subscription_types.name}
                      </div>
                    )}
                  </div>
                  
                  {(prestataire.prix_min || prestataire.prix_max) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Gamme de prix</h4>
                      <p className="text-gray-700">
                        {prestataire.prix_min && prestataire.prix_max ? (
                          `De ${prestataire.prix_min.toLocaleString()} à ${prestataire.prix_max.toLocaleString()} Fdj`
                        ) : prestataire.prix_min ? (
                          `À partir de ${prestataire.prix_min.toLocaleString()} Fdj`
                        ) : (
                          `Jusqu'à ${prestataire.prix_max.toLocaleString()} Fdj`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Adresses */}
            <div className="section-aroos">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="icon-aroos mr-3">📍</span>
                  Adresses ({addresses.length})
                </h2>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn-aroos-outline"
                >
                  ➕ Ajouter une adresse
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">📍</div>
                  <p className="text-gray-600 mb-4">Aucune adresse ajoutée</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn-aroos-outline"
                  >
                    Ajouter votre première adresse
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="card-hover p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">📍 Adresse</h4>
                        <div className="flex items-center gap-2">
                          {address._legacy && (
                            <span className="badge badge-warning" title="Adresse issue de l'ancien schéma (lecture seule)">Legacy</span>
                          )}
                          <button
                            onClick={() => !address._legacy && handleDeleteAddress(address.id)}
                            className={`btn btn-error btn-sm ${address._legacy ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!!address._legacy}
                            title={address._legacy ? "Suppression désactivée pour les adresses legacy" : "Supprimer"}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{address.adresse_complete || address.adresse}</div>
                        <div>{address.commune}, {address.region}</div>
                        <div>{address.pays}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="section-aroos">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="icon-aroos mr-3">🖼️</span>
                  Images ({images.length})
                </h2>
                <button
                  onClick={() => setShowImageForm(true)}
                  className="btn-aroos-outline"
                >
                  ➕ Ajouter une image
                </button>
              </div>

              {images.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">🖼️</div>
                  <p className="text-gray-600 mb-4">Aucune image ajoutée</p>
                  <button
                    onClick={() => setShowImageForm(true)}
                    className="btn-aroos-outline"
                  >
                    Ajouter votre première image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="card-hover p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold flex items-center">
                          🖼️ Image {image.is_main && <span className="badge-aroos bg-yellow-500 ml-2">Principale</span>}
                        </h4>
                        <button
                          onClick={() => handleDeleteImage(image.id, image.url)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                        <img
                          src={image.url}
                          alt="Image prestataire"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden text-gray-500 text-sm">
                          Image non disponible
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ajoutée le {new Date(image.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal d'ajout d'adresse */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">📍 Ajouter une adresse</h3>
              
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.adresse}
                    onChange={(e) => setAddressForm({...addressForm, adresse: e.target.value})}
                    className="input-aroos w-full"
                    placeholder="Ex: Rue de la République, Quartier 4"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Région *
                    </label>
                    <select
                      required
                      value={addressForm.region}
                      onChange={(e) => setAddressForm({...addressForm, region: e.target.value, commune: ''})}
                      className="input-aroos w-full"
                    >
                      <option value="">Sélectionner une région</option>
                      {regions.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commune *
                    </label>
                    <select
                      required
                      value={addressForm.commune}
                      onChange={(e) => setAddressForm({...addressForm, commune: e.target.value})}
                      className="input-aroos w-full"
                      disabled={!addressForm.region}
                    >
                      <option value="">Sélectionner une commune</option>
                      {addressForm.region && communes[addressForm.region]?.map(commune => (
                        <option key={commune.id} value={commune.id}>
                          {commune.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={addressForm.pays}
                    onChange={(e) => setAddressForm({...addressForm, pays: e.target.value})}
                    className="input-aroos w-full"
                    placeholder="Djibouti"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-aroos">
                    ➕ Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="btn-aroos-outline"
                  >
                    ❌ Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal d'ajout d'image */}
        {showImageForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">🖼️ Ajouter une image</h3>
              
              <form onSubmit={handleImageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner des images *
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                      
                      // Vérifier la taille
                      const oversizedFiles = files.filter(file => file.size > maxSize);
                      if (oversizedFiles.length > 0) {
                        alert(`Les images suivantes sont trop volumineuses (max 5MB) :\n${oversizedFiles.map(f => f.name).join('\n')}`);
                        return;
                      }
                      
                      // Vérifier les formats
                      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
                      if (invalidFiles.length > 0) {
                        alert(`Les formats suivants ne sont pas acceptés :\n${invalidFiles.map(f => f.name).join('\n')}\n\nFormats acceptés : JPG, PNG, GIF, WebP`);
                        return;
                      }
                      
                      setImageForm({...imageForm, files: files});
                    }}
                    className="input-aroos w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés : JPG, PNG, GIF, WebP (max 5MB par image)
                  </p>
                </div>
                
                {imageForm.files.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choisir l'image principale
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {imageForm.files.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Aperçu ${index + 1}`}
                            className={`w-full h-20 object-cover rounded border-2 cursor-pointer ${
                              index === imageForm.mainImageIndex 
                                ? 'border-blue-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => setImageForm({...imageForm, mainImageIndex: index})}
                          />
                          {index === imageForm.mainImageIndex && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                              Principale
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button 
                    type="submit" 
                    className="btn-aroos"
                    disabled={uploading}
                  >
                    {uploading ? '⏳ Upload...' : '➕ Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImageForm(false)}
                    className="btn-aroos-outline"
                    disabled={uploading}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
