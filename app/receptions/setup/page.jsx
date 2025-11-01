'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { compressMultipleImages } from '@/lib/imageCompression';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ReceptionSetup() {
  const { user, userData, loading: authLoading, initialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1: Informations de base
    nom_lieu: '',
    description: '',
    type_lieu_id: '',
    
    // Étape 2: Contact
    telephone_fixe: '',
    whatsapp: '',
    email: '',
    website: '',
    
    // Étape 3: Capacité et tarification
    capacite_min: '',
    capacite_max: '',
    prix_min: '',
    prix_max: '',
    prix_par_personne: '',
    subscription_id: '',
    
    // Étape 4: Localisation
    adresses: [],
    
    // Étape 5: Images
    images: [],
    
    // Étape 6: Disponibilités
    disponibilites: []
  });
  const [typesLieu, setTypesLieu] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [compressingImages, setCompressingImages] = useState(false);
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
  
  const [disponibiliteForm, setDisponibiliteForm] = useState({
    date_debut: '',
    date_fin: '',
    est_disponible: true,
    prix_special: ''
  });

  const steps = [
    { id: 1, title: 'Informations de base', description: 'Nom et description de votre lieu' },
    { id: 2, title: 'Contact', description: 'Vos coordonnées de contact' },
    { id: 3, title: 'Capacité et tarification', description: 'Capacité d\'accueil et prix' },
    { id: 4, title: 'Localisation', description: 'Votre adresse' },
    { id: 5, title: 'Images', description: 'Photos de votre lieu' },
    { id: 6, title: 'Disponibilités', description: 'Vos disponibilités' }
  ];

  useEffect(() => {
    const checkLieu = async () => {
      // Attendre que l'authentification soit initialisée
      if (!initialized) return;
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      if (!userData || !['prestataire', 'admin', 'entreprise'].includes(userData.roles?.name)) {
        router.push('/dashboard');
        return;
      }

      // Vérifier si un lieu existe déjà pour cet utilisateur
      try {
        const { data: existingLieu } = await supabase
          .from('lieux_reception')
          .select('id')
          .eq('user_id', userData.id)
          .single();

        if (existingLieu) {
          router.push('/receptions');
          return;
        }
      } catch (error) {
        // Pas de lieu existant, on peut continuer
        console.log('Aucun lieu existant trouvé, création possible');
      }

      await loadReferenceData();
      setLoading(false);
    };

    checkLieu();
  }, [initialized, user, userData, router]);

  const loadReferenceData = async () => {
    try {
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
      console.error('Erreur lors du chargement des données de référence:', error);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.nom_lieu.trim()) {
          newErrors.nom_lieu = 'Le nom du lieu est obligatoire';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'La description est obligatoire';
        }
        if (!formData.type_lieu_id) {
          newErrors.type_lieu_id = 'Le type de lieu est obligatoire';
        }
        break;
      
      case 2:
        if (!formData.telephone_fixe.trim() && !formData.whatsapp.trim() && !formData.email.trim()) {
          newErrors.contact = 'Au moins un moyen de contact est obligatoire';
        }
        break;
      
      case 3:
        // La capacité est requise pour les lieux
        if (!formData.capacite_min && !formData.capacite_max) {
          newErrors.capacite = 'Veuillez indiquer la capacité d\'accueil';
        }
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
      
      case 6:
        // Les disponibilités sont optionnelles
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

    setIsSubmitting(true);

    try {
      console.log('🚀 Début création lieu de réception');

      // 1) Créer l'adresse principale en premier pour lier via adresse_id à l'insertion du lieu
      let adresseIdToLink = null;
      if (formData.adresses && formData.adresses.length > 0) {
        const firstAddr = formData.adresses[0];
        console.log('📍 Insertion adresse:', firstAddr);
        const { data: insertedAddress, error: insertAddressError } = await supabase
          .from('adresses')
          .insert({
            adresse_complete: firstAddr.adresse_complete || null,
            commune: firstAddr.commune || null,
            region: firstAddr.region || null,
            pays: firstAddr.pays || 'DJIBOUTI',
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

      // 2) Créer le lieu en liant directement adresse_id
      const { data: newLieu, error: lieuError } = await supabase
        .from('lieux_reception')
        .insert({
          user_id: userData.id,
          nom_lieu: formData.nom_lieu,
          description: formData.description,
          type_lieu_id: formData.type_lieu_id || null,
          telephone_fixe: formData.telephone_fixe || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          website: formData.website || null,
          capacite_min: formData.capacite_min ? parseInt(formData.capacite_min) : null,
          capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
          prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
          prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
          prix_par_personne: formData.prix_par_personne ? parseFloat(formData.prix_par_personne) : null,
          subscription_id: formData.subscription_id || null,
          adresse_id: adresseIdToLink
        })
        .select()
        .single();

      if (lieuError) {
        console.error('❌ Erreur insertion lieu:', lieuError);
        alert('Erreur lors de la création du lieu. Veuillez réessayer.');
        throw lieuError;
      }
      console.log('✅ Lieu créé:', newLieu?.id);

      // Ajouter les images
      if (formData.images.length > 0) {
        setUploadingImages(true);
        
        try {
          // Upload direct des images (comme prestataires/setup - sans vérification préalable)
          const allImagePromises = [];
          let globalImageIndex = 0; // Index global pour déterminer la première image comme principale
          
          for (const imgGroup of formData.images) {
            if (imgGroup.files && imgGroup.files.length > 0) {
              // Vérifications comme dans prestataires/setup
              const maxSize = 5 * 1024 * 1024; // 5MB en bytes
              const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
              
              // Vérifier la taille
              const oversizedFiles = Array.from(imgGroup.files).filter(file => file.size > maxSize);
              if (oversizedFiles.length > 0) {
                alert(`Les images suivantes sont trop volumineuses (max 5MB) :\\n${oversizedFiles.map(f => f.name).join('\\n')}`);
                setUploadingImages(false);
                return;
              }
              
              // Vérifier les formats
              const invalidFiles = Array.from(imgGroup.files).filter(file => !allowedTypes.includes(file.type));
              if (invalidFiles.length > 0) {
                alert(`Les formats suivants ne sont pas acceptés :\\n${invalidFiles.map(f => f.name).join('\\n')}\\n\\nFormats acceptés : JPG, PNG, GIF, WebP`);
                setUploadingImages(false);
                return;
              }
              
              // Compresser les images avant upload
              console.log(`🔄 Compression de ${imgGroup.files.length} images...`);
              setCompressingImages(true);
              let filesToUpload;
              
              try {
                // Compresser toutes les images du groupe avec qualité optimale (max 2MB, qualité 85%)
                filesToUpload = await compressMultipleImages(imgGroup.files, 2, 0.85);
                console.log(`✅ Images compressées avec succès`);
              } catch (compressionError) {
                console.warn('⚠️ Erreur de compression, upload des fichiers originaux:', compressionError);
                // En cas d'erreur de compression, utiliser les fichiers originaux
                filesToUpload = Array.from(imgGroup.files);
              } finally {
                setCompressingImages(false);
              }
              
              for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];
                const currentImageIndex = globalImageIndex;
                globalImageIndex++;
                
                allImagePromises.push(
                  (async () => {
                    // Générer un nom de fichier unique
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${newLieu.id}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    
                    console.log(`📤 Upload image ${i + 1}/${filesToUpload.length}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                    
                    // Uploader l'image dans le storage bucket
                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('lieu_reception_images')
                      .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    // Récupérer l'URL publique de l'image
                    const { data: { publicUrl } } = supabase.storage
                      .from('lieu_reception_images')
                      .getPublicUrl(fileName);

                    // Déterminer si c'est l'image principale
                    const isMainImage = (imgGroup.mainImageIndex !== undefined) 
                      ? (i === imgGroup.mainImageIndex) 
                      : (currentImageIndex === 0);

                    return {
                      lieu_reception_id: newLieu.id,
                      url: publicUrl,
                      is_main: isMainImage,
                      type_image: 'autre' // Valeur par défaut selon votre schéma
                    };
                  })()
                );
              }
            }
          }

          console.log(`📤 Upload de ${allImagePromises.length} images...`);
          const imagesToInsert = await Promise.all(allImagePromises);

          if (imagesToInsert.length > 0) {
            console.log('💾 Insertion des métadonnées images en base...');
            const { error: imagesError } = await supabase
              .from('lieu_reception_images')
              .insert(imagesToInsert);

            if (imagesError) {
              console.error('❌ Erreur insertion images:', imagesError);
              throw new Error(`Erreur sauvegarde images: ${imagesError.message}`);
            }
            
            console.log(`✅ ${imagesToInsert.length} images sauvegardées avec succès`);
          }
        } catch (error) {
          console.error('Erreur lors de l\'upload des images:', error);
          alert(`Erreur lors de l'upload des images: ${error.message}`);
        } finally {
          setUploadingImages(false);
        }
      }

      // Ajouter les disponibilités
      if (formData.disponibilites.length > 0) {
        const disponibilitesToInsert = formData.disponibilites.map(dispo => ({
          lieu_reception_id: newLieu.id,
          date_debut: dispo.date_debut,
          date_fin: dispo.date_fin,
          est_disponible: dispo.est_disponible,
          prix_special: dispo.prix_special ? parseFloat(dispo.prix_special) : null
        }));

        const { error: disponibilitesError } = await supabase
          .from('lieu_reception_disponibilites')
          .insert(disponibilitesToInsert);

        if (disponibilitesError) throw disponibilitesError;
      }

      // Rediriger vers la page de gestion
      router.push('/receptions?created=true');

    } catch (error) {
      console.error('Erreur lors de la création du lieu:', error);
      alert('Erreur lors de la création du lieu. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
      setUploadingImages(false);
    }
  };

  const addAddress = () => {
    setFormData({
      ...formData,
      adresses: [...formData.adresses, {
        adresse_complete: '',
        commune: '',
        region: '',
        pays: 'DJIBOUTI'
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
      const files = Array.from(value);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        alert(`Les formats suivants ne sont pas acceptés :\\n${invalidFiles.map(f => f.name).join('\\n')}\\n\\nFormats acceptés : JPG, PNG, GIF, WebP`);
        return;
      }
      
      // On stocke les fichiers originaux, la compression se fera lors de l'upload
      newImages[index].files = files;
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

  const addDisponibilite = () => {
    if (disponibiliteForm.date_debut && disponibiliteForm.date_fin) {
      setFormData({
        ...formData,
        disponibilites: [...formData.disponibilites, { ...disponibiliteForm }]
      });
      setDisponibiliteForm({
        date_debut: '',
        date_fin: '',
        est_disponible: true,
        prix_special: ''
      });
    }
  };

  const removeDisponibilite = (index) => {
    const newDisponibilites = formData.disponibilites.filter((_, i) => i !== index);
    setFormData({ ...formData, disponibilites: newDisponibilites });
  };

  if (authLoading || loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg" 
        text="Chargement de la configuration..." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="header-aroos animate-fade-in-up text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            🏛️ Créer votre lieu de réception
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Remplissez les informations ci-dessous pour créer votre profil de lieu de réception 
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
                  Nom du lieu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_lieu}
                  onChange={(e) => setFormData({...formData, nom_lieu: e.target.value})}
                  className={`input-aroos w-full ${errors.nom_lieu ? 'border-red-500' : ''}`}
                  placeholder="Ex: Villa Paradis"
                />
                {errors.nom_lieu && (
                  <p className="text-red-500 text-sm mt-1">{errors.nom_lieu}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de votre lieu *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`input-aroos w-full ${errors.description ? 'border-red-500' : ''}`}
                  rows="4"
                  placeholder="Décrivez votre lieu, ses caractéristiques, ses particularités..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de lieu *
                </label>
                <select
                  required
                  value={formData.type_lieu_id}
                  onChange={(e) => setFormData({...formData, type_lieu_id: e.target.value})}
                  className={`input-aroos w-full ${errors.type_lieu_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Sélectionner un type de lieu</option>
                  {typesLieu.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type_lieu_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.type_lieu_id}</p>
                )}
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
                    placeholder="contact@villaparadis.dj"
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
                    placeholder="https://www.villaparadis.dj"
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

          {/* Étape 3: Capacité et tarification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                🏛️ Capacité et tarification
              </h2>
              
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
              
              {errors.capacite && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">{errors.capacite}</p>
                </div>
              )}
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
                            value={address.adresse_complete}
                            onChange={(e) => updateAddress(index, 'adresse_complete', e.target.value)}
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
                            placeholder="DJIBOUTI"
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
                  🖼️ Images de votre lieu
                </h2>
                <div className="flex gap-2"> 
                  <button
                    onClick={async () => {
                      console.log('🔍 Lancement du test de diagnostic...');
                      // Import dynamique pour éviter de charger le module systématiquement
                      const { testStoragePermissions } = await import('@/utils/storageTest');
                      const result = await testStoragePermissions();
                      if (result.success) {
                        alert('✅ Test réussi ! Le storage fonctionne correctement. Vérifiez la console pour plus de détails.');
                      } else {
                        alert(`❌ Test échoué: ${result.error}\n\nVérifiez la console pour plus de détails.`);
                      }
                    }}
                    className="btn btn-info btn-sm"
                  >
                    🔍 Test Storage
                  </button>
                  <button
                    onClick={async () => {
                      console.log('🔧 Configuration du bucket...');
                      // Import dynamique
                      const { setupImageBucket } = await import('@/utils/bucketSetup');
                      const result = await setupImageBucket();
                      if (result.success) {
                        if (result.needsRLSSetup) {
                          alert('✅ Bucket créé ! Mais vous devez configurer les politiques RLS dans Supabase. Vérifiez la console pour les instructions SQL.');
                        } else {
                          alert('✅ Bucket configuré avec succès !');
                        }
                      } else {
                        alert(`❌ Erreur de configuration: ${result.error}`);
                      }
                    }}
                    className="btn btn-warning btn-sm"
                  >
                    🔧 Config Bucket
                  </button>
                  <button
                    onClick={addImage}
                    className="btn-aroos-outline"
                  >
                    ➕ Ajouter une image
                  </button>
                </div>
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

          {/* Étape 6: Disponibilités */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  📅 Disponibilités
                </h2>
              </div>
              
              <div className="card-hover p-4">
                <h3 className="font-semibold mb-4">Ajouter une disponibilité</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date début
                    </label>
                    <input
                      type="date"
                      value={disponibiliteForm.date_debut}
                      onChange={(e) => setDisponibiliteForm({...disponibiliteForm, date_debut: e.target.value})}
                      className="input-aroos w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={disponibiliteForm.date_fin}
                      onChange={(e) => setDisponibiliteForm({...disponibiliteForm, date_fin: e.target.value})}
                      className="input-aroos w-full"
                    />
                  </div>
                </div>
                
                <div className="form-control mt-4">
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
                
                <div className="mt-4">
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
                
                <button
                  onClick={addDisponibilite}
                  className="btn-aroos mt-4"
                  disabled={!disponibiliteForm.date_debut || !disponibiliteForm.date_fin}
                >
                  ➕ Ajouter cette disponibilité
                </button>
              </div>
              
              {formData.disponibilites.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Disponibilités ajoutées ({formData.disponibilites.length})</h3>
                  <div className="space-y-2">
                    {formData.disponibilites.map((dispo, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">
                            {new Date(dispo.date_debut).toLocaleDateString('fr-FR')} - {new Date(dispo.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                          <span className={`ml-2 ${dispo.est_disponible ? 'text-green-600' : 'text-red-600'}`}>
                            ({dispo.est_disponible ? 'Disponible' : 'Indisponible'})
                          </span>
                          {dispo.prix_special && (
                            <span className="ml-2">- Prix spécial: {dispo.prix_special} Fdj</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeDisponibilite(index)}
                          className="btn btn-error btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
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
                  disabled={isSubmitting || uploadingImages || compressingImages}
                  className="btn-aroos"
                >
                  {isSubmitting ? (
                    compressingImages ? '🔄 Compression des images...' : 
                    uploadingImages ? '⏳ Upload des images...' : 
                    '⏳ Création...'
                  ) : '✅ Créer mon lieu'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}