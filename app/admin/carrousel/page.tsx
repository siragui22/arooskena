'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/Toast'

interface CarouselSlide {
  id: number
  titre: string
  description: string
  image: string
  lien_sponsoriser: string | null
  position: number
  actif: boolean
}

export default function CarrouselAdminPage() {
  const { toast, showToast, hideToast } = useToast()
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    image: '',
    lien_sponsoriser: '',
    position: 0,
    actif: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    fetchSlides()
    
    // Rafraîchir quand la page redevient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSlides()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('carrousels')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      setSlides(data || [])
    } catch (error: any) {
      console.error('Erreur:', error)
      showToast(`Erreur: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadError, data } = await supabase.storage
        .from('carrousels')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage
        .from('carrousels')
        .getPublicUrl(fileName)

      return publicUrl.publicUrl
    } catch (error: any) {
      throw new Error(`Erreur upload: ${error.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = formData.image

      // Upload nouvelle image si sélectionnée
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const slideData = {
        titre: formData.titre,
        description: formData.description,
        image: imageUrl,
        lien_sponsoriser: formData.lien_sponsoriser || null,
        position: parseInt(formData.position as any),
        actif: formData.actif
      }

      if (editingId) {
        // Mise à jour
        console.log('Mise à jour slide ID:', editingId, 'Data:', slideData)
        const { data, error } = await supabase
          .from('carrousels')
          .update(slideData)
          .eq('id', editingId)
          .select()

        console.log('Réponse mise à jour:', { data, error })
        if (error) throw error
        if (!data || data.length === 0) throw new Error('Erreur mise à jour slide')
        showToast('Slide mise à jour avec succès!', 'success')
      } else {
        // Création
        const { data, error } = await supabase
          .from('carrousels')
          .insert([slideData])
          .select()

        if (error) throw error
        if (!data || data.length === 0) throw new Error('Erreur création slide')
        showToast('Slide créé avec succès!', 'success')
      }

      resetForm()
      setShowModal(false)
      await fetchSlides()
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (slide: CarouselSlide) => {
    // Rediriger vers la page d'édition dédiée
    window.location.href = `/admin/carrousel/${slide.id}`
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce slide?')) return

    try {
      const { error } = await supabase
        .from('carrousels')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast('Slide supprimé avec succès!', 'success')
      await fetchSlides()
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error')
    }
  }

  const toggleActive = async (slide: CarouselSlide) => {
    try {
      const newStatus = !slide.actif
      console.log('Toggle actif pour slide ID:', slide.id)
      console.log('Ancien statut:', slide.actif, '→ Nouveau statut:', newStatus)
      
      // Approche 1 : Update sans select
      const { error } = await supabase
        .from('carrousels')
        .update({ actif: newStatus })
        .eq('id', slide.id)

      console.log('Réponse toggle:', { error })
      
      if (error) {
        console.error('Erreur Supabase toggle:', error)
        throw error
      }
      
      const message = newStatus ? 'Slide activé ✓' : 'Slide désactivé ✓'
      showToast(message, 'success')
      
      // Recharger les slides après 500ms pour voir le changement
      setTimeout(() => {
        fetchSlides()
      }, 500)
    } catch (error: any) {
      console.error('Erreur complète:', error)
      showToast(`Erreur: ${error.message}`, 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      image: '',
      lien_sponsoriser: '',
      position: 0,
      actif: true
    })
    setImageFile(null)
    setImagePreview('')
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">Gestion du Carrousel</h1>
        <p className="text-gray-600 mt-2">Gérez les slides publicitaires de la page d&apos;accueil</p>
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          resetForm()
          setShowModal(true)
        }}
        className="mb-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Ajouter un slide
      </button>

      {/* Slides List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-500 text-lg">Aucun slide pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map(slide => (
            <div key={slide.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-40 bg-gray-200">
                <Image
                  src={slide.image}
                  alt={slide.titre}
                  fill
                  className="object-cover"
                />
                {!slide.actif && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">Inactif</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{slide.titre}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{slide.description}</p>

                <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                  <span>Position: {slide.position}</span>
                  <span 
                    suppressHydrationWarning
                    className={slide.actif ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}
                  >
                    {slide.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    suppressHydrationWarning
                    onClick={() => toggleActive(slide)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                  >
                    {slide.actif ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Activer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(slide)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Seulement pour la création */}
      {showModal && !editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Ajouter un slide</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image
                </label>
                <div className="relative">
                  {imagePreview && (
                    <div className="relative h-48 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-pink-300 rounded-lg hover:border-pink-500 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-pink-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {imageFile ? imageFile.name : 'Cliquez pour télécharger'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="Titre du slide"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Description du slide"
                  rows={3}
                  required
                />
              </div>

              {/* Lien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien de redirection
                </label>
                <input
                  type="url"
                  value={formData.lien_sponsoriser}
                  onChange={(e) => setFormData({ ...formData, lien_sponsoriser: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://exemple.com"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="0"
                  required
                />
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-5 h-5 accent-pink-600 rounded"
                />
                <label htmlFor="actif" className="text-sm font-medium text-gray-700">
                  Activer ce slide
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enregistrement...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
