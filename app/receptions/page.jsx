'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { compressMultipleImages } from '@/lib/imageCompression';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ReceptionManagement() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [lieu, setLieu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [formData, setFormData] = useState({
    nom_lieu: '',
    description: '',
    type_lieu_id: '',
    telephone_fixe: '',
    whatsapp: '',
    email: '',
    website: '',
    capacite_min: '',
    capacite_max: '',
    prix_min: '',
    prix_max: '',
    prix_par_personne: '',
    subscription_id: ''
  });
  const [typesLieu, setTypesLieu] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [images, setImages] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  
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
      { id: 'doraleh', name: 'Doraleh' }
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
  const [showDisponibiliteForm, setShowDisponibiliteForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    adresse_complete: '',
    commune: '',
    region: '',
    pays: 'DJIBOUTI'
  });
  const [imageForm, setImageForm] = useState({
    files: [],
    mainImageIndex: 0
  });
  const [disponibiliteForm, setDisponibiliteForm] = useState({
    date_debut: '',
    date_fin: '',
    est_disponible: true,
    prix_special: ''
  });
  const [uploading, setUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLieu = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Vérifier si l'utilisateur est gestionnaire de lieu
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (!userData || !['prestataire', 'entreprise', 'admin'].includes(userData.roles?.name)) {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      setUserData(userData);
      await loadData(userData.id);
      
      // Vérifier si le lieu vient d'être créé
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('created') === 'true') {
        setShowSuccessMessage(true);
        // Supprimer le paramètre de l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      setLoading(false);
    };

    checkLieu();
  }, [router]);

  const loadData = async (userId) => {
    try {
      // Charger les données du lieu
      const { data: lieuData } = await supabase
        .from('lieux_reception')
        .select(`
          *,
          lieu_types(name, label),
          lieu_subscription_types(name, description, price)
        `)
        .eq('user_id', userId)
        .single();

      setLieu(lieuData);

      // Si le lieu existe, charger les données associées
      if (lieuData) {
        // Charger l'adresse unique via la table centralisée `adresses`
        let primaryAddress = null;
        if (lieuData.adresse_id) {
          const { data: addressRow } = await supabase
            .from('adresses')
            .select('*')
            .eq('id', lieuData.adresse_id)
            .single();
          primaryAddress = addressRow || null;
        }

        if (primaryAddress) {
          setAddresses([primaryAddress]);
        }

        // Charger les images
        const { data: imagesData } = await supabase
          .from('lieu_reception_images')
          .select('*')
          .eq('lieu_reception_id', lieuData.id)
          .order('is_main', { ascending: false })
          .order('created_at', { ascending: false });

        setImages(imagesData || []);

        // Charger les disponibilités
        const { data: disponibilitesData } = await supabase
          .from('lieu_reception_disponibilites')
          .select('*')
          .eq('lieu_reception_id', lieuData.id)
          .order('date_debut', { ascending: true });

        setDisponibilites(disponibilitesData || []);

        // Remplir le formulaire avec les données existantes
        setFormData({
          nom_lieu: lieuData.nom_lieu || '',
          description: lieuData.description || '',
          type_lieu_id: lieuData.type_lieu_id || '',
          telephone_fixe: lieuData.telephone_fixe || '',
          whatsapp: lieuData.whatsapp || '',
          email: lieuData.email || '',
          website: lieuData.website || '',
          capacite_min: lieuData.capacite_min || '',
          capacite_max: lieuData.capacite_max || '',
          prix_min: lieuData.prix_min || '',
          prix_max: lieuData.prix_max || '',
          prix_par_personne: lieuData.prix_par_personne || '',
          subscription_id: lieuData.subscription_id || ''
        });
      }

      // Charger les types de lieux
      const { data: typesLieuData } = await supabase
        .from('lieu_types')
        .select('*')
        .order('label');

      setTypesLieu(typesLieuData || []);

      // Charger les types d'abonnement
      const { data: subscriptionData } = await supabase
        .from('lieu_subscription_types')
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
      if (lieu) {
        // Mise à jour
        const { error } = await supabase
          .from('lieux_reception')
          .update({
            nom_lieu: formData.nom_lieu,
            description: formData.description,
            type_lieu_id: formData.type_lieu_id || null,
            telephone_fixe: formData.telephone_fixe,
            whatsapp: formData.whatsapp,
            email: formData.email,
            website: formData.website,
            capacite_min: formData.capacite_min ? parseInt(formData.capacite_min) : null,
            capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
            prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
            prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
            prix_par_personne: formData.prix_par_personne ? parseFloat(formData.prix_par_personne) : null,
            subscription_id: formData.subscription_id || null
          })
          .eq('id', lieu.id);

        if (error) throw error;
      } else {
        // Création
        const { data: newLieu, error } = await supabase
          .from('lieux_reception')
          .insert({
            user_id: userData.id,
            nom_lieu: formData.nom_lieu,
            description: formData.description,
            type_lieu_id: formData.type_lieu_id || null,
            telephone_fixe: formData.telephone_fixe,
            whatsapp: formData.whatsapp,
            email: formData.email,
            website: formData.website,
            capacite_min: formData.capacite_min ? parseInt(formData.capacite_min) : null,
            capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
            prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
            prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
            prix_par_personne: formData.prix_par_personne ? parseFloat(formData.prix_par_personne) : null,
            subscription_id: formData.subscription_id || null
          })
          .select()
          .single();

        if (error) throw error;
        setLieu(newLieu);
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
          adresse_complete: addressForm.adresse_complete,
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

      // Associer l'adresse au lieu via la FK
      const { error: updateLieuError } = await supabase
        .from('lieux_reception')
        .update({ adresse_id: insertedAddress.id })
        .eq('id', lieu.id);

      if (updateLieuError) {
        console.error('❌ Erreur lors de l\'association adresse -> lieu:', updateLieuError);
        throw updateLieuError;
      }

      setShowAddressForm(false);
      setAddressForm({
        adresse_complete: '',
        commune: '',
        region: '',
        pays: 'DJIBOUTI'
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

    setUploading(true);
    
    try {
      // Vérifier les formats acceptés
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = Array.from(imageForm.files).filter(file => !allowedTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        alert(`Les formats suivants ne sont pas acceptés :\\n${invalidFiles.map(f => f.name).join('\\n')}\\n\\nFormats acceptés : JPG, PNG, GIF, WebP`);
        return;
      }
      
      // Compresser les images avant l'upload
      const compressedFiles = await compressMultipleImages(imageForm.files, 5, 0.8);
      
      // Upload de tous les fichiers vers Supabase Storage
      const uploadPromises = compressedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${lieu.id}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lieux_reception_images')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('❌ Erreur upload image:', uploadError);
          throw uploadError;
        }
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('lieux_reception_images')
          .getPublicUrl(fileName);
        
        return {
          lieu_reception_id: lieu.id,
          url: publicUrl,
          is_main: index === imageForm.mainImageIndex
        };
      });
      
      const imagesToInsert = await Promise.all(uploadPromises);
      
      // Insérer toutes les images dans la base de données
      const { error: insertError } = await supabase
        .from('lieu_reception_images')
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

  const handleDisponibiliteSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('lieu_reception_disponibilites')
        .insert({
          lieu_reception_id: lieu.id,
          date_debut: disponibiliteForm.date_debut,
          date_fin: disponibiliteForm.date_fin,
          est_disponible: disponibiliteForm.est_disponible,
          prix_special: disponibiliteForm.prix_special ? parseFloat(disponibiliteForm.prix_special) : null
        });

      if (error) throw error;

      setShowDisponibiliteForm(false);
      setDisponibiliteForm({
        date_debut: '',
        date_fin: '',
        est_disponible: true,
        prix_special: ''
      });
      await loadData(userData.id);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la disponibilité:', error);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      try {
        // Détacher l'adresse du lieu, puis supprimer l'adresse
        const { error: detachError } = await supabase
          .from('lieux_reception')
          .update({ adresse_id: null })
          .eq('id', lieu.id);

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
          .from('lieux_reception_images')
          .remove([fileName]);

        if (storageError) {
          console.warn('Erreur lors de la suppression du fichier storage:', storageError);
        }

        // Supprimer l'enregistrement de la base de données
        await supabase
          .from('lieu_reception_images')
          .delete()
          .eq('id', imageId);

        await loadData(userData.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteDisponibilite = async (disponibiliteId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      try {
        const { error } = await supabase
          .from('lieu_reception_disponibilites')
          .delete()
          .eq('id', disponibiliteId);

        if (error) throw error;
        await loadData(userData.id);
      } catch (error) {
        console.error('Erreur lors de la suppression de la disponibilité:', error);
      }
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg" 
        text="Chargement de votre lieu de réception..." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="section-aroos mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">🎉</span>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Félicitations !</h3>
                  <p className="text-green-700">
                    Votre lieu de réception a été créé avec succès. 
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
                🏛️ Gestion de mon Lieu de Réception
              </h1>
              <p className="text-gray-600 text-lg">
                Gérez votre lieu de réception et vos informations
              </p>
            </div>
            <Link href="/dashboard" className="btn-aroos-outline">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>

        {/* Logique conditionnelle */}
        {!lieu ? (
          /* Lieu n'existe pas - Invitation à créer */
          <div className="section-aroos text-center py-12">
            <div className="empty-state-icon text-6xl mb-6">🏛️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Créez votre lieu de réception
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Remplissez votre profil de lieu de réception pour apparaître dans notre annuaire et 
              attirer de nouveaux clients. Ajoutez vos informations, photos, adresses et 
              décrivez vos services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/receptions/setup" className="btn-aroos btn-lg">
                🚀 Créer mon lieu (Assistant)
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
          /* Lieu existe - Affichage et gestion */
          <div className="space-y-8">
            {/* Informations principales */}
            <div className="section-aroos">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="icon-aroos mr-3">🏛️</span>
                  Informations du lieu
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
                        Nom du lieu *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nom_lieu}
                        onChange={(e) => setFormData({...formData, nom_lieu: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="Ex: Villa Paradis"
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
                        placeholder="contact@villaparadis.dj"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du lieu
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="input-aroos w-full"
                      rows="4"
                      placeholder="Décrivez votre lieu, ses caractéristiques, ses particularités..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de lieu
                      </label>
                      <select
                        value={formData.type_lieu_id}
                        onChange={(e) => setFormData({...formData, type_lieu_id: e.target.value})}
                        className="input-aroos w-full"
                      >
                        <option value="">Sélectionner un type de lieu</option>
                        {typesLieu.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
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
                        placeholder="https://www.villaparadis.dj"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix par personne (Fdj)
                      </label>
                      <input
                        type="number"
                        value={formData.prix_par_personne}
                        onChange={(e) => setFormData({...formData, prix_par_personne: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacité minimum (personnes)
                      </label>
                      <input
                        type="number"
                        value={formData.capacite_min}
                        onChange={(e) => setFormData({...formData, capacite_min: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacité maximum (personnes)
                      </label>
                      <input
                        type="number"
                        value={formData.capacite_max}
                        onChange={(e) => setFormData({...formData, capacite_max: e.target.value})}
                        className="input-aroos w-full"
                        placeholder="200"
                      />
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
                      <h3 className="font-semibold text-lg text-gray-800">{lieu.nom_lieu}</h3>
                      <p className="text-gray-600 mt-2">{lieu.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="font-medium">{lieu.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24">Téléphone:</span>
                        <span className="font-medium">{lieu.telephone_fixe || 'Non renseigné'}</span>
                      </div>
                      {lieu.whatsapp && (
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">WhatsApp:</span>
                          <span className="font-medium text-green-600">📱 {lieu.whatsapp}</span>
                        </div>
                      )}
                      {lieu.website && (
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">Site web:</span>
                          <a href={lieu.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            {lieu.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="badge-aroos bg-blue-500">
                      {lieu.lieu_types?.label || 'Type non défini'}
                    </div>
                    {lieu.lieu_subscription_types?.name && (
                      <div className="badge-aroos bg-purple-500">
                        {lieu.lieu_subscription_types.name}
                      </div>
                    )}
                  </div>
                  
                  {(lieu.capacite_min || lieu.capacite_max) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Capacité d'accueil</h4>
                      <p className="text-gray-700">
                        {lieu.capacite_min && lieu.capacite_max ? (
                          `De ${lieu.capacite_min} à ${lieu.capacite_max} personnes`
                        ) : lieu.capacite_min ? (
                          `Minimum ${lieu.capacite_min} personnes`
                        ) : (
                          `Maximum ${lieu.capacite_max} personnes`
                        )}
                      </p>
                    </div>
                  )}
                  
                  {(lieu.prix_min || lieu.prix_max || lieu.prix_par_personne) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Gamme de prix</h4>
                      <div className="text-gray-700">
                        {lieu.prix_min && lieu.prix_max && (
                          <p>Location: De {lieu.prix_min.toLocaleString()} à {lieu.prix_max.toLocaleString()} Fdj</p>
                        )}
                        {lieu.prix_par_personne && (
                          <p>Prix par personne: {lieu.prix_par_personne.toLocaleString()} Fdj</p>
                        )}
                      </div>
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
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
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
                          alt="Image lieu"
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

            {/* Disponibilités */}
            <div className="section-aroos">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="icon-aroos mr-3">📅</span>
                  Disponibilités ({disponibilites.length})
                </h2>
                <button
                  onClick={() => setShowDisponibiliteForm(true)}
                  className="btn-aroos-outline"
                >
                  ➕ Ajouter une disponibilité
                </button>
              </div>

              {disponibilites.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">📅</div>
                  <p className="text-gray-600 mb-4">Aucune disponibilité ajoutée</p>
                  <button
                    onClick={() => setShowDisponibiliteForm(true)}
                    className="btn-aroos-outline"
                  >
                    Ajouter votre première disponibilité
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {disponibilites.map((disponibilite) => (
                    <div key={disponibilite.id} className="card-hover p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold flex items-center">
                          📅 {disponibilite.est_disponible ? 'Disponible' : 'Indisponible'}
                        </h4>
                        <button
                          onClick={() => handleDeleteDisponibilite(disponibilite.id)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>De {new Date(disponibilite.date_debut).toLocaleDateString('fr-FR')} à {new Date(disponibilite.date_fin).toLocaleDateString('fr-FR')}</div>
                        {disponibilite.prix_special && (
                          <div>Prix spécial: {disponibilite.prix_special} Fdj</div>
                        )}
                        {disponibilite.note && (
                          <div>Note: {disponibilite.note}</div>
                        )}
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
                    value={addressForm.adresse_complete}
                    onChange={(e) => setAddressForm({...addressForm, adresse_complete: e.target.value})}
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
                    placeholder="DJIBOUTI"
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
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                      
                      // Vérifier les formats
                      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
                      if (invalidFiles.length > 0) {
                        alert(`Les formats suivants ne sont pas acceptés :\\n${invalidFiles.map(f => f.name).join('\\n')}\\n\\nFormats acceptés : JPG, PNG, GIF, WebP`);
                        return;
                      }
                      
                      // On stocke les fichiers originaux, la compression se fera lors de l'upload
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

        {/* Modal d'ajout de disponibilité */}
        {showDisponibiliteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">📅 Ajouter une disponibilité</h3>
              
              <form onSubmit={handleDisponibiliteSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date début *
                    </label>
                    <input
                      type="date"
                      required
                      value={disponibiliteForm.date_debut}
                      onChange={(e) => setDisponibiliteForm({...disponibiliteForm, date_debut: e.target.value})}
                      className="input-aroos w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={disponibiliteForm.date_fin}
                      onChange={(e) => setDisponibiliteForm({...disponibiliteForm, date_fin: e.target.value})}
                      className="input-aroos w-full"
                    />
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      className="checkbox-aroos"
                      checked={disponibiliteForm.est_disponible}
                      onChange={(e) => setDisponibiliteForm({...disponibiliteForm, est_disponible: e.target.checked})}
                    />
                    <span className="label-text font-medium">Disponible pendant cette période</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix spécial (Fdj)
                  </label>
                  <input
                    type="number"
                    value={disponibiliteForm.prix_special}
                    onChange={(e) => setDisponibiliteForm({...disponibiliteForm, prix_special: e.target.value})}
                    className="input-aroos w-full"
                    placeholder="50000"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-aroos">
                    ➕ Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisponibiliteForm(false)}
                    className="btn-aroos-outline"
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