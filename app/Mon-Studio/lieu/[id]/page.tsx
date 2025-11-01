'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/Toast'
import { 
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  X,
  AlertTriangle,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon
} from 'lucide-react'

export default function EditLieu() {
  const { toast, showToast, hideToast } = useToast()
  const [lieu, setLieu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Images
  const [existingImages, setExistingImages] = useState([])
  const [newMainImage, setNewMainImage] = useState(null)
  const [newOtherImages, setNewOtherImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])
  
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
    is_active: true,
    // Adresse
    adresse_complete: '',
    commune: '',
    region: '',
    quartiers: '',
    pays: 'DJIBOUTI'
  })

  const [typesLieu, setTypesLieu] = useState([])
  const router = useRouter()
  const params = useParams()
  const lieuId = params.id

  useEffect(() => {
    loadData()
  }, [lieuId])

  const loadData = async () => {
    try {
      // Vérifier l'utilisateur
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Charger les types de lieu
      const { data: typesData } = await supabase
        .from('lieu_types')
        .select('*')
        .order('label')
      setTypesLieu(typesData || [])

      // Charger le lieu
      const { data: lieuData, error } = await supabase
        .from('lieux_reception')
        .select(`
          *,
          lieu_types(id, label),
          adresses(*),
          lieu_reception_images(*)
        `)
        .eq('id', lieuId)
        .single()

      if (error) throw error

      // Vérifier que le lieu appartient à l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (lieuData.user_id !== userData.id) {
        router.push('/Mon-Studio')
        return
      }

      setLieu(lieuData)
      setExistingImages(lieuData.lieu_reception_images || [])
      
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
        is_active: lieuData.is_active,
        // Adresse
        adresse_complete: lieuData.adresses?.adresse_complete || '',
        commune: lieuData.adresses?.commune || '',
        region: lieuData.adresses?.region || '',
        quartiers: lieuData.adresses?.quartiers || '',
        pays: lieuData.adresses?.pays || 'DJIBOUTI'
      })

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Erreur lors du chargement', 'error')
      router.push('/Mon-Studio')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)

      // 1. Gérer l'adresse
      let adresseId = lieu.adresse_id

      if (formData.adresse_complete && formData.commune && formData.region) {
        if (adresseId) {
          // Mettre à jour l'adresse existante
          await supabase
            .from('adresses')
            .update({
              adresse_complete: formData.adresse_complete,
              commune: formData.commune,
              region: formData.region,
              quartiers: formData.quartiers || null,
              pays: formData.pays
            })
            .eq('id', adresseId)
        } else {
          // Créer nouvelle adresse
          const { data: newAdresse } = await supabase
            .from('adresses')
            .insert({
              adresse_complete: formData.adresse_complete,
              commune: formData.commune,
              region: formData.region,
              quartiers: formData.quartiers || null,
              pays: formData.pays
            })
            .select()
            .single()
          
          adresseId = newAdresse?.id
        }
      }

      // 2. Mettre à jour le lieu
      const { error } = await supabase
        .from('lieux_reception')
        .update({
          nom_lieu: formData.nom_lieu,
          description: formData.description,
          type_lieu_id: formData.type_lieu_id || null,
          adresse_id: adresseId || null,
          telephone_fixe: formData.telephone_fixe || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          website: formData.website || null,
          capacite_min: formData.capacite_min ? parseInt(formData.capacite_min) : null,
          capacite_max: formData.capacite_max ? parseInt(formData.capacite_max) : null,
          prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
          prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
          prix_par_personne: formData.prix_par_personne ? parseFloat(formData.prix_par_personne) : null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', lieuId)

      if (error) throw error

      showToast('Modifications enregistrées !', 'success')
      await loadData()

    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpdates = async () => {
    try {
      setUploadingImages(true)

      // Supprimer les images marquées
      if (imagesToDelete.length > 0) {
        const filesToDelete = imagesToDelete.map(url => {
          const urlObj = new URL(url)
          return urlObj.pathname.split('/').pop()
        }).filter(Boolean)

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('lieu_reception_images')
            .remove(filesToDelete)
        }

        await supabase
          .from('lieu_reception_images')
          .delete()
          .in('url', imagesToDelete)

        setImagesToDelete([])
      }

      // Upload nouvelle image principale
      if (newMainImage) {
        const fileExt = newMainImage.name.split('.').pop()
        const fileName = `${lieuId}_main_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('lieu_reception_images')
          .upload(fileName, newMainImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('lieu_reception_images')
          .getPublicUrl(fileName)

        await supabase
          .from('lieu_reception_images')
          .insert({
            lieu_reception_id: lieuId,
            url: publicUrl,
            is_main: true
          })

        setNewMainImage(null)
      }

      // Upload autres images
      if (newOtherImages.length > 0) {
        const uploadPromises = newOtherImages.map(async (file, index) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${lieuId}_other_${Date.now()}_${index}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('lieu_reception_images')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('lieu_reception_images')
            .getPublicUrl(fileName)

          return {
            lieu_reception_id: lieuId,
            url: publicUrl,
            is_main: false
          }
        })

        const imagesToInsert = await Promise.all(uploadPromises)
        
        await supabase
          .from('lieu_reception_images')
          .insert(imagesToInsert)

        setNewOtherImages([])
      }

      setUploadingImages(false)
    } catch (error) {
      setUploadingImages(false)
      throw error
    }
  }

  const handleDeleteImage = (imageUrl) => {
    setImagesToDelete([...imagesToDelete, imageUrl])
    setExistingImages(existingImages.filter(img => img.url !== imageUrl))
  }

  const handleUploadMainImage = async () => {
    if (!newMainImage) return
    
    try {
      setUploadingImages(true)

      const fileExt = newMainImage.name.split('.').pop()
      const fileName = `${lieuId}_main_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('lieu_reception_images')
        .upload(fileName, newMainImage)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('lieu_reception_images')
        .getPublicUrl(fileName)

      await supabase
        .from('lieu_reception_images')
        .insert({
          lieu_reception_id: lieuId,
          url: publicUrl,
          is_main: true
        })

      setNewMainImage(null)
      showToast('Image principale ajoutée !', 'success')
      await loadData()
      
    } catch (error: any) {
      showToast(`Erreur upload: ${error.message}`, 'error')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleUploadOtherImages = async () => {
    if (newOtherImages.length === 0) return
    
    try {
      setUploadingImages(true)

      const uploadPromises = newOtherImages.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${lieuId}_other_${Date.now()}_${index}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('lieu_reception_images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('lieu_reception_images')
          .getPublicUrl(fileName)

        return {
          lieu_reception_id: lieuId,
          url: publicUrl,
          is_main: false
        }
      })

      const imagesToInsert = await Promise.all(uploadPromises)
      
      await supabase
        .from('lieu_reception_images')
        .insert(imagesToInsert)

      setNewOtherImages([])
      showToast(`${newOtherImages.length} image(s) ajoutée(s) !`, 'success')
      await loadData()
      
    } catch (error: any) {
      showToast(`Erreur upload: ${error.message}`, 'error')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      // Supprimer les images du storage
      if (lieu.lieu_reception_images && lieu.lieu_reception_images.length > 0) {
        const imageUrls = lieu.lieu_reception_images.map(img => {
          const url = new URL(img.url)
          return url.pathname.split('/').pop()
        })
        
        await supabase.storage
          .from('lieu_reception_images')
          .remove(imageUrls)
      }

      // Supprimer le lieu (les images en BD seront supprimées en cascade)
      const { error } = await supabase
        .from('lieux_reception')
        .delete()
        .eq('id', lieuId)

      if (error) throw error

      router.push('/Mon-Studio?deleted=true')

    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const mainImage = lieu.lieu_reception_images?.find(img => img.is_main)?.url || 
                    lieu.lieu_reception_images?.[0]?.url

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50">
      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Supprimer l'annuaire ?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement cet annuaire ? Cette action est irréversible et toutes les données associées seront perdues.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/Mon-Studio"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au Studio
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-300 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                Modifier l'annuaire
              </h1>
              <p className="text-gray-500 mt-1">{formData.nom_lieu}</p>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-pink-600" />
                Aperçu
              </h3>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={formData.nom_lieu}
                  className="w-full aspect-video object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {formData.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {lieu.lieu_types && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">{lieu.lieu_types.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              
              {/* Section Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                  Gestion des images
                </h3>

                {/* Images existantes */}
                {existingImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Images actuelles</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.url} className="relative group">
                          <img
                            src={img.url}
                            alt="Image lieu"
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          {img.is_main && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                              Principale
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.url)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nouvelle image principale */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajouter une nouvelle image principale
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setNewMainImage(file)
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleUploadMainImage}
                      disabled={!newMainImage || uploadingImages}
                      className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      {uploadingImages ? 'Upload...' : 'Ajouter'}
                    </button>
                  </div>
                  {newMainImage && (
                    <p className="text-sm text-green-600 mt-2">Fichier sélectionné: {newMainImage.name}</p>
                  )}
                </div>

                {/* Autres images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajouter d'autres images
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files
                        if (files) setNewOtherImages(Array.from(files))
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleUploadOtherImages}
                      disabled={newOtherImages.length === 0 || uploadingImages}
                      className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      {uploadingImages ? 'Upload...' : 'Ajouter'}
                    </button>
                  </div>
                  {newOtherImages.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">{newOtherImages.length} fichier(s) sélectionné(s)</p>
                  )}
                </div>
              </div>

              {/* Informations de base */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-pink-600" />
                  Informations de base
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du lieu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nom_lieu}
                      onChange={(e) => setFormData({...formData, nom_lieu: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de lieu
                    </label>
                    <select
                      value={formData.type_lieu_id}
                      onChange={(e) => setFormData({...formData, type_lieu_id: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {typesLieu.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Annuaire actif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section Adresse */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pink-600" />
                  Adresse
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse complète
                    </label>
                    <input
                      type="text"
                      value={formData.adresse_complete}
                      onChange={(e) => setFormData({...formData, adresse_complete: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                      placeholder="Ex: Rue Abdoulkader Waïss"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                        placeholder="Ex: Djibouti"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
                      <input
                        type="text"
                        value={formData.commune}
                        onChange={(e) => setFormData({...formData, commune: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                        placeholder="Ex: Quartier 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quartier</label>
                      <input
                        type="text"
                        value={formData.quartiers}
                        onChange={(e) => setFormData({...formData, quartiers: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                        placeholder="Ex: Haramous"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-pink-600" />
                  Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.telephone_fixe}
                      onChange={(e) => setFormData({...formData, telephone_fixe: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Capacité & Prix */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  Capacité & Tarifs
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité min</label>
                    <input
                      type="number"
                      value={formData.capacite_min}
                      onChange={(e) => setFormData({...formData, capacite_min: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité max</label>
                    <input
                      type="number"
                      value={formData.capacite_max}
                      onChange={(e) => setFormData({...formData, capacite_max: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix min (Fdj)</label>
                    <input
                      type="number"
                      value={formData.prix_min}
                      onChange={(e) => setFormData({...formData, prix_min: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix max (Fdj)</label>
                    <input
                      type="number"
                      value={formData.prix_max}
                      onChange={(e) => setFormData({...formData, prix_max: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix par personne (Fdj)</label>
                    <input
                      type="number"
                      value={formData.prix_par_personne}
                      onChange={(e) => setFormData({...formData, prix_par_personne: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={saving || uploadingImages}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Sauvegarder les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
