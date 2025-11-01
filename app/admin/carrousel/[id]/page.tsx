'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Save, X } from 'lucide-react'
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

export default function EditCarouselPage() {
  const { toast, showToast, hideToast } = useToast()
  const params = useParams()
  const router = useRouter()
  const slideId = parseInt(params.id as string)

  const [slide, setSlide] = useState<CarouselSlide | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    fetchSlide()
  }, [slideId])

  const fetchSlide = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('carrousels')
        .select('*')
        .eq('id', slideId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Slide non trouvé')

      setSlide(data)
      setFormData({
        titre: data.titre,
        description: data.description,
        image: data.image,
        lien_sponsoriser: data.lien_sponsoriser || '',
        position: data.position,
        actif: data.actif
      })
      // Ajouter timestamp pour éviter le cache
      setImagePreview(`${data.image}?t=${Date.now()}`)
    } catch (error: any) {
      console.error('Erreur:', error)
      showToast(`Erreur: ${error.message}`, 'error')
      setTimeout(() => router.push('/admin/carrousel'), 2000)
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
      const { error: uploadError } = await supabase.storage
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
    setSaving(true)

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

      console.log('Mise à jour slide ID:', slideId, 'Data:', slideData)
      
      // Approche simplifiée : Update sans select
      const { error } = await supabase
        .from('carrousels')
        .update(slideData)
        .eq('id', slideId)

      console.log('Réponse mise à jour:', { error })
      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      // Refetch les données pour mettre à jour l'interface
      const { data: updatedData, error: fetchError } = await supabase
        .from('carrousels')
        .select('*')
        .eq('id', slideId)
        .single()

      console.log('Données refetchées:', updatedData)
      if (fetchError || !updatedData) {
        console.error('Erreur refetch:', fetchError)
        // Continuer quand même, la redirection va rafraîchir
      } else {
        // Mettre à jour le state local avec les nouvelles données
        setSlide(updatedData)
        setFormData({
          titre: updatedData.titre,
          description: updatedData.description,
          image: updatedData.image,
          lien_sponsoriser: updatedData.lien_sponsoriser || '',
          position: updatedData.position,
          actif: updatedData.actif
        })
        // Ajouter timestamp pour forcer le rafraîchissement de l'image
        setImagePreview(`${updatedData.image}?t=${Date.now()}`)
        setImageFile(null)
      }

      showToast('Slide mis à jour avec succès!', 'success')
      
      // Rediriger après 1.5s et forcer le rafraîchissement
      setTimeout(() => {
        router.push('/admin/carrousel')
        router.refresh()
      }, 1500)
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    )
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
          href="/admin/carrousel"
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">Modifier le slide</h1>
        <p className="text-gray-600 mt-2">Slide #{slideId}</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Image
            </label>
            <div className="relative">
              {imagePreview && (
                <div className="relative h-64 mb-3 rounded-lg overflow-hidden">
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
            <Link
              href="/admin/carrousel"
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Mettre à jour
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
