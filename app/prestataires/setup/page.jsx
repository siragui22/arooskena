'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function PrestataireSetup() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1: Informations de base
    nom_entreprise: '',
    description: '',
    categorie_id: '',
    subcategorie_id: '',
    
    // Étape 2: Contact
    telephone_fixe: '',
    whatsapp: '',
    email: '',
    website: '',
    
    // Étape 3: Tarification
    prix_min: '',
    prix_max: '',
    subscription_id: '',
    
    // Étape 4: Localisation
    adresses: [],
    
    // Étape 5: Images
    images: []
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const router = useRouter();

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

  const steps = [
    { id: 1, title: 'Informations de base', description: 'Nom et description de votre entreprise' },
    { id: 2, title: 'Contact', description: 'Vos coordonnées de contact' },
    { id: 3, title: 'Tarification', description: 'Vos tarifs et abonnement' },
    { id: 4, title: 'Localisation', description: 'Vos adresses et lieux' },
    { id: 5, title: 'Images', description: 'Photos de votre entreprise' }
  ];

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

      // Accepter les rôles: entreprise, prestataire, admin
      if (!userData || !['entreprise', 'prestataire', 'admin'].includes(userData.roles?.name)) {
        router.push('/dashboard');
        return;
      }

      // Vérifier si l'annuaire existe déjà
      const { data: existingPrestataire } = await supabase
        .from('prestataires')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (existingPrestataire) {
        router.push('/prestataires');
        return;
      }

      setUser(user);
      setUserData(userData);
      await loadReferenceData();
      setLoading(false);
    };

    checkPrestataire();
  }, [router]);

  const loadReferenceData = async () => {
    try {
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
      console.error('Erreur lors du chargement des données de référence:', error);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.nom_entreprise.trim()) {
          newErrors.nom_entreprise = 'Le nom de l\'entreprise est obligatoire';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'La description est obligatoire';
        }
        if (!formData.categorie_id) {
          newErrors.categorie_id = 'La catégorie est obligatoire';
        }
        break;
      
      case 2:
        if (!formData.telephone_fixe.trim() && !formData.whatsapp.trim() && !formData.email.trim()) {
          newErrors.contact = 'Au moins un moyen de contact est obligatoire';
        }
        break;
      
      case 3:
        // La tarification est optionnelle
        break;
      
      case 4:
        // Localisation requise: au moins une adresse
        if (!formData.adresses || formData.adresses.length === 0) {
          newErrors.adresses = 'Ajoutez au moins une adresse';
        }
        break;
      
      case 5:
        // Les images sont optionnelles
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Vérifier les images avant la soumission
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (let imgGroup of formData.images) {
      if (imgGroup.files && imgGroup.files.length > 0) {
        // Vérifier la taille
        const oversizedFiles = imgGroup.files.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
          alert(`Les images suivantes sont trop volumineuses (max 5MB) :\n${oversizedFiles.map(f => f.name).join('\n')}`);
          return;
        }
        
        // Vérifier les formats
        const invalidFiles = imgGroup.files.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) {
          alert(`Les formats suivants ne sont pas acceptés :\n${invalidFiles.map(f => f.name).join('\n')}\n\nFormats acceptés : JPG, PNG, GIF, WebP`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Début création prestataire');

      // 1) Créer l'adresse principale en premier pour lier via adresse_id à l'insertion du prestataire
      let adresseIdToLink = null;
      if (formData.adresses && formData.adresses.length > 0) {
        const firstAddr = formData.adresses[0];
        console.log('📍 Insertion adresse:', firstAddr);
        const { data: insertedAddress, error: insertAddressError } = await supabase
          .from('adresses')
          .insert({
            adresse_complete: firstAddr.adresse || null,
            commune: firstAddr.commune || null,
            region: firstAddr.region || null,
            pays: firstAddr.pays || 'Djibouti',
            quartiers: firstAddr.quartiers || null
          })
          .select()
          .single();

        if (insertAddressError) {
          console.error('❌ Erreur insertion adresse:', insertAddressError);
          alert('Erreur lors de la création de l\'adresse. Veuillez réessayer.');
          throw insertAddressError;
        }
        adresseIdToLink = insertedAddress?.id || null;
        console.log('✅ Adresse créée, id =', adresseIdToLink);
      }

      // 2) Créer le prestataire en liant directement adresse_id
      const { data: newPrestataire, error: prestataireError } = await supabase
        .from('prestataires')
        .insert({
          user_id: userData.id,
          nom_entreprise: formData.nom_entreprise,
          description: formData.description,
          categorie_id: formData.categorie_id || null,
          subcategorie_id: formData.subcategorie_id || null,
          telephone_fixe: formData.telephone_fixe || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          website: formData.website || null,
          prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
          prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
          subscription_id: formData.subscription_id || null,
          adresse_id: adresseIdToLink
        })
        .select()
        .single();

      if (prestataireError) {
        console.error('❌ Erreur insertion prestataire:', prestataireError);
        alert('Erreur lors de la création du prestataire. Veuillez réessayer.');
        throw prestataireError;
      }
      console.log('✅ Prestataire créé:', newPrestataire?.id);

      // Ajouter les images
      if (formData.images.length > 0) {
        setUploadingImages(true);
        
        const allImagePromises = [];
        
        formData.images.forEach((imgGroup) => {
          if (imgGroup.files && imgGroup.files.length > 0) {
            imgGroup.files.forEach((file, fileIndex) => {
              allImagePromises.push(
                (async () => {
                  // Générer un nom de fichier unique
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${newPrestataire.id}_${Date.now()}_${fileIndex}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                  
                  // Uploader l'image dans le storage bucket
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('prestataires_images')
                    .upload(fileName, file);

                  if (uploadError) throw uploadError;

                  // Récupérer l'URL publique de l'image
                  const { data: { publicUrl } } = supabase.storage
                    .from('prestataires_images')
                    .getPublicUrl(fileName);

                  return {
                    prestataire_id: newPrestataire.id,
                    url: publicUrl,
                    is_main: fileIndex === imgGroup.mainImageIndex
                  };
                })()
              );
            });
          }
        });

        const imagesToInsert = await Promise.all(allImagePromises);

        if (imagesToInsert.length > 0) {
          const { error: imagesError } = await supabase
            .from('prestataire_images')
            .insert(imagesToInsert);

          if (imagesError) throw imagesError;
        }
        
        setUploadingImages(false);
      }

      // Rediriger vers la page de gestion
      router.push('/prestataires?created=true');

    } catch (error) {
      console.error('Erreur lors de la création de l\'annuaire:', error);
      alert('Erreur lors de la création de l\'annuaire. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
      setUploadingImages(false);
    }
  };

  const addAddress = () => {
    setFormData({
      ...formData,
      adresses: [...formData.adresses, {
        adresse: '',
        commune: '',
        region: '',
        pays: 'Djibouti'
      }]
    });
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...formData.adresses];
    newAddresses[index][field] = value;
    setFormData({ ...formData, adresses: newAddresses });
  };

  const removeAddress = (index) => {
    const newAddresses = formData.adresses.filter((_, i) => i !== index);
    setFormData({ ...formData, adresses: newAddresses });
  };

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, {
        files: [],
        mainImageIndex: 0
      }]
    });
  };

  const updateImage = (index, field, value) => {
    const newImages = [...formData.images];
    if (field === 'files') {
      newImages[index].files = Array.from(value);
      newImages[index].mainImageIndex = 0; // Reset main image index
    } else if (field === 'mainImageIndex') {
      newImages[index].mainImageIndex = value;
    }
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
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
        <div className="header-aroos animate-fade-in-up text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            🏢 Créer votre annuaire d'entreprise
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Remplissez les informations ci-dessous pour créer votre profil prestataire 
            et apparaître dans notre annuaire.
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="section-aroos mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-aroosPink border-aroosPink text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-aroosPink' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-aroosPink' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="section-aroos">
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📝 Informations de base
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_entreprise}
                  onChange={(e) => setFormData({...formData, nom_entreprise: e.target.value})}
                  className={`input-aroos w-full ${errors.nom_entreprise ? 'border-red-500' : ''}`}
                  placeholder="Ex: Studio Photo Djibouti"
                />
                {errors.nom_entreprise && (
                  <p className="text-red-500 text-sm mt-1">{errors.nom_entreprise}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de votre entreprise *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`input-aroos w-full ${errors.description ? 'border-red-500' : ''}`}
                  rows="4"
                  placeholder="Décrivez votre entreprise, vos spécialités, votre expérience..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({...formData, categorie_id: e.target.value, subcategorie_id: ''})}
                    className={`input-aroos w-full ${errors.categorie_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.categorie_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.categorie_id}</p>
                  )}
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
            </div>
          )}

          {/* Étape 2: Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📞 Informations de contact
              </h2>
              
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
              </div>
              
              {errors.contact && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">{errors.contact}</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Tarification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                💰 Tarification et abonnement
              </h2>
              
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'abonnement
                </label>
                <select
                  value={formData.subscription_id}
                  onChange={(e) => setFormData({...formData, subscription_id: e.target.value})}
                  className="input-aroos w-full"
                >
                  <option value="">Sélectionner un abonnement (optionnel)</option>
                  {subscriptionTypes.map(subscription => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.name} - {subscription.price} Fdj
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Étape 4: Localisation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  📍 Localisation
                </h2>
                <button
                  onClick={addAddress}
                  className="btn-aroos-outline"
                >
                  ➕ Ajouter une adresse
                </button>
              </div>
              
              {formData.adresses.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">📍</div>
                  <p className="text-gray-600 mb-4">Aucune adresse ajoutée</p>
                  <button
                    onClick={addAddress}
                    className="btn-aroos-outline"
                  >
                    Ajouter votre première adresse
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.adresses.map((address, index) => (
                    <div key={index} className="card-hover p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold">📍 Adresse {index + 1}</h3>
                        <button
                          onClick={() => removeAddress(index)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adresse
                          </label>
                          <input
                            type="text"
                            value={address.adresse}
                            onChange={(e) => updateAddress(index, 'adresse', e.target.value)}
                            className="input-aroos w-full"
                            placeholder="Ex: Rue de la République, Quartier 4"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Région
                            </label>
                            <select
                              value={address.region}
                              onChange={(e) => updateAddress(index, 'region', e.target.value)}
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
                              Commune
                            </label>
                            <select
                              value={address.commune}
                              onChange={(e) => updateAddress(index, 'commune', e.target.value)}
                              className="input-aroos w-full"
                              disabled={!address.region}
                            >
                              <option value="">Sélectionner une commune</option>
                              {address.region && communes[address.region]?.map(commune => (
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
                            value={address.pays}
                            onChange={(e) => updateAddress(index, 'pays', e.target.value)}
                            className="input-aroos w-full"
                            placeholder="Djibouti"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.adresses && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800 text-sm">{errors.adresses}</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 5: Images */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  🖼️ Images de votre entreprise
                </h2>
                <button
                  onClick={addImage}
                  className="btn-aroos-outline"
                >
                  ➕ Ajouter une image
                </button>
              </div>
              
              {formData.images.length === 0 ? (
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon">🖼️</div>
                  <p className="text-gray-600 mb-4">Aucune image ajoutée</p>
                  <button
                    onClick={addImage}
                    className="btn-aroos-outline"
                  >
                    Ajouter votre première image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="card-hover p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold flex items-center">
                          🖼️ Image {index + 1}
                          {image.is_main && (
                            <span className="badge-aroos bg-yellow-500 ml-2">Principale</span>
                          )}
                        </h3>
                        <button
                          onClick={() => removeImage(index)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sélectionner des images
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => updateImage(index, 'files', e.target.files)}
                          className="input-aroos w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formats acceptés : JPG, PNG, GIF, WebP (max 5MB par image)
                        </p>
                      </div>
                      
                      {image.files && image.files.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choisir l'image principale
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {image.files.map((file, fileIndex) => (
                              <div key={fileIndex} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Aperçu ${fileIndex + 1}`}
                                  className={`w-full h-16 object-cover rounded border-2 cursor-pointer ${
                                    fileIndex === image.mainImageIndex 
                                      ? 'border-blue-500' 
                                      : 'border-gray-300'
                                  }`}
                                  onClick={() => updateImage(index, 'mainImageIndex', fileIndex)}
                                />
                                {fileIndex === image.mainImageIndex && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                    Principale
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="btn-aroos-outline"
                >
                  ← Précédent
                </button>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Link href="/dashboard" className="btn-aroos-outline">
                ❌ Annuler
              </Link>
              
              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="btn-aroos"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploadingImages}
                  className="btn-aroos"
                >
                  {isSubmitting ? (uploadingImages ? '⏳ Upload des images...' : '⏳ Création...') : '✅ Créer mon annuaire'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
