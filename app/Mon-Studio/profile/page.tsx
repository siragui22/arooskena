'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Save,
  CheckCircle,
  X
} from 'lucide-react'

export default function MonStudioProfile() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUser(user)

      const { data: userData } = await supabase
        .from('users')
        .select('id, phone, roles(name, label)')
        .eq('auth_user_id', user.id)
        .single()

      if (!userData) {
        throw new Error('Utilisateur non trouvé')
      }
      setUserData(userData)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (!profileData) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: userData.id,
            first_name: '',
            last_name: '',
            slug: `user-${Date.now()}`
          })
          .select()
          .single()
        
        setProfile(newProfile)
        setFormData({ 
          first_name: '', 
          last_name: '', 
          phone: userData.phone || '' 
        })
      } else {
        setProfile(profileData)
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: userData.phone || ''
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide')
        return
      }
      
      setAvatar(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!profile || !userData) return
    
    try {
      setSaving(true)
      
      // Mettre à jour le profil
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (profileError) throw profileError

      // Mettre à jour le téléphone
      const { error: userError } = await supabase
        .from('users')
        .update({
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)

      if (userError) throw userError

      // Gérer l'avatar
      if (avatar) {
        if (profile.avatar) {
          await supabase.storage.from('profil_avatars').remove([profile.avatar])
        }

        const fileName = `${profile.id}-${Date.now()}.${avatar.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage
          .from('profil_avatars')
          .upload(fileName, avatar)

        if (uploadError) throw uploadError

        const { error: avatarUpdateError } = await supabase
          .from('profiles')
          .update({ 
            avatar: fileName,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)

        if (avatarUpdateError) throw avatarUpdateError
      }

      setProfile(updatedProfile)
      setUserData(prev => ({ ...prev, phone: formData.phone }))
      setAvatar(null)
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      alert(`Erreur: ${error.message}`)
    } finally {
      setSaving(false)
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

  const avatarUrl = profile?.avatar 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profil_avatars/${profile.avatar}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">Profil mis à jour avec succès !</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/Mon-Studio"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au Studio
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-orange-300 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            Mon Profil
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          
          {/* Avatar Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-600" />
              Photo de profil
            </label>
            
            <div className="flex items-center gap-6">
              {/* Avatar actuel */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-pink-100">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-pink-400 to-orange-300 flex items-center justify-center text-white text-3xl font-bold">
                      {formData.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                {avatar && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Upload */}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  id="avatar-upload"
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-all cursor-pointer font-medium"
                >
                  <Camera className="w-4 h-4" />
                  Changer la photo
                </label>
                {avatar && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Nouveau fichier: {avatar.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG ou GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="+253 XX XX XX XX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
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
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
