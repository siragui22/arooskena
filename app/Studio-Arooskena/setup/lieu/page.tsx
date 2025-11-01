'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Image as ImageIcon,
  DollarSign,
  Check,
  X,
  Plus,
  Trash2,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function StudioLieuSetup() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
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
    
    // Étape 4: Localisation
    adresses: [],
    
    // Étape 5: Images
    main_image: null,
    other_images: []
  })
  const [typesLieu, setTypesLieu] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const router = useRouter()

  // Données de référence pour les adresses
  const regions = [
    { id: 'djibouti', name: 'Djibouti' },
    { id: 'ali_sabieh', name: 'Ali Sabieh' },
    { id: 'dikhil', name: 'Dikhil' },
    { id: 'tadjourah', name: 'Tadjourah' },
    { id: 'obock', name: 'Obock' },
    { id: 'arta', name: 'Arta' }
  ]

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
  }

  const steps = [
    { id: 1, title: 'Informations', description: 'Nom et description', icon: Building2 },
    { id: 2, title: 'Contact', description: 'Coordonnées', icon: Phone },
    { id: 3, title: 'Capacité & Prix', description: 'Tarifs', icon: Users },
    { id: 4, title: 'Localisation', description: 'Adresse', icon: MapPin },
    { id: 5, title: 'Images', description: 'Photos', icon: ImageIcon }
  ]

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in?redirect=/Studio-Arooskena/setup/lieu')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, label)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (!userData || !['entreprise', 'prestataire', 'admin'].includes(userData.roles?.name)) {
        router.push('/dashboard')
        return
      }

      const { data: existingLieu } = await supabase
        .from('lieux_reception')
        .select('id')
        .eq('user_id', userData.id)
        .single()

      if (existingLieu) {
        router.push('/receptions')
        return
      }

      setUser(user)
      setUserData(userData)
      await loadReferenceData()
      setLoading(false)
    }

    checkUser()
  }, [router])

  const loadReferenceData = async () => {
    try {
      console.log('🔍 Chargement des types de lieu...')
      const { data: typesData, error: typesError } = await supabase
        .from('lieu_types')
        .select('*')
        .order('label')

      if (typesError) {
        console.error('❌ Erreur chargement types_lieu:', typesError)
      } else {
        console.log('✅ Types de lieu chargés:', typesData)
        setTypesLieu(typesData || [])
      }


    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de référence:', error)
    }
  }

  const validateStep = (step: number) => {
    const newErrors: any = {}

    switch (step) {
      case 1:
        if (!formData.nom_lieu.trim()) {
          newErrors.nom_lieu = 'Le nom du lieu est obligatoire'
        }
        if (!formData.description.trim()) {
          newErrors.description = 'La description est obligatoire'
        }
        if (!formData.type_lieu_id) {
          newErrors.type_lieu_id = 'Le type de lieu est obligatoire'
        }
        break
      
      case 2:
        if (!formData.telephone_fixe.trim() && !formData.whatsapp.trim() && !formData.email.trim()) {
          newErrors.contact = 'Au moins un moyen de contact est obligatoire'
        }
        break
      
      case 3:
        break
      
      case 4:
        if (!formData.adresses || formData.adresses.length === 0) {
          newErrors.adresses = 'Ajoutez au moins une adresse'
        }
        break
      
      case 5:
        if (!formData.main_image) {
          newErrors.main_image = 'L\'image principale est obligatoire'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    // Validation des images
    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    const allImages = []
    if (formData.main_image) allImages.push(formData.main_image)
    if (formData.other_images.length > 0) allImages.push(...formData.other_images)
    
    const oversizedFiles = allImages.filter((file: File) => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      alert(`Les images suivantes sont trop volumineuses (max 5MB) :\n${oversizedFiles.map((f: File) => f.name).join('\n')}`)
      return
    }
    
    const invalidFiles = allImages.filter((file: File) => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      alert(`Les formats suivants ne sont pas acceptés :\n${invalidFiles.map((f: File) => f.name).join('\n')}\n\nFormats acceptés : JPG, PNG, GIF, WebP`)
      return
    }

    setIsSubmitting(true)

    try {
      console.log('🚀 Début création lieu de réception')

      // Créer l'adresse
      let adresseIdToLink = null
      if (formData.adresses && formData.adresses.length > 0) {
        const firstAddr = formData.adresses[0]
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
          .single()

        if (insertAddressError) {
          console.error('❌ Erreur insertion adresse:', insertAddressError)
          alert('Erreur lors de la création de l\'adresse.')
          throw insertAddressError
        }
        adresseIdToLink = insertedAddress?.id || null
      }

      // Créer le lieu
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
          adresse_id: adresseIdToLink
        })
        .select()
        .single()

      if (lieuError) {
        console.error('❌ Erreur insertion lieu:', lieuError)
        alert('Erreur lors de la création du lieu.')
        throw lieuError
      }

      // Upload des images (OBLIGATOIRE)
      if (allImages.length > 0) {
        setUploadingImages(true)
        console.log('📤 Upload des images...')
        
        try {
          const imagePromises: any[] = []
          
          // Upload image principale
          if (formData.main_image) {
            const fileExt = formData.main_image.name.split('.').pop()
            const fileName = `${newLieu.id}_main_${Date.now()}.${fileExt}`
            
            imagePromises.push(
              (async () => {
                console.log(`📸 Upload image principale: ${fileName}`)
                const { error: uploadError } = await supabase.storage
                  .from('lieu_reception_images')
                  .upload(fileName, formData.main_image)

                if (uploadError) {
                  console.error('❌ Erreur upload image principale:', uploadError)
                  throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                  .from('lieu_reception_images')
                  .getPublicUrl(fileName)

                console.log('✅ Image principale uploadée')
                return {
                  lieu_reception_id: newLieu.id,
                  url: publicUrl,
                  is_main: true
                }
              })()
            )
          }
          
          // Upload autres images
          if (formData.other_images.length > 0) {
            formData.other_images.forEach((file: File, index: number) => {
              const fileExt = file.name.split('.').pop()
              const fileName = `${newLieu.id}_other_${Date.now()}_${index}.${fileExt}`
              
              imagePromises.push(
                (async () => {
                  console.log(`📸 Upload autre image ${index + 1}: ${fileName}`)
                  const { error: uploadError } = await supabase.storage
                    .from('lieu_reception_images')
                    .upload(fileName, file)

                  if (uploadError) {
                    console.error(`❌ Erreur upload image ${index + 1}:`, uploadError)
                    throw uploadError
                  }

                  const { data: { publicUrl } } = supabase.storage
                    .from('lieu_reception_images')
                    .getPublicUrl(fileName)

                  console.log(`✅ Image ${index + 1} uploadée`)
                  return {
                    lieu_reception_id: newLieu.id,
                    url: publicUrl,
                    is_main: false
                  }
                })()
              )
            })
          }

          const imagesToInsert = await Promise.all(imagePromises)
          console.log('✅ Toutes les images uploadées, insertion en BD...')

          if (imagesToInsert.length > 0) {
            const { error: imagesError } = await supabase
              .from('lieu_reception_images')
              .insert(imagesToInsert)

            if (imagesError) {
              console.error('❌ Erreur insertion images en BD:', imagesError)
              throw imagesError
            }
          }
          
          console.log('✅ Images enregistrées en BD')
          setUploadingImages(false)
          
        } catch (uploadError) {
          // ROLLBACK : Supprimer le lieu créé si l'upload échoue
          console.error('❌ Échec upload images, suppression du lieu créé...')
          await supabase
            .from('lieux_reception')
            .delete()
            .eq('id', newLieu.id)
          
          // Supprimer aussi l'adresse si elle existe
          if (adresseIdToLink) {
            await supabase
              .from('adresses')
              .delete()
              .eq('id', adresseIdToLink)
          }
          
          setUploadingImages(false)
          throw new Error('Erreur lors de l\'upload des images. Le lieu n\'a pas été créé.')
        }
      }

      console.log('✅ Lieu créé avec succès')
      router.push('/Mon-Studio?created=true')

    } catch (error: any) {
      console.error('❌ Erreur lors de la création du lieu:', error)
      alert(error.message || 'Erreur lors de la création du lieu.')
    } finally {
      setIsSubmitting(false)
      setUploadingImages(false)
    }
  }

  const addAddress = () => {
    setFormData({
      ...formData,
      adresses: [...formData.adresses, {
        adresse: '',
        commune: '',
        region: '',
        pays: 'Djibouti'
      }]
    })
  }

  const updateAddress = (index: number, field: string, value: string) => {
    const newAddresses = [...formData.adresses]
    newAddresses[index][field] = value
    setFormData({ ...formData, adresses: newAddresses })
  }

  const removeAddress = (index: number) => {
    const newAddresses = formData.adresses.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, adresses: newAddresses })
  }


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header Studio Arooskena */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/Studio-Arooskena/onboarding"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Retour</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-400 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Studio Arooskena</h1>
                  <p className="text-sm text-gray-600">Annuaire Lieu de Réception</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar Moderne */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = currentStep > step.id
              const isActive = currentStep === step.id
              
              return (
                <div key={step.id} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                  {/* Line connector */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      currentStep > step.id ? 'bg-gradient-to-r from-purple-500 to-blue-400' : 'bg-gray-300'
                    }`} style={{ transform: 'translateY(-50%)' }} />
                  )}
                  
                  {/* Step circle */}
                  <div className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-2
                    ${isActive ? 'bg-gradient-to-r from-purple-500 to-blue-400 shadow-lg scale-110' : 
                      isCompleted ? 'bg-gradient-to-r from-purple-500 to-blue-400' : 'bg-white border-2 border-gray-300'}
                  `}>
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="text-center hidden sm:block">
                    <div className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400">{step.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Informations de base</h2>
                  <p className="text-sm text-gray-500">Présentez votre lieu de réception</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du lieu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_lieu}
                  onChange={(e) => setFormData({...formData, nom_lieu: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    errors.nom_lieu ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Salle des Fêtes Paradise"
                />
                {errors.nom_lieu && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errors.nom_lieu}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du lieu <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={5}
                  placeholder="Décrivez votre lieu, son ambiance, ses équipements..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de lieu <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type_lieu_id}
                  onChange={(e) => setFormData({...formData, type_lieu_id: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    errors.type_lieu_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un type de lieu</option>
                  {typesLieu.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label || type.name}
                    </option>
                  ))}
                </select>
                {errors.type_lieu_id && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errors.type_lieu_id}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Étape 2: Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Informations de contact</h2>
                  <p className="text-sm text-gray-500">Comment vous contacter</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone fixe
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telephone_fixe}
                      onChange={(e) => setFormData({...formData, telephone_fixe: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="+253 XX XX XX XX"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="+253 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="contact@lieu.dj"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="https://www.lieu.dj"
                    />
                  </div>
                </div>
              </div>
              
              {errors.contact && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                  <X className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800 text-sm">{errors.contact}</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Capacité et tarification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Capacité & Tarification</h2>
                  <p className="text-sm text-gray-500">Nombre d'invités et tarifs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité minimum (personnes)
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.capacite_min}
                      onChange={(e) => setFormData({...formData, capacite_min: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité maximum (personnes)
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.capacite_max}
                      onChange={(e) => setFormData({...formData, capacite_max: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="300"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix minimum (Fdj)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.prix_min}
                      onChange={(e) => setFormData({...formData, prix_min: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="100000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix maximum (Fdj)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.prix_max}
                      onChange={(e) => setFormData({...formData, prix_max: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="500000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix par personne (Fdj)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.prix_par_personne}
                      onChange={(e) => setFormData({...formData, prix_par_personne: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Localisation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Localisation</h2>
                    <p className="text-sm text-gray-500">Adresse du lieu</p>
                  </div>
                </div>
                <button
                  onClick={addAddress}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>
              
              {formData.adresses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucune adresse ajoutée</p>
                  <button
                    onClick={addAddress}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter l'adresse du lieu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.adresses.map((address: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          Adresse {index + 1}
                        </h3>
                        <button
                          onClick={() => removeAddress(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adresse complète
                          </label>
                          <input
                            type="text"
                            value={address.adresse}
                            onChange={(e) => updateAddress(index, 'adresse', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Avenue de la République, Quartier 7"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.adresses && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                  <X className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800 text-sm">{errors.adresses}</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 5: Images */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Images</h2>
                  <p className="text-sm text-gray-500">Photos de votre lieu</p>
                </div>
              </div>
              
              {/* Image Principale */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Image Principale</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Obligatoire</span>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData({...formData, main_image: file})
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    errors.main_image ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.main_image && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errors.main_image}
                  </p>
                )}
                {!errors.main_image && (
                  <p className="text-xs text-gray-500 mt-2">
                    Cette image sera affichée en premier (Max 5MB)
                  </p>
                )}
                
                {formData.main_image && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Aperçu :</p>
                    <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(formData.main_image)}
                        alt="Image principale"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Principale
                      </div>
                      <button
                        onClick={() => setFormData({...formData, main_image: null})}
                        className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Autres Images */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Autres Images</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Optionnel</span>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      setFormData({...formData, other_images: Array.from(files)})
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Vous pouvez sélectionner plusieurs images (Max 5MB chacune)
                </p>
                
                {formData.other_images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {formData.other_images.length} image(s) sélectionnée(s)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.other_images.map((file: File, index: number) => (
                        <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Autre image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              const newOtherImages = formData.other_images.filter((_: File, i: number) => i !== index)
                              setFormData({...formData, other_images: newOtherImages})
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg transition-all
              ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Précédent</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-400 text-white hover:shadow-lg transition-all"
            >
              <span>Suivant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingImages}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-400 text-white hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting || uploadingImages ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{uploadingImages ? 'Upload images...' : 'Création...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Créer l'annuaire</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
